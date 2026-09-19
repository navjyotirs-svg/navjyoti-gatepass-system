-- Visitor entry/exit lifecycle. Supabase remains the source of truth.
ALTER TABLE public.gate_pass_requests
  ADD COLUMN IF NOT EXISTS visit_status TEXT NOT NULL DEFAULT 'not_checked_in',
  ADD COLUMN IF NOT EXISTS check_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS check_out_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS check_in_by TEXT,
  ADD COLUMN IF NOT EXISTS check_out_by TEXT,
  ADD COLUMN IF NOT EXISTS check_in_method TEXT,
  ADD COLUMN IF NOT EXISTS check_out_method TEXT,
  ADD COLUMN IF NOT EXISTS last_gate_action_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS visit_duration_minutes INTEGER;

ALTER TABLE public.gate_pass_requests
  DROP CONSTRAINT IF EXISTS gate_pass_requests_visit_status_check,
  ADD CONSTRAINT gate_pass_requests_visit_status_check
    CHECK (visit_status IN ('not_checked_in', 'checked_in', 'checked_out')),
  DROP CONSTRAINT IF EXISTS gate_pass_requests_visit_timestamps_check,
  ADD CONSTRAINT gate_pass_requests_visit_timestamps_check CHECK (
    (visit_status = 'not_checked_in' AND check_in_at IS NULL AND check_out_at IS NULL)
    OR (visit_status = 'checked_in' AND check_in_at IS NOT NULL AND check_out_at IS NULL)
    OR (visit_status = 'checked_out' AND check_in_at IS NOT NULL AND check_out_at IS NOT NULL)
  ),
  DROP CONSTRAINT IF EXISTS gate_pass_requests_checkout_order_check,
  ADD CONSTRAINT gate_pass_requests_checkout_order_check
    CHECK (check_out_at IS NULL OR (check_in_at IS NOT NULL AND check_out_at >= check_in_at)),
  DROP CONSTRAINT IF EXISTS gate_pass_requests_duration_check,
  ADD CONSTRAINT gate_pass_requests_duration_check
    CHECK (visit_duration_minutes IS NULL OR visit_duration_minutes >= 0);

CREATE INDEX IF NOT EXISTS idx_gate_pass_visit_status
  ON public.gate_pass_requests (visit_status);
CREATE INDEX IF NOT EXISTS idx_gate_pass_check_in_at
  ON public.gate_pass_requests (check_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_gate_pass_check_out_at
  ON public.gate_pass_requests (check_out_at DESC);
CREATE INDEX IF NOT EXISTS idx_gate_pass_approval_visit
  ON public.gate_pass_requests (status, visit_status);

CREATE TABLE IF NOT EXISTS public.visitor_gate_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.gate_pass_requests(id) ON DELETE CASCADE,
  pass_number TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('checked_in', 'checked_out', 'manual_correction')),
  performed_by TEXT NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.visitor_gate_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_visitor_gate_events_request
  ON public.visitor_gate_events (request_id, performed_at DESC);

CREATE OR REPLACE FUNCTION public.check_in_visitor(
  p_pass_number TEXT,
  p_performed_by TEXT,
  p_method TEXT DEFAULT 'qr'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.gate_pass_requests%ROWTYPE;
  v_now TIMESTAMPTZ := now();
BEGIN
  SELECT * INTO v_request
  FROM public.gate_pass_requests
  WHERE pass_number = p_pass_number
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'not_found', 'message', 'Gate pass not found');
  END IF;
  IF v_request.status <> 'approved' THEN
    RETURN jsonb_build_object('success', false, 'code', 'not_approved', 'message', 'Gate pass is not approved');
  END IF;
  IF v_request.pass_number IS NULL OR v_request.verification_token_hash IS NULL THEN
    RETURN jsonb_build_object('success', false, 'code', 'pass_not_issued', 'message', 'Gate pass has not been issued');
  END IF;
  IF v_request.pass_expires_at IS NOT NULL AND v_now > v_request.pass_expires_at THEN
    RETURN jsonb_build_object('success', false, 'code', 'expired', 'message', 'Gate pass has expired');
  END IF;
  IF v_request.visit_status <> 'not_checked_in' THEN
    RETURN jsonb_build_object('success', false, 'code', 'already_processed', 'message',
      CASE WHEN v_request.visit_status = 'checked_in' THEN 'Visitor is already checked in' ELSE 'Visit is already completed' END);
  END IF;

  UPDATE public.gate_pass_requests
  SET visit_status = 'checked_in', check_in_at = v_now, check_in_by = p_performed_by,
      check_in_method = p_method, last_gate_action_at = v_now
  WHERE id = v_request.id;

  INSERT INTO public.visitor_gate_events(request_id, pass_number, event_type, performed_by, performed_at, metadata)
  VALUES (v_request.id, p_pass_number, 'checked_in', p_performed_by, v_now, jsonb_build_object('method', p_method));

  RETURN jsonb_build_object('success', true, 'visit_status', 'checked_in', 'check_in_at', v_now);
END;
$$;

CREATE OR REPLACE FUNCTION public.check_out_visitor(
  p_pass_number TEXT,
  p_performed_by TEXT,
  p_method TEXT DEFAULT 'qr'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.gate_pass_requests%ROWTYPE;
  v_now TIMESTAMPTZ := now();
  v_duration INTEGER;
BEGIN
  SELECT * INTO v_request
  FROM public.gate_pass_requests
  WHERE pass_number = p_pass_number
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'not_found', 'message', 'Gate pass not found');
  END IF;
  IF v_request.status <> 'approved' THEN
    RETURN jsonb_build_object('success', false, 'code', 'not_approved', 'message', 'Gate pass is not approved');
  END IF;
  IF v_request.visit_status = 'not_checked_in' OR v_request.check_in_at IS NULL THEN
    RETURN jsonb_build_object('success', false, 'code', 'not_checked_in', 'message', 'Visitor has not checked in');
  END IF;
  IF v_request.visit_status = 'checked_out' OR v_request.check_out_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'code', 'already_completed', 'message', 'Visit is already completed');
  END IF;

  v_duration := GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (v_now - v_request.check_in_at)) / 60)::INTEGER);

  UPDATE public.gate_pass_requests
  SET visit_status = 'checked_out', check_out_at = v_now, check_out_by = p_performed_by,
      check_out_method = p_method, last_gate_action_at = v_now,
      visit_duration_minutes = v_duration
  WHERE id = v_request.id;

  INSERT INTO public.visitor_gate_events(request_id, pass_number, event_type, performed_by, performed_at, metadata)
  VALUES (v_request.id, p_pass_number, 'checked_out', p_performed_by, v_now,
    jsonb_build_object('method', p_method, 'duration_minutes', v_duration));

  RETURN jsonb_build_object('success', true, 'visit_status', 'checked_out',
    'check_in_at', v_request.check_in_at, 'check_out_at', v_now, 'visit_duration_minutes', v_duration);
END;
$$;

REVOKE ALL ON FUNCTION public.check_in_visitor(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_out_visitor(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_in_visitor(TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_out_visitor(TEXT, TEXT, TEXT) TO service_role;
REVOKE ALL ON TABLE public.visitor_gate_events FROM anon, authenticated;

-- All visitor reads already pass through server routes/actions. Remove the
-- legacy policy that exposed every request to the anonymous REST client.
DROP POLICY IF EXISTS "Public read own request" ON public.gate_pass_requests;

COMMENT ON TABLE public.visitor_gate_events IS 'Private audit history for gate lifecycle actions';
