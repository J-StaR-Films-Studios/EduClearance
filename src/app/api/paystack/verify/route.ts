import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { payments } from '@/db/schema';
import { getServerEnv } from '@/lib/env';
import { canManageSchoolWallet, canVerifyPaymentForSchool, resolveOptionalLocalActor } from '@/lib/local-actor';
import { creditSuccessfulPaystackPayment, markPaystackPaymentTerminal, verifyPaystackReference } from '@/lib/paystack-payments';

const paystackVerifySchema = z.object({
  reference: z.string().trim().min(1),
});

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
    return NextResponse.json({ ok: false, message: 'Invalid payment confirmation request.', issues: payload.error.flatten() }, { status: 400 });
  }

  const actor = await resolveOptionalLocalActor();

  if (!actor) {
    return NextResponse.json({ ok: false, message: 'Please sign in to continue.' }, { status: 401 });
  }

  if (actor.sessionRole !== 'platform_admin' && !canManageSchoolWallet(actor)) {
    return NextResponse.json({ ok: false, message: 'Only a school owner or admin can manage billing.' }, { status: 403 });
  }

  const reference = payload.data.reference;
  const env = getServerEnv();

  if (!env.PAYSTACK_SECRET_KEY && !(isLocalAppUrl(env.NEXT_PUBLIC_APP_URL) && isLocalRequest(request))) {
    return NextResponse.json({ ok: false, message: 'Payment confirmation is temporarily unavailable. Please contact support.' }, { status: 503 });
  }

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip');

  const [paymentBeforeVerify] = await db
    .select({
      id: payments.id,
      schoolId: payments.schoolId,
      status: payments.status,
    })
    .from(payments)
    .where(eq(payments.providerReference, reference))
    .limit(1);

  if (!paymentBeforeVerify) {
    return NextResponse.json({ ok: false, message: 'We could not find that payment. Please start checkout again.' }, { status: 404 });
  }

  if (!canVerifyPaymentForSchool(actor, paymentBeforeVerify.schoolId)) {
    return NextResponse.json({ ok: false, message: 'This payment is not available for your school account.' }, { status: 403 });
  }

  if (paymentBeforeVerify.status === 'failed' || paymentBeforeVerify.status === 'abandoned') {
    return NextResponse.json({ ok: false, message: 'This payment can no longer be added to a wallet.' }, { status: 409 });
  }

  const source = env.PAYSTACK_SECRET_KEY ? 'browser_verify' : 'local_pending';
  let providerVerification = null;

  if (env.PAYSTACK_SECRET_KEY) {
    const verification = await verifyPaystackReference(reference, env.PAYSTACK_SECRET_KEY);

    if (verification.kind === 'unavailable') {
      return NextResponse.json(
        { ok: false, message: 'We could not confirm this payment yet. If you completed checkout, wait a moment and try again.', retryable: true },
        { status: 400 },
      );
    }

    if (verification.kind === 'pending') {
      return NextResponse.json(
        { ok: false, message: 'This payment is still being processed. Please wait a moment and try again.', retryable: true },
        { status: 400 },
      );
    }

    if (verification.kind === 'terminal') {
      await markPaystackPaymentTerminal(reference, verification.providerStatus, verification.data, verification.message);
      return NextResponse.json({ ok: false, message: 'This payment was not successful. Please try checkout again.', retryable: false }, { status: 400 });
    }

    providerVerification = verification.data;
  }

  try {
    const result = await creditSuccessfulPaystackPayment({
      reference,
      providerVerification,
      actorUserId: actor.userId,
      actorSchoolId: actor.sessionRole === 'platform_admin' ? null : actor.schoolId,
      ipAddress,
      paymentAuditAction: 'paystack_payment_verified',
      source,
    });

    if (result.kind === 'not_found') {
      return NextResponse.json({ ok: false, message: 'We could not find that payment. Please start checkout again.' }, { status: 404 });
    }

    if (result.kind === 'not_creditable') {
      return NextResponse.json({ ok: false, message: 'This payment can no longer be added to a wallet.' }, { status: 409 });
    }

    if (result.kind === 'amount_mismatch') {
      return NextResponse.json({ ok: false, message: 'The payment amount does not match this checkout. Please contact support before trying again.', retryable: true }, { status: 409 });
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
    return NextResponse.json({ ok: false, message: 'We could not confirm this payment yet. Please try again.' }, { status: 500 });
  }
}
