-- Add approval fields
ALTER TABLE gate_pass_requests
ADD COLUMN IF NOT EXISTS approval_token_hash TEXT,
ADD COLUMN IF NOT EXISTS approval_token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS decision_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS decision_by TEXT;

-- RPC for atomic decision making
CREATE OR REPLACE FUNCTION decide_request(
    p_request_reference TEXT,
    p_token_hash TEXT,
    p_new_status TEXT,
    p_decision_by TEXT DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request gate_pass_requests%ROWTYPE;
BEGIN
    -- Only allow approved or rejected
    IF p_new_status NOT IN ('approved', 'rejected') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid status');
    END IF;

    -- Lock the row for update to prevent concurrent decisions
    SELECT * INTO v_request 
    FROM gate_pass_requests 
    WHERE request_reference = p_request_reference 
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Request not found');
    END IF;

    IF v_request.status != 'pending' THEN
        RETURN jsonb_build_object('success', false, 'message', 'This request has already been decided.');
    END IF;

    IF v_request.approval_token_hash != p_token_hash THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid approval link');
    END IF;

    IF v_request.approval_token_expires_at < now() THEN
        RETURN jsonb_build_object('success', false, 'message', 'Approval link expired');
    END IF;

    UPDATE gate_pass_requests
    SET 
        status = p_new_status,
        decision_at = now(),
        decision_by = p_decision_by,
        approved_at = CASE WHEN p_new_status = 'approved' THEN now() ELSE NULL END,
        rejected_at = CASE WHEN p_new_status = 'rejected' THEN now() ELSE NULL END
    WHERE request_reference = p_request_reference;

    RETURN jsonb_build_object('success', true);
END;
$$;
