export function normalizeSearchText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function getNameTokens(value: string) {
  return normalizeSearchText(value)
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

export function normalizeNameSignature(value: string) {
  return [...new Set(getNameTokens(value))].sort().join(' ');
}

export function getNameTokenOverlap(left: string, right: string) {
  const leftTokens = new Set(getNameTokens(left));
  const rightTokens = new Set(getNameTokens(right));

  return [...leftTokens].filter((token) => rightTokens.has(token)).length;
}

export function buildStudentDisplayName(firstName: string, middleName?: string | null, lastName?: string | null) {
  return [firstName, middleName, lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
}

export function normalizePhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '');

  if (digits.startsWith('234')) {
    return digits;
  }

  if (digits.startsWith('0')) {
    return `234${digits.slice(1)}`;
  }

  return digits;
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
