import { describe, expect, it } from 'vitest';
import { AutodeskVaultDataApi } from '../AutodeskVaultDataApi.node';
import { describeOperations, type DescriptionView } from './helpers/describeOperations';
import frozen from '../../../test-fixtures/description-2.0.1.json';

/**
 * The node as users met it in 2.0.1, frozen per operation before the
 * description was generated from operation definitions. Every operation must
 * still show the same fields in the same order and send the same request.
 * Delete this test and its fixture once the migration is released.
 */
const after = describeOperations(new AutodeskVaultDataApi().description);

/**
 * Hooks that kept their behaviour but changed their name: an inline function
 * that became a named one. Each entry maps the fixture's marker to the new one
 * for one operation; nothing else about that operation may differ.
 */
const RENAMED_HOOKS: Record<string, Record<string, string>> = {
	'files/getFileVersionContentHead': { '[fn anonymous]': '[fn returnHeaders]' },
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

const before = withRenamedHooks(frozen as DescriptionView);

describe('description equivalence with 2.0.1', () => {
	it('has the same resources, operation order and default operations', () => {
		expect(after.resources).toEqual(before.resources);
	});

	it('has no operation that 2.0.1 did not have', () => {
		expect(Object.keys(after.operations).sort()).toEqual(Object.keys(before.operations).sort());
	});

	it.each(Object.keys(before.operations))('%s shows and sends the same', (key) => {
		expect(after.operations[key]).toEqual(before.operations[key]);
	});
});
