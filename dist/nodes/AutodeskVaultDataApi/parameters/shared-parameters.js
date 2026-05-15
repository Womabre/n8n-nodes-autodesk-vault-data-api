"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parameters = void 0;
exports.parameters = [
    {
        displayName: 'Vault Name',
        name: 'vaultId',
        type: 'options',
        typeOptions: {
            loadOptions: {
                routing: {
                    request: {
                        method: 'GET',
                        url: '/AutodeskDM/Services/api/vault/v2/vaults',
                        qs: {
                            limit: '1000',
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
                            {
                                type: 'setKeyValue',
                                properties: {
                                    name: '={{$responseItem.name}}',
                                    value: '={{$responseItem.id}}',
                                },
                            },
                            {
                                type: 'sort',
                                properties: {
                                    key: 'name',
                                },
                            },
                        ],
                    },
                },
            }
        },
        required: true,
        description: 'The ID of the knowledge vault to retrieve. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
        displayOptions: {
            show: {
                resource: [
                    'changeOrders',
                    'files',
                    'folders',
                    'informational',
                    'items',
                    'jobs',
                    'links',
                    'options',
                    'property',
                    'search',
                ],
                operation: [
                    'getChangeOrders',
                    'getChangeOrderById',
                    'getChangeOrderRelatedFiles',
                    'getChangeOrderAssociatedEntities',
                    'getChangeOrderComments',
                    'getChangeOrderCommentAttachments',
                    'getFileVersions',
                    'getFileVersionById',
                    'getFileVersionSignedUrl',
                    'getFileVersionContent',
                    'getFileVersionContentHead',
                    'getFileVersionLmvRoot',
                    'getFileVersionAssociatedItemVersions',
                    'getFileVersionMarkups',
                    'getFileVersionMarkupById',
                    'getFileVersionThumbnailById',
                    'getFileVersionVisualizationAttachments',
                    'getFileVersionUses',
                    'getFileVersionWhereUsed',
                    'getFileById',
                    'getFileAssociatedChangeOrders',
                    'getFileHistory',
                    'getFolderById',
                    'getFolderContents',
                    'getFolderSubFolders',
                    'getVaultById',
                    'getItemVersions',
                    'getItemVersionById',
                    'getItemVersionAssociatedFiles',
                    'getItemVersionBom',
                    'getItemVersionWhereUsed',
                    'getItemVersionThumbnail',
                    'getItems',
                    'getItemById',
                    'getItemAssociatedChangeOrders',
                    'getItemHistory',
                    'addJob',
                    'getJobQueueEnabled',
                    'getJobsById',
                    'getLinks',
                    'getLinkById',
                    'getVaultOptions',
                    'createVaultOption',
                    'getVaultOptionById',
                    'updateVaultOptionById',
                    'deleteVaultOptionById',
                    'getPropertyDefinitions',
                    'getPropertyDefinitionById',
                    'search',
                    'advancedSearch',
                ],
            },
        },
        default: '',
    },
    {
        displayName: 'Session ID',
        name: 'sessionId',
        type: 'string',
        required: true,
        default: '@current',
        description: 'The ID of the session. Use @current for current session.',
        displayOptions: {
            show: {
                resource: ['auth'],
                operation: ['getSessionById', 'deleteSession'],
            },
        },
    },
    {
        displayName: 'Group Name',
        name: 'groupId',
        type: 'options',
        typeOptions: {
            loadOptions: {
                routing: {
                    request: {
                        method: 'GET',
                        url: '/AutodeskDM/Services/api/vault/v2/groups',
                        qs: {
                            limit: '1000',
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
                            {
                                type: 'setKeyValue',
                                properties: {
                                    name: '={{$responseItem.name}}',
                                    value: '={{$responseItem.id}}',
                                },
                            },
                            {
                                type: 'sort',
                                properties: {
                                    key: 'name',
                                },
                            },
                        ],
                    },
                },
            }
        },
        required: true,
        description: 'The ID of the group to retrieve',
        hint: 'You can find the group ID in the response of "Get All Groups" operation',
        displayOptions: {
            show: {
                resource: ['accounts',],
                operation: ['getGroupById', 'getAccountByAuthType',]
            },
        },
        default: '',
    },
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
        displayOptions: {
            show: {
                resource: ['accounts'],
                operation: ['getAccountByAuthType', 'getUserAccountByAuthType'],
            },
        },
    },
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
        displayOptions: {
            show: {
                resource: ['accounts'],
                operation: ['getProfileAttributeDefinitions'],
            },
        },
    },
    {
        displayName: 'Profile Attribute Definition ID',
        name: 'profileAttributeDefId',
        type: 'string',
        required: true,
        placeholder: 'e.g. 1234',
        description: 'The unique identifier of a profile attribute definition',
        displayOptions: {
            show: {
                resource: ['accounts'],
                operation: ['getProfileAttributeDefinitionById'],
            },
        },
        default: '',
    },
    {
        displayName: 'Role ID',
        name: 'roleId',
        type: 'string',
        required: true,
        placeholder: 'e.g. 1234',
        description: 'The unique identifier of a role',
        displayOptions: {
            show: {
                resource: ['accounts'],
                operation: ['getRoleById'],
            },
        },
        default: '',
    },
    {
        displayName: 'User ID',
        name: 'userId',
        type: 'string',
        required: true,
        default: '',
        placeholder: 'e.g. 1234',
        description: 'The unique identifier of a user',
        displayOptions: {
            show: {
                resource: ['accounts'],
                operation: ['getUserById', 'getUserAccounts', 'getUserAccountByAuthType'],
            },
        },
    },
    {
        displayName: 'Filter by Name',
        name: 'filterName',
        type: 'string',
        default: '',
        description: 'Return only options that exactly match this name',
        displayOptions: {
            show: {
                resource: ['options'],
                operation: ['getSystemOptions'],
            },
        },
    },
    {
        displayName: 'Option Name',
        name: 'optionName',
        type: 'string',
        required: true,
        default: '',
        placeholder: 'e.g. MyOption',
        description: 'The name of the system option',
        displayOptions: {
            show: {
                resource: ['options'],
                operation: ['createSystemOption', 'createVaultOption',],
            },
        },
    },
    {
        displayName: 'Option Value',
        name: 'optionValue',
        type: 'string',
        required: true,
        default: '',
        placeholder: 'e.g. true',
        description: 'The value of the system option',
        displayOptions: {
            show: {
                resource: ['options'],
                operation: ['createSystemOption', 'updateSystemOptionById', 'createVaultOption', 'updateVaultOptionById'],
            },
        },
    },
    {
        displayName: 'System Option ID',
        name: 'systemOptionId',
        type: 'string',
        required: true,
        default: '',
        placeholder: 'e.g. 1234',
        description: 'The unique identifier of a system option',
        displayOptions: {
            show: {
                resource: ['options'],
                operation: ['getSystemOptionById', 'updateSystemOptionById', 'deleteSystemOptionById'],
            },
        },
    },
    {
        displayName: 'Vault Option ID',
        name: 'vaultOptionId',
        type: 'string',
        required: true,
        default: '',
        placeholder: 'e.g. 1234',
        description: 'The unique identifier of a vault option',
        displayOptions: {
            show: {
                resource: ['options'],
                operation: ['getVaultOptionById', 'updateVaultOptionById', 'deleteVaultOptionById'],
            },
        },
    },
    {
        displayName: 'Name Starts With',
        name: 'nameStartsWith',
        type: 'string',
        default: '',
        description: 'Filter options that start with this string',
        displayOptions: {
            show: {
                resource: ['vaultOptions'],
                operation: ['getVaultOptions'],
            },
        },
    },
    {
        displayName: 'Property Definition ID',
        name: 'propertyDefId',
        type: 'options',
        typeOptions: {
            loadOptions: {
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/property-definitions',
                        qs: {
                            limit: '1000',
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
                            {
                                type: 'setKeyValue',
                                properties: {
                                    name: '={{$responseItem.displayName}} (Id: {{$responseItem.id}})',
                                    value: '={{$responseItem.id}}',
                                },
                            },
                            {
                                type: 'sort',
                                properties: {
                                    key: 'name',
                                },
                            },
                        ],
                    },
                },
            }
        },
        required: true,
        default: '',
        description: 'The unique identifier of the property definition',
        displayOptions: {
            show: {
                resource: ['property'],
                operation: ['getPropertyDefinitionById'],
            },
            hide: {
                vaultId: [''],
            },
        },
    },
    {
        displayName: 'Entity Class ID',
        name: 'entityClassId',
        type: 'options',
        default: '',
        description: 'Entity class to filter by. Leave empty to return all.',
        options: [
            { name: 'All', value: '' },
            { name: 'Change Order', value: 'CO' },
            { name: 'File', value: 'FILE' },
            { name: 'Folder', value: 'FLDR' },
            { name: 'Item', value: 'ITEM' },
        ],
        displayOptions: {
            show: {
                resource: ['property'],
                operation: ['getPropertyDefinitions'],
            },
        },
    },
    {
        displayName: 'System Names',
        name: 'systemNames',
        type: 'string',
        default: '',
        description: 'Comma-separated list of property system names to filter',
        displayOptions: {
            show: {
                resource: ['property'],
                operation: ['getPropertyDefinitions'],
            },
        },
    },
    {
        displayName: 'Include BOM Association Property',
        name: 'includeBOMAssociationProperty',
        type: 'boolean',
        default: false,
        description: 'Whether to include BOM association property definitions',
        displayOptions: {
            show: {
                resource: ['items', 'property'],
                operation: ['getItemVersionBom', 'getPropertyDefinitions'],
            },
        },
    },
    {
        displayName: 'Search Content',
        name: 'searchContent',
        type: 'boolean',
        default: false,
        description: 'Whether to search the full content of the file',
        displayOptions: {
            show: {
                resource: ['folders', 'search'],
                operation: ['getFolderContents', 'search'],
            },
        },
    },
    {
        displayName: 'Search Subfolders',
        name: 'searchSubFolders',
        type: 'boolean',
        default: false,
        description: 'Whether to search subfolders',
        displayOptions: {
            show: {
                resource: ['folders', 'search'],
                operation: ['getFolderContents', 'search', 'advancedSearch'],
            },
        },
    },
    {
        displayName: 'Released Files Only',
        name: 'releasedFilesOnly',
        type: 'boolean',
        default: false,
        description: 'Whether to include only file versions in a consumable (released) state',
        displayOptions: {
            show: {
                resource: ['changeOrders', 'files', 'folders', 'search'],
                operation: ['getChangeOrderAssociatedEntities', 'getFileVersions', 'getFolderContents', 'search', 'advancedSearch'],
            },
        },
    },
    {
        displayName: 'Released Items Only',
        name: 'releasedItemsOnly',
        type: 'boolean',
        default: false,
        description: 'Whether to include only item versions in a consumable (released) state',
        displayOptions: {
            show: {
                resource: ['changeOrders', 'folders', 'items', 'search'],
                operation: ['getChangeOrderAssociatedEntities', 'getFolderContents', 'getItemVersions', 'search', 'advancedSearch'],
            },
        },
    },
    {
        displayName: 'Latest Only',
        name: 'latestOnly',
        type: 'boolean',
        default: true,
        description: 'Whether to include only the latest version',
        displayOptions: {
            show: {
                resource: ['files', 'folders', 'items', 'search'],
                operation: ['getFileVersions', 'getFolderContents', 'getItemVersions', 'search', 'advancedSearch'],
            },
        },
    },
    {
        displayName: 'Sort Criteria',
        name: 'sort',
        type: 'string',
        default: 'Name asc',
        required: true,
        description: 'Specifies sorting criteria for search results. Format: {propertyDefSysName} {sort-order} Accepted values for sort-order: asc, desc. Ex: sort = Revision desc,Name asc',
        placeholder: 'e.g. Revision desc,Name asc',
        displayOptions: {
            show: {
                resource: ['items'],
                operation: ['getItemVersions'],
            },
        },
    },
    {
        displayName: 'Sort Criteria',
        name: 'sort',
        type: 'string',
        default: '',
        description: 'Specifies sorting criteria for search results. Format: {propertyDefSysName} {sort-order} Accepted values for sort-order: asc, desc. Ex: sort = Revision desc,Name asc',
        placeholder: 'e.g. Revision desc,Name asc',
        displayOptions: {
            show: {
                resource: ['changeOrders', 'files', 'folders', 'search'],
                operation: ['getChangeOrders', 'getFileVersions', 'getFolderContents', 'search'],
            },
        },
    },
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
        description: 'EntityTypes to search. If null or empty value is passed, it will include results from all entity types.',
        displayOptions: {
            show: {
                resource: ['search'],
                operation: ['advancedSearch'],
            },
        },
    },
    {
        displayName: 'Folder IDs',
        name: 'foldersToSearch',
        type: 'string',
        typeOptions: {
            multipleValues: true,
        },
        default: [],
        placeholder: 'e.g. 1, 2, 3',
        description: 'IDs of the folders to restrict the search to (just the numbers, e.g. 1, 2, 3)',
        displayOptions: {
            show: {
                resource: ['search'],
                operation: ['advancedSearch'],
            },
        },
    },
    {
        displayName: 'Search Criteria',
        name: 'searchCriteria',
        type: 'fixedCollection',
        typeOptions: {
            multipleValues: true,
        },
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
                            loadOptions: {
                                routing: {
                                    request: {
                                        method: 'GET',
                                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/property-definitions',
                                        qs: {
                                            limit: '1000',
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
                                            {
                                                type: 'setKeyValue',
                                                properties: {
                                                    name: '={{$responseItem.displayName}} (Type: {{$responseItem.dataType}})',
                                                    value: '={{$responseItem.id}}',
                                                },
                                            },
                                            {
                                                type: 'sort',
                                                properties: {
                                                    key: 'name',
                                                },
                                            },
                                        ],
                                    },
                                },
                            }
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
        displayOptions: {
            show: {
                resource: ['search'],
                operation: ['advancedSearch'],
            },
            hide: {
                vaultId: [''],
            },
        },
    },
    {
        displayName: 'Sort Criteria',
        name: 'sortCriteria',
        type: 'fixedCollection',
        typeOptions: {
            multipleValues: true,
        },
        default: {},
        description: 'Sort criteria for the search results. Specify the property definition URL and whether to sort in ascending order.',
        options: [
            {
                name: 'criteria',
                displayName: 'Criteria',
                values: [
                    {
                        displayName: 'Property Definition Namer or ID',
                        name: 'propertyDefinitionUrl',
                        type: 'options',
                        typeOptions: {
                            loadOptions: {
                                routing: {
                                    request: {
                                        method: 'GET',
                                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/property-definitions',
                                        qs: {
                                            limit: '1000',
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
                                            {
                                                type: 'setKeyValue',
                                                properties: {
                                                    name: '={{$responseItem.displayName}} (Id: {{$responseItem.id}})',
                                                    value: '={{$responseItem.id}}',
                                                },
                                            },
                                            {
                                                type: 'sort',
                                                properties: {
                                                    key: 'name',
                                                },
                                            },
                                        ],
                                    },
                                },
                            }
                        },
                        default: '',
                        description: 'ID of the property definition',
                    },
                    {
                        displayName: 'Ascending?',
                        name: 'ascending',
                        type: 'boolean',
                        default: true,
                        description: 'Whether the sort order is ascending'
                    },
                ],
            },
        ],
        displayOptions: {
            show: {
                resource: ['search'],
                operation: ['advancedSearch'],
            },
            hide: {
                vaultId: [''],
            },
        },
    },
    {
        displayName: 'Allow Sync',
        name: 'allowSync',
        type: 'boolean',
        default: false,
        description: 'Whether the file should be synced to the local site in a multi-site environment',
        displayOptions: {
            show: {
                resource: ['files'],
                operation: ['getFileVersionContent', 'getFileVersionContentHead', 'getFileVersionLmvRoot'],
            },
        },
    },
    {
        displayName: 'BOM Type',
        name: 'bomType',
        type: 'options',
        options: [
            { name: 'Latest', value: 'Latest' },
            { name: 'Historic', value: 'Historic' },
        ],
        default: 'Latest',
        description: 'Type of BOM to retrieve',
        displayOptions: {
            show: {
                resource: ['items'],
                operation: ['getItemVersionBom', 'getItemVersionWhereUsed'],
            },
        },
    },
    {
        displayName: 'Category Name',
        name: 'categoryName',
        type: 'string',
        default: '',
        description: 'Search filter to include only file versions that match CategoryName property',
        placeholder: 'e.g. Engineering',
        displayOptions: {
            show: {
                resource: ['files'],
                operation: ['getFileVersions'],
            },
        },
    },
    {
        displayName: 'Checkout User Name',
        name: 'checkoutUserName',
        type: 'string',
        default: '',
        description: 'Search filter to include only file versions that match CheckoutUserName property',
        placeholder: 'e.g. Administrator',
        displayOptions: {
            show: {
                resource: ['files'],
                operation: ['getFileVersions'],
            },
        },
    },
    {
        displayName: 'Content Disposition',
        name: 'contentDisposition',
        type: 'options',
        options: [
            { name: 'Inline', value: 'inline' },
            { name: 'Attachment', value: 'attachment' },
        ],
        default: 'inline',
        description: "Specify the content disposition of the response header. Use 'inline' to display the file in the browser, or 'attachment' to trigger a download.",
        displayOptions: {
            show: {
                resource: ['files'],
                operation: ['getFileVersions'],
            },
        },
    },
    {
        displayName: 'Create User Name',
        name: 'createUserName',
        type: 'string',
        default: '',
        description: 'The Name of the user who checked-in or uploaded this file',
        placeholder: 'e.g. Administrator',
        displayOptions: {
            show: {
                resource: ['files'],
                operation: ['getFileVersions'],
            },
        },
    },
    {
        displayName: 'Date',
        name: 'date',
        type: 'dateTime',
        default: '',
        description: 'The date that it was effective. Default value is DateTime.MinValue.',
        displayOptions: {
            show: {
                resource: ['items'],
                operation: ['getItemVersionBom', 'getItemVersionWhereUsed'],
            },
        },
    },
    {
        displayName: 'Descending',
        name: 'descending',
        type: 'boolean',
        default: false,
        description: 'Whether to return the latest file version at the top',
        displayOptions: {
            show: {
                resource: ['files', 'items'],
                operation: ['getFileHistory', 'getItemHistory'],
            },
        },
    },
    {
        displayName: 'Excluded BOM Links',
        name: 'excludedBOMLinks',
        type: 'boolean',
        default: false,
        description: 'Whether to include BOM rows that have been excluded',
        displayOptions: {
            show: {
                resource: ['items'],
                operation: ['getItemVersionBom'],
            },
        },
    },
    {
        displayName: 'Expiration Time',
        name: 'expirationTime',
        type: 'number',
        default: 180,
        description: 'Duration for the signed URL to be valid in seconds. Max allowed time is 180 seconds. Ex: expirationTime=120',
        displayOptions: {
            show: {
                resource: ['files'],
                operation: ['getFileVersionSignedUrl'],
            },
        },
    },
    {
        displayName: 'Filter Assignees',
        name: 'filterAssignees',
        type: 'string',
        default: '',
        description: 'Search filter to include only change orders that assignees user list can perform. ex: filter[assignees]=1,2,3,4.',
        displayOptions: {
            show: {
                resource: ['changeOrder'],
                operation: ['getChangeOrders'],
            },
        },
    },
    {
        displayName: 'Filter Open Cos Only',
        name: 'filterOpenCOsOnly',
        type: 'boolean',
        default: false,
        description: 'Whether to include only open change orders',
        displayOptions: {
            show: {
                resource: ['changeOrder'],
                operation: ['getChangeOrders'],
            },
        },
    },
    {
        displayName: 'State',
        name: 'ecoState',
        type: 'string',
        default: '',
        placeholder: 'e.g. open',
        description: 'Search filter to include only change orders that match state property. e.g. \'open\'.',
        displayOptions: {
            show: {
                resource: ['changeOrder'],
                operation: ['getChangeOrders'],
            },
        },
    },
    {
        displayName: 'Get Latest Associations',
        name: 'getLatestAssociations',
        type: 'boolean',
        default: true,
        description: 'Whether to get only the latest file associations',
        displayOptions: {
            show: {
                resource: ['files'],
                operation: ['getFileVersionUses', 'getFileVersionWhereUsed',],
            },
        },
    },
    {
        displayName: 'Recurse',
        name: 'recurse',
        type: 'boolean',
        default: false,
        description: 'Whether to include all levels of parent files',
        displayOptions: {
            show: {
                resource: ['files'],
                operation: ['getFileVersionUses', 'getFileVersionWhereUsed',],
            },
        },
    },
    {
        displayName: 'History',
        name: 'history',
        type: 'options',
        options: [
            { name: 'All', value: 'All' },
            { name: 'Released Only', value: 'ReleasedOnly' },
            { name: 'Released And Revision Tip', value: 'ReleasedAndRevisionTip' },
            { name: 'Revision Tip', value: 'RevisionTip' },
        ],
        default: 'All',
        description: 'Options for viewing file history',
        displayOptions: {
            show: {
                resource: ['items'],
                operation: ['getItemVersionBom', 'getItemVersionWhereUsed'],
            },
        },
    },
    {
        displayName: 'Change Order ID',
        name: 'changeOrderId',
        type: 'string',
        required: true,
        placeholder: 'e.g. 56732',
        description: 'The unique identifier of a Change Order',
        displayOptions: {
            show: {
                resource: ['changeOrders'],
                operation: [
                    'getChangeOrderById',
                    'getChangeOrderRelatedFiles',
                    'getChangeOrderAssociatedEntities',
                    'getChangeOrderComments',
                    'getChangeOrderCommentAttachments',
                ],
            },
        },
        default: '',
    },
    {
        displayName: 'File ID',
        name: 'fileId',
        type: 'string',
        required: true,
        placeholder: 'e.g. 100201',
        description: 'The unique identifier of a File',
        displayOptions: {
            show: {
                resource: ['files'],
                operation: [
                    'getFileVersionById',
                    'getFileVersionSignedUrl',
                    'getFileVersionContent',
                    'getFileVersionContentHead',
                    'getFileVersionLmvRoot',
                    'getFileVersionAssociatedItemVersions',
                    'getFileVersionMarkups',
                    'getFileVersionMarkupById',
                    'getFileVersionThumbnailById',
                    'getFileVersionVisualizationAttachments',
                    'getFileVersionUses',
                    'getFileVersionWhereUsed',
                ],
            },
        },
        default: '',
    },
    {
        displayName: 'File Master ID',
        name: 'fileMasterId',
        type: 'string',
        required: true,
        placeholder: 'e.g. 100200',
        description: 'The unique identifier of a file used to group all the versions of a File',
        displayOptions: {
            show: {
                resource: ['files'],
                operation: [
                    'getFileById',
                    'getFileAssociatedChangeOrders',
                    'getFileHistory',
                ],
            },
        },
        default: '',
    },
    {
        displayName: 'Folder ID',
        name: 'folderId',
        type: 'string',
        required: true,
        description: 'The unique identifier of a Folder',
        hint: '\"1\" is the root folder ID',
        placeholder: 'e.g. 1',
        displayOptions: {
            show: {
                resource: ['folders'],
                operation: [
                    'getFolderById',
                    'getFolderContents',
                    'getFolderSubFolders',
                ],
            },
        },
        default: '',
    },
    {
        displayName: 'Item ID',
        name: 'itemId',
        type: 'string',
        required: true,
        description: 'The unique identifier of an Item',
        placeholder: 'e.g. 56732',
        displayOptions: {
            show: {
                resource: ['items'],
                operation: [
                    'getItemVersionById',
                    'getItemVersionAssociatedFiles',
                    'getItemVersionBom',
                    'getItemVersionWhereUsed',
                    'getItemVersionThumbnail',
                ],
            },
        },
        default: '',
    },
    {
        displayName: 'Item Master ID',
        name: 'itemMasterId',
        type: 'string',
        required: true,
        description: 'The unique identifier of an item used to group all the versions of an Item',
        placeholder: 'e.g. 30678',
        displayOptions: {
            show: {
                resource: ['items'],
                operation: [
                    'getItemById',
                    'getItemAssociatedChangeOrders',
                    'getItemHistory',
                ],
            },
        },
        default: '',
    },
    {
        displayName: 'Job ID',
        name: 'jobId',
        type: 'string',
        required: true,
        placeholder: 'e.g. 1234',
        description: 'The unique identifier of a job',
        displayOptions: {
            show: {
                resource: ['jobs'],
                operation: ['getJobsById'],
            },
        },
        default: '',
    },
    {
        displayName: 'Link ID',
        name: 'linkId',
        type: 'string',
        required: true,
        placeholder: 'e.g. 1234',
        description: 'The unique identifier of a link',
        displayOptions: {
            show: {
                resource: ['links'],
                operation: ['getLinkById'],
            },
        },
        default: '',
    },
    {
        displayName: 'Markup ID',
        name: 'markupId',
        type: 'string',
        required: true,
        placeholder: 'e.g. 1234',
        description: 'The unique identifier of a markup',
        displayOptions: {
            show: {
                resource: ['files'],
                operation: ['getFileVersionMarkupById'],
            },
        },
        default: '',
    },
    {
        displayName: "Include Closed ECO's",
        name: 'includeClosedECOs',
        type: 'boolean',
        default: false,
        description: 'Whether to include change orders in a closed or cancelled state',
        displayOptions: {
            show: {
                resource: ['files', 'items'],
                operation: ['getFileAssociatedChangeOrders', 'getItemAssociatedChangeOrders',],
            },
        },
    },
    {
        displayName: "Include Folders",
        name: 'includeFolders',
        type: 'boolean',
        default: false,
        description: 'Whether to include folders or folder links in the search results',
        displayOptions: {
            show: {
                resource: ['folders'],
                operation: ['getFolderContents'],
            },
        },
    },
    {
        displayName: "Include Hidden",
        name: 'includeHidden',
        type: 'boolean',
        default: false,
        description: 'Whether to include files marked as hidden',
        displayOptions: {
            show: {
                resource: ['files'],
                operation: ['getFileVersionUses', 'getFileVersionWhereUsed',],
            },
        },
    },
    {
        displayName: "Include Item ECO Links",
        name: 'includeItemEcoLinks',
        type: 'boolean',
        default: true,
        description: 'Whether to include Item/Change Order links in the search results',
        displayOptions: {
            show: {
                resource: ['folders'],
                operation: ['getFolderContents'],
            },
        },
    },
    {
        displayName: 'Job Type',
        name: 'jobType',
        type: 'string',
        default: '',
        placeholder: 'e.g. Autodesk.Vault.SyncProperties',
        displayOptions: {
            show: {
                resource: ['jobs'],
                operation: ['addJob'],
            },
        },
    },
    {
        displayName: 'Priority',
        name: 'priority',
        type: 'number',
        default: 1,
        description: 'The priority of the job. A lower number means a higher priority. 1 is the lowest possible number.',
        typeOptions: {
            minValue: 1,
        },
        displayOptions: {
            show: {
                resource: ['jobs'],
                operation: ['addJob'],
            },
        },
    },
    {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        default: '',
        description: 'A description of the job',
        placeholder: 'e.g. Sync properties for files',
        displayOptions: {
            show: {
                resource: ['jobs'],
                operation: ['addJob'],
            },
        },
    },
    {
        displayName: 'Parameters',
        name: 'params',
        type: 'fixedCollection',
        typeOptions: {
            multipleValues: true,
        },
        default: {},
        options: [
            {
                displayName: 'Parameter',
                name: 'parameter',
                values: [
                    {
                        displayName: 'Key',
                        name: 'key',
                        type: 'string',
                        default: '',
                    },
                    {
                        displayName: 'Value',
                        name: 'value',
                        type: 'string',
                        default: '',
                    },
                ],
            },
        ],
        displayOptions: {
            show: {
                resource: ['jobs'],
                operation: ['addJob'],
            },
        },
    },
    {
        displayName: "Include Occurrences",
        name: 'includeOccurrences',
        type: 'boolean',
        default: false,
        description: 'Whether to include the occurrences',
        displayOptions: {
            show: {
                resource: ['items'],
                operation: ['getItemVersionBom'],
            },
        },
    },
    {
        displayName: 'One Level',
        name: 'oneLevel',
        type: 'boolean',
        default: false,
        description: 'Whether to include only the current level and immediate children',
        displayOptions: {
            show: {
                resource: ['items'],
                operation: ['getItemVersionBom'],
            },
        },
    },
    {
        displayName: 'Only Show Tip Released For Each Rev',
        name: 'onlyShowTipReleasedForEachRev',
        type: 'boolean',
        default: true,
        description: 'Whether to show only the tip (latest) released version for each revision',
        displayOptions: {
            show: {
                resource: ['files'],
                operation: ['getFileHistory'],
            },
        },
    },
    {
        displayName: 'Query',
        name: 'q',
        type: 'string',
        placeholder: 'e.g. Assembly',
        description: 'The value to use for the search. Based on \'SearchContent\' option, this parameter will either search across all properties or across all properties and content. Ex: q=Assembly, all objects that contain \'Assembly\' within their properties will be returned.',
        displayOptions: {
            show: {
                resource: ['files', 'folders', 'items', 'search'],
                operation: ['getFileVersions', 'getFolderContents', 'getItemVersions', 'search'],
            },
        },
        default: '',
    },
    {
        displayName: 'Range',
        name: 'range',
        type: 'string',
        description: "Request only part of the file content, e.g. bytes=0-999",
        placeholder: 'e.g. bytes=0-999',
        displayOptions: {
            show: {
                resource: ['files'],
                operation: ['getFileVersionContent'],
            },
        },
        default: '',
    },
    {
        displayName: 'Reference Designators',
        name: 'referenceDesignators',
        type: 'boolean',
        default: false,
        description: 'Whether to include reference designators',
        displayOptions: {
            show: {
                resource: ['items'],
                operation: ['getItemVersionBom'],
            },
        },
    },
    {
        displayName: 'Release Biased',
        name: 'releaseBiased',
        type: 'boolean',
        default: true,
        description: 'Whether to use the "Release biased" approach for gathering dependencies',
        displayOptions: {
            show: {
                resource: ['files'],
                operation: ['getFileVersionUses', 'getFileVersionWhereUsed'],
            },
        },
    },
    {
        displayName: 'Released Only',
        name: 'releasedOnly',
        type: 'boolean',
        default: false,
        description: 'Whether to include only associated files that are in a consumable (released) state',
        displayOptions: {
            show: {
                resource: ['changeOrders'],
                operation: ['getChangeOrderRelatedFiles'],
            },
        },
    },
    {
        displayName: 'Released Only',
        name: 'releasedOnly',
        type: 'boolean',
        default: false,
        description: 'Whether to include only attachments that are in a consumable (released) state',
        displayOptions: {
            show: {
                resource: ['changeOrders'],
                operation: ['getChangeOrderCommentAttachments'],
            },
        },
    },
    {
        displayName: 'Released Only',
        name: 'releasedOnly',
        type: 'boolean',
        default: false,
        description: 'Whether to include only items that are in a consumable (released) state',
        displayOptions: {
            show: {
                resource: ['files'],
                operation: ['getFileVersionAssociatedItemVersions'],
            },
        },
    },
    {
        displayName: 'Released Only',
        name: 'releasedOnly',
        type: 'boolean',
        default: false,
        description: 'Whether to include only files that are in a consumable (released) state',
        displayOptions: {
            show: {
                resource: ['files'],
                operation: ['getFileVersionUses', 'getFileVersionWhereUsed'],
            },
        },
    },
    {
        displayName: 'Released Only',
        name: 'releasedOnly',
        type: 'boolean',
        default: false,
        description: 'Whether to return the latest consumable (released) version',
        displayOptions: {
            show: {
                resource: ['files'],
                operation: ['getFileById'],
            },
        },
    },
    {
        displayName: 'Released Only',
        name: 'releasedOnly',
        type: 'boolean',
        default: false,
        description: 'Whether to return the latest consumable (released) item revision',
        displayOptions: {
            show: {
                resource: ['items'],
                operation: ['getItemById'],
            },
        },
    },
    {
        displayName: 'Revision',
        name: 'revision',
        type: 'options',
        options: [
            { name: 'All Revisions', value: 'AllRevision' },
            { name: 'Current Revision', value: 'CurrentRevision' },
        ],
        default: 'AllRevision',
        description: 'Options for viewing file history',
        displayOptions: {
            show: {
                resource: ['files'],
                operation: ['getFileHistory'],
            },
        },
    },
    {
        displayName: 'Rolled Up',
        name: 'rolledUp',
        type: 'boolean',
        default: false,
        description: 'Whether to include a linear view of the BOM showing items for parts only (available for view operations only)',
        displayOptions: {
            show: {
                resource: ['items'],
                operation: ['getItemVersionBom'],
            },
        },
    },
    {
        displayName: 'State',
        name: 'state',
        type: 'string',
        default: '',
        placeholder: 'e.g. For Review',
        description: 'Search filter to include only file versions that match state property. e.g. \'For Review\'.',
        displayOptions: {
            show: {
                resource: ['files'],
                operation: ['getFileVersions'],
            },
        },
    },
    {
        displayName: 'Unassigned Components',
        name: 'unassignedComponents',
        type: 'boolean',
        default: false,
        description: 'Whether to include unassigned components (BOM rows without associated items) in the BOM',
        displayOptions: {
            show: {
                resource: ['items'],
                operation: ['getItemVersionBom'],
            },
        },
    },
    {
        displayName: 'Watermarked Source File Version ID',
        name: 'wmSrcFileVerId',
        type: 'string',
        default: '',
        placeholder: 'e.g. 100201',
        description: 'When current file is a dwf associated to an Item, directly or as a CAD file\'s visualization attachment, to download its watermarked version, supply this File Version\'s ID or its CAD File Version\'s ID as the watermark source',
        displayOptions: {
            show: {
                resource: ['files'],
                operation: ['getFileVersionSignedUrl', 'getFileVersionContent', 'getFileVersionContentHead', 'getFileVersionLmvRoot'],
            },
        },
    },
    {
        displayName: 'Watermarked Source Item Version ID',
        name: 'wmSrcItemVerId',
        type: 'string',
        default: '',
        placeholder: 'e.g. 56732',
        description: 'When current file is a dwf associated to an Item, to download its watermarked version, supply this Item Version\'s ID as the watermark source',
        displayOptions: {
            show: {
                resource: ['files'],
                operation: ['getFileVersionSignedUrl', 'getFileVersionContent', 'getFileVersionContentHead', 'getFileVersionLmvRoot'],
            },
        },
    },
    {
        displayName: 'Property Definition IDs',
        name: 'propDefIds',
        type: 'string',
        default: '',
        description: 'The properties that need to be returned. property IDs separated by \',\', e.g. \'1,2,3\' \'all\' means return all properties.',
        hint: 'The properties that need to be returned. property IDs separated by \',\', e.g. \'1,2,3\' \'all\' means return all properties.',
        placeholder: 'e.g. all',
        displayOptions: {
            show: {
                resource: [
                    'changeOrders',
                    'files',
                    'folders',
                    'items',
                    'search',
                ],
                operation: [
                    'getChangeOrders',
                    'getChangeOrderRelatedFiles',
                    'getChangeOrderAssociatedEntities',
                    'getChangeOrderCommentAttachments',
                    'getFileVersions',
                    'getFileVersionAssociatedItemVersions',
                    'getFileVersionUses',
                    'getFileVersionWhereUsed',
                    'getFileAssociatedChangeOrders',
                    'getFileHistory',
                    'getFolderContents',
                    'getFolderSubFolders',
                    'getItemVersions',
                    'getItemVersionAssociatedFiles',
                    'getItemAssociatedChangeOrders',
                    'getItemHistory',
                    'search',
                    'advancedSearch',
                ],
            },
        },
    },
    {
        displayName: 'Property Definition IDs',
        name: 'propDefIds',
        type: 'string',
        default: '',
        description: 'Search filter to include only propertyDefs that match ID. PropertyDefIds, separated by \',\'.',
        displayOptions: {
            show: {
                resource: ['property'],
                operation: ['getPropertyDefinitions'],
            },
        },
    },
    {
        displayName: 'Extended Models',
        name: 'extendedModels',
        type: 'boolean',
        default: false,
        description: 'Whether to include extended model data in the response',
        displayOptions: {
            show: {
                resource: [
                    'changeOrders',
                    'files',
                    'folders',
                    'items',
                    'property',
                    'search',
                ],
                operation: [
                    'getChangeOrders',
                    'getChangeOrderRelatedFiles',
                    'getChangeOrderAssociatedEntities',
                    'getChangeOrderCommentAttachments',
                    'getFileVersions',
                    'getFileVersionUses',
                    'getFileVersionWhereUsed',
                    'getFileAssociatedChangeOrders',
                    'getFileHistory',
                    'getFolderContents',
                    'getFolderSubFolders',
                    'getItemVersionAssociatedFiles',
                    'getItemAssociatedChangeOrders',
                    'getItemHistory',
                    'getPropertyDefinitions',
                    'search',
                    'advancedSearch',
                ],
            },
        },
    },
    {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        typeOptions: {
            numberPrecision: 0,
        },
        description: 'Max number of results to return',
        hint: 'Specifies the number of results to return per page. Maximum limit is controlled by \"Page size configuration\" on the server. The maximum is 1000',
        displayOptions: {
            show: {
                resource: [
                    'accounts',
                    'changeOrders',
                    'files',
                    'folders',
                    'informational',
                    'items',
                    'links',
                    'options',
                    'property',
                    'search',
                ],
                operation: [
                    'advancedSearch',
                    'getAllUsers',
                    'getChangeOrderAssociatedEntities',
                    'getChangeOrderCommentAttachments',
                    'getChangeOrderComments',
                    'getChangeOrderRelatedFiles',
                    'getChangeOrders',
                    'getFileAssociatedChangeOrders',
                    'getFileHistory',
                    'getFileVersionAssociatedItemVersions',
                    'getFileVersionMarkups',
                    'getFileVersions',
                    'getFileVersionUses',
                    'getFileVersionVisualizationAttachments',
                    'getFileVersionWhereUsed',
                    'getFolderContents',
                    'getFolderSubFolders',
                    'getFolderSubFolders',
                    'getGroups',
                    'getItemAssociatedChangeOrders',
                    'getItemHistory',
                    'getItems',
                    'getItemVersions',
                    'getLinks',
                    'getProfileAttributeDefinitions',
                    'getPropertyDefinitions',
                    'getRoles',
                    'getSystemOptions',
                    'getVaultOptions',
                    'getVaults',
                    'search',
                ],
            },
        },
        default: '',
    },
    {
        displayName: 'Cursor State',
        name: 'cursorState',
        type: 'string',
        description: 'Cursor state to paginate through results',
        hint: 'Use the cursor state from the previous response to get the next set of results',
        displayOptions: {
            show: {
                resource: [
                    'accounts',
                    'changeOrders',
                    'files',
                    'folders',
                    'informational',
                    'items',
                    'links',
                    'options',
                    'property',
                    'search',
                ],
                operation: [
                    'advancedSearch',
                    'getAllUsers',
                    'getChangeOrderAssociatedEntities',
                    'getChangeOrderCommentAttachments',
                    'getChangeOrderComments',
                    'getChangeOrderRelatedFiles',
                    'getChangeOrders',
                    'getFileAssociatedChangeOrders',
                    'getFileHistory',
                    'getFileVersionAssociatedItemVersions',
                    'getFileVersionMarkups',
                    'getFileVersions',
                    'getFileVersionUses',
                    'getFileVersionVisualizationAttachments',
                    'getFileVersionWhereUsed',
                    'getFolderContents',
                    'getFolderSubFolders',
                    'getFolderSubFolders',
                    'getGroups',
                    'getItemAssociatedChangeOrders',
                    'getItemHistory',
                    'getItems',
                    'getItemVersions',
                    'getLinks',
                    'getProfileAttributeDefinitions',
                    'getPropertyDefinitions',
                    'getRoles',
                    'getSystemOptions',
                    'getVaultOptions',
                    'getVaults',
                    'search',
                ],
            },
        },
        default: '',
    },
];
//# sourceMappingURL=shared-parameters.js.map