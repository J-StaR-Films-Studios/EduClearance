# Abuja School Location Verification Checklist

Use this checklist before importing or activating Abuja directory candidates in production. The seed data intentionally uses neutral `educlearance.local` verification placeholders and does not include official phone numbers or official school email addresses.

## Operator checklist

1. Confirm the school name and campus location from at least two reliable sources.
2. Verify the official admissions/records contact through the school directly.
3. Confirm whether the school should be listed as a claimable directory profile or onboarded as an active participant.
4. Record source links, call notes, and the staff member who approved activation.
5. Replace placeholder contacts only after verification is complete.

## Seeded Abuja directory candidates

| School name | Area/address hint | Seed status | Verification notes |
| --- | --- | --- | --- |
| American International School of Abuja | Durumi, Abuja | `unclaimed` | Candidate only. Verify exact campus address, official records contact, and claim owner before activation. |
| Loyola Jesuit College | Gidan Mangoro / Abuja-Keffi Road corridor | `unclaimed` | Candidate only. Verify exact address and official clearance/records channel before activation. |
| The Regent School | Maitama, Abuja | `unclaimed` | Candidate only. Confirm campus location and official contact through the school. |
| Capital Science Academy | Kuje, Abuja | `unclaimed` | Candidate only. Confirm exact campus address and whether the records office handles transfers centrally. |
| Lead British International School | Gwarinpa, Abuja | `unclaimed` | Candidate only. Confirm official campus and transfer-clearance contact before activation. |
| Whiteplains British School | Jabi, Abuja | `pending` | Pending operator review. Verify exact address, ownership claim, and official records contact before any activation. |
| Glisten International Academy | Jahi, Abuja | `unclaimed` | Candidate only. Verify location and official records/admissions contact. |
| Premier International School | Wuse II, Abuja | `unclaimed` | Candidate only. Confirm exact location and official contact before activation. |

## Active local testing schools

These records are not real school directory claims. They support local application workflows and should not be exported as production directory entries.

| School name | Area/address hint | Seed status | Verification notes |
| --- | --- | --- | --- |
| Wuse Local Academy | Wuse II, Abuja | `active` | Local workflow record with owner/admin/staff users and funded wallet. |
| Garki Local College | Garki II, Abuja | `active` | Local workflow record for matched clearance, wallet, and dispute testing. |
| Lugbe Local Preparatory School | Lugbe, Abuja | `pending` | Local onboarding record for pending-school admin review. |
