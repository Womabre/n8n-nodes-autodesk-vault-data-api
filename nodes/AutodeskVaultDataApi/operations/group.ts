import { INodeProperties } from 'n8n-workflow';
import { API_BASE } from '../utils/constants';
import { defineOperation, defineResource } from '../definition/defineOperation';
import { listLoadOptions } from '../definition/loadOptions';

const groupId: INodeProperties = {
	displayName: 'Group Name',
	name: 'groupId',
	type: 'options',
	typeOptions: { loadOptions: listLoadOptions(`${API_BASE}/groups`) },
	required: true,
	description: 'The ID of the group to retrieve',
	hint: 'You can find the group ID in the response of "Get All Groups" operation',
	default: '',
};

export const resource = defineResource({
	value: 'group',
	defaultOperation: 'getGroupById',
	operations: [
		defineOperation({
			name: 'Get Group',
			value: 'getGroupById',
			action: 'Get group',
			description: 'Retrieve a specific group by its ID',
			method: 'GET',
			path: '/groups/{groupId}',
			fields: [groupId],
			response: 'single',
		}),
		defineOperation({
			name: 'Get Group Account by Auth Type',
			value: 'getAccountByAuthType',
			action: 'Get group account by auth type',
			description: 'Get group account information by a specific auth type (Vault, AD, Autodesk)',
			method: 'GET',
			path: '/groups/{groupId}/accounts/{authType}',
			fields: [
				groupId,
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
			],
			response: 'single',
		}),
		defineOperation({
			name: 'Get Many Groups',
			value: 'getGroups',
			action: 'Get many groups',
			description: 'Get all groups in the Vault',
			method: 'GET',
			path: '/groups',
			fields: [],
			response: 'collection',
		}),
	],
});
