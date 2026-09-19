'use client';

import { useTransition } from 'react';
import { adminDecideRequest, resendPassEmail } from '@/app/actions/adminActions';

export function AdminActionButtons({ requestId, status }: { requestId: string, status: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDecision = (decision: 'approved' | 'rejected') => {
    startTransition(async () => {
      const result = await adminDecideRequest(requestId, decision);
      if (!result.success) {
        alert(result.message);
      }
    });
  };

  const handleResend = () => {
    startTransition(async () => {
      const result = await resendPassEmail(requestId);
      alert(result.message);
    });
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {status === 'pending' && (
        <>
          <button 
            onClick={() => handleDecision('approved')} 
            disabled={isPending}
            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg shadow disabled:opacity-50 transition-colors"
          >
            Approve
          </button>
          <button 
            onClick={() => handleDecision('rejected')} 
            disabled={isPending}
            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg shadow disabled:opacity-50 transition-colors"
          >
            Reject
          </button>
        </>
      )}
      
      {status === 'approved' && (
        <button 
          onClick={handleResend} 
          disabled={isPending}
          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg shadow disabled:opacity-50 transition-colors flex items-center gap-1"
        >
          {isPending ? 'Sending...' : 'Resend Pass'}
        </button>
      )}
    </div>
  );
}
