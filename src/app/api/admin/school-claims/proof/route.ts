import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { schoolClaims } from '@/db/schema';
import { resolveOptionalLocalActor } from '@/lib/local-actor';

export const runtime = 'nodejs';

function decodeDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    return null;
  }

  return {
    contentType: match[1],
    bytes: Buffer.from(match[2], 'base64'),
  };
}

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120) || 'school-claim-proof';
}

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

  const decoded = decodeDataUrl(claim.proofFileDataUrl);

  if (!decoded) {
    return NextResponse.json({ ok: false, message: 'Stored proof file is invalid.' }, { status: 500 });
  }

  return new Response(decoded.bytes, {
    headers: {
      'Content-Type': claim.proofFileType ?? decoded.contentType,
      'Content-Disposition': `inline; filename="${safeFilename(claim.proofFileName)}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
