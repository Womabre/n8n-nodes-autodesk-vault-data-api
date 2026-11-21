import type { IDataObject, INodeProperties } from 'n8n-workflow';
import { defineBody } from '../definition/body';
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

/** Turns the selected folder IDs into the folder URLs the search body expects. */
export const folderUrlsBody = defineBody({
	reads: { vaultId: undefined, foldersToSearch: [] },
	build(values) {
		const folderIds = values.foldersToSearch as string[];
		if (!Array.isArray(folderIds)) return {};
		const basePath = `${API_BASE}/vaults/${values.vaultId as string}/folders/`;
		return { foldersToSearch: folderIds.map((id) => `${basePath}${id}`) };
	},
});

/** Prefixes bare property definition IDs in search and sort criteria with their URL. */
export const criteriaUrlsBody = defineBody({
	reads: { vaultId: undefined, searchCriteria: {}, sortCriteria: {} },
	build(values) {
		const vaultId = values.vaultId as string;
		const withUrls = (criteria: SearchCriterion[]) =>
			criteria.map((criterion) =>
				criterion?.propertyDefinitionUrl &&
				typeof criterion.propertyDefinitionUrl === 'string' &&
				!criterion.propertyDefinitionUrl.startsWith('/AutodeskDM')
					? {
							...criterion,
							propertyDefinitionUrl: `${API_BASE}/vaults/${vaultId}/property-definitions/${criterion.propertyDefinitionUrl}`,
						}
					: criterion,
			);

		const body: IDataObject = {};
		const search = (values.searchCriteria as CriteriaWrapper | null)?.criteria;
		const sortBy = (values.sortCriteria as CriteriaWrapper | null)?.criteria;
		if (Array.isArray(search)) body.searchCriteria = withUrls(search);
		if (Array.isArray(sortBy)) body.sortCriteria = withUrls(sortBy);
		return body;
	},
});

/** Body for `POST /vaults/{vaultId}:advanced-search`: folder URLs and criteria URLs. */
export const searchBody = defineBody({
	reads: { ...folderUrlsBody.reads, ...criteriaUrlsBody.reads },
	build(values, fail) {
		return {
			...(folderUrlsBody.build(values, fail) as IDataObject),
			...(criteriaUrlsBody.build(values, fail) as IDataObject),
		};
	},
});

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
			buildBody: searchBody,
			response: 'collection',
		}),
	],
});
