import { defineOperation, defineResource } from '../definition/defineOperation';
import { vaultId } from '../definition/fields';

export const resource = defineResource({
	value: 'vault',
	defaultOperation: 'getVaultById',
	operations: [
		defineOperation({
			name: 'Get Vault',
			value: 'getVaultById',
			action: 'Get vault',
			description: 'Retrieve a specific Knowledge Vault by its ID',
			method: 'GET',
			path: '/vaults/{vaultId}',
			fields: [vaultId],
			response: 'single',
		}),
		defineOperation({
			name: 'Get Many Vaults',
			value: 'getVaults',
			action: 'Get many vaults',
			description: 'Get the list of all Knowledge Vaults on the server without logging in',
			method: 'GET',
			path: '/vaults',
			fields: [],
			response: 'collection',
		}),
	],
});
