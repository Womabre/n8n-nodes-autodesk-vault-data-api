import { API_BASE } from '../utils/constants';
import { defineOperation, defineResource } from '../definition/defineOperation';
import { vaultId } from '../definition/fields';
import { listLoadOptions } from '../definition/loadOptions';

export const resource = defineResource({
	value: 'links',
	defaultOperation: 'getLinkById',
	operations: [
		defineOperation({
			name: 'Get Link',
			value: 'getLinkById',
			action: 'Get link',
			description: 'Fetches a single link entity using the provided link ID and Vault ID',
			method: 'GET',
			path: '/vaults/{vaultId}/links/{linkId}',
			fields: [
				vaultId,
				{
					displayName: 'Link Name or ID',
					name: 'linkId',
					type: 'options',
					typeOptions: {
						loadOptionsDependsOn: ['vaultId'],
						loadOptions: listLoadOptions(`=${API_BASE}/vaults/{{$parameter["vaultId"]}}/links`),
					},
					required: true,
					description:
						'The link to retrieve. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
					default: '',
					displayOptions: { hide: { vaultId: [''] } },
				},
			],
			response: 'single',
		}),
		defineOperation({
			name: 'Get Many Links',
			value: 'getLinks',
			action: 'Get many links',
			description: 'Fetches all links for the specified Vault ID',
			method: 'GET',
			path: '/vaults/{vaultId}/links',
			fields: [vaultId],
			response: 'collection',
		}),
	],
});
