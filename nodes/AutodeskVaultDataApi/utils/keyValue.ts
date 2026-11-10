/** One row of a "Parameters" key/value list in the node UI. */
export interface KeyValueEntry {
	key?: string;
	value?: string;
}

/**
 * Folds the UI's key/value rows into the string map the API expects for
 * `params` on jobs and external sync tasks. Rows without a key are dropped,
 * and the result is `undefined` when no row is left.
 */
export function foldParams(
	entries: KeyValueEntry[] | undefined,
): Record<string, string> | undefined {
	if (!entries?.length) return undefined;

	const params: Record<string, string> = {};
	for (const entry of entries) {
		if (entry.key) params[entry.key] = entry.value ?? '';
	}

	return Object.keys(params).length > 0 ? params : undefined;
}
