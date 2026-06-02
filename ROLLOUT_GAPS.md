# Rollout Gaps

## Proven Working

- Microsoft room discovery
- Microsoft booking ingestion
- Odoo booking create
- Odoo attendee propagation through `guest_contact_ids`
- Multi-room sync across mapped rooms
- Replacement flow for bookings when Odoo does not support in-place update

## Pilot Rooms Already Validated

- `Majapahit-JKT-PIJARHQ@yayasanpijarmasadepan.onmicrosoft.com`
- `SamuderaPasai-JKT-PIJARHQ@yayasanpijarmasadepan.onmicrosoft.com`

## Deferred Rooms / Data Gaps

### Missing Odoo Contacts

- `krismenda@pijarfoundation.org`
- `hans@pijarfoundation.org`
- `ck@pijarfoundation.org`
- `owen@pijarfoundation.org`
- `astri@pijarfoundation.org`

### Missing or Unconfirmed Odoo Room Mappings

- `Mataram-JKT-PIJARHQ@yayasanpijarmasadepan.onmicrosoft.com`
- `Tarumanagara-JKT-PIJARHQ@yayasanpijarmasadepan.onmicrosoft.com`
- `RuangTamu@yayasanpijarmasadepan.onmicrosoft.com`

## Operational Follow-Ups

- Decide where the production sync runner will be hosted
- Decide how often the sync should run
- Assign ownership for:
  - Odoo room master data
  - Odoo contact master data
  - sync monitoring and incident response
- Add monitoring for failed sync runs and failed room mappings

## Recommended Immediate Rollout Sequence

1. Keep `Majapahit` and `Samudera Pasai` as the confirmed pilot rooms
2. Add missing Odoo contacts for `Singhasari`
3. Confirm or create missing Odoo rooms for `Mataram`, `Tarumanagara`, and `Ruang Tamu`
4. Move the production sync runner onto a scheduled host
5. Turn on regular sync execution
