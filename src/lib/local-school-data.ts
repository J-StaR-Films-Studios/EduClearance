import { CHECK_PRICE_KOBO } from '@/lib/money';

export type SchoolUserRole = 'school_owner' | 'school_admin' | 'school_staff';
export type ClearanceResultState = 'no_record' | 'possible_match' | 'match';

export type OutboundClearance = {
  id: string;
  studentName: string;
  parentName: string;
  parentPhone: string;
  previousSchoolName: string;
  previousSchoolPhone?: string;
  previousSchoolEmail?: string;
  previousSchoolListed: boolean;
  gender: string;
  lastClass: string;
  createdAt: string;
  resultLabel: string;
  resultState: ClearanceResultState;
  statusLabel: string;
  searchResult: 'no_match' | 'possible_match' | 'confirmed_match';
  amountChargedKobo: number;
  notificationStatus: 'whatsapp_generated' | 'sent' | 'dashboard' | 'not_sent' | 'failed';
  whatsappMessage: string;
  issue?: {
    reportingSchool: string;
    amountOwedKobo: number;
    category: string;
    sessionTerm: string;
    note: string;
    phone: string;
    whatsappMessage: string;
  };
};

export type InboundRequest = {
  id: string;
  studentName: string;
  requestingSchool: string;
  requestedAt: string;
  status: 'response_needed' | 'resolved';
};

export type WalletTransactionView = {
  id: string;
  createdAt: string;
  reference: string;
  type: 'credit' | 'debit' | 'refund';
  description: string;
  amountKobo: number;
  statusLabel: string;
};

export type ReportedIssueView = {
  id: string;
  studentName: string;
  parentName: string;
  category: string;
  amountOwedKobo: number;
  academicSession: string;
  reportedAt: string;
  status: 'unresolved' | 'under_review' | 'resolved';
  sourceLabel: string;
  note: string;
};

export const NO_RECORD_DISCLAIMER =
  'No unresolved record was found on EduClearance. This does not confirm that the student has cleared the previous school. Please contact the previous school directly or wait for their response.';

export const schoolProfile = {
  name: 'Grace Academy',
  area: 'Ikeja',
  cluster: 'Ikeja Private Schools Cluster',
  status: 'Active',
  walletBalanceKobo: 450_000,
};

export const schoolUser = {
  name: 'Ope Alabi',
  role: 'school_admin' as SchoolUserRole,
};

export const previousSchoolOptions = [
  {
    value: 'springfield-international-school-ikeja',
    label: 'Springfield International School (Ikeja)',
    routeId: 'chinedu-alao',
  },
  {
    value: 'hilltop-preparatory-gbagada',
    label: 'Hilltop Preparatory (Gbagada)',
    routeId: 'aisha-bello',
  },
  {
    value: 'grace-prep-school-garki-abuja',
    label: 'Grace Prep School (Garki Abuja)',
    routeId: 'chinedu-alao',
  },
  {
    value: 'manual',
    label: 'School not listed (Enter manually)',
    routeId: 'chinedu-alao',
  },
] as const;

export const outboundClearances: OutboundClearance[] = [
  {
    id: 'chinedu-alao',
    studentName: 'Chinedu Alao',
    parentName: 'Mrs. Yetunde Alao',
    parentPhone: '+2348031234567',
    previousSchoolName: 'Springfield International School',
    previousSchoolPhone: '+234 803 999 8888',
    previousSchoolEmail: 'clearance@springfield.edu.ng',
    previousSchoolListed: true,
    gender: 'Male',
    lastClass: 'Basic 6',
    createdAt: '2026-06-11',
    resultLabel: 'No Platform Record Found',
    resultState: 'no_record',
    statusLabel: 'No platform record found',
    searchResult: 'no_match',
    amountChargedKobo: CHECK_PRICE_KOBO,
    notificationStatus: 'whatsapp_generated',
    whatsappMessage:
      'Hello Springfield International School, this is the Admitting Office at Grace Academy. We are processing the admission transfer for student Chinedu Alao. Please let us know if there are any outstanding clearances or issues to resolve. Thank you.',
  },
  {
    id: 'aisha-bello',
    studentName: 'Aisha Bello',
    parentName: 'Halima Bello',
    parentPhone: '+2348021112222',
    previousSchoolName: 'Hilltop Preparatory',
    previousSchoolPhone: '+234 802 111 2222',
    previousSchoolEmail: 'clearance@hilltop.edu.ng',
    previousSchoolListed: true,
    gender: 'Female',
    lastClass: 'JSS 3',
    createdAt: '2026-06-09',
    resultLabel: 'Unresolved Balance Reported',
    resultState: 'match',
    statusLabel: 'Outstanding balance reported',
    searchResult: 'confirmed_match',
    amountChargedKobo: CHECK_PRICE_KOBO,
    notificationStatus: 'sent',
    whatsappMessage:
      'Hello Hilltop Preparatory, this is Grace Academy Admissions. We are reviewing the transfer clearance request for Aisha Bello. Kindly confirm the unresolved balance record and share any next steps for resolution. Thank you.',
    issue: {
      reportingSchool: 'Hilltop Preparatory (Gbagada)',
      amountOwedKobo: 4_500_000,
      category: 'Outstanding School Fees',
      sessionTerm: '2025/2026 - 2nd Term',
      note: 'Outstanding balance for tuition and final term exams books. Multiple calls were made to parent; account remains un-settled.',
      phone: '+234 802 111 2222',
      whatsappMessage:
        'Hello Hilltop Preparatory, this is Grace Academy Admissions. We are reviewing the unresolved balance reported for Aisha Bello. Kindly advise on the current status or update the record if it has been settled. Thank you.',
    },
  },
];

export const inboundRequests: InboundRequest[] = [
  {
    id: 'obinna-okafor',
    studentName: 'Obinna Okafor',
    requestingSchool: 'Springfield International',
    requestedAt: 'Today, 10:41',
    status: 'response_needed',
  },
];

export const dashboardStats = {
  outboundChecks: 18,
  inboundRequests: 3,
  openDisputes: 1,
};

export const walletTransactions: WalletTransactionView[] = [
  {
    id: 'tx-1',
    createdAt: '2026-06-11 11:22',
    reference: 'pstk_92a188f',
    type: 'credit',
    description: 'Paystack Wallet Deposit',
    amountKobo: 500_000,
    statusLabel: 'Credit',
  },
  {
    id: 'tx-2',
    createdAt: '2026-06-11 11:42',
    reference: 'ec_tx_901a72',
    type: 'debit',
    description: 'Clearance Check: Chinedu Alao',
    amountKobo: -10_000,
    statusLabel: 'Debit',
  },
  {
    id: 'tx-3',
    createdAt: '2026-06-09 09:15',
    reference: 'ec_tx_7aa211',
    type: 'debit',
    description: 'Clearance Check: Aisha Bello',
    amountKobo: -10_000,
    statusLabel: 'Debit',
  },
];

export const reportedIssues: ReportedIssueView[] = [
  {
    id: 'issue-1',
    studentName: 'Aisha Bello',
    parentName: 'Halima Bello',
    category: 'Outstanding School Fees',
    amountOwedKobo: 4_500_000,
    academicSession: '2025/2026 · 2nd Term',
    reportedAt: '2026-06-09 09:02',
    status: 'unresolved',
    sourceLabel: 'Manual school report',
    note: 'Outstanding tuition and exam materials remain open pending settlement confirmation from the parent.',
  },
  {
    id: 'issue-2',
    studentName: 'Obinna Okafor',
    parentName: 'Mr. and Mrs. Okafor',
    category: 'Books / Learning Materials',
    amountOwedKobo: 120_000,
    academicSession: '2025/2026 · 3rd Term',
    reportedAt: '2026-06-11 10:44',
    status: 'under_review',
    sourceLabel: 'Inbound clearance response',
    note: 'Supporting ledger copy was attached while the school responds to a transfer verification request.',
  },
  {
    id: 'issue-3',
    studentName: 'Tolu Adebayo',
    parentName: 'Mrs. Adebayo',
    category: 'Uniform / Materials',
    amountOwedKobo: 80_000,
    academicSession: '2024/2025 · 3rd Term',
    reportedAt: '2026-05-28 15:18',
    status: 'resolved',
    sourceLabel: 'Manual school report',
    note: 'Record retained for historical context with resolution details available for school-scoped review.',
  },
];

export function resolveSchoolRole(role?: string | string[]) {
  if (role === 'school_owner') {
    return 'school_owner';
  }

  return role === 'school_staff' ? 'school_staff' : 'school_admin';
}

export function withRoleQuery(href: string, role?: SchoolUserRole) {
  void role;
  return href;
}

export function getOutboundClearance(id: string) {
  return outboundClearances.find((clearance) => clearance.id === id);
}

export function getPreviousSchoolSelection(value: string) {
  return previousSchoolOptions.find((option) => option.value === value);
}

export function buildWhatsAppHref(phoneNumber: string, message: string) {
  const normalizedPhone = phoneNumber.replace(/[^\d]/g, '');
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
