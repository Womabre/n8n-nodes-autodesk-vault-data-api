import { API_BASE } from '../utils/constants';
import { defineOperation, defineResource } from '../definition/defineOperation';
import { listLoadOptions } from '../definition/loadOptions';

export const resource = defineResource({
	value: 'role',
	defaultOperation: 'getRoleById',
	operations: [
		defineOperation({
			name: 'Get Role',
			value: 'getRoleById',
			action: 'Get role',
			description: 'Retrieve the role object with the specified ID',
			method: 'GET',
			path: '/roles/{roleId}',
			fields: [
				{
					displayName: 'Role Name or ID',
					name: 'roleId',
					type: 'options',
					typeOptions: {
						loadOptions: listLoadOptions(`${API_BASE}/roles`, '={{$responseItem.roleName}}'),
					},
					required: true,
					description:
						'The role to retrieve. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
					default: '',
				},
			],
			response: 'single',
		}),
		defineOperation({
			name: 'Get Roles',
			value: 'getRoles',
			action: 'Get roles',
			description: 'Get all roles visible to the current user based on permissions',
			method: 'GET',
			path: '/roles',
			fields: [],
			response: 'collection',
		}),
	],
});
