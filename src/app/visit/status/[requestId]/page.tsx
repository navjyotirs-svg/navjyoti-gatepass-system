import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import { supabaseServer } from '@/lib/supabase/server';
import { resolveHostForNotification } from '@/lib/server/hostResolution';
import { HostSelection } from '@/types/employee';
import PollRefresh from './PollRefresh';
import { NavjyotiBrandHeader } from '@/components/ui/NavjyotiBrandHeader';
import { WhatsAppButton } from '@/components/visitor/WhatsAppButton';
import { formatDuration, formatIstTime } from '@/utils/visit';

interface StatusPageProps {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function StatusPage({ params, searchParams }: StatusPageProps) {
  const { requestId } = await params;
  const resolvedSearchParams = await searchParams;
  const token = typeof resolvedSearchParams.token === 'string' ? resolvedSearchParams.token : undefined;

  // 1. Fetch request details
  const { data: request, error } = await supabaseServer
    .from('gate_pass_requests')
    // Select the row shape dynamically so existing deployments continue to
    // work before the lifecycle migration adds visit_status timestamps.
    .select('*')
    .eq('id', requestId)
    .single();

  if (error || !request) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <XCircle className="w-16 h-16 text-error mb-4" />
        <h1 className="text-2xl font-bold text-on-surface">Request Not Found</h1>
        <p className="text-on-surface-variant mt-2">The visit request could not be located or may have been deleted.</p>
      </div>
    );
  }

  // 2. Resolve host details to know the notification mode and display name
  const hostSelection: HostSelection = request.meeting_target_type === 'department'
    ? { type: 'department', departmentCode: request.department_target as 'HR' }
    : { type: 'employee', employeeId: request.employee_id as string };

  const hostInfo = await resolveHostForNotification(hostSelection);

  // 3. Status mappings
  const isPending = request.status === 'pending';
  const isApproved = request.status === 'approved';
  const isRejected = request.status === 'rejected';

  return (
    <div className="min-h-[100dvh] min-h-[100svh] bg-surface flex flex-col items-center pb-20 overflow-x-hidden">
      <NavjyotiBrandHeader />

      <main className="flex-1 w-full max-w-md p-3 sm:p-4 flex flex-col space-y-5 sm:space-y-6 mt-4 sm:mt-6 min-w-0">
        
        {isPending && (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 bg-warning/10 rounded-full flex items-center justify-center animate-pulse">
              <Clock className="w-10 h-10 text-warning" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Request Sent</h1>
              <p className="text-on-surface-variant mt-2 font-medium">Your visit request has been sent to</p>
              <p className="text-on-surface font-bold text-lg">{hostInfo.displayName}.</p>
              
              {hostInfo.notificationMode === 'push' && (
                <div className="mt-4 flex items-center justify-center space-x-2 text-success font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Notification Sent</span>
                </div>
              )}
              {hostInfo.notificationMode === 'whatsapp' && (
                <p className="text-warning font-medium mt-4 text-sm">Push notifications are not configured for this employee.</p>
              )}
              {hostInfo.notificationMode === 'manual' && (
                <p className="text-warning font-medium mt-4 text-sm">Manual approval is required.</p>
              )}
              
              <p className="text-on-surface-variant mt-4 text-sm">Waiting for approval...</p>
            </div>
          </div>
        )}

        {isApproved && (
          <div className="flex flex-col items-center text-center space-y-4">
            <CheckCircle2 className={`w-20 h-20 ${request.visit_status === 'checked_out' ? 'text-success' : request.visit_status === 'checked_in' ? 'text-teal-600' : 'text-success'}`} />
            <div>
              <h1 className="text-2xl font-bold text-primary">{request.visit_status === 'checked_out' ? 'VISIT COMPLETED' : request.visit_status === 'checked_in' ? 'INSIDE PREMISES' : 'GATE PASS APPROVED'}</h1>
              <p className="text-on-surface-variant mt-1">
                {request.visit_status === 'checked_out' ? `Checked out at ${formatIstTime(request.check_out_at)} · Duration ${formatDuration(request.visit_duration_minutes)}` : request.visit_status === 'checked_in' ? `Inside since ${formatIstTime(request.check_in_at)}` : 'Approved · Awaiting Entry'}
              </p>
              {request.visit_status !== 'not_checked_in' && request.check_in_at && (
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border border-outline-variant bg-white p-2"><p className="text-[10px] font-bold uppercase text-on-surface-variant">Entry</p><p className="mt-1 text-xs font-black">{formatIstTime(request.check_in_at)}</p></div>
                  <div className="rounded-lg border border-outline-variant bg-white p-2"><p className="text-[10px] font-bold uppercase text-on-surface-variant">Exit</p><p className="mt-1 text-xs font-black">{formatIstTime(request.check_out_at)}</p></div>
                  <div className="rounded-lg border border-outline-variant bg-white p-2"><p className="text-[10px] font-bold uppercase text-on-surface-variant">Duration</p><p className="mt-1 text-xs font-black">{formatDuration(request.visit_duration_minutes)}</p></div>
                </div>
              )}
            </div>
            <div className="w-full pt-2">
              <a 
                href={`/visit/pass/${request.request_reference}`}
                className="w-full flex items-center justify-center h-[52px] bg-primary text-on-primary rounded-xl font-bold uppercase tracking-wider shadow active:scale-[0.98] transition-transform"
              >
                View Gate Pass
              </a>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="flex flex-col items-center text-center space-y-4">
            <XCircle className="w-20 h-20 text-error" />
            <div>
              <h1 className="text-2xl font-bold text-error">Request Not Approved</h1>
              <p className="text-on-surface-variant mt-1">Please contact reception if you need assistance.</p>
            </div>
          </div>
        )}

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 sm:p-5 space-y-3 sm:space-y-4 mt-4 shadow-sm overflow-hidden">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Request</span>
            <span className="text-lg font-mono font-medium text-on-surface mt-1">{request.request_reference}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Person to Meet</span>
            <span className="text-lg font-medium text-on-surface mt-1">{hostInfo.displayName}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</span>
            <span className={`text-lg font-bold mt-1 capitalize ${isApproved ? 'text-success' : isRejected ? 'text-error' : 'text-warning'}`}>{request.status}</span>
          </div>
        </div>

        {isPending && (hostInfo.notificationMode === 'whatsapp' || hostInfo.notificationMode === 'push') && (
          <div className="mt-8 space-y-3 pt-6 border-t border-outline-variant/30">
            {hostInfo.notificationMode === 'push' && (
               <p className="text-xs text-center text-on-surface-variant font-bold uppercase tracking-widest">Optional</p>
            )}
            <WhatsAppButton requestId={requestId} hostName={hostInfo.displayName} />
          </div>
        )}

        {isPending && hostInfo.notificationMode === 'manual' && (
          <div className="mt-8 p-4 bg-surface-container-low border border-outline-variant rounded-xl text-center space-y-2">
            <p className="font-semibold text-on-surface">Manual Notification</p>
            <p className="text-sm text-on-surface-variant">
              Please contact the selected person or reception for approval.
            </p>
          </div>
        )}

        {isPending && token && (
          <div className="mt-8 p-4 bg-surface-variant border border-outline rounded-xl break-all space-y-2">
            <p className="text-sm font-bold text-primary flex items-center gap-2">
              <span className="text-xl">🛠️</span> Developer / QA Tools
            </p>
            <p className="text-xs text-on-surface-variant">Use this secure link to test the approval flow directly:</p>
            <a 
              href={`/approve/${request.request_reference}?token=${token}`}
              className="text-sm text-primary font-mono underline block"
              target="_blank" rel="noreferrer"
            >
              /approve/{request.request_reference}?token={token}
            </a>
          </div>
        )}

      </main>

      {isPending && (
        <PollRefresh intervalMs={5000} />
      )}
    </div>
  );
}
