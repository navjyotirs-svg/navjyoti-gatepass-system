# Development Roadmap

## Phase 0 — Foundation & Agent Training
Documentation, architecture, memory, standards, Supabase planning.

## Phase 1 — Project Setup & Supabase
Create application, configure new Supabase project, environment variables, database schema and initial employee.

## Phase 2 — Visitor Form
QR landing page and visitor information form.

## Phase 3 — Camera & Photograph
Live photo capture, preview and Supabase Storage.

## Phase 4 — Employee Selection
Employee database integration and selectable host.

## Phase 5 — Request Submission
Create pending gate-pass request.

- [x] **Phase 6: Admin/Employee Approval & Rejection Logic**
  - Implement secure employee verification.
  - Implement approval/rejection endpoints.
  - Test the state transitions.

- [x] **Phase 7: Final Gate Pass UI, QR Generation & PDF/PNG Download**
  - Render the final digital card with visitor details and photo.
  - Generate a secure QR code encoding pass validation URL.
  - Create the validation route (`/verify/[passNumber]`).
  - Add client-side PDF/PNG export using `html-to-image`/`jspdf`.

- [ ] **Phase 8: Project Finalisation & Documentation (Pending)**
Security verification, mobile testing, production build and deployment.
