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
const before = frozen as DescriptionView;
const after = describeOperations(new AutodeskVaultDataApi().description);

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
