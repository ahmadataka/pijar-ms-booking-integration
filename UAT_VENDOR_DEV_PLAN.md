# Vendor Dev UAT Plan

## Purpose

This document explains how to run interim UAT while the API is still hosted on the vendor development environment instead of the final target machine.

This phase is intended to validate:

- Microsoft-to-Odoo API behavior
- sync logic and mapping behavior
- booking lifecycle handling
- scheduled sync runner behavior

This phase is not intended to fully validate:

- final on-prem or target-machine deployment
- final hardware controller behavior on the target environment
- final production data completeness

## UAT Phase Name

Recommended name:

- `Vendor Dev API UAT`

## Objective

The objective of this phase is to confirm that the integration behaves correctly against the current Odoo API endpoint before the API is installed on the final machine.

## What This Phase Can Prove

- booking create works
- booking replace/update logic works
- booking cancel behavior can be validated
- room mapping logic works
- attendee mapping logic works
- unmapped users and rooms are reported clearly
- scheduled sync runner works from the VM
- approval-required behavior can be validated at the workflow level

## What This Phase Cannot Fully Prove Yet

- final environment networking on the target machine
- final hardware access activation on the final machine
- final room configuration on the real production environment
- final operational ownership on the target environment

## In-Scope UAT Cases for Vendor Dev

These cases should be executed now:

- `UAT-01` Normal room booking
- `UAT-02` Normal room update
- `UAT-03` Normal room cancellation
- `UAT-04` Mapped attendee set
- `UAT-05` Unmapped attendee
- `UAT-06` Unmapped room
- `UAT-07` Normal room repeated sync
- `UAT-08` Approval room request created
- `UAT-09` Approval room pending
- `UAT-10` Approval room approved in Microsoft
- `UAT-11` Approval room rejected in Microsoft
- `UAT-12` Approval room canceled after approval
- `UAT-13` Multiple mapped rooms
- `UAT-14` Daily scheduled sync

## Acceptance Standard for This Phase

Vendor Dev API UAT is considered successful when:

- normal room lifecycle scenarios pass
- mapped rooms and mapped users synchronize correctly
- unmapped cases are explicit and traceable
- approval-required scenarios are validated with Microsoft as the approval source
- the VM scheduled sync runs reliably
- no critical duplicate-creation issue remains

## Known Constraints in This Phase

- some users may still be missing from Odoo contacts
- some rooms may still be missing from Odoo mappings
- approval-required rooms may need business rule confirmation in Microsoft
- some access behavior might still depend on vendor dev data and config

## Recommended Execution Order

Run the cases in this order:

1. `UAT-01`
2. `UAT-02`
3. `UAT-03`
4. `UAT-07`
5. `UAT-05`
6. `UAT-06`
7. `UAT-08` to `UAT-12`
8. `UAT-13`
9. `UAT-14`

## Recommended Output of This Phase

At the end of Vendor Dev API UAT, you should have:

- a pass/fail result for each scenario
- a list of mapping gaps
- a list of policy gaps
- a list of production-environment tasks for the final target machine

## Transition to Next Phase

After Vendor Dev API UAT is complete, the next phase should be:

- `Final Environment UAT`

That later phase should validate:

- API installed on the target machine
- final environment networking
- final hardware access behavior
- final operations workflow
