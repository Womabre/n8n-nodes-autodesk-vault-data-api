import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { IExecuteSingleFunctions, IN8nHttpFullResponse } from 'n8n-workflow';
import { waitForLmvBubble } from '../file';

const ready = { type: 'folder', children: [{ type: 'geometry', role: '3d' }] };
const pending = { type: 'folder', children: [] };

function response(body: unknown): IN8nHttpFullResponse {
	return { body: JSON.stringify(body), headers: {}, statusCode: 200 };
}

function makeCtx(params: Record<string, unknown>, polls: unknown[]) {
	const httpRequestWithAuthentication = vi.fn(async () => response(polls.shift() ?? pending));
	const ctx = {
		getNodeParameter: vi.fn((name: string, fallback?: unknown) =>
			name in params ? params[name] : fallback,
		),
		getCredentials: vi.fn(async () => ({ vaultServerUrl: 'https://vault.example.com/' })),
		getNode: vi.fn(() => ({ name: 'Vault', type: 'autodeskVaultDataApi', typeVersion: 1 })),
		helpers: { httpRequestWithAuthentication },
	} as unknown as IExecuteSingleFunctions;
	return { ctx, httpRequestWithAuthentication };
}

const baseParams = {
	authentication: 'VaultLogin',
	vaultId: '1',
	fileId: '100201',
	allowSync: false,
	wmSrcItemVerId: '',
	wmSrcFileVerId: '',
};

describe('waitForLmvBubble', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns the first response when it already has renderable geometry', async () => {
		const { ctx, httpRequestWithAuthentication } = makeCtx(baseParams, []);

		const result = await waitForLmvBubble.call(ctx, [], response(ready));

		expect(result).toEqual([{ json: ready }]);
		expect(httpRequestWithAuthentication).not.toHaveBeenCalled();
	});

	it('polls with backoff until the geometry is present', async () => {
		const { ctx, httpRequestWithAuthentication } = makeCtx(baseParams, [pending, ready]);

		const promise = waitForLmvBubble.call(ctx, [], response(pending));
		await vi.advanceTimersByTimeAsync(2000 + 4000);

		await expect(promise).resolves.toEqual([{ json: ready }]);
		expect(httpRequestWithAuthentication).toHaveBeenCalledTimes(2);
		expect(httpRequestWithAuthentication).toHaveBeenCalledWith(
			'autodeskVaultAccountApi',
			expect.objectContaining({
				url: 'https://vault.example.com/AutodeskDM/Services/api/vault/v2/vaults/1/file-versions/100201/svf/bubble.json',
			}),
		);
	});

	it('stops once the maximum wait time is used up', async () => {
		const { ctx, httpRequestWithAuthentication } = makeCtx(
			{ ...baseParams, lmvMaxWaitSeconds: 10 },
			[],
		);

		const promise = waitForLmvBubble.call(ctx, [], response(pending));
		const assertion = expect(promise).rejects.toThrow(
			'bubble.json not ready after 4 attempt(s) over 10 seconds',
		);
		// 2s + 4s + 4s (the last delay is trimmed to fit the 10s budget)
		await vi.advanceTimersByTimeAsync(10_000);

		await assertion;
		expect(httpRequestWithAuthentication).toHaveBeenCalledTimes(3);
	});

	it('checks only once when the maximum wait time is 0', async () => {
		const { ctx, httpRequestWithAuthentication } = makeCtx(
			{ ...baseParams, lmvMaxWaitSeconds: 0 },
			[],
		);

		await expect(waitForLmvBubble.call(ctx, [], response(pending))).rejects.toThrow(
			'after 1 attempt(s) over 0 seconds',
		);
		expect(httpRequestWithAuthentication).not.toHaveBeenCalled();
	});

	it('keeps the previous 10-check budget at the default of 180 seconds', async () => {
		const { ctx, httpRequestWithAuthentication } = makeCtx(baseParams, []);

		const promise = waitForLmvBubble.call(ctx, [], response(pending));
		const assertion = expect(promise).rejects.toThrow('after 10 attempt(s) over 180 seconds');
		await vi.advanceTimersByTimeAsync(180_000);

		await assertion;
		expect(httpRequestWithAuthentication).toHaveBeenCalledTimes(9);
	});
});
