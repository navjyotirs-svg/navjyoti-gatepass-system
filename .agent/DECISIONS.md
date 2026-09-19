# Architecture Decision Log

**DEC-001**
- **Decision:** Use separate Supabase project.
- **Reason:** To keep visitor data isolated from the main HRMS.
- **Consequences:** Easier to secure, separate deployment pipeline.
- **Date:** Phase 0
- **Status:** Accepted

**DEC-002**
- **Decision:** Gate Pass remains lightweight rather than becoming a full Visitor Management System.
- **Reason:** MVP speed and simplicity.
- **Consequences:** Avoids feature bloat.
- **Date:** Phase 0
- **Status:** Accepted

**DEC-003**
- **Decision:** Support both WhatsApp notification and manual approval.
- **Reason:** WhatsApp may not always be available or appropriate for all admins.
- **Consequences:** Need dual workflow in UI.
- **Date:** Phase 0
- **Status:** Accepted

**DEC-004**
- **Decision:** Visitor photograph is required for the gate pass.
- **Reason:** Security verification.
- **Consequences:** Requires camera permission and storage.
- **Date:** Phase 0
- **Status:** Accepted

**DEC-005**
- **Decision:** Do not duplicate or access the existing HRMS database during initial implementation.
- **Reason:** Maintain separation of concerns and avoid exposing internal data.
- **Consequences:** Employees must be manually added to the gate pass system initially.
- **Date:** Phase 0
- **Status:** Accepted

**DEC-006**
- **Decision:** Start testing with Jaykishor Singh only.
- **Reason:** Prevent polluting the database with fake data.
- **Consequences:** Only one employee in initial test data.
- **Date:** Phase 0
- **Status:** Accepted

**DEC-007**
- **Decision:** Do not require visitors to create accounts.
- **Reason:** Frictionless entry.
- **Consequences:** Session management must rely on local state or pass tokens.
- **Date:** Phase 0
- **Status:** Accepted

**DEC-008**
- **Decision:** Host selection persists discriminated state (`type: employee` vs `type: department`).
- **Reason:** Supports flexible notification routing, such as a fallback HR department when an employee is unavailable.
- **Consequences:** Form schema and data shapes must support unions.
- **Date:** Phase 4
- **Status:** Accepted

**DEC-009**
- **Decision:** Employee mobile numbers must be restricted from public view and resolved purely server-side.
- **Reason:** Enforce privacy and prevent extraction of employee contact data by anonymous users.
- **Consequences:** Public RLS reads on `employees` are blocked; frontend uses a restricted view, backend uses Service Role key for mobile lookup.
- **Date:** Phase 4
- **Status:** Accepted
