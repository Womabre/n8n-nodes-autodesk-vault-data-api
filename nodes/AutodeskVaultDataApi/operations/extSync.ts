import { IExecuteSingleFunctions, IHttpRequestOptions, INodeProperties, NodeOperationError } from 'n8n-workflow';

interface KeyValueEntry {
	key?: string;
	value?: string;
}

interface ExtSyncTaskEntry {
	entityId?: string;
	entityClassId?: string;
	configId?: string;
	workflowType?: string;
	description?: string;
	paramsJson?: string;
	executeImmediately?: boolean;
	predecessorTaskId?: string;
}

/** Folds the UI's key/value rows into the dictionary the API expects for `params`. */
function foldParams(entries: KeyValueEntry[] | undefined): Record<string, string> | undefined {
	if (!entries?.length) return undefined;

	const params: Record<string, string> = {};
	for (const entry of entries) {
		if (entry.key) params[entry.key] = entry.value ?? '';
	}

	return Object.keys(params).length > 0 ? params : undefined;
}

/** Accepts IDs separated by newlines or commas and returns the non-empty ones. */
export function splitIds(raw: string): string[] {
	return raw
		.split(/[\n,]/)
		.map((id) => id.trim())
		.filter((id) => id.length > 0);
}

function parseParamsJson(
	ctx: IExecuteSingleFunctions,
	raw: string | undefined,
	position: number,
): Record<string, unknown> | undefined {
	if (!raw || !raw.trim()) return undefined;

	try {
		const parsed = JSON.parse(raw) as unknown;
		if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
			throw new Error('not an object');
		}
		return parsed as Record<string, unknown>;
	} catch {
		throw new NodeOperationError(
			ctx.getNode(),
			`Task ${position}: "Parameters (JSON)" must be a JSON object, for example {"key": "value"}`,
		);
	}
}

function buildTask(entry: {
	entityId: string;
	entityClassId: string;
	configId: string;
	workflowType: string;
	description: string;
	params?: Record<string, unknown>;
	executeImmediately?: boolean;
	predecessorTaskId?: string;
}): Record<string, unknown> {
	const task: Record<string, unknown> = {
		entityId: entry.entityId,
		entityClassId: entry.entityClassId,
		configId: entry.configId,
		workflowType: entry.workflowType,
		description: entry.description,
	};

	if (entry.params) task.params = entry.params;
	if (entry.executeImmediately) task.executeImmediately = true;
	if (entry.predecessorTaskId) task.predecessorTaskId = entry.predecessorTaskId;

	return task;
}

/** Body for `POST /vaults/{vaultId}/ext-sync-tasks`. */
export async function formatExtSyncTaskBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const paramsCollection = this.getNodeParameter('syncParams', {}) as {
		parameter?: KeyValueEntry[];
	} | null;

	requestOptions.body = buildTask({
		entityId: this.getNodeParameter('syncEntityId', '') as string,
		entityClassId: this.getNodeParameter('syncEntityClassId', '') as string,
		configId: this.getNodeParameter('syncConfigId', '') as string,
		workflowType: this.getNodeParameter('syncWorkflowType', '') as string,
		description: this.getNodeParameter('syncDescription', '') as string,
		params: foldParams(paramsCollection?.parameter),
		executeImmediately: this.getNodeParameter('syncExecuteImmediately', false) as boolean,
		predecessorTaskId: this.getNodeParameter('syncPredecessorTaskId', '') as string,
	});

	return requestOptions;
}

/**
 * Body for `POST /vaults/{vaultId}/ext-sync-tasks:batch-create`. This endpoint
 * takes a bare JSON array rather than a wrapper object.
 */
export async function formatExtSyncTaskBatchBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const collection = this.getNodeParameter('syncTasks', {}) as { task?: ExtSyncTaskEntry[] } | null;
	const entries = collection?.task ?? [];

	// The row number in the error message has to come from the original list, so
	// an invalid entry points at the row the user actually sees.
	const tasks: Array<Record<string, unknown>> = [];
	entries.forEach((entry, index) => {
		if (!entry.entityId || !entry.entityClassId || !entry.configId || !entry.workflowType) return;

		tasks.push(
			buildTask({
				entityId: String(entry.entityId),
				entityClassId: String(entry.entityClassId),
				configId: String(entry.configId),
				workflowType: String(entry.workflowType),
				description: entry.description ?? '',
				params: parseParamsJson(this, entry.paramsJson, index + 1),
				executeImmediately: entry.executeImmediately,
				predecessorTaskId: entry.predecessorTaskId,
			}),
		);
	});

	if (tasks.length === 0) {
		throw new NodeOperationError(
			this.getNode(),
			'Add at least one task with an entity ID, entity class ID, config ID and workflow type',
		);
	}

	requestOptions.body = tasks;
	return requestOptions;
}

/** Body for `POST /vaults/{vaultId}/ext-sync-tasks:find-by-entity-ids`. */
export async function formatExtSyncTaskQueryBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const entityIds = splitIds((this.getNodeParameter('syncEntityIds', '') as string) ?? '');

	if (entityIds.length === 0) {
		throw new NodeOperationError(this.getNode(), 'Enter at least one entity ID to search for');
	}

	const body: Record<string, unknown> = { entityIds };
	const workflowType = this.getNodeParameter('filterWorkflowType', '') as string;
	if (workflowType) body.workflowType = workflowType;

	requestOptions.body = body;
	return requestOptions;
}

export const operations: INodeProperties[] = [
	// External sync tasks: addExtSyncTask, addExtSyncTasks, deleteExtSyncTaskById,
	// queryExtSyncTasks, getExtSyncTaskById, getExtSyncTasks, resubmitExtSyncTaskById
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['extSyncTasks'],
			},
		},
		options: [
			{
				name: 'Create External Sync Task',
				value: 'addExtSyncTask',
				action: 'Create external sync task',
				description: 'Create an external sync task and add it to the queue',
				routing: {
					send: {
						preSend: [formatExtSyncTaskBody],
					},
					request: {
						method: 'POST',
						url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/ext-sync-tasks',
					},
					output: {
						postReceive: [
							{
								type: 'setKeyValue',
								properties: {
									response: '={{ $response || "" }}',
								},
							},
						],
					},
				},
			},
			{
				name: 'Create External Sync Tasks in Batch',
				value: 'addExtSyncTasks',
				action: 'Create external sync tasks in batch',
				description: 'Create multiple external sync tasks in a single batch operation',
				routing: {
					send: {
						preSend: [formatExtSyncTaskBatchBody],
					},
					request: {
						method: 'POST',
						url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/ext-sync-tasks:batch-create',
					},
				},
			},
			{
				name: 'Delete External Sync Task',
				value: 'deleteExtSyncTaskById',
				action: 'Delete external sync task',
				description:
					'Delete an external sync task by its ID. Deleting a task that no longer exists still succeeds.',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/ext-sync-tasks/{{$parameter["extSyncTaskId"]}}',
					},
					output: {
						postReceive: [
							{
								type: 'setKeyValue',
								properties: {
									response: '={{ $response || "" }}',
								},
							},
						],
					},
				},
			},
			{
				name: 'Find External Sync Tasks',
				value: 'queryExtSyncTasks',
				action: 'Find external sync tasks',
				description: 'Find external sync tasks for one or more entity IDs',
				routing: {
					send: {
						preSend: [formatExtSyncTaskQueryBody],
					},
					request: {
						method: 'POST',
						url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/ext-sync-tasks:find-by-entity-ids',
					},
				},
			},
			{
				name: 'Get External Sync Task',
				value: 'getExtSyncTaskById',
				action: 'Get external sync task',
				description: 'Retrieve an external sync task by its ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/ext-sync-tasks/{{$parameter["extSyncTaskId"]}}',
					},
				},
			},
			{
				name: 'Get Many External Sync Tasks',
				value: 'getExtSyncTasks',
				action: 'Get many external sync tasks',
				description: 'Retrieve external sync tasks in the specified Vault',
				routing: {
					request: {
						method: 'GET',
						url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/ext-sync-tasks',
						qs: {
							'filter[entityIds]': '={{$parameter["filterEntityIds"] || undefined}}',
							'filter[entityId]': '={{$parameter["filterEntityId"] || undefined}}',
							'filter[entityId]-starts': '={{$parameter["entityIdStartsWith"] || undefined}}',
							'filter[workflowType]': '={{$parameter["filterWorkflowType"] || undefined}}',
							'filter[workflowType]-starts':
								'={{$parameter["workflowTypeStartsWith"] || undefined}}',
						},
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'results',
								},
							},
						],
					},
				},
			},
			{
				name: 'Resubmit External Sync Task',
				value: 'resubmitExtSyncTaskById',
				action: 'Resubmit external sync task',
				description: 'Resubmit a failed external sync task by its ID',
				routing: {
					request: {
						method: 'POST',
						url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/ext-sync-tasks/{{$parameter["extSyncTaskId"]}}:resubmit',
					},
				},
			},
		],
		default: 'getExtSyncTasks',
	},
];
