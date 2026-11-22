import type { IHttpRequestMethods, INodeProperties, INodePropertyRouting } from 'n8n-workflow';
import type { BodyBuilder } from './body';

/**
 * What an operation's response is, which decides how it becomes workflow items.
 *
 * - `single`: the response body is one item, as is.
 * - `collection`: `{ pagination, results }`; every result becomes an item, and
 *   Return All / Limit are added unless the definition says `paginated: false`.
 * - `empty`: an acknowledgement that may have no body (create, update, delete).
 * - `binary`: a file download, put on the item as binary data.
 * - `headers`: a HEAD request; the item carries the response headers.
 */
export type ResponseKind = 'single' | 'collection' | 'empty' | 'binary' | 'headers';

/**
 * The name of a field the operation declares. In a header or body map, a
 * trailing `?` leaves the value out of the request when it is empty
 * (`|| undefined`). Query maps take no `?`: every query value is left out when
 * it is an empty string and sent otherwise, false and 0 included.
 */
export type FieldReference = string;

/**
 * The single description of one operation: the endpoint it calls, the fields
 * it shows, how those fields map onto the request, and its response kind.
 */
export interface OperationDefinition {
	/** Display name in the operation list. */
	name: string;
	value: string;
	action: string;
	description: string;
	method: IHttpRequestMethods;
	/** Path below the Vault Data API base; `{field}` inserts that field's value. */
	path: string;
	/** Fields the operation shows, in UI order. Return All / Limit are added by the builder. */
	fields: INodeProperties[];
	query?: Record<string, FieldReference>;
	headers?: Record<string, FieldReference>;
	body?: Record<string, FieldReference>;
	/** Builds the body from field values; runs after the `body` map. */
	buildBody?: BodyBuilder;
	response: ResponseKind;
	/** Opt a collection out of Return All / Limit; say why in a comment. */
	paginated?: false;
	/**
	 * Node version 1 returned this collection as one item holding the whole
	 * response; later versions split it like every other collection. Return All
	 * and Limit show only from the version that splits it.
	 */
	legacyWrapper?: true;
	/**
	 * Escape hatch for an operation no response kind describes: this routing
	 * replaces the generated one. Its `$parameter` references are still checked.
	 */
	routing?: INodePropertyRouting;
}

/** A resource and the operation definitions it groups, in UI order. */
export interface ResourceDefinition {
	value: string;
	defaultOperation: string;
	operations: OperationDefinition[];
}

export function defineOperation(definition: OperationDefinition): OperationDefinition {
	return definition;
}

export function defineResource(definition: ResourceDefinition): ResourceDefinition {
	return definition;
}
