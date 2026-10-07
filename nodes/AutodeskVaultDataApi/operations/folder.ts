import { INodeProperties } from 'n8n-workflow';
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
        resource: ['folders'],
      },
    },
    options: [
      {
        name: 'Get Folder',
        value: 'getFolderById',
        action: 'Get folder',
        description:
          'Retrieve the folder object with the specified ID. Use "root" to get the root folder.',
        routing: {
          request: {
            method: 'GET',
            url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/folders/{{$parameter["folderId"]}}`,
          },
        },
      },
      {
        name: 'Get Folder Contents',
        value: 'getFolderContents',
        action: 'Get folder contents',
        description: 'Retrieve folder objects and children under the specified folder ID',
        routing: {
          request: {
            method: 'GET',
            url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/folders/{{$parameter["folderId"]}}/contents`,
            qs: {
              q: '={{$parameter["q"] || undefined}}',
              'option[searchContent]': '={{$parameter["searchContent"]}}',
              'option[searchSubFolders]': '={{$parameter["searchSubFolders"]}}',
              'option[includeFolders]': '={{$parameter["includeFolders"]}}',
              'option[includeItemEcoLinks]': '={{$parameter["includeItemEcoLinks"]}}',
              'option[releasedFilesOnly]': '={{$parameter["releasedFilesOnly"]}}',
              'option[releasedItemsOnly]': '={{$parameter["releasedItemsOnly"]}}',
              'option[latestOnly]': '={{$parameter["latestOnly"]}}',
              'option[extendedModels]': '={{$parameter["extendedModels"]}}',
              'option[propDefIds]': '={{$parameter["propDefIds"]}}',
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
        name: 'Get Folder Subfolders',
        value: 'getFolderSubFolders',
        action: 'Get folder subfolders',
        description: 'Retrieve the immediate subfolders of the specified folder ID',
        routing: {
          request: {
            method: 'GET',
            url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/folders/{{$parameter["folderId"]}}/sub-folders`,
            qs: {
              'option[extendedModels]': '={{$parameter["extendedModels"]}}',
              'option[propDefIds]': '={{$parameter["propDefIds"]}}',
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
        name: 'Update Folder Lifecycle Definitions',
        value: 'updateFolderLifecycleDefinitions',
        action: 'Update folder lifecycle definitions',
        description:
          'Move folders onto a different lifecycle definition. Each entry needs a definition and a state that belongs to it.',
        routing: {
          send: {
            preSend: [buildUpdateLifecycleDefinitionsBody('folders')],
          },
          request: {
            method: 'POST',
            url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/folders:update-lifecycle-definitions`,
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
        name: 'Update Folder Lifecycle States',
        value: 'updateFolderLifecycleStates',
        action: 'Update folder lifecycle states',
        description: 'Update the lifecycle state of one or more folders by folder ID',
        routing: {
          send: {
            preSend: [buildUpdateLifecycleStatesBody('folders')],
          },
          request: {
            method: 'POST',
            url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/folders:update-states`,
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
    default: 'getFolderById',
  },
];
