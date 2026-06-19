import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { auditLogs, payments, walletTransactions, wallets } from '@/db/schema';
import { getServerEnv } from '@/lib/env';
import { makeEntityId } from '@/lib/ids';
import { canManageSchoolWallet, canVerifyPaymentForSchool, resolveOptionalLocalActor } from '@/lib/local-actor';

const paystackVerifySchema = z.object({
  reference: z.string().trim().min(1),
});

const terminalProviderStatuses = new Set(['failed', 'abandoned']);

type JsonRecord = Record<string, unknown>;

type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data?: {
    status?: string;
    reference?: string;
    amount?: number;
    paid_at?: string | null;
    channel?: string | null;
  };
};

function toJsonRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function isLocalAppUrl(appUrl: string) {
  const { hostname } = new URL(appUrl);
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function isLocalRequest(request: Request) {
  const host = request.headers.get('host') ?? new URL(request.url).host;
  const hostname = host.split(':')[0];
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export async function POST(request: Request) {
  const payload = paystackVerifySchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ ok: false, message: 'Invalid Paystack verify payload.', issues: payload.error.flatten() }, { status: 400 });
  }

  const actor = await resolveOptionalLocalActor();

  if (!actor) {
    return NextResponse.json({ ok: false, message: 'Authorized local session required.' }, { status: 401 });
  }

  if (actor.sessionRole !== 'platform_admin' && !canManageSchoolWallet(actor)) {
    return NextResponse.json({ ok: false, message: 'School owner or admin permission required.' }, { status: 403 });
  }

  const reference = payload.data.reference;
  const env = getServerEnv();

  if (!env.PAYSTACK_SECRET_KEY && !(isLocalAppUrl(env.NEXT_PUBLIC_APP_URL) && isLocalRequest(request))) {
    return NextResponse.json({ ok: false, message: 'Paystack secret key is required outside local development.' }, { status: 503 });
  }

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip');

  const [paymentBeforeVerify] = await db
    .select({
      id: payments.id,
      schoolId: payments.schoolId,
      amountKobo: payments.amountKobo,
      status: payments.status,
      metadataJson: payments.metadataJson,
    })
    .from(payments)
    .where(eq(payments.providerReference, reference))
    .limit(1);

  if (!paymentBeforeVerify) {
    return NextResponse.json({ ok: false, message: 'Payment reference was not found.' }, { status: 404 });
  }

  if (!canVerifyPaymentForSchool(actor, paymentBeforeVerify.schoolId)) {
    return NextResponse.json({ ok: false, message: 'Payment reference is not available for this school session.' }, { status: 403 });
  }

  if (paymentBeforeVerify.status === 'failed' || paymentBeforeVerify.status === 'abandoned') {
    return NextResponse.json({ ok: false, message: 'Payment reference is not available for wallet credit.' }, { status: 409 });
  }

  let providerVerification: PaystackVerifyResponse['data'] | null = null;

  if (env.PAYSTACK_SECRET_KEY) {
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const paystackJson = (await paystackResponse.json().catch(() => null)) as PaystackVerifyResponse | null;
    const providerData = paystackJson?.data;
    const providerStatus = providerData?.status;

    if (!paystackResponse.ok || !paystackJson?.status || !providerStatus) {
      return NextResponse.json(
        { ok: false, message: 'Payment has not been verified by Paystack.', retryable: true },
        { status: 400 },
      );
    }

    if (providerStatus !== 'success') {
      if (terminalProviderStatuses.has(providerStatus)) {
        await db
          .update(payments)
          .set({
            status: providerStatus === 'abandoned' ? 'abandoned' : 'failed',
            metadataJson: {
              ...toJsonRecord(paymentBeforeVerify.metadataJson),
              providerVerification: {
                status: providerStatus,
                reference: providerData?.reference ?? reference,
                message: paystackJson.message,
              },
            },
          })
          .where(eq(payments.id, paymentBeforeVerify.id));

        return NextResponse.json({ ok: false, message: 'Payment was not successful with Paystack.', retryable: false }, { status: 400 });
      }

      return NextResponse.json(
        { ok: false, message: 'Payment is not successful yet. Try verification again after Paystack completes processing.', retryable: true },
        { status: 400 },
      );
    }

    if (providerData?.amount !== paymentBeforeVerify.amountKobo) {
      return NextResponse.json({ ok: false, message: 'Verified payment amount does not match the initialized amount.', retryable: true }, { status: 409 });
    }

    providerVerification = providerData;
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [payment] = await tx
        .select({
          id: payments.id,
          schoolId: payments.schoolId,
          amountKobo: payments.amountKobo,
          status: payments.status,
          metadataJson: payments.metadataJson,
        })
        .from(payments)
        .where(eq(payments.providerReference, reference))
        .limit(1);

      if (!payment) {
        return { kind: 'not_found' as const };
      }

      if (payment.status === 'failed' || payment.status === 'abandoned') {
        return { kind: 'not_creditable' as const };
      }

      if (!canVerifyPaymentForSchool(actor, payment.schoolId)) {
        return { kind: 'forbidden' as const };
      }

      const creditReference = `paystack-credit:${reference}`;
      const transactionId = makeEntityId('wallet_tx');
      const insertedTransactions = await tx
        .insert(walletTransactions)
        .values({
          id: transactionId,
          schoolId: payment.schoolId,
          type: 'credit',
          amountKobo: payment.amountKobo,
          description: 'Paystack wallet top-up',
          reference: creditReference,
          provider: 'paystack',
          createdByUserId: actor.userId,
        })
        .onConflictDoNothing({ target: walletTransactions.reference })
        .returning({ id: walletTransactions.id });

      let credited = false;
      let balanceKobo: number | null = null;

      if (insertedTransactions.length > 0) {
        await tx
          .insert(wallets)
          .values({
            id: makeEntityId('wallet'),
            schoolId: payment.schoolId,
            balanceKobo: 0,
          })
          .onConflictDoNothing({ target: wallets.schoolId });

        const [updatedWallet] = await tx
          .update(wallets)
          .set({
            balanceKobo: sql`${wallets.balanceKobo} + ${payment.amountKobo}`,
            updatedAt: new Date(),
          })
          .where(eq(wallets.schoolId, payment.schoolId))
          .returning({ balanceKobo: wallets.balanceKobo });

        credited = true;
        balanceKobo = updatedWallet?.balanceKobo ?? null;

        await tx.insert(auditLogs).values({
          id: makeEntityId('audit'),
          actorUserId: actor.userId,
          actorSchoolId: actor.sessionRole === 'platform_admin' ? null : actor.schoolId,
          action: 'wallet_credit_posted',
          entityType: 'wallet_transaction',
          entityId: transactionId,
          metadataJson: {
            paymentId: payment.id,
            reference,
            amountKobo: payment.amountKobo,
            balanceAfterKobo: balanceKobo,
          },
          ipAddress,
        });
      } else {
        const [currentWallet] = await tx
          .select({ balanceKobo: wallets.balanceKobo })
          .from(wallets)
          .where(eq(wallets.schoolId, payment.schoolId))
          .limit(1);
        balanceKobo = currentWallet?.balanceKobo ?? null;
      }

      await tx
        .update(payments)
        .set({
          status: 'successful',
          verifiedAt: new Date(),
          metadataJson: {
            ...toJsonRecord(payment.metadataJson),
            providerVerification: {
              verifiedReference: providerVerification?.reference ?? reference,
              channel: providerVerification?.channel ?? (env.PAYSTACK_SECRET_KEY ? 'paystack' : 'local_pending'),
              paidAt: providerVerification?.paid_at ?? null,
              status: providerVerification?.status ?? 'success',
            },
          },
        })
        .where(eq(payments.id, payment.id));

      await tx.insert(auditLogs).values({
        id: makeEntityId('audit'),
        actorUserId: actor.userId,
        actorSchoolId: actor.sessionRole === 'platform_admin' ? null : actor.schoolId,
        action: 'paystack_payment_verified',
        entityType: 'payment',
        entityId: payment.id,
        metadataJson: {
          reference,
          amountKobo: payment.amountKobo,
          credited,
        },
        ipAddress,
      });

      return {
        kind: 'success' as const,
        paymentId: payment.id,
        credited,
        walletBalanceKobo: balanceKobo,
        amountKobo: payment.amountKobo,
        status: 'successful' as const,
      };
    });

    if (result.kind === 'not_found') {
      return NextResponse.json({ ok: false, message: 'Payment reference was not found.' }, { status: 404 });
    }

    if (result.kind === 'not_creditable') {
      return NextResponse.json({ ok: false, message: 'Payment reference is not available for wallet credit.' }, { status: 409 });
    }

    if (result.kind === 'forbidden') {
      return NextResponse.json({ ok: false, message: 'Payment reference is not available for this school session.' }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      paymentId: result.paymentId,
      status: result.status,
      credited: result.credited,
      amountKobo: result.amountKobo,
      walletBalanceKobo: result.walletBalanceKobo,
    });
  } catch (error) {
    console.error('Paystack verify failed.', error);
    return NextResponse.json({ ok: false, message: 'Unable to verify payment.' }, { status: 500 });
  }
}
