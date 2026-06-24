"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.operations = void 0;
exports.formatFolderUrls = formatFolderUrls;
exports.formatPropertyDefinitionUrls = formatPropertyDefinitionUrls;
exports.operations = [
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
                            sort: '={{$parameter["sort"] || undefined}}',
                            limit: '={{$parameter["limit"] || undefined}}',
                            cursorState: '={{$parameter["cursorState"] || undefined}}',
                        },
                    },
                    output: {
                        postReceive: [
                            {
                                type: 'rootProperty',
                                properties: {
                                    property: 'results',
                                },
                            },
                        ],
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
                        preSend: [formatFolderUrls, formatPropertyDefinitionUrls],
                    },
                    request: {
                        method: 'POST',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}:advanced-search',
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
                    output: {
                        postReceive: [
                            {
                                type: 'rootProperty',
                                properties: {
                                    property: 'results',
                                },
                            },
                        ],
                    },
                },
            },
        ],
        default: 'search',
    },
];
async function formatFolderUrls(requestOptions) {
    const vaultId = this.getNodeParameter('vaultId', 0);
    const folderIds = this.getNodeParameter('foldersToSearch', 0);
    if (!requestOptions.body || typeof requestOptions.body !== 'object') {
        requestOptions.body = {};
    }
    const body = requestOptions.body;
    if (Array.isArray(folderIds)) {
        const basePath = `/AutodeskDM/Services/api/vault/v2/vaults/${vaultId}/folders/`;
        body.foldersToSearch = folderIds.map((id) => `${basePath}${id}`);
    }
    return requestOptions;
}
async function formatPropertyDefinitionUrls(requestOptions) {
    const vaultId = this.getNodeParameter('vaultId', 0);
    const searchWrapper = this.getNodeParameter('searchCriteria', 0);
    const sortWrapper = this.getNodeParameter('sortCriteria', 0);
    if (!requestOptions.body || typeof requestOptions.body !== 'object') {
        requestOptions.body = {};
    }
    const body = requestOptions.body;
    if (Array.isArray(searchWrapper === null || searchWrapper === void 0 ? void 0 : searchWrapper.criteria)) {
        body.searchCriteria = searchWrapper.criteria.map((criteria) => {
            if ((criteria === null || criteria === void 0 ? void 0 : criteria.propertyDefinitionUrl) &&
                typeof criteria.propertyDefinitionUrl === 'string' &&
                !criteria.propertyDefinitionUrl.startsWith('/AutodeskDM')) {
                criteria.propertyDefinitionUrl = `/AutodeskDM/Services/api/vault/v2/vaults/${vaultId}/property-definitions/${criteria.propertyDefinitionUrl}`;
            }
            return criteria;
        });
    }
    if (Array.isArray(sortWrapper === null || sortWrapper === void 0 ? void 0 : sortWrapper.criteria)) {
        body.sortCriteria = sortWrapper.criteria.map((criteria) => {
            if ((criteria === null || criteria === void 0 ? void 0 : criteria.propertyDefinitionUrl) &&
                typeof criteria.propertyDefinitionUrl === 'string' &&
                !criteria.propertyDefinitionUrl.startsWith('/AutodeskDM')) {
                criteria.propertyDefinitionUrl = `/AutodeskDM/Services/api/vault/v2/vaults/${vaultId}/property-definitions/${criteria.propertyDefinitionUrl}`;
            }
            return criteria;
        });
    }
    return requestOptions;
}
//# sourceMappingURL=search.js.map