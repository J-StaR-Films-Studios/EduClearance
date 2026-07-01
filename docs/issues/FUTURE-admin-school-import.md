# Future Task: Admin Add School + Bulk Import

## Status

Future enhancement. Not required for the current production-readiness launch.

## Problem

EduClearance now supports a populated school directory seeded/imported from curated data. As the product grows, operators need a safe way to add more schools without asking a developer to edit seed files or run custom SQL.

The feature must not wipe or clash with the existing production database state.

## Goal

Add admin-facing tools for:

1. Creating one school manually.
2. Bulk importing schools from CSV/JSON.
3. Previewing duplicates before import.
4. Inserting only new schools by slug.
5. Keeping imported schools `unclaimed` or `pending` until verified.

## Proposed UX

Location:

```txt
/admin/schools
```

Add actions:

- **Add School** — one-off manual form.
- **Import Schools** — upload/paste CSV or JSON.

Manual form fields:

- School name — required.
- Area — optional but recommended.
- Address — optional.
- Main phone — optional.
- Clearance phone — optional.
- Contact email — optional.
- Contact person — optional.
- Status — default `unclaimed`; allow `pending` for operator review; avoid direct `active` unless admin confirms.

Bulk import fields:

```csv
name,area,address,mainPhone,clearancePhone,contactEmail,contactPerson,status,source
```

Minimum required column:

```txt
name
```

## Safety requirements

- Generate a slug from school name unless a slug is supplied.
- Use existing `schools.slug` unique index for conflict detection.
- Do not overwrite existing school records by default.
- Show import preview with:
  - new rows
  - duplicates/skipped rows
  - invalid rows
- Imported rows default to `unclaimed` unless explicitly set to `pending`.
- Do not create users automatically during bulk import.
- Do not create wallets automatically for `unclaimed` records.
- Add audit logs for manual creation and bulk import.

## API proposal

```txt
POST /api/admin/schools/create
POST /api/admin/schools/import/preview
POST /api/admin/schools/import/commit
```

All routes must require platform admin session.

## Acceptance criteria

- Admin can create a single school from `/admin/schools`.
- Admin can paste/upload CSV/JSON and preview import results.
- Duplicate slugs are skipped, not overwritten.
- Import commit inserts only valid new rows.
- Production data is not truncated or reset.
- Audit log records who performed the import and summary counts.
- Typecheck, lint, build pass.
- Browser smoke confirms new school appears in admin school list/search after import.

## Related current tooling

Current non-destructive importer:

```bash
pnpm db:import:abuja-schools -- --env=.env.prod-import
```

Current seed dataset:

```txt
src/db/seed-data/abuja-osm-schools.json
```

This future admin feature should reuse the same non-destructive principles: insert by unique slug, skip duplicates, never wipe production records.
