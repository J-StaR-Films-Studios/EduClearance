const ALLOWED_UPLOAD_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;

export type SafeUpload = {
  contentType: (typeof ALLOWED_UPLOAD_TYPES)[number];
  bytes: Buffer;
};

function normalizeContentType(value: string | null | undefined) {
  return value?.split(';')[0]?.trim().toLowerCase() ?? '';
}

function hasExpectedMagicBytes(contentType: string, bytes: Buffer) {
  if (contentType === 'application/pdf') {
    return bytes.subarray(0, 5).toString('ascii') === '%PDF-';
  }

  if (contentType === 'image/png') {
    return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  if (contentType === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  return false;
}

export function decodeSafeUploadDataUrl(dataUrl: string, declaredContentType?: string | null): SafeUpload | null {
  const match = dataUrl.match(/^data:([^;]+);base64,([a-zA-Z0-9+/=\r\n]+)$/);

  if (!match) {
    return null;
  }

  const dataUrlContentType = normalizeContentType(match[1]);
  const normalizedDeclaredType = normalizeContentType(declaredContentType);
  const contentType = normalizedDeclaredType || dataUrlContentType;

  if (!ALLOWED_UPLOAD_TYPES.includes(contentType as SafeUpload['contentType']) || dataUrlContentType !== contentType) {
    return null;
  }

  const bytes = Buffer.from(match[2], 'base64');

  if (!hasExpectedMagicBytes(contentType, bytes)) {
    return null;
  }

  return { contentType: contentType as SafeUpload['contentType'], bytes };
}

export function isSafeUploadDataUrl(dataUrl: string, declaredContentType?: string | null) {
  return Boolean(decodeSafeUploadDataUrl(dataUrl, declaredContentType));
}

export function safeAttachmentHeaders(fileName: string, contentType: SafeUpload['contentType']) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120) || 'download';

  return {
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${safeName}"`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  };
}
