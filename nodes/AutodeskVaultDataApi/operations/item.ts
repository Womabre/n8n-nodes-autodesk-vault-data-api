import { INodeProperties } from 'n8n-workflow';
import { processBinaryResponse } from '../utils/binary';
import {
  buildUpdateLifecycleDefinitionsBody,
  buildUpdateLifecycleStatesBody,
} from '../utils/lifecycleBody';
import { API_BASE } from '../utils/constants';

export const operations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['items'],
      },
    },
    options: [
      {
        name: 'Get Item',
        value: 'getItemById',
        action: 'Get item',
        description: 'Retrieve an item by its ID from the specified Vault',
        routing: {
          request: {
            method: 'GET',
            url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/items/{{$parameter["itemMasterId"]}}`,
            qs: {
              'option[releasedOnly]': '={{$parameter["releasedOnly"]}}',
            },
          },
        },
      },
      {
        name: 'Get Item Version',
        value: 'getItemVersionById',
        action: 'Get item version',
        description: 'Retrieve an item version by its unique ID',
        routing: {
          request: {
            method: 'GET',
            url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/item-versions/{{$parameter["itemId"]}}`,
          },
        },
      },
      {
        name: 'Get Item Version BOM',
        value: 'getItemVersionBom',
        action: 'Get item version BOM',
        description:
          'Retrieve the Bill of Materials (BOM) for the specified item version, effective on a given date',
        routing: {
          request: {
            method: 'GET',
            url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/item-versions/{{$parameter["itemId"]}}/bill-of-materials`,
            qs: {
              'option[bomType]': '={{$parameter["bomType"] || undefined}}',
              'option[date]': '={{$parameter["date"] || undefined}}',
              'option[rolledUp]': '={{$parameter["rolledUp"]}}',
              'option[oneLevel]': '={{$parameter["oneLevel"]}}',
              'option[referenceDesignators]': '={{$parameter["referenceDesignators"]}}',
              'option[occurrences]': '={{$parameter["includeOccurrences"]}}',
              'option[excludedBOMLinks]': '={{$parameter["excludedBOMLinks"]}}',
              'option[unassignedComponents]': '={{$parameter["unassignedComponents"]}}',
              'option[includeBOMAssociationProperty]':
                '={{$parameter["includeBOMAssociationProperty"]}}',
            },
          },
        },
      },
      {
        name: 'Get Item Version Thumbnail',
        value: 'getItemVersionThumbnail',
        action: 'Get item version thumbnail',
        description: 'Retrieve the thumbnail image associated with the specified item version',
        routing: {
          request: {
            method: 'GET',
            url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/item-versions/{{$parameter["itemId"]}}/thumbnail`,
            returnFullResponse: true,
            encoding: 'arraybuffer', // ensures Buffer not string
          },
          output: {
            postReceive: [processBinaryResponse],
          },
        },
      },
      {
        name: 'Get Item Version Where Used',
        value: 'getItemVersionWhereUsed',
        action: 'Get item version where used',
        description: 'Retrieve where the item version is used (its parent items)',
        routing: {
          request: {
            method: 'GET',
            url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/item-versions/{{$parameter["itemId"]}}/parents`,
            qs: {
              'option[bomType]': '={{$parameter["bomType"] || undefined}}',
              'option[date]': '={{$parameter["date"] || undefined}}',
            },
          },
        },
      },
      {
        name: 'Get Item History',
        value: 'getItemHistory',
        action: 'Get item history',
        description: 'Retrieve the version history of an item by its ID from the specified Vault',
        routing: {
          request: {
            method: 'GET',
            url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/items/{{$parameter["itemMasterId"]}}/versions`,
            qs: {
              'option[history]': '={{$parameter["history"] || undefined}}',
              'option[extendedModels]': '={{$parameter["extendedModels"]}}',
              'option[propDefIds]': '={{$parameter["propDefIds"] || undefined}}',
              descending: '={{$parameter["descending"]}}',
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
        name: 'Get Many Items',
        value: 'getItems',
        action: 'Get many items',
        description: 'Retrieve all items in the specified Vault',
        routing: {
          request: {
            method: 'GET',
            url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/items`,
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
        name: 'Get Many Item Versions',
        value: 'getItemVersions',
        action: 'Get many item versions',
        description: 'Retrieve item versions in the specified vault',
        routing: {
          request: {
            method: 'GET',
            url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/item-versions`,
            qs: {
              q: '={{$parameter["q"] || undefined}}',
              'option[propDefIds]': '={{$parameter["propDefIds"]}}',
              'option[releasedItemsOnly]': '={{$parameter["releasedItemsOnly"]}}',
              'option[latestOnly]': '={{$parameter["latestOnly"]}}',
              sort: '={{$parameter["sort"] || undefined}}',
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
        name: 'Get Many Item Version Associated Change Orders',
        value: 'getItemAssociatedChangeOrders',
        action: 'Get many item version associated change orders',
        description: 'Retrieve change orders associated with a specific item in the Vault',
        routing: {
          request: {
            method: 'GET',
            url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/items/{{$parameter["itemMasterId"]}}/change-orders`,
            qs: {
              'option[includeClosedECOs]': '={{$parameter["includeClosedECOs"]}}',
              'option[extendedModels]': '={{$parameter["extendedModels"]}}',
              'option[propDefIds]': '={{$parameter["propDefIds"] || undefined}}',
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
        name: 'Get Many Item Version Associated Files',
        value: 'getItemVersionAssociatedFiles',
        action: 'Get many item version associated files',
        description: 'Retrieve all file associations for the specified item version ID',
        routing: {
          request: {
            method: 'GET',
            url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/item-versions/{{$parameter["itemId"]}}/associated-files`,
            qs: {
              'option[extendedModels]': '={{$parameter["extendedModels"]}}',
              'option[propDefIds]': '={{$parameter["propDefIds"]}}',
            },
          },
        },
      },
      {
        name: 'Get Item External Sync Info',
        value: 'getItemExtSyncInfoByName',
        action: 'Get item external sync info',
        description: 'Retrieve one external sync info entry by name from an item',
        routing: {
          request: {
            method: 'GET',
            url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/items/{{$parameter["itemMasterId"]}}/ext-sync-infos/{{$parameter["infoName"]}}`,
          },
        },
      },
      {
        name: 'Get Item Version External Sync Info',
        value: 'getItemVersionExtSyncInfoByName',
        action: 'Get item version external sync info',
        description: 'Retrieve one external sync info entry by name from an item version',
        routing: {
          request: {
            method: 'GET',
            url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/item-versions/{{$parameter["itemId"]}}/ext-sync-infos/{{$parameter["infoName"]}}`,
          },
        },
      },
      {
        name: 'Get Many Item External Sync Infos',
        value: 'getItemExtSyncInfos',
        action: 'Get many item external sync infos',
        description: 'Retrieve all external sync info entries stored on an item',
        routing: {
          request: {
            method: 'GET',
            url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/items/{{$parameter["itemMasterId"]}}/ext-sync-infos`,
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
        name: 'Get Many Item Version External Sync Infos',
        value: 'getItemVersionExtSyncInfos',
        action: 'Get many item version external sync infos',
        description: 'Retrieve all external sync info entries stored on an item version',
        routing: {
          request: {
            method: 'GET',
            url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/item-versions/{{$parameter["itemId"]}}/ext-sync-infos`,
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
        name: 'Update Item Lifecycle Definitions',
        value: 'updateItemLifecycleDefinitions',
        action: 'Update item lifecycle definitions',
        description:
          'Move items onto a different lifecycle definition. Each entry needs a definition and a state that belongs to it.',
        routing: {
          send: {
            preSend: [buildUpdateLifecycleDefinitionsBody('items')],
          },
          request: {
            method: 'POST',
            url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/items:update-lifecycle-definitions`,
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
        name: 'Update Item Lifecycle States',
        value: 'updateItemLifecycleStates',
        action: 'Update item lifecycle states',
        description: 'Update the lifecycle state of one or more items',
        routing: {
          send: {
            preSend: [buildUpdateLifecycleStatesBody('items')],
          },
          request: {
            method: 'POST',
            url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/items:update-states`,
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
    default: 'getItemById',
  },
];
