# Changelog

## [Phase 5] - 2026-08-15
### Added
- Created Phase 5 migration `20260815000002_phase5_requests.sql` to add `request_reference` with strict target type constraints.
- Dropped anonymous insert permission on `gate_pass_requests` to prevent untrusted creation.
- Created `submitVisitorRequest` server action for secure, server-side data validation and database insertion.
- Created Pending Approval screen (`/visit/status/[requestId]`) to display request reference and status.
- Implemented secure server-side WhatsApp link generation (`/api/whatsapp/[requestId]`) to prevent client-side exposure of employee phone numbers.

### Changed
- Modified `/visit/review/page.tsx` to handle server-side request submission securely and display submission state cleanly.

## [Phase 4] - 2026-08-15
### Added
- Created `HostSelection`, `HostNotificationCapability`, and `ApprovalNotificationData` types to securely handle employee routing types.
- Implemented `EmployeeSelector` with grouping for HR/Departments and individual employees.
- Implemented secure server-only function `resolveHostForNotification` to safely retrieve and normalize mobile numbers for WhatsApp integration (Phase 5).
- Created `supabaseServer` client using `SUPABASE_SERVICE_ROLE_KEY` to query private mobile details safely.
- Wrote SQL migration `20260815000001_phase4_security.sql` to explicitly block public read access to the base `employees` table, enforcing privacy.

### Changed
- Updated `VisitorForm` and `visitorSchema` to manage a discriminated object for host selection (employee vs department) in session storage.
- Re-architected `/visit/review` to fetch and render the visitor state accurately, hiding any private mobile numbers.

## [Phase 3] - 2026-08-14
### Added
- Live photo capture and review system.
- Direct upload to Supabase Storage `visitor-photos` bucket.
