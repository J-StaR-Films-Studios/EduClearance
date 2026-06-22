# Stage 3 — Production Copy, SEO, and Page Polish

## Objective
Make EduClearance production-facing from a public SEO/copy perspective while keeping private workflows unindexed.

## Scope
- Public homepage copy and trust claims.
- `src/lib/site.ts`, `src/lib/seo.ts`, `src/app/layout.tsx`.
- Add/adjust `robots.ts`, `sitemap.ts`, structured data, OpenGraph/Twitter metadata where appropriate.
- Page metadata descriptions, especially public/private distinction.
- Remove remaining runtime copy that implies prototype/demo/seeded/mock/placeholder or unsupported trust claims.

## Definition of Done
- Public homepage has production-facing SEO metadata, canonical metadata base from env, OpenGraph/Twitter previews, and structured data appropriate for a Nigerian school transfer clearance network.
- Private app/admin/dashboard/workflow pages remain `noindex, nofollow`.
- Robots/sitemap expose public routes only and disallow private routes.
- Public copy avoids unverifiable customer/trust claims and preserves professional wording from the PRD.
- `pnpm typecheck` and `pnpm lint` pass.

## Expected Artifacts
- Source changes for SEO/copy/metadata.
- Verification summary including private route noindex status and robots/sitemap behavior.
