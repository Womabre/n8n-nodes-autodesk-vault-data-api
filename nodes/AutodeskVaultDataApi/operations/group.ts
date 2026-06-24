import { INodeProperties } from 'n8n-workflow';

export const operations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['group'],
      },
    },
    options: [
      {
        name: 'Get Group',
        value: 'getGroupById',
        action: 'Get group',
        description: 'Retrieve a specific group by its ID',
        routing: {
          request: {
            method: 'GET',
            url: '=/AutodeskDM/Services/api/vault/v2/groups/{{$parameter["groupId"]}}',
          },
        },
      },
      {
        name: 'Get Group Account by Auth Type',
        value: 'getAccountByAuthType',
        action: 'Get group account by auth type',
        description: 'Get group account information by a specific auth type (Vault, AD, Autodesk)',
        routing: {
          request: {
            method: 'GET',
            url: '=/AutodeskDM/Services/api/vault/v2/groups/{{$parameter["groupId"]}}/accounts/{{$parameter["authType"]}}',
          },
        },
      },
      {
        name: 'Get Many Groups',
        value: 'getGroups',
        action: 'Get many groups',
        description: 'Get all groups in the Vault',
        routing: {
          request: {
            method: 'GET',
            url: '/AutodeskDM/Services/api/vault/v2/groups',
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
    default: 'getGroupById',
  },
];
