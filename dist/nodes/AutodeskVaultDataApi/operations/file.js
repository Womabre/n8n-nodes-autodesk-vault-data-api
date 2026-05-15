"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.operations = void 0;
const binary_1 = require("../utils/binary");
function containsRenderableGeometry(node) {
    if (node.type === 'geometry' && (node.role === '3d' || node.role === '2d')) {
        return true;
    }
    if (Array.isArray(node.children)) {
        return node.children.some(containsRenderableGeometry);
    }
    return false;
}
exports.operations = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['files'],
            },
        },
        options: [
            {
                name: 'Get File',
                value: 'getFileById',
                action: 'Get file',
                description: 'Retrieve a file object by its ID (MasterId), optionally returning only the latest released version',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/files/{{$parameter["fileMasterId"]}}',
                        qs: {
                            'option[releasedOnly]': '={{$parameter["releasedOnly"]}}',
                        },
                        headers: {
                            Authorization: '=Bearer {{$credentials.accessToken}}',
                        },
                    },
                },
            },
            {
                name: 'Get File Version',
                value: 'getFileVersionById',
                action: 'Get file version',
                description: 'Get file version object by its ID',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/file-versions/{{$parameter["fileId"]}}',
                        headers: {
                            Authorization: '=Bearer {{$credentials.accessToken}}',
                        },
                    },
                },
            },
            {
                name: 'Get File Version Content',
                value: 'getFileVersionContent',
                action: 'Get file version content',
                description: 'Retrieve the content of a specific file version, supporting full and partial content downloads',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/file-versions/{{$parameter["fileId"]}}/content',
                        qs: {
                            allowSync: '={{$parameter["allowSync"]}}',
                            wmSrcItemVerId: '={{$parameter["wmSrcItemVerId"] || undefined}}',
                            wmSrcFileVerId: '={{$parameter["wmSrcFileVerId"] || undefined}}',
                            contentDisposition: '={{$parameter["contentDisposition"] || undefined}}',
                        },
                        headers: {
                            Authorization: '=Bearer {{$credentials.accessToken}}',
                            Range: '={{$parameter["range"] || undefined}}',
                        },
                        returnFullResponse: true,
                        encoding: 'arraybuffer',
                    },
                    output: {
                        postReceive: [binary_1.processBinaryResponse],
                    },
                },
            },
            {
                name: 'Get File Version LMV Bubble JSON',
                value: 'getFileVersionLmvRoot',
                action: 'Get file version LMV bubble json',
                description: 'Retrieve the bubble.JSON root metadata file for a DWF/DWFx file used in the Autodesk Large Model Viewer (LMV)',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/file-versions/{{$parameter["fileId"]}}/svf/bubble.json',
                        qs: {
                            allowSync: '={{$parameter["allowSync"]}}',
                            wmSrcItemVerId: '={{$parameter["wmSrcItemVerId"] || undefined}}',
                            wmSrcFileVerId: '={{$parameter["wmSrcFileVerId"] || undefined}}',
                        },
                        headers: {
                            Authorization: '=Bearer {{$credentials.accessToken}}',
                        },
                        returnFullResponse: true,
                    },
                    output: {
                        postReceive: [
                            async function retryUntilReady(items, response) {
                                var _a;
                                const maxRetries = 10;
                                const baseDelayMs = 2000;
                                let attempt = 0;
                                let json;
                                let lastFailureReason = 'unknown';
                                const authMethod = this.getNodeParameter('authentication', 0);
                                let vaultServerUrl;
                                let accessToken;
                                if (authMethod === 'OAuth2') {
                                    const creds = await this.getCredentials('autodeskVaultDataOAuth2Api');
                                    vaultServerUrl = creds.vaultServerUrl;
                                    const tokenData = creds.oauthTokenData;
                                    accessToken = (_a = tokenData === null || tokenData === void 0 ? void 0 : tokenData.access_token) !== null && _a !== void 0 ? _a : '';
                                }
                                else {
                                    const creds = await this.getCredentials('autodeskVaultAccountApi');
                                    vaultServerUrl = creds.vaultServerUrl;
                                    accessToken = creds.accessToken;
                                }
                                const vaultId = this.getNodeParameter('vaultId', 0);
                                const fileId = this.getNodeParameter('fileId', 0);
                                const allowSync = this.getNodeParameter('allowSync', 0);
                                const wmSrcItemVerId = this.getNodeParameter('wmSrcItemVerId', 0);
                                const wmSrcFileVerId = this.getNodeParameter('wmSrcFileVerId', 0);
                                const qs = { allowSync: String(allowSync) };
                                if (wmSrcItemVerId)
                                    qs.wmSrcItemVerId = String(wmSrcItemVerId);
                                if (wmSrcFileVerId)
                                    qs.wmSrcFileVerId = String(wmSrcFileVerId);
                                while (attempt <= maxRetries) {
                                    if (attempt > 0) {
                                        const delayMs = Math.min(baseDelayMs * Math.pow(2, attempt - 1), 30000);
                                        await new Promise((resolve) => setTimeout(resolve, delayMs));
                                        response = await this.helpers.httpRequest({
                                            method: 'GET',
                                            url: `${vaultServerUrl}/AutodeskDM/Services/api/vault/v2/vaults/${vaultId}/file-versions/${fileId}/svf/bubble.json`,
                                            headers: { Authorization: `Bearer ${accessToken}` },
                                            qs,
                                            json: false,
                                            returnFullResponse: true,
                                        });
                                    }
                                    try {
                                        json =
                                            typeof response.body === 'string'
                                                ? JSON.parse(response.body)
                                                : response.body;
                                        if (json && containsRenderableGeometry(json)) {
                                            break;
                                        }
                                        lastFailureReason = 'renderable geometry not yet present in bubble.json';
                                        json = undefined;
                                    }
                                    catch {
                                        lastFailureReason = 'bubble.json could not be parsed as JSON';
                                        json = undefined;
                                    }
                                    attempt++;
                                }
                                if (!json) {
                                    throw new Error(`bubble.json not ready after ${maxRetries} attempts. Last failure: ${lastFailureReason}`);
                                }
                                return [{ json: json }];
                            },
                        ],
                    },
                },
            },
            {
                name: 'Get File Version Metadata',
                value: 'getFileVersionContentHead',
                action: 'Get file version metadata',
                description: 'Retrieve metadata for a specific file version content without downloading the full content',
                routing: {
                    request: {
                        method: 'HEAD',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/file-versions/{{$parameter["fileId"]}}/content',
                        qs: {
                            allowSync: '={{$parameter["allowSync"]}}',
                            wmSrcItemVerId: '={{$parameter["wmSrcItemVerId"] || undefined}}',
                            wmSrcFileVerId: '={{$parameter["wmSrcFileVerId"] || undefined}}',
                            contentDisposition: '={{$parameter["contentDisposition"] || undefined}}',
                        },
                        headers: {
                            Authorization: '=Bearer {{$credentials.accessToken}}',
                        },
                        returnFullResponse: true,
                    },
                    output: {
                        postReceive: [
                            async function (items, responseData) {
                                return items.map(() => ({
                                    json: {
                                        headers: responseData.headers,
                                        statusCode: responseData.statusCode,
                                    },
                                }));
                            },
                        ],
                    },
                },
            },
            {
                name: 'Get File Version History',
                value: 'getFileHistory',
                action: 'Get file version history',
                description: 'Retrieve the version history for the specified file (MasterId), with various filtering and revision options',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/files/{{$parameter["fileMasterId"]}}/versions',
                        qs: {
                            'option[history]': '={{$parameter["history"] || undefined}}',
                            'option[onlyShowTipReleasedForEachRev]': '={{$parameter["onlyShowTipReleasedForEachRev"]}}',
                            'option[extendedModels]': '={{$parameter["extendedModels"]}}',
                            'option[propDefIds]': '={{$parameter["propDefIds"]}}',
                            'option[revision]': '={{$parameter["revision"] || undefined}}',
                            descending: '={{$parameter["descending"]}}',
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
                name: 'Get File Version Markup',
                value: 'getFileVersionMarkupById',
                action: 'Get file version markup',
                description: 'Retrieve a specific markup associated with a file version by its ID',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/file-versions/{{$parameter["fileId"]}}/markups/{{$parameter["markupId"]}}',
                        headers: {
                            Authorization: '=Bearer {{$credentials.accessToken}}',
                        },
                    },
                },
            },
            {
                name: 'Get File Version Thumbnail',
                value: 'getFileVersionThumbnailById',
                action: 'Get file version thumbnail',
                description: 'Retrieve the thumbnail image for a specific file version',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/file-versions/{{$parameter["fileId"]}}/thumbnail',
                        headers: {
                            Authorization: '=Bearer {{$credentials.accessToken}}',
                        },
                        returnFullResponse: true,
                        encoding: 'arraybuffer',
                    },
                    output: {
                        postReceive: [binary_1.processBinaryResponse],
                    },
                },
            },
            {
                name: 'Get File Version Signed URL',
                value: 'getFileVersionSignedUrl',
                action: 'Get file version signed url',
                description: 'Generate a time-limited signed URL for securely downloading the specified file version',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/file-versions/{{$parameter["fileId"]}}/signedurl',
                        qs: {
                            wmSrcItemVerId: '={{$parameter["wmSrcItemVerId"] || undefined}}',
                            wmSrcFileVerId: '={{$parameter["wmSrcFileVerId"] || undefined}}',
                            contentDisposition: '={{$parameter["contentDisposition"] || undefined}}',
                            expirationTime: '={{$parameter["expirationTime"] || undefined}}',
                        },
                        headers: {
                            Authorization: '=Bearer {{$credentials.accessToken}}',
                        },
                    },
                },
            },
            {
                name: 'Get File Version Uses',
                value: 'getFileVersionUses',
                action: 'Get file version uses',
                description: 'Retrieve file dependencies and attachments for the specified file version',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/file-versions/{{$parameter["fileId"]}}/uses',
                        qs: {
                            'option[includeHidden]': '={{$parameter["includeHidden"]}}',
                            'option[releaseBiased]': '={{$parameter["releaseBiased"]}}',
                            'option[releasedOnly]': '={{$parameter["releasedOnly"]}}',
                            'option[extendedModels]': '={{$parameter["extendedModels"]}}',
                            'option[propDefIds]': '={{$parameter["propDefIds"]}}',
                            'option[getLatestAssociations]': '={{$parameter["getLatestAssociations"]}}',
                            'option[recurse]': '={{$parameter["recurse"]}}',
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
                name: 'Get File Version Where Used',
                value: 'getFileVersionWhereUsed',
                action: 'Get file version where used',
                description: 'Retrieve parent file associations for the specified file version',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/file-versions/{{$parameter["fileId"]}}/parents',
                        qs: {
                            'option[includeHidden]': '={{$parameter["includeHidden"]}}',
                            'option[releaseBiased]': '={{$parameter["releaseBiased"]}}',
                            'option[releasedOnly]': '={{$parameter["releasedOnly"]}}',
                            'option[extendedModels]': '={{$parameter["extendedModels"]}}',
                            'option[propDefIds]': '={{$parameter["propDefIds"]}}',
                            'option[getLatestAssociations]': '={{$parameter["getLatestAssociations"]}}',
                            'option[recurse]': '={{$parameter["recurse"]}}',
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
                name: 'Get Many File Versions',
                value: 'getFileVersions',
                action: 'Get many file versions',
                description: 'Retrieve a list of file versions based on filters and conditions',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/file-versions',
                        qs: {
                            q: '={{$parameter["q"] || undefined}}',
                            'filter[CheckoutUserName]': '={{$parameter["checkoutUserName"] || undefined}}',
                            'filter[CreateUserName]': '={{$parameter["createUserName"] || undefined}}',
                            'filter[CategoryName]': '={{$parameter["categoryName"] || undefined}}',
                            'filter[State]': '={{$parameter["state"] || undefined}}',
                            'option[latestOnly]': '={{$parameter["latestOnly"]}}',
                            'option[releasedFilesOnly]': '={{$parameter["releasedFilesOnly"]}}',
                            'option[extendedModels]': '={{$parameter["extendedModels"]}}',
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
            {
                name: 'Get Many File Version Associated Change Orders',
                value: 'getFileAssociatedChangeOrders',
                action: 'Get many file version associated change orders',
                description: 'Retrieve the change orders driving the specified file (MasterId)',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/files/{{$parameter["fileMasterId"]}}/change-orders',
                        qs: {
                            'option[includeClosedECOs]': '={{$parameter["includeClosedECOs"]}}',
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
                name: 'Get Many File Version Associated Item Versions',
                value: 'getFileVersionAssociatedItemVersions',
                action: 'Get many file version associated item versions',
                description: 'Retrieve all items assigned to a specific file version',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/file-versions/{{$parameter["fileId"]}}/item-versions',
                        qs: {
                            'option[releasedOnly]': '={{$parameter["releasedOnly"]}}',
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
                name: 'Get Many File Version Markups',
                value: 'getFileVersionMarkups',
                action: 'Get many file version markups',
                description: 'Retrieve all markups associated with a specific file version',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/file-versions/{{$parameter["fileId"]}}/markups',
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
                name: 'Get Many File Version Visualization Attachments',
                value: 'getFileVersionVisualizationAttachments',
                action: 'Get many file version visualization attachments',
                description: 'Retrieve the visualization attachments for a specific file version',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/file-versions/{{$parameter["fileId"]}}/visualization-attachments',
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
        ],
        default: 'getFileById',
    },
];
//# sourceMappingURL=file.js.map