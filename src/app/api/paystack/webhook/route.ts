import { createHmac, timingSafeEqual } from 'node:crypto';

import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { auditLogs, payments, walletTransactions, wallets } from '@/db/schema';
import { getServerEnv } from '@/lib/env';
import { makeEntityId } from '@/lib/ids';

export const runtime = 'nodejs';

type JsonRecord = Record<string, unknown>;

type PaystackWebhookPayload = {
  event?: string;
  data?: {
    reference?: string;
    amount?: number;
    status?: string;
    paid_at?: string | null;
    channel?: string | null;
  };
};

function toJsonRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function isValidSignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) {
    return false;
  }

  const expected = Buffer.from(createHmac('sha512', secret).update(rawBody).digest('hex'), 'hex');
  const received = Buffer.from(signature, 'hex');

  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function POST(request: Request) {
  const env = getServerEnv();

  const webhookSecret = env.PAYSTACK_WEBHOOK_SECRET ?? env.PAYSTACK_SECRET_KEY;

  if (!webhookSecret) {
    return NextResponse.json({ ok: false, message: 'Paystack webhook secret is not configured.' }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  if (!isValidSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ ok: false, message: 'Invalid Paystack webhook signature.' }, { status: 401 });
  }

  let payload: PaystackWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as PaystackWebhookPayload;
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid Paystack webhook payload.' }, { status: 400 });
  }

  if (payload.event !== 'charge.success') {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const reference = payload.data?.reference;
  const amountKobo = payload.data?.amount;

  if (!reference || !amountKobo) {
    return NextResponse.json({ ok: false, message: 'Webhook payload is missing payment reference or amount.' }, { status: 400 });
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

      if (payment.amountKobo !== amountKobo) {
        return { kind: 'amount_mismatch' as const };
      }

      if (payment.status === 'failed' || payment.status === 'abandoned') {
        return { kind: 'not_creditable' as const };
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
          createdByUserId: null,
        })
        .onConflictDoNothing({ target: walletTransactions.reference })
        .returning({ id: walletTransactions.id });

      let credited = false;
      let balanceKobo: number | null = null;

      if (insertedTransactions.length > 0) {
        await tx
          .insert(wallets)
          .values({ id: makeEntityId('wallet'), schoolId: payment.schoolId, balanceKobo: 0 })
          .onConflictDoNothing({ target: wallets.schoolId });

        const [updatedWallet] = await tx
          .update(wallets)
          .set({ balanceKobo: sql`${wallets.balanceKobo} + ${payment.amountKobo}`, updatedAt: new Date() })
          .where(eq(wallets.schoolId, payment.schoolId))
          .returning({ balanceKobo: wallets.balanceKobo });

        credited = true;
        balanceKobo = updatedWallet?.balanceKobo ?? null;
      } else {
        const [currentWallet] = await tx.select({ balanceKobo: wallets.balanceKobo }).from(wallets).where(eq(wallets.schoolId, payment.schoolId)).limit(1);
        balanceKobo = currentWallet?.balanceKobo ?? null;
      }

      await tx
        .update(payments)
        .set({
          status: 'successful',
          verifiedAt: new Date(),
          metadataJson: {
            ...toJsonRecord(payment.metadataJson),
            webhook: {
              event: payload.event,
              reference,
              channel: payload.data?.channel ?? null,
              paidAt: payload.data?.paid_at ?? null,
            },
          },
        })
        .where(eq(payments.id, payment.id));

      await tx.insert(auditLogs).values({
        id: makeEntityId('audit'),
        actorUserId: null,
        actorSchoolId: payment.schoolId,
        action: 'paystack_webhook_payment_verified',
        entityType: 'payment',
        entityId: payment.id,
        metadataJson: { reference, amountKobo: payment.amountKobo, credited, balanceAfterKobo: balanceKobo },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip'),
      });

      return { kind: 'success' as const, credited };
    });

    if (result.kind === 'not_found') {
      return NextResponse.json({ ok: true, ignored: true, reason: 'unknown_reference' });
    }

    if (result.kind === 'amount_mismatch') {
      return NextResponse.json({ ok: false, message: 'Webhook payment amount does not match initialized amount.' }, { status: 409 });
    }

    if (result.kind === 'not_creditable') {
      return NextResponse.json({ ok: true, ignored: true, reason: 'not_creditable' });
    }

    return NextResponse.json({ ok: true, credited: result.credited });
  } catch (error) {
    console.error('Paystack webhook failed.', error);
    return NextResponse.json({ ok: false, message: 'Unable to process Paystack webhook.' }, { status: 500 });
  }
}
