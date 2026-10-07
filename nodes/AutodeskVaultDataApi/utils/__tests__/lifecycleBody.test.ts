import { describe, it, expect, vi } from 'vitest';
import {
	buildUpdateLifecycleDefinitionsBody,
	buildUpdateLifecycleStatesBody,
} from '../lifecycleBody';
import { IExecuteSingleFunctions, IHttpRequestOptions } from 'n8n-workflow';

function makeCtx(params: Record<string, unknown>): IExecuteSingleFunctions {
	return {
		getNodeParameter: vi.fn((name: string, fallback?: unknown) =>
			name in params ? params[name] : fallback,
		),
		getNode: vi.fn(() => ({ name: 'Vault', type: 'autodeskVaultDataApi', typeVersion: 1 })),
	} as unknown as IExecuteSingleFunctions;
}

function baseOptions(): IHttpRequestOptions {
	return { url: '/items:update-states', method: 'POST' } as IHttpRequestOptions;
}

const V2 = '/AutodeskDM/Services/api/vault/v2';

describe('buildUpdateLifecycleStatesBody', () => {
	it('turns entity and state IDs into the relative URLs the API expects', async () => {
		const ctx = makeCtx({
			vaultId: '9',
			lifecycleComment: 'Item moved to released state.',
			lifecycleStateUpdates: {
				update: [{ entityId: '55', lifecycleStateId: '2' }],
			},
		});

		const result = await buildUpdateLifecycleStatesBody('items').call(ctx, baseOptions());

		expect(result.body).toEqual({
			updateLifecycleStateRequests: [
				{
					entityUrl: `${V2}/vaults/9/items/55`,
					lifecycleStateUrl: `${V2}/vaults/9/lifecycle-states/2`,
				},
			],
			comment: 'Item moved to released state.',
		});
	});

	it('uses the collection segment it was built for', async () => {
		const ctx = makeCtx({
			vaultId: '9',
			lifecycleStateUpdates: { update: [{ entityId: '2', lifecycleStateId: '2' }] },
		});

		const result = await buildUpdateLifecycleStatesBody('folders').call(ctx, baseOptions());
		const [request] = (
			result.body as { updateLifecycleStateRequests: Array<{ entityUrl: string }> }
		).updateLifecycleStateRequests;

		expect(request.entityUrl).toBe(`${V2}/vaults/9/folders/2`);
	});

	it('omits the comment when it is empty', async () => {
		const ctx = makeCtx({
			vaultId: '9',
			lifecycleComment: '',
			lifecycleStateUpdates: { update: [{ entityId: '37', lifecycleStateId: '2' }] },
		});

		const result = await buildUpdateLifecycleStatesBody('files').call(ctx, baseOptions());

		expect(result.body).not.toHaveProperty('comment');
	});

	it('skips rows that are missing an entity or a state', async () => {
		const ctx = makeCtx({
			vaultId: '9',
			lifecycleStateUpdates: {
				update: [
					{ entityId: '55', lifecycleStateId: '2' },
					{ entityId: '', lifecycleStateId: '2' },
					{ entityId: '56', lifecycleStateId: '' },
				],
			},
		});

		const result = await buildUpdateLifecycleStatesBody('items').call(ctx, baseOptions());

		expect(
			(result.body as { updateLifecycleStateRequests: unknown[] }).updateLifecycleStateRequests,
		).toHaveLength(1);
	});

	it('throws when no row is complete', async () => {
		const ctx = makeCtx({ vaultId: '9', lifecycleStateUpdates: { update: [{ entityId: '55' }] } });

		await expect(buildUpdateLifecycleStatesBody('items').call(ctx, baseOptions())).rejects.toThrow(
			/at least one state update/,
		);
	});

	it('throws when the collection is empty', async () => {
		const ctx = makeCtx({ vaultId: '9', lifecycleStateUpdates: {} });

		await expect(buildUpdateLifecycleStatesBody('items').call(ctx, baseOptions())).rejects.toThrow(
			/at least one state update/,
		);
	});
});

describe('buildUpdateLifecycleDefinitionsBody', () => {
	it('sends a definition URL and a state URL on every entry', async () => {
		const ctx = makeCtx({
			vaultId: '9',
			lifecycleComment: 'Moved to the flexible process.',
			lifecycleDefinitionUpdates: {
				update: [{ entityId: '55', lifecycleDefinitionId: '2', lifecycleStateId: '9' }],
			},
		});

		const result = await buildUpdateLifecycleDefinitionsBody('items').call(ctx, baseOptions());

		expect(result.body).toEqual({
			updateLifecycleDefinitionRequests: [
				{
					entityUrl: `${V2}/vaults/9/items/55`,
					lifecycleDefinitionUrl: `${V2}/vaults/9/lifecycle-definitions/2`,
					lifecycleStateUrl: `${V2}/vaults/9/lifecycle-states/9`,
				},
			],
			comment: 'Moved to the flexible process.',
		});
	});

	it('rejects a row that names a definition but no state', async () => {
		const ctx = makeCtx({
			vaultId: '9',
			lifecycleDefinitionUpdates: {
				update: [{ entityId: '55', lifecycleDefinitionId: '2' }],
			},
		});

		await expect(
			buildUpdateLifecycleDefinitionsBody('items').call(ctx, baseOptions()),
		).rejects.toThrow(/at least one definition update/);
	});
});
