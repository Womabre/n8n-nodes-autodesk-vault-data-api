import { describe, expect, it } from 'vitest';
import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import { buildProperties, DefinitionError } from '../buildProperties';
import { defineOperation, defineResource, type OperationDefinition } from '../defineOperation';
import { limit, returnAll } from '../fields';
import { processBinaryResponse } from '../../utils/binary';
import { handleEmptyResponse, returnHeaders, splitResults } from '../../utils/response';

function field(name: string, extra: Partial<INodeProperties> = {}): INodeProperties {
	return { displayName: name, name, type: 'string', default: '', ...extra };
}

const thingId = field('thingId');
const query = field('query');

function operation(overrides: Partial<OperationDefinition> = {}): OperationDefinition {
	return defineOperation({
		name: 'Get Thing',
		value: 'getThing',
		action: 'Get thing',
		description: 'Get one thing',
		method: 'GET',
		path: '/things/{thingId}',
		fields: [thingId],
		response: 'single',
		...overrides,
	});
}

function build(...operations: OperationDefinition[]): INodeProperties[] {
	return buildProperties([
		defineResource({ value: 'things', defaultOperation: operations[0].value, operations }),
	]);
}

function optionOf(properties: INodeProperties[], value: string): INodePropertyOptions {
	const selector = properties.find((property) => property.name === 'operation');
	const options = selector?.options as INodePropertyOptions[];
	return options.find((option) => option.value === value) as INodePropertyOptions;
}

function fieldsShownFor(properties: INodeProperties[], value: string): string[] {
	return properties
		.filter((property) => property.name !== 'operation')
		.filter((property) => (property.displayOptions?.show?.operation as string[]).includes(value))
		.map((property) => property.name);
}

describe('buildProperties: routing', () => {
	it('builds the URL from the path and declared fields', () => {
		const option = optionOf(build(operation()), 'getThing');
		expect(option.routing?.request).toEqual({
			method: 'GET',
			url: '=/AutodeskDM/Services/api/vault/v2/things/{{$parameter["thingId"]}}',
		});
	});

	it('leaves a path without fields as a plain URL', () => {
		const option = optionOf(build(operation({ path: '/things', fields: [] })), 'getThing');
		expect(option.routing?.request?.url).toBe('/AutodeskDM/Services/api/vault/v2/things');
	});

	it('sends a field as is, or leaves it out when empty with a trailing ?', () => {
		const option = optionOf(
			build(operation({ fields: [thingId, query], query: { a: 'query', b: 'query?' } })),
			'getThing',
		);
		expect(option.routing?.request?.qs).toEqual({
			a: '={{$parameter["query"]}}',
			b: '={{$parameter["query"] || undefined}}',
		});
	});

	it('maps headers and body the same way', () => {
		const option = optionOf(
			build(
				operation({ fields: [thingId, query], headers: { H: 'query?' }, body: { q: 'query' } }),
			),
			'getThing',
		);
		expect(option.routing?.request?.headers).toEqual({
			H: '={{$parameter["query"] || undefined}}',
		});
		expect(option.routing?.request?.body).toEqual({ q: '={{$parameter["query"]}}' });
	});

	it('runs a body builder through one preSend', () => {
		const buildBody = { reads: { query: '' }, build: () => ({}) };
		const option = optionOf(build(operation({ fields: [thingId, query], buildBody })), 'getThing');
		const preSend = option.routing?.send?.preSend ?? [];
		expect(preSend).toHaveLength(1);
		expect(preSend[0].name).toBe('buildBody');
	});

	it('uses the raw routing escape hatch unchanged', () => {
		const routing = { request: { method: 'GET' as const, url: '=/x/{{$parameter["thingId"]}}' } };
		expect(optionOf(build(operation({ routing })), 'getThing').routing).toBe(routing);
	});
});

describe('buildProperties: response kinds', () => {
	it('single adds no output actions', () => {
		expect(optionOf(build(operation()), 'getThing').routing?.output).toBeUndefined();
	});

	it('collection unwraps results and adds Return All and Limit last', () => {
		const properties = build(operation({ fields: [thingId, query], response: 'collection' }));
		expect(optionOf(properties, 'getThing').routing?.output?.postReceive).toEqual([
			{ type: 'rootProperty', properties: { property: 'results' } },
		]);
		expect(fieldsShownFor(properties, 'getThing')).toEqual([
			'thingId',
			'query',
			'returnAll',
			'limit',
		]);
		expect(properties.find((p) => p.name === 'returnAll')?.routing).toEqual(returnAll.routing);
		expect(properties.find((p) => p.name === 'limit')?.displayOptions?.show?.returnAll).toEqual([
			false,
		]);
		expect(limit.default).toBe(50);
	});

	it('a collection with paginated: false gets no Return All or Limit', () => {
		const properties = build(operation({ response: 'collection', paginated: false }));
		expect(fieldsShownFor(properties, 'getThing')).toEqual(['thingId']);
	});

	it('a legacy wrapper collection splits results by node version', () => {
		const properties = build(
			operation({ response: 'collection', paginated: false, legacyWrapper: true }),
		);
		expect(optionOf(properties, 'getThing').routing?.output?.postReceive).toEqual([splitResults]);
	});

	it('empty, binary and headers attach their actions and request options', () => {
		const properties = build(
			operation({ value: 'a', response: 'empty' }),
			operation({ value: 'b', response: 'binary' }),
			operation({ value: 'c', method: 'HEAD', response: 'headers' }),
		);
		expect(optionOf(properties, 'a').routing?.output?.postReceive).toEqual([handleEmptyResponse]);
		expect(optionOf(properties, 'b').routing?.output?.postReceive).toEqual([processBinaryResponse]);
		expect(optionOf(properties, 'b').routing?.request).toMatchObject({
			returnFullResponse: true,
			encoding: 'arraybuffer',
		});
		expect(optionOf(properties, 'c').routing?.output?.postReceive).toEqual([returnHeaders]);
		expect(optionOf(properties, 'c').routing?.request?.returnFullResponse).toBe(true);
		expect(optionOf(properties, 'c').routing?.request?.encoding).toBeUndefined();
	});
});

describe('buildProperties: shared fields', () => {
	it('merges identical fields into one property shown for every operation', () => {
		const properties = build(operation({ value: 'a' }), operation({ value: 'b' }));
		const thing = properties.filter((p) => p.name === 'thingId');
		expect(thing).toHaveLength(1);
		expect(thing[0].displayOptions?.show).toEqual({ resource: ['things'], operation: ['a', 'b'] });
	});

	it('keeps differently shaped fields with the same name apart', () => {
		const other = field('thingId', { description: 'Another thing' });
		const properties = build(operation({ value: 'a' }), operation({ value: 'b', fields: [other] }));
		expect(properties.filter((p) => p.name === 'thingId')).toHaveLength(2);
	});

	it('keeps a field’s own display conditions next to the generated ones', () => {
		const conditional = field('query', { displayOptions: { show: { mode: ['x'] } } });
		const properties = build(operation({ fields: [thingId, conditional] }));
		expect(properties.find((p) => p.name === 'query')?.displayOptions?.show).toEqual({
			resource: ['things'],
			operation: ['getThing'],
			mode: ['x'],
		});
	});

	it('orders merged fields so each operation keeps its declared order', () => {
		const a = field('a');
		const b = field('b');
		const c = field('c');
		const properties = build(
			operation({ value: 'one', path: '/x', fields: [a, c] }),
			operation({ value: 'two', path: '/x', fields: [a, b, c] }),
		);
		expect(fieldsShownFor(properties, 'one')).toEqual(['a', 'c']);
		expect(fieldsShownFor(properties, 'two')).toEqual(['a', 'b', 'c']);
	});

	it('puts one operation selector per resource first', () => {
		const properties = buildProperties([
			defineResource({ value: 'things', defaultOperation: 'getThing', operations: [operation()] }),
			defineResource({
				value: 'others',
				defaultOperation: 'getOther',
				operations: [operation({ value: 'getOther' })],
			}),
		]);
		expect(
			properties.slice(0, 2).map((p) => [p.name, p.displayOptions?.show?.resource, p.default]),
		).toEqual([
			['operation', ['things'], 'getThing'],
			['operation', ['others'], 'getOther'],
		]);
	});
});

describe('buildProperties: refuses inconsistent definitions', () => {
	const refuses = (fn: () => unknown, message: RegExp) => {
		expect(fn).toThrow(DefinitionError);
		expect(fn).toThrow(message);
	};

	it('a path field that is not declared', () => {
		refuses(() => build(operation({ fields: [] })), /things\/getThing sends "thingId"/);
	});

	it('a query, header or body field that is not declared', () => {
		refuses(() => build(operation({ query: { q: 'query?' } })), /sends "query"/);
		refuses(() => build(operation({ headers: { H: 'query' } })), /sends "query"/);
		refuses(() => build(operation({ body: { b: 'query' } })), /sends "query"/);
	});

	it('a body builder that reads an undeclared field', () => {
		const buildBody = { reads: { query: '' }, build: () => ({}) };
		refuses(() => build(operation({ method: 'POST', buildBody })), /sends "query"/);
	});

	it('a raw routing that refers to an undeclared field', () => {
		const routing = { request: { url: '=/x/{{$parameter["missing"]}}' } };
		refuses(() => build(operation({ routing })), /sends "missing"/);
	});

	it('the same field twice on one operation', () => {
		refuses(
			() => build(operation({ fields: [thingId, thingId] })),
			/declares the field "thingId" twice/,
		);
	});

	it('a field whose options load from a field the operation does not declare', () => {
		const dependent = field('child', { typeOptions: { loadOptionsDependsOn: ['parent'] } });
		refuses(
			() => build(operation({ fields: [thingId, dependent] })),
			/shows "child", which loads from "parent"/,
		);
	});

	it('shared fields declared in conflicting orders, naming both operations', () => {
		const a = field('a');
		const b = field('b');
		refuses(
			() =>
				build(
					operation({ value: 'one', path: '/x', fields: [a, b] }),
					operation({ value: 'two', path: '/x', fields: [b, a] }),
				),
			/conflicting orders by .*things\/(one|two).* and .*things\/(one|two)/,
		);
	});

	it('a default operation the resource does not define', () => {
		refuses(
			() =>
				buildProperties([
					defineResource({ value: 'things', defaultOperation: 'nope', operations: [operation()] }),
				]),
			/defaults to "nope"/,
		);
	});

	it('an operation value used twice', () => {
		refuses(() => build(operation(), operation()), /"getThing" is used twice/);
	});

	it('a legacy wrapper on something that is not a collection', () => {
		refuses(() => build(operation({ legacyWrapper: true })), /legacy wrapper/);
	});
});
