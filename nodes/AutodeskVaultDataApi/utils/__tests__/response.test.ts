import { describe, it, expect } from 'vitest';
import type { IExecuteSingleFunctions, IN8nHttpFullResponse, INodeExecutionData } from 'n8n-workflow';
import { handleEmptyResponse } from '../response';

const ctx = {} as IExecuteSingleFunctions;

function run(body: unknown, statusCode = 200): Promise<INodeExecutionData[]> {
	const response = { body, headers: {}, statusCode } as IN8nHttpFullResponse;
	return handleEmptyResponse.call(ctx, [{ json: body as never }], response);
}

describe('handleEmptyResponse', () => {
	it.each([[''], [undefined], [null], [{}]])('reports success for an empty body (%j)', async (body) => {
		expect(await run(body, 204)).toEqual([{ json: { success: true, statusCode: 204 } }]);
	});

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
