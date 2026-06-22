import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/client';
import { payments } from '@/db/schema';
import { getServerEnv } from '@/lib/env';
import { creditSuccessfulPaystackPayment, markPaystackPaymentTerminal, verifyPaystackReference } from '@/lib/paystack-payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_RECONCILE_PAYMENTS = 25;

function isAuthorizedCronRequest(request: Request, cronSecret: string | undefined) {
  if (!cronSecret) {
    return process.env.NODE_ENV !== 'production';
  }

  return request.headers.get('authorization') === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  const env = getServerEnv();

  if (!isAuthorizedCronRequest(request, env.CRON_SECRET)) {
    return NextResponse.json({ ok: false, message: 'Unauthorized scheduled reconciliation request.' }, { status: 401 });
  }

  if (!env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ ok: false, message: 'Paystack secret key is not configured.' }, { status: 503 });
  }

  const pendingPayments = await db
    .select({
      id: payments.id,
      providerReference: payments.providerReference,
    })
    .from(payments)
    .where(and(eq(payments.provider, 'paystack'), eq(payments.status, 'initialized')))
    .orderBy(desc(payments.createdAt))
    .limit(MAX_RECONCILE_PAYMENTS);

  const summary = {
    checked: 0,
    credited: 0,
    alreadyCredited: 0,
    pending: 0,
    failed: 0,
    amountMismatch: 0,
    unavailable: 0,
    notFound: 0,
  };

  for (const payment of pendingPayments) {
    summary.checked += 1;

    const verification = await verifyPaystackReference(payment.providerReference, env.PAYSTACK_SECRET_KEY);

    if (verification.kind === 'unavailable') {
      summary.unavailable += 1;
      continue;
    }

    if (verification.kind === 'pending') {
      summary.pending += 1;
      continue;
    }

    if (verification.kind === 'terminal') {
      await markPaystackPaymentTerminal(payment.providerReference, verification.providerStatus, verification.data, verification.message);
      summary.failed += 1;
      continue;
    }

    const result = await creditSuccessfulPaystackPayment({
      reference: payment.providerReference,
      providerVerification: verification.data,
      actorUserId: null,
      actorSchoolId: null,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip'),
      paymentAuditAction: 'paystack_reconciled_payment_verified',
      source: 'paystack_reconcile_cron',
    });

    if (result.kind === 'success') {
      if (result.credited) {
        summary.credited += 1;
      } else {
        summary.alreadyCredited += 1;
      }
      continue;
    }

    if (result.kind === 'amount_mismatch') {
      summary.amountMismatch += 1;
      continue;
    }

    if (result.kind === 'not_found') {
      summary.notFound += 1;
      continue;
    }

    if (result.kind === 'not_creditable') {
      summary.failed += 1;
    }
  }

  return NextResponse.json({ ok: true, ...summary });
}
