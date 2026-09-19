# Database Schema

Recommended MVP tables. Do not create the actual schema during Phase 0 unless repository tooling absolutely requires placeholders.

## `employees`
```text
id (uuid, primary key)
name (text)
mobile (text)
department (text, nullable)
active (boolean, default true)
created_at (timestamp)
updated_at (timestamp)
```

## `gate_pass_requests`
```text
id (uuid, primary key)
visitor_name (text)
visitor_mobile (text)
visitor_company (text, nullable)
visitor_photo_url (text)
employee_id (uuid, references employees.id)
purpose (text)
status (text: 'pending', 'approved', 'rejected')
pass_number (text, unique)
created_at (timestamp)
approved_at (timestamp, nullable)
rejected_at (timestamp, nullable)
```

## Potential Optional Future Table
```text
admins / profiles
```

## Relationships & Indexes
- `gate_pass_requests.employee_id` belongs to `employees.id`.
- Index on `gate_pass_requests.status` for quick filtering of pending requests.
- Index on `gate_pass_requests.pass_number` for quick QR lookups.
