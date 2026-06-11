# EduClearance Design Critique & Refinement Plan

This document presents a detailed critique of the EduClearance design system, sitemap, and HTML mockups against the core product principles, privacy guidelines, and mobile accessibility standards.

---

## 1. Top 10 Recommended Fixes (Ranked by Importance)

### 1. Dynamic "School Not Listed" Field in Clearance Form
* **Issue:** In [clearance-new.html](file:///c:/CreativeOS/01_Projects/Code/Personal_Stuff/2026-06-11_EduClearance/docs/mockups/clearance-new.html), selecting "School not listed (Manual Type-in)" does not expose a text input to write the school name, leaving the workflow stuck.
* **Exact Section:** `/docs/mockups/clearance-new.html` (Form container, after previous school dropdown).
* **Fix:** Add a hidden `<div id="manual-school-group">` containing a text input labeled "Specify Previous School Name". Use a clean Javascript event listener (`onchange`) on the dropdown to toggle the `hidden` class.

### 2. Search Engine Indexing Protection
* **Issue:** Private student and parent records could be accidentally crawled by search engines.
* **Exact Section:** All pages under `/docs/mockups/clearance-[id].html` and `/issues/*`.
* **Fix:** Add `<meta name="robots" content="noindex, nofollow">` to the `<head>` of all clearance details and issues templates, and add a reminder to the builder to enforce `X-Robots-Tag: noindex, nofollow` headers in Next.js router files.

### 3. WhatsApp Direct Share Link Integration
* **Issue:** In [clearance-detail-no-record.html](file:///c:/CreativeOS/01_Projects/Code/Personal_Stuff/2026-06-11_EduClearance/docs/mockups/clearance-detail-no-record.html), the "Send WhatsApp" button only displays a text preview, requiring the user to manually copy and paste.
* **Exact Section:** Contact actions panel.
* **Fix:** Convert the button to an `<a>` anchor tag with `href="https://wa.me/PHONE?text=ENCODED_MSG"`. When clicked, it will open WhatsApp Web or the WhatsApp mobile app directly with the pre-filled message, saving administrative steps during admissions.

### 4. Direct Navigation for In-bound Clearance Requests
* **Issue:** The dashboard displays an alert for in-bound requests from other schools (e.g., "Springfield has checked Obinna Okafor"). If the user closes this alert, there is no history page to access pending in-bound checks.
* **Exact Section:** Dashboard sidebar and navigation.
* **Fix:** Introduce an "Incoming Requests" section in the Clearance History index (`/clearance`) using tabs: "Checks Initiated (Outbound)" and "Clearances Requested (Inbound)".

### 5. Ethical Certification Text Strength
* **Issue:** The ethical agreement checkbox in [issues-new.html](file:///c:/CreativeOS/01_Projects/Code/Personal_Stuff/2026-06-11_EduClearance/docs/mockups/issues-new.html) is too informal, exposing the system to frivolous reports.
* **Exact Section:** Form checkpoint checkbox.
* **Fix:** Revise wording to: *"I certify under penalty of account suspension that this record is accurate, matches our physical accounts ledger, and complies with cluster data privacy policies."*

### 6. Role-Based Navigation Restriction (School Staff)
* **Issue:** School staff (who do not have proprietor privileges) should not access billing top-ups.
* **Exact Section:** Dashboard sidebar.
* **Fix:** The sidebar must dynamically hide or lock the "Wallet & Billing" link for users logged in with the `school_staff` role, directing them to contact their school proprietor for billing actions.

### 7. Form Field Label Clarity in Issue Reporting
* **Issue:** The field label "Outstanding Amount Owed (₦)" in [issues-new.html](file:///c:/CreativeOS/01_Projects/Code/Personal_Stuff/2026-06-11_EduClearance/docs/mockups/issues-new.html) might be confused as a platform fee the school has to pay to report the issue.
* **Exact Section:** Issue submission form.
* **Fix:** Rename label to: *"Unresolved Balance Owed by Parent/Student (₦)"*.

### 8. Refund Transparency on Dispute Resolution
* **Issue:** In [admin-disputes.html](file:///c:/CreativeOS/01_Projects/Code/Personal_Stuff/2026-06-11_EduClearance/docs/mockups/admin-disputes.html), when an admin resolves a dispute in favor of the parent/student, it is unclear if the check fee is refunded to the admitting school.
* **Exact Section:** Admin dispute action details.
* **Fix:** Add a helper note beside the resolution buttons: *"Note: Clearing this record will automatically issue a ₦100 credit refund to the admitting school's wallet."*

### 9. Mobile Table Layout Wrapping
* **Issue:** Financial log tables in [wallet.html](file:///c:/CreativeOS/01_Projects/Code/Personal_Stuff/2026-06-11_EduClearance/docs/mockups/wallet.html) and [admin-clearance.html](file:///c:/CreativeOS/01_Projects/Code/Personal_Stuff/2026-06-11_EduClearance/docs/mockups/admin-clearance.html) will squish and overflow layout containers on narrow 360px viewports.
* **Exact Section:** All HTML table elements.
* **Fix:** Wrap all `<table>` blocks inside a `<div class="overflow-x-auto whitespace-nowrap">` wrapper to allow clean horizontal scrolling on mobile.

### 10. Claim Approval Confirmation Text
* **Issue:** In [claim-school.html](file:///c:/CreativeOS/01_Projects/Code/Personal_Stuff/2026-06-11_EduClearance/docs/mockups/claim-school.html) (Step 3), the screen refers to "free demo credentials", which is confusing.
* **Exact Section:** Awaiting approval panel.
* **Fix:** Change to: *"Active school wallet will be initialized with a ₦5,000 promotional credit (50 free student checks)."*

---

## 2. Revised Copy for Risky Wording

| Original Copy | Risky Wording Reason | Revised Copy (Compliant & Safe) |
| :--- | :--- | :--- |
| *Active school wallet is initialized with free demo credentials.* | Confusing terminology; sounds like username/password. | *Active school wallet will be initialized with ₦5,000 promotional credit (50 free student checks).* |
| *Outstanding Amount Owed (₦)* | Could be misinterpreted as a submission fee. | *Unresolved Balance Owed by Parent/Student (₦)* |
| *I certify that this record is accurate, matches our physical accounts ledger, and belongs to our school.* | Too loose. Doesn't warn against false listings. | *I certify under penalty of account suspension that this record is accurate, matches our physical accounts ledger, and complies with cluster data privacy policies.* |
| *Unresolved Balance Found on Record* | Sounds slightly accusatory or like a public blacklist entry. | *Unresolved Balance Reported* |

---

## 3. Build-Readiness Verdict

### 🟢 APPROVED FOR BUILD (With Refinements)
The EduClearance mockup files and design specs align perfectly with the target audience requirements (local Nigerian school proprietors using mobile browsers). The layout shift to a two-column desktop grid resolves empty workspace whitespace while preserving mobile-first stacked responsiveness. Once the top 10 minor refinements listed above are merged, the design system will be fully locked and ready for implementation.

---

## 4. Refinement Application Note

Applied after critique review:

- Added manual previous-school field behavior to `docs/mockups/clearance-new.html`.
- Added `noindex, nofollow` metadata to private/authenticated mockups.
- Added direct WhatsApp share link to `docs/mockups/clearance-detail-no-record.html`.
- Added `docs/mockups/clearance.html` with outbound/inbound clearance tabs.
- Strengthened issue-reporting certification and amount label in `docs/mockups/issues-new.html`.
- Clarified promotional wallet credit wording in `docs/mockups/claim-school.html`.
- Added dispute refund helper copy in `docs/mockups/admin-disputes.html`.
- Ensured table wrappers support horizontal scrolling on mobile.
- Updated `docs/Builder_Prompt.md` with locked build refinements.
