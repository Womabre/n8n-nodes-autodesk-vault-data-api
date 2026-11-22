import type {
	IDataObject,
	INodeProperties,
	INodePropertyOptions,
	INodePropertyRouting,
	PostReceiveAction,
} from 'n8n-workflow';
import { API_BASE } from '../utils/constants';
import { processBinaryResponse } from '../utils/binary';
import {
	handleEmptyResponse,
	returnHeaders,
	SPLIT_RESULTS_SINCE_VERSION,
	splitResults,
} from '../utils/response';
import { bodyPreSend } from './body';
import type { FieldReference, OperationDefinition, ResourceDefinition } from './defineOperation';
import { limit, returnAll } from './fields';

/** Thrown when operation definitions would build an inconsistent node. */
export class DefinitionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'DefinitionError';
	}
}

const COLLECTION_ROOT: PostReceiveAction = {
	type: 'rootProperty',
	properties: { property: 'results' },
};

function key(resource: string, operation: OperationDefinition): string {
	return `${resource}/${operation.value}`;
}

/** `name` or `name?` to the expression n8n evaluates for that header or body field. */
function expression(reference: FieldReference): string {
	const optional = reference.endsWith('?');
	const name = optional ? reference.slice(0, -1) : reference;
	return optional ? `={{$parameter["${name}"] || undefined}}` : `={{$parameter["${name}"]}}`;
}

/**
 * The expression for a query value, the one encoding every query value uses:
 * an empty field ('') is left out of the URL, while false and 0 are sent as
 * they are. Several Vault options default to true (Latest Only among them), so
 * leaving out false would turn them back on.
 */
export function queryValue(name: string): string {
	return `={{$parameter["${name}"] === "" ? undefined : $parameter["${name}"]}}`;
}

function referencedName(reference: FieldReference): string {
	return reference.endsWith('?') ? reference.slice(0, -1) : reference;
}

function mapExpressions(
	map: Record<string, FieldReference>,
	encode: (reference: FieldReference) => string = expression,
): IDataObject {
	const out: IDataObject = {};
	for (const [name, reference] of Object.entries(map)) out[name] = encode(reference);
	return out;
}

const PATH_FIELD = /\{([^{}]+)\}/g;

function url(path: string): string {
	const compiled = path.replace(PATH_FIELD, (_, name: string) => `{{$parameter["${name}"]}}`);
	return compiled === path ? `${API_BASE}${path}` : `=${API_BASE}${compiled}`;
}

function isPaginated(operation: OperationDefinition): boolean {
	return operation.response === 'collection' && operation.paginated !== false;
}

/** Shows a field only from the node version that splits legacy-wrapper results. */
function fromSplitResultsVersion(field: INodeProperties): INodeProperties {
	return {
		...field,
		displayOptions: {
			...field.displayOptions,
			show: {
				...field.displayOptions?.show,
				'@version': [{ _cnd: { gte: SPLIT_RESULTS_SINCE_VERSION } }],
			},
		},
	};
}

/**
 * Node version 1 returns a legacy-wrapper collection as one item holding the
 * response and never had Return All / Limit for it, so they stay hidden there
 * and version 1 sends the same request it always did. n8n leaves a hidden
 * field out of the request.
 */
const legacyWrapperPagination = [returnAll, limit].map(fromSplitResultsVersion);

/** The fields the operation shows, in UI order, Return All / Limit included. */
function shownFields(operation: OperationDefinition): INodeProperties[] {
	if (!isPaginated(operation)) return operation.fields;
	const pagination = operation.legacyWrapper ? legacyWrapperPagination : [returnAll, limit];
	return [...operation.fields, ...pagination];
}

function outputActions(operation: OperationDefinition): PostReceiveAction[] {
	switch (operation.response) {
		case 'single':
			return [];
		case 'collection':
			return operation.legacyWrapper ? [splitResults] : [COLLECTION_ROOT];
		case 'empty':
			return [handleEmptyResponse];
		case 'binary':
			return [processBinaryResponse];
		case 'headers':
			return [returnHeaders];
	}
}

function routing(operation: OperationDefinition): INodePropertyRouting {
	if (operation.routing) return operation.routing;

	const request: INodePropertyRouting['request'] = {
		method: operation.method,
		url: url(operation.path),
	};
	if (operation.query) request.qs = mapExpressions(operation.query, queryValue);
	if (operation.headers) request.headers = mapExpressions(operation.headers);
	if (operation.body) request.body = mapExpressions(operation.body);
	if (operation.response === 'binary' || operation.response === 'headers') {
		request.returnFullResponse = true;
	}
	if (operation.response === 'binary') request.encoding = 'arraybuffer';

	const result: INodePropertyRouting = { request };
	if (operation.buildBody) result.send = { preSend: [bodyPreSend(operation.buildBody)] };
	const postReceive = outputActions(operation);
	if (postReceive.length > 0) result.output = { postReceive };
	return result;
}

/**
 * `$parameter["x"]`, `$parameter['x']` and `$parameter.x` as they appear in
 * JSON text, where a double quote is escaped as `\"`.
 */
const PARAMETER_REFERENCE = /\$parameter(?:\[\\?["']([^"'\\]+)\\?["']\]|\.([A-Za-z_$][\w$]*))/g;

/** Every field name a value's expressions refer to (functions are not read). */
function parameterNames(value: unknown): string[] {
	const text = JSON.stringify(value) ?? '';
	return [...text.matchAll(PARAMETER_REFERENCE)].map((match) => match[1] ?? match[2]);
}

/** Every field name the operation's request refers to. */
function referencedFields(operation: OperationDefinition): string[] {
	if (operation.routing) return parameterNames(operation.routing);
	const names = [...operation.path.matchAll(PATH_FIELD)].map((match) => match[1]);
	for (const map of [operation.query, operation.headers, operation.body]) {
		for (const reference of Object.values(map ?? {})) names.push(referencedName(reference));
	}
	names.push(...Object.keys(operation.buildBody?.reads ?? {}));
	return names;
}

/** Field names a field's display conditions depend on (`@version` and the like excluded). */
function displayConditionNames(field: INodeProperties): string[] {
	const { show = {}, hide = {} } = field.displayOptions ?? {};
	return [...Object.keys(show), ...Object.keys(hide)].filter((name) => !name.startsWith('@'));
}

function sendsToBody(field: INodeProperties): boolean {
	return (field.routing?.send as { type?: string } | undefined)?.type === 'body';
}

function checkOperation(resource: string, operation: OperationDefinition): void {
	const where = key(resource, operation);
	const fields = shownFields(operation);
	const declared = fields.map((field) => field.name);
	const refuse = (message: string): never => {
		throw new DefinitionError(`${where} ${message}`);
	};

	const duplicate = declared.find((name, index) => declared.indexOf(name) !== index);
	if (duplicate) refuse(`declares the field "${duplicate}" twice`);

	for (const [parameter, reference] of Object.entries(operation.query ?? {})) {
		if (reference.endsWith('?')) {
			refuse(
				`marks the query value "${parameter}" with "?"; every query value is left out when empty, so drop it`,
			);
		}
	}

	for (const name of referencedFields(operation)) {
		if (!declared.includes(name)) refuse(`sends "${name}" but does not declare that field`);
	}

	for (const field of fields) {
		for (const name of displayConditionNames(field)) {
			if (name === 'resource' || name === 'operation') {
				refuse(`shows "${field.name}" with its own ${name} condition; the builder sets those`);
			}
			if (!declared.includes(name)) {
				refuse(`shows "${field.name}" depending on "${name}", but does not declare "${name}"`);
			}
		}
		for (const name of field.typeOptions?.loadOptionsDependsOn ?? []) {
			if (!declared.includes(name)) {
				refuse(`shows "${field.name}", which loads from "${name}", but does not declare "${name}"`);
			}
		}
		// The field's own routing, option loading and nested fields.
		for (const name of parameterNames(field)) {
			if (!declared.includes(name)) {
				refuse(`shows "${field.name}", which refers to "${name}", but does not declare "${name}"`);
			}
		}
	}

	if (operation.legacyWrapper && operation.response !== 'collection') {
		refuse('has a legacy wrapper but is not a collection');
	}
	if (operation.paginated === false && operation.response !== 'collection') {
		refuse('says paginated: false but is not a collection');
	}
	if (operation.routing && isPaginated(operation)) {
		refuse(
			'is a paginated collection on raw routing, which carries no pagination; set paginated: false',
		);
	}
	if (
		(operation.method === 'GET' || operation.method === 'HEAD') &&
		(operation.body || operation.buildBody)
	) {
		refuse(`sends a body with ${operation.method}`);
	}
	if (operation.buildBody) {
		const bodyField = fields.find(sendsToBody);
		if (bodyField) {
			refuse(
				`builds its body but "${bodyField.name}" also sends to the body; let the builder own it`,
			);
		}
	}
}

/** Structural equality where functions compare by identity. */
function sameShape(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
	if (Array.isArray(a) !== Array.isArray(b)) return false;
	const aKeys = Object.keys(a).filter((k) => (a as IDataObject)[k] !== undefined);
	const bKeys = Object.keys(b).filter((k) => (b as IDataObject)[k] !== undefined);
	if (aKeys.length !== bKeys.length) return false;
	return aKeys.every((k) => sameShape((a as IDataObject)[k], (b as IDataObject)[k]));
}

interface FieldNode {
	field: INodeProperties;
	resources: string[];
	operations: string[];
	/** Fields that must come after this one, with the operation that requires it. */
	next: Map<FieldNode, string>;
	incoming: number;
}

/**
 * Orders the merged fields so every operation sees its own fields in the order
 * it declared them. Ties keep the order in which fields were first declared.
 */
function orderFields(nodes: FieldNode[]): FieldNode[] {
	const ordered: FieldNode[] = [];
	const ready = nodes.filter((node) => node.incoming === 0);
	const remaining = new Set(nodes);

	while (ready.length > 0) {
		ready.sort((a, b) => nodes.indexOf(a) - nodes.indexOf(b));
		const node = ready.shift() as FieldNode;
		ordered.push(node);
		remaining.delete(node);
		for (const successor of node.next.keys()) {
			successor.incoming -= 1;
			if (successor.incoming === 0) ready.push(successor);
		}
	}

	if (remaining.size > 0) {
		const operations = new Set<string>();
		for (const node of remaining) {
			for (const [successor, operation] of node.next) {
				if (remaining.has(successor)) operations.add(operation);
			}
		}
		const names = [...remaining].map((node) => node.field.name).join(', ');
		throw new DefinitionError(
			`Fields ${names} are declared in conflicting orders by ${[...operations].join(' and ')}`,
		);
	}
	return ordered;
}

function operationSelector(resource: ResourceDefinition): INodeProperties {
	const options: INodePropertyOptions[] = resource.operations.map((operation) => ({
		name: operation.name,
		value: operation.value,
		action: operation.action,
		description: operation.description,
		routing: routing(operation),
	}));
	// A plain identifier: the n8n lint rule node-param-default-missing reads a
	// member expression such as `resource.defaultOperation` as no default.
	const defaultOperation = resource.defaultOperation;
	return {
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [resource.value] } },
		options,
		default: defaultOperation,
	};
}

/**
 * Builds the n8n properties for the given resources: one operation selector
 * per resource, then every field, merged where operations share it, with the
 * `displayOptions` that show it for exactly the operations that declare it.
 *
 * @throws DefinitionError when the definitions would build an inconsistent node
 */
export function buildProperties(resources: ResourceDefinition[]): INodeProperties[] {
	const nodes: FieldNode[] = [];
	const operationValues = new Set<string>();

	const resourceValues = new Set<string>();
	for (const resource of resources) {
		if (resourceValues.has(resource.value)) {
			throw new DefinitionError(`Resource "${resource.value}" is defined twice`);
		}
		resourceValues.add(resource.value);
		if (!resource.operations.some((operation) => operation.value === resource.defaultOperation)) {
			throw new DefinitionError(
				`${resource.value} defaults to "${resource.defaultOperation}", which it does not define`,
			);
		}
		for (const operation of resource.operations) {
			const where = key(resource.value, operation);
			if (operationValues.has(operation.value)) {
				throw new DefinitionError(`${where}: operation value "${operation.value}" is used twice`);
			}
			operationValues.add(operation.value);
			checkOperation(resource.value, operation);

			let previous: FieldNode | undefined;
			for (const field of shownFields(operation)) {
				let node = nodes.find(
					(candidate) => candidate.field.name === field.name && sameShape(candidate.field, field),
				);
				if (!node) {
					node = { field, resources: [], operations: [], next: new Map(), incoming: 0 };
					nodes.push(node);
				}
				if (!node.resources.includes(resource.value)) node.resources.push(resource.value);
				node.operations.push(operation.value);
				if (previous && !previous.next.has(node)) {
					previous.next.set(node, where);
					node.incoming += 1;
				}
				previous = node;
			}
		}
	}

	const fields = orderFields(nodes).map(({ field, resources: shownIn, operations }) => ({
		...field,
		displayOptions: {
			...field.displayOptions,
			show: { resource: shownIn, operation: operations, ...field.displayOptions?.show },
		},
	}));

	return [...resources.map(operationSelector), ...fields];
}
