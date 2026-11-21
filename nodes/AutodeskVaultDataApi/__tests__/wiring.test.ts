import { describe, expect, it } from 'vitest';
import type {
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	INodeProperties,
	INodePropertyOptions,
	INodePropertyRouting,
} from 'n8n-workflow';
import { AutodeskVaultDataApi } from '../AutodeskVaultDataApi.node';
import { splitResults } from '../utils/response';

/**
 * Regression checks on the declarative wiring for bugs fixed in 2.0.1. The
 * generic checks this file used to make (every field an operation sends is
 * shown, no field is shown twice) are now refused by buildProperties when the
 * node is built; see definition/__tests__/buildProperties.test.ts.
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

describe('operation wiring', () => {
	it('finds the operations and parameters of the node', () => {
		expect(operations.length).toBeGreaterThan(80);
		expect(parameters.length).toBeGreaterThan(80);
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

describe('resources', () => {
	it('offers in the resource list exactly the resources that have operations', () => {
		const selector = properties.find((property) => property.name === 'resource');
		const offered = (selector?.options as INodePropertyOptions[]).map((option) => option.value);
		const built = [...new Set(operations.map((op) => op.resource))];
		expect([...offered].sort()).toEqual([...built].sort());
	});
});

/**
 * Each operation with a body builder runs the right one: its preSend, taken
 * from the built node, produces that builder's body. The equivalence test
 * cannot see this, because every builder runs through the same preSend.
 */
describe('body builders per operation', () => {
	async function bodyOf(resource: string, value: string, params: Record<string, unknown>) {
		const preSend = operation(resource, value).routing?.send?.preSend ?? [];
		expect(preSend).toHaveLength(1);
		const ctx = {
			getNodeParameter: (name: string, fallback?: unknown) =>
				name in params ? params[name] : fallback,
			getNode: () => ({ name: 'Vault', type: 'autodeskVaultDataApi', typeVersion: 1.1 }),
		} as unknown as IExecuteSingleFunctions;
		const options = { url: '/x', method: 'POST' } as IHttpRequestOptions;
		return (await preSend[0].call(ctx, options)).body;
	}

	it('jobs/addJob builds a job', async () => {
		expect(await bodyOf('jobs', 'addJob', { jobType: 'MyJob' })).toEqual({ jobType: 'MyJob' });
	});

	it('extSyncTasks operations build a task, a task list and a query', async () => {
		const task = { entityId: '1', entityClassId: 'FILE', configId: 'c', workflowType: 'w' };
		expect(
			await bodyOf('extSyncTasks', 'addExtSyncTask', {
				syncEntityId: '1',
				syncEntityClassId: 'FILE',
				syncConfigId: 'c',
				syncWorkflowType: 'w',
			}),
		).toEqual({ ...task, description: '' });
		expect(
			await bodyOf('extSyncTasks', 'addExtSyncTasks', { syncTasks: { task: [task] } }),
		).toEqual([{ ...task, description: '' }]);
		expect(await bodyOf('extSyncTasks', 'queryExtSyncTasks', { syncEntityIds: '5' })).toEqual({
			entityIds: ['5'],
		});
	});

	it('search/advancedSearch builds folder URLs', async () => {
		expect(
			await bodyOf('search', 'advancedSearch', { vaultId: '7', foldersToSearch: ['3'] }),
		).toEqual({ foldersToSearch: ['/AutodeskDM/Services/api/vault/v2/vaults/7/folders/3'] });
	});

	it.each([
		['files', 'updateFileLifecycleStates', 'files'],
		['folders', 'updateFolderLifecycleStates', 'folders'],
		['items', 'updateItemLifecycleStates', 'items'],
	])('%s/%s updates states of %s', async (resource, value, collection) => {
		const body = await bodyOf(resource, value, {
			vaultId: '9',
			lifecycleStateUpdates: { update: [{ entityId: '1', lifecycleStateId: '2' }] },
		});
		expect(body).toEqual({
			updateLifecycleStateRequests: [
				{
					entityUrl: `/AutodeskDM/Services/api/vault/v2/vaults/9/${collection}/1`,
					lifecycleStateUrl: '/AutodeskDM/Services/api/vault/v2/vaults/9/lifecycle-states/2',
				},
			],
		});
	});

	it.each([
		['files', 'updateFileLifecycleDefinitions', 'files'],
		['folders', 'updateFolderLifecycleDefinitions', 'folders'],
		['items', 'updateItemLifecycleDefinitions', 'items'],
	])('%s/%s updates definitions of %s', async (resource, value, collection) => {
		const body = (await bodyOf(resource, value, {
			vaultId: '9',
			lifecycleDefinitionUpdates: {
				update: [{ entityId: '1', lifecycleDefinitionId: '4', lifecycleStateId: '2' }],
			},
		})) as { updateLifecycleDefinitionRequests: Array<{ entityUrl: string }> };
		expect(body.updateLifecycleDefinitionRequests[0].entityUrl).toBe(
			`/AutodeskDM/Services/api/vault/v2/vaults/9/${collection}/1`,
		);
	});
});
