'use client';

import { useState, useTransition } from 'react';
import { decideVisitorRequest } from '@/app/actions/decideRequest';
import { X, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

export default function ApprovalClient({ requestReference, rawToken }: { requestReference: string; rawToken: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const router = useRouter();

  const handleDecision = (status: 'approved' | 'rejected') => {
    setError(null);
    startTransition(async () => {
      const result = await decideVisitorRequest(requestReference, rawToken, status);
      if (result.success) {
        setSuccess(status === 'approved' ? 'The visitor request has been approved successfully.' : 'Visitor Request Rejected');
        router.refresh(); // Refresh the page to show the "already approved/rejected" state
      } else {
        setError(result.message || 'An error occurred.');
      }
    });
  };

  if (success) {
    return (
      <div className="fixed bottom-0 left-0 w-full md:max-w-md md:left-1/2 md:-translate-x-1/2 p-4 sm:p-6 pb-[max(16px,env(safe-area-inset-bottom))] bg-surface/90 backdrop-blur-md border-t border-outline-variant z-40 text-center">
         <p className="text-primary font-bold text-sm sm:text-base break-words">{success}</p>
      </div>
    );
  }

  if (showRejectConfirm) {
    return (
      <div className="fixed bottom-0 left-0 w-full md:max-w-md md:left-1/2 md:-translate-x-1/2 p-3 sm:p-4 pb-[max(12px,env(safe-area-inset-bottom))] bg-surface/90 backdrop-blur-md border-t border-outline-variant z-40 flex flex-col space-y-3 sm:space-y-4">
        <p className="text-center font-bold text-error text-sm sm:text-base">Reject this visitor request?</p>
        <div className="flex gap-3">
          <PrimaryButton 
            onClick={() => setShowRejectConfirm(false)}
            disabled={isPending}
            variant="secondary"
          >
            Cancel
          </PrimaryButton>
          <PrimaryButton 
            onClick={() => handleDecision('rejected')}
            isLoading={isPending}
            loadingText="Rejecting..."
            variant="danger"
          >
            Yes, Reject
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 w-full md:max-w-md md:left-1/2 md:-translate-x-1/2 p-3 sm:p-4 pb-[max(12px,env(safe-area-inset-bottom))] bg-surface/90 backdrop-blur-md border-t border-outline-variant z-40 flex flex-col space-y-3">
      {error && (
        <div className="p-3 bg-error/10 text-error text-sm rounded-lg border border-error/20 text-center font-semibold break-words">
          {error}
        </div>
      )}
      <div className="flex gap-3 flex-wrap sm:flex-nowrap">
        <PrimaryButton 
          onClick={() => setShowRejectConfirm(true)}
          disabled={isPending}
          variant="danger"
          icon={X}
        >
          Reject
        </PrimaryButton>
        <PrimaryButton 
          onClick={() => handleDecision('approved')}
          isLoading={isPending}
          loadingText="Approving..."
          icon={Check}
        >
          Approve
        </PrimaryButton>
      </div>
    </div>
  );
}
