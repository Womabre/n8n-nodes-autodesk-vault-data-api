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
                resource: ['user'],
            },
        },
        options: [
            {
                name: 'Get User',
                value: 'getUserById',
                action: 'Get user',
                description: 'Get full user object associated with the specified user ID',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/users/{{$parameter["userId"]}}',
                        headers: {
                            Authorization: '=Bearer {{$credentials.accessToken}}',
                        },
                    },
                },
            },
            {
                name: 'Get User Account by Auth Type',
                value: 'getUserAccountByAuthType',
                action: 'Get user account by auth type',
                description: 'Get user account information for a specific type (Vault, ActiveDirectory, Autodesk)',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/users/{{$parameter["userId"]}}/accounts/{{$parameter["authType"]}}',
                        headers: {
                            Authorization: '=Bearer {{$credentials.accessToken}}',
                        },
                    },
                },
            },
            {
                name: 'Get Many Users',
                value: 'getAllUsers',
                action: 'Get many users',
                description: 'Retrieve all Vault users (requires AdminUserRead permission)',
                routing: {
                    request: {
                        method: 'GET',
                        url: '/AutodeskDM/Services/api/vault/v2/users',
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
                name: 'Get Many User Accounts',
                value: 'getUserAccounts',
                action: 'Get many user accounts',
                description: 'Get all accounts associated with the specified user ID',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/users/{{$parameter["userId"]}}/accounts',
                        headers: {
                            Authorization: '=Bearer {{$credentials.accessToken}}',
                        },
                    },
                },
            },
        ],
        default: 'getUserById',
    },
];
//# sourceMappingURL=user.js.map