import { describe, expect, it } from 'vitest';
import { AutodeskVaultDataApi } from '../AutodeskVaultDataApi.node';
import { describeOperations, type DescriptionView } from './helpers/describeOperations';
import { queryValue } from '../definition/buildProperties';
import frozen from '../../../test-fixtures/description-2.0.1.json';
import frozenNode from '../../../test-fixtures/node-2.0.1.json';

/**
 * The node as users met it in 2.0.1, frozen per operation before the
 * description was generated from operation definitions. Every operation must
 * still show the same fields in the same order and send the same request,
 * apart from the changes listed in INTENDED_CHANGES. Delete this test and its
 * fixtures once the migration is released.
 */
const after = canonical(describeOperations(new AutodeskVaultDataApi().description));

/**
 * Hooks that kept their behaviour but changed their name: an inline function
 * that became a named one. Each entry maps the fixture's marker to the new one
 * for one operation; nothing else about that operation may differ.
 */
const RENAMED_HOOKS: Record<string, Record<string, string>> = {
	'files/getFileVersionContentHead': { '[fn anonymous]': '[fn returnHeaders]' },
	// Body builders now declare the fields they read and run through one preSend,
	// buildBody. The bodies they send are pinned by each builder's own tests,
	// which run through that same preSend.
	'jobs/addJob': { '[fn formatJobBody]': '[fn buildBody]' },
	'extSyncTasks/addExtSyncTask': { '[fn formatExtSyncTaskBody]': '[fn buildBody]' },
	'extSyncTasks/addExtSyncTasks': { '[fn formatExtSyncTaskBatchBody]': '[fn buildBody]' },
	'extSyncTasks/queryExtSyncTasks': { '[fn formatExtSyncTaskQueryBody]': '[fn buildBody]' },
	'search/advancedSearch': {
		'"[fn formatFolderUrls]","[fn formatPropertyDefinitionUrls]"': '"[fn buildBody]"',
	},
	'files/updateFileLifecycleDefinitions': { '[fn anonymous]': '[fn buildBody]' },
	'files/updateFileLifecycleStates': { '[fn anonymous]': '[fn buildBody]' },
	'folders/updateFolderLifecycleDefinitions': { '[fn anonymous]': '[fn buildBody]' },
	'folders/updateFolderLifecycleStates': { '[fn anonymous]': '[fn buildBody]' },
	'items/updateItemLifecycleDefinitions': { '[fn anonymous]': '[fn buildBody]' },
	'items/updateItemLifecycleStates': { '[fn anonymous]': '[fn buildBody]' },
};

function withRenamedHooks(view: DescriptionView): DescriptionView {
	const operations = { ...view.operations };
	for (const [key, renames] of Object.entries(RENAMED_HOOKS)) {
		let text = JSON.stringify(operations[key]);
		for (const [from, to] of Object.entries(renames)) text = text.split(from).join(to);
		operations[key] = JSON.parse(text);
	}
	return { ...view, operations };
}

/**
 * n8n evaluates a string that starts with `=` as an expression. Without any
 * `{{ }}` in it, `'=/path'` resolves to `'/path'`, so both spellings send the
 * same request. 2.0.1 used both for constant URLs; the builder writes the
 * plain one. Only request URLs are treated this way.
 */
function canonical<T>(view: T): T {
	return JSON.parse(
		JSON.stringify(view, (key, value: unknown) =>
			key === 'url' && typeof value === 'string' && value.startsWith('=') && !value.includes('{{')
				? value.slice(1)
				: value,
		),
	) as T;
}

const before = canonical(withRenamedHooks(frozen as DescriptionView));

interface RoutingView {
	request: { qs?: Record<string, unknown> } & Record<string, unknown>;
	output?: { postReceive: unknown[] };
}

function routingOf(view: DescriptionView, key: string): RoutingView {
	const option = view.operations[key]?.option as { routing?: RoutingView } | undefined;
	if (!option?.routing) throw new Error(`${key} has no routing in the view`);
	return option.routing;
}

/**
 * User-visible changes made on purpose after 2.0.1, each applied to the 2.0.1
 * view. The test then pins exactly these differences and nothing else.
 */
interface IntendedChange {
	why: string;
	apply(view: DescriptionView): void;
}

const INTENDED_CHANGES: IntendedChange[] = [
	{
		why: 'Change Order > Get Many sends the state filter as filter[State], the name the API reads',
		apply(view) {
			const qs = routingOf(view, 'changeOrders/getChangeOrders').request.qs ?? {};
			qs['filter[State]'] = qs['filter[state]'];
			delete qs['filter[state]'];
		},
	},
	{
		why: 'Get Many User Accounts and Get Many Item Version Associated Files get Return All and Limit, from node version 1.1',
		apply(view) {
			const pagination = view.operations['items/getItems'].fields
				.map((field) => field as { name: string; displayOptions?: { show?: object } })
				.filter((field) => field.name === 'returnAll' || field.name === 'limit')
				.map((field) => ({
					...field,
					displayOptions: {
						...field.displayOptions,
						show: { ...field.displayOptions?.show, '@version': [{ _cnd: { gte: 1.1 } }] },
					},
				}));
			if (pagination.length !== 2) throw new Error('items/getItems lost Return All or Limit');
			for (const key of ['user/getUserAccounts', 'items/getItemVersionAssociatedFiles']) {
				view.operations[key].fields.push(...pagination);
			}
		},
	},
	{
		why: 'every query value is left out only when it is an empty string, so false and 0 are sent (Latest Only off now reaches Search and Advanced Search)',
		apply(view) {
			const FIELD = /^=\{\{\$parameter\["([^"]+)"\](?: \|\| undefined)?\}\}$/;
			for (const key of Object.keys(view.operations)) {
				const qs = (view.operations[key].option as { routing?: RoutingView }).routing?.request.qs;
				for (const [parameter, value] of Object.entries(qs ?? {})) {
					const match = typeof value === 'string' ? FIELD.exec(value) : null;
					if (!match) throw new Error(`${key} sends ${parameter} in a way this change does not cover`);
					(qs as Record<string, unknown>)[parameter] = queryValue(match[1]);
				}
			}
		},
	},
];

function withIntendedChanges(view: DescriptionView): DescriptionView {
	const changed = JSON.parse(JSON.stringify(view)) as DescriptionView;
	for (const change of INTENDED_CHANGES) change.apply(changed);
	return changed;
}

const expected = withIntendedChanges(before);

describe('description equivalence with 2.0.1, apart from the intended changes', () => {
	it('has the same resources, operation order and default operations', () => {
		expect(after.resources).toEqual(expected.resources);
	});

	it('has no operation that 2.0.1 did not have', () => {
		expect(Object.keys(after.operations).sort()).toEqual(Object.keys(expected.operations).sort());
	});

	it.each(Object.keys(expected.operations))('%s shows and sends the same', (key) => {
		expect(after.operations[key]).toEqual(expected.operations[key]);
	});

	it.each(INTENDED_CHANGES.map((change) => change.why))('the change is real: %s', (why) => {
		const change = INTENDED_CHANGES.find((entry) => entry.why === why) as IntendedChange;
		const only = JSON.parse(JSON.stringify(before)) as DescriptionView;
		change.apply(only);
		expect(only).not.toEqual(before);
	});
});

/**
 * What the per-operation view leaves out: the node's own settings, the
 * authentication and resource selectors, and each operation selector's
 * settings (display name, type, default). Frozen from 2.0.1 the same way.
 */
describe('node-level equivalence with 2.0.1', () => {
	const { properties, ...node } = new AutodeskVaultDataApi().description;

	it('has the same node settings', () => {
		expect(JSON.parse(JSON.stringify(node))).toEqual(frozenNode.node);
	});

	it('has the same authentication and resource selectors', () => {
		const selectors = properties.filter(
			(property) => property.name === 'authentication' || property.name === 'resource',
		);
		expect(JSON.parse(JSON.stringify(selectors))).toEqual(frozenNode.selectors);
	});

	it('has the same operation selector settings for every resource', () => {
		const operationSelectors = Object.fromEntries(
			properties
				.filter((property) => property.name === 'operation')
				.map((selector) => {
					const settings: Partial<typeof selector> = { ...selector };
					delete settings.options;
					delete settings.displayOptions;
					return [(selector.displayOptions?.show?.resource as string[]).join(','), settings];
				}),
		);
		expect(JSON.parse(JSON.stringify(operationSelectors))).toEqual(frozenNode.operationSelectors);
	});
});
