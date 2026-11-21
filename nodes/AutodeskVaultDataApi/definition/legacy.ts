import type { INodeProperties } from 'n8n-workflow';
import type { ResourceDefinition } from './defineOperation';

/**
 * Transition only: removes the migrated operations from the hand-kept
 * parameter lists, so a migrated operation shows only the fields its
 * operation definition declares. Delete with `parameters/shared-parameters.ts`.
 */
export function withoutMigrated(
	parameters: INodeProperties[],
	migrated: ResourceDefinition[],
): INodeProperties[] {
	const resources = migrated.map((resource) => resource.value);
	const operations = migrated.flatMap((resource) =>
		resource.operations.map((operation) => operation.value),
	);

	return parameters.flatMap((parameter) => {
		const show = parameter.displayOptions?.show;
		if (!show) return [parameter];
		const shownOperations = show.operation as string[] | undefined;
		const shownResources = show.resource as string[] | undefined;

		if (shownOperations) {
			const kept = shownOperations.filter((operation) => !operations.includes(operation));
			if (kept.length === 0) return [];
			if (kept.length === shownOperations.length) return [parameter];
			return [
				{
					...parameter,
					displayOptions: { ...parameter.displayOptions, show: { ...show, operation: kept } },
				},
			];
		}
		if (shownResources) {
			const kept = shownResources.filter((resource) => !resources.includes(resource));
			if (kept.length === 0) return [];
			if (kept.length === shownResources.length) return [parameter];
			return [
				{
					...parameter,
					displayOptions: { ...parameter.displayOptions, show: { ...show, resource: kept } },
				},
			];
		}
		return [parameter];
	});
}
