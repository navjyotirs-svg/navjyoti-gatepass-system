-- Create visitor_otps table
CREATE TABLE visitor_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile_number TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookup by mobile number
CREATE INDEX idx_visitor_otps_mobile ON visitor_otps (mobile_number);

-- Enable RLS
ALTER TABLE visitor_otps ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role has full access to visitor_otps"
    ON visitor_otps FOR ALL
    USING (true)
    WITH CHECK (true);
