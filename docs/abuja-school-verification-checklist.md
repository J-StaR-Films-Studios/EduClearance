# Abuja School Location Verification Checklist

Use this checklist before activating Abuja/FCT directory candidates in production.

The seed/import data intentionally uses neutral `educlearance.local` verification placeholders and does not include official phone numbers or official school inboxes unless a school claim is verified later.

## Operator verification steps

1. Confirm the school name and campus location from at least two reliable sources.
2. Verify the official admissions/records contact through the school directly.
3. Confirm whether the school should be listed as a claimable directory profile or onboarded as an active participant.
4. Record the verification source and reviewer before changing status from `unclaimed`/`pending` to `active`.
5. Replace placeholder contacts only after verification is complete.

## Seeded Abuja/FCT directory candidates

The current seed dataset is stored at:

```txt
src/db/seed-data/abuja-osm-schools.json
```

Current candidate count: **48**.

Sources:

- OpenStreetMap Overpass `amenity=school` records in Abuja/FCT-area bounding boxes.
- Manual Abuja candidate additions that remain pending operator verification.

License/attribution note: OpenStreetMap data is available under the Open Database License (ODbL). Keep attribution and verify records before using them as official school directory data.

All imported directory candidates should remain one of:

- `unclaimed` — directory/search candidate only.
- `pending` — operator review or claim review needed.

Do **not** activate a real school candidate until official location/contact/ownership checks are completed.

## Active local testing schools

These records are not real school directory claims. They support local application workflows and should not be exported as production directory entries.

| School name | Area/address hint | Seed status | Verification notes |
| --- | --- | --- | --- |
| Wuse Local Academy | Wuse II, Abuja | `active` | Local workflow record with owner/admin/staff users and funded wallet. |
| Garki Local College | Garki II, Abuja | `active` | Local workflow record for matched clearance, wallet, and dispute testing. |
| Lugbe Local Preparatory School | Lugbe, Abuja | `pending` | Local onboarding record for pending-school admin review. |

## Non-destructive production import

Do not run `pnpm db:seed` against production unless you intentionally want to wipe and reseed the database.

To populate candidate schools without deleting existing production data:

```bash
pnpm db:import:abuja-schools -- --env=.env.production.local
```
