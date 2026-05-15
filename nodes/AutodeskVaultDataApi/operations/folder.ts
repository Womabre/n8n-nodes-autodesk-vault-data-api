import { INodeProperties } from 'n8n-workflow';

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
            url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/folders/{{$parameter["folderId"]}}',
            headers: {
              Authorization: '=Bearer {{$credentials.accessToken}}',
            },
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
            url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/folders/{{$parameter["folderId"]}}/contents',
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
        name: 'Get Folder Subfolders',
        value: 'getFolderSubFolders',
        action: 'Get folder subfolders',
        description: 'Retrieve the immediate subfolders of the specified folder ID',
        routing: {
          request: {
            method: 'GET',
            url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/folders/{{$parameter["folderId"]}}/sub-folders',
            qs: {
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
    ],
    default: 'getFolderById',
  },
];
