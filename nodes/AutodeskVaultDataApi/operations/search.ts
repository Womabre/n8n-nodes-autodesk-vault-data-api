import { IExecuteSingleFunctions, IHttpRequestOptions, INodeProperties } from 'n8n-workflow';
import { API_BASE } from '../utils/constants';
import { defineOperation, defineResource } from '../definition/defineOperation';
import {
	extendedModels,
	latestOnly,
	propDefIds,
	q,
	releasedFilesOnly,
	releasedItemsOnly,
	sort,
	vaultId,
} from '../definition/fields';
import { listLoadOptions } from '../definition/loadOptions';

interface SearchCriterion {
	propertyDefinitionUrl?: string;
	[key: string]: unknown;
}

interface CriteriaWrapper {
	criteria?: SearchCriterion[];
}

const searchSubFolders: INodeProperties = {
	displayName: 'Search Subfolders',
	name: 'searchSubFolders',
	type: 'boolean',
	default: false,
	description: 'Whether to search subfolders',
};

export const resource = defineResource({
	value: 'search',
	defaultOperation: 'search',
	operations: [
		defineOperation({
			name: 'Search',
			value: 'search',
			action: 'Search',
			description:
				'Find entities using a query string. The text is searched across all properties or both properties and content based on options passed.',
			method: 'GET',
			path: '/vaults/{vaultId}/search-results',
			fields: [
				vaultId,
				{
					displayName: 'Search Content',
					name: 'searchContent',
					type: 'boolean',
					default: false,
					description: 'Whether to search the full content of the file',
				},
				searchSubFolders,
				releasedFilesOnly,
				releasedItemsOnly,
				latestOnly,
				sort,
				q,
				propDefIds,
				extendedModels,
			],
			query: {
				q: 'q?',
				'option[searchContent]': 'searchContent?',
				'option[searchSubFolders]': 'searchSubFolders?',
				'option[releasedFilesOnly]': 'releasedFilesOnly?',
				'option[releasedItemsOnly]': 'releasedItemsOnly?',
				'option[latestOnly]': 'latestOnly?',
				'option[extendedModels]': 'extendedModels?',
				'option[propDefIds]': 'propDefIds?',
				sort: 'sort?',
			},
			response: 'collection',
		}),
		defineOperation({
			name: 'Advanced Search',
			value: 'advancedSearch',
			action: 'Advanced search',
			description: 'Advanced search with filters, folder scoping and custom criteria',
			method: 'POST',
			path: '/vaults/{vaultId}:advanced-search',
			fields: [
				vaultId,
				searchSubFolders,
				releasedFilesOnly,
				releasedItemsOnly,
				latestOnly,
				{
					displayName: 'Entity Types To Search',
					name: 'entityTypesToSearch',
					type: 'multiOptions',
					options: [
						{ name: 'Change Order', value: 'ChangeOrder' },
						{ name: 'File', value: 'File' },
						{ name: 'Folder', value: 'Folder' },
						{ name: 'Item', value: 'Item' },
					],
					default: ['ChangeOrder', 'File', 'Folder', 'Item'],
					description:
						'EntityTypes to search. If null or empty value is passed, it will include results from all entity types.',
				},
				{
					displayName: 'Folder IDs',
					name: 'foldersToSearch',
					type: 'string',
					typeOptions: { multipleValues: true },
					default: [],
					placeholder: 'e.g. 1, 2, 3',
					description:
						'IDs of the folders to restrict the search to (just the numbers, e.g. 1, 2, 3)',
				},
				{
					displayName: 'Search Criteria',
					name: 'searchCriteria',
					type: 'fixedCollection',
					typeOptions: { multipleValues: true },
					default: {},
					options: [
						{
							name: 'criteria',
							displayName: 'Criteria',
							values: [
								{
									displayName: 'Property Name',
									name: 'propertyDefinitionUrl',
									type: 'options',
									typeOptions: {
										loadOptionsDependsOn: ['vaultId'],
										loadOptions: listLoadOptions(
											`=${API_BASE}/vaults/{{$parameter["vaultId"]}}/property-definitions`,
											'={{$responseItem.displayName}} (Type: {{$responseItem.dataType}})',
										),
									},
									default: '',
									description: 'ID of the property definition',
								},
								{
									displayName: 'Operator',
									name: 'operator',
									type: 'options',
									options: [
										{ name: 'Contains', value: 'Contains' },
										{ name: 'Does Not Contain', value: 'DoesNotContain' },
										{ name: 'Greater Than', value: 'GreaterThan' },
										{ name: 'Greater Than Or Equal', value: 'GreaterThanOrEqualTo' },
										{ name: 'Is Empty', value: 'IsEmpty' },
										{ name: 'Is Exactly', value: 'IsExactly' },
										{ name: 'Is Not Empty', value: 'IsNotEmpty' },
										{ name: 'Less Than', value: 'LessThan' },
										{ name: 'Less Than Or Equal', value: 'LessThanOrEqualTo' },
										{ name: 'Not Equal To', value: 'NotEqualTo' },
										{ name: 'Unknown', value: 'Unknown' },
									],
									default: 'Contains',
								},
								{
									displayName: 'Search String',
									name: 'searchString',
									type: 'string',
									default: '',
									description: 'The value to use for the search',
									placeholder: 'e.g. SM-TEST-01',
								},
							],
						},
					],
					displayOptions: { hide: { vaultId: [''] } },
				},
				{
					displayName: 'Sort Criteria',
					name: 'sortCriteria',
					type: 'fixedCollection',
					typeOptions: { multipleValues: true },
					default: {},
					description:
						'Sort criteria for the search results. Specify the property definition URL and whether to sort in ascending order.',
					options: [
						{
							name: 'criteria',
							displayName: 'Criteria',
							values: [
								{
									displayName: 'Property Definition Name or ID',
									name: 'propertyDefinitionUrl',
									type: 'options',
									typeOptions: {
										loadOptionsDependsOn: ['vaultId'],
										loadOptions: listLoadOptions(
											`=${API_BASE}/vaults/{{$parameter["vaultId"]}}/property-definitions`,
											'={{$responseItem.displayName}} (Id: {{$responseItem.id}})',
										),
									},
									default: '',
									description: 'ID of the property definition',
								},
								{
									displayName: 'Ascending?',
									name: 'ascending',
									type: 'boolean',
									default: true,
									description: 'Whether the sort order is ascending',
								},
							],
						},
					],
					displayOptions: { hide: { vaultId: [''] } },
				},
				propDefIds,
				extendedModels,
			],
			query: {
				'option[searchSubFolders]': 'searchSubFolders?',
				'option[releasedFilesOnly]': 'releasedFilesOnly?',
				'option[releasedItemsOnly]': 'releasedItemsOnly?',
				'option[latestOnly]': 'latestOnly?',
				'option[extendedModels]': 'extendedModels?',
				'option[propDefIds]': 'propDefIds?',
			},
			body: { entityTypesToSearch: 'entityTypesToSearch?' },
			preSend: [formatFolderUrls, formatPropertyDefinitionUrls],
			response: 'collection',
		}),
	],
});

export async function formatFolderUrls(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const vaultId = this.getNodeParameter('vaultId') as string;
	const folderIds = this.getNodeParameter('foldersToSearch', []) as string[];

	// Ensure body is defined
	if (!requestOptions.body || typeof requestOptions.body !== 'object') {
		requestOptions.body = {};
	}
	const body = requestOptions.body as Record<string, unknown>;

	if (Array.isArray(folderIds)) {
		const basePath = `${API_BASE}/vaults/${vaultId}/folders/`;
		body.foldersToSearch = folderIds.map((id) => `${basePath}${id}`);
	}
	return requestOptions;
}

export async function formatPropertyDefinitionUrls(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const vaultId = this.getNodeParameter('vaultId') as string;
	const searchWrapper = this.getNodeParameter('searchCriteria', {}) as CriteriaWrapper;
	const sortWrapper = this.getNodeParameter('sortCriteria', {}) as CriteriaWrapper;

	// Ensure the body exists and is an object
	if (!requestOptions.body || typeof requestOptions.body !== 'object') {
		requestOptions.body = {};
	}
	const body = requestOptions.body as Record<string, unknown>;

	// Format searchCriteria if criteria array exists
	if (Array.isArray(searchWrapper?.criteria)) {
		body.searchCriteria = searchWrapper.criteria.map((criteria) => {
			if (
				criteria?.propertyDefinitionUrl &&
				typeof criteria.propertyDefinitionUrl === 'string' &&
				!criteria.propertyDefinitionUrl.startsWith('/AutodeskDM')
			) {
				criteria.propertyDefinitionUrl = `${API_BASE}/vaults/${vaultId}/property-definitions/${criteria.propertyDefinitionUrl}`;
			}
			return criteria;
		});
	}

	// Format sortCriteria if criteria array exists
	if (Array.isArray(sortWrapper?.criteria)) {
		body.sortCriteria = sortWrapper.criteria.map((criteria) => {
			if (
				criteria?.propertyDefinitionUrl &&
				typeof criteria.propertyDefinitionUrl === 'string' &&
				!criteria.propertyDefinitionUrl.startsWith('/AutodeskDM')
			) {
				criteria.propertyDefinitionUrl = `${API_BASE}/vaults/${vaultId}/property-definitions/${criteria.propertyDefinitionUrl}`;
			}
			return criteria;
		});
	}

	return requestOptions;
}
