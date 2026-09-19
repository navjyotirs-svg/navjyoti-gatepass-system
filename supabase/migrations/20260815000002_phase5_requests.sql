-- Add request_reference column
ALTER TABLE gate_pass_requests ADD COLUMN IF NOT EXISTS request_reference TEXT UNIQUE;

-- Add constraints for conditional meeting targets
ALTER TABLE gate_pass_requests ADD CONSTRAINT chk_meeting_target_type 
    CHECK (meeting_target_type IN ('employee', 'department'));

ALTER TABLE gate_pass_requests ADD CONSTRAINT chk_meeting_target_validity 
    CHECK (
        (meeting_target_type = 'employee' AND employee_id IS NOT NULL AND department_target IS NULL) OR
        (meeting_target_type = 'department' AND employee_id IS NULL AND department_target IS NOT NULL)
    );

-- Drop the permissive anonymous insert policy on gate_pass_requests.
-- This ensures that pending requests can only be inserted via the secure backend Server Action
-- using the Supabase Service Role key, which naturally bypasses RLS.
DROP POLICY IF EXISTS "Public insert pending requests" ON gate_pass_requests;

-- Ensure that the public can still SELECT their own requests if they know the UUID.
-- The existing policy "Public read own request" allows reading by UUID. We keep this intact.
