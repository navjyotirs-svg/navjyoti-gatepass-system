# Project Context

**Project Name:** Navjyoti Digital Gate Pass  
**Organisation:** Navjyoti  

## Product Purpose
To provide a quick, simple, and professional way for visitors to request entry, and for employees/reception to approve or reject that entry, resulting in a digital gate pass.

## Problem Being Solved
Streamlining the visitor entry process by replacing paper logbooks with a simple QR-code driven digital form and an instant approval notification.

## Target Users
- **Visitors:** Scanning a QR code at the gate to fill out a brief entry form and take a photo.
- **Employees:** Receiving requests (via WhatsApp or manual reception flow) to approve or reject visitors.
- **Security/Reception (Admin):** Manually approving/rejecting if WhatsApp is not available or used.

## MVP Scope
- QR Code landing page with a visitor form (Name, Mobile, Person to Meet, Purpose, Photograph, Optional Company).
- Notification to the selected employee (via WhatsApp `wa.me` deep link) or Manual Approval by an admin.
- Generation of a Digital Gate Pass with Navjyoti Logo, Visitor Photo, Details, and QR Code.
- A simple, isolated Supabase backend for storing requests and employees.

## Non-MVP Scope
- Full Visitor Management System (VMS).
- HRMS functionality or attendance tracking.
- Complex multi-level approval workflows.
- Biometric integrations.
- User accounts for visitors.

## Major User Flow
Visitor arrives → Scans Gate QR → Gate Pass Form Opens → Visitor enters details → Visitor captures current photo → Visitor selects employee → Visitor enters meeting purpose → Request submitted → Selected employee is notified (WhatsApp notification OR Manual approval) → Approve / Reject → If Approved → Digital Gate Pass generated.

## Technology Direction
- **Frontend:** React / Next.js
- **Backend:** Supabase (PostgreSQL, Storage)

## Current Development Phase
Phase 0 — Foundation & Agent Training

> **IMPORTANT:** This project is a lightweight Digital Gate Pass Generator, not a complex visitor-management or HRMS system.
