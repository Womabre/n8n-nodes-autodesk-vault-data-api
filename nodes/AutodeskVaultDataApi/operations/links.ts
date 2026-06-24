import { INodeProperties } from 'n8n-workflow';

export const operations: INodeProperties[] = [
  // Links: getLinks, getLinkById
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['links'],
      },
    },
    options: [
      {
        name: 'Get Link',
        value: 'getLinkById',
        action: 'Get link',
        description: 'Fetches a single link entity using the provided link ID and Vault ID',
        routing: {
          request: {
            method: 'GET',
            url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/links/{{$parameter["linkId"]}}',
          },
        },
      },
      {
        name: 'Get Many Links',
        value: 'getLinks',
        action: 'Get many links',
        description: 'Fetches all links for the specified Vault ID',
        routing: {
          request: {
            method: 'GET',
            url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/links',
            qs: {
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
    ],
    default: 'getLinkById',
  },
];
