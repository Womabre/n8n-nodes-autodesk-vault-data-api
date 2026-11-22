import { API_BASE } from '../utils/constants';
import { defineOperation, defineResource } from '../definition/defineOperation';
import { extendedModels, vaultId } from '../definition/fields';
import { listLoadOptions } from '../definition/loadOptions';

export const resource = defineResource({
	value: 'property',
	defaultOperation: 'getPropertyDefinitionById',
	operations: [
		defineOperation({
			name: 'Get Property Definition',
			value: 'getPropertyDefinitionById',
			action: 'Get property definition',
			description: 'Get the property definition object for the given ID',
			method: 'GET',
			path: '/vaults/{vaultId}/property-definitions/{propertyDefId}',
			fields: [
				vaultId,
				{
					displayName: 'Property Definition ID',
					name: 'propertyDefId',
					type: 'options',
					typeOptions: {
						loadOptionsDependsOn: ['vaultId'],
						loadOptions: listLoadOptions(
							`=${API_BASE}/vaults/{{$parameter["vaultId"]}}/property-definitions`,
							'={{$responseItem.displayName}} (Id: {{$responseItem.id}})',
						),
					},
					required: true,
					default: '',
					description: 'The unique identifier of the property definition',
					displayOptions: { hide: { vaultId: [''] } },
				},
			],
			response: 'single',
		}),
		defineOperation({
			name: 'Get Many Property Definitions',
			value: 'getPropertyDefinitions',
			action: 'Get many property definitions',
			description: 'Get all property definitions in the vault',
			method: 'GET',
			path: '/vaults/{vaultId}/property-definitions',
			fields: [
				vaultId,
				{
					displayName: 'Entity Class ID',
					name: 'entityClassId',
					type: 'options',
					default: '',
					description: 'Entity class to filter by. Leave empty to return all.',
					options: [
						{ name: 'All', value: '' },
						{ name: 'Change Order', value: 'CO' },
						{ name: 'File', value: 'FILE' },
						{ name: 'Folder', value: 'FLDR' },
						{ name: 'Item', value: 'ITEM' },
					],
				},
				{
					displayName: 'System Names',
					name: 'systemNames',
					type: 'string',
					default: '',
					description: 'Comma-separated list of property system names to filter',
				},
				{
					displayName: 'Include BOM Association Property',
					name: 'includeBOMAssociationProperty',
					type: 'boolean',
					default: false,
					description: 'Whether to include BOM association property definitions',
				},
				{
					displayName: 'Property Definition IDs',
					name: 'propDefIds',
					type: 'string',
					default: '',
					description:
						"Search filter to include only propertyDefs that match ID. PropertyDefIds, separated by ','.",
				},
				extendedModels,
			],
			query: {
				'filter[entityClassId]': 'entityClassId',
				'filter[systemNames]': 'systemNames',
				'filter[propDefIds]': 'propDefIds',
				'option[includeBOMAssociationProperty]': 'includeBOMAssociationProperty',
				'option[extendedModels]': 'extendedModels',
			},
			response: 'collection',
		}),
	],
});
