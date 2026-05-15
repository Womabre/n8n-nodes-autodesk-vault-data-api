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
                resource: ['profile'],
            },
        },
        options: [
            {
                name: 'Get Profile Attribute Definition',
                value: 'getProfileAttributeDefinitionById',
                action: 'Get profile attribute definition',
                description: 'Get profile attribute definition by its ID',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/profile-attribute-definitions/{{$parameter["profileAttributeDefId"]}}',
                        headers: {
                            Authorization: '=Bearer {{$credentials.accessToken}}',
                        },
                    },
                },
            },
            {
                name: 'Get Many Profile Attribute Definitions',
                value: 'getProfileAttributeDefinitions',
                action: 'Get many profile attribute definitions',
                description: 'Retrieve all profile attribute definitions, optionally filtered by association (User, Group, All)',
                routing: {
                    request: {
                        method: 'GET',
                        url: '/AutodeskDM/Services/api/vault/v2/profile-attribute-definitions',
                        qs: {
                            'filter[association]': '={{$parameter["association"]}}',
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
        default: 'getProfileAttributeDefinitionById',
    },
];
//# sourceMappingURL=profile.js.map