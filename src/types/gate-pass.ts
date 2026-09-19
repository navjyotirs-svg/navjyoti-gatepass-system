export interface GatePassRequest {
  id: string;
  visitor_name: string;
  visitor_mobile: string;
  visitor_company: string | null;
  visitor_photo_url: string | null;
  employee_id: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  visit_status: 'not_checked_in' | 'checked_in' | 'checked_out';
  check_in_at: string | null;
  check_out_at: string | null;
  check_in_by: string | null;
  check_out_by: string | null;
  check_in_method: string | null;
  check_out_method: string | null;
  visit_duration_minutes: number | null;
  pass_number: string | null;
  created_at?: string;
  approved_at?: string | null;
  rejected_at?: string | null;
}
