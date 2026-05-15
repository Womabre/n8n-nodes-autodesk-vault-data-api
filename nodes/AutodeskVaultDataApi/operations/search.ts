import { IExecuteSingleFunctions, IHttpRequestOptions, INodeProperties } from 'n8n-workflow';

export const operations: INodeProperties[] = [
	// Search: search, advancedSearch
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['search'],
			},
		},
		options: [
			{
				name: 'Search',
				value: 'search',
				action: 'Search',
				description: 'Find entities using a query string. The text is searched across all properties or both properties and content based on options passed.',
				routing: {
					request: {
						method: 'GET',
						url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/search-results',
						qs: {
							q: '={{$parameter["q"] || undefined}}',
							'option[searchContent]': '={{$parameter["searchContent"] || undefined}}',
							'option[searchSubFolders]': '={{$parameter["searchSubFolders"] || undefined}}',
							'option[releasedFilesOnly]': '={{$parameter["releasedFilesOnly"] || undefined}}',
							'option[releasedItemsOnly]': '={{$parameter["releasedItemsOnly"] || undefined}}',
							'option[latestOnly]': '={{$parameter["latestOnly"] || undefined}}',
							'option[extendedModels]': '={{$parameter["extendedModels"] || undefined}}',
							'option[propDefIds]': '={{$parameter["propDefIds"] || undefined}}',
							sort: '={{$parameter["sort"]}}',
							limit: '={{$parameter["limit"] || undefined}}',
							cursorState: '={{$parameter["cursorState"] || undefined}}',
						},
						headers: {
							Authorization: '=Bearer {{$credentials.accessToken}}',
						},
					},
				},
			},
			{
				name: 'Advanced Search',
				value: 'advancedSearch',
				action: 'Advanced search',
				description: 'Advanced search with filters, folder scoping and custom criteria',
				routing: {
					send: {
						preSend: [
							formatFolderUrls,
							formatPropertyDefinitionUrls
						],
					},
					request: {
						method: 'POST',
						url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}:advanced-search',
						headers: {
							Authorization: '=Bearer {{$credentials.accessToken}}',
						},
						qs: {
							'option[searchSubFolders]': '={{$parameter["searchSubFolders"] || undefined}}',
							'option[releasedFilesOnly]': '={{$parameter["releasedFilesOnly"] || undefined}}',
							'option[releasedItemsOnly]': '={{$parameter["releasedItemsOnly"] || undefined}}',
							'option[latestOnly]': '={{$parameter["latestOnly"] || undefined}}',
							'option[extendedModels]': '={{$parameter["extendedModels"] || undefined}}',
							'option[propDefIds]': '={{$parameter["propDefIds"] || undefined}}',
							limit: '={{$parameter["limit"] || undefined}}',
							cursorState: '={{$parameter["cursorState"] || undefined}}',
						},
						body: {
							entityTypesToSearch: '={{$parameter["entityTypesToSearch"] || undefined}}',
						},
					},
				},
			},
		],
		default: 'search',
	},
];

export async function formatFolderUrls(this: IExecuteSingleFunctions, requestOptions: IHttpRequestOptions): Promise<IHttpRequestOptions> {
	const vaultId = this.getNodeParameter('vaultId', 0);
	const folderIds = this.getNodeParameter('foldersToSearch', 0) as string[];

	// Ensure body is defined
	if (!requestOptions.body || typeof requestOptions.body !== 'object') {
		requestOptions.body = {};
	}
	const body = requestOptions.body as Record<string, any>;

	if (Array.isArray(folderIds)) {
		const basePath = `/AutodeskDM/Services/api/vault/v2/vaults/${vaultId}/folders/`;
		body.foldersToSearch = folderIds.map(id => `${basePath}${id}`);
	}
	return requestOptions;
}


export async function formatPropertyDefinitionUrls(this: IExecuteSingleFunctions, requestOptions: IHttpRequestOptions,): Promise<IHttpRequestOptions> {
	const vaultId = this.getNodeParameter('vaultId', 0);
	const searchWrapper = this.getNodeParameter('searchCriteria', 0) as { criteria?: any[] };
	const sortWrapper = this.getNodeParameter('sortCriteria', 0) as { criteria?: any[] };

	// Ensure the body exists and is an object
	if (!requestOptions.body || typeof requestOptions.body !== 'object') {
		requestOptions.body = {};
	}
	const body = requestOptions.body as Record<string, any>;

	// Format searchCriteria if criteria array exists
	if (Array.isArray(searchWrapper?.criteria)) {
		body.searchCriteria = searchWrapper.criteria.map((criteria) => {
			if (
				criteria?.propertyDefinitionUrl &&
				typeof criteria.propertyDefinitionUrl === 'string' &&
				!criteria.propertyDefinitionUrl.startsWith('/AutodeskDM')
			) {
				criteria.propertyDefinitionUrl = `/AutodeskDM/Services/api/vault/v2/vaults/${vaultId}/property-definitions/${criteria.propertyDefinitionUrl}`;
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
				criteria.propertyDefinitionUrl = `/AutodeskDM/Services/api/vault/v2/vaults/${vaultId}/property-definitions/${criteria.propertyDefinitionUrl}`;
			}
			return criteria;
		});
	}

	return requestOptions;
}
