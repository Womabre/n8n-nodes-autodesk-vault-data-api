import { API_BASE } from '../utils/constants';
import { defineOperation, defineResource } from '../definition/defineOperation';
import { extendedModels, vaultId } from '../definition/fields';
import { listLoadOptions } from '../definition/loadOptions';

export const resource = defineResource({
	value: 'lifecycle',
	defaultOperation: 'getLifecycleDefinitions',
	operations: [
		defineOperation({
			name: 'Get Lifecycle Definition',
			value: 'getLifecycleDefinitionById',
			action: 'Get lifecycle definition',
			description: 'Retrieve a lifecycle definition by its ID',
			method: 'GET',
			path: '/vaults/{vaultId}/lifecycle-definitions/{lifecycleDefinitionId}',
			fields: [
				vaultId,
				{
					displayName: 'Lifecycle Definition Name or ID',
					name: 'lifecycleDefinitionId',
					type: 'options',
					typeOptions: {
						loadOptionsDependsOn: ['vaultId'],
						loadOptions: listLoadOptions(
							`=${API_BASE}/vaults/{{$parameter["vaultId"]}}/lifecycle-definitions`,
						),
					},
					required: true,
					default: '',
					description:
						'The lifecycle definition to retrieve. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
					displayOptions: { hide: { vaultId: [''] } },
				},
			],
			response: 'single',
		}),
		defineOperation({
			name: 'Get Lifecycle State',
			value: 'getLifecycleStateById',
			action: 'Get lifecycle state',
			description: 'Retrieve a lifecycle state by its ID',
			method: 'GET',
			path: '/vaults/{vaultId}/lifecycle-states/{lifecycleStateId}',
			fields: [
				vaultId,
				{
					displayName: 'Lifecycle State ID',
					name: 'lifecycleStateId',
					type: 'string',
					required: true,
					default: '',
					placeholder: 'e.g. 28',
					description: 'The unique identifier of the lifecycle state to retrieve',
					hint: 'State IDs appear on the lifecycleState of any file, folder or item response',
				},
			],
			response: 'single',
		}),
		defineOperation({
			name: 'Get Many Lifecycle Definitions',
			value: 'getLifecycleDefinitions',
			action: 'Get many lifecycle definitions',
			description: 'Retrieve all lifecycle definitions in the specified Vault',
			method: 'GET',
			path: '/vaults/{vaultId}/lifecycle-definitions',
			fields: [
				vaultId,
				extendedModels,
				{
					displayName: 'Filter by Definition IDs',
					name: 'filterLifecycleDefinitionIds',
					type: 'string',
					default: '',
					placeholder: 'e.g. 1,2,7',
					description: 'Return only lifecycle definitions with these IDs, separated by commas',
				},
			],
			query: {
				'filter[ids]': 'filterLifecycleDefinitionIds',
				'option[extendedModels]': 'extendedModels',
			},
			response: 'collection',
		}),
		defineOperation({
			name: 'Get Many Lifecycle States',
			value: 'getLifecycleStates',
			action: 'Get many lifecycle states',
			description:
				'Retrieve lifecycle states by ID. The API requires an explicit list of state IDs.',
			method: 'GET',
			path: '/vaults/{vaultId}/lifecycle-states',
			fields: [
				vaultId,
				extendedModels,
				{
					displayName: 'Lifecycle State IDs',
					name: 'filterLifecycleStateIds',
					type: 'string',
					required: true,
					default: '',
					placeholder: 'e.g. 1,2,3',
					description:
						'The lifecycle state IDs to retrieve, separated by commas. The API has no "list all states" route, so this filter is required.',
				},
			],
			query: {
				'filter[ids]': 'filterLifecycleStateIds',
				'option[extendedModels]': 'extendedModels',
			},
			response: 'collection',
		}),
	],
});
