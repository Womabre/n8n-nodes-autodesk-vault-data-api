import { describe, expect, it } from 'vitest';
import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import { AutodeskVaultDataApi } from '../../AutodeskVaultDataApi.node';
import { buildProperties } from '../buildProperties';
import { defineOperation, defineResource } from '../defineOperation';

/**
 * The n8n lint rules read the source, so they skip the operation options
 * buildProperties generates. These checks run the same rules over the built
 * description instead (eslint-plugin-n8n-nodes-base):
 *
 * - node-param-options-type-unsorted-items: five or more options are sorted by name
 * - node-param-option-name-duplicate / node-param-option-value-duplicate
 * - node-param-operation-option-without-action
 * - node-param-operation-option-action-miscased: actions are sentence case,
 *   ignoring all-uppercase words such as ID
 */
const MIN_ITEMS_TO_ALPHABETIZE = 5;

/**
 * sentence-case 3.0.4, which the lint rule uses, inlined: n8n's lint forbids
 * importing packages a Cloud node may not depend on, tests included.
 */
function sentenceCase(input: string): string {
	const split = [/([a-z0-9])([A-Z])/g, /([A-Z])([A-Z][a-z])/g].reduce(
		(text, pattern) => text.replace(pattern, '$1\0$2'),
		input,
	);
	return split
		.replace(/[^A-Z0-9]+/gi, '\0')
		.split('\0')
		.filter((word) => word.length > 0)
		.map((word, index) => {
			const lower = word.toLowerCase();
			return index === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
		})
		.join(' ');
}

function isSentenceCase(sentence: string): boolean {
	const words = sentence
		.split(' ')
		.filter((word) => word !== word.toUpperCase())
		.join(' ');
	return words === sentenceCase(words);
}

function lintFindings(properties: INodeProperties[]): string[] {
	const findings: string[] = [];
	for (const selector of properties.filter((property) => property.name === 'operation')) {
		const resource = String(selector.displayOptions?.show?.resource);
		const options = (selector.options ?? []) as INodePropertyOptions[];

		const names = options.map((option) => option.name);
		const sorted = [...names].sort((a, b) => a.localeCompare(b));
		if (names.length >= MIN_ITEMS_TO_ALPHABETIZE && names.join('|') !== sorted.join('|')) {
			findings.push(`${resource}: operations are not sorted by name`);
		}
		for (const [kind, list] of [
			['name', names],
			['value', options.map((option) => String(option.value))],
		] as const) {
			const duplicate = list.find((entry, index) => list.indexOf(entry) !== index);
			if (duplicate) findings.push(`${resource}: duplicate operation ${kind} "${duplicate}"`);
		}
		for (const option of options) {
			if (!option.action) {
				findings.push(`${resource}/${String(option.value)}: no action`);
			} else if (!isSentenceCase(option.action)) {
				findings.push(
					`${resource}/${String(option.value)}: action "${option.action}" is not sentence case`,
				);
			}
		}
	}
	return findings;
}

/**
 * Findings that were already true in 2.0.1, where the lint rule skipped these
 * option lists because they held template literals and functions. Sorting
 * them changes the order users see, so it ships with the follow-up fixes;
 * remove each entry when it is fixed.
 */
const KNOWN_FINDINGS = [
	'files: operations are not sorted by name',
	'items: operations are not sorted by name',
];

describe('lint rules on the generated operations', () => {
	it('the node passes them, apart from the known 2.0.1 findings', () => {
		expect(lintFindings(new AutodeskVaultDataApi().description.properties)).toEqual(KNOWN_FINDINGS);
	});

	it('they catch a broken definition', () => {
		const broken = (name: string, value: string, action: string) =>
			defineOperation({
				name,
				value,
				action,
				description: 'Broken on purpose',
				method: 'GET',
				path: '/x',
				fields: [],
				response: 'single',
			});
		const properties = buildProperties([
			defineResource({
				value: 'things',
				defaultOperation: 'e',
				operations: [
					broken('E Thing', 'e', 'Get Thing By Name'),
					broken('D Thing', 'd', 'Get thing'),
					broken('C Thing', 'c', 'Get thing'),
					broken('B Thing', 'b', 'Get thing'),
					broken('B Thing', 'a', 'Get thing'),
				],
			}),
		]);
		expect(lintFindings(properties)).toEqual([
			'things: operations are not sorted by name',
			'things: duplicate operation name "B Thing"',
			'things/e: action "Get Thing By Name" is not sentence case',
		]);
	});
});
