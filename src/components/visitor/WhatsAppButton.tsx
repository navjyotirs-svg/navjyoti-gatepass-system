'use client';

import { useState } from 'react';

interface WhatsAppButtonProps {
  requestId: string;
  hostName: string;
}

export function WhatsAppButton({ requestId, hostName }: WhatsAppButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/whatsapp/${requestId}`);
      if (!response.ok) {
        throw new Error('Failed to generate WhatsApp link');
      }
      
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No URL returned');
      }
    } catch (err) {
      console.error(err);
      alert('Unable to open WhatsApp right now.\nPlease use manual approval.');
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 space-y-3">
      <button 
        onClick={handleClick}
        disabled={isLoading}
        className="w-full h-[52px] bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center shadow-sm active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Opening WhatsApp...' : 'Notify on WhatsApp'}
      </button>
      <p className="text-xs text-center text-on-surface-variant/70">
        Opens WhatsApp to notify {hostName}.
      </p>
    </div>
  );
}
