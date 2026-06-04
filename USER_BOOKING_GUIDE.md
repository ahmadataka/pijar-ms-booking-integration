# User Booking Guide

## Purpose

This guide explains how to book meeting rooms in Microsoft Outlook so the booking can also be synchronized to the NBA / Odoo system for room access.

## What Happens When You Book a Room

When you create a room booking in Microsoft Outlook:

1. the meeting appears in your Outlook calendar
2. the selected meeting room is reserved in Microsoft
3. the integration syncs the booking to NBA / Odoo
4. NBA / Odoo generates room-access and check-in records for mapped users

Important:
- the sync is not instant to the second
- the system checks bookings on a schedule
- allow a few minutes for Odoo access records to appear

## Before You Book

Please make sure:

- you use the correct room from Room Finder
- the meeting time is in the future
- the attendees are entered correctly
- the room is one of the supported rooms in the Pijar office setup

If a user is not yet registered in Odoo, the booking may still exist in Outlook, but access generation for that user may not happen until the user is added in Odoo.

## Supported Booking Flow

Use Microsoft Outlook or Outlook Web.

Recommended flow:
- open Calendar
- create a new event
- add attendees
- open Room Finder
- choose the correct building and room
- send the invite

## Step-by-Step in Outlook

### 1. Open Calendar

Open:
- Outlook desktop, or
- Outlook Web

Go to:
- `Calendar`

### 2. Create a New Event

Click:
- `New Event`

Fill in:
- meeting title
- date
- start time
- end time

### 3. Add Attendees

Add the people who will attend the meeting.

Best practice:
- only include real attendees
- make sure their email addresses are correct

## 4. Add the Room

Click:
- `Room Finder`

Select:
- building: `Pijar Foundation HQ`

Then choose the correct room, for example:
- `Majapahit -JKT-PIJAR HQ`
- `Pajajaran -JKT-PIJAR HQ`
- `Samudera Pasai -JKT-PIJAR HQ`

Important:
- use the room entry from Outlook Room Finder
- do not type an arbitrary room name if the official room is already listed

## 5. Add Notes if Needed

You may add a short description or agenda in the meeting body.

This is optional for the sync, but useful for users.

## 6. Send the Invite

Click:
- `Send`

After that:
- the meeting is created in Outlook
- the room receives the booking request
- the sync service later mirrors it to Odoo

## What Users Should Expect

### In Outlook

Users should see:
- the meeting in their calendar
- the room listed in the event

### In Odoo / Access System

If the room and users are already mapped correctly:
- the meeting should be created in Odoo
- room-access/check-in records should be generated

## Recommended User Rules

To reduce sync problems, users should:

- always use the official Outlook room entry
- avoid editing old or already-finished bookings
- keep attendee emails accurate
- create bookings early enough before the meeting

## Known Limitations

A booking may not fully sync if:

- the room does not exist yet in Odoo
- one or more attendees do not exist yet in Odoo contacts
- the booking is already in the past

In these cases:
- the Outlook booking still exists
- but Odoo access generation may be skipped for some users

## If a Booking Does Not Appear in Odoo

Ask the operations or technical owner to check:

- whether the room is mapped in Odoo
- whether the attendees exist in Odoo contacts
- whether the sync runner is healthy

Useful details to share when reporting an issue:
- meeting title
- organizer email
- room name
- meeting date and time
- attendee emails

## Example Good Booking

- title: `Weekly Coordination`
- room: `Majapahit -JKT-PIJAR HQ`
- attendees: only the real participants
- time: future meeting slot

## Summary

For users, the correct habit is simple:

1. create the meeting in Outlook
2. choose the room from Room Finder
3. add the correct attendees
4. send the invite

The backend and Odoo sync happen after that in the background.
