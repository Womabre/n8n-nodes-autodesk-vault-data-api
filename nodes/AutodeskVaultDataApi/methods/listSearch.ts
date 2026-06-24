import { IDataObject, ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';

type SearchResultItem = { name: string; value: string };

/**
 * Maps the configured authentication method to the corresponding credential type.
 */
function getCredentialType(ctx: ILoadOptionsFunctions): string {
  const authentication = (ctx.getCurrentNodeParameter('authentication') as string) || 'VaultLogin';
  return authentication === 'OAuth2' ? 'autodeskVaultDataOAuth2Api' : 'autodeskVaultAccountApi';
}

/**
 * Reads a node parameter that may be a resource locator, returning its plain
 * string value (resource locators are stored as `{ mode, value }`).
 */
function resolveParam(ctx: ILoadOptionsFunctions, name: string): string {
  const value = ctx.getCurrentNodeParameter(name);
  if (value && typeof value === 'object' && 'value' in value) {
    return String((value as { value?: unknown }).value ?? '');
  }
  return value === undefined || value === null ? '' : String(value);
}

/** Performs an authenticated GET against a vault-scoped path and returns the body. */
async function vaultGet(
  ctx: ILoadOptionsFunctions,
  vaultId: string,
  subPath: string,
  qs: IDataObject,
): Promise<IDataObject> {
  const credentialType = getCredentialType(ctx);
  const credentials = await ctx.getCredentials(credentialType);
  const baseUrl = String(credentials.vaultServerUrl).replace(/\/$/, '');
  return (await ctx.helpers.httpRequestWithAuthentication.call(ctx, credentialType, {
    method: 'GET',
    url: `${baseUrl}/AutodeskDM/Services/api/vault/v2/vaults/${vaultId}/${subPath}`,
    qs,
    json: true,
  })) as IDataObject;
}

/** Extracts the next-page cursor from a cursor-based pagination response. */
function extractCursor(response: IDataObject): string | undefined {
  const pagination = response.pagination as IDataObject | undefined;
  const nextUrl = pagination?.nextUrl as string | undefined;
  if (!nextUrl) {
    return undefined;
  }
  const match = nextUrl.match(/[?&]cursorState=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * Resolves a property definition ID by its system name. Entity list responses
 * only carry `propertyDefinitionId` + `value` per property (not the definition),
 * so the ID is needed to read a named property such as Title from the results.
 */
async function findPropertyDefId(
  ctx: ILoadOptionsFunctions,
  vaultId: string,
  systemName: string,
): Promise<string | undefined> {
  try {
    const body = await vaultGet(ctx, vaultId, 'property-definitions', {
      'filter[systemNames]': systemName,
      limit: 50,
    });
    const defs = (body.results as IDataObject[]) ?? [];
    const target = systemName.toLowerCase();
    const def = defs.find((d) => String(d.systemName).toLowerCase() === target) ?? defs[0];
    return def?.id !== undefined && def.id !== null ? String(def.id) : undefined;
  } catch {
    return undefined;
  }
}

/** Reads an entity property value by its property definition ID. */
function findPropertyValueById(entity: IDataObject, defId: string): string | undefined {
  const props = entity.properties as IDataObject[] | undefined;
  if (!Array.isArray(props)) {
    return undefined;
  }
  const match = props.find((prop) => String(prop.propertyDefinitionId) === defId);
  const value = match?.value;
  return value === undefined || value === null || value === '' ? undefined : String(value);
}

/** Appends a title to a base label when present, producing "base - title". */
function withTitle(base: string, title?: unknown): string {
  const titleStr = title === undefined || title === null ? '' : String(title);
  return titleStr ? `${base} - ${titleStr}` : base;
}

interface VaultSearchOptions {
  /** Path after `/vaults/{vaultId}/`, e.g. `file-versions`. */
  subPath: string;
  /** Maps a result entity to an option, or null to skip it. */
  mapItem: (entity: IDataObject) => SearchResultItem | null;
  /** Send the typed filter as the `q` query parameter (server-side search). */
  sendQuery?: boolean;
  /** Additional query-string parameters. */
  extraQs?: IDataObject;
  /** Filter the mapped results by label client-side (for endpoints without `q`). */
  clientFilter?: boolean;
}

/**
 * Shared implementation for vault-scoped resource locator searches: resolves the
 * selected vault and credentials, fetches a page, maps and de-duplicates the
 * results, and returns the next-page cursor.
 */
async function vaultListSearch(
  ctx: ILoadOptionsFunctions,
  options: VaultSearchOptions,
  filter?: string,
  paginationToken?: string,
): Promise<INodeListSearchResult> {
  const vaultId = resolveParam(ctx, 'vaultId');
  if (!vaultId || !options.subPath) {
    return { results: [] };
  }

  const qs: IDataObject = { limit: 200, ...(options.extraQs ?? {}) };
  if (filter && options.sendQuery) {
    qs.q = filter;
  }
  if (paginationToken) {
    qs.cursorState = paginationToken;
  }

  const response = await vaultGet(ctx, vaultId, options.subPath, qs);

  const entities = (response.results as IDataObject[]) ?? [];
  const seen = new Set<string>();
  let results: SearchResultItem[] = [];
  for (const entity of entities) {
    const item = options.mapItem(entity);
    if (item && !seen.has(item.value)) {
      seen.add(item.value);
      results.push(item);
    }
  }

  if (filter && options.clientFilter) {
    const needle = filter.toLowerCase();
    results = results.filter((item) => item.name.toLowerCase().includes(needle));
  }

  return { results, paginationToken: extractCursor(response) };
}

/**
 * Folder search. Lists folders within the selected vault, recursing through
 * subfolders and filtering by name when the user types.
 */
export async function searchFolders(
  this: ILoadOptionsFunctions,
  filter?: string,
  paginationToken?: string,
): Promise<INodeListSearchResult> {
  return vaultListSearch(
    this,
    {
      subPath: 'folders/1/contents',
      sendQuery: true,
      extraQs: {
        'option[includeFolders]': 'true',
        'option[searchSubFolders]': 'true',
      },
      mapItem: (entity) =>
        entity.entityType === 'Folder'
          ? { name: String(entity.fullName || entity.name), value: String(entity.id) }
          : null,
    },
    filter,
    paginationToken,
  );
}

/** File master search: lists latest file versions and uses the file master ID as the value. */
export async function searchFileMasters(
  this: ILoadOptionsFunctions,
  filter?: string,
  paginationToken?: string,
): Promise<INodeListSearchResult> {
  const vaultId = resolveParam(this, 'vaultId');
  if (!vaultId) {
    return { results: [] };
  }

  // The file Title is a property; resolve its definition ID so we can read it
  // from each result's `properties` array (which only carries IDs + values).
  const titleDefId = await findPropertyDefId(this, vaultId, 'Title');

  return vaultListSearch(
    this,
    {
      subPath: 'file-versions',
      sendQuery: true,
      extraQs: {
        'option[latestOnly]': 'true',
        ...(titleDefId ? { 'option[propDefIds]': titleDefId } : {}),
      },
      mapItem: (entity) => {
        const file = entity.file as IDataObject | undefined;
        const masterId = file?.id;
        if (!masterId) {
          return null;
        }
        const title = titleDefId ? findPropertyValueById(entity, titleDefId) : undefined;
        return { name: withTitle(String(entity.name ?? masterId), title), value: String(masterId) };
      },
    },
    filter,
    paginationToken,
  );
}

/** Item master search: lists items and uses the item master ID as the value. */
export async function searchItemMasters(
  this: ILoadOptionsFunctions,
  filter?: string,
  paginationToken?: string,
): Promise<INodeListSearchResult> {
  return vaultListSearch(
    this,
    {
      subPath: 'items',
      // The /items endpoint does not accept a `q` filter, so filter client-side.
      clientFilter: true,
      // extendedModels populates the nested item version (incl. its title field).
      extraQs: { 'option[extendedModels]': 'true' },
      mapItem: (entity) => {
        const itemVersion = entity.itemVersion as IDataObject | undefined;
        const number = itemVersion?.number ?? itemVersion?.name ?? entity.id;
        return {
          name: withTitle(String(number), itemVersion?.title),
          value: String(entity.id),
        };
      },
    },
    filter,
    paginationToken,
  );
}

/**
 * Builds a flat version label, e.g.
 * "bracket.ipt - v3 - Rev(A) - Work in Progress - Mounting Bracket".
 * State and title are appended only when present, with the title last.
 */
function versionLabel(base: string, title: unknown, entity: IDataObject, state: unknown): string {
  const present = (value: unknown) => value !== undefined && value !== null && value !== '';
  let label = `${base} - v${entity.version} - Rev(${entity.revision})`;
  if (present(state)) {
    label += ` - ${state}`;
  }
  if (present(title)) {
    label += ` - ${title}`;
  }
  return label;
}

/**
 * Version search for the File Version field. Lists every file version in the
 * vault (newest first), searchable by name/properties via `q`. The lifecycle
 * state of non-tip versions comes from the "State (Historical)" property
 * (systemName "State(Ver)") and the file Title from the "Title" property.
 */
export async function searchFileVersions(
  this: ILoadOptionsFunctions,
  filter?: string,
  paginationToken?: string,
): Promise<INodeListSearchResult> {
  const vaultId = resolveParam(this, 'vaultId');
  if (!vaultId) {
    return { results: [] };
  }
  const titleDefId = await findPropertyDefId(this, vaultId, 'Title');
  const stateDefId = await findPropertyDefId(this, vaultId, 'State(Ver)');
  const propDefIds = [titleDefId, stateDefId].filter(Boolean).join(',');

  return vaultListSearch(
    this,
    {
      subPath: 'file-versions',
      sendQuery: true,
      extraQs: {
        'option[latestOnly]': 'false',
        ...(propDefIds ? { 'option[propDefIds]': propDefIds } : {}),
      },
      mapItem: (entity) => {
        const title = titleDefId ? findPropertyValueById(entity, titleDefId) : undefined;
        const state =
          (stateDefId ? findPropertyValueById(entity, stateDefId) : undefined) ?? entity.state;
        return {
          name: versionLabel(String(entity.name ?? entity.id), title, entity, state),
          value: String(entity.id),
        };
      },
    },
    filter,
    paginationToken,
  );
}

/**
 * Version search for the Item Version field. Lists every item version in the
 * vault, searchable by `q`. Number and title are first-class on the item
 * version; the lifecycle state of non-tip versions comes from the "State
 * (Historical)" property (systemName "State(Ver)").
 */
export async function searchItemVersions(
  this: ILoadOptionsFunctions,
  filter?: string,
  paginationToken?: string,
): Promise<INodeListSearchResult> {
  const vaultId = resolveParam(this, 'vaultId');
  if (!vaultId) {
    return { results: [] };
  }
  const stateDefId = await findPropertyDefId(this, vaultId, 'State(Ver)');

  return vaultListSearch(
    this,
    {
      subPath: 'item-versions',
      sendQuery: true,
      extraQs: {
        'option[latestOnly]': 'false',
        // Include non-released (work-in-progress) versions, not just consumable ones.
        'option[releasedItemsOnly]': 'false',
        ...(stateDefId ? { 'option[propDefIds]': stateDefId } : {}),
      },
      mapItem: (entity) => {
        const base = String(entity.number ?? entity.name ?? entity.id);
        const state =
          (stateDefId ? findPropertyValueById(entity, stateDefId) : undefined) ?? entity.state;
        return {
          name: versionLabel(base, entity.title, entity, state),
          value: String(entity.id),
        };
      },
    },
    filter,
    paginationToken,
  );
}

/** Markup search for the currently selected file version. */
export async function searchMarkups(
  this: ILoadOptionsFunctions,
  filter?: string,
  paginationToken?: string,
): Promise<INodeListSearchResult> {
  const fileId = resolveParam(this, 'fileId');
  if (!fileId) {
    return { results: [] };
  }
  return vaultListSearch(
    this,
    {
      subPath: `file-versions/${fileId}/markups`,
      // The markups endpoint does not accept a `q` filter, so filter client-side.
      clientFilter: true,
      mapItem: (entity) => ({
        name: entity.createdByUser
          ? `Markup ${entity.id} (by ${entity.createdByUser})`
          : `Markup ${entity.id}`,
        value: String(entity.id),
      }),
    },
    filter,
    paginationToken,
  );
}
