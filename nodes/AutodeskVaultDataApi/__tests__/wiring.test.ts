import { describe, expect, it } from 'vitest';
import type { INodeProperties, INodePropertyOptions, INodePropertyRouting } from 'n8n-workflow';
import { AutodeskVaultDataApi } from '../AutodeskVaultDataApi.node';
import { splitResults } from '../utils/response';

/**
 * Checks on the declarative wiring itself: which parameters an operation's
 * request refers to, and which parameters the UI shows for that operation.
 * The unit tests next to each helper do not see mistakes of this kind.
 */

interface Operation {
	resource: string;
	value: string;
	routing: INodePropertyRouting | undefined;
}

const description = new AutodeskVaultDataApi().description;
const properties = description.properties;

const operations: Operation[] = properties
	.filter((property) => property.name === 'operation')
	.flatMap((property) => {
		const resource = String(property.displayOptions?.show?.resource?.[0]);
		return (property.options as INodePropertyOptions[]).map((option) => ({
			resource,
			value: String(option.value),
			routing: option.routing,
		}));
	});

const parameters = properties.filter(
	(property) => !['authentication', 'resource', 'operation'].includes(property.name),
);

function operation(resource: string, value: string): Operation {
	const found = operations.find((op) => op.resource === resource && op.value === value);
	if (!found) throw new Error(`Operation ${resource}/${value} does not exist`);
	return found;
}

function isShownFor(parameter: INodeProperties, op: Operation): boolean {
	const show = parameter.displayOptions?.show ?? {};
	const resources = show.resource as string[] | undefined;
	const ops = show.operation as string[] | undefined;
	return (!resources || resources.includes(op.resource)) && (!ops || ops.includes(op.value));
}

function shownParameters(op: Operation, name: string): INodeProperties[] {
	return parameters.filter((parameter) => parameter.name === name && isShownFor(parameter, op));
}

/** Names of every `$parameter["..."]` the operation's routing refers to. */
function referencedParameters(op: Operation): string[] {
	const text = JSON.stringify(op.routing ?? {});
	const names = [...text.matchAll(/\$parameter\[\\"([^"\\]+)\\"\]/g)].map((match) => match[1]);
	return [...new Set(names)];
}

describe('operation wiring', () => {
	it('finds the operations and parameters of the node', () => {
		expect(operations.length).toBeGreaterThan(80);
		expect(parameters.length).toBeGreaterThan(80);
	});

	it('only refers to parameters that are shown for that operation', () => {
		const missing: string[] = [];
		for (const op of operations) {
			for (const name of referencedParameters(op)) {
				if (shownParameters(op, name).length === 0) {
					missing.push(`${op.resource}/${op.value} -> ${name}`);
				}
			}
		}
		expect(missing).toEqual([]);
	});

	it('shows each parameter at most once per operation', () => {
		const duplicates: string[] = [];
		for (const op of operations) {
			const names = parameters
				.filter((parameter) => isShownFor(parameter, op))
				.map((parameter) => parameter.name);
			for (const name of new Set(names)) {
				if (names.filter((candidate) => candidate === name).length > 1) {
					duplicates.push(`${op.resource}/${op.value} -> ${name}`);
				}
			}
		}
		expect(duplicates).toEqual([]);
	});
});

describe('node version', () => {
	it('offers versions 1 and 1.1 and gives new nodes 1.1', () => {
		expect(description.version).toEqual([1, 1.1]);
		expect(description.defaultVersion).toBe(1.1);
	});
});

describe('change order comment attachments', () => {
	const op = operation('changeOrders', 'getChangeOrderCommentAttachments');

	it('builds the path from the comment ID, not the change order ID', () => {
		expect(op.routing?.request?.url).toContain(
			'/change-order-comments/{{$parameter["changeOrderCommentId"]}}/attachments',
		);
	});

	it('loads the comment list from the selected change order', () => {
		const [comment] = shownParameters(op, 'changeOrderCommentId');
		expect(comment.required).toBe(true);
		expect(comment.typeOptions?.loadOptionsDependsOn).toEqual(['vaultId', 'changeOrderId']);
		expect(comment.typeOptions?.loadOptions?.routing?.request?.url).toContain(
			'/change-orders/{{$parameter["changeOrderId"]}}/comments',
		);
		// The change order stays on screen: the comment list is loaded from it.
		expect(shownParameters(op, 'changeOrderId')).toHaveLength(1);
	});
});

describe('collections that were returned as a wrapper in version 1', () => {
	it.each([
		['items', 'getItemVersionAssociatedFiles'],
		['user', 'getUserAccounts'],
	])('%s/%s splits the results into items', (resource, value) => {
		expect(operation(resource, value).routing?.output?.postReceive).toEqual([splitResults]);
	});
});

describe('file version history', () => {
	const op = operation('files', 'getFileHistory');

	it('shows the History option with the values the API accepts for files', () => {
		const [history] = shownParameters(op, 'history');
		const values = (history.options as INodePropertyOptions[]).map((option) => option.value);
		expect(values).toEqual(['All', 'ReleasedOnly', 'ReleasedAndRevisionTip']);
		expect(history.default).toBe('All');
	});

	it('keeps Revision Tip for item history, where the API accepts it', () => {
		const [history] = shownParameters(operation('items', 'getItemHistory'), 'history');
		const values = (history.options as INodePropertyOptions[]).map((option) => option.value);
		expect(values).toContain('RevisionTip');
	});
});

describe('get many change orders', () => {
	const op = operation('changeOrders', 'getChangeOrders');

	it('sends the search query', () => {
		expect(op.routing?.request?.qs).toHaveProperty('q', '={{$parameter["q"] || undefined}}');
		expect(shownParameters(op, 'q')).toHaveLength(1);
	});
});
