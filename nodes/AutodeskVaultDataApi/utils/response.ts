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
