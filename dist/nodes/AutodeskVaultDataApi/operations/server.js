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
                resource: ['server'],
            },
        },
        options: [
            {
                name: 'Get Server Info',
                value: 'getServerInfo',
                action: 'Get server info',
                description: 'Get some metadata information about server such as product version, etc',
                routing: {
                    request: {
                        method: 'GET',
                        url: '/AutodeskDM/Services/api/vault/v2/server-info',
                    },
                },
            },
        ],
        default: 'getServerInfo',
    },
];
//# sourceMappingURL=server.js.map