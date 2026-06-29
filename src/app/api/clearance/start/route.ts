import { NextResponse } from 'next/server';
import { and, eq, gte, ilike, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { auditLogs, clearanceIssues, clearanceRequests, schools, walletTransactions, wallets } from '@/db/schema';
import { makeEntityId, makeWalletReference } from '@/lib/ids';
import { resolveLocalSchoolActor } from '@/lib/local-actor';
import { CHECK_PRICE_KOBO } from '@/lib/money';
import { normalizePhoneNumber, normalizeSearchText } from '@/lib/text';

const clearanceStartSchema = z.object({
  studentName: z.string().trim().min(1),
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
    return NextResponse.json({ ok: false, message: 'Invalid clearance request payload.', issues: payload.error.flatten() }, { status: 400 });
  }

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip');
  const studentNameNormalized = normalizeSearchText(payload.data.studentName);
  const parentPhoneNormalized = normalizePhoneNumber(payload.data.parentPhone);

  try {
    const result = await db.transaction(async (tx) => {
      const [currentWallet] = await tx
        .select({ id: wallets.id, balanceKobo: wallets.balanceKobo })
        .from(wallets)
        .where(eq(wallets.schoolId, actor.schoolId))
        .limit(1);

      const [updatedWallet] = await tx
        .update(wallets)
        .set({
          balanceKobo: sql`${wallets.balanceKobo} - ${CHECK_PRICE_KOBO}`,
          updatedAt: new Date(),
        })
        .where(and(eq(wallets.schoolId, actor.schoolId), gte(wallets.balanceKobo, CHECK_PRICE_KOBO)))
        .returning({ id: wallets.id, balanceKobo: wallets.balanceKobo });

      if (!updatedWallet) {
        return { kind: 'insufficient_funds' as const, balanceKobo: currentWallet?.balanceKobo ?? 0 };
      }

      const possibleIssues = await tx
        .select({
          id: clearanceIssues.id,
          reportingSchoolId: clearanceIssues.reportingSchoolId,
          parentPhone: clearanceIssues.parentPhone,
        })
        .from(clearanceIssues)
        .where(and(eq(clearanceIssues.status, 'unresolved'), eq(clearanceIssues.studentNameNormalized, studentNameNormalized)))
        .limit(10);

      const confirmedIssue = possibleIssues.find((issue) => normalizePhoneNumber(issue.parentPhone) === parentPhoneNormalized) ?? null;
      const possibleIssue = confirmedIssue ? null : possibleIssues[0] ?? null;
      const issueSchoolId = confirmedIssue?.reportingSchoolId ?? possibleIssue?.reportingSchoolId ?? null;

      const lookupSchoolId = issueSchoolId ?? payload.data.previousSchoolId ?? null;
      const [previousSchool] = lookupSchoolId
        ? await tx
            .select({ id: schools.id, name: schools.name, status: schools.status })
            .from(schools)
            .where(eq(schools.id, lookupSchoolId))
            .limit(1)
        : await tx
            .select({ id: schools.id, name: schools.name, status: schools.status })
            .from(schools)
            .where(ilike(schools.name, `%${payload.data.previousSchoolName}%`))
            .limit(1);

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
      const previousSchoolId = issueSchoolId ?? previousSchool?.id ?? null;

      await tx.insert(clearanceRequests).values({
        id: requestId,
        incomingSchoolId: actor.schoolId,
        previousSchoolId,
        previousSchoolNameSnapshot: previousSchool?.name ?? payload.data.previousSchoolName,
        studentName: payload.data.studentName,
        studentNameNormalized,
        gender: payload.data.gender ?? null,
        lastClass: payload.data.lastClass ?? null,
        parentName: payload.data.parentName,
        parentPhone: payload.data.parentPhone,
        status,
        searchResult,
        amountCharged: CHECK_PRICE_KOBO,
        notificationStatus,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        createdByUserId: actor.userId,
      });

      const linkedIssue = confirmedIssue ?? possibleIssue;

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
        description: `Clearance request for ${payload.data.studentName}`,
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
            possibleIssueCount: possibleIssues.length,
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
        ...(possibleIssue
          ? [
              {
                id: makeEntityId('audit'),
                actorUserId: actor.userId,
                actorSchoolId: actor.schoolId,
                action: 'clearance_possible_issue_linked',
                entityType: 'clearance_issue',
                entityId: possibleIssue.id,
                metadataJson: {
                  clearanceRequestId: requestId,
                  searchResult,
                  status,
                  possibleIssueCount: possibleIssues.length,
                },
                ipAddress,
              },
            ]
          : []),
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
        possibleIssueId: possibleIssue?.id ?? null,
        reviewMessage:
          searchResult === 'possible_match'
            ? 'A same-name unresolved issue needs staff review because parent phone did not match exactly.'
            : null,
      };
    });

    if (result.kind === 'insufficient_funds') {
      return NextResponse.json(
        { ok: false, message: 'Insufficient wallet balance.', balanceKobo: result.balanceKobo, requiredKobo: CHECK_PRICE_KOBO },
        { status: 402 },
      );
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
    console.error('Clearance start failed.', error);
    return NextResponse.json({ ok: false, message: 'Unable to start clearance request.' }, { status: 500 });
  }
}
