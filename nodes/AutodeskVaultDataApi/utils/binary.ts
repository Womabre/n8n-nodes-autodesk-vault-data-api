import { IBinaryData, IExecuteSingleFunctions, IN8nHttpFullResponse, INodeExecutionData } from 'n8n-workflow';

const MIME_MAP: Record<string, string> = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	gif: 'image/gif',
	bmp: 'image/bmp',
	tiff: 'image/tiff',
	svg: 'image/svg+xml',
	pdf: 'application/pdf',
	txt: 'text/plain',
	json: 'application/json',
	csv: 'text/csv',
	zip: 'application/zip',
};

function resolveHeader(value: unknown, fallback: string): string {
	if (typeof value === 'string') return value;
	return fallback;
}

function extractFileName(contentDisposition: string): string {
	const match = contentDisposition.match(/filename="?([^"]+)"?/);
	return match?.[1] ?? 'downloaded-file';
}

export async function processBinaryResponse(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	responseData: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const contentType = resolveHeader(responseData.headers['content-type'], 'application/octet-stream');
	const contentDisposition = resolveHeader(responseData.headers['content-disposition'], '');

	const fileName = extractFileName(contentDisposition);
	const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
	const mimeType = MIME_MAP[ext] ?? contentType;

	const binaryData: IBinaryData = await this.helpers.prepareBinaryData(
		responseData.body as Buffer,
		fileName,
		mimeType,
	);

	return items.map((item) => {
		item.json = {};
		item.binary = { data: binaryData };
		return item;
	});
}
