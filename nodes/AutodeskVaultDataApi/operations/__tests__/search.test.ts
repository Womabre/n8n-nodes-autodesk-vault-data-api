import { describe, it, expect, vi } from 'vitest';
import { formatFolderUrls, formatPropertyDefinitionUrls } from '../search';
import { IExecuteSingleFunctions, IHttpRequestOptions } from 'n8n-workflow';

function makeCtx(params: Record<string, unknown>): IExecuteSingleFunctions {
  return {
    getNodeParameter: vi.fn((name: string) => params[name]),
  } as unknown as IExecuteSingleFunctions;
}

function baseOptions(body?: Record<string, unknown>): IHttpRequestOptions {
  return { url: '/test', method: 'POST', body: body ?? {} } as IHttpRequestOptions;
}

// ── formatFolderUrls ─────────────────────────────────────────────────────────

describe('formatFolderUrls', () => {
  it('converts folder IDs to full API URLs', async () => {
    const ctx = makeCtx({ vaultId: '42', foldersToSearch: ['1', '2', '3'] });
    const result = await formatFolderUrls.call(ctx, baseOptions());

    expect((result.body as Record<string, unknown>).foldersToSearch).toEqual([
      '/AutodeskDM/Services/api/vault/v2/vaults/42/folders/1',
      '/AutodeskDM/Services/api/vault/v2/vaults/42/folders/2',
      '/AutodeskDM/Services/api/vault/v2/vaults/42/folders/3',
    ]);
  });

  it('sets foldersToSearch to empty array when no folders are provided', async () => {
    const ctx = makeCtx({ vaultId: '42', foldersToSearch: [] });
    const result = await formatFolderUrls.call(ctx, baseOptions());

    expect((result.body as Record<string, unknown>).foldersToSearch).toEqual([]);
  });

  it('initialises body when it is undefined', async () => {
    const ctx = makeCtx({ vaultId: '5', foldersToSearch: ['10'] });
    const opts = { url: '/test', method: 'POST' } as IHttpRequestOptions;
    const result = await formatFolderUrls.call(ctx, opts);

    expect((result.body as Record<string, unknown>).foldersToSearch).toEqual([
      '/AutodeskDM/Services/api/vault/v2/vaults/5/folders/10',
    ]);
  });

  it('preserves existing body properties', async () => {
    const ctx = makeCtx({ vaultId: '1', foldersToSearch: ['99'] });
    const opts = baseOptions({ entityTypesToSearch: ['File'] });
    const result = await formatFolderUrls.call(ctx, opts);
    const body = result.body as Record<string, unknown>;

    expect(body.entityTypesToSearch).toEqual(['File']);
    expect(body.foldersToSearch).toHaveLength(1);
  });
});

// ── formatPropertyDefinitionUrls ─────────────────────────────────────────────

describe('formatPropertyDefinitionUrls', () => {
  it('converts bare property definition IDs to full URLs in searchCriteria', async () => {
    const ctx = makeCtx({
      vaultId: '10',
      searchCriteria: {
        criteria: [{ propertyDefinitionUrl: '55', operator: 'Contains', searchString: 'abc' }],
      },
      sortCriteria: { criteria: [] },
    });

    const result = await formatPropertyDefinitionUrls.call(ctx, baseOptions());
    const body = result.body as Record<string, unknown>;
    const criteria = body.searchCriteria as Array<Record<string, unknown>>;

    expect(criteria[0].propertyDefinitionUrl).toBe(
      '/AutodeskDM/Services/api/vault/v2/vaults/10/property-definitions/55',
    );
  });

  it('does not double-prefix already-full URLs in searchCriteria', async () => {
    const fullUrl = '/AutodeskDM/Services/api/vault/v2/vaults/10/property-definitions/55';
    const ctx = makeCtx({
      vaultId: '10',
      searchCriteria: { criteria: [{ propertyDefinitionUrl: fullUrl }] },
      sortCriteria: { criteria: [] },
    });

    const result = await formatPropertyDefinitionUrls.call(ctx, baseOptions());
    const body = result.body as Record<string, unknown>;
    const criteria = body.searchCriteria as Array<Record<string, unknown>>;

    expect(criteria[0].propertyDefinitionUrl).toBe(fullUrl);
  });

  it('converts bare property definition IDs to full URLs in sortCriteria', async () => {
    const ctx = makeCtx({
      vaultId: '7',
      searchCriteria: { criteria: [] },
      sortCriteria: { criteria: [{ propertyDefinitionUrl: '12', ascending: true }] },
    });

    const result = await formatPropertyDefinitionUrls.call(ctx, baseOptions());
    const body = result.body as Record<string, unknown>;
    const sortCriteria = body.sortCriteria as Array<Record<string, unknown>>;

    expect(sortCriteria[0].propertyDefinitionUrl).toBe(
      '/AutodeskDM/Services/api/vault/v2/vaults/7/property-definitions/12',
    );
  });

  it('handles missing criteria arrays gracefully', async () => {
    const ctx = makeCtx({
      vaultId: '1',
      searchCriteria: {},
      sortCriteria: {},
    });

    const result = await formatPropertyDefinitionUrls.call(ctx, baseOptions());
    const body = result.body as Record<string, unknown>;

    expect(body.searchCriteria).toBeUndefined();
    expect(body.sortCriteria).toBeUndefined();
  });
});
