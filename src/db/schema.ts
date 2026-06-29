import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const schoolStatusValues = ['unclaimed', 'pending', 'active', 'suspended'] as const;
export const userRoleValues = ['platform_admin', 'school_owner', 'school_admin', 'school_staff'] as const;
export const schoolClaimTypeValues = ['existing_school', 'new_school'] as const;
export const schoolClaimStatusValues = ['pending', 'approved', 'rejected'] as const;
export const clearanceRequestStatusValues = [
  'pending_verification',
  'no_platform_record_found',
  'previous_school_notified',
  'cleared_by_previous_school',
  'outstanding_balance_reported',
  'disputed',
  'no_response',
  'previous_school_not_on_platform',
  'closed',
] as const;
export const searchResultValues = ['no_match', 'possible_match', 'confirmed_match'] as const;
export const notificationStatusValues = ['not_sent', 'dashboard', 'whatsapp_generated', 'sent', 'failed'] as const;
export const issueTypeValues = ['school_fees', 'books', 'uniform', 'transport', 'other'] as const;
export const issueStatusValues = ['unresolved', 'resolved', 'disputed', 'withdrawn'] as const;
export const walletTransactionTypeValues = ['credit', 'debit', 'refund', 'adjustment'] as const;
export const walletTransactionProviderValues = ['paystack', 'manual', 'system'] as const;
export const paymentProviderValues = ['paystack'] as const;
export const paymentStatusValues = ['initialized', 'successful', 'failed', 'abandoned'] as const;
export const disputeStatusValues = ['open', 'under_review', 'resolved', 'rejected'] as const;

export const schoolStatusEnum = pgEnum('school_status', schoolStatusValues);
export const userRoleEnum = pgEnum('user_role', userRoleValues);
export const schoolClaimTypeEnum = pgEnum('school_claim_type', schoolClaimTypeValues);
export const schoolClaimStatusEnum = pgEnum('school_claim_status', schoolClaimStatusValues);
export const clearanceRequestStatusEnum = pgEnum('clearance_request_status', clearanceRequestStatusValues);
export const searchResultEnum = pgEnum('search_result', searchResultValues);
export const notificationStatusEnum = pgEnum('notification_status', notificationStatusValues);
export const issueTypeEnum = pgEnum('issue_type', issueTypeValues);
export const issueStatusEnum = pgEnum('issue_status', issueStatusValues);
export const walletTransactionTypeEnum = pgEnum('wallet_transaction_type', walletTransactionTypeValues);
export const walletTransactionProviderEnum = pgEnum('wallet_transaction_provider', walletTransactionProviderValues);
export const paymentProviderEnum = pgEnum('payment_provider', paymentProviderValues);
export const paymentStatusEnum = pgEnum('payment_status', paymentStatusValues);
export const disputeStatusEnum = pgEnum('dispute_status', disputeStatusValues);

export const schools = pgTable(
  'schools',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    address: text('address'),
    area: text('area'),
    mainPhone: text('main_phone'),
    clearancePhone: text('clearance_phone'),
    contactEmail: text('contact_email'),
    contactPerson: text('contact_person'),
    logoUrl: text('logo_url'),
    status: schoolStatusEnum('status').notNull().default('unclaimed'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex('schools_slug_unique').on(table.slug),
    statusIdx: index('schools_status_idx').on(table.status),
  }),
);

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    schoolId: text('school_id').references(() => schools.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    role: userRoleEnum('role').notNull(),
    passwordHash: text('password_hash').notNull(),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_unique').on(table.email),
    schoolIdx: index('users_school_id_idx').on(table.schoolId),
    roleIdx: index('users_role_idx').on(table.role),
  }),
);

export const schoolClaims = pgTable(
  'school_claims',
  {
    id: text('id').primaryKey(),
    schoolId: text('school_id').references(() => schools.id, { onDelete: 'set null' }),
    requestedSchoolName: text('requested_school_name').notNull(),
    requestedArea: text('requested_area').notNull(),
    requestedAddress: text('requested_address').notNull(),
    applicantUserId: text('applicant_user_id').references(() => users.id, { onDelete: 'set null' }),
    applicantName: text('applicant_name').notNull(),
    applicantEmail: text('applicant_email').notNull(),
    officialContactName: text('official_contact_name').notNull(),
    officialEmail: text('official_email').notNull(),
    officialPhone: text('official_phone').notNull(),
    proofFileName: text('proof_file_name').notNull(),
    proofFileType: text('proof_file_type'),
    proofFileSize: integer('proof_file_size'),
    proofFileDataUrl: text('proof_file_data_url'),
    proofNote: text('proof_note').notNull(),
    type: schoolClaimTypeEnum('type').notNull(),
    status: schoolClaimStatusEnum('status').notNull(),
    adminNote: text('admin_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  },
  (table) => ({
    schoolIdx: index('school_claims_school_id_idx').on(table.schoolId),
    applicantIdx: index('school_claims_applicant_user_id_idx').on(table.applicantUserId),
    statusIdx: index('school_claims_status_idx').on(table.status),
    typeIdx: index('school_claims_type_idx').on(table.type),
  }),
);

export const userSessions = pgTable(
  'user_sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('user_sessions_user_id_idx').on(table.userId),
    tokenHashIdx: uniqueIndex('user_sessions_token_hash_unique').on(table.tokenHash),
    expiresAtIdx: index('user_sessions_expires_at_idx').on(table.expiresAt),
  }),
);

export const clearanceRequests = pgTable(
  'clearance_requests',
  {
    id: text('id').primaryKey(),
    incomingSchoolId: text('incoming_school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    previousSchoolId: text('previous_school_id').references(() => schools.id, { onDelete: 'set null' }),
    previousSchoolNameSnapshot: text('previous_school_name_snapshot').notNull(),
    studentName: text('student_name').notNull(),
    studentNameNormalized: text('student_name_normalized').notNull(),
    gender: text('gender'),
    lastClass: text('last_class'),
    parentName: text('parent_name').notNull(),
    parentPhone: text('parent_phone').notNull(),
    status: clearanceRequestStatusEnum('status').notNull(),
    searchResult: searchResultEnum('search_result').notNull(),
    amountCharged: integer('amount_charged').notNull(),
    notificationStatus: notificationStatusEnum('notification_status').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    incomingSchoolIdx: index('clearance_requests_incoming_school_id_idx').on(table.incomingSchoolId),
    previousSchoolIdx: index('clearance_requests_previous_school_id_idx').on(table.previousSchoolId),
    studentNameIdx: index('clearance_requests_student_name_normalized_idx').on(table.studentNameNormalized),
    statusIdx: index('clearance_requests_status_idx').on(table.status),
  }),
);

export const clearanceIssues = pgTable(
  'clearance_issues',
  {
    id: text('id').primaryKey(),
    clearanceRequestId: text('clearance_request_id').references(() => clearanceRequests.id, {
      onDelete: 'set null',
    }),
    reportingSchoolId: text('reporting_school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    studentName: text('student_name').notNull(),
    studentNameNormalized: text('student_name_normalized').notNull(),
    parentName: text('parent_name').notNull(),
    parentPhone: text('parent_phone').notNull(),
    amountOwed: integer('amount_owed').notNull(),
    issueType: issueTypeEnum('issue_type').notNull(),
    academicSession: text('academic_session').notNull(),
    term: text('term').notNull(),
    note: text('note').notNull(),
    evidenceUrl: text('evidence_url'),
    status: issueStatusEnum('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (table) => ({
    reportingSchoolIdx: index('clearance_issues_reporting_school_id_idx').on(table.reportingSchoolId),
    clearanceRequestIdx: index('clearance_issues_clearance_request_id_idx').on(table.clearanceRequestId),
    studentNameIdx: index('clearance_issues_student_name_normalized_idx').on(table.studentNameNormalized),
    statusIdx: index('clearance_issues_status_idx').on(table.status),
  }),
);

export const wallets = pgTable(
  'wallets',
  {
    id: text('id').primaryKey(),
    schoolId: text('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    balanceKobo: integer('balance_kobo').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    schoolIdx: uniqueIndex('wallets_school_id_unique').on(table.schoolId),
  }),
);

export const walletTransactions = pgTable(
  'wallet_transactions',
  {
    id: text('id').primaryKey(),
    schoolId: text('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    type: walletTransactionTypeEnum('type').notNull(),
    amountKobo: integer('amount_kobo').notNull(),
    description: text('description').notNull(),
    reference: text('reference').notNull(),
    provider: walletTransactionProviderEnum('provider').notNull(),
    createdByUserId: text('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    schoolIdx: index('wallet_transactions_school_id_idx').on(table.schoolId),
    referenceIdx: uniqueIndex('wallet_transactions_reference_unique').on(table.reference),
    typeIdx: index('wallet_transactions_type_idx').on(table.type),
  }),
);

export const payments = pgTable(
  'payments',
  {
    id: text('id').primaryKey(),
    schoolId: text('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    provider: paymentProviderEnum('provider').notNull().default('paystack'),
    providerReference: text('provider_reference').notNull(),
    amountKobo: integer('amount_kobo').notNull(),
    status: paymentStatusEnum('status').notNull(),
    metadataJson: jsonb('metadata_json').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
  },
  (table) => ({
    schoolIdx: index('payments_school_id_idx').on(table.schoolId),
    providerReferenceIdx: uniqueIndex('payments_provider_reference_unique').on(table.providerReference),
    statusIdx: index('payments_status_idx').on(table.status),
  }),
);

export const disputes = pgTable(
  'disputes',
  {
    id: text('id').primaryKey(),
    clearanceRequestId: text('clearance_request_id').references(() => clearanceRequests.id, {
      onDelete: 'set null',
    }),
    clearanceIssueId: text('clearance_issue_id').references(() => clearanceIssues.id, { onDelete: 'set null' }),
    raisedBySchoolId: text('raised_by_school_id').references(() => schools.id, { onDelete: 'set null' }),
    reason: text('reason').notNull(),
    status: disputeStatusEnum('status').notNull(),
    adminNote: text('admin_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (table) => ({
    clearanceRequestIdx: index('disputes_clearance_request_id_idx').on(table.clearanceRequestId),
    clearanceIssueIdx: index('disputes_clearance_issue_id_idx').on(table.clearanceIssueId),
    raisedBySchoolIdx: index('disputes_raised_by_school_id_idx').on(table.raisedBySchoolId),
    statusIdx: index('disputes_status_idx').on(table.status),
  }),
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: text('id').primaryKey(),
    actorUserId: text('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    actorSchoolId: text('actor_school_id').references(() => schools.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    metadataJson: jsonb('metadata_json').notNull(),
    ipAddress: text('ip_address'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    actorUserIdx: index('audit_logs_actor_user_id_idx').on(table.actorUserId),
    actorSchoolIdx: index('audit_logs_actor_school_id_idx').on(table.actorSchoolId),
    entityIdx: index('audit_logs_entity_idx').on(table.entityType, table.entityId),
    actionIdx: index('audit_logs_action_idx').on(table.action),
  }),
);
