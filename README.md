# PIJAR Microsoft Booking Integration Backend

## Purpose

This service will:
- receive or fetch booking information from Microsoft 365 / Microsoft Graph
- normalize it into an internal booking model
- persist or log the normalized result
- later, call NBA Smart Office / Odoo API to provision physical access

## Execution Plan

### This Week

Focus only on Microsoft-side ingestion:
- project skeleton
- configuration loading
- room and booking data model
- manual Microsoft fetch flow
- logging and inspection endpoints

### Next Week

Add Odoo integration:
- Odoo API client
- room mapping to Odoo room IDs
- access provision / update / revoke flow

## MVP Scope

### In Scope Now
- read room resources from Microsoft
- read booking events from Microsoft
- normalize booking payloads
- expose the results for inspection

### Out of Scope Now
- QR / kiosk
- guest automation
- Wi-Fi automation
- access execution in Odoo

## Proposed Stack

Use a lightweight Node.js service with:
- plain JavaScript
- minimal dependencies
- HTTP server
- environment-based configuration

This is chosen for speed and ease of debugging during the first week.

## Current Test Commands

Fetch pilot rooms:

```bash
node src/scripts/fetchRooms.js
```

Fetch bookings for a room in a given window:

```bash
node src/scripts/fetchBookings.js <roomEmail> <startIso> <endIso>
```

Example:

```bash
node src/scripts/fetchBookings.js "Majapahit-JKT-PIJARHQ@yayasanpijarmasadepan.onmicrosoft.com" "2026-05-29T00:00:00Z" "2026-05-30T00:00:00Z"
```

Fetch a pilot snapshot across all pilot rooms:

```bash
node src/scripts/fetchPilotSnapshot.js <startIso> <endIso>
```

Example:

```bash
node src/scripts/fetchPilotSnapshot.js "2026-05-29T00:00:00Z" "2026-06-01T00:00:00Z"
```

Build an Odoo handoff preview from the same pilot snapshot:

```bash
node src/scripts/buildOdooHandoffPreview.js <startIso> <endIso>
```

Example:

```bash
node src/scripts/buildOdooHandoffPreview.js "2026-05-29T00:00:00Z" "2026-06-01T00:00:00Z"
```

Use `room-mappings.example.json` as the starting point for mapping Microsoft room emails to future Odoo room IDs and controller IDs.

Build a more Odoo-shaped access payload preview:

```bash
node src/scripts/buildOdooAccessPayloadPreview.js <startIso> <endIso>
```

Example:

```bash
node src/scripts/buildOdooAccessPayloadPreview.js "2026-05-29T00:00:00Z" "2026-06-01T00:00:00Z"
```

Use `user-mappings.example.json` as the starting point for mapping Microsoft attendees to future Odoo user and partner IDs.

Build a preview of the `POST /api/v1/bookings` payloads that would be sent to Odoo:

```bash
node src/scripts/buildOdooBookingPayloadPreview.js <startIso> <endIso>
```

Example:

```bash
node src/scripts/buildOdooBookingPayloadPreview.js "2026-05-29T00:00:00Z" "2026-06-01T00:00:00Z"
```

Dry-run one room sync into Odoo bookings:

```bash
node src/scripts/syncBookingToOdoo.js <roomEmail> <startIso> <endIso>
```

Example:

```bash
node src/scripts/syncBookingToOdoo.js "Majapahit-JKT-PIJARHQ@yayasanpijarmasadepan.onmicrosoft.com" "2026-05-29T00:00:00Z" "2026-06-01T00:00:00Z"
```

Execute the real create call only when you are ready:

```bash
node src/scripts/syncBookingToOdoo.js "Majapahit-JKT-PIJARHQ@yayasanpijarmasadepan.onmicrosoft.com" "2026-05-29T00:00:00Z" "2026-06-01T00:00:00Z" --execute
```

Test a minimal Odoo booking create payload with a future datetime:

```bash
node src/scripts/createMinimalOdooBookingTest.js <roomId> <organizerId> <startDatetime> <endDatetime>
```

Example:

```bash
node src/scripts/createMinimalOdooBookingTest.js 2 87 "2026-05-30 09:00:00" "2026-05-30 11:00:00"
```

## Odoo Setup

Add these values to your local `.env`:

```env
ODOO_BASE_URL=
ODOO_DATABASE=
ODOO_LOGIN=
ODOO_PASSWORD=
```

Fetch Odoo areas:

```bash
node src/scripts/fetchOdooAreas.js
```

Fetch Odoo contacts:

```bash
node src/scripts/fetchOdooContacts.js
```
