# UAT Checklist

## Purpose

This document defines the user acceptance testing checklist for the Microsoft-to-Odoo room booking integration.

Target operating model:

- Microsoft is the source of truth for booking
- Microsoft is the source of truth for approval
- Odoo / NBA is only the downstream execution layer for room access and check-in artifacts

Important rule:

- approval should not remain in Odoo
- for approval-required rooms, only Microsoft-approved bookings should be synchronized into Odoo

## Scope

This UAT covers:

- booking creation
- booking update
- booking cancellation
- mapped and unmapped users
- mapped and unmapped rooms
- approval-required room scenarios
- sync idempotency
- daily operational sync behavior

## Roles

- `User`: creates or edits booking in Microsoft
- `Ops`: validates business behavior and room approval flow
- `Tech`: validates sync, logs, mappings, and Odoo result

## Pass Criteria

The integration is accepted when:

- normal room bookings synchronize correctly from Microsoft to Odoo
- updates and cancellations are handled correctly
- unmapped users or rooms are clearly reported
- approval-required rooms only synchronize after Microsoft approval
- Odoo is not used as the approval workflow
- repeated sync runs do not create duplicates

## UAT Scenarios

| ID | Scenario | Steps | Expected Result | Owner | Status | Notes |
|---|---|---|---|---|---|---|
| UAT-01 | Normal room booking | Create a future booking in Microsoft for a mapped room with mapped attendees | Booking appears in Outlook, sync creates Odoo booking, Odoo generates access/check-in records | User + Tech |  |  |
| UAT-02 | Normal room update | Update time, subject, or attendees in Microsoft for an existing future booking | Odoo booking is updated or replaced correctly without duplicate booking creation | User + Tech |  |  |
| UAT-03 | Normal room cancellation | Cancel a synced future booking in Microsoft | Odoo booking is removed or invalidated and access is no longer active | User + Tech |  |  |
| UAT-04 | Mapped attendee set | Create a booking where all attendees already exist in Odoo contacts | Sync completes cleanly with no `not-ready` issues | User + Tech |  |  |
| UAT-05 | Unmapped attendee | Create a booking with one attendee who does not exist in Odoo contacts | Sync reports the booking as blocked or partially not-ready in a clear way; no silent failure | User + Tech |  |  |
| UAT-06 | Unmapped room | Create a booking for a Microsoft room that is not yet mapped to Odoo | Sync skips or blocks the booking with clear room mapping information | User + Tech |  |  |
| UAT-07 | Normal room repeated sync | Run sync multiple times for the same unchanged booking | No duplicate Odoo booking is created; later syncs become `noop` | Tech |  |  |
| UAT-08 | Approval room request created | Create a future booking in Microsoft for an approval-required room such as the auditorium | Booking exists in Microsoft but does not immediately create Odoo access if approval is still pending | User + Ops + Tech |  | Confirm exact room name first |
| UAT-09 | Approval room pending | Leave the approval-required Microsoft booking unapproved | No Odoo access should be active yet; Odoo should not become the approval authority | Ops + Tech |  |  |
| UAT-10 | Approval room approved in Microsoft | Approve the pending room booking in Microsoft | Sync creates the Odoo booking only after Microsoft approval is complete | Ops + Tech |  | Core target behavior |
| UAT-11 | Approval room rejected in Microsoft | Reject the room request in Microsoft | No Odoo booking or hardware access should be created | Ops + Tech |  |  |
| UAT-12 | Approval room canceled after approval | Approve in Microsoft, allow sync, then cancel the booking in Microsoft | Odoo booking and access are revoked or invalidated after cancellation | User + Ops + Tech |  |  |
| UAT-13 | Multiple mapped rooms | Run sync across several mapped rooms with valid bookings | Healthy rooms sync correctly; only real mapping gaps remain blocked | Tech |  |  |
| UAT-14 | Daily scheduled sync | Let the production VM run on schedule and inspect logs | Scheduled sync runs successfully and writes logs/results without manual intervention | Tech |  |  |

## Test Data Guidance

Recommended known-good rooms for normal-room UAT:

- `Majapahit -JKT-PIJAR HQ`
- `Pajajaran -JKT-PIJAR HQ`
- `Samudera Pasai -JKT-PIJAR HQ`

Recommended mapped users for clean tests:

- `Ataka`
- `Atik`
- `Cazadira`
- `Anthony`
- `Cindy`
- `Calvin`

Avoid using known-unmapped users for success-path tests unless the scenario is specifically testing mapping failure.

## Approval-Specific Validation

For approval-required rooms, validate these points carefully:

1. the booking request is made in Microsoft
2. the booking approval decision is made in Microsoft
3. the integration only syncs once Microsoft approval is final
4. Odoo does not act as the business approval workflow
5. Odoo only translates approved bookings into access-related records

## Evidence to Capture

For each test case, capture:

- screenshot or record of the Microsoft booking
- time and date of the test
- room name
- attendee list
- sync output or log snippet
- Odoo booking ID if created
- pass/fail result
- notes on mismatches or issues

## Defect Logging Template

When a case fails, record:

- UAT ID
- date/time
- room
- organizer
- attendees
- expected result
- actual result
- sync log excerpt
- Odoo booking ID if any

## Recommended Execution Order

Run UAT in this order:

1. `UAT-01` normal room booking
2. `UAT-02` normal room update
3. `UAT-03` normal room cancellation
4. `UAT-07` repeated sync / idempotency
5. `UAT-05` unmapped attendee
6. `UAT-06` unmapped room
7. `UAT-08` to `UAT-12` approval-required room flow
8. `UAT-13` multi-room run
9. `UAT-14` scheduled VM sync check

## Sign-Off Recommendation

The system should only move beyond pilot when:

- normal-room lifecycle scenarios pass
- approval-required room behavior is confirmed with Microsoft as the approval authority
- no critical duplicate or cancellation issues remain
- VM scheduled sync is stable
- unresolved mapping gaps are accepted or assigned with owners
