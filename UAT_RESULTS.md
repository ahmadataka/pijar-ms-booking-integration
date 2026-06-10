# UAT Results

## Purpose

This document records actual UAT execution outcomes.

Use together with:

- [UAT_CHECKLIST.md](./UAT_CHECKLIST.md)
- [UAT_VENDOR_DEV_PLAN.md](./UAT_VENDOR_DEV_PLAN.md)
- [UAT_EXECUTION_GUIDE.md](./UAT_EXECUTION_GUIDE.md)

## Execution Summary

- UAT phase: `Vendor Dev API UAT`
- Test environment: `Vendor development Odoo API`
- Microsoft environment: `Pijar Foundation M365`
- Sync runner host: `DigitalOcean VM`
- Executor:
- Start date:
- End date:

## Case Summary

| ID | Scenario | Result | Date | Evidence | Notes |
|---|---|---|---|---|---|
| UAT-01 | Normal room booking | Pass | 2026-06-10 | Outlook booking screenshot + VM sync output + Odoo booking `222` | Microsoft booking `UAT-01 Normal Room Booking` for `Majapahit` synced successfully with mapped users `Ataka` and `Cazadira` |
| UAT-02 | Normal room update | Pass | 2026-06-10 | Outlook update confirmation + VM dry-run output showing `replace` for Odoo booking `222` | Same Microsoft event updated from `17:00–17:30` to `17:30–18:00`, and sync correctly detected reconciliation was needed |
| UAT-03 | Normal room cancellation | Pass | 2026-06-10 | Outlook cancellation + VM dry-run and execute after cancellation fix | Initial test exposed a cancellation reconciliation bug; after fix and retest, Odoo booking `223` was deleted successfully |
| UAT-04 | Mapped attendee set | Pass | 2026-06-10 | Outlook booking screenshot + VM dry-run and execute output + Odoo booking `226` | Booking `UAT-04 Mapped Attendee Set` for `Pajajaran` synced cleanly with mapped attendees `Ataka`, `Cazadira`, and `Cindy` |
| UAT-05 | Unmapped attendee | Pass | 2026-06-10 | Outlook booking screenshot + VM dry-run output showing `skip not-ready` | Booking `UAT-05 Unmapped Attendee` with `Hilwah` was blocked cleanly and did not create partial Odoo access |
| UAT-06 | Unmapped room | Pass | 2026-06-10 | Outlook booking screenshot + targeted VM dry-run with `includeUnmapped: true` | Booking `UAT-06 Unmapped Room` for `Mataram` was blocked cleanly because the room has no Odoo mapping |
| UAT-07 | Normal room repeated sync | Pass | 2026-06-10 | VM `last-production-sync.json` and dry-run output | Unchanged already-synced bookings returned `noop`, confirming idempotent behavior with no duplicate booking creation |
| UAT-08 | Approval room request created | Not Run |  |  |  |
| UAT-09 | Approval room pending | Not Run |  |  |  |
| UAT-10 | Approval room approved in Microsoft | Not Run |  |  |  |
| UAT-11 | Approval room rejected in Microsoft | Not Run |  |  |  |
| UAT-12 | Approval room canceled after approval | Not Run |  |  |  |
| UAT-13 | Multiple mapped rooms | Not Run |  |  |  |
| UAT-14 | Daily scheduled sync | Not Run |  |  |  |

## Detailed Result Template

Copy and fill one section per executed case.

### UAT-01

- Result: Pass
- Date: 2026-06-10
- Room: `Majapahit -JKT-PIJAR HQ`
- Organizer: `Ataka`
- Attendees:
  - `Ataka`
  - `Cazadira Fediva Tamzil`
- Microsoft booking evidence: Outlook meeting screenshot titled `UAT-01 Normal Room Booking`
- Sync evidence: VM `npm run sync:execute` result on 2026-06-10 created the booking successfully
- Odoo booking ID: `222`
- Expected result: Booking appears in Outlook, sync creates Odoo booking, and access/check-in records are generated
- Actual result: Booking was detected as `create` and Odoo returned schedule `222` with check-in access records for `Ataka` and `Cazadira`
- Notes: `needs_admin_approval` was `false`, which is correct for this normal room scenario

### UAT-02

- Result: Pass
- Date: 2026-06-10
- Room: `Majapahit -JKT-PIJAR HQ`
- Organizer: `Ataka`
- Attendees:
  - `Ataka`
  - `Cazadira Fediva Tamzil`
- Microsoft booking evidence: Same Outlook booking as `UAT-01`, updated and re-sent with new time
- Sync evidence: VM `npm run sync:dry-run` detected `replace` for the same Microsoft event
- Odoo booking ID: existing booking `222` marked for replacement
- Expected result: Odoo booking is updated or replaced correctly without creating an uncontrolled duplicate
- Actual result: Sync identified the changed request fingerprint and planned `replace` for booking `222`, moving time from `17:00–17:30` to `17:30–18:00`
- Notes: This confirms the current update strategy is replacement-based, not in-place patching

### UAT-03

- Result: Pass
- Date: 2026-06-10
- Room: `Majapahit -JKT-PIJAR HQ`
- Organizer: `Ataka`
- Attendees:
  - `Ataka`
  - `Cazadira Fediva Tamzil`
- Microsoft booking evidence: Same `UAT-01 Normal Room Booking`, later canceled in Outlook
- Sync evidence: Initial dry-run exposed a missing delete path. After code fix and VM redeploy, dry-run produced `delete` for Odoo booking `223`, and execute removed it successfully
- Odoo booking ID: deleted booking `223`
- Expected result: Odoo booking should be removed, invalidated, or otherwise no longer active after Microsoft cancellation
- Actual result: Final retest passed. The canceled Microsoft event was treated as `missing-from-microsoft-window`, and the synced Odoo booking was deleted
- Notes: UAT successfully exposed a lifecycle bug in cancellation handling. The fix was implemented during UAT and validated on the VM

### UAT-04

- Result: Pass
- Date: 2026-06-10
- Room: `Pajajaran -JKT-PIJAR HQ`
- Organizer: `Ataka`
- Attendees:
  - `Ataka`
  - `Cazadira Fediva Tamzil`
  - `Cindy Dayana`
- Microsoft booking evidence: Outlook meeting screenshot titled `UAT-04 Mapped Attendee Set`
- Sync evidence: VM `npm run sync:dry-run` showed a clean `create` with `room_id: 16`, `organizer_id: 56`, and `guest_contact_ids: [56, 95, 79]`. VM `npm run sync:execute` then created the booking successfully
- Odoo booking ID: `226`
- Expected result: No `not-ready` issue and Odoo booking created cleanly
- Actual result: Booking was fully ready, created in Odoo, and Odoo returned check-in access records for `Ataka`, `Cazadira`, and `Cindy`
- Notes: `needs_admin_approval` was `false`, which is correct for this standard mapped-room meeting

### UAT-05

- Result: Pass
- Date: 2026-06-10
- Room: `Majapahit -JKT-PIJAR HQ`
- Organizer: `Ataka`
- Attendees:
  - `Ataka`
  - `Hilwah`
  - `Cazadira Fediva Tamzil`
- Microsoft booking evidence: Outlook meeting screenshot titled `UAT-05 Unmapped Attendee`
- Sync evidence: VM `npm run sync:dry-run` showed `action: "skip"` with `reason: "not-ready"` for the Microsoft event, and `missing.guestContacts` included `hilwah@pijarfoundation.org`
- Odoo booking ID: none created
- Expected result: Sync reports a clear `not-ready` or missing-attendee state and does not silently create incomplete downstream access
- Actual result: After tightening the payload readiness rule, the sync blocked the booking cleanly and did not produce a partial Odoo booking
- Notes: This behavior is safer for access control because unmapped attendees are now treated as blockers instead of being silently omitted from `guest_contact_ids`

### UAT-06

- Result: Pass
- Date: 2026-06-10
- Room: `Mataram -JKT-PIJAR HQ`
- Organizer: `Ataka`
- Attendees:
  - `Ataka`
  - `Cazadira Fediva Tamzil`
- Microsoft booking evidence: Outlook meeting screenshot titled `UAT-06 Unmapped Room`
- Sync evidence: Targeted VM dry-run with `includeUnmapped: true` showed `action: "skip"` with `reason: "not-ready"` for the Microsoft event, and `missing.room` was `true`
- Odoo booking ID: none created
- Expected result: Sync skips or blocks the booking with a clear room mapping issue
- Actual result: The booking was excluded from normal mapped-room production sync and, when checked in targeted include-unmapped mode, was explicitly blocked because the room has no Odoo mapping
- Notes: This is the correct safety behavior. Operationally, unmapped rooms are not processed in the normal scheduled sync path at all

### UAT-07

- Result: Pass
- Date: 2026-06-10
- Room: multiple already-synced mapped rooms, including `Majapahit` and `Singhasari`
- Organizer: existing mapped organizers from prior synced bookings
- Attendees: existing mapped attendees from prior synced bookings
- Microsoft booking evidence: no booking changes were made before the repeated run
- Sync evidence: VM `last-production-sync.json` showed existing synced bookings as `noop`, including Odoo bookings `215`, `219`, and `221`
- Odoo booking ID: examples `215`, `219`, `221`
- Expected result: repeated sync should not create duplicates and should settle into `noop`
- Actual result: repeated scheduled sync returned `noop` for unchanged synced bookings, with no duplicate `create` action generated
- Notes: This confirms the idempotency behavior for stable synced bookings

### UAT-08

- Result:
- Date:
- Room:
- Organizer:
- Attendees:
- Microsoft booking evidence:
- Sync evidence:
- Odoo booking ID:
- Expected result:
- Actual result:
- Notes:

### UAT-09

- Result:
- Date:
- Room:
- Organizer:
- Attendees:
- Microsoft booking evidence:
- Sync evidence:
- Odoo booking ID:
- Expected result:
- Actual result:
- Notes:

### UAT-10

- Result:
- Date:
- Room:
- Organizer:
- Attendees:
- Microsoft booking evidence:
- Sync evidence:
- Odoo booking ID:
- Expected result:
- Actual result:
- Notes:

### UAT-11

- Result:
- Date:
- Room:
- Organizer:
- Attendees:
- Microsoft booking evidence:
- Sync evidence:
- Odoo booking ID:
- Expected result:
- Actual result:
- Notes:

### UAT-12

- Result:
- Date:
- Room:
- Organizer:
- Attendees:
- Microsoft booking evidence:
- Sync evidence:
- Odoo booking ID:
- Expected result:
- Actual result:
- Notes:

### UAT-13

- Result:
- Date:
- Room:
- Organizer:
- Attendees:
- Microsoft booking evidence:
- Sync evidence:
- Odoo booking ID:
- Expected result:
- Actual result:
- Notes:

### UAT-14

- Result:
- Date:
- Microsoft booking evidence:
- Sync evidence:
- Expected result:
- Actual result:
- Notes:
