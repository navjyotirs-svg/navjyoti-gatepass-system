'use client';

import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { forwardRef, useState, useEffect } from 'react';
import { formatIstTime, VisitStatus } from '@/utils/visit';

interface GatePassCardProps {
  passNumber: string;
  visitorName: string;
  visitorMobile: string;
  visitorPhotoUrl: string | null;
  hostName: string;
  department: string | null;
  purpose: string;
  company?: string;
  approvedAt: string;
  verificationToken: string;
  visitStatus?: VisitStatus;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  visitDurationMinutes?: number | null;
}

export const GatePassCard = forwardRef<HTMLDivElement, GatePassCardProps>(({
  passNumber,
  visitorName,
  visitorMobile,
  visitorPhotoUrl,
  hostName,
  department,
  purpose,
  company,
  approvedAt,
  verificationToken,
  visitStatus = 'not_checked_in',
  checkInAt = null,
  checkOutAt = null,
  visitDurationMinutes = null,
}, ref) => {
  const [origin, setOrigin] = useState('https://navjyoti-gatepass.com');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const qrUrl = `${origin}/verify/${passNumber}?token=${verificationToken}`;
  const lifecycleLabel = visitStatus === 'checked_in' ? 'INSIDE PREMISES' : visitStatus === 'checked_out' ? 'VISIT COMPLETED' : 'APPROVED';

  const formatOnlyDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const formatOnlyTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date).toUpperCase();
    } catch {
      return dateString;
    }
  };

  return (
    <div
      ref={ref}
      className="relative bg-white border border-[#e2e2e2] rounded-[16px] overflow-hidden mx-auto font-sans flex flex-col"
      style={{
        background: '#ffffff',
        color: '#050505',
        boxShadow: '0 12px 30px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)',
        maxWidth: '640px',
        width: '100%',
        aspectRatio: '1.588 / 1', // CR80 ID Card aspect ratio
        containerType: 'inline-size', // Enable cqw units for perfect scaling
      }}
    >
      {/* Header Band */}
      <div 
        className="h-[12cqw] w-full shrink-0 flex items-center px-[4cqw] relative border-b" 
        style={{ 
          background: 'linear-gradient(90deg, #f8f9fa 0%, #ffffff 100%)', 
          borderColor: '#FF6A00',
          borderBottomWidth: 'max(2px, 0.4cqw)'
        }}
      >
        <div className="flex-1 flex items-center justify-between z-10 w-full">
          <div className="flex items-center h-full py-[0.5cqw]">
            <div className="relative h-[9.5cqw] w-[45cqw]">
              <Image 
                src="/navjyoti-brand-logo-3d.png" 
                alt="Navjyoti Logo" 
                fill 
                className="object-contain object-left" 
                priority
              />
            </div>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="text-[1.8cqw] font-bold text-gray-500 uppercase tracking-widest mb-[0.2cqw]">Pass Number</span>
            <span className="text-[2.2cqw] font-mono font-black text-[#050505] bg-gray-100 px-[1.5cqw] py-[0.4cqw] rounded-[0.8cqw]">{passNumber}</span>
          </div>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="flex-1 flex w-full p-[3cqw] gap-[3.5cqw]">
        
        {/* Left - Photo */}
        <div className="w-[24cqw] flex flex-col items-center shrink-0">
          <div className="relative w-full aspect-[0.78/1] rounded-[2cqw] overflow-hidden bg-gray-50 border-2 border-gray-200 shadow-inner mb-[1.5cqw]">
            {visitorPhotoUrl ? (
              <Image 
                src={visitorPhotoUrl} 
                alt="Visitor" 
                fill 
                className="object-cover" 
                crossOrigin="anonymous" 
                unoptimized 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-[2cqw] font-medium">No Photo</div>
            )}
          </div>
          <div className={`w-full py-[1cqw] rounded-[1cqw] flex items-center justify-center border ${
            visitStatus === 'checked_in' ? 'bg-[#15803d]/10 text-[#15803d] border-[#15803d]/20' : 
            visitStatus === 'checked_out' ? 'bg-gray-100 text-gray-600 border-gray-200' : 
            'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            <span className="text-[1.9cqw] font-black uppercase tracking-wider">{lifecycleLabel}</span>
          </div>
        </div>

        {/* Center - Details */}
        <div className="flex-1 min-w-0 flex flex-col pt-[0.5cqw]">
          <div className="flex flex-col mb-[2.5cqw]">
            <h3 className="text-[4.5cqw] font-black text-[#050505] uppercase tracking-tight leading-[1.1] mb-[0.8cqw] truncate">{visitorName}</h3>
            <span className="text-[2.5cqw] font-bold text-gray-700 leading-none mb-[0.8cqw]">{visitorMobile}</span>
            {company && <span className="text-[2cqw] font-semibold text-gray-500 leading-none truncate w-full">{company}</span>}
          </div>

          <div className="flex flex-col gap-[1cqw]">
            <div className="flex items-start">
              <span className="text-[1.7cqw] font-bold text-gray-400 uppercase w-[12cqw] shrink-0 mt-[0.3cqw]">Meeting</span>
              <span className="text-[2.3cqw] font-black text-[#050505] leading-tight flex-1">{hostName}</span>
            </div>
            <div className="flex items-start">
              <span className="text-[1.7cqw] font-bold text-gray-400 uppercase w-[12cqw] shrink-0 mt-[0.3cqw]">Purpose</span>
              <span className="text-[2cqw] font-semibold text-gray-700 leading-tight flex-1">{purpose}</span>
            </div>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-[2cqw] bg-[#f8fafc] rounded-[1.5cqw] p-[1.5cqw] border border-gray-200">
            <div>
              <span className="block text-[1.6cqw] font-bold text-gray-400 uppercase mb-[0.2cqw]">Entry Time</span>
              <span className="block text-[2.2cqw] font-black text-[#050505]">{checkInAt ? formatIstTime(checkInAt) : 'Not Yet'}</span>
            </div>
            <div>
              <span className="block text-[1.6cqw] font-bold text-gray-400 uppercase mb-[0.2cqw]">Exit Time</span>
              <span className="block text-[2.2cqw] font-black text-[#050505]">{formatIstTime(checkOutAt)}</span>
            </div>
          </div>
        </div>

        {/* Right - QR Code */}
        <div className="w-[18cqw] flex flex-col items-center shrink-0 pt-[0.5cqw]">
          <div className="w-full aspect-square bg-white rounded-[1.5cqw] p-[1.2cqw] border-2 border-gray-200 mb-[2cqw] shadow-sm">
            <QRCodeSVG value={qrUrl} size={256} className="w-full h-full" level="M" />
          </div>
          <div className="w-full text-center">
            <span className="text-[1.5cqw] font-bold text-gray-500 leading-[1.3] block">Scan at gate to verify identity</span>
          </div>
        </div>
        
      </div>

      {/* Footer Band */}
      <div className="h-[4.5cqw] w-full bg-[#050505] shrink-0 flex items-center justify-between px-[4cqw]">
        <span className="text-[1.6cqw] font-semibold text-white/70 uppercase tracking-wide">Navjyoti Digital Gate Pass System</span>
        <span className="text-[1.6cqw] font-bold text-white tracking-widest uppercase">Valid: {formatOnlyDate(approvedAt)}</span>
      </div>
    </div>
  );
});

GatePassCard.displayName = 'GatePassCard';
