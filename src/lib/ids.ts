import { randomUUID } from 'node:crypto';

export function makeEntityId(prefix: string) {
  return `${prefix}_${randomUUID()}`;
}

export function makePaymentReference() {
  return `EC-${Date.now()}-${randomUUID().slice(0, 8)}`;
}

export function makeWalletReference(prefix: string) {
  return `${prefix}:${randomUUID()}`;
}
