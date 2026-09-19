import React from 'react';
import { createClient } from '@/lib/supabase/server-client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { formatDuration, formatIstDateTime, liveDuration } from '@/utils/visit';
import { isGateOperatorAuthorized } from '@/lib/server/gateAuth';
import { getGatePasses } from '@/app/actions/adminActions';
import AutoRefresh from '@/components/admin/AutoRefresh';
import { AdminActionButtons } from '@/components/admin/AdminActionButtons';
import { supabaseServer } from '@/lib/supabase/server';

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string; page?: string }> }) {
  const { filter = 'all', q = '', page = '1' } = await searchParams;
  const currentPage = parseInt(page, 10) || 1;
  const limit = 20; // 20 per page for better performance
  
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  async function signOut() {
    'use server';
    const client = await createClient();
    await client.auth.signOut();
    redirect('/admin/login');
  }

  // Fetch paginated data via our new action
  const { data: requests, count } = await getGatePasses(currentPage, limit, filter, q);
  const rows = requests || [];
  
  // Need to get total counts for the summary cards. We'll do a quick aggregate query for the summaries.
  // To keep it performant, we just count them.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  const [{ count: insideCount }, { count: pendingCount }] = await Promise.all([
    supabaseServer.from('gate_pass_requests').select('*', { count: 'exact', head: true }).eq('visit_status', 'checked_in').is('check_out_at', null),
    supabaseServer.from('gate_pass_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const gateAuthorized = await isGateOperatorAuthorized();

  async function handleManualCheckout(formData: FormData) {
    'use server';
    const passNumber = String(formData.get('passNumber') || '');
    if (!passNumber) return;
    const { isGateOperatorAuthorized: checkAuth } = await import('@/lib/server/gateAuth');
    if (!(await checkAuth())) return;
    await supabaseServer.rpc('check_out_visitor', { p_pass_number: passNumber, p_performed_by: 'gate_operator', p_method: 'manual_security' });
    revalidatePath('/admin');
  }

  const totalPages = Math.ceil((count || 0) / limit);

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-900 pb-20 font-sans">
      <AutoRefresh intervalMs={30000} />
      
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image 
          src="/visit-bg-new.jpg" 
          alt="Background" 
          fill 
          className="object-cover opacity-20 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/95 to-[#0133a1]/40" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/10 backdrop-blur-md border border-white/10 p-4 sm:px-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-xl h-12 w-32 relative shadow-inner flex items-center justify-center">
              <Image src="/navjyoti-brand-logo-3d.png" alt="Logo" fill className="object-contain p-1" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">Gate Pass Admin</h1>
              <p className="text-white/60 text-xs sm:text-sm font-medium">Control Center & Live Dashboard</p>
            </div>
          </div>
          <form action={signOut}>
            <button type="submit" className="text-sm font-bold text-white bg-white/10 hover:bg-red-500/80 hover:text-white px-5 py-2.5 rounded-xl transition-all border border-white/20 shadow-lg backdrop-blur-sm">
              Sign Out
            </button>
          </form>
        </header>

        {/* Summaries */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-teal-500/20 to-teal-900/40 backdrop-blur-md border border-teal-500/30 p-5 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-teal-500/20 rounded-full blur-2xl"></div>
            <p className="text-xs font-bold uppercase text-teal-200 tracking-wider">Currently Inside</p>
            <p className="mt-2 text-4xl font-black text-teal-400">{insideCount || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500/20 to-amber-900/40 backdrop-blur-md border border-amber-500/30 p-5 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/20 rounded-full blur-2xl"></div>
            <p className="text-xs font-bold uppercase text-amber-200 tracking-wider">Pending Approval</p>
            <p className="mt-2 text-4xl font-black text-amber-400">{pendingCount || 0}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-lg">
            <p className="text-xs font-bold uppercase text-white/50 tracking-wider">Total Records</p>
            <p className="mt-2 text-4xl font-black text-white">{count || 0}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-lg flex flex-col justify-center items-start">
             <a href="/api/admin/export" className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 rounded-xl transition-colors text-sm shadow-inner">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
               Export CSV
             </a>
          </div>
        </section>

        {/* Toolbar */}
        <section className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between">
          <form className="flex-1 w-full flex flex-col sm:flex-row gap-4">
            <input 
              name="q" 
              defaultValue={q} 
              placeholder="Search visitor, mobile, pass..." 
              className="w-full sm:max-w-xs h-11 px-4 rounded-xl bg-slate-900/50 border border-white/20 text-white placeholder-white/40 focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00] outline-none transition-all"
            />
            <div className="flex flex-wrap gap-2">
              {[
                ['all', 'All'],
                ['pending', 'Pending'],
                ['awaiting', 'Awaiting Entry'],
                ['inside', 'Inside'],
                ['completed', 'Completed'],
                ['rejected', 'Rejected']
              ].map(([val, label]) => (
                <button 
                  key={val} 
                  name="filter" 
                  value={val} 
                  className={`h-11 px-4 rounded-xl text-sm font-bold transition-all shadow-sm ${filter === val ? 'bg-gradient-to-r from-[#FF6A00] to-[#e65c00] text-white border-transparent' : 'bg-slate-800/50 text-white/70 border border-white/10 hover:bg-slate-800'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {/* Persist page query if searching, usually resets to 1 so we omit it or set to 1 implicitly */}
          </form>
        </section>

        {/* Data Table */}
        <section className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
            <h2 className="text-xl font-black text-white">Visitor Records</h2>
            <div className="text-sm font-bold text-white/50">Page {currentPage} of {totalPages || 1}</div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm text-white/80">
              <thead>
                <tr className="bg-slate-900/50 text-xs uppercase text-white/50 tracking-wider">
                  <th className="p-4 font-bold">Visitor Info</th>
                  <th className="p-4 font-bold">Contact & Host</th>
                  <th className="p-4 font-bold">Status & Time</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-white/50 font-medium">No records found matching your filters.</td></tr>
                ) : rows.map((req) => (
                  <tr key={req.id} className="hover:bg-white/5 transition-colors group">
                    
                    <td className="p-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className="relative h-12 w-12 rounded-xl bg-slate-800 border border-white/10 overflow-hidden shrink-0 shadow-inner">
                          {req.visitor_photo_url ? (
                            <Image src={req.visitor_photo_url} alt="" fill unoptimized className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white text-base leading-tight">{req.visitor_name}</p>
                          <p className="text-xs text-white/50 mt-1 max-w-[200px] line-clamp-2" title={req.purpose}>{req.purpose}</p>
                          <p className="text-[10px] font-mono text-white/40 mt-1 uppercase tracking-widest">{req.request_reference}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-4 align-top space-y-1 text-xs">
                      <p><span className="text-white/40 uppercase tracking-wider text-[10px] font-bold mr-2">Mob</span><span className="font-mono text-white/90">{req.visitor_mobile}</span></p>
                      {req.visitor_email && <p><span className="text-white/40 uppercase tracking-wider text-[10px] font-bold mr-2">Email</span><span className="text-blue-300 truncate max-w-[150px] inline-block align-bottom">{req.visitor_email}</span></p>}
                      <p><span className="text-white/40 uppercase tracking-wider text-[10px] font-bold mr-2">Co.</span><span className="text-white/80">{req.visitor_company || '—'}</span></p>
                      <div className="mt-2 pt-2 border-t border-white/5">
                        <p><span className="text-[#FF6A00] uppercase tracking-wider text-[10px] font-bold mr-2">Host</span><span className="font-semibold text-white">{req.host?.name || req.department_target || '—'}</span></p>
                      </div>
                    </td>
                    
                    <td className="p-4 align-top space-y-2">
                      <StatusBadge status={req.status} visitStatus={req.visit_status || 'not_checked_in'} />
                      <div className="text-[11px] text-white/50 space-y-0.5">
                        <p>Req: {formatIstDateTime(req.created_at)}</p>
                        {req.visit_status === 'checked_in' && (
                          <p className="text-teal-300 font-medium">Inside: {liveDuration(req.check_in_at)}</p>
                        )}
                        {req.visit_status === 'checked_out' && (
                          <p>Exit: {formatIstDateTime(req.check_out_at)}</p>
                        )}
                      </div>
                    </td>
                    
                    <td className="p-4 align-top text-right">
                      <div className="flex flex-col items-end gap-2">
                        <AdminActionButtons requestId={req.id} status={req.status} />
                        
                        <div className="flex items-center gap-3 mt-1">
                          <Link href={`/visit/pass/${req.request_reference}`} className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
                            View Pass
                          </Link>
                          {req.visit_status === 'checked_in' && (
                            gateAuthorized ? (
                              <form action={handleManualCheckout}>
                                <input type="hidden" name="passNumber" value={req.pass_number} />
                                <button className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors">
                                  Force Checkout
                                </button>
                              </form>
                            ) : (
                              <Link href="/gate?returnTo=/admin" className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors">
                                Auth to Checkout
                              </Link>
                            )
                          )}
                        </div>
                      </div>
                    </td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-white/10 flex items-center justify-between bg-white/5">
              <div className="text-sm text-white/50">
                Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, count || 0)} of {count} entries
              </div>
              <div className="flex gap-2">
                <Link 
                  href={`/admin?filter=${filter}&q=${q}&page=${Math.max(1, currentPage - 1)}`}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentPage <= 1 ? 'bg-white/5 text-white/30 pointer-events-none' : 'bg-white/10 text-white hover:bg-white/20 shadow-sm border border-white/10'}`}
                >
                  Previous
                </Link>
                <Link 
                  href={`/admin?filter=${filter}&q=${q}&page=${Math.min(totalPages, currentPage + 1)}`}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentPage >= totalPages ? 'bg-white/5 text-white/30 pointer-events-none' : 'bg-white/10 text-white hover:bg-white/20 shadow-sm border border-white/10'}`}
                >
                  Next
                </Link>
              </div>
            </div>
          )}
        </section>
        
      </div>
    </div>
  );
}

function StatusBadge({ status, visitStatus }: { status: string; visitStatus: string }) {
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';
  const isInside = visitStatus === 'checked_in';
  const isCompleted = visitStatus === 'checked_out';
  
  let label = 'Awaiting Entry';
  let colors = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  
  if (isPending) {
    label = 'Pending';
    colors = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  } else if (isRejected) {
    label = 'Rejected';
    colors = 'bg-red-500/20 text-red-300 border-red-500/30';
  } else if (isInside) {
    label = 'Inside Premises';
    colors = 'bg-teal-500/20 text-teal-300 border-teal-500/30 shadow-[0_0_10px_rgba(20,184,166,0.3)]';
  } else if (isCompleted) {
    label = 'Completed';
    colors = 'bg-green-500/20 text-green-300 border-green-500/30';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${colors}`}>
      {isInside && <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mr-1.5 animate-pulse"></span>}
      {label}
    </span>
  );
}
