import { NextResponse } from 'next/server';
import { z } from 'zod';

import { CHECK_PRICE_KOBO } from '@/lib/money';
import { getSchoolSessionRole } from '@/lib/demo-session';

const clearanceStartSchema = z.object({
  studentName: z.string().trim().min(1),
  parentName: z.string().trim().min(1),
  parentPhone: z.string().trim().min(1),
  previousSchoolName: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const schoolRole = await getSchoolSessionRole();

  if (!schoolRole) {
    return NextResponse.json({ ok: false, message: 'School session required.' }, { status: 401 });
  }

  const payload = clearanceStartSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ ok: false, message: 'Invalid clearance request payload.', issues: payload.error.flatten() }, { status: 400 });
  }

  return NextResponse.json(
    {
      ok: false,
      demo: true,
      action: 'clearance_start',
      message: 'Demo placeholder only. No clearance request row was created and no wallet debit was posted.',
      requiredProductionWork: [
        `Validate active school membership and deduct exactly ₦${CHECK_PRICE_KOBO / 100} transactionally.`,
        'Create the clearance request and wallet transaction in one database transaction.',
        'Audit log the actor and trigger previous-school notification workflow.',
      ],
      received: payload.data,
    },
    { status: 501 },
  );
}
