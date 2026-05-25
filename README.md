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
