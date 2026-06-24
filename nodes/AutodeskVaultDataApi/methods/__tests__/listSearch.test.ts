import { describe, it, expect, vi } from 'vitest';
import {
	searchFileMasters,
	searchFileVersions,
	searchFolders,
	searchItemMasters,
	searchMarkups,
} from '../listSearch';
import { ILoadOptionsFunctions } from 'n8n-workflow';

function makeCtx(
	params: Record<string, unknown>,
	httpResponse: unknown,
	credentials: Record<string, unknown> = { vaultServerUrl: 'https://vault.example.com' },
) {
	const httpRequestWithAuthentication = vi.fn().mockResolvedValue(httpResponse);
	const ctx = {
		getCurrentNodeParameter: vi.fn((name: string) => params[name]),
		getCredentials: vi.fn().mockResolvedValue(credentials),
		helpers: { httpRequestWithAuthentication },
	} as unknown as ILoadOptionsFunctions;
	return { ctx, httpRequestWithAuthentication };
}

describe('searchFolders', () => {
	it('returns an empty result when no vault is selected', async () => {
		const { ctx, httpRequestWithAuthentication } = makeCtx({ vaultId: '' }, {});
		const result = await searchFolders.call(ctx);

		expect(result).toEqual({ results: [] });
		expect(httpRequestWithAuthentication).not.toHaveBeenCalled();
	});

	it('lists only folder entities, labelled by full name', async () => {
		const { ctx } = makeCtx(
			{ vaultId: '42', authentication: 'VaultLogin' },
			{
				results: [
					{ id: 1, name: 'Designs', fullName: '$/Designs', entityType: 'Folder' },
					{ id: 2, name: 'part.ipt', entityType: 'File' },
					{ id: 3, name: 'Drawings', fullName: '$/Designs/Drawings', entityType: 'Folder' },
				],
			},
		);

		const result = await searchFolders.call(ctx);

		expect(result.results).toEqual([
			{ name: '$/Designs', value: '1' },
			{ name: '$/Designs/Drawings', value: '3' },
		]);
		expect(result.paginationToken).toBeUndefined();
	});

	it('passes the filter as the q query parameter and uses the OAuth2 credential', async () => {
		const { ctx, httpRequestWithAuthentication } = makeCtx(
			{ vaultId: '7', authentication: 'OAuth2' },
			{ results: [] },
		);

		await searchFolders.call(ctx, 'Drawings');

		expect(httpRequestWithAuthentication).toHaveBeenCalledWith(
			'autodeskVaultDataOAuth2Api',
			expect.objectContaining({
				url: 'https://vault.example.com/AutodeskDM/Services/api/vault/v2/vaults/7/folders/1/contents',
				qs: expect.objectContaining({ q: 'Drawings' }),
			}),
		);
	});

	it('extracts the pagination token from nextUrl', async () => {
		const { ctx } = makeCtx(
			{ vaultId: '42' },
			{
				results: [{ id: 9, name: 'A', entityType: 'Folder' }],
				pagination: { nextUrl: '/contents?limit=200&cursorState=abc%2F123' },
			},
		);

		const result = await searchFolders.call(ctx);

		expect(result.paginationToken).toBe('abc/123');
	});

	it('forwards a pagination token as cursorState', async () => {
		const { ctx, httpRequestWithAuthentication } = makeCtx({ vaultId: '42' }, { results: [] });

		await searchFolders.call(ctx, undefined, 'cursor-xyz');

		expect(httpRequestWithAuthentication).toHaveBeenCalledWith(
			'autodeskVaultAccountApi',
			expect.objectContaining({
				qs: expect.objectContaining({ cursorState: 'cursor-xyz' }),
			}),
		);
	});
});

describe('searchFileMasters', () => {
	it('resolves the Title property definition then appends its value by ID', async () => {
		const { ctx, httpRequestWithAuthentication } = makeCtx({ vaultId: '42' }, {});
		httpRequestWithAuthentication
			.mockResolvedValueOnce({ results: [{ id: '83', systemName: 'Title' }] })
			.mockResolvedValueOnce({
				results: [
					{
						id: 100201,
						name: 'bracket.ipt',
						file: { id: 100200 },
						properties: [{ propertyDefinitionId: '83', value: 'Mounting Bracket' }],
					},
					{ id: 100301, name: 'plate.ipt', file: { id: 100300 }, properties: [] },
				],
			});

		const result = await searchFileMasters.call(ctx);

		// First call resolves the Title property definition by system name
		expect(httpRequestWithAuthentication).toHaveBeenNthCalledWith(
			1,
			'autodeskVaultAccountApi',
			expect.objectContaining({
				url: expect.stringContaining('/property-definitions'),
				qs: expect.objectContaining({ 'filter[systemNames]': 'Title' }),
			}),
		);
		// Second call fetches file versions scoped to that property definition ID
		expect(httpRequestWithAuthentication).toHaveBeenNthCalledWith(
			2,
			'autodeskVaultAccountApi',
			expect.objectContaining({ qs: expect.objectContaining({ 'option[propDefIds]': '83' }) }),
		);
		expect(result.results).toEqual([
			{ name: 'bracket.ipt - Mounting Bracket', value: '100200' },
			{ name: 'plate.ipt', value: '100300' },
		]);
	});

	it('skips versions without a file master', async () => {
		const { ctx } = makeCtx({ vaultId: '42' }, {
			results: [{ id: 1, name: 'orphan.ipt' }],
		});

		const result = await searchFileMasters.call(ctx);

		expect(result.results).toEqual([]);
	});
});

describe('searchItemMasters', () => {
	it('labels items by their item version number and filters client-side', async () => {
		const { ctx, httpRequestWithAuthentication } = makeCtx({ vaultId: '42' }, {
			results: [
				{ id: 10, itemVersion: { number: 'ITM-001', title: 'Bracket' } },
				{ id: 20, itemVersion: { number: 'ITM-002', title: 'Side Plate' } },
			],
		});

		const result = await searchItemMasters.call(ctx, 'ITM-002');

		// The /items endpoint has no q filter, so it must not be sent; extended models
		// are requested so the nested item version (incl. its title) is populated
		expect(httpRequestWithAuthentication).toHaveBeenCalledWith(
			'autodeskVaultAccountApi',
			expect.objectContaining({
				qs: expect.objectContaining({ 'option[extendedModels]': 'true' }),
			}),
		);
		expect(httpRequestWithAuthentication).toHaveBeenCalledWith(
			'autodeskVaultAccountApi',
			expect.objectContaining({ qs: expect.not.objectContaining({ q: 'ITM-002' }) }),
		);
		expect(result.results).toEqual([{ name: 'ITM-002 - Side Plate', value: '20' }]);
	});
});

describe('searchFileVersions', () => {
	it('returns nothing (no request) until a vault is selected', async () => {
		const { ctx, httpRequestWithAuthentication } = makeCtx({ vaultId: '' }, {});

		expect(await searchFileVersions.call(ctx)).toEqual({ results: [] });
		expect(httpRequestWithAuthentication).not.toHaveBeenCalled();
	});

	it('lists all file versions with name, Title and historical state in the label', async () => {
		const { ctx, httpRequestWithAuthentication } = makeCtx({ vaultId: '42' }, {});
		httpRequestWithAuthentication
			.mockResolvedValueOnce({ results: [{ id: '83', systemName: 'Title' }] })
			.mockResolvedValueOnce({ results: [{ id: '60', systemName: 'State(Ver)' }] })
			.mockResolvedValueOnce({
				results: [
					{
						id: 100203,
						name: 'bracket.ipt',
						version: 3,
						revision: 'A',
						state: 'Work in Progress',
						properties: [{ propertyDefinitionId: '83', value: 'Mounting Bracket' }],
					},
					{
						id: 100201,
						name: 'bracket.ipt',
						version: 1,
						revision: 'A',
						properties: [
							{ propertyDefinitionId: '83', value: 'Mounting Bracket' },
							{ propertyDefinitionId: '60', value: 'Released' },
						],
					},
				],
			});

		const result = await searchFileVersions.call(ctx);

		// All versions are listed, scoped to the Title and State(Ver) property IDs
		expect(httpRequestWithAuthentication).toHaveBeenNthCalledWith(
			3,
			'autodeskVaultAccountApi',
			expect.objectContaining({
				qs: expect.objectContaining({
					'option[latestOnly]': 'false',
					'option[propDefIds]': '83,60',
				}),
			}),
		);
		expect(result.results).toEqual([
			{ name: 'bracket.ipt - v3 - Rev(A) - Work in Progress - Mounting Bracket', value: '100203' },
			{ name: 'bracket.ipt - v1 - Rev(A) - Released - Mounting Bracket', value: '100201' },
		]);
	});
});

describe('searchMarkups', () => {
	it('returns nothing when no file version is selected', async () => {
		const { ctx, httpRequestWithAuthentication } = makeCtx({ vaultId: '42', fileId: '' }, {});

		const result = await searchMarkups.call(ctx);

		expect(result).toEqual({ results: [] });
		expect(httpRequestWithAuthentication).not.toHaveBeenCalled();
	});

	it('scopes the request to the selected file version and labels by author', async () => {
		const { ctx, httpRequestWithAuthentication } = makeCtx(
			{ vaultId: '42', fileId: { mode: 'id', value: '100201' } },
			{ results: [{ id: 5, createdByUser: 'Administrator' }] },
		);

		const result = await searchMarkups.call(ctx);

		expect(httpRequestWithAuthentication).toHaveBeenCalledWith(
			'autodeskVaultAccountApi',
			expect.objectContaining({
				url: 'https://vault.example.com/AutodeskDM/Services/api/vault/v2/vaults/42/file-versions/100201/markups',
			}),
		);
		expect(result.results).toEqual([{ name: 'Markup 5 (by Administrator)', value: '5' }]);
	});
});
