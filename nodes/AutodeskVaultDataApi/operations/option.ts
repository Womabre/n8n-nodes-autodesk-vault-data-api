import { INodeProperties } from 'n8n-workflow';
import { API_BASE } from '../utils/constants';
import { defineOperation, defineResource } from '../definition/defineOperation';
import { vaultId } from '../definition/fields';
import { listLoadOptions } from '../definition/loadOptions';

const optionName: INodeProperties = {
	displayName: 'Option Name',
	name: 'optionName',
	type: 'string',
	required: true,
	default: '',
	placeholder: 'e.g. MyOption',
	description: 'The name of the system option',
};

const optionValue: INodeProperties = {
	displayName: 'Option Value',
	name: 'optionValue',
	type: 'string',
	required: true,
	default: '',
	placeholder: 'e.g. true',
	description: 'The value of the system option',
};

const systemOptionId: INodeProperties = {
	displayName: 'System Option Name or ID',
	name: 'systemOptionId',
	type: 'options',
	typeOptions: { loadOptions: listLoadOptions(`${API_BASE}/system-options`) },
	required: true,
	default: '',
	description:
		'The system option to use. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
};

const vaultOptionId: INodeProperties = {
	displayName: 'Vault Option Name or ID',
	name: 'vaultOptionId',
	type: 'options',
	typeOptions: {
		loadOptionsDependsOn: ['vaultId'],
		loadOptions: listLoadOptions(`=${API_BASE}/vaults/{{$parameter["vaultId"]}}/vault-options`),
	},
	required: true,
	default: '',
	description:
		'The vault option to use. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	displayOptions: { hide: { vaultId: [''] } },
};

export const resource = defineResource({
	value: 'options',
	defaultOperation: 'getSystemOptions',
	operations: [
		defineOperation({
			name: 'Create System Option',
			value: 'createSystemOption',
			action: 'Create system option',
			description: 'Creates a system-wide option with name and value',
			method: 'POST',
			path: '/system-options',
			fields: [optionName, optionValue],
			body: { name: 'optionName', value: 'optionValue' },
			response: 'empty',
		}),
		defineOperation({
			name: 'Create Vault Option',
			value: 'createVaultOption',
			action: 'Create vault option',
			description: 'Create a new option which applies to the specified vault',
			method: 'POST',
			path: '/vaults/{vaultId}/vault-options',
			fields: [vaultId, optionName, optionValue],
			body: { name: 'optionName', value: 'optionValue' },
			response: 'empty',
		}),
		defineOperation({
			name: 'Delete System Option',
			value: 'deleteSystemOptionById',
			action: 'Delete system option',
			description: 'Delete a system option by its ID',
			method: 'DELETE',
			path: '/system-options/{systemOptionId}',
			fields: [systemOptionId],
			response: 'empty',
		}),
		defineOperation({
			name: 'Delete Vault Option',
			value: 'deleteVaultOptionById',
			action: 'Delete vault option',
			description: 'Delete a vault option with a specific ID',
			method: 'DELETE',
			path: '/vaults/{vaultId}/vault-options/{vaultOptionId}',
			fields: [vaultId, vaultOptionId],
			response: 'empty',
		}),
		defineOperation({
			name: 'Get Many External Sync Configs',
			value: 'getExtSyncConfigs',
			action: 'Get many external sync configs',
			description:
				'Retrieve all external sync configurations as key-value pairs, where the key is the config ID used when creating an external sync task',
			method: 'GET',
			path: '/vaults/{vaultId}/vault-options/ext-sync-configs',
			fields: [vaultId],
			response: 'empty',
		}),
		defineOperation({
			name: 'Get Many System Options',
			value: 'getSystemOptions',
			action: 'Get many system options',
			description: 'Returns list of system-wide options, optionally filtered by name',
			method: 'GET',
			path: '/system-options',
			fields: [
				{
					displayName: 'Filter by Name',
					name: 'filterName',
					type: 'string',
					default: '',
					description: 'Return only options that exactly match this name',
				},
			],
			query: { 'filter[name]': 'filterName?' },
			response: 'collection',
		}),
		defineOperation({
			name: 'Get Many Vault Options',
			value: 'getVaultOptions',
			action: 'Get many vault options',
			description: 'Returns list of options that apply to the entire vault',
			method: 'GET',
			path: '/vaults/{vaultId}/vault-options',
			fields: [
				vaultId,
				{
					displayName: 'Name Starts With',
					name: 'nameStartsWith',
					type: 'string',
					default: '',
					description: 'Filter options that start with this string',
				},
			],
			query: { 'filter[name]-starts': 'nameStartsWith?' },
			response: 'collection',
		}),
		defineOperation({
			name: 'Get System Option',
			value: 'getSystemOptionById',
			action: 'Get system option',
			description: 'Retrieve a system option by its ID',
			method: 'GET',
			path: '/system-options/{systemOptionId}',
			fields: [systemOptionId],
			response: 'single',
		}),
		defineOperation({
			name: 'Get Vault Option',
			value: 'getVaultOptionById',
			action: 'Get vault option',
			description: 'Retrieve a vault-specific option using its ID',
			method: 'GET',
			path: '/vaults/{vaultId}/vault-options/{vaultOptionId}',
			fields: [vaultId, vaultOptionId],
			response: 'single',
		}),
		defineOperation({
			name: 'Update System Option',
			value: 'updateSystemOptionById',
			action: 'Update system option',
			description: 'Update the value of a system option by ID',
			method: 'PATCH',
			path: '/system-options/{systemOptionId}',
			fields: [optionValue, systemOptionId],
			body: { value: 'optionValue' },
			response: 'empty',
		}),
		defineOperation({
			name: 'Update Vault Option',
			value: 'updateVaultOptionById',
			action: 'Update vault option',
			description: 'Update the value of an option for the current vault',
			method: 'PATCH',
			path: '/vaults/{vaultId}/vault-options/{vaultOptionId}',
			fields: [vaultId, optionValue, vaultOptionId],
			body: { value: 'optionValue' },
			response: 'empty',
		}),
	],
});
