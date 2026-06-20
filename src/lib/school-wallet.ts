import 'server-only';

import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { wallets } from '@/db/schema';

export async function getSchoolWalletBalanceKobo(schoolId: string) {
  const [wallet] = await db
    .select({ balanceKobo: wallets.balanceKobo })
    .from(wallets)
    .where(eq(wallets.schoolId, schoolId))
    .limit(1);

  return wallet?.balanceKobo ?? 0;
}
