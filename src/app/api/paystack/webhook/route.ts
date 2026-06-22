import { createHmac, timingSafeEqual } from 'node:crypto';

import { NextResponse } from 'next/server';

import { getServerEnv } from '@/lib/env';
import { creditSuccessfulPaystackPayment } from '@/lib/paystack-payments';

export const runtime = 'nodejs';

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
  const webhookSecret = env.PAYSTACK_WEBHOOK_SECRET || env.PAYSTACK_SECRET_KEY;

  if (!webhookSecret) {
    return NextResponse.json({ ok: false, message: 'Payment notifications are temporarily unavailable.' }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  if (!isValidSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ ok: false, message: 'Invalid payment notification signature.' }, { status: 401 });
  }

  let payload: PaystackWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as PaystackWebhookPayload;
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid payment notification payload.' }, { status: 400 });
  }

  if (payload.event !== 'charge.success') {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const reference = payload.data?.reference;

  if (!reference || !payload.data?.amount) {
    return NextResponse.json({ ok: false, message: 'Payment notification is missing required details.' }, { status: 400 });
  }

  try {
    const result = await creditSuccessfulPaystackPayment({
      reference,
      providerVerification: {
        reference,
        amount: payload.data.amount,
        status: payload.data.status ?? 'success',
        paid_at: payload.data.paid_at ?? null,
        channel: payload.data.channel ?? null,
      },
      actorUserId: null,
      actorSchoolId: null,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip'),
      paymentAuditAction: 'paystack_webhook_payment_verified',
      source: 'paystack_webhook',
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
    console.error('Payment notification failed.', error);
    return NextResponse.json({ ok: false, message: 'Unable to process payment notification.' }, { status: 500 });
  }
}
