export function normalizeSearchText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
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
