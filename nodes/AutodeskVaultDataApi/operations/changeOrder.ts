import { INodeProperties } from 'n8n-workflow';

export const operations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['changeOrders'],
      },
    },
    options: [
      {
        name: 'Get Change Order',
        value: 'getChangeOrderById',
        action: 'Get change order',
        description: 'Get change order by its ID',
        routing: {
          request: {
            method: 'GET',
            url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/change-orders/{{$parameter["changeOrderId"]}}',
            headers: {
              Authorization: '=Bearer {{$credentials.accessToken}}',
            },
          },
        },
      },
      {
        name: 'Get Many Change Order Associated Entities',
        value: 'getChangeOrderAssociatedEntities',
        action: 'Get many change order associated entities',
        description: 'Get all files and items tracked by or associated with a change order',
        routing: {
          request: {
            method: 'GET',
            url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/change-orders/{{$parameter["changeOrderId"]}}/associated-entities',
            qs: {
              'option[releasedItemsOnly]': '={{$parameter["releasedItemsOnly"]}}',
              'option[releasedFilesOnly]': '={{$parameter["releasedFilesOnly"]}}',
              'option[extendedModels]': '={{$parameter["extendedModels"]}}',
              'option[propDefIds]': '={{$parameter["propDefIds"]}}',
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
        name: 'Get Many Change Order Comment Attachments',
        value: 'getChangeOrderCommentAttachments',
        action: 'Get many change order comment attachments',
        description: 'Retrieve all attachments associated with a change order comment',
        routing: {
          request: {
            method: 'GET',
            url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/change-order-comments/{{$parameter["changeOrderId"]}}/attachments',
            qs: {
              'option[releasedOnly]': '={{$parameter["releasedOnly"] || undefined}}',
              'option[extendedModels]': '={{$parameter["extendedModels"] || undefined}}',
              'option[propDefIds]': '={{$parameter["propDefIds"] || undefined}}',
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
        name: 'Get Many Change Order Comments',
        value: 'getChangeOrderComments',
        action: 'Get many change order comments',
        description: 'Retrieve comments for the given change order ID',
        routing: {
          request: {
            method: 'GET',
            url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/change-orders/{{$parameter["changeOrderId"]}}/comments',
            qs: {
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
        name: 'Get Many Change Order Related Files',
        value: 'getChangeOrderRelatedFiles',
        action: 'Get many related files of a change order',
        description:
          'Get all change order related files, including attachments and associated item file associations',
        routing: {
          request: {
            method: 'GET',
            url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/change-orders/{{$parameter["changeOrderId"]}}/all-related-files',
            qs: {
              'option[releasedOnly]': '={{$parameter["releasedOnly"] || undefined}}',
              'option[extendedModels]': '={{$parameter["extendedModels"] || undefined}}',
              'option[propDefIds]': '={{$parameter["propDefIds"] || undefined}}',
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
        name: 'Get Many Change Orders',
        value: 'getChangeOrders',
        action: 'Get many change orders',
        description: 'Get list of change orders based on a set of conditions',
        routing: {
          request: {
            method: 'GET',
            url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/change-orders',
            qs: {
              'filter[state]': '={{$parameter["ecoState"] || undefined}}',
              'filter[assignees]': '={{$parameter["filterAssignees"] || undefined}}',
              'filter[openCOsOnly]': '={{$parameter["filterOpenCOsOnly"] || undefined}}',
              'option[extendedModels]': '={{$parameter["extendedModels"] || undefined}}',
              'option[propDefIds]': '={{$parameter["propDefIds"] || undefined}}',
              sort: '={{$parameter["sort"] || undefined}}',
              limit: '={{$parameter["limit"] || undefined}}',
              cursorState: '={{$parameter["cursorState"] || undefined}}',
            },
            headers: {
              Authorization: '=Bearer {{$credentials.accessToken}}',
            },
          },
        },
      },
    ],
    default: 'getChangeOrders',
  },
];
