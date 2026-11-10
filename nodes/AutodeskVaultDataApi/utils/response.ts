import type {
	IDataObject,
	IExecuteSingleFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
} from 'n8n-workflow';

function isEmptyBody(body: unknown): boolean {
	if (body === undefined || body === null || body === '') {
		return true;
	}
	return (
		typeof body === 'object' &&
		!Array.isArray(body) &&
		!Buffer.isBuffer(body) &&
		Object.keys(body as IDataObject).length === 0
	);
}

/** Node version from which `splitResults` returns one item per result. */
const SPLIT_RESULTS_SINCE_VERSION = 1.1;

/**
 * postReceive action for collection operations that node version 1 returned as
 * the raw `{ pagination, results }` wrapper in a single item.
 *
 * From node version 1.1 every entry of `results` becomes its own item, the
 * same shape every other "Get Many" operation has. Nodes still on version 1
 * keep the wrapper, so workflows built on it do not change.
 */
export async function splitResults(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	if (this.getNode().typeVersion < SPLIT_RESULTS_SINCE_VERSION) {
		return items;
	}
	const body = response.body as IDataObject | undefined;
	const results = body && typeof body === 'object' ? body.results : undefined;
	if (!Array.isArray(results)) {
		return items;
	}
	return (results as IDataObject[]).map((json) => ({ json }));
}

/**
 * postReceive action for operations whose response body may be empty, such as
 * DELETE (204) or a POST the server acknowledges without content.
 *
 * Only an empty body is replaced, by `{ success: true, statusCode }`, so the
 * item is never blank. A body with data comes through unchanged, in the same
 * shape as every other operation; an array body becomes one item per entry.
 */
export async function handleEmptyResponse(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const { body, statusCode } = response;
	if (isEmptyBody(body)) {
		return [{ json: { success: true, statusCode } }];
	}
	if (Array.isArray(body)) {
		return (body as IDataObject[]).map((json) => ({ json }));
	}
	if (typeof body !== 'object') {
		return [{ json: { response: body as string | number | boolean } }];
	}
	return items;
}
