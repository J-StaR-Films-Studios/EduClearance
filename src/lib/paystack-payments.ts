import { eq, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { auditLogs, payments, walletTransactions, wallets } from '@/db/schema';
import { makeEntityId } from '@/lib/ids';

export type JsonRecord = Record<string, unknown>;

export type PaystackVerificationData = {
  status?: string;
  reference?: string;
  amount?: number;
  paid_at?: string | null;
  channel?: string | null;
};

type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data?: PaystackVerificationData;
};

export type ProviderVerificationResult =
  | { kind: 'success'; data: PaystackVerificationData }
  | { kind: 'terminal'; providerStatus: 'failed' | 'abandoned'; data: PaystackVerificationData | null; message: string }
  | { kind: 'pending'; providerStatus: string | null; data: PaystackVerificationData | null; message: string }
  | { kind: 'unavailable'; message: string };

export type CreditPaystackPaymentResult =
  | {
      kind: 'success';
      paymentId: string;
      schoolId: string;
      credited: boolean;
      walletBalanceKobo: number | null;
      amountKobo: number;
      status: 'successful';
    }
  | { kind: 'not_found' }
  | { kind: 'not_creditable' }
  | { kind: 'amount_mismatch'; expectedAmountKobo: number; actualAmountKobo: number | null };

export function toJsonRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : {};
}

export async function verifyPaystackReference(reference: string, secretKey: string): Promise<ProviderVerificationResult> {
  const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });

  const paystackJson = (await paystackResponse.json().catch(() => null)) as PaystackVerifyResponse | null;
  const providerData = paystackJson?.data ?? null;
  const providerStatus = providerData?.status ?? null;

  if (!paystackResponse.ok || !paystackJson?.status || !providerData || !providerStatus) {
    return {
      kind: 'unavailable',
      message: paystackJson?.message ?? 'Payment provider confirmation is temporarily unavailable.',
    };
  }

  if (providerStatus === 'success') {
    return { kind: 'success', data: providerData };
  }

  if (providerStatus === 'failed' || providerStatus === 'abandoned') {
    return {
      kind: 'terminal',
      providerStatus,
      data: providerData,
      message: paystackJson.message,
    };
  }

  return {
    kind: 'pending',
    providerStatus,
    data: providerData,
    message: paystackJson.message,
  };
}

export async function markPaystackPaymentTerminal(reference: string, providerStatus: 'failed' | 'abandoned', providerData: PaystackVerificationData | null, message: string) {
  const [payment] = await db
    .update(payments)
    .set({
      status: providerStatus,
      metadataJson: sql`${payments.metadataJson} || ${JSON.stringify({
        providerVerification: {
          status: providerStatus,
          reference: providerData?.reference ?? reference,
          message,
        },
      })}::jsonb`,
    })
    .where(eq(payments.providerReference, reference))
    .returning({ id: payments.id });

  return payment ?? null;
}

export async function creditSuccessfulPaystackPayment({
  reference,
  providerVerification,
  actorUserId = null,
  actorSchoolId = null,
  ipAddress = null,
  paymentAuditAction = 'paystack_payment_verified',
  source = 'browser_verify',
}: {
  reference: string;
  providerVerification: PaystackVerificationData | null;
  actorUserId?: string | null;
  actorSchoolId?: string | null;
  ipAddress?: string | null;
  paymentAuditAction?: string;
  source?: string;
}): Promise<CreditPaystackPaymentResult> {
  return db.transaction(async (tx) => {
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

    if (providerVerification?.amount !== undefined && providerVerification.amount !== payment.amountKobo) {
      return {
        kind: 'amount_mismatch' as const,
        expectedAmountKobo: payment.amountKobo,
        actualAmountKobo: providerVerification.amount ?? null,
      };
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
        description: 'Wallet top-up',
        reference: creditReference,
        provider: 'paystack',
        createdByUserId: actorUserId,
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
        actorUserId,
        actorSchoolId,
        action: 'wallet_credit_posted',
        entityType: 'wallet_transaction',
        entityId: transactionId,
        metadataJson: {
          paymentId: payment.id,
          reference,
          amountKobo: payment.amountKobo,
          balanceAfterKobo: balanceKobo,
          source,
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
            channel: providerVerification?.channel ?? source,
            paidAt: providerVerification?.paid_at ?? null,
            status: providerVerification?.status ?? 'success',
            source,
          },
        },
      })
      .where(eq(payments.id, payment.id));

    await tx.insert(auditLogs).values({
      id: makeEntityId('audit'),
      actorUserId,
      actorSchoolId,
      action: paymentAuditAction,
      entityType: 'payment',
      entityId: payment.id,
      metadataJson: {
        reference,
        amountKobo: payment.amountKobo,
        credited,
        source,
      },
      ipAddress,
    });

    return {
      kind: 'success' as const,
      paymentId: payment.id,
      schoolId: payment.schoolId,
      credited,
      walletBalanceKobo: balanceKobo,
      amountKobo: payment.amountKobo,
      status: 'successful' as const,
    };
  });
}
