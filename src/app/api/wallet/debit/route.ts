import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSchoolSessionRole } from '@/lib/local-session';

const walletDebitSchema = z.object({
  amountKobo: z.number().int().positive(),
  reason: z.string().trim().min(1),
  reference: z.string().trim().min(1).optional(),
});

export async function POST(request: Request) {
  const schoolRole = await getSchoolSessionRole();

  if (!schoolRole) {
    return NextResponse.json({ ok: false, message: 'School session required.' }, { status: 401 });
  }

  const payload = walletDebitSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ ok: false, message: 'Invalid wallet debit payload.', issues: payload.error.flatten() }, { status: 400 });
  }

  return NextResponse.json(
    {
      ok: false,
      environment: 'local',
      action: 'wallet_debit',
      message: 'Wallet debits are not enabled in the current local environment. No balance change was posted.',
      implementationNotes: [
        'Run debits inside a database transaction with balance checks.',
        'Write an immutable wallet transaction row before returning success.',
        'Make the debit idempotent by reference and audit log the actor.',
      ],
      received: payload.data,
    },
    { status: 501 },
  );
}
