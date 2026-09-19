import { ShieldCheck, Search, LogOut } from 'lucide-react';
import { authenticateGateOperator, manualCheckOutVisitor } from '@/app/actions/visitLifecycle';
import { isGateOperatorAuthorized } from '@/lib/server/gateAuth';
import { supabaseServer } from '@/lib/supabase/server';
import { formatIstDateTime, liveDuration } from '@/utils/visit';
import Image from 'next/image';

export default async function GatePage({ searchParams }: { searchParams: Promise<{ returnTo?: string; authError?: string; q?: string }> }) {
  const query = await searchParams;
  const authorized = await isGateOperatorAuthorized();
  const { count } = authorized ? await supabaseServer.from('gate_pass_requests').select('id', { count: 'exact', head: true }).eq('status', 'approved').eq('visit_status', 'checked_in').is('check_out_at', null) : { count: null };

  if (authorized) {
    const rawQ = (query.q || '').trim();
    // sanitize for PostgREST or filter: strip commas, parens, %, and limit length
    const searchQ = rawQ.slice(0, 40).replace(/[%(),]/g, '').trim();
    let activeVisitors: any[] = [];
    let searchError: string | null = null;
    if (searchQ) {
      const escaped = searchQ.replace(/"/g, '""');
      const { data, error } = await supabaseServer
        .from('gate_pass_requests')
        .select('id, visitor_name, visitor_mobile, visitor_company, pass_number, request_reference, visitor_photo_url, check_in_at, host:employee_id(name)')
        .eq('status', 'approved')
        .eq('visit_status', 'checked_in')
        .is('check_out_at', null)
        .or(`visitor_name.ilike.%${escaped}%,visitor_mobile.ilike.%${escaped}%,pass_number.ilike.%${escaped}%`)
        .limit(10);
      if (error) searchError = 'Search failed';
      else activeVisitors = data || [];
    } else {
      const { data } = await supabaseServer
        .from('gate_pass_requests')
        .select('id, visitor_name, visitor_mobile, visitor_company, pass_number, request_reference, visitor_photo_url, check_in_at, host:employee_id(name)')
        .eq('status', 'approved')
        .eq('visit_status', 'checked_in')
        .is('check_out_at', null)
        .order('check_in_at', { ascending: false })
        .limit(10);
      activeVisitors = data || [];
    }

    return (
      <main className="min-h-[100dvh] bg-surface p-3 sm:p-4 flex flex-col items-center overflow-x-hidden">
        <section className="w-full max-w-lg rounded-2xl bg-white p-4 sm:p-6 text-center shadow-xl border border-outline-variant">
          <ShieldCheck className="mx-auto h-10 w-10 sm:h-14 sm:w-14 text-success" />
          <h1 className="mt-3 text-xl sm:text-2xl font-black text-primary leading-tight">GATE OPERATOR</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Session active. Scan a visitor QR code with this device.</p>
          <div className="mt-4 rounded-xl bg-success/10 p-4"><p className="text-xs font-bold uppercase text-on-surface-variant">Currently Inside</p><p className="text-3xl font-black text-success">{count || 0}</p></div>
          {query.returnTo && <a href={query.returnTo} className="mt-4 flex min-h-12 items-center justify-center rounded-xl bg-primary px-4 font-bold text-white text-sm">Continue to scanned pass</a>}
        </section>

        <section className="w-full max-w-lg mt-4 rounded-2xl bg-white p-4 sm:p-6 shadow-xl border border-outline-variant">
          <h2 className="text-sm font-black uppercase tracking-wide flex items-center gap-2"><Search className="w-4 h-4" /> Search Active Visitor (fallback without QR)</h2>
          <form className="mt-3 flex gap-2">
            <input name="q" defaultValue={searchQ} placeholder="Name, mobile or pass number" className="flex-1 min-w-0 min-h-12 rounded-xl border border-outline px-3 text-[16px]" />
            <button className="min-h-12 rounded-xl bg-primary px-4 font-bold text-white text-sm">Search</button>
          </form>
          {searchError && <p className="mt-2 text-sm text-error">{searchError}</p>}
          <div className="mt-4 space-y-3">
            {activeVisitors.length === 0 && <p className="text-sm text-on-surface-variant text-center py-2">{searchQ ? 'No matching active visitor.' : 'No visitors currently inside.'}</p>}
            {activeVisitors.map((v) => (
              <div key={v.id} className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50/50 p-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full bg-gray-200 shrink-0">{v.visitor_photo_url && <Image src={v.visitor_photo_url} alt="" fill unoptimized className="object-cover" />}</div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-bold text-sm break-words leading-tight">{v.visitor_name}</p>
                  <p className="text-xs text-on-surface-variant break-words">{v.visitor_mobile} · {v.pass_number}</p>
                  <p className="text-xs text-on-surface-variant">Entry: {formatIstDateTime(v.check_in_at)} · {liveDuration(v.check_in_at)}</p>
                  {(() => { const mins = Math.floor((Date.now() - new Date(v.check_in_at).getTime())/60000); return mins > 360 ? <span className="inline-block mt-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1">LONG VISIT</span> : null; })()}
                </div>
                <form action={async (fd: FormData) => { 'use server'; await manualCheckOutVisitor(fd); }} className="shrink-0">
                  <input type="hidden" name="passNumber" value={v.pass_number} />
                  <button className="min-h-11 rounded-xl bg-primary px-3 font-bold text-white text-xs flex items-center gap-1"><LogOut className="w-4 h-4" /> Check Out</button>
                </form>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-on-surface-variant">Manual checkout records method <span className="font-mono">manual_security</span> and creates audit event. Always verify photo/person before confirming.</p>
        </section>
      </main>
    );
  }

  const returnTo = query.returnTo?.startsWith('/') ? query.returnTo : '/gate';
  return <main className="min-h-[100dvh] bg-surface p-3 sm:p-4 flex items-center justify-center overflow-x-hidden"><form action={authenticateGateOperator} className="w-full max-w-sm rounded-2xl bg-white p-4 sm:p-6 shadow-xl border border-outline-variant"><ShieldCheck className="mx-auto h-12 w-12 sm:h-14 sm:w-14 text-primary" /><h1 className="mt-3 text-center text-xl sm:text-2xl font-black text-primary leading-tight">SECURITY GATE</h1><p className="mt-2 text-center text-sm text-on-surface-variant">Authorized operators only</p><input type="hidden" name="returnTo" value={returnTo} /><label className="mt-5 sm:mt-6 block text-sm font-bold text-on-surface" htmlFor="password">Gate password</label><input id="password" name="password" type="password" required autoComplete="current-password" className="mt-2 min-h-12 w-full rounded-xl border border-outline bg-white px-4 text-[16px] text-on-surface" />{query.authError && <p role="alert" className="mt-2 text-sm font-semibold text-error break-words">Incorrect gate password.</p>}<button className="mt-5 min-h-12 w-full rounded-xl bg-primary px-4 font-black uppercase text-white text-sm sm:text-base">Authorize Device</button></form></main>;
}
