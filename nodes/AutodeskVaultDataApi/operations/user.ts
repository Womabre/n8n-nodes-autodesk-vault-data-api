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
				resource: ['user'],
			},
		},
		options: [
			{
				name: 'Get User',
				value: 'getUserById',
				action: 'Get user',
				description: 'Get full user object associated with the specified user ID',
				routing: {
					request: {
						method: 'GET',
						url: `=${API_BASE}/users/{{$parameter["userId"]}}`,
					},
				},
			},
			{
				name: 'Get User Account by Auth Type',
				value: 'getUserAccountByAuthType',
				action: 'Get user account by auth type',
				description:
					'Get user account information for a specific type (Vault, ActiveDirectory, Autodesk)',
				routing: {
					request: {
						method: 'GET',
						url: `=${API_BASE}/users/{{$parameter["userId"]}}/accounts/{{$parameter["authType"]}}`,
					},
				},
			},
			{
				name: 'Get Many Users',
				value: 'getAllUsers',
				action: 'Get many users',
				description: 'Retrieve all Vault users (requires AdminUserRead permission)',
				routing: {
					request: {
						method: 'GET',
						url: `${API_BASE}/users`,
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
				name: 'Get Many User Accounts',
				value: 'getUserAccounts',
				action: 'Get many user accounts',
				description: 'Get all accounts associated with the specified user ID',
				routing: {
					request: {
						method: 'GET',
						url: `=${API_BASE}/users/{{$parameter["userId"]}}/accounts`,
					},
				},
			},
		],
		default: 'getUserById',
	},
];
