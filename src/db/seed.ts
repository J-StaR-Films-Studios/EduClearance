import { randomUUID } from 'node:crypto';

import { config as loadEnv } from 'dotenv';
import { sql } from 'drizzle-orm';

import { auditLogs, clearanceIssues, clearanceRequests, disputes, payments, schools, users, walletTransactions, wallets } from './schema';
import { normalizeSearchText } from '@/lib/text';
import { PROMOTIONAL_WALLET_KOBO } from '@/lib/money';

loadEnv({ path: '.env.local' });
loadEnv();

const makeId = () => randomUUID();

async function seed() {
  const { connection, db } = await import('./client');

  try {
    await db.transaction(async (tx) => {
    await tx.execute(sql`
      TRUNCATE TABLE
        "audit_logs",
        "disputes",
        "payments",
        "wallet_transactions",
        "wallets",
        "clearance_issues",
        "clearance_requests",
        "users",
        "schools"
      RESTART IDENTITY CASCADE
    `);

    const riverbendSchoolId = makeId();
    const summitSchoolId = makeId();
    const bluegateSchoolId = makeId();
    const meadowcrestSchoolId = makeId();

    const riverbendOwnerId = makeId();
    const summitOwnerId = makeId();
    const bluegateStaffId = makeId();
    const platformAdminUserId = makeId();

    await tx.insert(schools).values([
      {
        id: riverbendSchoolId,
        name: 'Riverbend Academy',
        slug: 'riverbend-academy',
        address: '12 Harmony Way, Ikeja, Lagos',
        area: 'Ikeja',
        mainPhone: '+2348012340001',
        clearancePhone: '+2348012340002',
        contactEmail: 'clearance@riverbend.example',
        contactPerson: 'Mrs. Adaeze Ibe',
        logoUrl: null,
        status: 'active',
      },
      {
        id: summitSchoolId,
        name: 'Summit Hills College',
        slug: 'summit-hills-college',
        address: '44 Crest Avenue, Wuse II, Abuja',
        area: 'Wuse II',
        mainPhone: '+2348012340011',
        clearancePhone: '+2348012340012',
        contactEmail: 'records@summithills.example',
        contactPerson: 'Mr. Emeka Nwosu',
        logoUrl: null,
        status: 'active',
      },
      {
        id: bluegateSchoolId,
        name: 'Bluegate Preparatory School',
        slug: 'bluegate-preparatory-school',
        address: '8 Orchid Close, Surulere, Lagos',
        area: 'Surulere',
        mainPhone: '+2348012340021',
        clearancePhone: '+2348012340022',
        contactEmail: 'clearance@bluegate.example',
        contactPerson: 'Ms. Zainab Yusuf',
        logoUrl: null,
        status: 'pending',
      },
      {
        id: meadowcrestSchoolId,
        name: 'Meadowcrest Secondary School',
        slug: 'meadowcrest-secondary-school',
        address: '21 Garden Road, Asokoro, Abuja',
        area: 'Asokoro',
        mainPhone: '+2348012340031',
        clearancePhone: '+2348012340032',
        contactEmail: 'office@meadowcrest.example',
        contactPerson: 'Dr. Kemi Balogun',
        logoUrl: null,
        status: 'suspended',
      },
    ]);

    await tx.insert(users).values([
      {
        id: platformAdminUserId,
        schoolId: null,
        name: 'Amina Bello',
        email: 'admin@educlearance.demo',
        phone: '+2348090000001',
        role: 'platform_admin',
      },
      {
        id: riverbendOwnerId,
        schoolId: riverbendSchoolId,
        name: 'Tunde Adeyemi',
        email: 'owner@riverbend.example',
        phone: '+2348090000011',
        role: 'school_owner',
      },
      {
        id: summitOwnerId,
        schoolId: summitSchoolId,
        name: 'Zainab Musa',
        email: 'owner@summithills.example',
        phone: '+2348090000021',
        role: 'school_owner',
      },
      {
        id: bluegateStaffId,
        schoolId: bluegateSchoolId,
        name: 'Grace Okafor',
        email: 'staff@bluegate.example',
        phone: '+2348090000031',
        role: 'school_staff',
      },
    ]);

    await tx.insert(wallets).values([
      {
        id: makeId(),
        schoolId: riverbendSchoolId,
        balanceKobo: 490_000,
      },
      {
        id: makeId(),
        schoolId: summitSchoolId,
        balanceKobo: 320_000,
      },
      {
        id: makeId(),
        schoolId: bluegateSchoolId,
        balanceKobo: PROMOTIONAL_WALLET_KOBO,
      },
      {
        id: makeId(),
        schoolId: meadowcrestSchoolId,
        balanceKobo: 0,
      },
    ]);

    await tx.insert(walletTransactions).values([
      {
        id: makeId(),
        schoolId: riverbendSchoolId,
        type: 'credit',
        amountKobo: 500_000,
        description: 'Promotional wallet top-up for demo onboarding',
        reference: 'seed-credit-riverbend-001',
        provider: 'manual',
        createdByUserId: platformAdminUserId,
      },
      {
        id: makeId(),
        schoolId: riverbendSchoolId,
        type: 'debit',
        amountKobo: 10_000,
        description: 'Clearance request for Ibrahim Sani',
        reference: 'seed-debit-riverbend-001',
        provider: 'system',
        createdByUserId: riverbendOwnerId,
      },
      {
        id: makeId(),
        schoolId: summitSchoolId,
        type: 'credit',
        amountKobo: 400_000,
        description: 'Paystack wallet top-up for demo',
        reference: 'seed-credit-summit-001',
        provider: 'paystack',
        createdByUserId: summitOwnerId,
      },
      {
        id: makeId(),
        schoolId: summitSchoolId,
        type: 'debit',
        amountKobo: 10_000,
        description: 'Clearance request for Aisha Bello',
        reference: 'seed-debit-summit-001',
        provider: 'system',
        createdByUserId: summitOwnerId,
      },
    ]);

    await tx.insert(payments).values([
      {
        id: makeId(),
        schoolId: riverbendSchoolId,
        provider: 'paystack',
        providerReference: 'PSK-DEMO-0001',
        amountKobo: 500_000,
        status: 'successful',
        metadataJson: {
          channel: 'card',
          note: 'Demo payment for local school cluster pitch',
        },
        verifiedAt: new Date(),
      },
      {
        id: makeId(),
        schoolId: summitSchoolId,
        provider: 'paystack',
        providerReference: 'PSK-DEMO-0002',
        amountKobo: 400_000,
        status: 'successful',
        metadataJson: {
          channel: 'bank_transfer',
          note: 'Demo payment for wallet top-up verification',
        },
        verifiedAt: new Date(),
      },
    ]);

    const noRecordRequestId = makeId();
    const matchRequestId = makeId();
    const disputeId = makeId();

    await tx.insert(clearanceRequests).values([
      {
        id: noRecordRequestId,
        incomingSchoolId: riverbendSchoolId,
        previousSchoolId: null,
        previousSchoolNameSnapshot: 'Northstar Grammar School',
        studentName: 'Ibrahim Sani',
        studentNameNormalized: normalizeSearchText('Ibrahim Sani'),
        gender: 'Male',
        lastClass: 'SSS 2',
        parentName: 'Musa Sani',
        parentPhone: '+2348091110001',
        status: 'no_platform_record_found',
        searchResult: 'no_match',
        amountCharged: 10_000,
        notificationStatus: 'whatsapp_generated',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        createdByUserId: riverbendOwnerId,
      },
      {
        id: matchRequestId,
        incomingSchoolId: summitSchoolId,
        previousSchoolId: bluegateSchoolId,
        previousSchoolNameSnapshot: 'Bluegate Preparatory School',
        studentName: 'Aisha Bello',
        studentNameNormalized: normalizeSearchText('Aisha Bello'),
        gender: 'Female',
        lastClass: 'JSS 3',
        parentName: 'Halima Bello',
        parentPhone: '+2348091110002',
        status: 'outstanding_balance_reported',
        searchResult: 'confirmed_match',
        amountCharged: 10_000,
        notificationStatus: 'sent',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        createdByUserId: summitOwnerId,
      },
    ]);

    const issueId = makeId();

    await tx.insert(clearanceIssues).values([
      {
        id: issueId,
        clearanceRequestId: matchRequestId,
        reportingSchoolId: bluegateSchoolId,
        studentName: 'Aisha Bello',
        studentNameNormalized: normalizeSearchText('Aisha Bello'),
        parentName: 'Halima Bello',
        parentPhone: '+2348091110002',
        amountOwed: 45_000,
        issueType: 'school_fees',
        academicSession: '2025/2026',
        term: '2nd Term',
        note: 'Outstanding balance for tuition and books.',
        evidenceUrl: null,
        status: 'unresolved',
      },
    ]);

    await tx.insert(disputes).values([
      {
        id: disputeId,
        clearanceRequestId: matchRequestId,
        clearanceIssueId: issueId,
        raisedBySchoolId: summitSchoolId,
        reason: 'Amount in report does not match our receipt archive.',
        status: 'under_review',
        adminNote: 'Awaiting document comparison and school confirmation.',
        resolvedAt: null,
      },
    ]);

    await tx.insert(auditLogs).values([
      {
        id: makeId(),
        actorUserId: platformAdminUserId,
        actorSchoolId: null,
        action: 'seed_demo_schools',
        entityType: 'school',
        entityId: riverbendSchoolId,
        metadataJson: { status: 'active' },
        ipAddress: null,
      },
      {
        id: makeId(),
        actorUserId: riverbendOwnerId,
        actorSchoolId: riverbendSchoolId,
        action: 'seed_demo_clearance_request',
        entityType: 'clearance_request',
        entityId: noRecordRequestId,
        metadataJson: { searchResult: 'no_match' },
        ipAddress: null,
      },
      {
        id: makeId(),
        actorUserId: summitOwnerId,
        actorSchoolId: summitSchoolId,
        action: 'seed_demo_dispute',
        entityType: 'dispute',
        entityId: disputeId,
        metadataJson: { status: 'under_review' },
        ipAddress: null,
      },
    ]);
    });
  } finally {
    await connection.end();
  }
}

seed()
  .then(() => {
    console.log('Seed complete.');
  })
  .catch((error) => {
    console.error('Seed failed.');
    console.error(error);
    process.exitCode = 1;
  });
