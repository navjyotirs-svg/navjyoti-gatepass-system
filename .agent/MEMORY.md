# Project Memory

This file contains permanent project requirements that future agents must remember.

**Organisation:** Navjyoti  

**Project:** Navjyoti Digital Gate Pass  

**Current direction:** Simple Digital Gate Pass Generator  

**Supabase:** Separate Supabase project  

**Configured visitor destinations:**
- HR
- Mr. Gurusharan Khurana: +919810615904
- Jaykishor Singh: +917505633328
- Jai Kumar: +919193618538
- Gurpreet: No mobile currently provided
- Rahul Kumar: +917302614061
- Vipan: No mobile currently provided

**Core workflow:**  
Scan QR → visitor form → photograph → employee selection → meeting purpose → WhatsApp/manual approval → gate pass generation  

**Approval:**  
WhatsApp + manual option  

**Gate Pass:**  
Must contain visitor photograph  

## Phase 5 Rules:
- Visitor requests are created only as pending.
- Visitor photo is mandatory.
- Employee selection is revalidated server-side.
- HR is the only current department-level target.
- Public visitor cannot approve or reject requests.
- Employee notification destination is resolved server-side.
- Request creation happens before notification.
- WhatsApp routing URL does NOT expose mobile number to the client (handled via API redirect).

### Phase 7: Gate Pass & Export
- Gate pass is issued ONLY after the request status is `approved`.
- Gate pass number is immutable and idempotent; repeated generations yield the same stable pass number and verification token.
- QR verification uses server-side HMAC hashing; the QR code does not contain plaintext visitor PII.
- Visitor photos remain private (`public = false`); a signed URL is generated via Server Action (`getPhotoSignedUrl`) for viewing.
- Visitors can download PNG/PDF and print the approved pass using lightweight client libraries (`html-to-image`, `jspdf`).
- Pending/rejected requests strictly cannot receive valid passes and are blocked from the `/pass` route.

## Phase 4 Rules:
- Employee mobile numbers are private.
- Employees without mobile remain selectable.
- HR is a department-level selection.
- HR currently uses manual notification.
- Employee selections are related using employee_id.
- Department selections are explicitly typed.
- WhatsApp destination is resolved server-side.

## Do not:
- Turn application into a full VMS
- Introduce HRMS functionality
- Create unnecessary complex modules
- Modify external production databases

## Implementation Facts
- **Frontend framework:** Next.js (App Router), TypeScript, Tailwind CSS (v4)
- **Supabase connection:** Foundation established.
- **Actual table names:** `employees`, `gate_pass_requests`
- **Safe employee-directory strategy:** Public view `public_employee_directory`. The `employees` table has public SELECT completely dropped to enforce privacy of mobile numbers.
- **Request Insertion Strategy:** Only our trusted Server Action (`submitRequest.ts`) using the Service Role Key can insert records into `gate_pass_requests` due to strict RLS policies.
- **Visitor Form:** Built at `/visit` route using `zod` and `react-hook-form`. Includes a searchable combobox for employee/department selection.
- **State Persistence:** Form data saved temporarily to `sessionStorage`. Selection state holds discriminated type (employee vs department).
- **UI Design:** Used Stitch MCP Server to generate the responsive mobile-first form layout.
- **Photo Capture (Phase 3):** Device camera accessed via `navigator.mediaDevices.getUserMedia()`. Uploaded securely directly to Supabase `visitor-photos` bucket using anonymous inserts.
