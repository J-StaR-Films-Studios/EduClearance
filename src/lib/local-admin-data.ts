export type AdminNavKey = 'overview' | 'schools' | 'clearance' | 'disputes';

export type AdminMetric = {
  label: string;
  value: string;
  tone?: 'default' | 'warning' | 'danger';
};

export type SuspiciousAlert = {
  id: string;
  type: 'Velocity Alert' | 'Data Alert' | 'Billing Alert';
  tone: 'danger' | 'warning';
  title: string;
  detail: string;
};

export type AdminClaimSchool = {
  id: string;
  name: string;
  lga: string;
  claimantName: string;
  claimantEmail: string;
  phone: string;
  documentName: string;
  status: 'pending' | 'active' | 'suspended';
  claimType: 'existing_directory_profile' | 'new_registration';
  submittedAt: string;
  officialContact: string;
  contactEmail: string;
  contactPerson: string;
  adminNote: string;
};

export type AdminClearanceRecord = {
  id: string;
  studentName: string;
  admittingSchool: string;
  previousSchool: string;
  status: 'no_record' | 'owed_balance' | 'disputed' | 'no_response';
  issueCount: number;
  chargedNaira: number;
  checkedAt: string;
};

export type AdminIssueSummary = {
  id: string;
  studentName: string;
  reportingSchool: string;
  amountLabel: string;
  status: 'unresolved' | 'disputed' | 'resolved';
  updatedAt: string;
};

export type WalletWatchSchool = {
  id: string;
  schoolName: string;
  balanceLabel: string;
  hint: string;
};

export type AdminDisputeRecord = {
  id: string;
  studentName: string;
  amountLabel: string;
  raisedBySchool: string;
  reportingSchool: string;
  status: 'under_review' | 'resolved' | 'rejected';
  raisedAt: string;
  reason: string;
  adminNote: string;
  refundReady: boolean;
};

export const adminOverviewMetrics: AdminMetric[] = [
  { label: 'Total Active Schools', value: '142' },
  { label: 'Pending school approvals', value: '8', tone: 'warning' },
  { label: 'Disputes Under Review', value: '3', tone: 'danger' },
  { label: 'Total Checks Run', value: '4,912' },
];

export const suspiciousAlerts: SuspiciousAlert[] = [
  {
    id: 'alert-1',
    type: 'Velocity Alert',
    tone: 'danger',
    title: 'Excel College ran 12 clearance requests in 5 minutes',
    detail: '2026-06-11 13:12:05 — Search parameters match a duplicate admission desk pattern and should be reviewed.',
  },
  {
    id: 'alert-2',
    type: 'Data Alert',
    tone: 'warning',
    title: 'Grace Academy reported 5 issues for the same parent phone within 10 minutes',
    detail: '2026-06-11 11:05:42 — Check spelling variations and confirm that reports are not duplicate ledger entries.',
  },
  {
    id: 'alert-3',
    type: 'Billing Alert',
    tone: 'warning',
    title: 'Two schools are below ₦500 in wallet balance during active admissions week',
    detail: 'Operational hint — consider manual credit support only after confirming offline payments or approved refunds.',
  },
];

export const adminClaimSchools: AdminClaimSchool[] = [
  {
    id: 'school-brightway',
    name: 'Brightway College',
    lga: 'Alimosho LGA, Lagos State',
    claimantName: 'Pastor Joshua Alabi',
    claimantEmail: 'joshua@brightway.edu.ng',
    phone: '+234 803 123 4567',
    documentName: 'brightway_moe_license.pdf',
    status: 'pending',
    claimType: 'existing_directory_profile',
    submittedAt: '1 hour ago',
    officialContact: '+234 803 123 4567',
    contactEmail: 'clearance@brightway.edu.ng',
    contactPerson: 'Pastor Joshua Alabi',
    adminNote: 'Claimed existing directory profile. CAC and ministry license uploaded for review.',
  },
  {
    id: 'school-grace',
    name: 'Grace Academy',
    lga: 'Ikeja LGA, Lagos State',
    claimantName: 'Ope Alabi',
    claimantEmail: 'ope@graceacademy.edu.ng',
    phone: '+234 802 100 2000',
    documentName: 'grace_clearance_contact_update.pdf',
    status: 'active',
    claimType: 'existing_directory_profile',
    submittedAt: 'Approved 2 days ago',
    officialContact: '+234 802 100 2000',
    contactEmail: 'clearance@graceacademy.edu.ng',
    contactPerson: 'Mrs. Ope Alabi',
    adminNote: 'Active network member. Wallet funded and owner account verified.',
  },
  {
    id: 'school-meadowcrest',
    name: 'Meadowcrest Secondary School',
    lga: 'Asokoro, Abuja',
    claimantName: 'Dr. Kemi Balogun',
    claimantEmail: 'office@meadowcrest.edu.ng',
    phone: '+234 809 456 7000',
    documentName: 'meadowcrest_reactivation_request.pdf',
    status: 'suspended',
    claimType: 'new_registration',
    submittedAt: 'Suspended last week',
    officialContact: '+234 809 456 7000',
    contactEmail: 'records@meadowcrest.edu.ng',
    contactPerson: 'Dr. Kemi Balogun',
    adminNote: 'Suspended pending duplicate issue review and bulk search investigation.',
  },
];

export const recentIssueSummaries: AdminIssueSummary[] = [
  {
    id: 'issue-1',
    studentName: 'Aisha Bello',
    reportingSchool: 'Hilltop Preparatory',
    amountLabel: '₦45,000',
    status: 'disputed',
    updatedAt: 'Today, 12:45',
  },
  {
    id: 'issue-2',
    studentName: 'Daniel Okoro',
    reportingSchool: 'Springfield International',
    amountLabel: '₦18,500',
    status: 'unresolved',
    updatedAt: 'Today, 09:10',
  },
  {
    id: 'issue-3',
    studentName: 'Blessing Nnamdi',
    reportingSchool: 'Excel College',
    amountLabel: 'Resolved',
    status: 'resolved',
    updatedAt: 'Yesterday',
  },
];

export const adminClearanceRecords: AdminClearanceRecord[] = [
  {
    id: 'clearance-1',
    studentName: 'Chinedu Alao',
    admittingSchool: 'Grace Academy',
    previousSchool: 'Springfield International',
    status: 'no_record',
    issueCount: 0,
    chargedNaira: 100,
    checkedAt: '2026-06-11',
  },
  {
    id: 'clearance-2',
    studentName: 'Aisha Bello',
    admittingSchool: 'Grace Academy',
    previousSchool: 'Hilltop Preparatory',
    status: 'owed_balance',
    issueCount: 1,
    chargedNaira: 100,
    checkedAt: '2026-06-09',
  },
  {
    id: 'clearance-3',
    studentName: 'Obinna Okafor',
    admittingSchool: 'Springfield International',
    previousSchool: 'Grace Academy',
    status: 'no_response',
    issueCount: 0,
    chargedNaira: 100,
    checkedAt: '2026-06-11',
  },
  {
    id: 'clearance-4',
    studentName: 'Daniel Okoro',
    admittingSchool: 'Riverbend Academy',
    previousSchool: 'Bluegate Preparatory School',
    status: 'disputed',
    issueCount: 1,
    chargedNaira: 100,
    checkedAt: '2026-06-08',
  },
];

export const walletWatchSchools: WalletWatchSchool[] = [
  {
    id: 'wallet-1',
    schoolName: 'Grace Academy (Ikeja)',
    balanceLabel: '₦4,500',
    hint: '45 checks left. Healthy operating balance.',
  },
  {
    id: 'wallet-2',
    schoolName: 'Brightway College (Alimosho)',
    balanceLabel: '₦0',
    hint: 'Pending approval. Do not credit until claim is approved.',
  },
  {
    id: 'wallet-3',
    schoolName: 'Excel College (Mushin)',
    balanceLabel: '₦300',
    hint: 'Operational watchlist. Confirm offline payment before manual credit.',
  },
];

export const adminDisputes: AdminDisputeRecord[] = [
  {
    id: 'dispute-1',
    studentName: 'Aisha Bello',
    amountLabel: '₦45,000 Owed',
    raisedBySchool: 'Grace Academy',
    reportingSchool: 'Hilltop Preparatory',
    status: 'under_review',
    raisedAt: '2026-06-11 12:45',
    reason: 'Parent has presented receipt number #4492 showing that tuition was paid in full on April 12th. Reporting school ledger may be out of date.',
    adminNote: 'Awaiting scanned receipt comparison and confirmation from the reporting school bursar.',
    refundReady: true,
  },
  {
    id: 'dispute-2',
    studentName: 'Daniel Okoro',
    amountLabel: '₦18,500 Owed',
    raisedBySchool: 'Riverbend Academy',
    reportingSchool: 'Bluegate Preparatory School',
    status: 'resolved',
    raisedAt: '2026-06-10 08:20',
    reason: 'Duplicate report was created after a name spelling correction. One record has already been settled.',
    adminNote: 'Original record withdrawn. Duplicate marked resolved and school notified.',
    refundReady: false,
  },
];

export function adminHref(path: '/admin' | '/admin/schools' | '/admin/clearance' | '/admin/disputes' | '/admin/wallets' | '/admin/issues') {
  return path;
}
