import { describe, it, expect } from 'vitest';
import type {
	IExecuteSingleFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
} from 'n8n-workflow';
import { handleEmptyResponse, splitResults } from '../response';

const ctx = {} as IExecuteSingleFunctions;

function versionedCtx(typeVersion: number): IExecuteSingleFunctions {
	return {
		getNode: () => ({ name: 'Vault', type: 'autodeskVaultDataApi', typeVersion }),
	} as unknown as IExecuteSingleFunctions;
}

function split(body: unknown, typeVersion: number): Promise<INodeExecutionData[]> {
	const response = { body, headers: {}, statusCode: 200 } as IN8nHttpFullResponse;
	return splitResults.call(versionedCtx(typeVersion), [{ json: body as never }], response);
}

describe('splitResults', () => {
	const body = { pagination: { limit: 100 }, results: [{ id: '1' }, { id: '2' }] };

	it('returns one item per result from node version 1.1', async () => {
		expect(await split(body, 1.1)).toEqual([{ json: { id: '1' } }, { json: { id: '2' } }]);
	});

	it('keeps the wrapper on node version 1, so existing workflows do not change', async () => {
		expect(await split(body, 1)).toEqual([{ json: body }]);
	});

	it('returns no items for an empty result list', async () => {
		expect(await split({ pagination: {}, results: [] }, 1.1)).toEqual([]);
	});

	it('passes a body without a result list through unchanged', async () => {
		const other = { id: '5' };
		expect(await split(other, 1.1)).toEqual([{ json: other }]);
	});
});

function run(body: unknown, statusCode = 200): Promise<INodeExecutionData[]> {
	const response = { body, headers: {}, statusCode } as IN8nHttpFullResponse;
	return handleEmptyResponse.call(ctx, [{ json: body as never }], response);
}

describe('handleEmptyResponse', () => {
	it.each([[''], [undefined], [null], [{}]])(
		'reports success for an empty body (%j)',
		async (body) => {
			expect(await run(body, 204)).toEqual([{ json: { success: true, statusCode: 204 } }]);
		},
	);

	it('passes an object body through unchanged', async () => {
		const body = { id: '5', name: 'Option', value: 'x' };
		expect(await run(body)).toEqual([{ json: body }]);
	});

	it('splits an array body into one item per entry', async () => {
		expect(await run([{ id: 1 }, { id: 2 }])).toEqual([{ json: { id: 1 } }, { json: { id: 2 } }]);
	});

	it('wraps a primitive body so the item is still an object', async () => {
		expect(await run(true)).toEqual([{ json: { response: true } }]);
	});
});
