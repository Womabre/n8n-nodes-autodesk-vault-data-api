import { INodeType, INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';

// Import list search methods
import {
	searchFileMasters,
	searchFileVersions,
	searchFolders,
	searchItemMasters,
	searchItemVersions,
	searchMarkups,
} from './methods/listSearch';

// Import operations
import * as changeOrders from './operations/changeOrder';
import * as files from './operations/file';
import * as folders from './operations/folder';
import * as group from './operations/group';
import * as items from './operations/item';
import * as jobs from './operations/job';
import * as links from './operations/links';
import * as options from './operations/option';
import * as profile from './operations/profile';
import * as property from './operations/property';
import * as role from './operations/role';
import * as search from './operations/search';
import * as server from './operations/server';
import * as session from './operations/session';
import * as user from './operations/user';
import * as vault from './operations/vault';

// Import shared parameters
import * as shared from './parameters/shared-parameters';

export class AutodeskVaultDataApi implements INodeType {
	methods = {
		listSearch: {
			searchFolders,
			searchFileMasters,
			searchFileVersions,
			searchItemMasters,
			searchItemVersions,
			searchMarkups,
		},
	};

	description: INodeTypeDescription = {
		displayName: 'Autodesk Vault Data API',
		name: 'autodeskVaultDataApi',
		usableAsTool: true,
		version: 1,
		group: ['transform'],
		icon: 'file:AutodeskVaultDataApi.svg',
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Autodesk Vault Data API',
		defaults: {
			name: 'Autodesk Vault Data API',
		},
		inputs: ['main'] as NodeConnectionType[],
		outputs: ['main'] as NodeConnectionType[],

		credentials: [
			{
				name: 'autodeskVaultDataOAuth2Api',
				required: true,
				displayOptions: {
					show: {
						authentication: ['OAuth2'],
					},
				},
			},
			{
				name: 'autodeskVaultAccountApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['VaultLogin'],
					},
				},
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.vaultServerUrl}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Authentication Method',
				name: 'authentication',
				type: 'options',
				options: [
					{ name: 'Autodesk ID (3-Legged OAuth2)', value: 'OAuth2' },
					{ name: 'Vault Account', value: 'VaultLogin' },
				],
				default: 'VaultLogin',
				description: 'Choose the authentication method',
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Change Order', value: 'changeOrders' },
					{ name: 'File', value: 'files' },
					{ name: 'Folder', value: 'folders' },
					{ name: 'Group', value: 'group' },
					{ name: 'Item', value: 'items' },
					{ name: 'Job', value: 'jobs' },
					{ name: 'Link', value: 'links' },
					{ name: 'Option', value: 'options' },
					{ name: 'Profile', value: 'profile' },
					{ name: 'Property', value: 'property' },
					{ name: 'Role', value: 'role' },
					{ name: 'Search', value: 'search' },
					{ name: 'Server', value: 'server' },
					{ name: 'Session', value: 'session' },
					{ name: 'User', value: 'user' },
					{ name: 'Vault', value: 'vault' },
				],
				default: 'server',
			},
			// Operations
			...changeOrders.operations,
			...files.operations,
			...folders.operations,
			...group.operations,
			...items.operations,
			...jobs.operations,
			...links.operations,
			...options.operations,
			...profile.operations,
			...property.operations,
			...role.operations,
			...search.operations,
			...server.operations,
			...session.operations,
			...user.operations,
			...vault.operations,

			// Shared Parameters
			...shared.parameters,
		],
	};
}
