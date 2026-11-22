import type { INodeProperties } from 'n8n-workflow';
import { defineOperation, defineResource } from '../definition/defineOperation';
import {
	extendedModels,
	propDefIds,
	q,
	releasedFilesOnly,
	releasedItemsOnly,
	releasedOnly,
	sort,
	vaultId,
} from '../definition/fields';
import { listLoadOptions } from '../definition/loadOptions';
import { API_BASE } from '../utils/constants';

const changeOrderId: INodeProperties = {
	displayName: 'Change Order Name or ID',
	name: 'changeOrderId',
	type: 'options',
	typeOptions: {
		loadOptionsDependsOn: ['vaultId'],
		loadOptions: listLoadOptions(
			`=${API_BASE}/vaults/{{$parameter["vaultId"]}}/change-orders`,
			'={{$responseItem.number}}{{$responseItem.title ? " - " + $responseItem.title : ""}}',
		),
	},
	required: true,
	description:
		'The Change Order to use. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	default: '',
	displayOptions: { hide: { vaultId: [''] } },
};

export const resource = defineResource({
	value: 'changeOrders',
	defaultOperation: 'getChangeOrders',
	operations: [
		defineOperation({
			name: 'Get Change Order',
			value: 'getChangeOrderById',
			action: 'Get change order',
			description: 'Get change order by its ID',
			method: 'GET',
			path: '/vaults/{vaultId}/change-orders/{changeOrderId}',
			fields: [vaultId, changeOrderId],
			response: 'single',
		}),
		defineOperation({
			name: 'Get Many Change Order Associated Entities',
			value: 'getChangeOrderAssociatedEntities',
			action: 'Get many change order associated entities',
			description: 'Get all files and items tracked by or associated with a change order',
			method: 'GET',
			path: '/vaults/{vaultId}/change-orders/{changeOrderId}/associated-entities',
			fields: [
				vaultId,
				releasedFilesOnly,
				releasedItemsOnly,
				changeOrderId,
				propDefIds,
				extendedModels,
			],
			query: {
				'option[releasedItemsOnly]': 'releasedItemsOnly',
				'option[releasedFilesOnly]': 'releasedFilesOnly',
				'option[extendedModels]': 'extendedModels',
				'option[propDefIds]': 'propDefIds',
			},
			response: 'collection',
		}),
		defineOperation({
			name: 'Get Many Change Order Comment Attachments',
			value: 'getChangeOrderCommentAttachments',
			action: 'Get many change order comment attachments',
			description: 'Retrieve all attachments associated with a change order comment',
			method: 'GET',
			path: '/vaults/{vaultId}/change-order-comments/{changeOrderCommentId}/attachments',
			fields: [
				vaultId,
				changeOrderId,
				{
					displayName: 'Comment Name or ID',
					name: 'changeOrderCommentId',
					type: 'options',
					typeOptions: {
						loadOptionsDependsOn: ['vaultId', 'changeOrderId'],
						loadOptions: listLoadOptions(
							`=${API_BASE}/vaults/{{$parameter["vaultId"]}}/change-orders/{{$parameter["changeOrderId"]}}/comments`,
							'={{$responseItem.subject || $responseItem.message || "Comment " + $responseItem.id}}{{$responseItem.createUserName ? " (" + $responseItem.createUserName + ")" : ""}}',
						),
					},
					required: true,
					description:
						'The comment whose attachments to list, from the change order selected above. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
					hint: 'Comment IDs are also in the output of "Get Many Change Order Comments"',
					default: '',
					displayOptions: { hide: { vaultId: [''], changeOrderId: [''] } },
				},
				releasedOnly,
				propDefIds,
				extendedModels,
			],
			query: {
				'option[releasedOnly]': 'releasedOnly',
				'option[extendedModels]': 'extendedModels',
				'option[propDefIds]': 'propDefIds',
			},
			response: 'collection',
		}),
		defineOperation({
			name: 'Get Many Change Order Comments',
			value: 'getChangeOrderComments',
			action: 'Get many change order comments',
			description: 'Retrieve comments for the given change order ID',
			method: 'GET',
			path: '/vaults/{vaultId}/change-orders/{changeOrderId}/comments',
			fields: [vaultId, changeOrderId],
			response: 'collection',
		}),
		defineOperation({
			name: 'Get Many Change Order Related Files',
			value: 'getChangeOrderRelatedFiles',
			action: 'Get many related files of a change order',
			description:
				'Get all change order related files, including attachments and associated item file associations',
			method: 'GET',
			path: '/vaults/{vaultId}/change-orders/{changeOrderId}/all-related-files',
			fields: [vaultId, changeOrderId, releasedOnly, propDefIds, extendedModels],
			query: {
				'option[releasedOnly]': 'releasedOnly',
				'option[extendedModels]': 'extendedModels',
				'option[propDefIds]': 'propDefIds',
			},
			response: 'collection',
		}),
		defineOperation({
			name: 'Get Many Change Orders',
			value: 'getChangeOrders',
			action: 'Get many change orders',
			description: 'Get list of change orders based on a set of conditions',
			method: 'GET',
			path: '/vaults/{vaultId}/change-orders',
			fields: [
				vaultId,
				sort,
				{
					displayName: 'Filter Assignees',
					name: 'filterAssignees',
					type: 'string',
					default: '',
					description:
						'Search filter to include only change orders that assignees user list can perform. ex: filter[assignees]=1,2,3,4.',
				},
				{
					displayName: 'Filter Open Cos Only',
					name: 'filterOpenCOsOnly',
					type: 'boolean',
					default: false,
					description: 'Whether to include only open change orders',
				},
				{
					displayName: 'State',
					name: 'ecoState',
					type: 'string',
					default: '',
					placeholder: 'e.g. open',
					description:
						"Search filter to include only change orders that match state property. e.g. 'open'.",
				},
				q,
				propDefIds,
				extendedModels,
			],
			query: {
				q: 'q',
				'filter[State]': 'ecoState',
				'filter[assignees]': 'filterAssignees',
				'filter[openCOsOnly]': 'filterOpenCOsOnly',
				'option[extendedModels]': 'extendedModels',
				'option[propDefIds]': 'propDefIds',
				sort: 'sort',
			},
			response: 'collection',
		}),
	],
});
