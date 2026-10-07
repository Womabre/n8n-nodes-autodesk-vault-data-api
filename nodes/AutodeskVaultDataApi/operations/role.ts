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
				resource: ['role'],
			},
		},
		options: [
			{
				name: 'Get Role',
				value: 'getRoleById',
				action: 'Get role',
				description: 'Retrieve the role object with the specified ID',
				routing: {
					request: {
						method: 'GET',
						url: `=${API_BASE}/roles/{{$parameter["roleId"]}}`,
					},
				},
			},
			{
				name: 'Get Roles',
				value: 'getRoles',
				action: 'Get roles',
				description: 'Get all roles visible to the current user based on permissions',
				routing: {
					request: {
						method: 'GET',
						url: `${API_BASE}/roles`,
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
		],
		default: 'getRoleById',
	},
];
