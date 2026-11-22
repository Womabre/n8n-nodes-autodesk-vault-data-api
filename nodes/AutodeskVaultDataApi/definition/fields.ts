import type { INodeProperties } from 'n8n-workflow';
import { API_BASE } from '../utils/constants';
import { paginateByCursor } from '../utils/pagination';
import { listLoadOptions } from './loadOptions';

/**
 * Fields that operations of more than one resource declare with the same
 * shape. The builder never mutates them, so each is one shared constant.
 */

export const vaultId: INodeProperties = {
	displayName: 'Vault Name',
	name: 'vaultId',
	type: 'options',
	typeOptions: { loadOptions: listLoadOptions(`${API_BASE}/vaults`) },
	required: true,
	description:
		'The ID of the knowledge vault to retrieve. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	default: '',
};

export const extendedModels: INodeProperties = {
	displayName: 'Extended Models',
	name: 'extendedModels',
	type: 'boolean',
	default: false,
	description: 'Whether to include extended model data in the response',
};

export const propDefIds: INodeProperties = {
	displayName: 'Property Definition IDs',
	name: 'propDefIds',
	type: 'string',
	default: '',
	description:
		"The properties that need to be returned. property IDs separated by ',', e.g. '1,2,3' 'all' means return all properties.",
	hint: "The properties that need to be returned. property IDs separated by ',', e.g. '1,2,3' 'all' means return all properties.",
	placeholder: 'e.g. all',
};

export const releasedOnly: INodeProperties = {
	displayName: 'Released Only',
	name: 'releasedOnly',
	type: 'boolean',
	default: false,
	description: 'Whether to include only results in a consumable (released) state',
};

export const releasedFilesOnly: INodeProperties = {
	displayName: 'Released Files Only',
	name: 'releasedFilesOnly',
	type: 'boolean',
	default: false,
	description: 'Whether to include only file versions in a consumable (released) state',
};

export const releasedItemsOnly: INodeProperties = {
	displayName: 'Released Items Only',
	name: 'releasedItemsOnly',
	type: 'boolean',
	default: false,
	description: 'Whether to include only item versions in a consumable (released) state',
};

export const latestOnly: INodeProperties = {
	displayName: 'Latest Only',
	name: 'latestOnly',
	type: 'boolean',
	default: true,
	description: 'Whether to include only the latest version',
};

export const q: INodeProperties = {
	displayName: 'Query',
	name: 'q',
	type: 'string',
	placeholder: 'e.g. Assembly',
	description:
		"The value to use for the search. Based on 'SearchContent' option, this parameter will either search across all properties or across all properties and content. Ex: q=Assembly, all objects that contain 'Assembly' within their properties will be returned.",
	default: '',
};

export const sort: INodeProperties = {
	displayName: 'Sort',
	name: 'sort',
	type: 'string',
	default: '',
	description:
		'Specifies sorting criteria for search results. Format: {propertyDefSysName} {sort-order} Accepted values for sort-order: asc, desc. Ex: sort = Revision desc,Name asc',
	placeholder: 'e.g. Revision desc,Name asc',
};

export const lifecycleComment: INodeProperties = {
	displayName: 'Comment',
	name: 'lifecycleComment',
	type: 'string',
	default: '',
	placeholder: 'e.g. Released after approval',
	description: 'A comment recorded with the lifecycle change',
};

/** Added by the builder to every paginated collection. */
export const returnAll: INodeProperties = {
	displayName: 'Return All',
	name: 'returnAll',
	type: 'boolean',
	default: false,
	description: 'Whether to return all results or only up to a given limit',
	routing: { send: { paginate: '={{ $value }}' }, operations: { pagination: paginateByCursor } },
};

/** Added by the builder to every paginated collection, after Return All. */
export const limit: INodeProperties = {
	displayName: 'Limit',
	name: 'limit',
	type: 'number',
	typeOptions: { minValue: 1, numberPrecision: 0 },
	description: 'Max number of results to return',
	hint: 'The server caps a single page at its "Page size configuration" (up to 1000). Enable Return All to fetch every page.',
	routing: { send: { type: 'query', property: 'limit' } },
	default: 50,
	displayOptions: { show: { returnAll: [false] } },
};
