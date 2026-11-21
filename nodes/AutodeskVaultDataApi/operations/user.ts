import { INodeProperties } from 'n8n-workflow';
import { API_BASE } from '../utils/constants';
import { defineOperation, defineResource } from '../definition/defineOperation';
import { listLoadOptions } from '../definition/loadOptions';

const userId: INodeProperties = {
	displayName: 'User Name or ID',
	name: 'userId',
	type: 'options',
	typeOptions: { loadOptions: listLoadOptions(`${API_BASE}/users`) },
	required: true,
	default: '',
	hint: 'Loading the list requires the AdminUserRead permission. If unavailable, switch to an expression to enter the ID manually.',
	description:
		'The user to retrieve. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
};

export const resource = defineResource({
	value: 'user',
	defaultOperation: 'getUserById',
	operations: [
		defineOperation({
			name: 'Get User',
			value: 'getUserById',
			action: 'Get user',
			description: 'Get full user object associated with the specified user ID',
			method: 'GET',
			path: '/users/{userId}',
			fields: [userId],
			response: 'single',
		}),
		defineOperation({
			name: 'Get User Account by Auth Type',
			value: 'getUserAccountByAuthType',
			action: 'Get user account by auth type',
			description:
				'Get user account information for a specific type (Vault, ActiveDirectory, Autodesk)',
			method: 'GET',
			path: '/users/{userId}/accounts/{authType}',
			fields: [
				{
					displayName: 'Auth Type',
					name: 'authType',
					type: 'options',
					required: true,
					default: 'Vault',
					options: [
						{ name: 'Vault Account', value: 'Vault' },
						{ name: 'Windows Account', value: 'ActiveDirectory' },
						{ name: 'Autodesk ID', value: 'Autodesk' },
					],
					description: 'The type of account to retrieve',
				},
				userId,
			],
			response: 'single',
		}),
		defineOperation({
			name: 'Get Many Users',
			value: 'getAllUsers',
			action: 'Get many users',
			description: 'Retrieve all Vault users (requires AdminUserRead permission)',
			method: 'GET',
			path: '/users',
			fields: [],
			response: 'collection',
		}),
		defineOperation({
			name: 'Get Many User Accounts',
			value: 'getUserAccounts',
			action: 'Get many user accounts',
			description: 'Get all accounts associated with the specified user ID',
			method: 'GET',
			path: '/users/{userId}/accounts',
			fields: [userId],
			response: 'collection',
			paginated: false, // no Return All in 2.0.1; adding it is a separate fix
			legacyWrapper: true,
		}),
	],
});
