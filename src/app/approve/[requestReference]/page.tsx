import { supabaseServer } from '@/lib/supabase/server';
import crypto from 'crypto';
import Image from 'next/image';
import { User, Phone, Briefcase, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { NavjyotiBrandHeader } from '@/components/ui/NavjyotiBrandHeader';
import ApprovalClient from './ApprovalClient';

interface ApprovePageProps {
  params: Promise<{ requestReference: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ApprovePage({ params, searchParams }: ApprovePageProps) {
  const { requestReference } = await params;
  const resolvedSearchParams = await searchParams;
  const rawToken = typeof resolvedSearchParams.token === 'string' ? resolvedSearchParams.token : undefined;

  // 1. Validate basic inputs
  if (!rawToken) {
    return <ErrorState message="Invalid approval link." />;
  }

  // 2. Fetch the request
  const { data: request, error } = await supabaseServer
    .from('gate_pass_requests')
    .select('*')
    .eq('request_reference', requestReference)
    .single();

  if (error || !request) {
    return <ErrorState message="Invalid approval link" />;
  }

  // 3. Security checks
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  if (request.approval_token_hash !== tokenHash) {
    return <ErrorState message="Invalid approval link" />;
  }

  if (request.status !== 'pending') {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        {request.status === 'approved' ? (
          <CheckCircle2 className="w-16 h-16 text-primary mb-4" />
        ) : (
          <XCircle className="w-16 h-16 text-error mb-4" />
        )}
        <h1 className="text-2xl font-bold text-on-surface">This request has already been {request.status}.</h1>
      </div>
    );
  }

  if (new Date(request.approval_token_expires_at) < new Date()) {
    return <ErrorState message="Approval link expired" />;
  }

  // 4. Secure Photo Access
  // Get a short-lived signed URL for the visitor photo if it exists
  let photoUrl = null;
  if (request.visitor_photo_url) {
    const { data: signedUrlData, error: signedUrlError } = await supabaseServer
      .storage
      .from('visitor-photos')
      .createSignedUrl(request.visitor_photo_url, 600); // 10 minutes
    
    if (!signedUrlError && signedUrlData) {
      photoUrl = signedUrlData.signedUrl;
    }
  }

  return (
    <div className="min-h-[100dvh] min-h-[100svh] bg-surface flex flex-col items-center pb-[max(8rem,calc(8rem+env(safe-area-inset-bottom)))] overflow-x-hidden">
      <NavjyotiBrandHeader title="Visitor Approval Request" subtitle="Please review the details below." />

      <main className="flex-1 w-full max-w-md mx-auto p-3 sm:p-4 space-y-5 sm:space-y-6 min-w-0">
        <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-6 border border-outline shadow-sm space-y-4 sm:space-y-5 relative overflow-hidden">
          {photoUrl ? (
            <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden shadow border-4 border-surface relative">
              <Image 
                src={photoUrl} 
                alt="Visitor Photo" 
                fill
                className="object-cover"
              />
            </div>
          ) : (
             <div className="w-32 h-32 bg-surface-container rounded-xl mx-auto border-4 border-surface flex items-center justify-center overflow-hidden">
                <User className="w-12 h-12 text-on-surface-variant/50" />
             </div>
          )}

          <div className="space-y-4 pt-4 border-t border-outline-variant">
            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-wider text-on-surface-variant uppercase">Visitor Name</span>
              <div className="flex items-start space-x-2 mt-1">
                <User className="w-4 h-4 text-secondary mt-1 shrink-0" />
                <span className="text-base font-medium text-on-surface flex-1 break-words">{request.visitor_name}</span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-wider text-on-surface-variant uppercase">Mobile</span>
              <div className="flex items-start space-x-2 mt-1">
                <Phone className="w-4 h-4 text-secondary mt-1 shrink-0" />
                <span className="text-base font-medium text-on-surface flex-1 break-words">{request.visitor_mobile}</span>
              </div>
            </div>

            {request.visitor_company && (
              <div className="flex flex-col">
                <span className="text-xs font-semibold tracking-wider text-on-surface-variant uppercase">Company / Organisation</span>
                <div className="flex items-start space-x-2 mt-1">
                  <Briefcase className="w-4 h-4 text-secondary mt-1 shrink-0" />
                  <span className="text-base font-medium text-on-surface flex-1 break-words">{request.visitor_company}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-wider text-on-surface-variant uppercase">Purpose</span>
              <div className="flex items-start space-x-2 mt-1">
                <Calendar className="w-4 h-4 text-secondary mt-1 shrink-0" />
                <span className="text-base font-medium text-on-surface flex-1 break-words">{request.purpose}</span>
              </div>
            </div>
            
            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-wider text-on-surface-variant uppercase">Request</span>
              <div className="flex items-start space-x-2 mt-1">
                <span className="text-base font-medium text-on-surface flex-1 break-words">{request.request_reference}</span>
              </div>
            </div>
            
            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-wider text-on-surface-variant uppercase">Requested At</span>
              <div className="flex items-start space-x-2 mt-1">
                <span className="text-base font-medium text-on-surface flex-1 break-words">
                  {new Date(request.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ApprovalClient requestReference={requestReference} rawToken={rawToken} />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-[100dvh] bg-surface flex flex-col items-center justify-center p-4 sm:p-6 text-center overflow-x-hidden">
      <XCircle className="w-14 h-14 sm:w-16 sm:h-16 text-error mb-4" />
      <h1 className="text-xl sm:text-2xl font-bold text-on-surface">Access Denied</h1>
      <p className="text-on-surface-variant mt-2 text-sm sm:text-base break-words max-w-md">{message}</p>
    </div>
  );
}
