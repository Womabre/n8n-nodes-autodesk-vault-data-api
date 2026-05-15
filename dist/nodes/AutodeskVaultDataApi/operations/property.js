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
                resource: ['property'],
            },
        },
        options: [
            {
                name: 'Get Property Definition',
                value: 'getPropertyDefinitionById',
                action: 'Get property definition',
                description: 'Get the property definition object for the given ID',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/property-definitions/{{$parameter["propertyDefId"]}}',
                        headers: {
                            Authorization: '=Bearer {{$credentials.accessToken}}',
                        },
                    },
                },
            },
            {
                name: 'Get Many Property Definitions',
                value: 'getPropertyDefinitions',
                action: 'Get many property definitions',
                description: 'Get all property definitions in the vault',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/property-definitions',
                        qs: {
                            'filter[entityClassId]': '={{$parameter["entityClassId"] || undefined}}',
                            'filter[systemNames]': '={{$parameter["systemNames"] || undefined}}',
                            'filter[propDefIds]': '={{$parameter["propDefIds"] || undefined}}',
                            'option[includeBOMAssociationProperty]': '={{$parameter["includeBOMAssociationProperty"] || undefined}}',
                            'option[extendedModels]': '={{$parameter["extendedModels"] || undefined}}',
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
        default: 'getPropertyDefinitionById',
    },
];
//# sourceMappingURL=property.js.map