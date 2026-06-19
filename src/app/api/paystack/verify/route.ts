import { NextResponse } from 'next/server';
import { z } from 'zod';

const paystackVerifySchema = z.object({
  reference: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const payload = paystackVerifySchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ ok: false, message: 'Invalid Paystack verify payload.', issues: payload.error.flatten() }, { status: 400 });
  }

  return NextResponse.json(
    {
      ok: false,
      environment: 'local',
      action: 'paystack_verify',
      message: 'Paystack verification is not enabled in the current local environment. No wallet credit was created.',
      implementationNotes: [
        'Verify the reference against Paystack on the server or via a signed webhook.',
        'Credit the wallet only after a successful, idempotent verification result.',
        'Persist payment verification timestamps and audit log the credit event.',
      ],
      received: payload.data,
    },
    { status: 501 },
  );
}
