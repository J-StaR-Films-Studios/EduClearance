import { NextResponse } from 'next/server';
import { and, eq, gte, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { auditLogs, walletTransactions, wallets } from '@/db/schema';
import { makeEntityId, makeWalletReference } from '@/lib/ids';
import { canManageSchoolWallet, resolveLocalSchoolActor } from '@/lib/local-actor';

const MAX_WALLET_DEBIT_KOBO = 10_000_000;

const walletDebitSchema = z.object({
  amountKobo: z.number().int().positive().max(MAX_WALLET_DEBIT_KOBO),
  reason: z.string().trim().min(1),
  reference: z.string().trim().min(1).optional(),
});

type ExistingDebitResult = {
  kind: 'success';
  idempotent: true;
  transactionId: string;
  reference: string;
  balanceKobo: number;
};

class InsufficientFundsError extends Error {
  constructor(readonly balanceKobo: number) {
    super('Insufficient wallet balance.');
  }
}

async function readExistingDebit(reference: string, schoolId: string, amountKobo: number): Promise<ExistingDebitResult | { kind: 'conflict' } | null> {
  const [existingTransaction] = await db
    .select({
      id: walletTransactions.id,
      schoolId: walletTransactions.schoolId,
      type: walletTransactions.type,
      amountKobo: walletTransactions.amountKobo,
      reference: walletTransactions.reference,
    })
    .from(walletTransactions)
    .where(eq(walletTransactions.reference, reference))
    .limit(1);

  if (!existingTransaction) {
    return null;
  }

  if (existingTransaction.schoolId !== schoolId || existingTransaction.type !== 'debit' || existingTransaction.amountKobo !== amountKobo) {
    return { kind: 'conflict' };
  }

  const [currentWallet] = await db
    .select({ balanceKobo: wallets.balanceKobo })
    .from(wallets)
    .where(eq(wallets.schoolId, schoolId))
    .limit(1);

  return {
    kind: 'success',
    idempotent: true,
    transactionId: existingTransaction.id,
    reference: existingTransaction.reference,
    balanceKobo: currentWallet?.balanceKobo ?? 0,
  };
}

export async function POST(request: Request) {
  const actor = await resolveLocalSchoolActor();

  if (!actor) {
    return NextResponse.json({ ok: false, message: 'Active school session required.' }, { status: 401 });
  }

  if (!canManageSchoolWallet(actor)) {
    return NextResponse.json({ ok: false, message: 'School owner or admin permission required.' }, { status: 403 });
  }

  const payload = walletDebitSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ ok: false, message: 'Invalid wallet debit payload.', issues: payload.error.flatten() }, { status: 400 });
  }

  const reference = payload.data.reference ?? makeWalletReference('wallet-debit');
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip');

  try {
    const result = await db.transaction(async (tx) => {
      const [currentWallet] = await tx
        .select({ id: wallets.id, balanceKobo: wallets.balanceKobo })
        .from(wallets)
        .where(eq(wallets.schoolId, actor.schoolId))
        .limit(1);

      const transactionId = makeEntityId('wallet_tx');
      const insertedTransactions = await tx
        .insert(walletTransactions)
        .values({
          id: transactionId,
          schoolId: actor.schoolId,
          type: 'debit',
          amountKobo: payload.data.amountKobo,
          description: payload.data.reason,
          reference,
          provider: 'system',
          createdByUserId: actor.userId,
        })
        .onConflictDoNothing({ target: walletTransactions.reference })
        .returning({ id: walletTransactions.id });

      if (insertedTransactions.length === 0) {
        const [existingTransaction] = await tx
          .select({
            id: walletTransactions.id,
            schoolId: walletTransactions.schoolId,
            type: walletTransactions.type,
            amountKobo: walletTransactions.amountKobo,
            reference: walletTransactions.reference,
          })
          .from(walletTransactions)
          .where(eq(walletTransactions.reference, reference))
          .limit(1);

        if (
          !existingTransaction ||
          existingTransaction.schoolId !== actor.schoolId ||
          existingTransaction.type !== 'debit' ||
          existingTransaction.amountKobo !== payload.data.amountKobo
        ) {
          return { kind: 'conflict' as const };
        }

        return {
          kind: 'success' as const,
          idempotent: true,
          transactionId: existingTransaction.id,
          reference: existingTransaction.reference,
          balanceKobo: currentWallet?.balanceKobo ?? 0,
        };
      }

      const [updatedWallet] = await tx
        .update(wallets)
        .set({
          balanceKobo: sql`${wallets.balanceKobo} - ${payload.data.amountKobo}`,
          updatedAt: new Date(),
        })
        .where(and(eq(wallets.schoolId, actor.schoolId), gte(wallets.balanceKobo, payload.data.amountKobo)))
        .returning({ id: wallets.id, balanceKobo: wallets.balanceKobo });

      if (!updatedWallet) {
        throw new InsufficientFundsError(currentWallet?.balanceKobo ?? 0);
      }

      await tx.insert(auditLogs).values({
        id: makeEntityId('audit'),
        actorUserId: actor.userId,
        actorSchoolId: actor.schoolId,
        action: 'wallet_debit_posted',
        entityType: 'wallet_transaction',
        entityId: transactionId,
        metadataJson: {
          amountKobo: payload.data.amountKobo,
          reference,
          balanceAfterKobo: updatedWallet.balanceKobo,
        },
        ipAddress,
      });

      return {
        kind: 'success' as const,
        idempotent: false,
        transactionId,
        reference,
        balanceKobo: updatedWallet.balanceKobo,
      };
    });

    if (result.kind === 'conflict') {
      return NextResponse.json({ ok: false, message: 'Debit reference already belongs to another wallet operation.' }, { status: 409 });
    }

    return NextResponse.json({
      ok: true,
      idempotent: result.idempotent,
      transactionId: result.transactionId,
      reference: result.reference,
      balanceKobo: result.balanceKobo,
    });
  } catch (error) {
    if (error instanceof InsufficientFundsError) {
      return NextResponse.json(
        { ok: false, message: 'Insufficient wallet balance.', balanceKobo: error.balanceKobo },
        { status: 402 },
      );
    }

    const existingDebit = await readExistingDebit(reference, actor.schoolId, payload.data.amountKobo).catch(() => null);

    if (existingDebit?.kind === 'success') {
      return NextResponse.json({
        ok: true,
        idempotent: existingDebit.idempotent,
        transactionId: existingDebit.transactionId,
        reference: existingDebit.reference,
        balanceKobo: existingDebit.balanceKobo,
      });
    }

    if (existingDebit?.kind === 'conflict') {
      return NextResponse.json({ ok: false, message: 'Debit reference already belongs to another wallet operation.' }, { status: 409 });
    }

    console.error('Wallet debit failed.', error);
    return NextResponse.json({ ok: false, message: 'Unable to post wallet debit.' }, { status: 500 });
  }
}
