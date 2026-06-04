# VM Runbook

## Purpose

This runbook explains how to operate the production sync runner on the DigitalOcean VM.

Current production host:
- `142.93.124.186`

Current SSH user:
- `root`

Application path on the VM:
- `/root/pijar-ms-booking-integration`

## What Runs on the VM

The VM runs the Microsoft-to-Odoo sync runner:

- fetch Microsoft room bookings
- map rooms and attendees
- create or reconcile Odoo bookings
- let Odoo generate downstream access and check-in records

## Important Files

On the VM:

- app directory:
  - `/root/pijar-ms-booking-integration`
- environment file:
  - `/root/pijar-ms-booking-integration/.env`
- sync state:
  - `/root/pijar-ms-booking-integration/data/sync-state.json`
- last production run:
  - `/root/pijar-ms-booking-integration/data/last-production-sync.json`
- cron log:
  - `/root/pijar-ms-booking-integration/cron.log`

## Connect to the VM

From your local machine:

```bash
ssh root@142.93.124.186
```

## Current Cron Schedule

The sync runs every 5 minutes using `crontab`.

Current cron entry:

```cron
*/5 * * * * cd /root/pijar-ms-booking-integration && /usr/bin/npm run sync:execute >> /root/pijar-ms-booking-integration/cron.log 2>&1
```

Check it with:

```bash
crontab -l
```

## Manual Commands

From inside the app directory:

```bash
cd /root/pijar-ms-booking-integration
```

Dry-run:

```bash
npm run sync:dry-run
```

Execute:

```bash
npm run sync:execute
```

## Health Checks

Check the latest log lines:

```bash
tail -n 50 /root/pijar-ms-booking-integration/cron.log
```

Check the latest recorded production result:

```bash
cat /root/pijar-ms-booking-integration/data/last-production-sync.json
```

Check whether cron is installed:

```bash
crontab -l
```

## Update the App

On the VM:

```bash
cd /root/pijar-ms-booking-integration
git pull origin main
npm install
```

After updating, run a dry-run first:

```bash
npm run sync:dry-run
```

If the output looks healthy:

```bash
npm run sync:execute
```

## Update Environment Variables

Edit:

```bash
nano /root/pijar-ms-booking-integration/.env
```

After updating secrets or config, run:

```bash
cd /root/pijar-ms-booking-integration
npm run sync:dry-run
```

## Common Operational Cases

### 1. Booking does not sync

Check:
- room is mapped in `room-mappings.example.json`
- attendees exist in Odoo contacts
- sync output is not reporting `not-ready`

Then inspect:

```bash
tail -n 100 /root/pijar-ms-booking-integration/cron.log
```

### 2. Booking is skipped as `not-ready`

This usually means one of these:
- organizer is not mapped to an Odoo contact
- one or more guest attendees are not mapped
- room exists in Microsoft but not in Odoo mapping

Action:
- confirm the email exists in Odoo contacts
- update the mapping files in the repo
- deploy updated repo to the VM

### 3. Booking is skipped as `past-booking`

This is expected behavior.
The sync intentionally avoids creating already-finished bookings in Odoo.

## Security Notes

- Do not paste `.env` contents into chat or public tickets.
- Rotate secrets if they were exposed:
  - `MS_CLIENT_SECRET`
  - `ODOO_PASSWORD`
- Prefer a dedicated Odoo service account for long-term production use.

## Rollout Dependencies Still Open

See:

- [ROLLOUT_GAPS.md](./ROLLOUT_GAPS.md)

Main unresolved items currently include:
- missing Odoo contacts for some Microsoft attendees
- missing or unconfirmed Odoo room mappings for some rooms

## Recommended Ownership

Suggested ownership split:

- operations team:
  - Odoo room master data
  - Odoo contact master data
- technical owner:
  - VM health
  - cron
  - deployment updates
  - sync troubleshooting
