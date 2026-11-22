import {
	IDataObject,
	IExecuteSingleFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
	sleep,
} from 'n8n-workflow';
import { lifecycleDefinitionsBody, lifecycleStatesBody } from '../utils/lifecycleBody';
import { API_BASE } from '../utils/constants';
import { queryValue } from '../definition/buildProperties';
import { defineOperation, defineResource } from '../definition/defineOperation';
import {
	extendedModels,
	latestOnly,
	lifecycleComment,
	propDefIds,
	q,
	releasedFilesOnly,
	releasedOnly,
	sort,
	vaultId,
} from '../definition/fields';
import { resourceLocatorModes } from '../definition/loadOptions';

interface BubbleNode {
	type?: string;
	role?: string;
	children?: BubbleNode[];
}

function containsRenderableGeometry(node: BubbleNode): boolean {
	if (node.type === 'geometry' && (node.role === '3d' || node.role === '2d')) {
		return true;
	}
	if (Array.isArray(node.children)) {
		return node.children.some(containsRenderableGeometry);
	}
	return false;
}

/**
 * postReceive for "Get File Version LMV Bubble JSON". Polls bubble.json until
 * it contains renderable geometry or "Max Wait Time (Seconds)" is used up.
 */
export async function waitForLmvBubble(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	// Vault LMV (SVF) translation is asynchronous: bubble.json is served as
	// soon as translation starts but only gains renderable geometry once it
	// finishes. Poll with exponential backoff (2s, 4s, 8s, 16s, then 30s per
	// attempt) until the configured maximum wait time has been used up.
	const maxWaitMs = Math.max(0, this.getNodeParameter('lmvMaxWaitSeconds', 180) as number) * 1000;
	const baseDelayMs = 2000;
	let waitedMs = 0;

	let attempt = 0;
	let json: BubbleNode | undefined;
	let lastFailureReason = 'unknown';

	// Re-request through the authenticated helper so the bearer token is
	// refreshed automatically if it expires during a long-running poll.
	const authMethod = this.getNodeParameter('authentication') as string;
	const credentialType =
		authMethod === 'OAuth2' ? 'autodeskVaultDataOAuth2Api' : 'autodeskVaultAccountApi';
	const { vaultServerUrl } = (await this.getCredentials(credentialType)) as {
		vaultServerUrl: string;
	};
	const baseUrl = String(vaultServerUrl).replace(/\/$/, '');

	const vaultId = this.getNodeParameter('vaultId');
	const fileId = this.getNodeParameter('fileId');
	const allowSync = this.getNodeParameter('allowSync');
	const wmSrcItemVerId = this.getNodeParameter('wmSrcItemVerId');
	const wmSrcFileVerId = this.getNodeParameter('wmSrcFileVerId');

	const qs: Record<string, string> = { allowSync: String(allowSync) };
	if (wmSrcItemVerId) qs.wmSrcItemVerId = String(wmSrcItemVerId);
	if (wmSrcFileVerId) qs.wmSrcFileVerId = String(wmSrcFileVerId);

	while (true) {
		if (attempt > 0) {
			// Exponential backoff: 2s, 4s, 8s, 16s, capped at 30s, and never
			// past the maximum wait time.
			const delayMs = Math.min(baseDelayMs * Math.pow(2, attempt - 1), 30000, maxWaitMs - waitedMs);
			if (delayMs <= 0) {
				break;
			}
			await sleep(delayMs);
			waitedMs += delayMs;

			response = (await this.helpers.httpRequestWithAuthentication.call(this, credentialType, {
				method: 'GET',
				url: `${baseUrl}${API_BASE}/vaults/${vaultId}/file-versions/${fileId}/svf/bubble.json`,
				qs,
				json: false,
				returnFullResponse: true,
			})) as IN8nHttpFullResponse;
		}

		try {
			json =
				typeof response.body === 'string'
					? (JSON.parse(response.body) as BubbleNode)
					: (response.body as BubbleNode);

			if (json && containsRenderableGeometry(json)) {
				break;
			}
			lastFailureReason = 'renderable geometry not yet present in bubble.json';
			json = undefined;
		} catch {
			lastFailureReason = 'bubble.json could not be parsed as JSON';
			json = undefined;
		}

		attempt++;
	}

	if (!json) {
		throw new NodeOperationError(
			this.getNode(),
			`bubble.json not ready after ${attempt} attempt(s) over ${Math.round(waitedMs / 1000)} seconds. Last failure: ${lastFailureReason}`,
			{
				description:
					'Vault may still be translating this file for the viewer. Increase "Max Wait Time (Seconds)" or try again later.',
			},
		);
	}

	return [{ json: json as unknown as IDataObject }];
}

const fileMasterId: INodeProperties = {
	displayName: 'File',
	name: 'fileMasterId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	description:
		'The file to use (groups all versions). Select one from the list, or provide the numeric file master ID directly.',
	...resourceLocatorModes('searchFileMasters', 'e.g. 100200'),
	displayOptions: { hide: { vaultId: [''] } },
};

const fileId: INodeProperties = {
	displayName: 'File Version',
	name: 'fileId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	description:
		'The file version to use. Search by file name and select the version from the list, or enter a version ID directly.',
	...resourceLocatorModes('searchFileVersions', 'e.g. 100201'),
	displayOptions: { hide: { vaultId: [''] } },
};

const allowSync: INodeProperties = {
	displayName: 'Allow Sync',
	name: 'allowSync',
	type: 'boolean',
	default: false,
	description: 'Whether the file should be synced to the local site in a multi-site environment',
};

const contentDisposition: INodeProperties = {
	displayName: 'Content Disposition',
	name: 'contentDisposition',
	type: 'options',
	options: [
		{ name: 'Inline', value: 'inline' },
		{ name: 'Attachment', value: 'attachment' },
	],
	default: 'inline',
	description:
		"Specify the content disposition of the response header. Use 'inline' to display the file in the browser, or 'attachment' to trigger a download.",
};

const wmSrcFileVerId: INodeProperties = {
	displayName: 'Watermarked Source File Version ID',
	name: 'wmSrcFileVerId',
	type: 'string',
	default: '',
	placeholder: 'e.g. 100201',
	description:
		"When current file is a dwf associated to an Item, directly or as a CAD file's visualization attachment, to download its watermarked version, supply this File Version's ID or its CAD File Version's ID as the watermark source",
};

const wmSrcItemVerId: INodeProperties = {
	displayName: 'Watermarked Source Item Version ID',
	name: 'wmSrcItemVerId',
	type: 'string',
	default: '',
	placeholder: 'e.g. 56732',
	description:
		"When current file is a dwf associated to an Item, to download its watermarked version, supply this Item Version's ID as the watermark source",
};

const getLatestAssociations: INodeProperties = {
	displayName: 'Get Latest Associations',
	name: 'getLatestAssociations',
	type: 'boolean',
	default: true,
	description: 'Whether to get only the latest file associations',
};

const recurse: INodeProperties = {
	displayName: 'Recurse',
	name: 'recurse',
	type: 'boolean',
	default: false,
	description: 'Whether to include all levels of parent files',
};

const includeHidden: INodeProperties = {
	displayName: 'Include Hidden',
	name: 'includeHidden',
	type: 'boolean',
	default: false,
	description: 'Whether to include files marked as hidden',
};

const releaseBiased: INodeProperties = {
	displayName: 'Release Biased',
	name: 'releaseBiased',
	type: 'boolean',
	default: true,
	description: 'Whether to use the "Release biased" approach for gathering dependencies',
};

export const resource = defineResource({
	value: 'files',
	defaultOperation: 'getFileById',
	operations: [
		defineOperation({
			name: 'Get File',
			value: 'getFileById',
			action: 'Get file',
			description:
				'Retrieve a file object by its ID (MasterId), optionally returning only the latest released version',
			method: 'GET',
			path: '/vaults/{vaultId}/files/{fileMasterId}',
			fields: [vaultId, fileMasterId, releasedOnly],
			query: { 'option[releasedOnly]': 'releasedOnly' },
			response: 'single',
		}),
		defineOperation({
			name: 'Get File Version',
			value: 'getFileVersionById',
			action: 'Get file version',
			description: 'Get file version object by its ID',
			method: 'GET',
			path: '/vaults/{vaultId}/file-versions/{fileId}',
			fields: [vaultId, fileId],
			response: 'single',
		}),
		defineOperation({
			name: 'Get File Version Content',
			value: 'getFileVersionContent',
			action: 'Get file version content',
			description:
				'Retrieve the content of a specific file version, supporting full and partial content downloads',
			method: 'GET',
			path: '/vaults/{vaultId}/file-versions/{fileId}/content',
			fields: [
				vaultId,
				allowSync,
				contentDisposition,
				fileId,
				{
					displayName: 'Range',
					name: 'range',
					type: 'string',
					description: 'Request only part of the file content, e.g. bytes=0-999',
					placeholder: 'e.g. bytes=0-999',
					default: '',
				},
				wmSrcFileVerId,
				wmSrcItemVerId,
			],
			query: {
				allowSync: 'allowSync',
				wmSrcItemVerId: 'wmSrcItemVerId',
				wmSrcFileVerId: 'wmSrcFileVerId',
				contentDisposition: 'contentDisposition',
			},
			headers: { Range: 'range?' },
			response: 'binary',
		}),
		defineOperation({
			name: 'Get File Version History',
			value: 'getFileHistory',
			action: 'Get file version history',
			description:
				'Retrieve the version history for the specified file (MasterId), with various filtering and revision options',
			method: 'GET',
			path: '/vaults/{vaultId}/files/{fileMasterId}/versions',
			fields: [
				vaultId,
				{
					displayName: 'Descending',
					name: 'descending',
					type: 'boolean',
					default: false,
					description: 'Whether to return the latest file version at the top',
				},
				{
					displayName: 'History',
					name: 'history',
					type: 'options',
					options: [
						{ name: 'All', value: 'All' },
						{ name: 'Released Only', value: 'ReleasedOnly' },
						{ name: 'Released And Revision Tip', value: 'ReleasedAndRevisionTip' },
					],
					default: 'All',
					description: 'Which versions of the file to include in the history',
				},
				fileMasterId,
				{
					displayName: 'Only Show Tip Released For Each Rev',
					name: 'onlyShowTipReleasedForEachRev',
					type: 'boolean',
					default: true,
					description: 'Whether to show only the tip (latest) released version for each revision',
				},
				{
					displayName: 'Revision',
					name: 'revision',
					type: 'options',
					options: [
						{ name: 'All Revisions', value: 'AllRevision' },
						{ name: 'Current Revision', value: 'CurrentRevision' },
					],
					default: 'AllRevision',
					description: 'Options for viewing file history',
				},
				propDefIds,
				extendedModels,
			],
			query: {
				'option[history]': 'history',
				'option[onlyShowTipReleasedForEachRev]': 'onlyShowTipReleasedForEachRev',
				'option[extendedModels]': 'extendedModels',
				'option[propDefIds]': 'propDefIds',
				'option[revision]': 'revision',
				descending: 'descending',
			},
			response: 'collection',
		}),
		defineOperation({
			name: 'Get File Version LMV Bubble JSON',
			value: 'getFileVersionLmvRoot',
			action: 'Get file version LMV bubble json',
			description:
				'Retrieve the bubble.JSON root metadata file for a DWF/DWFx file used in the Autodesk Large Model Viewer (LMV)',
			method: 'GET',
			path: '/vaults/{vaultId}/file-versions/{fileId}/svf/bubble.json',
			fields: [
				vaultId,
				allowSync,
				{
					displayName: 'File Version ID',
					name: 'fileId',
					type: 'string',
					required: true,
					default: '',
					placeholder: 'e.g. 100201',
					description:
						'The ID of the DWF/DWFx visualization file version to view. These files are usually hidden in Vault; find the ID via the Vault client or another File operation.',
				},
				{
					displayName: 'Max Wait Time (Seconds)',
					name: 'lmvMaxWaitSeconds',
					type: 'number',
					typeOptions: { minValue: 0, numberPrecision: 0 },
					default: 180,
					description:
						'How long to keep polling while Vault translates the file for the viewer. Polls back off from 2 up to 30 seconds apart. Set to 0 to check once.',
				},
				wmSrcFileVerId,
				wmSrcItemVerId,
			],
			response: 'single',
			// Escape hatch: waitForLmvBubble polls until the viewable is ready, which no
			// response kind describes. The path above is not used for this request.
			routing: {
				request: {
					method: 'GET',
					url: `=${API_BASE}/vaults/{{$parameter["vaultId"]}}/file-versions/{{$parameter["fileId"]}}/svf/bubble.json`,
					qs: {
						allowSync: queryValue('allowSync'),
						wmSrcItemVerId: queryValue('wmSrcItemVerId'),
						wmSrcFileVerId: queryValue('wmSrcFileVerId'),
					},
					returnFullResponse: true,
				},
				output: { postReceive: [waitForLmvBubble] },
			},
		}),
		defineOperation({
			name: 'Get File Version Markup',
			value: 'getFileVersionMarkupById',
			action: 'Get file version markup',
			description: 'Retrieve a specific markup associated with a file version by its ID',
			method: 'GET',
			path: '/vaults/{vaultId}/file-versions/{fileId}/markups/{markupId}',
			fields: [
				vaultId,
				fileId,
				{
					displayName: 'Markup',
					name: 'markupId',
					type: 'resourceLocator',
					default: { mode: 'list', value: '' },
					required: true,
					description:
						'The markup to use. Select one from the list (requires a File Version to be selected first), or provide the numeric markup ID directly.',
					...resourceLocatorModes('searchMarkups', 'e.g. 1234'),
					displayOptions: { hide: { vaultId: [''] } },
				},
			],
			response: 'single',
		}),
		defineOperation({
			name: 'Get File Version Metadata',
			value: 'getFileVersionContentHead',
			action: 'Get file version metadata',
			description:
				'Retrieve metadata for a specific file version content without downloading the full content',
			method: 'HEAD',
			path: '/vaults/{vaultId}/file-versions/{fileId}/content',
			fields: [vaultId, allowSync, contentDisposition, fileId, wmSrcFileVerId, wmSrcItemVerId],
			query: {
				allowSync: 'allowSync',
				wmSrcItemVerId: 'wmSrcItemVerId',
				wmSrcFileVerId: 'wmSrcFileVerId',
				contentDisposition: 'contentDisposition',
			},
			response: 'headers',
		}),
		defineOperation({
			name: 'Get File Version Signed URL',
			value: 'getFileVersionSignedUrl',
			action: 'Get file version signed url',
			description:
				'Generate a time-limited signed URL for securely downloading the specified file version',
			method: 'GET',
			path: '/vaults/{vaultId}/file-versions/{fileId}/signedurl',
			fields: [
				vaultId,
				contentDisposition,
				{
					displayName: 'Expiration Time',
					name: 'expirationTime',
					type: 'number',
					default: 180,
					description:
						'Duration for the signed URL to be valid in seconds. Max allowed time is 180 seconds. Ex: expirationTime=120',
				},
				fileId,
				wmSrcFileVerId,
				wmSrcItemVerId,
			],
			query: {
				wmSrcItemVerId: 'wmSrcItemVerId',
				wmSrcFileVerId: 'wmSrcFileVerId',
				contentDisposition: 'contentDisposition',
				expirationTime: 'expirationTime',
			},
			response: 'single',
		}),
		defineOperation({
			name: 'Get File Version Thumbnail',
			value: 'getFileVersionThumbnailById',
			action: 'Get file version thumbnail',
			description: 'Retrieve the thumbnail image for a specific file version',
			method: 'GET',
			path: '/vaults/{vaultId}/file-versions/{fileId}/thumbnail',
			fields: [vaultId, fileId],
			response: 'binary',
		}),
		defineOperation({
			name: 'Get File Version Uses',
			value: 'getFileVersionUses',
			action: 'Get file version uses',
			description: 'Retrieve file dependencies and attachments for the specified file version',
			method: 'GET',
			path: '/vaults/{vaultId}/file-versions/{fileId}/uses',
			fields: [
				vaultId,
				getLatestAssociations,
				recurse,
				fileId,
				includeHidden,
				releaseBiased,
				releasedOnly,
				propDefIds,
				extendedModels,
			],
			query: {
				'option[includeHidden]': 'includeHidden',
				'option[releaseBiased]': 'releaseBiased',
				'option[releasedOnly]': 'releasedOnly',
				'option[extendedModels]': 'extendedModels',
				'option[propDefIds]': 'propDefIds',
				'option[getLatestAssociations]': 'getLatestAssociations',
				'option[recurse]': 'recurse',
			},
			response: 'collection',
		}),
		defineOperation({
			name: 'Get File Version Where Used',
			value: 'getFileVersionWhereUsed',
			action: 'Get file version where used',
			description: 'Retrieve parent file associations for the specified file version',
			method: 'GET',
			path: '/vaults/{vaultId}/file-versions/{fileId}/parents',
			fields: [
				vaultId,
				getLatestAssociations,
				recurse,
				fileId,
				includeHidden,
				releaseBiased,
				releasedOnly,
				propDefIds,
				extendedModels,
			],
			query: {
				'option[includeHidden]': 'includeHidden',
				'option[releaseBiased]': 'releaseBiased',
				'option[releasedOnly]': 'releasedOnly',
				'option[extendedModels]': 'extendedModels',
				'option[propDefIds]': 'propDefIds',
				'option[getLatestAssociations]': 'getLatestAssociations',
				'option[recurse]': 'recurse',
			},
			response: 'collection',
		}),
		defineOperation({
			name: 'Get Many File Version Associated Change Orders',
			value: 'getFileAssociatedChangeOrders',
			action: 'Get many file version associated change orders',
			description: 'Retrieve the change orders driving the specified file (MasterId)',
			method: 'GET',
			path: '/vaults/{vaultId}/files/{fileMasterId}/change-orders',
			fields: [
				vaultId,
				fileMasterId,
				{
					displayName: "Include Closed ECO's",
					name: 'includeClosedECOs',
					type: 'boolean',
					default: false,
					description: 'Whether to include change orders in a closed or cancelled state',
				},
				propDefIds,
				extendedModels,
			],
			query: {
				'option[includeClosedECOs]': 'includeClosedECOs',
				'option[extendedModels]': 'extendedModels',
				'option[propDefIds]': 'propDefIds',
			},
			response: 'collection',
		}),
		defineOperation({
			name: 'Get Many File Version Associated Item Versions',
			value: 'getFileVersionAssociatedItemVersions',
			action: 'Get many file version associated item versions',
			description: 'Retrieve all items assigned to a specific file version',
			method: 'GET',
			path: '/vaults/{vaultId}/file-versions/{fileId}/item-versions',
			fields: [vaultId, fileId, releasedOnly, propDefIds],
			query: { 'option[releasedOnly]': 'releasedOnly', 'option[propDefIds]': 'propDefIds' },
			response: 'collection',
		}),
		defineOperation({
			name: 'Get Many File Version Markups',
			value: 'getFileVersionMarkups',
			action: 'Get many file version markups',
			description: 'Retrieve all markups associated with a specific file version',
			method: 'GET',
			path: '/vaults/{vaultId}/file-versions/{fileId}/markups',
			fields: [vaultId, fileId],
			response: 'collection',
		}),
		defineOperation({
			name: 'Get Many File Version Visualization Attachments',
			value: 'getFileVersionVisualizationAttachments',
			action: 'Get many file version visualization attachments',
			description: 'Retrieve the visualization attachments for a specific file version',
			method: 'GET',
			path: '/vaults/{vaultId}/file-versions/{fileId}/visualization-attachments',
			fields: [vaultId, fileId],
			response: 'collection',
		}),
		defineOperation({
			name: 'Get Many File Versions',
			value: 'getFileVersions',
			action: 'Get many file versions',
			description: 'Retrieve a list of file versions based on filters and conditions',
			method: 'GET',
			path: '/vaults/{vaultId}/file-versions',
			fields: [
				vaultId,
				releasedFilesOnly,
				latestOnly,
				sort,
				{
					displayName: 'Category Name',
					name: 'categoryName',
					type: 'string',
					default: '',
					description:
						'Search filter to include only file versions that match CategoryName property',
					placeholder: 'e.g. Engineering',
				},
				{
					displayName: 'Checkout User Name',
					name: 'checkoutUserName',
					type: 'string',
					default: '',
					description:
						'Search filter to include only file versions that match CheckoutUserName property',
					placeholder: 'e.g. Administrator',
				},
				{
					displayName: 'Create User Name',
					name: 'createUserName',
					type: 'string',
					default: '',
					description: 'The Name of the user who checked-in or uploaded this file',
					placeholder: 'e.g. Administrator',
				},
				q,
				{
					displayName: 'State',
					name: 'state',
					type: 'string',
					default: '',
					placeholder: 'e.g. For Review',
					description:
						"Search filter to include only file versions that match state property. e.g. 'For Review'.",
				},
				propDefIds,
				extendedModels,
			],
			query: {
				q: 'q',
				'filter[CheckoutUserName]': 'checkoutUserName',
				'filter[CreateUserName]': 'createUserName',
				'filter[CategoryName]': 'categoryName',
				'filter[State]': 'state',
				'option[latestOnly]': 'latestOnly',
				'option[releasedFilesOnly]': 'releasedFilesOnly',
				'option[extendedModels]': 'extendedModels',
				'option[propDefIds]': 'propDefIds',
				sort: 'sort',
			},
			response: 'collection',
		}),
		defineOperation({
			name: 'Update File Lifecycle Definitions',
			value: 'updateFileLifecycleDefinitions',
			action: 'Update file lifecycle definitions',
			description:
				'Move files onto a different lifecycle definition. Each entry needs a definition and a state that belongs to it.',
			method: 'POST',
			path: '/vaults/{vaultId}/files:update-lifecycle-definitions',
			fields: [
				vaultId,
				{
					displayName: 'Definition Updates',
					name: 'lifecycleDefinitionUpdates',
					type: 'fixedCollection',
					typeOptions: { multipleValues: true },
					default: {},
					description:
						'One entry per entity. The lifecycle state must belong to the lifecycle definition given on the same entry.',
					options: [
						{
							displayName: 'Update',
							name: 'update',
							values: [
								{
									displayName: 'Entity ID',
									name: 'entityId',
									type: 'string',
									default: '',
									placeholder: 'e.g. 55',
									description:
										'The master ID of the file or item, or the folder ID, whose lifecycle should change',
								},
								{
									displayName: 'Lifecycle Definition ID',
									name: 'lifecycleDefinitionId',
									type: 'string',
									default: '',
									placeholder: 'e.g. 2',
									description: 'The ID of the target lifecycle definition',
								},
								{
									displayName: 'Lifecycle State ID',
									name: 'lifecycleStateId',
									type: 'string',
									default: '',
									placeholder: 'e.g. 9',
									description: 'The ID of a state that belongs to the target lifecycle definition',
								},
							],
						},
					],
				},
				lifecycleComment,
			],
			buildBody: lifecycleDefinitionsBody('files'),
			response: 'collection',
			paginated: false, // a lifecycle update returns the entities it changed; 2.0.1 never paged it
		}),
		defineOperation({
			name: 'Update File Lifecycle States',
			value: 'updateFileLifecycleStates',
			action: 'Update file lifecycle states',
			description: 'Update the lifecycle state of one or more files',
			method: 'POST',
			path: '/vaults/{vaultId}/files:update-states',
			fields: [
				vaultId,
				{
					displayName: 'State Updates',
					name: 'lifecycleStateUpdates',
					type: 'fixedCollection',
					typeOptions: { multipleValues: true },
					default: {},
					description: 'One entry per entity whose lifecycle state should change',
					options: [
						{
							displayName: 'Update',
							name: 'update',
							values: [
								{
									displayName: 'Entity ID',
									name: 'entityId',
									type: 'string',
									default: '',
									placeholder: 'e.g. 55',
									description:
										'The master ID of the file or item, or the folder ID, whose state should change',
								},
								{
									displayName: 'Lifecycle State ID',
									name: 'lifecycleStateId',
									type: 'string',
									default: '',
									placeholder: 'e.g. 2',
									description: 'The ID of the target lifecycle state',
								},
							],
						},
					],
				},
				lifecycleComment,
			],
			buildBody: lifecycleStatesBody('files'),
			response: 'collection',
			paginated: false, // a lifecycle update returns the entities it changed; 2.0.1 never paged it
		}),
	],
});
