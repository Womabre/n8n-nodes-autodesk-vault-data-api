import type { IDataObject } from 'n8n-workflow';
import { defineBody, type BodyBuilder } from '../definition/body';
import { API_BASE } from './constants';

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

function entriesOf(value: unknown): LifecycleUpdateEntry[] {
	return (value as LifecycleUpdateCollection | null)?.update ?? [];
}

function withComment(body: IDataObject, comment: unknown): IDataObject {
	if (comment) body.comment = comment as string;
	return body;
}

/**
 * Body for `POST /vaults/{vaultId}/{collection}:update-states`.
 *
 * @param collection Entity collection the operation targets
 */
export function lifecycleStatesBody(collection: LifecycleEntityCollection): BodyBuilder {
	return defineBody({
		reads: { vaultId: '', lifecycleStateUpdates: {}, lifecycleComment: '' },
		build(values, fail) {
			const vaultId = String(values.vaultId);
			const updateLifecycleStateRequests = entriesOf(values.lifecycleStateUpdates)
				.filter((entry) => entry.entityId && entry.lifecycleStateId)
				.map((entry) => ({
					entityUrl: entityUrl(vaultId, collection, String(entry.entityId)),
					lifecycleStateUrl: lifecycleStateUrl(vaultId, String(entry.lifecycleStateId)),
				}));

			if (updateLifecycleStateRequests.length === 0) {
				return fail(
					'Add at least one state update that has both an entity ID and a lifecycle state ID',
				);
			}
			return withComment({ updateLifecycleStateRequests }, values.lifecycleComment);
		},
	});
}

/**
 * Body for `POST /vaults/{vaultId}/{collection}:update-lifecycle-definitions`.
 * The API requires both a definition and a state on every entry, and the state
 * has to belong to that definition.
 *
 * @param collection Entity collection the operation targets
 */
export function lifecycleDefinitionsBody(collection: LifecycleEntityCollection): BodyBuilder {
	return defineBody({
		reads: { vaultId: '', lifecycleDefinitionUpdates: {}, lifecycleComment: '' },
		build(values, fail) {
			const vaultId = String(values.vaultId);
			const updateLifecycleDefinitionRequests = entriesOf(values.lifecycleDefinitionUpdates)
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
				return fail(
					'Add at least one definition update that has an entity ID, a lifecycle definition ID and a lifecycle state ID',
				);
			}
			return withComment({ updateLifecycleDefinitionRequests }, values.lifecycleComment);
		},
	});
}
