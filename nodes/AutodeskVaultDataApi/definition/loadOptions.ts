import { ILoadOptions, INodePropertyMode } from 'n8n-workflow';

/**
 * Builds a declarative loadOptions routing block that fetches a list from the
 * Vault API and maps each result to a sorted { name, value } option.
 *
 * @param url      Request URL. Use an `=` expression for vault-scoped paths,
 *                 e.g. `=/.../vaults/{{$parameter["vaultId"]}}/links`.
 * @param nameExpr Expression for the option label. Defaults to the result name.
 */
export function listLoadOptions(url: string, nameExpr = '={{$responseItem.name}}'): ILoadOptions {
	return {
		routing: {
			request: {
				method: 'GET',
				url,
				qs: {
					limit: '1000',
				},
			},
			output: {
				postReceive: [
					{
						type: 'rootProperty',
						properties: {
							property: 'results',
						},
					},
					{
						type: 'setKeyValue',
						properties: {
							name: nameExpr,
							value: '={{$responseItem.id}}',
						},
					},
					{
						type: 'sort',
						properties: {
							key: 'name',
						},
					},
				],
			},
		},
	};
}

/**
 * Builds the "From List" / "By ID" modes for a resource-locator field backed by
 * a searchable listSearch method. Spread the result into the field definition.
 *
 * It returns `{ modes }` rather than the bare array so the mode objects sit
 * under a `modes` key in the source, which is how the n8n lint rule (and the
 * community package scanner) tells them apart from parameters that need a
 * `default`.
 *
 * @param searchListMethod Name of the registered listSearch method
 * @param idPlaceholder    Placeholder for the manual "By ID" input
 * @param idOptions        Optional hint and ID validation overrides
 */
export function resourceLocatorModes(
	searchListMethod: string,
	idPlaceholder: string,
	idOptions: { idHint?: string; idRegex?: string; idError?: string } = {},
): { modes: INodePropertyMode[] } {
	const { idHint, idRegex = '^[0-9]+$', idError = 'Enter a numeric ID' } = idOptions;
	return {
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod,
					searchable: true,
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: idPlaceholder,
				...(idHint ? { hint: idHint } : {}),
				validation: [
					{
						type: 'regex',
						properties: {
							regex: idRegex,
							errorMessage: idError,
						},
					},
				],
			},
		],
	};
}
