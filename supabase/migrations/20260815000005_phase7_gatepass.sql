-- Add gate pass fields to gate_pass_requests
ALTER TABLE gate_pass_requests
ADD COLUMN IF NOT EXISTS pass_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS verification_token_hash TEXT,
ADD COLUMN IF NOT EXISTS pass_issued_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pass_expires_at TIMESTAMPTZ;

-- Issue Gate Pass RPC
CREATE OR REPLACE FUNCTION issue_gate_pass(
    p_request_reference TEXT,
    p_pass_number TEXT,
    p_token_hash TEXT,
    p_expires_at TIMESTAMPTZ
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request gate_pass_requests%ROWTYPE;
BEGIN
    -- Lock the row to prevent concurrent issuance
    SELECT * INTO v_request 
    FROM gate_pass_requests 
    WHERE request_reference = p_request_reference 
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Request not found');
    END IF;

    IF v_request.status != 'approved' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Request is not approved');
    END IF;

    -- If pass already issued, return success idempotently
    IF v_request.pass_number IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true, 
            'pass_number', v_request.pass_number, 
            'already_issued', true
        );
    END IF;

    -- Issue new pass
    UPDATE gate_pass_requests
    SET pass_number = p_pass_number,
        verification_token_hash = p_token_hash,
        pass_issued_at = now(),
        pass_expires_at = p_expires_at
    WHERE request_reference = p_request_reference;

    RETURN jsonb_build_object(
        'success', true, 
        'pass_number', p_pass_number, 
        'already_issued', false
    );
END;
$$;

-- Force schema cache reload so the new columns are immediately available via PostgREST
COMMENT ON TABLE gate_pass_requests IS 'Phase 7: Gate Pass Generation';
