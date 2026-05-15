import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processBinaryResponse } from '../binary';
import { IExecuteSingleFunctions, IN8nHttpFullResponse, INodeExecutionData } from 'n8n-workflow';

function makeContext(prepareBinaryData: (...args: any[]) => any): IExecuteSingleFunctions {
	return {
		helpers: {
			prepareBinaryData,
		},
	} as unknown as IExecuteSingleFunctions;
}

function makeResponse(
	body: Buffer,
	contentType: string,
	contentDisposition = '',
): IN8nHttpFullResponse {
	return {
		body,
		headers: {
			'content-type': contentType,
			'content-disposition': contentDisposition,
		},
		statusCode: 200,
	};
}

const dummyItem: INodeExecutionData = { json: { existing: true } };

describe('processBinaryResponse', () => {
	let prepareBinaryData: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		prepareBinaryData = vi.fn().mockResolvedValue({ mimeType: 'image/png', data: 'base64data' });
	});

	it('uses content-type header when extension is unknown', async () => {
		const ctx = makeContext(prepareBinaryData);
		const body = Buffer.from('data');
		const response = makeResponse(body, 'application/octet-stream', 'attachment; filename="report.xyz"');

		await processBinaryResponse.call(ctx, [dummyItem], response);

		expect(prepareBinaryData).toHaveBeenCalledWith(body, 'report.xyz', 'application/octet-stream');
	});

	it('infers MIME type from known extension (png)', async () => {
		const ctx = makeContext(prepareBinaryData);
		const body = Buffer.from('imgdata');
		const response = makeResponse(body, 'image/unknown', 'attachment; filename="thumb.png"');

		await processBinaryResponse.call(ctx, [dummyItem], response);

		expect(prepareBinaryData).toHaveBeenCalledWith(body, 'thumb.png', 'image/png');
	});

	it('infers MIME type from known extension (pdf)', async () => {
		const ctx = makeContext(prepareBinaryData);
		const body = Buffer.from('pdfdata');
		const response = makeResponse(body, 'application/unknown', 'attachment; filename="doc.pdf"');

		await processBinaryResponse.call(ctx, [dummyItem], response);

		expect(prepareBinaryData).toHaveBeenCalledWith(body, 'doc.pdf', 'application/pdf');
	});

	it('falls back to downloaded-file when content-disposition is missing', async () => {
		const ctx = makeContext(prepareBinaryData);
		const body = Buffer.from('data');
		const response = makeResponse(body, 'application/zip');

		await processBinaryResponse.call(ctx, [dummyItem], response);

		expect(prepareBinaryData).toHaveBeenCalledWith(body, 'downloaded-file', 'application/zip');
	});

	it('returns items with binary set and json cleared', async () => {
		const fakeBinary = { mimeType: 'image/jpeg', data: 'abc' };
		prepareBinaryData.mockResolvedValue(fakeBinary);
		const ctx = makeContext(prepareBinaryData);
		const body = Buffer.from('img');
		const response = makeResponse(body, 'image/jpeg', 'attachment; filename="photo.jpg"');

		const result = await processBinaryResponse.call(ctx, [{ json: { old: true } }], response);

		expect(result).toHaveLength(1);
		expect(result[0].json).toEqual({});
		expect(result[0].binary).toEqual({ data: fakeBinary });
	});

	it('handles all items when multiple items are passed', async () => {
		const ctx = makeContext(prepareBinaryData);
		const body = Buffer.from('data');
		const response = makeResponse(body, 'image/png', 'attachment; filename="img.png"');
		const items: INodeExecutionData[] = [{ json: { a: 1 } }, { json: { b: 2 } }];

		const result = await processBinaryResponse.call(ctx, items, response);

		expect(result).toHaveLength(2);
		result.forEach((item) => {
			expect(item.json).toEqual({});
			expect(item.binary).toBeDefined();
		});
	});

	it('supports case-insensitive extension mapping (JPG)', async () => {
		const ctx = makeContext(prepareBinaryData);
		const body = Buffer.from('data');
		const response = makeResponse(body, 'image/unknown', 'attachment; filename="PHOTO.JPG"');

		await processBinaryResponse.call(ctx, [dummyItem], response);

		expect(prepareBinaryData).toHaveBeenCalledWith(body, 'PHOTO.JPG', 'image/jpeg');
	});
});
