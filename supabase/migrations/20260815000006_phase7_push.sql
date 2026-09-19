-- Migration for Push Notifications

CREATE TABLE IF NOT EXISTS public.employee_push_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    fcm_token TEXT NOT NULL UNIQUE,
    active BOOLEAN DEFAULT TRUE,
    device_label TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.notification_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.gate_pass_requests(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    channel TEXT NOT NULL, -- 'push', 'whatsapp', 'manual'
    status TEXT NOT NULL, -- 'sent', 'failed', 'unavailable'
    error_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.employee_push_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_attempts ENABLE ROW LEVEL SECURITY;

-- Service Role policies
CREATE POLICY "Service role has full access to employee_push_devices"
    ON public.employee_push_devices
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to notification_attempts"
    ON public.notification_attempts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Add indexes
CREATE INDEX idx_employee_push_devices_employee_id ON public.employee_push_devices(employee_id);
CREATE INDEX idx_notification_attempts_request_id ON public.notification_attempts(request_id);
