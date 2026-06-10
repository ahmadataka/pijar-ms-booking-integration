# UAT Execution Guide

## Purpose

This guide gives step-by-step instructions for executing each UAT case in the Microsoft-to-Odoo booking integration.

Use this together with:

- [UAT_CHECKLIST.md](./UAT_CHECKLIST.md)
- [UAT_VENDOR_DEV_PLAN.md](./UAT_VENDOR_DEV_PLAN.md)

## General Preparation

Before running any case, confirm:

- the sync VM is running
- cron is active on the VM
- the room you want to test is already mapped in Odoo
- the attendee emails you want to test are either intentionally mapped or intentionally unmapped depending on the scenario

Recommended known-good rooms:

- `Majapahit -JKT-PIJAR HQ`
- `Pajajaran -JKT-PIJAR HQ`
- `Samudera Pasai -JKT-PIJAR HQ`

Recommended known-good attendees:

- `Ataka`
- `Atik`
- `Cazadira`
- `Anthony`
- `Cindy`
- `Calvin`

## Standard Evidence to Capture

For every UAT case, capture:

- Microsoft booking screenshot
- room name
- organizer
- attendee list
- date and time
- sync log or sync output
- Odoo booking ID if created
- pass/fail result

## UAT-01 Normal Room Booking

Goal:
- verify that a standard future Microsoft booking syncs into Odoo

Steps:
1. Create a future booking in Microsoft using a mapped room such as `Majapahit`
2. Add only mapped attendees
3. Send the invite
4. Wait for the sync schedule, or run the sync manually
5. Inspect sync output or VM logs
6. Confirm an Odoo booking ID is created

Expected result:
- booking exists in Outlook
- booking is created in Odoo
- sync output shows `create` first and later `noop`

## UAT-02 Normal Room Update

Goal:
- verify that changes in Microsoft are reconciled correctly in Odoo

Steps:
1. Start from a successfully synced future booking
2. Update one of these in Microsoft:
   - time
   - subject
   - attendee list
3. Save the meeting update
4. Wait for sync or run sync manually
5. Review the sync output

Expected result:
- Odoo booking is updated or replaced correctly
- no duplicate booking remains active for the same event

## UAT-03 Normal Room Cancellation

Goal:
- verify that cancellation in Microsoft is reflected in Odoo

Steps:
1. Start from a successfully synced future booking
2. Cancel the booking in Microsoft
3. Wait for sync or run sync manually
4. Review the sync output and Odoo booking status

Expected result:
- the Odoo booking is deleted, invalidated, or otherwise no longer treated as active

## UAT-04 Mapped Attendee Set

Goal:
- verify the clean success path where all attendees already exist in Odoo

Steps:
1. Create a new future booking in a mapped room
2. Add only mapped attendees
3. Send the invite
4. Run sync
5. Review output

Expected result:
- no `not-ready` issue
- Odoo booking created cleanly

## UAT-05 Unmapped Attendee

Goal:
- verify system behavior when one attendee is missing from Odoo

Steps:
1. Create a new future booking in a mapped room
2. Add at least one attendee known to be unmapped
3. Send the invite
4. Run sync
5. Review output

Expected result:
- sync reports a clear `not-ready` or missing-attendee state
- no silent failure

## UAT-06 Unmapped Room

Goal:
- verify system behavior for a Microsoft room that is not mapped in Odoo

Steps:
1. Create a booking using a room known to be unmapped
2. Use mapped attendees if possible
3. Send the invite
4. Run sync
5. Review output

Expected result:
- sync skips or blocks the booking with a clear room mapping issue

## UAT-07 Normal Room Repeated Sync

Goal:
- verify idempotency

Steps:
1. Start from a booking that has already synced successfully
2. Run sync again without changing the Microsoft booking
3. Review the output

Expected result:
- later syncs show `noop`
- no duplicate Odoo booking is created

## UAT-08 Approval Room Request Created

Goal:
- verify initial behavior for a room that requires approval

Steps:
1. Confirm which Microsoft room is the approval-required room
2. Create a future booking in that room
3. Do not approve it yet in Microsoft
4. Run sync

Expected result:
- booking exists in Microsoft
- Odoo should not become the approval authority
- if your target rule is strict, Odoo should not yet receive active access behavior

## UAT-09 Approval Room Pending

Goal:
- verify that pending approval does not act like final approval

Steps:
1. Keep the approval-required room booking unapproved in Microsoft
2. Run sync again
3. Review the result

Expected result:
- no final approved access behavior should happen while approval is still pending

## UAT-10 Approval Room Approved in Microsoft

Goal:
- verify that Microsoft approval triggers the downstream Odoo sync

Steps:
1. Approve the pending room booking in Microsoft
2. Run sync
3. Review logs and resulting Odoo booking

Expected result:
- Odoo booking is created only after Microsoft approval is final

## UAT-11 Approval Room Rejected in Microsoft

Goal:
- verify that rejected Microsoft approval does not create downstream access

Steps:
1. Create or use a pending approval-required booking
2. Reject it in Microsoft
3. Run sync
4. Review logs

Expected result:
- no Odoo booking or active downstream access is created

## UAT-12 Approval Room Canceled After Approval

Goal:
- verify that approved bookings still honor cancellation

Steps:
1. Start from a Microsoft-approved booking that already synced
2. Cancel it in Microsoft
3. Run sync
4. Review logs and resulting Odoo state

Expected result:
- Odoo booking is removed or invalidated

## UAT-13 Multiple Mapped Rooms

Goal:
- verify that mapped-room bulk sync works across several rooms

Steps:
1. Create or use valid test bookings across several mapped rooms
2. Run the mapped-room sync or production sync
3. Review each room result

Expected result:
- healthy rooms sync
- only real mapping issues are blocked

## UAT-14 Daily Scheduled Sync

Goal:
- verify that the VM automation is healthy

Steps:
1. Confirm cron is installed on the VM
2. Wait for at least one scheduled cycle
3. Review `cron.log`
4. Review `last-production-sync.json`

Expected result:
- scheduled sync runs without manual intervention
- logs and last-run output are updated

## Useful Commands

On the VM:

```bash
cd /root/pijar-ms-booking-integration
npm run sync:dry-run
npm run sync:execute
tail -n 100 cron.log
cat data/last-production-sync.json
crontab -l
```

## Execution Notes

- for success-path tests, use only mapped rooms and mapped users
- for failure-path tests, use one intentional unmapped input at a time
- keep test bookings in the future
- avoid changing too many variables in one test case
