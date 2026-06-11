from pathlib import Path
import re

prd = Path('docs/Project_Requirements.md').read_text(encoding='utf-8')
rows = re.findall(r'\| (FR-\d{3}) \| (.*?) \| (.*?) \| (MUS|Future) \|', prd)
issue_dir = Path('docs/issues')
issue_dir.mkdir(parents=True, exist_ok=True)

focus = {
    'FR-001': ('Landing Page Positioning', 'marketing, onboarding', 'Build official, mobile-first positioning with pricing, privacy framing, and claim/register CTA.', 'Hero, problem, how it works, pricing, trust/safety, CTA.'),
    'FR-002': ('School Directory', 'schools, admin', 'Seed and manage local school profiles before onboarding.', 'Admin creates/searches schools; claim flow selects unclaimed school.'),
    'FR-003': ('School Claim Registration', 'onboarding, auth', 'Let school owners request access to a listed or new school profile.', 'Submit claim, create pending user/school, show awaiting approval.'),
    'FR-004': ('Authentication and RBAC', 'auth, security', 'Protect platform and school areas with server-enforced roles.', 'Login/logout, protected layouts, route/server-action guards.'),
    'FR-005': ('Admin School Approval', 'admin, onboarding', 'Give platform admin control over school/user activation and suspension.', 'Approve, reject, suspend, reactivate, edit official contacts.'),
    'FR-006': ('Paid Clearance Request', 'clearance, wallet', 'Create the main paid workflow for one incoming student.', 'Validate request, verify wallet balance, debit wallet, create case.'),
    'FR-007': ('Safe Matching Results', 'clearance, safety', 'Return careful no-match/possible-match/confirmed-match outcomes.', 'Normalize search fields and match against unresolved issues.'),
    'FR-008': ('Previous School Notification', 'notifications, clearance', 'Notify or guide contact with the previous school.', 'Create dashboard notification and generated WhatsApp/manual message.'),
    'FR-009': ('Free Issue Reporting', 'issues, contribution', 'Allow active schools to report unresolved issues without wallet charge.', 'Structured issue form with amount, type, session, term, note, evidence.'),
    'FR-010': ('Case Status Workflow', 'workflow, disputes', 'Support clear lifecycle states for requests and issues.', 'Implement status transitions for cleared, unresolved, disputed, no response, closed.'),
    'FR-011': ('Wallet and Paystack Top-up', 'wallet, payments', 'Manage wallet credits, debits, Paystack verification, and manual adjustments.', 'Use kobo integers, idempotent references, transactional wallet operations.'),
    'FR-012': ('Admin Operations Dashboard', 'admin, operations', 'Give admin practical operational views for the MVP.', 'Schools, wallets, clearance requests, issues, disputes, suspicious activity.'),
    'FR-013': ('Audit Logs and Privacy Controls', 'privacy, compliance', 'Record sensitive actions and enforce minimum necessary access.', 'Audit helper, server-side access rules, private/noindex areas.'),
    'FR-014': ('Mobile-Friendly UI', 'ui, mobile', 'Make all MVP flows usable on phones.', 'Responsive cards/forms, readable result states, obvious primary actions.'),
    'FR-015': ('Seed and Demo Data', 'demo, seed', 'Provide safe fake data for a convincing local demo.', 'Seed schools, wallets, unresolved/resolved issues, match/no-match cases.'),
    'FR-016': ('Automated SMS Email Notifications', 'notifications, future', 'Later automate previous-school notifications.', 'Provider integration, templates, delivery status, retries.'),
    'FR-017': ('Advanced Fuzzy Matching', 'matching, future', 'Later improve matching for typos/name variations and duplicates.', 'Trigram/phonetic indexes, confidence, duplicate review.'),
    'FR-018': ('Reward Credits and Trust Levels', 'incentives, future', 'Later reward good reports and penalize abuse without revenue sharing.', 'Trust scoring, reward credits, report quality rules.'),
    'FR-019': ('Meloschool Integration', 'integration, future', 'Later connect Meloschool admissions to EduClearance.', 'API/auth handoff and embedded clearance action.'),
    'FR-020': ('Parent Dispute Portal', 'parents, future', 'Later allow parents to securely dispute records.', 'Verified parent access, evidence upload, admin resolution.'),
}

acceptance = {
    'FR-001': ['Landing page is accessible at `/`.', 'Pricing says ₦5,000 gives 50 checks.', 'Copy says private school-to-school verification.', 'CTA routes to claim/register flow.'],
    'FR-002': ['Schools can be seeded manually or by script.', 'Statuses include unclaimed, pending, active, suspended.', 'Admin can search/view schools.', 'Claim flow can select unclaimed schools.'],
    'FR-003': ['User can submit claim for existing school.', 'User can submit new school request.', 'Pending claim does not expose sensitive data.', 'Admin can approve/reject later.'],
    'FR-004': ['Users can sign in/out.', 'Protected routes reject unauthenticated users.', 'Admin routes require platform_admin.', 'School routes require active school membership.'],
    'FR-005': ['Admin can approve pending claims.', 'Admin can reject with note.', 'Admin can suspend/reactivate schools.', 'Lifecycle actions are audit logged.'],
    'FR-006': ['Active school can submit clearance request.', 'Request charges ₦100 from wallet.', 'Insufficient balance blocks request.', 'Debit and request creation are transactional.'],
    'FR-007': ['Results support no_match, possible_match, confirmed_match.', 'No-match wording never says cleared.', 'Possible matches are labelled as possible.', 'Confirmed issues show minimum useful details and actions.'],
    'FR-008': ['Previous school contact appears when known.', 'Active previous school receives dashboard notification.', 'WhatsApp/manual message can be generated.', 'Notification status is tracked.'],
    'FR-009': ['Active schools can report issue for free.', 'Required fields are validated.', 'Issue status starts unresolved.', 'Issue creation is audit logged.'],
    'FR-010': ['Statuses match the PRD enumerations.', 'Allowed actions update statuses predictably.', 'Dispute can be opened.', 'Status changes are audit logged.'],
    'FR-011': ['Wallet balance is visible.', 'Clearance debit appears in history.', 'Paystack top-up initializes and verifies server-side.', 'Successful payment credits wallet once only.'],
    'FR-012': ['Admin dashboard exists.', 'Admin can view schools, wallets, requests, issues, disputes.', 'Admin can search/filter key records.', 'Admin actions require platform_admin.'],
    'FR-013': ['Sensitive actions are audit logged.', 'Private routes are not publicly indexed.', 'School users cannot view unrelated full records.', 'Dispute/correction path exists or is stubbed.'],
    'FR-014': ['Landing page works on mobile.', 'Dashboard is readable on mobile.', 'Forms are usable on mobile.', 'Result/disclaimer text is visible on mobile.'],
    'FR-015': ['Seed script creates sample schools.', 'Seed script creates wallet balances.', 'Seed script creates match/no-match scenarios.', 'Data uses fake names and numbers.'],
}

def default_ac(fr, status):
    if status == 'Future':
        return ['Scope is documented before build.', 'Privacy/payment risks are reviewed.', 'Feature does not break MUS flows.', 'Acceptance criteria are refined before implementation.']
    return ['Feature implements the PRD requirement.', 'Server-side validation and authorization are present.', 'Relevant empty/error/success states are handled.', 'Verification commands pass or blockers are documented.']

for fr, desc, story, status in rows:
    title, labels, solution, flow = focus[fr]
    ac = acceptance.get(fr, default_ac(fr, status))
    content = f"""# {fr}: {title}\n\nStatus: {status}  \nLabels: {labels}\n\n## Requirement\n\n{desc}\n\n## User Story\n\n{story}\n\n## Proposed Solution\n\n{solution}\n\n## Implementation Flow\n\n{flow}\n\n## Technical Approach\n\nFollow the stack and data model in `docs/Project_Requirements.md` and the rules in `docs/Coding_Guidelines.md`. Use server-side validation, school-scoped permissions, audit logging where sensitive, and transactional database operations for wallet/payment work.\n\n## Key Considerations\n\nKeep the MVP focused on clearance requests, not full school management. Use safe product language, minimize child/parent data, and avoid presenting missing records as clearance.\n\n## Acceptance Criteria\n\n"""
    content += ''.join(f'- [ ] {item}\n' for item in ac)
    content += "\n## Notes\n\nKeep this issue aligned with `docs/Project_Requirements.md`. If scope changes, update the FR table and this issue together.\n"
    (issue_dir / f'{fr}.md').write_text(content, encoding='utf-8')

print(f'Generated {len(rows)} issue files in {issue_dir}')
