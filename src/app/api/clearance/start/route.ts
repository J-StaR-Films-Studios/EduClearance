import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { and, eq, gte, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { auditLogs, clearanceIssues, clearanceRequests, schools, walletTransactions, wallets } from '@/db/schema';
import { makeEntityId, makeWalletReference } from '@/lib/ids';
import { resolveLocalSchoolActor } from '@/lib/local-actor';
import { CHECK_PRICE_KOBO } from '@/lib/money';
import { buildStudentDisplayName, getNameTokenOverlap, getNameTokens, isValidPhoneNumber, normalizeNameSignature, normalizePhoneNumber, normalizeSearchText } from '@/lib/text';

class InsufficientFundsError extends Error {
  constructor(readonly balanceKobo: number) {
    super('Insufficient wallet balance.');
  }
}

const clearanceStartSchema = z.object({
  requestKey: z.string().uuid(),
  studentName: z.string().trim().optional(),
  studentFirstName: z.string().trim().min(1).optional(),
  studentMiddleName: z.string().trim().optional(),
  studentLastName: z.string().trim().optional(),
  parentName: z.string().trim().min(1),
  parentPhone: z.string().trim().min(1),
  previousSchoolId: z.string().trim().min(1).nullable().optional(),
  previousSchoolName: z.string().trim().min(1),
  gender: z.string().trim().min(1).optional(),
  lastClass: z.string().trim().min(1).optional(),
});

export async function POST(request: Request) {
  const actor = await resolveLocalSchoolActor();

  if (!actor) {
    return NextResponse.json({ ok: false, message: 'Active school session required.' }, { status: 401 });
  }

  if (actor.schoolStatus !== 'active') {
    return NextResponse.json({ ok: false, message: 'Only active schools can start clearance requests.' }, { status: 403 });
  }

  const payload = clearanceStartSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    const issues = payload.error.flatten();
    const message = issues.fieldErrors.requestKey
      ? 'Please refresh the page before starting a clearance request.'
      : 'Invalid clearance request payload.';
    return NextResponse.json({ ok: false, message, issues }, { status: 400 });
  }

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip');
  const studentName = buildStudentDisplayName(payload.data.studentFirstName ?? '', payload.data.studentMiddleName, payload.data.studentLastName) || payload.data.studentName?.trim() || '';

  if (!studentName) {
    return NextResponse.json({ ok: false, message: 'Enter at least the student first name before starting a clearance request.' }, { status: 400 });
  }

  if (!isValidPhoneNumber(payload.data.parentPhone)) {
    return NextResponse.json({ ok: false, message: 'Enter a real parent phone number using digits, e.g. +234 803 123 4567.' }, { status: 400 });
  }

  const studentNameNormalized = normalizeSearchText(studentName);
  const studentNameSignature = normalizeNameSignature(studentName);
  const parentPhoneNormalized = normalizePhoneNumber(payload.data.parentPhone);
  const requestFingerprint = createHash('sha256').update(JSON.stringify({
    studentName,
    parentName: payload.data.parentName,
    parentPhone: parentPhoneNormalized,
    previousSchoolId: payload.data.previousSchoolId ?? null,
    previousSchoolName: payload.data.previousSchoolName,
    gender: payload.data.gender ?? null,
    lastClass: payload.data.lastClass ?? null,
  })).digest('hex');

  try {
    const result = await db.transaction(async (tx) => {
      const [currentWallet] = await tx
        .select({ id: wallets.id, balanceKobo: wallets.balanceKobo })
        .from(wallets)
        .where(eq(wallets.schoolId, actor.schoolId))
        .limit(1);

      const [existingRequest] = await tx
        .select({
          id: clearanceRequests.id,
          status: clearanceRequests.status,
          searchResult: clearanceRequests.searchResult,
          amountCharged: clearanceRequests.amountCharged,
          requestFingerprint: clearanceRequests.requestFingerprint,
        })
        .from(clearanceRequests)
        .where(and(eq(clearanceRequests.incomingSchoolId, actor.schoolId), eq(clearanceRequests.requestKey, payload.data.requestKey)))
        .limit(1);

      if (existingRequest) {
        return { kind: 'existing' as const, request: existingRequest, balanceKobo: currentWallet?.balanceKobo ?? 0 };
      }
      if (!currentWallet || currentWallet.balanceKobo < CHECK_PRICE_KOBO) {
        return { kind: 'insufficient_funds' as const, balanceKobo: currentWallet?.balanceKobo ?? 0 };
      }

      const [selectedPreviousSchool] = payload.data.previousSchoolId
        ? await tx
            .select({ id: schools.id, name: schools.name, status: schools.status })
            .from(schools)
            .where(eq(schools.id, payload.data.previousSchoolId))
            .limit(1)
        : await tx
            .select({ id: schools.id, name: schools.name, status: schools.status })
            .from(schools)
            .where(sql`lower(${schools.name}) = lower(${payload.data.previousSchoolName})`)
            .limit(1);

      // Only the named previous school can supply a candidate. An unlisted school cannot
      // establish a match by a similar name elsewhere in the network.
      const unresolvedIssues = selectedPreviousSchool
        ? await tx
            .select({
              id: clearanceIssues.id,
              studentName: clearanceIssues.studentName,
              studentNameNormalized: clearanceIssues.studentNameNormalized,
              parentPhone: clearanceIssues.parentPhone,
            })
            .from(clearanceIssues)
            .where(and(
              eq(clearanceIssues.status, 'unresolved'),
              eq(clearanceIssues.reportingSchoolId, selectedPreviousSchool.id),
            ))
        : [];

      const submittedTokenCount = getNameTokens(studentName).length;
      const candidateIssues = unresolvedIssues
        .map((issue) => {
          const exactName = issue.studentNameNormalized === studentNameNormalized;
          const signatureMatch = normalizeNameSignature(issue.studentName) === studentNameSignature && studentNameSignature.length > 0;
          const overlap = getNameTokenOverlap(issue.studentName, studentName);
          const enoughOverlap = submittedTokenCount <= 1 ? overlap >= 1 : overlap >= 2;
          const phoneMatch = normalizePhoneNumber(issue.parentPhone) === parentPhoneNormalized;
          const qualifies = exactName || signatureMatch || enoughOverlap;
          const score = (exactName ? 30 : 0) + (signatureMatch ? 25 : 0) + (phoneMatch ? 20 : 0) + overlap;

          return { ...issue, exactName, signatureMatch, phoneMatch, qualifies, score };
        })
        .filter((issue) => issue.qualifies)
        .sort((a, b) => b.score - a.score);

      const confirmedIssue = candidateIssues.find((issue) => issue.phoneMatch && (issue.exactName || issue.signatureMatch)) ?? null;
      const possibleIssue = confirmedIssue ? null : candidateIssues[0] ?? null;
      const previousSchool = selectedPreviousSchool ?? null;

      const requestId = makeEntityId('clearance');
      const debitReference = makeWalletReference('clearance');
      const searchResult = confirmedIssue ? 'confirmed_match' : possibleIssue ? 'possible_match' : 'no_match';
      const status = confirmedIssue
        ? 'outstanding_balance_reported'
        : possibleIssue
          ? 'pending_verification'
          : previousSchool?.status === 'active'
            ? 'previous_school_notified'
            : 'no_platform_record_found';
      const notificationStatus = confirmedIssue || previousSchool?.status === 'active' ? 'dashboard' : possibleIssue ? 'not_sent' : 'whatsapp_generated';
      const insertedRequests = await tx.insert(clearanceRequests).values({
        id: requestId,
        incomingSchoolId: actor.schoolId,
        previousSchoolId: previousSchool?.id ?? null,
        previousSchoolNameSnapshot: previousSchool?.name ?? payload.data.previousSchoolName,
        studentName,
        studentNameNormalized,
        gender: payload.data.gender ?? null,
        lastClass: payload.data.lastClass ?? null,
        parentName: payload.data.parentName,
        parentPhone: payload.data.parentPhone,
        status,
        searchResult,
        amountCharged: CHECK_PRICE_KOBO,
        requestKey: payload.data.requestKey,
        requestFingerprint,
        notificationStatus,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        createdByUserId: actor.userId,
      }).onConflictDoNothing({ target: [clearanceRequests.incomingSchoolId, clearanceRequests.requestKey] })
        .returning({ id: clearanceRequests.id });

      if (insertedRequests.length === 0) {
        const [racedRequest] = await tx
          .select({
            id: clearanceRequests.id,
            status: clearanceRequests.status,
            searchResult: clearanceRequests.searchResult,
            amountCharged: clearanceRequests.amountCharged,
            requestFingerprint: clearanceRequests.requestFingerprint,
          })
          .from(clearanceRequests)
          .where(and(eq(clearanceRequests.incomingSchoolId, actor.schoolId), eq(clearanceRequests.requestKey, payload.data.requestKey)))
          .limit(1);
        if (!racedRequest) throw new Error('Clearance request key conflict without an existing request.');
        const [walletAfterRace] = await tx
          .select({ balanceKobo: wallets.balanceKobo })
          .from(wallets)
          .where(eq(wallets.schoolId, actor.schoolId))
          .limit(1);
        return { kind: 'existing' as const, request: racedRequest, balanceKobo: walletAfterRace?.balanceKobo ?? 0 };
      }

      const [updatedWallet] = await tx
        .update(wallets)
        .set({ balanceKobo: sql`${wallets.balanceKobo} - ${CHECK_PRICE_KOBO}`, updatedAt: new Date() })
        .where(and(eq(wallets.schoolId, actor.schoolId), gte(wallets.balanceKobo, CHECK_PRICE_KOBO)))
        .returning({ balanceKobo: wallets.balanceKobo });
      if (!updatedWallet) throw new InsufficientFundsError(currentWallet.balanceKobo);

      // A possible name match must not attach another child's debt to this case.
      const linkedIssue = confirmedIssue;

      if (linkedIssue) {
        await tx
          .update(clearanceIssues)
          .set({ clearanceRequestId: requestId })
          .where(eq(clearanceIssues.id, linkedIssue.id));
      }

      const transactionId = makeEntityId('wallet_tx');

      await tx.insert(walletTransactions).values({
        id: transactionId,
        schoolId: actor.schoolId,
        type: 'debit',
        amountKobo: CHECK_PRICE_KOBO,
        description: `Clearance request for ${studentName}`,
        reference: debitReference,
        provider: 'system',
        createdByUserId: actor.userId,
      });

      await tx.insert(auditLogs).values([
        {
          id: makeEntityId('audit'),
          actorUserId: actor.userId,
          actorSchoolId: actor.schoolId,
          action: 'clearance_request_started',
          entityType: 'clearance_request',
          entityId: requestId,
          metadataJson: {
            searchResult,
            status,
            matchedIssueId: confirmedIssue?.id ?? null,
            possibleIssueId: possibleIssue?.id ?? null,
            linkedIssueId: linkedIssue?.id ?? null,
            possibleIssueCount: candidateIssues.length,
            amountChargedKobo: CHECK_PRICE_KOBO,
          },
          ipAddress,
        },
        {
          id: makeEntityId('audit'),
          actorUserId: actor.userId,
          actorSchoolId: actor.schoolId,
          action: 'clearance_wallet_debited',
          entityType: 'wallet_transaction',
          entityId: transactionId,
          metadataJson: {
            clearanceRequestId: requestId,
            reference: debitReference,
            amountKobo: CHECK_PRICE_KOBO,
            balanceAfterKobo: updatedWallet.balanceKobo,
          },
          ipAddress,
        },
      ]);

      return {
        kind: 'success' as const,
        requestId,
        status,
        searchResult,
        amountChargedKobo: CHECK_PRICE_KOBO,
        routeUrl: `/clearance/${requestId}`,
        walletBalanceKobo: updatedWallet.balanceKobo,
        matchedIssueId: confirmedIssue?.id ?? null,
        possibleIssueId: null,
        reviewMessage: searchResult === 'possible_match' ? 'A similar name at the selected school requires direct verification; no issue details are shared.' : null,
      };
    });

    if (result.kind === 'insufficient_funds') {
      return NextResponse.json(
        { ok: false, message: 'Insufficient wallet balance.', balanceKobo: result.balanceKobo, requiredKobo: CHECK_PRICE_KOBO },
        { status: 402 },
      );
    }

    if (result.kind === 'existing') {
      if (result.request.requestFingerprint !== requestFingerprint) {
        return NextResponse.json({ ok: false, message: 'This request key was used for different details. Review your clearance history before starting a new check.' }, { status: 409 });
      }
      return NextResponse.json({
        ok: true,
        idempotent: true,
        requestId: result.request.id,
        status: result.request.status,
        searchResult: result.request.searchResult,
        amountChargedKobo: result.request.amountCharged,
        routeUrl: `/clearance/${result.request.id}`,
        walletBalanceKobo: result.balanceKobo,
        matchedIssueId: null,
        possibleIssueId: null,
        reviewMessage: null,
      });
    }

    return NextResponse.json({
      ok: true,
      requestId: result.requestId,
      status: result.status,
      searchResult: result.searchResult,
      amountChargedKobo: result.amountChargedKobo,
      routeUrl: result.routeUrl,
      walletBalanceKobo: result.walletBalanceKobo,
      matchedIssueId: result.matchedIssueId,
      possibleIssueId: result.possibleIssueId,
      reviewMessage: result.reviewMessage,
    });
  } catch (error) {
    if (error instanceof InsufficientFundsError) {
      return NextResponse.json({ ok: false, message: 'Insufficient wallet balance.', balanceKobo: error.balanceKobo, requiredKobo: CHECK_PRICE_KOBO }, { status: 402 });
    }
    console.error('Clearance start failed.', error);
    return NextResponse.json({ ok: false, message: 'Unable to start clearance request.' }, { status: 500 });
  }
}
