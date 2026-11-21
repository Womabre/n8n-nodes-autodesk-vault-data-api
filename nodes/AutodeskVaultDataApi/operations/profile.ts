import { API_BASE } from '../utils/constants';
import { defineOperation, defineResource } from '../definition/defineOperation';
import { listLoadOptions } from '../definition/loadOptions';

export const resource = defineResource({
	value: 'profile',
	defaultOperation: 'getProfileAttributeDefinitionById',
	operations: [
		defineOperation({
			name: 'Get Profile Attribute Definition',
			value: 'getProfileAttributeDefinitionById',
			action: 'Get profile attribute definition',
			description: 'Get profile attribute definition by its ID',
			method: 'GET',
			path: '/profile-attribute-definitions/{profileAttributeDefId}',
			fields: [
				{
					displayName: 'Profile Attribute Definition Name or ID',
					name: 'profileAttributeDefId',
					type: 'options',
					typeOptions: {
						loadOptions: listLoadOptions(
							`${API_BASE}/profile-attribute-definitions`,
							'={{$responseItem.attributeName}}',
						),
					},
					required: true,
					description:
						'The profile attribute definition to retrieve. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
					default: '',
				},
			],
			response: 'single',
		}),
		defineOperation({
			name: 'Get Many Profile Attribute Definitions',
			value: 'getProfileAttributeDefinitions',
			action: 'Get many profile attribute definitions',
			description:
				'Retrieve all profile attribute definitions, optionally filtered by association (User, Group, All)',
			method: 'GET',
			path: '/profile-attribute-definitions',
			fields: [
				{
					displayName: 'Association Filter',
					name: 'association',
					type: 'options',
					description: 'Types the profile attribute definition is associated with',
					options: [
						{ name: 'User', value: 'User' },
						{ name: 'Group', value: 'Group' },
						{ name: 'All', value: 'All' },
					],
					default: 'All',
				},
			],
			query: { 'filter[association]': 'association' },
			response: 'collection',
		}),
	],
});
