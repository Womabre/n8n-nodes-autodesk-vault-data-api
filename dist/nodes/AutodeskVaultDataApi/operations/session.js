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
                resource: ['session'],
            },
        },
        options: [
            {
                name: 'Get Current Session',
                value: 'getSessionById',
                action: 'Get current session',
                description: 'Get user session tied to Bearer token. Use @current to retrieve current user session.',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/sessions/{{$parameter["sessionId"]}}',
                    },
                },
            },
            {
                name: 'Delete Current Session',
                value: 'deleteSession',
                action: 'Delete current session',
                description: 'Delete user session tied to Bearer token. Use @current to delete current user session.',
                routing: {
                    request: {
                        method: 'DELETE',
                        url: '=/AutodeskDM/Services/api/vault/v2/sessions/{{$parameter["sessionId"]}}',
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
            }
        ],
        default: 'getSessionById',
    },
];
//# sourceMappingURL=session.js.map