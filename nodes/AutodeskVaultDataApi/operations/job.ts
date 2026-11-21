import { IExecuteSingleFunctions, IHttpRequestOptions, NodeOperationError } from 'n8n-workflow';
import { foldParams, KeyValueEntry } from '../utils/keyValue';
import { defineOperation, defineResource } from '../definition/defineOperation';
import { vaultId } from '../definition/fields';

export async function formatJobBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const jobType = (this.getNodeParameter('jobType') as string)?.trim();
	if (!jobType) {
		throw new NodeOperationError(
			this.getNode(),
			'Enter a job type, for example Autodesk.Vault.SyncProperties',
		);
	}
	const priority = this.getNodeParameter('priority', '') as number | '';
	const description = this.getNodeParameter('description', '') as string;
	const paramsCollection = this.getNodeParameter('params', {}) as {
		parameter?: KeyValueEntry[];
	} | null;

	// The API takes `params` as a map of string keys to string values, not as
	// the list of key/value rows the UI collects.
	const params = foldParams(paramsCollection?.parameter);

	const body: Record<string, unknown> = { jobType };
	if (priority !== '' && priority !== undefined) body.priority = priority;
	if (description) body.description = description;
	if (params) body.params = params;

	requestOptions.body = body;
	return requestOptions;
}

export const resource = defineResource({
	value: 'jobs',
	defaultOperation: 'addJob',
	operations: [
		defineOperation({
			name: 'Create Job',
			value: 'addJob',
			action: 'Create job',
			description: 'Add a new job into the job queue for a given Vault',
			method: 'POST',
			path: '/vaults/{vaultId}/jobs',
			fields: [
				vaultId,
				{
					displayName: 'Job Type',
					name: 'jobType',
					type: 'string',
					required: true,
					default: '',
					placeholder: 'e.g. Autodesk.Vault.SyncProperties',
				},
				{
					displayName: 'Priority',
					name: 'priority',
					type: 'number',
					default: 1,
					description:
						'The priority of the job. A lower number means a higher priority. 1 is the lowest possible number.',
					typeOptions: { minValue: 1 },
				},
				{
					displayName: 'Description',
					name: 'description',
					type: 'string',
					default: '',
					description: 'A description of the job',
					placeholder: 'e.g. Sync properties for files',
				},
				{
					displayName: 'Parameters',
					name: 'params',
					type: 'fixedCollection',
					typeOptions: { multipleValues: true },
					default: {},
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
			],
			preSend: [formatJobBody],
			response: 'empty',
		}),
		defineOperation({
			name: 'Get Job',
			value: 'getJobsById',
			action: 'Get job',
			description: 'Returns the job details for the specified job ID in the given Vault',
			method: 'GET',
			path: '/vaults/{vaultId}/jobs/{jobId}',
			fields: [
				vaultId,
				{
					displayName: 'Job ID',
					name: 'jobId',
					type: 'string',
					required: true,
					placeholder: 'e.g. 1234',
					description: 'The unique identifier of a job',
					default: '',
				},
			],
			response: 'single',
		}),
		defineOperation({
			name: 'Get Job Queue Status',
			value: 'getJobQueueEnabled',
			action: 'Get job queue status',
			description:
				'Returns a boolean indicating whether the job queue is enabled for the specified Vault',
			method: 'GET',
			path: '/vaults/{vaultId}/jobs/job-queue-enabled',
			fields: [vaultId],
			response: 'single',
		}),
	],
});
