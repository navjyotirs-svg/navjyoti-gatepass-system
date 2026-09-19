'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut, X } from 'lucide-react';
import { checkInVisitor, checkOutVisitor } from '@/app/actions/visitLifecycle';

interface GateActionPanelProps {
  action: 'check_in' | 'check_out';
  passNumber: string;
  token: string;
  visitorName: string;
  entryTime?: string | null;
}

export function GateActionPanel({ action, passNumber, token, visitorName, entryTime }: GateActionPanelProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const isCheckIn = action === 'check_in';

  function confirm() {
    const data = new FormData();
    data.set('passNumber', passNumber);
    data.set('token', token);
    startTransition(async () => {
      const result = await (isCheckIn ? checkInVisitor(data) : checkOutVisitor(data));
      if (!result.success) {
        setError(result.message || 'Action failed.');
        setConfirming(false);
        return;
      }
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <div className="w-full">
      <button type="button" onClick={() => setConfirming(true)} disabled={pending}
        className="min-h-14 w-full rounded-xl bg-primary px-5 py-3 font-black uppercase tracking-wide text-white shadow-lg transition hover:bg-navjyoti-blue-dark disabled:opacity-60">
        <span className="flex items-center justify-center gap-2">
          {isCheckIn ? <LogIn className="h-5 w-5" /> : <LogOut className="h-5 w-5" />}
          {isCheckIn ? 'Check In Visitor' : 'Check Out Visitor'}
        </span>
      </button>
      {error && <p role="alert" className="mt-3 text-center text-sm font-semibold text-error">{error}</p>}

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="gate-confirm-title">
          <div className="w-full max-w-[calc(100vw-24px)] sm:max-w-sm max-h-[calc(100dvh-24px)] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <h2 id="gate-confirm-title" className="text-lg sm:text-xl font-black text-on-surface leading-tight break-words">Confirm visitor {isCheckIn ? 'entry' : 'exit'}?</h2>
              <button type="button" onClick={() => setConfirming(false)} aria-label="Cancel" className="rounded-full p-1.5 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"><X className="h-5 w-5" /></button>
            </div>
            <dl className="my-4 sm:my-6 space-y-3 rounded-xl bg-surface p-3 sm:p-4">
              <div><dt className="text-xs font-bold uppercase text-on-surface-variant">Visitor</dt><dd className="font-bold break-words">{visitorName}</dd></div>
              <div><dt className="text-xs font-bold uppercase text-on-surface-variant">Pass</dt><dd className="font-mono break-all text-sm">{passNumber}</dd></div>
              {!isCheckIn && entryTime && <div><dt className="text-xs font-bold uppercase text-on-surface-variant">Entry</dt><dd className="font-bold break-words">{entryTime}</dd></div>}
            </dl>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button type="button" onClick={() => setConfirming(false)} className="min-h-12 rounded-xl border border-outline bg-white font-bold text-sm sm:text-base">Cancel</button>
              <button type="button" onClick={confirm} disabled={pending} className="min-h-12 rounded-xl bg-primary px-2 sm:px-3 font-bold text-white disabled:opacity-60 text-sm sm:text-base">
                {pending ? 'Processing…' : `Confirm ${isCheckIn ? 'Check-In' : 'Check-Out'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
