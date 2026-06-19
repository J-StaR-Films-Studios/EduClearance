import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { auditLogs, payments } from '@/db/schema';
import { getServerEnv } from '@/lib/env';
import { makeEntityId, makePaymentReference } from '@/lib/ids';
import { canManageSchoolWallet, resolveLocalSchoolActor } from '@/lib/local-actor';

const MAX_PAYMENT_AMOUNT_KOBO = 100_000_000;

const paystackInitializeSchema = z.object({
  amountKobo: z.number().int().positive().max(MAX_PAYMENT_AMOUNT_KOBO),
  email: z.string().email().optional(),
  callbackUrl: z.string().trim().url().optional(),
});

type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data?: {
    authorization_url?: string;
    access_code?: string;
    reference?: string;
  };
};

function getSafeCallbackUrl(appUrl: string, providedCallbackUrl: string | undefined, reference: string) {
  const fallback = new URL('/wallet', appUrl);
  const candidate = providedCallbackUrl ? new URL(providedCallbackUrl) : fallback;
  const applicationOrigin = new URL(appUrl).origin;
  const safeUrl = candidate.origin === applicationOrigin ? candidate : fallback;

  safeUrl.searchParams.set('payment_reference', reference);
  return safeUrl.toString();
}

export async function POST(request: Request) {
  const actor = await resolveLocalSchoolActor();

  if (!actor) {
    return NextResponse.json({ ok: false, message: 'Active school session required.' }, { status: 401 });
  }

  if (!canManageSchoolWallet(actor)) {
    return NextResponse.json({ ok: false, message: 'School owner or admin permission required.' }, { status: 403 });
  }

  const payload = paystackInitializeSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ ok: false, message: 'Invalid Paystack initialize payload.', issues: payload.error.flatten() }, { status: 400 });
  }

  const env = getServerEnv();
  const reference = makePaymentReference();
  const paymentId = makeEntityId('payment');
  const callbackUrl = getSafeCallbackUrl(env.NEXT_PUBLIC_APP_URL, payload.data.callbackUrl, reference);
  const customerEmail = payload.data.email ?? actor.userEmail;
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip');
  const metadata = {
    schoolId: actor.schoolId,
    actorUserId: actor.userId,
    callbackUrl,
    customerEmail,
    mode: env.PAYSTACK_SECRET_KEY ? 'paystack' : 'local_pending',
  };

  try {
    await db.transaction(async (tx) => {
      await tx.insert(payments).values({
        id: paymentId,
        schoolId: actor.schoolId,
        provider: 'paystack',
        providerReference: reference,
        amountKobo: payload.data.amountKobo,
        status: 'initialized',
        metadataJson: metadata,
      });

      await tx.insert(auditLogs).values({
        id: makeEntityId('audit'),
        actorUserId: actor.userId,
        actorSchoolId: actor.schoolId,
        action: 'paystack_payment_initialized',
        entityType: 'payment',
        entityId: paymentId,
        metadataJson: {
          reference,
          amountKobo: payload.data.amountKobo,
          mode: metadata.mode,
        },
        ipAddress,
      });
    });

    if (!env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json({
        ok: true,
        paymentId,
        reference,
        status: 'initialized',
        authorizationUrl: `${env.NEXT_PUBLIC_APP_URL}/wallet?payment_reference=${encodeURIComponent(reference)}`,
        requiresVerification: true,
      });
    }

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: payload.data.amountKobo,
        email: customerEmail,
        callback_url: callbackUrl,
        reference,
        metadata: {
          schoolId: actor.schoolId,
          paymentId,
        },
      }),
    });

    const paystackJson = (await paystackResponse.json().catch(() => null)) as PaystackInitializeResponse | null;

    if (!paystackResponse.ok || !paystackJson?.status || !paystackJson.data?.authorization_url) {
      await db.update(payments).set({ status: 'failed', metadataJson: { ...metadata, providerMessage: paystackJson?.message ?? 'Initialization failed' } }).where(eq(payments.id, paymentId));

      return NextResponse.json({ ok: false, message: 'Payment initialization failed.' }, { status: 502 });
    }

    await db
      .update(payments)
      .set({
        metadataJson: {
          ...metadata,
          providerReference: paystackJson.data.reference ?? reference,
          accessCode: paystackJson.data.access_code ?? null,
        },
      })
      .where(eq(payments.id, paymentId));

    return NextResponse.json({
      ok: true,
      paymentId,
      reference: paystackJson.data.reference ?? reference,
      status: 'initialized',
      authorizationUrl: paystackJson.data.authorization_url,
      accessCode: paystackJson.data.access_code ?? null,
      requiresVerification: true,
    });
  } catch (error) {
    console.error('Paystack initialize failed.', error);
    return NextResponse.json({ ok: false, message: 'Unable to initialize payment.' }, { status: 500 });
  }
}
