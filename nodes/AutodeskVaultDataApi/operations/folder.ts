import { INodeProperties } from 'n8n-workflow';
import { lifecycleDefinitionsBody, lifecycleStatesBody } from '../utils/lifecycleBody';
import { defineOperation, defineResource } from '../definition/defineOperation';
import {
	extendedModels,
	latestOnly,
	lifecycleComment,
	propDefIds,
	q,
	releasedFilesOnly,
	releasedItemsOnly,
	sort,
	vaultId,
} from '../definition/fields';
import { resourceLocatorModes } from '../definition/loadOptions';

const folderId: INodeProperties = {
	displayName: 'Folder',
	name: 'folderId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	description:
		'The folder to use. Select one from the list, or provide the numeric folder ID directly ("1" is the root folder).',
	...resourceLocatorModes('searchFolders', 'e.g. 1', {
		idHint: '"1" is the root folder ID',
		idRegex: '^([0-9]+|root)$',
		idError: 'Enter a numeric folder ID (e.g. 1) or "root"',
	}),
	displayOptions: { hide: { vaultId: [''] } },
};

export const resource = defineResource({
	value: 'folders',
	defaultOperation: 'getFolderById',
	operations: [
		defineOperation({
			name: 'Get Folder',
			value: 'getFolderById',
			action: 'Get folder',
			description:
				'Retrieve the folder object with the specified ID. Use "root" to get the root folder.',
			method: 'GET',
			path: '/vaults/{vaultId}/folders/{folderId}',
			fields: [vaultId, folderId],
			response: 'single',
		}),
		defineOperation({
			name: 'Get Folder Contents',
			value: 'getFolderContents',
			action: 'Get folder contents',
			description: 'Retrieve folder objects and children under the specified folder ID',
			method: 'GET',
			path: '/vaults/{vaultId}/folders/{folderId}/contents',
			fields: [
				vaultId,
				{
					displayName: 'Search Content',
					name: 'searchContent',
					type: 'boolean',
					default: false,
					description: 'Whether to search the full content of the file',
				},
				{
					displayName: 'Search Subfolders',
					name: 'searchSubFolders',
					type: 'boolean',
					default: false,
					description: 'Whether to search subfolders',
				},
				releasedFilesOnly,
				releasedItemsOnly,
				latestOnly,
				sort,
				folderId,
				{
					displayName: 'Include Folders',
					name: 'includeFolders',
					type: 'boolean',
					default: false,
					description: 'Whether to include folders or folder links in the search results',
				},
				{
					displayName: 'Include Item ECO Links',
					name: 'includeItemEcoLinks',
					type: 'boolean',
					default: true,
					description: 'Whether to include Item/Change Order links in the search results',
				},
				q,
				propDefIds,
				extendedModels,
			],
			query: {
				q: 'q',
				'option[searchContent]': 'searchContent',
				'option[searchSubFolders]': 'searchSubFolders',
				'option[includeFolders]': 'includeFolders',
				'option[includeItemEcoLinks]': 'includeItemEcoLinks',
				'option[releasedFilesOnly]': 'releasedFilesOnly',
				'option[releasedItemsOnly]': 'releasedItemsOnly',
				'option[latestOnly]': 'latestOnly',
				'option[extendedModels]': 'extendedModels',
				'option[propDefIds]': 'propDefIds',
				sort: 'sort',
			},
			response: 'collection',
		}),
		defineOperation({
			name: 'Get Folder Subfolders',
			value: 'getFolderSubFolders',
			action: 'Get folder subfolders',
			description: 'Retrieve the immediate subfolders of the specified folder ID',
			method: 'GET',
			path: '/vaults/{vaultId}/folders/{folderId}/sub-folders',
			fields: [vaultId, folderId, propDefIds, extendedModels],
			query: { 'option[extendedModels]': 'extendedModels', 'option[propDefIds]': 'propDefIds' },
			response: 'collection',
		}),
		defineOperation({
			name: 'Update Folder Lifecycle Definitions',
			value: 'updateFolderLifecycleDefinitions',
			action: 'Update folder lifecycle definitions',
			description:
				'Move folders onto a different lifecycle definition. Each entry needs a definition and a state that belongs to it.',
			method: 'POST',
			path: '/vaults/{vaultId}/folders:update-lifecycle-definitions',
			fields: [
				vaultId,
				{
					displayName: 'Definition Updates',
					name: 'lifecycleDefinitionUpdates',
					type: 'fixedCollection',
					typeOptions: { multipleValues: true },
					default: {},
					description:
						'One entry per entity. The lifecycle state must belong to the lifecycle definition given on the same entry.',
					options: [
						{
							displayName: 'Update',
							name: 'update',
							values: [
								{
									displayName: 'Entity ID',
									name: 'entityId',
									type: 'string',
									default: '',
									placeholder: 'e.g. 55',
									description:
										'The master ID of the file or item, or the folder ID, whose lifecycle should change',
								},
								{
									displayName: 'Lifecycle Definition ID',
									name: 'lifecycleDefinitionId',
									type: 'string',
									default: '',
									placeholder: 'e.g. 2',
									description: 'The ID of the target lifecycle definition',
								},
								{
									displayName: 'Lifecycle State ID',
									name: 'lifecycleStateId',
									type: 'string',
									default: '',
									placeholder: 'e.g. 9',
									description: 'The ID of a state that belongs to the target lifecycle definition',
								},
							],
						},
					],
				},
				lifecycleComment,
			],
			buildBody: lifecycleDefinitionsBody('folders'),
			response: 'collection',
			paginated: false, // a lifecycle update returns the entities it changed; 2.0.1 never paged it
		}),
		defineOperation({
			name: 'Update Folder Lifecycle States',
			value: 'updateFolderLifecycleStates',
			action: 'Update folder lifecycle states',
			description: 'Update the lifecycle state of one or more folders by folder ID',
			method: 'POST',
			path: '/vaults/{vaultId}/folders:update-states',
			fields: [
				vaultId,
				{
					displayName: 'State Updates',
					name: 'lifecycleStateUpdates',
					type: 'fixedCollection',
					typeOptions: { multipleValues: true },
					default: {},
					description: 'One entry per entity whose lifecycle state should change',
					options: [
						{
							displayName: 'Update',
							name: 'update',
							values: [
								{
									displayName: 'Entity ID',
									name: 'entityId',
									type: 'string',
									default: '',
									placeholder: 'e.g. 55',
									description:
										'The master ID of the file or item, or the folder ID, whose state should change',
								},
								{
									displayName: 'Lifecycle State ID',
									name: 'lifecycleStateId',
									type: 'string',
									default: '',
									placeholder: 'e.g. 2',
									description: 'The ID of the target lifecycle state',
								},
							],
						},
					],
				},
				lifecycleComment,
			],
			buildBody: lifecycleStatesBody('folders'),
			response: 'collection',
			paginated: false, // a lifecycle update returns the entities it changed; 2.0.1 never paged it
		}),
	],
});
