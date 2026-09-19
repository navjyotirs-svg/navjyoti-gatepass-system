# Security Guidelines

## Mandatory Rules
- Never expose `service_role`.
- Never hardcode credentials.
- Never disable RLS casually.
- Validate user input.
- Sanitize output.
- Validate uploaded images.
- Restrict image size.
- Restrict accepted file types.
- Do not expose internal employee data unnecessarily.
- Visitor should only see selectable employee information.
- Do not expose all employee phone numbers publicly.
- Never store sensitive data in QR payload (QR should eventually use a pass ID/token).
- Prevent arbitrary record updates from the public visitor page.
- Admin approval must require authorization.
- Maintain minimal personal-data collection.

> **CRITICAL:** A visitor must never be able to approve their own gate pass through direct API manipulation.
