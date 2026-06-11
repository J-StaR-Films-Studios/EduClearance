import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSchoolSessionRole } from '@/lib/demo-session';

const paystackInitializeSchema = z.object({
  amountKobo: z.number().int().positive(),
  email: z.string().email().optional(),
  callbackUrl: z.string().trim().url().optional(),
});

export async function POST(request: Request) {
  const schoolRole = await getSchoolSessionRole();

  if (!schoolRole) {
    return NextResponse.json({ ok: false, message: 'School session required.' }, { status: 401 });
  }

  const payload = paystackInitializeSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ ok: false, message: 'Invalid Paystack initialize payload.', issues: payload.error.flatten() }, { status: 400 });
  }

  return NextResponse.json(
    {
      ok: false,
      demo: true,
      action: 'paystack_initialize',
      message: 'Demo placeholder only. No Paystack transaction was initialized.',
      requiredProductionWork: [
        'Create a pending payment record on the server before calling Paystack.',
        'Use secret keys only on the server and return the provider authorization URL/reference.',
        'Link the initialized payment to the school wallet for later verification.',
      ],
      received: payload.data,
    },
    { status: 501 },
  );
}
