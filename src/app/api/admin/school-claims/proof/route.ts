import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { schoolClaims } from '@/db/schema';
import { resolveOptionalLocalActor } from '@/lib/local-actor';
import { decodeSafeUploadDataUrl, safeAttachmentHeaders } from '@/lib/upload-security';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const actor = await resolveOptionalLocalActor();

  if (!actor || actor.sessionRole !== 'platform_admin') {
    return NextResponse.json({ ok: false, message: 'Platform admin access required.' }, { status: 403 });
  }

  const claimId = new URL(request.url).searchParams.get('claimId')?.trim();

  if (!claimId) {
    return NextResponse.json({ ok: false, message: 'Claim id is required.' }, { status: 400 });
  }

  const [claim] = await db
    .select({
      proofFileName: schoolClaims.proofFileName,
      proofFileType: schoolClaims.proofFileType,
      proofFileDataUrl: schoolClaims.proofFileDataUrl,
    })
    .from(schoolClaims)
    .where(eq(schoolClaims.id, claimId))
    .limit(1);

  if (!claim) {
    return NextResponse.json({ ok: false, message: 'Claim not found.' }, { status: 404 });
  }

  if (!claim.proofFileDataUrl) {
    return NextResponse.json({ ok: false, message: 'No proof file is stored for this claim.' }, { status: 404 });
  }

  const decoded = decodeSafeUploadDataUrl(claim.proofFileDataUrl, claim.proofFileType);

  if (!decoded) {
    return NextResponse.json({ ok: false, message: 'Stored proof file is invalid or unsafe.' }, { status: 500 });
  }

  return new Response(new Uint8Array(decoded.bytes), {
    headers: safeAttachmentHeaders(claim.proofFileName, decoded.contentType),
  });
}
