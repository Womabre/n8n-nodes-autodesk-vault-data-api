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
                resource: ['role'],
            },
        },
        options: [
            {
                name: 'Get Role',
                value: 'getRoleById',
                action: 'Get role',
                description: 'Retrieve the role object with the specified ID',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/roles/{{$parameter["roleId"]}}',
                        headers: {
                            Authorization: '=Bearer {{$credentials.accessToken}}',
                        },
                    },
                },
            },
            {
                name: 'Get Roles',
                value: 'getRoles',
                action: 'Get roles',
                description: 'Get all roles visible to the current user based on permissions',
                routing: {
                    request: {
                        method: 'GET',
                        url: '/AutodeskDM/Services/api/vault/v2/roles',
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
        default: 'getRoleById',
    },
];
//# sourceMappingURL=role.js.map