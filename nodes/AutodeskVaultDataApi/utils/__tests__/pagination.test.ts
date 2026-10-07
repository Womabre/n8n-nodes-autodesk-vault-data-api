import { describe, it, expect, vi } from 'vitest';
import type {
	DeclarativeRestApiSettings,
	IDataObject,
	IExecutePaginationFunctions,
	IExecuteSingleFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
} from 'n8n-workflow';
import { extractCursor, paginateByCursor } from '../pagination';

const BASE =
	'https://vault.example.com/AutodeskDM/Services/api/vault/v2/vaults/1/folders/1/contents';

function page(ids: number[], nextCursor?: string): IDataObject {
	return {
		pagination: nextCursor
			? { limit: ids.length, nextUrl: `${BASE}?limit=${ids.length}&cursorState=${nextCursor}` }
			: { limit: ids.length },
		results: ids.map((id) => ({ id })),
	};
}

/**
 * Mimics n8n-core's RoutingNode: it runs every postReceive action of the
 * request data against the raw response, which here ends with the
 * `rootProperty: 'results'` step that every Get Many operation uses.
 */
function makeContext(pages: IDataObject[]) {
	const requests: IDataObject[] = [];
	const makeRoutingRequest = vi.fn(
		async (requestData: DeclarativeRestApiSettings.ResultOptions) => {
			requests.push({ ...(requestData.options.qs as IDataObject) });
			const body = pages[requests.length - 1];
			const response: IN8nHttpFullResponse = { body, headers: {}, statusCode: 200 };
			let items: INodeExecutionData[] = [{ json: body }];
			for (const step of requestData.postReceive) {
				for (const action of step.actions) {
					if (typeof action === 'function') {
						items = await action.call({} as IExecuteSingleFunctions, items, response);
					}
				}
			}
			// rootProperty: 'results'
			return (items[0].json.results as IDataObject[]).map((json) => ({ json }));
		},
	);
	return { ctx: { makeRoutingRequest } as unknown as IExecutePaginationFunctions, requests };
}

function requestData(qs: IDataObject = {}): DeclarativeRestApiSettings.ResultOptions {
	return { options: { qs }, preSend: [], postReceive: [], paginate: true };
}

describe('extractCursor', () => {
	it('decodes the cursorState from pagination.nextUrl', () => {
		expect(extractCursor(page([1], '1!PD94bWw%2bDQo'))).toBe('1!PD94bWw+DQo');
	});

	it('returns undefined on the last page', () => {
		expect(extractCursor(page([1]))).toBeUndefined();
	});

	it('returns undefined for non-object bodies', () => {
		expect(extractCursor(undefined)).toBeUndefined();
		expect(extractCursor('text')).toBeUndefined();
	});

	it('ignores a nextUrl without a cursorState', () => {
		expect(extractCursor({ pagination: { nextUrl: `${BASE}?limit=5` } })).toBeUndefined();
	});
});

describe('paginateByCursor', () => {
	it('follows the cursor until the last page and concatenates the results', async () => {
		const { ctx, requests } = makeContext([page([1, 2], 'c1'), page([3, 4], 'c2'), page([5])]);

		const result = await paginateByCursor.call(ctx, requestData({ q: 'bracket' }));

		expect(result.map((i) => i.json.id)).toEqual([1, 2, 3, 4, 5]);
		expect(requests).toEqual([
			{ q: 'bracket' },
			{ q: 'bracket', cursorState: 'c1' },
			{ q: 'bracket', cursorState: 'c2' },
		]);
	});

	it('makes a single request when there is only one page', async () => {
		const { ctx, requests } = makeContext([page([1])]);

		const result = await paginateByCursor.call(ctx, requestData());

		expect(result).toHaveLength(1);
		expect(requests).toHaveLength(1);
	});

	it('stops when the server repeats a cursor instead of looping forever', async () => {
		const { ctx, requests } = makeContext([page([1], 'same'), page([2], 'same'), page([3])]);

		const result = await paginateByCursor.call(ctx, requestData());

		expect(result.map((i) => i.json.id)).toEqual([1, 2]);
		expect(requests).toHaveLength(2);
	});

	it('runs the cursor capture before the operation’s own postReceive actions', async () => {
		const own = vi.fn(async (items: INodeExecutionData[]) => items);
		const data = requestData();
		data.postReceive.push({ data: { parameterValue: undefined }, actions: [own] });
		const { ctx } = makeContext([page([1])]);

		await paginateByCursor.call(ctx, data);

		expect(data.postReceive).toHaveLength(2);
		expect(data.postReceive[1].actions[0]).toBe(own);
		expect(own).toHaveBeenCalledTimes(1);
	});
});
