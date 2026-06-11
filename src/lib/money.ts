export const CHECK_PRICE_KOBO = 10_000;
export const PROMOTIONAL_WALLET_KOBO = 500_000;

export function formatNairaFromKobo(amountKobo: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amountKobo / 100);
}

export function formatChecksFromKobo(balanceKobo: number) {
  return Math.floor(balanceKobo / CHECK_PRICE_KOBO);
}

export function formatSignedNairaFromKobo(amountKobo: number) {
  return `${amountKobo >= 0 ? '+' : '-'}${formatNairaFromKobo(Math.abs(amountKobo))}`;
}
