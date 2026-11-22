import { describe, expect, it, vi } from 'vitest';
import {
	NodeOperationError,
	type IExecuteSingleFunctions,
	type IHttpRequestOptions,
} from 'n8n-workflow';
import { bodyPreSend, defineBody } from '../body';

function makeCtx(params: Record<string, unknown>) {
	const getNodeParameter = vi.fn((name: string, ...fallback: unknown[]) => {
		if (name in params) return params[name];
		// Like n8n: a read without a fallback fails when the field is not set.
		if (fallback.length === 0) throw new Error(`Could not get parameter "${name}"`);
		return fallback[0];
	});
	const ctx = {
		getNodeParameter,
		getNode: vi.fn(() => ({ name: 'Vault', type: 'autodeskVaultDataApi', typeVersion: 1 })),
	} as unknown as IExecuteSingleFunctions;
	return { ctx, getNodeParameter };
}

const options = (body?: unknown) =>
	({ url: '/x', method: 'POST', ...(body === undefined ? {} : { body }) }) as IHttpRequestOptions;

describe('bodyPreSend', () => {
	const builder = defineBody({
		reads: { required: undefined, optional: 'fallback' },
		build: (values) => ({ required: values.required, optional: values.optional }),
	});

	it('reads a field without a fallback as required and the others with theirs', async () => {
		const { ctx, getNodeParameter } = makeCtx({ required: 'r' });
		const result = await bodyPreSend(builder).call(ctx, options());
		expect(getNodeParameter.mock.calls).toEqual([['required'], ['optional', 'fallback']]);
		expect(result.body).toEqual({ required: 'r', optional: 'fallback' });
	});

	it('fails like n8n when a required field is not set', async () => {
		const { ctx } = makeCtx({});
		await expect(bodyPreSend(builder).call(ctx, options())).rejects.toThrow(/"required"/);
	});

	it('merges an object into the body the request map built', async () => {
		const { ctx } = makeCtx({ required: 'r' });
		const result = await bodyPreSend(builder).call(ctx, options({ kept: 1, optional: 'map' }));
		expect(result.body).toEqual({ kept: 1, required: 'r', optional: 'fallback' });
	});

	it('sends an array as the whole body', async () => {
		const list = defineBody({ reads: {}, build: () => [{ a: 1 }] });
		const { ctx } = makeCtx({});
		const result = await bodyPreSend(list).call(ctx, options({ dropped: true }));
		expect(result.body).toEqual([{ a: 1 }]);
	});

	it('turns fail into a node error with the message', async () => {
		const failing = defineBody({ reads: {}, build: (_values, fail) => fail('Enter something') });
		const { ctx } = makeCtx({});
		const run = bodyPreSend(failing).call(ctx, options());
		await expect(run).rejects.toBeInstanceOf(NodeOperationError);
		await expect(bodyPreSend(failing).call(ctx, options())).rejects.toThrow('Enter something');
	});
});
