"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processBinaryResponse = processBinaryResponse;
const MIME_MAP = {
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
function resolveHeader(value, fallback) {
    if (typeof value === 'string')
        return value;
    return fallback;
}
function extractFileName(contentDisposition) {
    var _a;
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    return (_a = match === null || match === void 0 ? void 0 : match[1]) !== null && _a !== void 0 ? _a : 'downloaded-file';
}
async function processBinaryResponse(items, responseData) {
    var _a, _b, _c;
    const contentType = resolveHeader(responseData.headers['content-type'], 'application/octet-stream');
    const contentDisposition = resolveHeader(responseData.headers['content-disposition'], '');
    const fileName = extractFileName(contentDisposition);
    const ext = (_b = (_a = fileName.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== null && _b !== void 0 ? _b : '';
    const mimeType = (_c = MIME_MAP[ext]) !== null && _c !== void 0 ? _c : contentType;
    const binaryData = await this.helpers.prepareBinaryData(responseData.body, fileName, mimeType);
    return items.map((item) => {
        item.json = {};
        item.binary = { data: binaryData };
        return item;
    });
}
//# sourceMappingURL=binary.js.map