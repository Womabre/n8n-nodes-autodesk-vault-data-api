import { INodeProperties } from 'n8n-workflow';
import { API_BASE } from '../utils/constants';

export const operations: INodeProperties[] = [
	// Lifecycle: getLifecycleDefinitions, getLifecycleDefinitionById,
	// getLifecycleStates, getLifecycleStateById
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['lifecycle'],
			},
		},
		options: [
			{
				name: 'Get Lifecycle Definition',
				value: 'getLifecycleDefinitionById',
				action: 'Get lifecycle definition',
				description: 'Retrieve a lifecycle definition by its ID',
				routing: {
					request: {
						method: 'GET',
						url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/lifecycle-definitions/{{$parameter["lifecycleDefinitionId"]}}`,
					},
				},
			},
			{
				name: 'Get Lifecycle State',
				value: 'getLifecycleStateById',
				action: 'Get lifecycle state',
				description: 'Retrieve a lifecycle state by its ID',
				routing: {
					request: {
						method: 'GET',
						url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/lifecycle-states/{{$parameter["lifecycleStateId"]}}`,
					},
				},
			},
			{
				name: 'Get Many Lifecycle Definitions',
				value: 'getLifecycleDefinitions',
				action: 'Get many lifecycle definitions',
				description: 'Retrieve all lifecycle definitions in the specified Vault',
				routing: {
					request: {
						method: 'GET',
						url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/lifecycle-definitions`,
						qs: {
							'filter[ids]': '={{$parameter["filterLifecycleDefinitionIds"] || undefined}}',
							'option[extendedModels]': '={{$parameter["extendedModels"]}}',
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
				name: 'Get Many Lifecycle States',
				value: 'getLifecycleStates',
				action: 'Get many lifecycle states',
				description:
					'Retrieve lifecycle states by ID. The API requires an explicit list of state IDs.',
				routing: {
					request: {
						method: 'GET',
						url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/lifecycle-states`,
						qs: {
							'filter[ids]': '={{$parameter["filterLifecycleStateIds"]}}',
							'option[extendedModels]': '={{$parameter["extendedModels"]}}',
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
		],
		default: 'getLifecycleDefinitions',
	},
];
