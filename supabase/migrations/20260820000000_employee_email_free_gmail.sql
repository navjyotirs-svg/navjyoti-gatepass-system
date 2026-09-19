-- Free Gmail plan: add email to employees for approval notifications via SMTP (100/day free, 0 cost)
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS email TEXT;

-- Allow service_role to read email (already full access via service_role, but ensure view updated)
DROP VIEW IF EXISTS public.public_employee_directory;
CREATE OR REPLACE VIEW public.public_employee_directory AS
SELECT id, name, department
FROM employees
WHERE active = TRUE;

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);

-- Update notification_attempts comment to include 'email' channel (free Gmail)
COMMENT ON TABLE public.notification_attempts IS 'Channels: push (FCM free), whatsapp (wa.me free), email (Gmail SMTP free 100/day), manual';
