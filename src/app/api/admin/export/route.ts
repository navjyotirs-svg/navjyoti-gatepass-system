import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

function csvEscape(v: string | null | undefined) {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  // Allow either legacy ?pass= query or authenticated Supabase session (admin page)
  const pass = req.nextUrl.searchParams.get('pass');
  const adminPass = process.env.ADMIN_PASSWORD || 'navjyoti-admin';
  if (pass) {
    if (pass !== adminPass) return new NextResponse('Unauthorized', { status: 401 });
  } else {
    // Fall back to Supabase auth check via cookie
    try {
      const { createServerClient } = await import('@supabase/ssr');
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} },
        }
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return new NextResponse('Unauthorized', { status: 401 });
    } catch {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  const { data, error } = await supabaseServer
    .from('gate_pass_requests')
    .select('*, host:employee_id(name)')
    .order('created_at', { ascending: false });

  if (error) return new NextResponse('Failed to load', { status: 500 });

  const header = ['Date (IST)','Visitor Name','Mobile','Email','Company','Host','Purpose','Pass Number / Ref','Approval Status','Visit Status','Requested At (IST)','Entry Time (IST)','Exit Time (IST)','Duration Minutes'];
  const rows = (data || []).map((r: any) => {
    const visitStatus = r.visit_status || 'not_checked_in';
    return [
      new Date(r.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
      r.visitor_name,
      r.visitor_mobile,
      r.visitor_email || '',
      r.visitor_company || '',
      r.host?.name || r.department_target || '',
      r.purpose,
      r.pass_number || r.request_reference,
      r.status,
      visitStatus,
      r.created_at ? new Date(r.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
      r.check_in_at ? new Date(r.check_in_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
      r.check_out_at ? new Date(r.check_out_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
      r.visit_duration_minutes ?? '',
    ].map(csvEscape).join(',');
  });

  const csv = [header.join(','), ...rows].join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="navjyoti-visitors-${new Date().toISOString().slice(0,10)}.csv"`,
    },
  });
}
