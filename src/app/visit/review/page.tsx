'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { User, Phone, Briefcase, Calendar, ArrowLeft, Send } from 'lucide-react';
import { NavjyotiBrandHeader } from '@/components/ui/NavjyotiBrandHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { submitVisitorRequest } from '@/app/actions/submitRequest';
import { getPhotoSignedUrl } from '@/app/actions/photo';
import Image from 'next/image';

interface ReviewData {
  visitorName: string;
  visitorMobile: string;
  visitorEmail?: string;
  visitorCompany?: string;
  purpose: string;
  hostName: string;
  type: 'employee' | 'department';
  employeeId?: string;
  departmentCode?: string;
  photoPath?: string;
}

export default function ReviewPage() {
  const router = useRouter();
  const [data, setData] = useState<ReviewData | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedState = sessionStorage.getItem('visitorState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // eslint-disable-next-line
        setData(parsed);
        if (parsed.photoPath) {
          getPhotoSignedUrl(parsed.photoPath).then(url => {
            if (url) setPhotoUrl(url);
          });
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      router.push('/visit');
    }
  }, [router]);

  const handleSubmit = () => {
    if (!data) return;
    setError(null);
    
    // We assume the photo path is in session storage from the state.
    const photoPath = data.photoPath || 'placeholder-path.jpg';
    
    startTransition(async () => {
      const payload: any = {
        visitorName: data.visitorName,
        visitorMobile: data.visitorMobile,
        visitorEmail: (data as any).visitorEmail,
        visitorCompany: data.visitorCompany,
        purpose: data.purpose,
        visitorPhotoPath: photoPath,
        hostSelection: data.type === 'department' 
          ? { type: 'department' as const, id: data.departmentCode! }
          : { type: 'employee' as const, id: data.employeeId! }
      };

      const result = await submitVisitorRequest(payload);
      
      if (result.success && result.requestId) {
        // Clean up session storage except what is needed
        sessionStorage.removeItem('visitorState');
        // Navigate to the status page
        router.push(`/visit/status/${result.requestId}?mode=${result.notificationMode}&token=${result.approvalToken}`);
      } else {
        setError(result.error || "We couldn't send your visit request.");
      }
    });
  };

  if (!data) return null;

  return (
    <div className="min-h-[100dvh] min-h-[100svh] bg-surface flex flex-col items-center pb-[max(8rem,calc(8rem+env(safe-area-inset-bottom)))] overflow-x-hidden">
      <NavjyotiBrandHeader title="Review Your Visit" subtitle="Please verify your details before submitting." />

      <main className="flex-1 w-full max-w-md mx-auto p-3 sm:p-4 space-y-5 sm:space-y-6 min-w-0">
        <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-6 border border-outline shadow-sm space-y-4 sm:space-y-5 relative overflow-hidden">
          {/* Visitor Photo placeholder */}
          <div className="w-24 h-24 bg-surface-container rounded-full mx-auto border-4 border-surface flex items-center justify-center overflow-hidden relative">
             {photoUrl ? (
               <Image 
                 src={photoUrl} 
                 alt="Visitor Photo"
                 fill
                 className="object-cover"
                 unoptimized
               />
             ) : (
               <User className="w-10 h-10 text-on-surface-variant/50" />
             )}
          </div>

          <div className="space-y-4 pt-4 border-t border-outline-variant">
            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-wider text-on-surface-variant uppercase">Name</span>
              <div className="flex items-start space-x-2 mt-1">
                <User className="w-4 h-4 text-secondary mt-1 shrink-0" />
                <span className="text-base font-medium text-on-surface flex-1 break-words">{data.visitorName}</span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-wider text-on-surface-variant uppercase">Mobile</span>
              <div className="flex items-start space-x-2 mt-1">
                <Phone className="w-4 h-4 text-secondary mt-1 shrink-0" />
                <span className="text-base font-medium text-on-surface flex-1 break-words">{data.visitorMobile}</span>
              </div>
            </div>

            {(data as any).visitorEmail && (
              <div className="flex flex-col">
                <span className="text-xs font-semibold tracking-wider text-on-surface-variant uppercase">Email (verified)</span>
                <div className="flex items-start space-x-2 mt-1">
                  <span className="text-base font-medium text-on-surface flex-1 break-words">{(data as any).visitorEmail}</span>
                </div>
              </div>
            )}

            {data.visitorCompany && (
              <div className="flex flex-col">
                <span className="text-xs font-semibold tracking-wider text-on-surface-variant uppercase">Company / Organisation</span>
                <div className="flex items-start space-x-2 mt-1">
                  <Briefcase className="w-4 h-4 text-secondary mt-1 shrink-0" />
                  <span className="text-base font-medium text-on-surface flex-1 break-words">{data.visitorCompany}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-wider text-on-surface-variant uppercase">Person to Meet</span>
              <div className="flex items-start space-x-2 mt-1">
                <User className="w-4 h-4 text-secondary mt-1 shrink-0" />
                <span className="text-base font-medium text-on-surface flex-1 break-words">{data.hostName}</span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-wider text-on-surface-variant uppercase">Purpose</span>
              <div className="flex items-start space-x-2 mt-1">
                <Calendar className="w-4 h-4 text-secondary mt-1 shrink-0" />
                <span className="text-base font-medium text-on-surface flex-1 break-words">{data.purpose}</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-error/10 text-error text-sm rounded-lg border border-error/20 flex flex-col space-y-2">
            <p className="font-semibold">We couldn&apos;t send your visit request.</p>
            <p>{error}</p>
          </div>
        )}

      </main>

      <div className="fixed bottom-0 left-0 w-full md:max-w-md md:left-1/2 md:-translate-x-1/2 p-3 sm:p-4 pb-[max(12px,env(safe-area-inset-bottom))] bg-surface/90 backdrop-blur-md border-t border-outline-variant z-40 flex gap-3 flex-wrap sm:flex-nowrap">
        <PrimaryButton 
          onClick={() => router.push('/visit')}
          disabled={isPending}
          variant="secondary"
          icon={ArrowLeft}
        >
          Edit
        </PrimaryButton>
        <PrimaryButton 
          onClick={handleSubmit}
          isLoading={isPending}
          loadingText="Sending..."
          icon={Send}
          className="flex-[2]"
        >
          Request Approval
        </PrimaryButton>
      </div>
    </div>
  );
}
