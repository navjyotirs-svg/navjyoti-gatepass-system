'use client';

import React, { useState } from 'react';

interface ApprovalFormProps {
  requestReference: string;
  token: string;
}

export function ApprovalForm({ requestReference, token }: ApprovalFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<'approved' | 'rejected' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDecision = async (decision: 'approved' | 'rejected') => {
    if (decision === 'rejected') {
      const confirmReject = window.confirm("Reject this visitor request?");
      if (!confirmReject) return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestReference, token, decision }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to process decision.');
      }

      setResult(decision);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (result === 'approved') {
    return (
      <div className="fixed bottom-0 left-0 w-full md:max-w-md md:left-1/2 md:-translate-x-1/2 p-6 bg-surface/95 backdrop-blur-md border-t border-outline-variant z-40 text-center shadow-lg">
        <h3 className="text-lg font-bold text-secondary mb-2">Visitor Approved</h3>
        <p className="text-on-surface-variant text-sm">The visitor request has been approved successfully.</p>
      </div>
    );
  }

  if (result === 'rejected') {
    return (
      <div className="fixed bottom-0 left-0 w-full md:max-w-md md:left-1/2 md:-translate-x-1/2 p-6 bg-surface/95 backdrop-blur-md border-t border-outline-variant z-40 text-center shadow-lg">
        <h3 className="text-lg font-bold text-error mb-2">Visitor Request Rejected</h3>
        <p className="text-on-surface-variant text-sm">The visitor request has been rejected.</p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 w-full md:max-w-md md:left-1/2 md:-translate-x-1/2 p-4 bg-surface/95 backdrop-blur-md border-t border-outline-variant z-40 shadow-lg">
      {error && <p className="text-error text-center text-sm mb-4 bg-error/10 py-2 rounded-lg">{error}</p>}
      <div className="flex space-x-4">
        <button
          onClick={() => handleDecision('rejected')}
          disabled={isProcessing}
          className="flex-1 h-12 bg-surface-container-high text-error rounded-lg text-sm font-semibold uppercase tracking-wider flex items-center justify-center transition-colors hover:bg-error/10 focus:outline-none focus:ring-2 focus:ring-error/20 disabled:opacity-50"
        >
          Reject
        </button>
        <button
          onClick={() => handleDecision('approved')}
          disabled={isProcessing}
          className="flex-1 h-12 bg-primary text-on-primary rounded-lg text-sm font-semibold uppercase tracking-wider flex items-center justify-center transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Approve'}
        </button>
      </div>
    </div>
  );
}
