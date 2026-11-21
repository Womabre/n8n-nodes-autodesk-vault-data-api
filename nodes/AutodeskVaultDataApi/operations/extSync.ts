import {
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';
import { foldParams, KeyValueEntry } from '../utils/keyValue';
import { defineOperation, defineResource } from '../definition/defineOperation';
import { vaultId } from '../definition/fields';

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

const extSyncTaskId: INodeProperties = {
	displayName: 'External Sync Task ID',
	name: 'extSyncTaskId',
	type: 'string',
	required: true,
	default: '',
	placeholder: 'e.g. 233',
	description: 'The unique identifier of an external sync task',
};

const filterWorkflowType: INodeProperties = {
	displayName: 'Workflow Type',
	name: 'filterWorkflowType',
	type: 'string',
	default: '',
	placeholder: 'e.g. Adsk.UploadItem',
	description: 'Return only tasks whose workflow type exactly matches this value',
};

export const resource = defineResource({
	value: 'extSyncTasks',
	defaultOperation: 'getExtSyncTasks',
	operations: [
		defineOperation({
			name: 'Create External Sync Task',
			value: 'addExtSyncTask',
			action: 'Create external sync task',
			description: 'Create an external sync task and add it to the queue',
			method: 'POST',
			path: '/vaults/{vaultId}/ext-sync-tasks',
			fields: [
				vaultId,
				{
					displayName: 'Entity ID',
					name: 'syncEntityId',
					type: 'string',
					required: true,
					default: '',
					placeholder: 'e.g. 127',
					description: 'The ID of the entity being synchronized',
				},
				{
					displayName: 'Entity Class',
					name: 'syncEntityClassId',
					type: 'options',
					required: true,
					default: 'ITEM',
					description: 'The class of the entity being synchronized',
					options: [
						{ name: 'Change Order', value: 'CO' },
						{ name: 'File', value: 'FILE' },
						{ name: 'Folder', value: 'FLDR' },
						{ name: 'Item', value: 'ITEM' },
					],
				},
				{
					displayName: 'Config ID',
					name: 'syncConfigId',
					type: 'string',
					required: true,
					default: '',
					placeholder: 'e.g. Adsk.Vault.ExternalSyncTask.FusionManage',
					description: 'The ID of the external sync configuration to use',
					hint: 'Use the Option resource, "Get Many External Sync Configs", to list the available config IDs',
				},
				{
					displayName: 'Workflow Type',
					name: 'syncWorkflowType',
					type: 'string',
					required: true,
					default: '',
					placeholder: 'e.g. Adsk.UploadItem',
					description:
						'The workflow type for this sync task, taken from the selected configuration',
				},
				{
					displayName: 'Description',
					name: 'syncDescription',
					type: 'string',
					required: true,
					default: '',
					placeholder: 'e.g. Sync to Fusion Manage (1000007)',
					description: 'A description of the external sync task',
				},
				{
					displayName: 'Parameters',
					name: 'syncParams',
					type: 'fixedCollection',
					typeOptions: { multipleValues: true },
					default: {},
					description: 'Extra key-value data carried along the task execution chain',
					options: [
						{
							displayName: 'Parameter',
							name: 'parameter',
							values: [
								{ displayName: 'Key', name: 'key', type: 'string', default: '' },
								{ displayName: 'Value', name: 'value', type: 'string', default: '' },
							],
						},
					],
				},
				{
					displayName: 'Execute Immediately',
					name: 'syncExecuteImmediately',
					type: 'boolean',
					default: false,
					description: 'Whether to notify the sync agent as soon as the task is created',
				},
				{
					displayName: 'Predecessor Task ID',
					name: 'syncPredecessorTaskId',
					type: 'string',
					default: '',
					placeholder: 'e.g. 232',
					description: 'The ID of a task that must complete before this one runs',
				},
			],
			preSend: [formatExtSyncTaskBody],
			response: 'empty',
		}),
		defineOperation({
			name: 'Create External Sync Tasks in Batch',
			value: 'addExtSyncTasks',
			action: 'Create external sync tasks in batch',
			description: 'Create multiple external sync tasks in a single batch operation',
			method: 'POST',
			path: '/vaults/{vaultId}/ext-sync-tasks:batch-create',
			fields: [
				vaultId,
				{
					displayName: 'Tasks',
					name: 'syncTasks',
					type: 'fixedCollection',
					typeOptions: { multipleValues: true },
					default: {},
					description: 'One entry per external sync task to create',
					options: [
						{
							displayName: 'Task',
							name: 'task',
							values: [
								{
									displayName: 'Config ID',
									name: 'configId',
									type: 'string',
									default: '',
									placeholder: 'e.g. Adsk.Vault.ExternalSyncTask.FusionManage',
									description: 'The ID of the external sync configuration to use',
								},
								{
									displayName: 'Description',
									name: 'description',
									type: 'string',
									default: '',
									placeholder: 'e.g. Sync to Fusion Manage (1000007)',
									description: 'A description of the external sync task',
								},
								{
									displayName: 'Entity Class',
									name: 'entityClassId',
									type: 'options',
									default: 'ITEM',
									description: 'The class of the entity being synchronized',
									options: [
										{ name: 'Change Order', value: 'CO' },
										{ name: 'File', value: 'FILE' },
										{ name: 'Folder', value: 'FLDR' },
										{ name: 'Item', value: 'ITEM' },
									],
								},
								{
									displayName: 'Entity ID',
									name: 'entityId',
									type: 'string',
									default: '',
									placeholder: 'e.g. 127',
									description: 'The ID of the entity being synchronized',
								},
								{
									displayName: 'Execute Immediately',
									name: 'executeImmediately',
									type: 'boolean',
									default: false,
									description: 'Whether to notify the sync agent as soon as the task is created',
								},
								{
									displayName: 'Parameters (JSON)',
									name: 'paramsJson',
									type: 'json',
									default: '',
									placeholder: 'e.g. {"entityClassId": "ITEM", "entityId": "127"}',
									description: 'Extra key-value data as a JSON object',
								},
								{
									displayName: 'Predecessor Task ID',
									name: 'predecessorTaskId',
									type: 'string',
									default: '',
									placeholder: 'e.g. 232',
									description: 'The ID of a task that must complete before this one runs',
								},
								{
									displayName: 'Workflow Type',
									name: 'workflowType',
									type: 'string',
									default: '',
									placeholder: 'e.g. Adsk.UploadItem',
									description: 'The workflow type for this sync task',
								},
							],
						},
					],
				},
			],
			preSend: [formatExtSyncTaskBatchBody],
			response: 'single',
		}),
		defineOperation({
			name: 'Delete External Sync Task',
			value: 'deleteExtSyncTaskById',
			action: 'Delete external sync task',
			description:
				'Delete an external sync task by its ID. Deleting a task that no longer exists still succeeds.',
			method: 'DELETE',
			path: '/vaults/{vaultId}/ext-sync-tasks/{extSyncTaskId}',
			fields: [vaultId, extSyncTaskId],
			response: 'empty',
		}),
		defineOperation({
			name: 'Find External Sync Tasks',
			value: 'queryExtSyncTasks',
			action: 'Find external sync tasks',
			description: 'Find external sync tasks for one or more entity IDs',
			method: 'POST',
			path: '/vaults/{vaultId}/ext-sync-tasks:find-by-entity-ids',
			fields: [
				vaultId,
				filterWorkflowType,
				{
					displayName: 'Entity IDs',
					name: 'syncEntityIds',
					type: 'string',
					required: true,
					default: '',
					placeholder: 'e.g. 127,119',
					description: 'The entity IDs to search for, separated by commas or newlines',
				},
			],
			preSend: [formatExtSyncTaskQueryBody],
			response: 'single',
		}),
		defineOperation({
			name: 'Get External Sync Task',
			value: 'getExtSyncTaskById',
			action: 'Get external sync task',
			description: 'Retrieve an external sync task by its ID',
			method: 'GET',
			path: '/vaults/{vaultId}/ext-sync-tasks/{extSyncTaskId}',
			fields: [vaultId, extSyncTaskId],
			response: 'single',
		}),
		defineOperation({
			name: 'Get Many External Sync Tasks',
			value: 'getExtSyncTasks',
			action: 'Get many external sync tasks',
			description: 'Retrieve external sync tasks in the specified Vault',
			method: 'GET',
			path: '/vaults/{vaultId}/ext-sync-tasks',
			fields: [
				vaultId,
				{
					displayName: 'Filter by Entity IDs',
					name: 'filterEntityIds',
					type: 'string',
					default: '',
					placeholder: 'e.g. 127,119',
					description: 'Return only tasks for these entity IDs, separated by commas or newlines',
				},
				{
					displayName: 'Filter by Entity ID',
					name: 'filterEntityId',
					type: 'string',
					default: '',
					placeholder: 'e.g. 127',
					description: 'Return only tasks whose entity ID exactly matches this value',
				},
				{
					displayName: 'Entity ID Starts With',
					name: 'entityIdStartsWith',
					type: 'string',
					default: '',
					placeholder: 'e.g. 12',
					description: 'Return only tasks whose entity ID begins with this string',
				},
				filterWorkflowType,
				{
					displayName: 'Workflow Type Starts With',
					name: 'workflowTypeStartsWith',
					type: 'string',
					default: '',
					placeholder: 'e.g. Adsk.',
					description: 'Return only tasks whose workflow type begins with this string',
				},
			],
			query: {
				'filter[entityIds]': 'filterEntityIds?',
				'filter[entityId]': 'filterEntityId?',
				'filter[entityId]-starts': 'entityIdStartsWith?',
				'filter[workflowType]': 'filterWorkflowType?',
				'filter[workflowType]-starts': 'workflowTypeStartsWith?',
			},
			response: 'collection',
		}),
		defineOperation({
			name: 'Resubmit External Sync Task',
			value: 'resubmitExtSyncTaskById',
			action: 'Resubmit external sync task',
			description: 'Resubmit a failed external sync task by its ID',
			method: 'POST',
			path: '/vaults/{vaultId}/ext-sync-tasks/{extSyncTaskId}:resubmit',
			fields: [vaultId, extSyncTaskId],
			response: 'single',
		}),
	],
});
