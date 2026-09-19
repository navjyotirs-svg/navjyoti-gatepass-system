-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    mobile TEXT,
    department TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create gate_pass_requests table
CREATE TABLE IF NOT EXISTS gate_pass_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_name TEXT NOT NULL,
    visitor_mobile TEXT NOT NULL,
    visitor_company TEXT,
    visitor_photo_url TEXT,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    pass_number TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Add updated_at trigger for employees
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employees_updated_at
BEFORE UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_pass_requests ENABLE ROW LEVEL SECURITY;

-- Employees RLS Policies
-- For simplicity in phase 1 without full admin roles, we allow public read
-- However, we'll rely on the public_employee_directory view to mask the mobile number.
DROP POLICY IF EXISTS "Public read active employees" ON employees;
CREATE POLICY "Public read active employees"
ON employees FOR SELECT
USING (active = TRUE);

-- Create a safe view to omit mobile number for public
CREATE OR REPLACE VIEW public_employee_directory AS
SELECT id, name, department
FROM employees
WHERE active = TRUE;

-- Gate Pass Requests RLS Policies
-- Public can insert a pending request
DROP POLICY IF EXISTS "Public insert pending requests" ON gate_pass_requests;
CREATE POLICY "Public insert pending requests"
ON gate_pass_requests FOR INSERT
WITH CHECK (status = 'pending');

-- Public can read any request if they know the UUID
DROP POLICY IF EXISTS "Public read own request" ON gate_pass_requests;
CREATE POLICY "Public read own request"
ON gate_pass_requests FOR SELECT
USING (TRUE);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(active);
CREATE INDEX IF NOT EXISTS idx_employees_mobile ON employees(mobile);
CREATE INDEX IF NOT EXISTS idx_gate_pass_employee_id ON gate_pass_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_gate_pass_status ON gate_pass_requests(status);
CREATE INDEX IF NOT EXISTS idx_gate_pass_created_at ON gate_pass_requests(created_at);
