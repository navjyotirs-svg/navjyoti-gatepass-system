'use client';

import { useRef } from 'react';
import { GatePassCard } from '@/components/gate-pass/GatePassCard';
import { GatePassActions } from '@/components/gate-pass/GatePassActions';
import { VisitStatus } from '@/utils/visit';

interface GatePassWrapperProps {
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

export function GatePassWrapper(props: GatePassWrapperProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full flex flex-col items-center">
      <GatePassCard ref={cardRef} {...props} />
      <GatePassActions passRef={cardRef} passNumber={props.passNumber} />
    </div>
  );
}
