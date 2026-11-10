import {
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';
import { handleEmptyResponse } from '../utils/response';
import { API_BASE } from '../utils/constants';
import { foldParams, KeyValueEntry } from '../utils/keyValue';

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

export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['jobs'],
			},
		},
		options: [
			{
				name: 'Create Job',
				value: 'addJob',
				action: 'Create job',
				description: 'Add a new job into the job queue for a given Vault',
				routing: {
					send: {
						preSend: [formatJobBody],
					},
					request: {
						method: 'POST',
						url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/jobs`,
					},
					output: {
						postReceive: [handleEmptyResponse],
					},
				},
			},
			{
				name: 'Get Job',
				value: 'getJobsById',
				action: 'Get job',
				description: 'Returns the job details for the specified job ID in the given Vault',
				routing: {
					request: {
						method: 'GET',
						url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/jobs/{{$parameter["jobId"]}}`,
					},
				},
			},
			{
				name: 'Get Job Queue Status',
				value: 'getJobQueueEnabled',
				action: 'Get job queue status',
				description:
					'Returns a boolean indicating whether the job queue is enabled for the specified Vault',
				routing: {
					request: {
						method: 'GET',
						url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/jobs/job-queue-enabled`,
					},
				},
			},
		],
		default: 'addJob',
	},
];
