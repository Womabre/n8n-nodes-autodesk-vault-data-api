import { INodeProperties } from 'n8n-workflow';
import { API_BASE } from '../utils/constants';

export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['server'],
			},
		},
		options: [
			{
				name: 'Get Server Info',
				value: 'getServerInfo',
				action: 'Get server info',
				description: 'Get some metadata information about server such as product version, etc',
				routing: {
					request: {
						method: 'GET',
						url: `${API_BASE}/server-info`,
					},
				},
			},
		],
		default: 'getServerInfo',
	},
];
