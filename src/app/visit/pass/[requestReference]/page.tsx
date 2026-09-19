import { supabaseServer } from '@/lib/supabase/server';
import { issueGatePass } from '@/app/actions/gatepass';

// Using a wrapper client component to handle the ref for exports
import { GatePassWrapper } from './GatePassWrapper';

export default async function GatePassPage({ params }: { params: Promise<{ requestReference: string }> }) {
  const { requestReference } = await params;

  // 1. Fetch request details
  const { data: request, error } = await supabaseServer
    .from('gate_pass_requests')
    .select(`
      *,
      host:employee_id(name, department)
    `)
    .eq('request_reference', requestReference)
    .single();

  if (error || !request) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-error/10 text-error p-6 rounded-2xl max-w-sm text-center">
          Gate pass not found.
        </div>
      </div>
    );
  }

  if (request.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-surface p-6 border border-outline-variant rounded-2xl max-w-sm text-center">
          Gate pass is not available yet. The request is still pending.
        </div>
      </div>
    );
  }

  if (request.status !== 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-error/10 text-error p-6 rounded-2xl max-w-sm text-center">
          Gate pass unavailable.
        </div>
      </div>
    );
  }

  // Issue the pass if not issued, or get existing pass data
  const issuance = await issueGatePass(requestReference);
  if (!issuance.success || !issuance.passNumber || !issuance.token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-error/10 text-error p-6 rounded-2xl max-w-sm text-center">
          Failed to generate gate pass. Please contact administration.
        </div>
      </div>
    );
  }

  let photoUrl = null;
  if (request.visitor_photo_url) {
    const { data: photoData } = await supabaseServer.storage
      .from('visitor-photos')
      .createSignedUrl(request.visitor_photo_url, 60 * 60 * 24); // 24 hours expiry for view page
    
    if (photoData) {
      photoUrl = photoData.signedUrl;
    }
  }
  const hostName = request.host?.name || (request.meeting_target_type === 'department' ? (request.department_target || 'HR') : 'Unknown');
  const department = request.host?.department || null;

  return (
    <div className="min-h-[100dvh] bg-background py-4 sm:py-6 px-3 sm:px-4 flex flex-col items-center overflow-x-hidden">
      <h1 className="text-lg sm:text-xl font-bold text-on-background mb-3 sm:mb-4 text-center print:hidden leading-tight">
        Your Gate Pass
      </h1>
      
      <GatePassWrapper 
        passNumber={issuance.passNumber}
        visitorName={request.visitor_name}
        visitorMobile={request.visitor_mobile}
        visitorPhotoUrl={photoUrl}
        hostName={hostName}
        department={department}
        purpose={request.purpose}
        company={request.visitor_company}
        approvedAt={request.approved_at}
        verificationToken={issuance.token}
        visitStatus={request.visit_status || 'not_checked_in'}
        checkInAt={request.check_in_at}
        checkOutAt={request.check_out_at}
        visitDurationMinutes={request.visit_duration_minutes}
      />
    </div>
  );
}
