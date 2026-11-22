import type { INodeProperties, INodePropertyOptions, INodeTypeDescription } from 'n8n-workflow';

/**
 * A per-operation view of the node description: what a user sees and what is
 * sent when they pick one resource and operation.
 *
 * The global order of `properties` and the operation lists inside each
 * field's `displayOptions` are deliberately left out: both change when the
 * description is generated from operation definitions, while what each
 * operation shows and sends must not.
 */
export interface OperationView {
	resource: string;
	/** The operation option itself (name, value, action, description, routing). */
	option: unknown;
	/** Fields shown for this operation, in the order the UI shows them. */
	fields: unknown[];
}

export interface DescriptionView {
	/** Per resource: its operations in UI order and the default operation. */
	resources: Record<string, { operations: string[]; default: unknown }>;
	/** Keyed `resource/operation`. */
	operations: Record<string, OperationView>;
}

const SELECTORS = ['authentication', 'resource', 'operation'];

/** Replaces functions with a readable marker so the view survives JSON. */
function normalize(value: unknown): unknown {
	if (typeof value === 'function') {
		return `[fn ${value.name || 'anonymous'}]`;
	}
	if (Array.isArray(value)) {
		return value.map(normalize);
	}
	if (value && typeof value === 'object') {
		const out: Record<string, unknown> = {};
		for (const [key, entry] of Object.entries(value)) {
			if (entry !== undefined) out[key] = normalize(entry);
		}
		return out;
	}
	return value;
}

function isShownFor(property: INodeProperties, resource: string, operation: string): boolean {
	const show = property.displayOptions?.show ?? {};
	const resources = show.resource as string[] | undefined;
	const operations = show.operation as string[] | undefined;
	return (
		(!resources || resources.includes(resource)) && (!operations || operations.includes(operation))
	);
}

/**
 * A field as the user meets it for one operation: its definition without the
 * resource/operation lists, but with every other display condition (such as
 * Limit only showing while Return All is off).
 */
function fieldView(property: INodeProperties): unknown {
	const { displayOptions, ...rest } = property;
	const show = { ...(displayOptions?.show ?? {}) };
	delete show.resource;
	delete show.operation;
	const view: Record<string, unknown> = { ...rest };
	const conditions: Record<string, unknown> = {};
	if (Object.keys(show).length > 0) conditions.show = show;
	if (displayOptions?.hide) conditions.hide = displayOptions.hide;
	if (Object.keys(conditions).length > 0) view.displayOptions = conditions;
	return normalize(view);
}

export function describeOperations(description: INodeTypeDescription): DescriptionView {
	const properties = description.properties;
	const fields = properties.filter((property) => !SELECTORS.includes(property.name));
	const view: DescriptionView = { resources: {}, operations: {} };

	for (const selector of properties.filter((property) => property.name === 'operation')) {
		const resources = (selector.displayOptions?.show?.resource ?? []) as string[];
		const options = (selector.options ?? []) as INodePropertyOptions[];
		for (const resource of resources) {
			view.resources[resource] = {
				operations: options.map((option) => String(option.value)),
				default: selector.default,
			};
			for (const option of options) {
				const operation = String(option.value);
				view.operations[`${resource}/${operation}`] = {
					resource,
					option: normalize(option),
					fields: fields.filter((field) => isShownFor(field, resource, operation)).map(fieldView),
				};
			}
		}
	}

	return view;
}
