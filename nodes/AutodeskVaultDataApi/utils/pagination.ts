import type {
	DeclarativeRestApiSettings,
	IDataObject,
	IExecutePaginationFunctions,
	IExecuteSingleFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
} from 'n8n-workflow';

/**
 * Hard stop for "Return All" so a server that keeps handing out cursors can
 * never loop forever. At the server's maximum page size (1000) this still
 * allows a million results.
 */
const MAX_PAGES = 1000;

/**
 * Extracts the next-page cursor from a Vault collection response. The cursor
 * is only exposed inside `pagination.nextUrl`, e.g.
 * `.../folders/1/contents?limit=20&cursorState=1!PD94...`.
 */
export function extractCursor(body: unknown): string | undefined {
	if (!body || typeof body !== 'object') {
		return undefined;
	}
	const pagination = (body as IDataObject).pagination as IDataObject | undefined;
	const nextUrl = pagination?.nextUrl;
	if (typeof nextUrl !== 'string' || !nextUrl) {
		return undefined;
	}
	const match = nextUrl.match(/[?&]cursorState=([^&#]+)/);
	return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * Declarative pagination handler for every cursor-paginated "Get Many"
 * operation, wired up through the shared "Return All" parameter.
 *
 * `makeRoutingRequest` runs the operation's postReceive actions (typically
 * `rootProperty: 'results'`) before returning, which discards the sibling
 * `pagination` object holding the cursor. To keep it, a capture action is put
 * in front of the operation's own postReceive actions: it reads the cursor
 * from the raw response and passes the items through untouched.
 */
export async function paginateByCursor(
	this: IExecutePaginationFunctions,
	requestData: DeclarativeRestApiSettings.ResultOptions,
): Promise<INodeExecutionData[]> {
	let cursor: string | undefined;

	requestData.postReceive.unshift({
		data: { parameterValue: undefined },
		actions: [
			async function (
				this: IExecuteSingleFunctions,
				items: INodeExecutionData[],
				response: IN8nHttpFullResponse,
			): Promise<INodeExecutionData[]> {
				cursor = extractCursor(response.body);
				return items;
			},
		],
	});

	const results: INodeExecutionData[] = [];
	const seenCursors = new Set<string>();
	let currentCursor: string | undefined;

	for (let page = 0; page < MAX_PAGES; page++) {
		const qs: IDataObject = { ...(requestData.options.qs as IDataObject | undefined) };
		if (currentCursor) {
			qs.cursorState = currentCursor;
		} else {
			delete qs.cursorState;
		}

		cursor = undefined;
		const items = await this.makeRoutingRequest({
			...requestData,
			options: { ...requestData.options, qs },
		});
		results.push(...items);

		// Stop on the last page, and on a repeated cursor rather than looping.
		if (!cursor || seenCursors.has(cursor)) {
			break;
		}
		seenCursors.add(cursor);
		currentCursor = cursor;
	}

	return results;
}
