# Supabase Rules

The gate-pass application will use its own Supabase project.

## Secret Management
- **Never** store `service_role`, database password, or private API secrets inside frontend code.
- Frontend may use `Supabase Project URL` and `Publishable / Anon Key` provided proper Row Level Security is configured.
- Secrets must be accessed through environment variables.
- Example naming: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Auth Strategy
- Supabase Auth will be used exclusively for admin/reception access.
- Visitors do NOT require accounts.

## Row Level Security (RLS) Strategy
- RLS must be enabled on all tables.
- `gate_pass_requests`:
  - Visitors can `insert` requests.
  - Visitors can `select` their own request (using ID returned upon insertion).
  - Admins can `select`, `update` all requests.
- `employees`:
  - Public can `select` active employees (to populate the form dropdown).
  - Admins can `insert`, `update`, `delete`.

## Storage Strategy
- A dedicated bucket for `visitor-photos`.
- Bucket should allow public `insert` but restrict `update`/`delete`.
- Photos should be publicly readable for rendering the gate pass, or handled via signed URLs depending on strict security needs (default public read is fine for MVP passes, but requires unique, unguessable filenames).

## Environment Management & Migration
- Local development should use a local Supabase instance or a dedicated staging remote project.
- Migrations should be tracked via Supabase CLI (`supabase migration new ...`).
- Production must use a separate Supabase project.
