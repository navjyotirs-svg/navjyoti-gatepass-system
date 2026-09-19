import crypto from 'crypto';
import Image from 'next/image';
import { supabaseServer } from '@/lib/supabase/server';
import { generateGatePassToken } from '@/lib/server/crypto';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { isGateOperatorAuthorized } from '@/lib/server/gateAuth';
import { GateActionPanel } from '@/components/gate-pass/GateActionPanel';
import { formatDuration, formatIstTime } from '@/utils/visit';

export default async function VerifyGatePassPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ passNumber: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { passNumber } = await params;
  const resolvedSearchParams = await searchParams;
  const providedToken = resolvedSearchParams.token;

  if (!providedToken) {
    return <VerifyState type="invalid" message="No verification token provided." />;
  }

  // Verify HMAC token securely server-side without needing DB hash comparison
  const expectedToken = generateGatePassToken(passNumber);
  const validToken = providedToken.length === expectedToken.length && crypto.timingSafeEqual(Buffer.from(providedToken), Buffer.from(expectedToken));
  if (!validToken) {
    return <VerifyState type="invalid" message="INVALID GATE PASS" subMessage="The verification token does not match." />;
  }

  // Fetch from DB to check status and expiry
  const { data: request, error } = await supabaseServer
    .from('gate_pass_requests')
    .select(`
      *,
      host:employee_id(name)
    `)
    .eq('pass_number', passNumber)
    .single();

  if (error || !request) {
    return <VerifyState type="invalid" message="Gate pass not found." />;
  }

  if (request.status !== 'approved') {
    return <VerifyState type="invalid" message="Gate pass is not valid." subMessage={`Current status: ${request.status}`} />;
  }

  const now = new Date();
  const expiresAt = new Date(request.pass_expires_at);

  if ((request.visit_status || 'not_checked_in') === 'not_checked_in' && now > expiresAt) {
    return <VerifyState type="expired" message="EXPIRED GATE PASS" subMessage="This gate pass is no longer valid." />;
  }

  const hostName = request.host?.name || (request.meeting_target_type === 'department' ? (request.department_target || 'HR') : 'Unknown');
  const visitStatus = request.visit_status || 'not_checked_in';
  const authorized = await isGateOperatorAuthorized();
  const returnTo = `/verify/${encodeURIComponent(passNumber)}?token=${encodeURIComponent(providedToken)}`;
  const stateTitle = visitStatus === 'checked_in' ? 'VISITOR CURRENTLY INSIDE' : visitStatus === 'checked_out' ? 'VISIT COMPLETED' : 'VALID GATE PASS';
  const stateLabel = visitStatus === 'checked_in' ? 'INSIDE PREMISES' : visitStatus === 'checked_out' ? 'VISIT COMPLETED' : 'NOT CHECKED IN';
  let photoUrl: string | null = null;
  if (request.visitor_photo_url) {
    const { data } = await supabaseServer.storage.from('visitor-photos').createSignedUrl(request.visitor_photo_url, 3600);
    photoUrl = data?.signedUrl || null;
  }

  return (
    <main className="min-h-[100dvh] bg-surface p-3 sm:p-6 flex items-center justify-center overflow-x-hidden">
      <section className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl border border-outline-variant">
        <header className="bg-black px-4 sm:px-5 py-4 text-center text-white"><p className="font-black tracking-widest text-[#FF6A00] text-sm sm:text-base">NAVJYOTI</p><h1 className="text-[clamp(16px,4.5vw,20px)] font-black leading-tight">GATE PASS VERIFICATION</h1></header>
        <div className="p-3 sm:p-6">
          <div className="flex flex-col items-center text-center"><CheckCircle2 className={`h-14 w-14 sm:h-16 sm:w-16 ${visitStatus === 'checked_in' ? 'text-teal-600' : 'text-success'}`} /><h2 className="mt-2 text-[clamp(18px,5vw,24px)] font-black tracking-wide leading-tight break-words">{stateTitle}</h2><p className="mt-1 font-bold text-on-surface-variant text-sm sm:text-base">{stateLabel}</p></div>
          <div className="mt-5 grid grid-cols-[72px_1fr] sm:grid-cols-[88px_1fr] gap-3 sm:gap-4 rounded-xl bg-surface p-3 sm:p-4">
            <div className="relative h-24 sm:h-28 overflow-hidden rounded-lg border border-outline bg-gray-100 shrink-0">{photoUrl ? <Image src={photoUrl} alt="Visitor photo" fill unoptimized className="object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-gray-500 p-2 text-center">No photo</div>}</div>
            <dl className="min-w-0 space-y-2 text-sm"><Row label="Visitor" value={request.visitor_name} /><Row label="Pass Number" value={passNumber} mono /><Row label="Meeting With" value={hostName} /><Row label="Purpose" value={request.purpose} /></dl>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-2 text-center"><Metric label="Entry" value={formatIstTime(request.check_in_at)} /><Metric label="Exit" value={formatIstTime(request.check_out_at)} /><Metric label="Duration" value={formatDuration(request.visit_duration_minutes)} /></div>
          <div className="mt-5">
            {visitStatus === 'not_checked_in' && <GateActionPanel action="check_in" passNumber={passNumber} token={providedToken} visitorName={request.visitor_name} />}
            {visitStatus === 'checked_in' && <GateActionPanel action="check_out" passNumber={passNumber} token={providedToken} visitorName={request.visitor_name} entryTime={formatIstTime(request.check_in_at)} />}
            {visitStatus === 'checked_out' && (
              <div className="rounded-xl border border-success/30 bg-success/10 p-5 text-center mt-6">
                <p className="text-lg font-black text-success">Thank you for visiting Navjyoti.</p>
                <p className="mt-1 text-sm font-semibold text-success/80">Have a nice day!</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div><dt className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">{label}</dt><dd className={`font-bold break-words ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-outline-variant bg-white p-2"><p className="text-[10px] font-bold uppercase text-on-surface-variant">{label}</p><p className="mt-1 text-xs sm:text-sm font-black">{value}</p></div>;
}

function VerifyState({ type, message, subMessage }: { type: 'invalid' | 'expired', message: string, subMessage?: string }) {
  const Icon = type === 'invalid' ? XCircle : AlertTriangle;
  const colorClass = type === 'invalid' ? 'text-error' : 'text-warning';
  const bgClass = type === 'invalid' ? 'bg-error/10 border-error' : 'bg-warning/10 border-warning';

  return (
    <div className="min-h-[100dvh] bg-surface flex flex-col items-center justify-center p-4 overflow-x-hidden">
      <div className={`max-w-md w-full ${bgClass} border-2 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col items-center text-center space-y-4`}>
        <Icon className={`w-16 h-16 sm:w-20 sm:h-20 ${colorClass}`} />
        <div className="min-w-0">
          <h1 className={`text-xl sm:text-2xl font-bold ${colorClass} break-words`}>{message}</h1>
          {subMessage && <p className="text-on-surface-variant mt-2 font-medium text-sm sm:text-base break-words">{subMessage}</p>}
        </div>
      </div>
    </div>
  );
}
