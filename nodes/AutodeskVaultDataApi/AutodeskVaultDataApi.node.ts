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
import { resource as changeOrders } from './operations/changeOrder';
import * as extSync from './operations/extSync';
import { resource as files } from './operations/file';
import { resource as folders } from './operations/folder';
import { resource as group } from './operations/group';
import { resource as items } from './operations/item';
import * as jobs from './operations/job';
import { resource as lifecycle } from './operations/lifecycle';
import { resource as links } from './operations/links';
import { resource as options } from './operations/option';
import { resource as profile } from './operations/profile';
import { resource as property } from './operations/property';
import { resource as role } from './operations/role';
import * as search from './operations/search';
import { resource as server } from './operations/server';
import { resource as session } from './operations/session';
import * as user from './operations/user';
import * as vault from './operations/vault';

// Import shared parameters
import * as shared from './parameters/shared-parameters';
import { buildProperties } from './definition/buildProperties';
import { withoutMigrated } from './definition/legacy';

/** Resources whose operations are built from operation definitions. */
const migrated = [
	changeOrders,
	files,
	folders,
	items,
	group,
	lifecycle,
	links,
	options,
	profile,
	property,
	role,
	server,
	session,
];

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
		// 1.1: "Get Many Item Version Associated Files" and "Get Many User Accounts"
		// return one item per result instead of the response wrapper.
		version: [1, 1.1],
		defaultVersion: 1.1,
		group: ['transform'],
		icon: { light: 'file:AutodeskVaultDataApi.svg', dark: 'file:AutodeskVaultDataApi.dark.svg' },
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
					{ name: 'External Sync Task', value: 'extSyncTasks' },
					{ name: 'File', value: 'files' },
					{ name: 'Folder', value: 'folders' },
					{ name: 'Group', value: 'group' },
					{ name: 'Item', value: 'items' },
					{ name: 'Job', value: 'jobs' },
					{ name: 'Lifecycle', value: 'lifecycle' },
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
			...extSync.operations,
			...jobs.operations,
			...search.operations,
			...user.operations,
			...vault.operations,

			...buildProperties(migrated),

			// Shared Parameters
			...withoutMigrated(shared.parameters, migrated),
		],
	};
}
