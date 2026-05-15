"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.operations = void 0;
exports.operations = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['options'],
            },
        },
        options: [
            {
                name: 'Create System Option',
                value: 'createSystemOption',
                action: 'Create system option',
                description: 'Creates a system-wide option with name and value',
                routing: {
                    request: {
                        method: 'POST',
                        url: '=/AutodeskDM/Services/api/vault/v2/system-options',
                        headers: {
                            Authorization: '=Bearer {{$credentials.accessToken}}',
                        },
                        body: {
                            name: '={{$parameter["optionName"]}}',
                            value: '={{$parameter["optionValue"]}}',
                        },
                    },
                    output: {
                        postReceive: [
                            {
                                type: 'setKeyValue',
                                properties: {
                                    response: '={{ $response || "" }}',
                                },
                            },
                        ],
                    },
                },
            },
            {
                name: 'Create Vault Option',
                value: 'createVaultOption',
                action: 'Create vault option',
                description: 'Create a new option which applies to the specified vault',
                routing: {
                    request: {
                        method: 'POST',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/vault-options',
                        headers: {
                            Authorization: '=Bearer {{$credentials.accessToken}}',
                        },
                        body: {
                            name: '={{$parameter["optionName"]}}',
                            value: '={{$parameter["optionValue"]}}',
                        },
                    },
                    output: {
                        postReceive: [
                            {
                                type: 'setKeyValue',
                                properties: {
                                    response: '={{ $response || "" }}',
                                },
                            },
                        ],
                    },
                },
            },
            {
                name: 'Delete System Option',
                value: 'deleteSystemOptionById',
                action: 'Delete system option',
                description: 'Delete a system option by its ID',
                routing: {
                    request: {
                        method: 'DELETE',
                        url: '=/AutodeskDM/Services/api/vault/v2/system-options/{{$parameter["systemOptionId"]}}',
                        headers: {
                            Authorization: '=Bearer {{$credentials.accessToken}}',
                        },
                    },
                    output: {
                        postReceive: [
                            {
                                type: 'setKeyValue',
                                properties: {
                                    response: '={{ $response || "" }}',
                                },
                            },
                        ],
                    },
                },
            },
            {
                name: 'Delete Vault Option',
                value: 'deleteVaultOptionById',
                action: 'Delete vault option',
                description: 'Delete a vault option with a specific ID',
                routing: {
                    request: {
                        method: 'DELETE',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/vault-options/{{$parameter["vaultOptionId"]}}',
                        headers: {
                            Authorization: '=Bearer {{$credentials.accessToken}}',
                        },
                    },
                    output: {
                        postReceive: [
                            {
                                type: 'setKeyValue',
                                properties: {
                                    response: '={{ $response || "" }}',
                                },
                            },
                        ],
                    },
                },
            },
            {
                name: 'Get Many System Options',
                value: 'getSystemOptions',
                action: 'Get many system options',
                description: 'Returns list of system-wide options, optionally filtered by name',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/system-options',
                        headers: {
                            Authorization: '=Bearer {{$credentials.accessToken}}',
                        },
                        qs: {
                            'filter[name]': '={{$parameter["filterName"]}}',
                            limit: '={{$parameter["limit"] || undefined}}',
                            cursorState: '={{$parameter["cursorState"] || undefined}}',
                        },
                    },
                },
            },
            {
                name: 'Get Many Vault Options',
                value: 'getVaultOptions',
                action: 'Get many vault options',
                description: 'Returns list of options that apply to the entire vault',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/vault-options',
                        headers: {
                            Authorization: '=Bearer {{$credentials.accessToken}}',
                        },
                        qs: {
                            'filter[name]-starts': '={{$parameter["nameStartsWith"]}}',
                            limit: '={{$parameter["limit"] || undefined}}',
                            cursorState: '={{$parameter["cursorState"] || undefined}}',
                        },
                    },
                },
            },
            {
                name: 'Get System Option',
                value: 'getSystemOptionById',
                action: 'Get system option',
                description: 'Retrieve a system option by its ID',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/system-options/{{$parameter["systemOptionId"]}}',
                        headers: {
                            Authorization: '=Bearer {{$credentials.accessToken}}',
                        },
                    },
                },
            },
            {
                name: 'Get Vault Option',
                value: 'getVaultOptionById',
                action: 'Get vault option',
                description: 'Retrieve a vault-specific option using its ID',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/vault-options/{{$parameter["vaultOptionId"]}}',
                        headers: {
                            Authorization: '=Bearer {{$credentials.accessToken}}',
                        },
                    },
                },
            },
            {
                name: 'Update System Option',
                value: 'updateSystemOptionById',
                action: 'Update system option',
                description: 'Update the value of a system option by ID',
                routing: {
                    request: {
                        method: 'PATCH',
                        url: '=/AutodeskDM/Services/api/vault/v2/system-options/{{$parameter["systemOptionId"]}}',
                        headers: {
                            Authorization: '=Bearer {{$credentials.accessToken}}',
                        },
                        body: {
                            value: '={{$parameter["optionValue"]}}',
                        },
                    },
                    output: {
                        postReceive: [
                            {
                                type: 'setKeyValue',
                                properties: {
                                    response: '={{ $response || "" }}',
                                },
                            },
                        ],
                    },
                },
            },
            {
                name: 'Update Vault Option',
                value: 'updateVaultOptionById',
                action: 'Update vault option',
                description: 'Update the value of an option for the current vault',
                routing: {
                    request: {
                        method: 'PATCH',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/vault-options/{{$parameter["vaultOptionId"]}}',
                        headers: {
                            Authorization: '=Bearer {{$credentials.accessToken}}',
                        },
                        body: {
                            value: '={{$parameter["optionValue"]}}',
                        },
                    },
                    output: {
                        postReceive: [
                            {
                                type: 'setKeyValue',
                                properties: {
                                    response: '={{ $response || "" }}',
                                },
                            },
                        ],
                    },
                },
            },
        ],
        default: 'getSystemOptions',
    },
];
//# sourceMappingURL=option.js.map