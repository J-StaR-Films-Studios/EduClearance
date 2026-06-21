import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { auditLogs, walletTransactions, wallets } from '@/db/schema';
import { makeEntityId, makeWalletReference } from '@/lib/ids';
import { resolveOptionalLocalActor } from '@/lib/local-actor';

const adjustmentSchema = z.object({
  schoolId: z.string().trim().min(1),
  type: z.enum(['credit', 'debit']),
  amountNaira: z.number().positive().max(100_000_000),
  reason: z.string().trim().min(5),
});

export async function POST(request: Request) {
  const actor = await resolveOptionalLocalActor();

  if (!actor || actor.sessionRole !== 'platform_admin') {
    return NextResponse.json({ ok: false, message: 'Platform admin access required.' }, { status: 403 });
  }

  const payload = adjustmentSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ ok: false, message: 'Invalid wallet adjustment.', issues: payload.error.flatten() }, { status: 400 });
  }

  const amountKobo = Math.round(payload.data.amountNaira * 100);
  const signedAmountKobo = payload.data.type === 'credit' ? amountKobo : -amountKobo;
  const transactionId = makeEntityId('wallet_tx');
  const reference = makeWalletReference(`manual-${payload.data.type}`);
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip');

  const result = await db.transaction(async (tx) => {
    await tx
      .insert(wallets)
      .values({ id: makeEntityId('wallet'), schoolId: payload.data.schoolId, balanceKobo: 0 })
      .onConflictDoNothing({ target: wallets.schoolId });

    const [wallet] = await tx
      .update(wallets)
      .set({ balanceKobo: sql`${wallets.balanceKobo} + ${signedAmountKobo}`, updatedAt: new Date() })
      .where(eq(wallets.schoolId, payload.data.schoolId))
      .returning({ balanceKobo: wallets.balanceKobo });

    await tx.insert(walletTransactions).values({
      id: transactionId,
      schoolId: payload.data.schoolId,
      type: 'adjustment',
      amountKobo: signedAmountKobo,
      description: payload.data.reason,
      reference,
      provider: 'manual',
      createdByUserId: actor.userId,
    });

    await tx.insert(auditLogs).values({
      id: makeEntityId('audit'),
      actorUserId: actor.userId,
      actorSchoolId: null,
      action: 'admin_wallet_adjustment_posted',
      entityType: 'wallet_transaction',
      entityId: transactionId,
      metadataJson: {
        schoolId: payload.data.schoolId,
        type: payload.data.type,
        amountKobo,
        signedAmountKobo,
        reason: payload.data.reason,
        balanceAfterKobo: wallet?.balanceKobo ?? null,
      },
      ipAddress,
    });

    return { transactionId, balanceKobo: wallet?.balanceKobo ?? null };
  });

  return NextResponse.json({ ok: true, ...result });
}
