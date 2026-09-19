-- Support email OTP (free SMTP) alongside mobile OTP
ALTER TABLE visitor_otps ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE visitor_otps ALTER COLUMN mobile_number DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visitor_otps_email ON visitor_otps (email);
CREATE INDEX IF NOT EXISTS idx_visitor_otps_created ON visitor_otps (created_at);

-- Optional: ensure at least one identifier
-- (keep permissive so old rows remain valid)

-- Persist visitor email on gate requests for audit / contact
ALTER TABLE gate_pass_requests ADD COLUMN IF NOT EXISTS visitor_email TEXT;
CREATE INDEX IF NOT EXISTS idx_gate_pass_requests_visitor_email ON gate_pass_requests (visitor_email);
