import {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	NodeOperationError,
} from 'n8n-workflow';

/** Field values a body builder asked for, keyed by field name. */
export type FieldValues = Record<string, unknown>;

/**
 * Builds a request body from field values. The operation definition that uses
 * it must declare every field in `reads`, so the body can never depend on a
 * field the operation does not show.
 */
export interface BodyBuilder {
	/**
	 * The fields the body is built from, each with the value to use when the
	 * field is not set. `undefined` means the field must be set.
	 */
	reads: Record<string, unknown>;
	/**
	 * Returns the body. An object is merged into the body the request's field
	 * map already built; an array is sent as the whole body.
	 * Call `fail` when the input cannot make a valid request; it shows the
	 * message as a node error and does not return.
	 */
	build(values: FieldValues, fail: (message: string) => never): IDataObject | IDataObject[];
}

/** The preSend action that reads a builder's fields and sets the body. */
export function bodyPreSend(builder: BodyBuilder) {
	return async function buildBody(
		this: IExecuteSingleFunctions,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		const values: FieldValues = {};
		for (const [name, fallback] of Object.entries(builder.reads)) {
			values[name] =
				fallback === undefined
					? this.getNodeParameter(name)
					: this.getNodeParameter(name, fallback);
		}

		const fail = (message: string): never => {
			throw new NodeOperationError(this.getNode(), message);
		};
		const built = builder.build(values, fail);

		const existing = requestOptions.body;
		requestOptions.body =
			Array.isArray(built) || !existing || typeof existing !== 'object'
				? built
				: { ...(existing as IDataObject), ...built };
		return requestOptions;
	};
}
