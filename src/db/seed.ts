import { randomUUID } from 'node:crypto';

import { config as loadEnv } from 'dotenv';
import { sql } from 'drizzle-orm';

import { auditLogs, clearanceIssues, clearanceRequests, disputes, payments, schools, users, walletTransactions, wallets } from './schema';
import { normalizeSearchText } from '@/lib/text';
import { PROMOTIONAL_WALLET_KOBO } from '@/lib/money';

loadEnv({ path: '.env.local' });
loadEnv();

const makeId = () => randomUUID();
const verificationEmail = (slug: string) => `verification+${slug}@educlearance.local`;

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

      const wuseLocalSchoolId = makeId();
      const garkiLocalSchoolId = makeId();
      const lugbeLocalSchoolId = makeId();
      const americanInternationalAbujaId = makeId();
      const loyolaJesuitCollegeId = makeId();
      const regentSchoolId = makeId();
      const capitalScienceAcademyId = makeId();
      const leadBritishInternationalSchoolId = makeId();
      const whiteplainsBritishSchoolId = makeId();
      const glistenInternationalAcademyId = makeId();
      const premierInternationalSchoolId = makeId();

      const platformAdminUserId = makeId();
      const wuseOwnerId = makeId();
      const wuseAdminId = makeId();
      const wuseStaffId = makeId();
      const garkiOwnerId = makeId();
      const lugbeStaffId = makeId();

      await tx.insert(schools).values([
        {
          id: wuseLocalSchoolId,
          name: 'Wuse Local Academy',
          slug: 'wuse-local-academy',
          address: 'Local development record, Wuse II, Abuja',
          area: 'Wuse II',
          mainPhone: '+2348000000101',
          clearancePhone: '+2348000000102',
          contactEmail: 'clearance+wuse-local-academy@educlearance.local',
          contactPerson: 'Local Admissions Operator',
          logoUrl: null,
          status: 'active',
        },
        {
          id: garkiLocalSchoolId,
          name: 'Garki Local College',
          slug: 'garki-local-college',
          address: 'Local development record, Garki II, Abuja',
          area: 'Garki II',
          mainPhone: '+2348000000201',
          clearancePhone: '+2348000000202',
          contactEmail: 'clearance+garki-local-college@educlearance.local',
          contactPerson: 'Local Records Operator',
          logoUrl: null,
          status: 'active',
        },
        {
          id: lugbeLocalSchoolId,
          name: 'Lugbe Local Preparatory School',
          slug: 'lugbe-local-preparatory-school',
          address: 'Local onboarding record, Lugbe, Abuja',
          area: 'Lugbe',
          mainPhone: '+2348000000301',
          clearancePhone: '+2348000000302',
          contactEmail: 'verification+lugbe-local-preparatory-school@educlearance.local',
          contactPerson: 'Verification Pending',
          logoUrl: null,
          status: 'pending',
        },
        {
          id: americanInternationalAbujaId,
          name: 'American International School of Abuja',
          slug: 'american-international-school-of-abuja',
          address: 'Area hint: Durumi, Abuja; operator must verify exact campus address before activation',
          area: 'Durumi',
          mainPhone: null,
          clearancePhone: null,
          contactEmail: verificationEmail('american-international-school-of-abuja'),
          contactPerson: null,
          logoUrl: null,
          status: 'unclaimed',
        },
        {
          id: loyolaJesuitCollegeId,
          name: 'Loyola Jesuit College',
          slug: 'loyola-jesuit-college-abuja',
          address: 'Area hint: Gidan Mangoro / Abuja-Keffi Road corridor; operator must verify exact campus address before activation',
          area: 'Gidan Mangoro',
          mainPhone: null,
          clearancePhone: null,
          contactEmail: verificationEmail('loyola-jesuit-college-abuja'),
          contactPerson: null,
          logoUrl: null,
          status: 'unclaimed',
        },
        {
          id: regentSchoolId,
          name: 'The Regent School',
          slug: 'the-regent-school-abuja',
          address: 'Area hint: Maitama, Abuja; operator must verify exact campus address before activation',
          area: 'Maitama',
          mainPhone: null,
          clearancePhone: null,
          contactEmail: verificationEmail('the-regent-school-abuja'),
          contactPerson: null,
          logoUrl: null,
          status: 'unclaimed',
        },
        {
          id: capitalScienceAcademyId,
          name: 'Capital Science Academy',
          slug: 'capital-science-academy-abuja',
          address: 'Area hint: Kuje, Abuja; operator must verify exact campus address before activation',
          area: 'Kuje',
          mainPhone: null,
          clearancePhone: null,
          contactEmail: verificationEmail('capital-science-academy-abuja'),
          contactPerson: null,
          logoUrl: null,
          status: 'unclaimed',
        },
        {
          id: leadBritishInternationalSchoolId,
          name: 'Lead British International School',
          slug: 'lead-british-international-school-abuja',
          address: 'Area hint: Gwarinpa, Abuja; operator must verify exact campus address before activation',
          area: 'Gwarinpa',
          mainPhone: null,
          clearancePhone: null,
          contactEmail: verificationEmail('lead-british-international-school-abuja'),
          contactPerson: null,
          logoUrl: null,
          status: 'unclaimed',
        },
        {
          id: whiteplainsBritishSchoolId,
          name: 'Whiteplains British School',
          slug: 'whiteplains-british-school-abuja',
          address: 'Area hint: Jabi, Abuja; operator must verify exact campus address and ownership claim before activation',
          area: 'Jabi',
          mainPhone: null,
          clearancePhone: null,
          contactEmail: verificationEmail('whiteplains-british-school-abuja'),
          contactPerson: null,
          logoUrl: null,
          status: 'pending',
        },
        {
          id: glistenInternationalAcademyId,
          name: 'Glisten International Academy',
          slug: 'glisten-international-academy-abuja',
          address: 'Area hint: Jahi, Abuja; operator must verify exact campus address before activation',
          area: 'Jahi',
          mainPhone: null,
          clearancePhone: null,
          contactEmail: verificationEmail('glisten-international-academy-abuja'),
          contactPerson: null,
          logoUrl: null,
          status: 'unclaimed',
        },
        {
          id: premierInternationalSchoolId,
          name: 'Premier International School',
          slug: 'premier-international-school-abuja',
          address: 'Area hint: Wuse II, Abuja; operator must verify exact campus address before activation',
          area: 'Wuse II',
          mainPhone: null,
          clearancePhone: null,
          contactEmail: verificationEmail('premier-international-school-abuja'),
          contactPerson: null,
          logoUrl: null,
          status: 'unclaimed',
        },
      ]);

      await tx.insert(users).values([
        {
          id: platformAdminUserId,
          schoolId: null,
          name: 'Amina Bello',
          email: 'admin@educlearance.local',
          phone: '+2348000000001',
          role: 'platform_admin',
        },
        {
          id: wuseOwnerId,
          schoolId: wuseLocalSchoolId,
          name: 'Tunde Adeyemi',
          email: 'owner+wuse-local-academy@educlearance.local',
          phone: '+2348000000111',
          role: 'school_owner',
        },
        {
          id: wuseAdminId,
          schoolId: wuseLocalSchoolId,
          name: 'Ope Alabi',
          email: 'admin+wuse-local-academy@educlearance.local',
          phone: '+2348000000112',
          role: 'school_admin',
        },
        {
          id: wuseStaffId,
          schoolId: wuseLocalSchoolId,
          name: 'Grace Okafor',
          email: 'staff+wuse-local-academy@educlearance.local',
          phone: '+2348000000113',
          role: 'school_staff',
        },
        {
          id: garkiOwnerId,
          schoolId: garkiLocalSchoolId,
          name: 'Zainab Musa',
          email: 'owner+garki-local-college@educlearance.local',
          phone: '+2348000000211',
          role: 'school_owner',
        },
        {
          id: lugbeStaffId,
          schoolId: lugbeLocalSchoolId,
          name: 'Chika Nwosu',
          email: 'verification+lugbe-local-preparatory-school@educlearance.local',
          phone: '+2348000000311',
          role: 'school_staff',
        },
      ]);

      await tx.insert(wallets).values([
        {
          id: makeId(),
          schoolId: wuseLocalSchoolId,
          balanceKobo: 490_000,
        },
        {
          id: makeId(),
          schoolId: garkiLocalSchoolId,
          balanceKobo: PROMOTIONAL_WALLET_KOBO - 10_000,
        },
        {
          id: makeId(),
          schoolId: lugbeLocalSchoolId,
          balanceKobo: 0,
        },
      ]);

      await tx.insert(walletTransactions).values([
        {
          id: makeId(),
          schoolId: wuseLocalSchoolId,
          type: 'credit',
          amountKobo: 500_000,
          description: 'Local onboarding wallet top-up for Wuse Local Academy',
          reference: 'local-wallet-credit-wuse-001',
          provider: 'manual',
          createdByUserId: platformAdminUserId,
        },
        {
          id: makeId(),
          schoolId: wuseLocalSchoolId,
          type: 'debit',
          amountKobo: 10_000,
          description: 'Clearance request for Ibrahim Sani',
          reference: 'local-clearance-debit-wuse-001',
          provider: 'system',
          createdByUserId: wuseAdminId,
        },
        {
          id: makeId(),
          schoolId: garkiLocalSchoolId,
          type: 'credit',
          amountKobo: PROMOTIONAL_WALLET_KOBO,
          description: 'Local onboarding wallet top-up for Garki Local College',
          reference: 'local-wallet-credit-garki-001',
          provider: 'paystack',
          createdByUserId: garkiOwnerId,
        },
        {
          id: makeId(),
          schoolId: garkiLocalSchoolId,
          type: 'debit',
          amountKobo: 10_000,
          description: 'Clearance request for Aisha Bello',
          reference: 'local-clearance-debit-garki-001',
          provider: 'system',
          createdByUserId: garkiOwnerId,
        },
      ]);

      await tx.insert(payments).values([
        {
          id: makeId(),
          schoolId: wuseLocalSchoolId,
          provider: 'paystack',
          providerReference: 'PSK-LOCAL-SEED-WUSE-0001',
          amountKobo: 500_000,
          status: 'successful',
          metadataJson: {
            channel: 'card',
            note: 'Local payment record for wallet top-up verification',
          },
          verifiedAt: new Date(),
        },
        {
          id: makeId(),
          schoolId: garkiLocalSchoolId,
          provider: 'paystack',
          providerReference: 'PSK-LOCAL-SEED-GARKI-0001',
          amountKobo: PROMOTIONAL_WALLET_KOBO,
          status: 'successful',
          metadataJson: {
            channel: 'bank_transfer',
            note: 'Local payment record for school onboarding verification',
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
          incomingSchoolId: wuseLocalSchoolId,
          previousSchoolId: americanInternationalAbujaId,
          previousSchoolNameSnapshot: 'American International School of Abuja',
          studentName: 'Ibrahim Sani',
          studentNameNormalized: normalizeSearchText('Ibrahim Sani'),
          gender: 'Male',
          lastClass: 'SSS 2',
          parentName: 'Musa Sani',
          parentPhone: '+2348000010001',
          status: 'no_platform_record_found',
          searchResult: 'no_match',
          amountCharged: 10_000,
          notificationStatus: 'whatsapp_generated',
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          createdByUserId: wuseAdminId,
        },
        {
          id: matchRequestId,
          incomingSchoolId: garkiLocalSchoolId,
          previousSchoolId: wuseLocalSchoolId,
          previousSchoolNameSnapshot: 'Wuse Local Academy',
          studentName: 'Aisha Bello',
          studentNameNormalized: normalizeSearchText('Aisha Bello'),
          gender: 'Female',
          lastClass: 'JSS 3',
          parentName: 'Halima Bello',
          parentPhone: '+2348000010002',
          status: 'outstanding_balance_reported',
          searchResult: 'confirmed_match',
          amountCharged: 10_000,
          notificationStatus: 'dashboard',
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          createdByUserId: garkiOwnerId,
        },
      ]);

      const issueId = makeId();

      await tx.insert(clearanceIssues).values([
        {
          id: issueId,
          clearanceRequestId: matchRequestId,
          reportingSchoolId: wuseLocalSchoolId,
          studentName: 'Aisha Bello',
          studentNameNormalized: normalizeSearchText('Aisha Bello'),
          parentName: 'Halima Bello',
          parentPhone: '+2348000010002',
          amountOwed: 45_000,
          issueType: 'school_fees',
          academicSession: '2025/2026',
          term: '2nd Term',
          note: 'Outstanding balance for tuition and books in the local verification workflow.',
          evidenceUrl: null,
          status: 'unresolved',
        },
      ]);

      await tx.insert(disputes).values([
        {
          id: disputeId,
          clearanceRequestId: matchRequestId,
          clearanceIssueId: issueId,
          raisedBySchoolId: garkiLocalSchoolId,
          reason: 'Amount in report does not match the admitting school receipt archive.',
          status: 'under_review',
          adminNote: 'Awaiting document comparison and reporting school confirmation.',
          resolvedAt: null,
        },
      ]);

      await tx.insert(auditLogs).values([
        {
          id: makeId(),
          actorUserId: platformAdminUserId,
          actorSchoolId: null,
          action: 'local_seed_schools_prepared',
          entityType: 'school',
          entityId: wuseLocalSchoolId,
          metadataJson: { status: 'active', area: 'Wuse II' },
          ipAddress: null,
        },
        {
          id: makeId(),
          actorUserId: platformAdminUserId,
          actorSchoolId: null,
          action: 'local_seed_directory_candidate_added',
          entityType: 'school',
          entityId: americanInternationalAbujaId,
          metadataJson: { status: 'unclaimed', area: 'Durumi', verificationRequired: true },
          ipAddress: null,
        },
        {
          id: makeId(),
          actorUserId: wuseAdminId,
          actorSchoolId: wuseLocalSchoolId,
          action: 'local_seed_clearance_request_created',
          entityType: 'clearance_request',
          entityId: noRecordRequestId,
          metadataJson: { searchResult: 'no_match' },
          ipAddress: null,
        },
        {
          id: makeId(),
          actorUserId: garkiOwnerId,
          actorSchoolId: garkiLocalSchoolId,
          action: 'local_seed_dispute_created',
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
