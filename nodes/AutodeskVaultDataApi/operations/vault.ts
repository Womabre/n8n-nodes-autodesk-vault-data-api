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
				resource: ['vault'],
			},
		},
		options: [
			{
				name: 'Get Vault',
				value: 'getVaultById',
				action: 'Get vault',
				description: 'Retrieve a specific Knowledge Vault by its ID',
				routing: {
					request: {
						method: 'GET',
						url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}`,
					},
				},
			},
			{
				name: 'Get Many Vaults',
				value: 'getVaults',
				action: 'Get many vaults',
				description: 'Get the list of all Knowledge Vaults on the server without logging in',
				routing: {
					request: {
						method: 'GET',
						url: `${API_BASE}/vaults`,
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
		default: 'getVaultById',
	},
];
