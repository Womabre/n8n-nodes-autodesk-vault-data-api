import type {
	IDataObject,
	INodeProperties,
	INodePropertyOptions,
	INodePropertyRouting,
	PostReceiveAction,
} from 'n8n-workflow';
import { API_BASE } from '../utils/constants';
import { processBinaryResponse } from '../utils/binary';
import { handleEmptyResponse, returnHeaders, splitResults } from '../utils/response';
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

/** `name` or `name?` to the expression n8n evaluates for that field. */
function expression(reference: FieldReference): string {
	const optional = reference.endsWith('?');
	const name = optional ? reference.slice(0, -1) : reference;
	return optional ? `={{$parameter["${name}"] || undefined}}` : `={{$parameter["${name}"]}}`;
}

function referencedName(reference: FieldReference): string {
	return reference.endsWith('?') ? reference.slice(0, -1) : reference;
}

function mapExpressions(map: Record<string, FieldReference>): IDataObject {
	const out: IDataObject = {};
	for (const [name, reference] of Object.entries(map)) out[name] = expression(reference);
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

/** The fields the operation shows, in UI order, Return All / Limit included. */
function shownFields(operation: OperationDefinition): INodeProperties[] {
	return isPaginated(operation) ? [...operation.fields, returnAll, limit] : operation.fields;
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
	if (operation.query) request.qs = mapExpressions(operation.query);
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

/** Every field name the operation's request refers to. */
function referencedFields(operation: OperationDefinition): string[] {
	if (operation.routing) {
		const text = JSON.stringify(operation.routing);
		return [...text.matchAll(/\$parameter\[\\"([^"\\]+)\\"\]/g)].map((match) => match[1]);
	}
	const names = [...operation.path.matchAll(PATH_FIELD)].map((match) => match[1]);
	for (const map of [operation.query, operation.headers, operation.body]) {
		for (const reference of Object.values(map ?? {})) names.push(referencedName(reference));
	}
	names.push(...Object.keys(operation.buildBody?.reads ?? {}));
	return names;
}

function checkOperation(resource: string, operation: OperationDefinition): void {
	const where = key(resource, operation);
	const declared = shownFields(operation).map((field) => field.name);

	const duplicate = declared.find((name, index) => declared.indexOf(name) !== index);
	if (duplicate) {
		throw new DefinitionError(`${where} declares the field "${duplicate}" twice`);
	}
	for (const name of referencedFields(operation)) {
		if (!declared.includes(name)) {
			throw new DefinitionError(`${where} sends "${name}" but does not declare that field`);
		}
	}
	for (const field of shownFields(operation)) {
		for (const dependency of field.typeOptions?.loadOptionsDependsOn ?? []) {
			if (!declared.includes(dependency)) {
				throw new DefinitionError(
					`${where} shows "${field.name}", which loads from "${dependency}", but does not declare "${dependency}"`,
				);
			}
		}
	}
	if (operation.legacyWrapper && operation.response !== 'collection') {
		throw new DefinitionError(`${where} has a legacy wrapper but is not a collection`);
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

	for (const resource of resources) {
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
