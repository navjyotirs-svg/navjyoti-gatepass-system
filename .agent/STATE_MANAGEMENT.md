# State Management

Keep state architecture simple.

**Prefer:**
- React local state (for form inputs, UI toggles).
- Server state via Supabase (fetching employees, request status).

**Do not introduce Redux** unless the application later becomes complex enough to justify it.

## Key State Areas
- Visitor form state
- Selected employee
- Photograph state
- Request status
- Gate-pass result
