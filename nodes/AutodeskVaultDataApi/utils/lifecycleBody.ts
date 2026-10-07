import { IExecuteSingleFunctions, IHttpRequestOptions, NodeOperationError } from 'n8n-workflow';
import { API_BASE } from './constants';

/** Base path shared by every Vault Data API v2 route. */

/** Collection segment of the entity a lifecycle change applies to. */
export type LifecycleEntityCollection = 'files' | 'folders' | 'items';

interface LifecycleUpdateEntry {
	entityId?: string;
	lifecycleStateId?: string;
	lifecycleDefinitionId?: string;
}

interface LifecycleUpdateCollection {
	update?: LifecycleUpdateEntry[];
}

/**
 * The `:update-states` and `:update-lifecycle-definitions` endpoints identify
 * entities, states and definitions by relative URL rather than by bare ID, so
 * the node collects IDs in the UI and assembles the URLs here.
 */
function entityUrl(
	vaultId: string,
	collection: LifecycleEntityCollection,
	entityId: string,
): string {
	return `${API_BASE}/vaults/${vaultId}/${collection}/${entityId}`;
}

function lifecycleStateUrl(vaultId: string, lifecycleStateId: string): string {
	return `${API_BASE}/vaults/${vaultId}/lifecycle-states/${lifecycleStateId}`;
}

function lifecycleDefinitionUrl(vaultId: string, lifecycleDefinitionId: string): string {
	return `${API_BASE}/vaults/${vaultId}/lifecycle-definitions/${lifecycleDefinitionId}`;
}

function readEntries(ctx: IExecuteSingleFunctions, parameterName: string): LifecycleUpdateEntry[] {
	const collection = ctx.getNodeParameter(parameterName, {}) as LifecycleUpdateCollection | null;
	return collection?.update ?? [];
}

function readComment(ctx: IExecuteSingleFunctions): string {
	return (ctx.getNodeParameter('lifecycleComment', '') as string) ?? '';
}

/**
 * Builds the body for `POST /vaults/{vaultId}/{collection}:update-states`.
 *
 * @param collection Entity collection the operation targets
 */
export function buildUpdateLifecycleStatesBody(collection: LifecycleEntityCollection) {
	return async function (
		this: IExecuteSingleFunctions,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		const vaultId = String(this.getNodeParameter('vaultId', ''));

		const updateLifecycleStateRequests = readEntries(this, 'lifecycleStateUpdates')
			.filter((entry) => entry.entityId && entry.lifecycleStateId)
			.map((entry) => ({
				entityUrl: entityUrl(vaultId, collection, String(entry.entityId)),
				lifecycleStateUrl: lifecycleStateUrl(vaultId, String(entry.lifecycleStateId)),
			}));

		if (updateLifecycleStateRequests.length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				'Add at least one state update that has both an entity ID and a lifecycle state ID',
			);
		}

		const body: Record<string, unknown> = { updateLifecycleStateRequests };
		const comment = readComment(this);
		if (comment) body.comment = comment;

		requestOptions.body = body;
		return requestOptions;
	};
}

/**
 * Builds the body for
 * `POST /vaults/{vaultId}/{collection}:update-lifecycle-definitions`. The API
 * requires both a definition and a state on every entry, and the state has to
 * belong to that definition.
 *
 * @param collection Entity collection the operation targets
 */
export function buildUpdateLifecycleDefinitionsBody(collection: LifecycleEntityCollection) {
	return async function (
		this: IExecuteSingleFunctions,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		const vaultId = String(this.getNodeParameter('vaultId', ''));

		const updateLifecycleDefinitionRequests = readEntries(this, 'lifecycleDefinitionUpdates')
			.filter((entry) => entry.entityId && entry.lifecycleDefinitionId && entry.lifecycleStateId)
			.map((entry) => ({
				entityUrl: entityUrl(vaultId, collection, String(entry.entityId)),
				lifecycleDefinitionUrl: lifecycleDefinitionUrl(
					vaultId,
					String(entry.lifecycleDefinitionId),
				),
				lifecycleStateUrl: lifecycleStateUrl(vaultId, String(entry.lifecycleStateId)),
			}));

		if (updateLifecycleDefinitionRequests.length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				'Add at least one definition update that has an entity ID, a lifecycle definition ID and a lifecycle state ID',
			);
		}

		const body: Record<string, unknown> = { updateLifecycleDefinitionRequests };
		const comment = readComment(this);
		if (comment) body.comment = comment;

		requestOptions.body = body;
		return requestOptions;
	};
}
