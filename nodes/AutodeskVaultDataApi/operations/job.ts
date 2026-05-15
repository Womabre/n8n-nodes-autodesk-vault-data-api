import { INodeProperties } from 'n8n-workflow';

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
					request: {
						method: 'POST',
						url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/jobs',
						headers: {
							Authorization: '=Bearer {{$credentials.accessToken}}',
						},
						body: '={{$parameter["job"]}}',
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
						headers: {
							Authorization: '=Bearer {{$credentials.accessToken}}',
						},
					},
				},
			},
			{
				name: 'Get Job Queue Status',
				value: 'getJobQueueEnabled',
				action: 'Get job queue status',
				description: 'Returns a boolean indicating whether the job queue is enabled for the specified Vault',
				routing: {
					request: {
						method: 'GET',
						url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/jobs/job-queue-enabled',
						headers: {
							Authorization: '=Bearer {{$credentials.accessToken}}',
						},
					},
				},
			},
		],
		default: 'addJob',
	},
];
