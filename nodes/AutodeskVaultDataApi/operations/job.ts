import { IExecuteSingleFunctions, IHttpRequestOptions, INodeProperties } from 'n8n-workflow';

export async function formatJobBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const jobType = this.getNodeParameter('jobType', 0) as string;
	const priority = this.getNodeParameter('priority', 0) as number | '';
	const description = this.getNodeParameter('description', 0) as string;
	const paramsCollection = this.getNodeParameter('params', 0) as {
		parameter?: Array<{ key: string; value: string }>;
	};

	const body: Record<string, unknown> = {};
	if (jobType) body.jobType = jobType;
	if (priority !== '' && priority !== undefined) body.priority = priority;
	if (description) body.description = description;
	if (paramsCollection?.parameter?.length) body.params = paramsCollection.parameter;

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
						url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/jobs',
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
				name: 'Get Job',
				value: 'getJobsById',
				action: 'Get job',
				description: 'Returns the job details for the specified job ID in the given Vault',
				routing: {
					request: {
						method: 'GET',
						url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/jobs/{{$parameter["jobId"]}}',
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
						url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/jobs/job-queue-enabled',
					},
				},
			},
		],
		default: 'addJob',
	},
];
