import { INodeProperties } from 'n8n-workflow';

export const operations: INodeProperties[] = [
  // Options: getSystemOptions, createSystemOption, getSystemOptionById,
  // updateSystemOptionById, deleteSystemOptionById, getVaultOptions,
  // createVaultOption, getVaultOptionById, updateVaultOptionById, deleteVaultOptionById
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
            qs: {
              'filter[name]': '={{$parameter["filterName"] || undefined}}',
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
        name: 'Get Many Vault Options',
        value: 'getVaultOptions',
        action: 'Get many vault options',
        description: 'Returns list of options that apply to the entire vault',
        routing: {
          request: {
            method: 'GET',
            url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/vault-options',
            qs: {
              'filter[name]-starts': '={{$parameter["nameStartsWith"] || undefined}}',
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
        name: 'Get System Option',
        value: 'getSystemOptionById',
        action: 'Get system option',
        description: 'Retrieve a system option by its ID',
        routing: {
          request: {
            method: 'GET',
            url: '=/AutodeskDM/Services/api/vault/v2/system-options/{{$parameter["systemOptionId"]}}',
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
