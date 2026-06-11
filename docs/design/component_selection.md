# EduClearance 21st.dev Component Selection & Handoff

This document defines the selected 21st.dev components, visual theme, and rejected items for **EduClearance**, establishing a restrained, clean visual direction for the Next.js frontend.

---

## 1. Visual Direction: "Official Calm Utility"

We establish a **restrained light-themed utility aesthetic** inspired by **Origin UI** and the **Mono** design system.
* **Theme:** Off-white backgrounds (`#FAF9F6`), clean borders, structured inputs, and high-readability layout.
* **Animations:** Restricted strictly to hover states and micro-interactions (e.g., checkmarks, dialog fades). All heavy background shaders (such as Aurora shaders) and parallax scrolls are **rejected** to prioritize mobile page-load speed and performance on mid-range phones used by Nigerian school administrators.

---

## 2. Component Selection & Adaptation Mapping

The following table details the mapping of page sections to 21st.dev components, along with adaptation notes and risks.

| Page / Section | Selected Component / Link | Decision & Reason | Adaptation Notes | Risk / Dependency |
| :--- | :--- | :--- | :--- | :--- |
| **Global Theme & Form Controls** | [Origin UI Theme](https://21st.dev/community/themes/origin-ui) | **Select.** It provides outstanding, clean form controls, checkboxes, switches, and badges perfect for a utility app. | Use light-mode options only. Ensure borders use `#F5F2EB` and focus rings use deep navy. | Low risk; clean Tailwind components. |
| **Landing Navigation** | [Navbar-navigation Category](https://21st.dev/s/navbar-navigation) | **Select.** Clean, non-distracting navigation bar. | Collapses to standard mobile hamburger menu. Contains minimal links (Home, How it Works, Pricing, Sign In). | Standard responsive navigation. |
| **Landing Hero Background** | [Interactive Hero Backgrounds](https://cdn.21st.dev/ravikatiyar162/interactive-hero-backgrounds/default/bundle.1755167312016.html?theme=light) | **Select as progressive enhancement.** Soft, slow geometric grid drawing minor visual interest without cluttering copy. | Set speed to 0.1 (extremely slow). Restrict background dots to soft grey/slate. Provide a static CSS gradient/grid fallback. | Canvas-based; must verify performance on mobile. If it janks or increases bundle cost too much, replace with static background. |
| **How It Works / Features** | [Grid Feature Cards](https://cdn.21st.dev/sshahaider/grid-feature-cards/default/bundle.1747156095291.html?theme=light) | **Select.** Bento-grid layout that organizes feature descriptions clearly. | Remove heavy shadow animations. Keep it static on mobile, grid layout on desktop. | Ensure touch targets for mobile grid are easily readable. |
| **Social Proof / Local Network Preview** | [Logo Cloud 2](https://cdn.21st.dev/sshahaider/logo-cloud-2/default/bundle.1761136047930.html?theme=light) | **Select with caution.** Displays active participating schools, anonymized local-cluster counts, or clearly marked demo school names. Do not imply unclaimed schools are already participating. | Keep logos/text grayscale and slightly muted. Prefer static display over auto-scroll on mobile. | Needs fallback state if logo assets are missing. Confirm permission before showing real school logos publicly. |
| **Pricing Packages** | [Pricing Section 4](https://cdn.21st.dev/uilayout.contact/pricing-section-4/default/bundle.1756283776750.html?theme=light) | **Select.** Clean card layout displaying cost per clearance run and package sizes. | Adapt currency to Naira (₦5,000 for 50 checks / ₦100 per check). Clear callouts. | Minimal styling risk. |
| **Auth & Claim Screens** | [Simple Email or Password Login](https://cdn.21st.dev/larsen66/login-signup/simple-email-or-password-login/bundle.1753197583457.html?theme=light) | **Select.** Simple centered card layout for credentials and claims. | Modify labels and layout to support either signing in or searching the directory. | Form fields must validate with Zod. |
| **App Shell & Dashboard Navigation** | [Sidebar Component Category](https://21st.dev/s/sidebar) | **Select.** Left-aligned navigation panel for desktop users. | **Critical Mobile Rule:** Collapses to a sticky bottom navigation bar on screens under 768px. | Ensures mobile staff can navigate with one hand. |
| **Modals / Disclaimers** | [Scrollable Dialog](https://cdn.21st.dev/sshahaider/dialog/scrollable/bundle.1753272898334.html?theme=light) | **Select.** Dialog overlay for showing results, detailed WhatsApp copy, or dispute requests. | Wrap disclaimer text inside standard scroll boundaries with large close CTAs. | Ensure accessibility/focus traps work correctly. |
| **Consent & Confirm Checks** | [Animated Check Box](https://cdn.21st.dev/ringlabs/animated-check-box/default/bundle.1747471846216.html?theme=light) | **Select.** Micro-interaction that plays when confirming accuracy before submitting an issue. | Simple visual check transition. Keep it lightweight. | Uses minor CSS/SVG transitions. |
| **Wallet & Admin Logs** | [Table Component Category](https://21st.dev/s/table) | **Select.** Structured table listing transaction entries and case records. | Wrap table in a horizontal overflow container for small mobile screens. | Horizontal scrolling is mandatory on mobile viewports. |

---

## 3. Rejected Assets & Visual Rationale
* **Aurora / Shader Backgrounds:** *Rejected* (e.g. `aurora-section-hero`, `aurora-borealis-shader`). They feel like futuristic developer portfolios or crypto portals, which damages the "official school cluster utility" positioning. They are also CPU-heavy for mobile.
* **Cinematic Hero:** *Rejected* (e.g. `cinematic-landing-hero`). Too dark, heavy, and dramatic. The landing page needs to feel professional, welcoming, and light.
* **Parallax Feature Scroll:** *Rejected* (e.g. `parallax-scroll-feature-section`). Parallax scrolling has poor performance on mobile web viewports and causes usability issues.
* **Marquee CTA & Flickering Footers:** *Rejected* (e.g. `cta-with-marquee`, `flickering-footer`). Highly distracting, flashy elements that undermine product trust.
* **Globe / Interactive Maps:** *Rejected* (e.g. `globe`, `interactive-map`). 3D WebGL globes crash mobile browser tabs on entry-level Android devices. Local network mapping is better shown as a simple list of areas/States.

---

## 4. Implementation Handoff for the Builder

When implementing the frontend, the builder must adhere to these directives:

### 1. Light-First Styling
* Default tailwind background class must be `bg-background` (`#FAF9F6`).
* Primary text must be `text-navy-800` or `text-navy-900`. Avoid pitch-black text.
* Cards and containers must use `bg-white border border-secondary` with `rounded-xl`.

### 2. Form Setup (Using Origin UI)
* Use the **Origin UI** standard input components with large padding (`py-3 px-4`), clear labels, and subtle border transitions.
* Ensure all phone number inputs use standard `tel` types to prompt mobile phone keypads correctly.

### 3. Case Detail Screen Workflow
* The `/clearance/[id]` route is the most critical flow.
* If status is `no_platform_record_found`, render the warning disclaimer banner inside a high-contrast card:
  ```html
  <div class="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 my-4">
    <!-- Bold warning text -->
  </div>
  ```
* Include a secondary action button to trigger the WhatsApp share sheet using the pre-generated message.

### 4. Wallet Page & Paystack Popup
* The `/wallet` layout should use a dashboard sub-header containing the balance card.
* When "Top Up" is clicked, initialize the Paystack transaction server-side and return an authorization URL or safe client initialization payload. The callback/query param may trigger a refresh, but wallet credit must only happen after server-side Paystack verification or a verified webhook. Never credit a wallet from client-side success alone.
* Debit and Credit logs must render cleanly inside responsive, horizontally-scrollable `<table />` elements.

### 5. 21st.dev Source Rule
* The CDN preview links in this document are visual references. For implementation source, use the official 21st.dev community page or copied prompt/code where available. Do not manually derive source URLs from CDN preview URLs.
