# EduClearance Antigravity + 21st.dev Design Prompts

Use these prompts in Antigravity. Start with Prompt 1. If Antigravity can edit files, let it create the design artifacts. If not, ask it to return the artifacts in chat and paste them into this repo.

## Prompt 1 — Product + UX Design Direction

```text
You are designing EduClearance, a private school-to-school student transfer clearance network for Nigerian local school clusters.

Read and use these project files as source of truth:
- docs/Project_Requirements.md
- docs/Coding_Guidelines.md
- docs/Builder_Prompt.md
- docs/features/clearance-workflow.md
- docs/issues/FR-001.md through docs/issues/FR-015.md

Important product decisions:
- EduClearance is NOT a school ERP and NOT Meloschool.
- The core action is “Start a Clearance Request” for one incoming student.
- “No record found” must NEVER mean “cleared.” Use this wording: “No unresolved record was found on EduClearance. This does not confirm that the student has cleared the previous school. Please contact the previous school directly or wait for their response.”
- Use professional language: clearance request, outstanding balance, unresolved issue, transfer verification, no platform record found.
- Avoid shame language: blacklist, debtor database, bad parent.
- Wallet model: ₦5,000 gives 50 student checks. Each clearance request costs ₦100. Reporting unresolved issues is free.
- Target users are school owners/proprietors/admin staff, often using phones during admissions.

Design vibe:
- Official, calm, trustworthy, modern, local-school friendly.
- Should feel like a professional verification utility, not a flashy fintech and not a government portal.
- Mobile-first. Desktop should still feel like a clean SaaS dashboard.
- Use warm trust colors: deep navy/ink, soft emerald/teal, cream/off-white backgrounds, subtle amber warning states.
- Typography should be clear and mature. Suggest an accessible Google Font pairing if needed.

Your task:
1. Create a concise UX strategy for EduClearance.
2. Define the sitemap and all required screens.
3. Define the design system: colors, typography, spacing, radius, components, statuses, states.
4. Define the core user flows:
   - school owner landing -> claim school -> pending approval
   - active school dashboard -> start clearance request -> result page
   - no platform record found state with disclaimer
   - confirmed outstanding balance state
   - previous school notification/contact state
   - report unresolved issue flow
   - wallet top-up flow
   - admin approval/wallet/dispute operations
5. Produce build-ready low-fidelity screen specs for each MVP page.
6. Explicitly list the 21st.dev component types/categories that should be used per page.

Required output format:
- Visual direction summary
- Sitemap table
- Design tokens
- Component inventory
- Page-by-page UX spec
- 21st.dev component mapping
- Accessibility notes
- Open design risks

Do not write implementation code yet unless I ask. Focus on build-ready UX direction.
```

## Prompt 2 — 21st.dev Component Selection Using My Asset Links

```text
Use 21st.dev components/assets to shape EduClearance’s UI. The project is React/Next.js + Tailwind + shadcn/ui.

Source of truth:
- docs/Project_Requirements.md
- docs/Coding_Guidelines.md
- docs/Builder_Prompt.md
- docs/design/antigravity-prompts.md if available

Use these 21st.dev references as preferred inspiration/components. Categorize them and choose only what fits EduClearance’s official, calm, trustworthy product tone.

Themes:
- https://21st.dev/community/themes/origin-ui
- https://21st.dev/community/themes/mono

Hero / background candidates:
- https://cdn.21st.dev/easemize/cinematic-landing-hero/default/bundle.1774169408294.html?theme=light
- https://cdn.21st.dev/bundled/2058.html?theme=light
- https://cdn.21st.dev/bundled/1773.html?theme=light
- https://cdn.21st.dev/ravikatiyar162/interactive-hero-backgrounds/default/bundle.1755167312016.html?theme=light
- https://cdn.21st.dev/dhileepkumargm/aurora-section-hero/default/bundle.1759140631930.html?theme=light
- https://cdn.21st.dev/dhileepkumargm/geometric-sphere/default/bundle.1759930495872.html?theme=light
- https://cdn.21st.dev/dhileepkumargm/aurora-borealis-shader/default/bundle.1756052616664.html?theme=light

Feature / section candidates:
- https://cdn.21st.dev/sumonadotwork/parallax-scroll-feature-section/default/bundle.1751685953253.html?theme=light
- https://cdn.21st.dev/bundled/498.html?theme=light
- https://cdn.21st.dev/sehajbindra/features/default/bundle.1749387619299.html?theme=light
- https://cdn.21st.dev/sshahaider/grid-feature-cards/default/bundle.1747156095291.html?theme=light
- https://cdn.21st.dev/uniquesonu/about-us-section/default/bundle.1749719069056.html?theme=light

CTA / social proof / footer candidates:
- https://cdn.21st.dev/lyanchouss/cta-with-marquee/cta-with-marque-reverse/bundle.1759331424507.html?theme=light
- https://cdn.21st.dev/lyanchouss/cta-with-marquee/cta-with-video/bundle.1759331424507.html?theme=light
- https://cdn.21st.dev/sshahaider/logo-cloud-2/default/bundle.1761136047930.html?theme=light
- https://cdn.21st.dev/aghasisahakyan1/flickering-footer/default/bundle.1759970115840.html?theme=light

Pricing / auth / app-shell candidates:
- https://cdn.21st.dev/uilayout.contact/pricing-section-4/default/bundle.1756283776750.html?theme=light
- https://cdn.21st.dev/larsen66/pricing-section/default/bundle.1757995276871.html?theme=light
- https://cdn.21st.dev/larsen66/login-signup/simple-email-or-password-login/bundle.1753197583457.html?theme=light
- https://cdn.21st.dev/sshahaider/dialog/scrollable/bundle.1753272898334.html?theme=light
- https://cdn.21st.dev/ringlabs/animated-check-box/default/bundle.1747471846216.html?theme=light

Map / local network candidates:
- https://cdn.21st.dev/ruixen.ui/globe/default/bundle.1755628836403.html?theme=light
- https://cdn.21st.dev/lovesickfromthe6ix/interactive-map/default/bundle.1752059124545.html?theme=light

Other visual candidates:
- https://cdn.21st.dev/cinquinandy/lightning-split/default/bundle.1760802028658.html?theme=light
- https://cdn.21st.dev/minhxthanh/image-comparison-slider/default/bundle.1758190242046.html?theme=light
- https://cdn.21st.dev/easemize/image-swiper/default/bundle.1748755462168.html?theme=light
- https://cdn.21st.dev/larsen66/clip-path-image/default/bundle.1749989658399.html?theme=light
- https://cdn.21st.dev/avanishverma4/animated-menu-1/default/bundle.1760508301579.html?theme=light
- https://cdn.21st.dev/ishamsu/retro-testimonial/default/bundle.1747178884381.html?theme=light

21st.dev category links to use if better components are needed:
- Hero: https://21st.dev/s/hero
- Backgrounds: https://21st.dev/s/background
- Features: https://21st.dev/s/features
- Pricing: https://21st.dev/s/pricing-section
- Navigation: https://21st.dev/s/navbar-navigation
- Auth: https://21st.dev/s/sign-in and https://21st.dev/s/registration-signup
- Forms: https://21st.dev/s/form
- Tables: https://21st.dev/s/table
- Sidebar: https://21st.dev/s/sidebar
- Dialogs: https://21st.dev/s/modal-dialog
- Notifications: https://21st.dev/s/notification
- Footer: https://21st.dev/s/footer

Your task:
1. Pick a restrained 21st.dev visual direction for EduClearance.
2. Choose which components/assets to use for:
   - landing header/nav
   - landing hero
   - how-it-works/features
   - pricing
   - trust/privacy section
   - CTA/footer
   - login/register
   - dashboard shell/sidebar
   - clearance request form
   - result cards/status states
   - wallet and admin tables
3. Reject any asset that feels too flashy, crypto-like, too abstract, too heavy, or not suitable for school owners.
4. Return a table with: Page/section, selected component/link/category, reason, adaptation notes, dependencies/risk.
5. Then write a concise implementation handoff for the builder.

Do not implement yet. Select and specify.
```

## Prompt 3 — Generate Portable HTML Mockups

```text
Now generate the actual design artifacts for EduClearance.

Use the UX direction and 21st.dev component mapping from the previous response, especially these files if available:
- docs/design/ux_strategy.md
- docs/design/component_selection.md

Create portable HTML mockups using Tailwind CDN and Heroicons CDN. They should be responsive, mobile-first, and suitable for a Next.js/Tailwind implementation later.

Create these files:
- docs/design/sitemap.md
- docs/design/design-system.html
- docs/mockups/home.html
- docs/mockups/login.html
- docs/mockups/register.html
- docs/mockups/claim-school.html
- docs/mockups/dashboard.html
- docs/mockups/clearance-new.html
- docs/mockups/clearance-detail-no-record.html
- docs/mockups/clearance-detail-match.html
- docs/mockups/issues-new.html
- docs/mockups/wallet.html
- docs/mockups/admin.html
- docs/mockups/admin-schools.html
- docs/mockups/admin-clearance.html
- docs/mockups/admin-disputes.html

Design constraints:
- Mobile-first, but desktop should look polished.
- Use calm official colors from docs/design/ux_strategy.md: navy/ink, teal/emerald, cream/off-white, amber warning, red/terracotta error.
- Show real EduClearance copy, not generic lorem ipsum.
- Treat 21st.dev CDN links as visual references only; do not manually derive implementation source URLs from preview links.
- Use professional safety language.
- No-match page must include the exact safe disclaimer.
- Match page must show “Outstanding balance reported” professionally, not as a public blacklist.
- Dashboard must make “Start Clearance Request” the main action.
- Wallet must show balance, checks remaining, top-up, and history.
- Admin must show approvals, wallet adjustments, disputes, and suspicious activity.

After generating the files, update docs/Builder_Prompt.md by adding this section:

## Mandatory Mockup-Driven Implementation
The `/docs/mockups` folder is the **UNQUESTIONABLE source of truth** for all front-end UI/UX.
You must NOT deviate from the layout, color palette, typography, or component structure defined in the mockups.
Before implementing any page, open the corresponding mockup file and replicate it exactly.

Return:
- files created
- key visual decisions
- anything the builder must not miss
```

## Prompt 4 — Design Critique / Tighten Before Build

```text
Critique the EduClearance design artifacts for product clarity, trust, mobile usability, and legal/privacy-safe wording.

Review:
- docs/Project_Requirements.md
- docs/Coding_Guidelines.md
- docs/Builder_Prompt.md
- docs/design/sitemap.md
- docs/design/design-system.html
- docs/mockups/*.html

Check specifically:
1. Does the UI make “clearance request” the core product action?
2. Does any page accidentally imply “no record found = cleared”?
3. Is the language professional and non-shaming?
4. Is the mobile admission workflow fast enough for school staff?
5. Are wallet/credit states clear?
6. Are dispute, previous-school contact, and notification states visible?
7. Are admin operations obvious enough for MVP?
8. Are any 21st.dev elements too flashy or distracting for the audience?

Return:
- top 10 fixes, ranked by importance
- exact file/section to change
- revised copy for risky wording
- build-readiness verdict
```

## My Recommended Default Visual Direction

If Antigravity asks for a single direction, use this:

**“Official calm SaaS for Nigerian private schools: cream background, deep navy text, emerald trust accents, soft amber warning states, rounded cards, clear mobile-first forms, restrained 21st.dev hero/background motion, and shadcn-style dashboard components.”**
