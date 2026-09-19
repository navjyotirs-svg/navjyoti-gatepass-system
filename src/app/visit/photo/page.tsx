'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { NavjyotiBrandHeader } from '@/components/ui/NavjyotiBrandHeader';
import { PhotoCapture } from '@/components/visitor/PhotoCapture';

export default function PhotoCapturePlaceholder() {
  const router = useRouter();
  useEffect(() => {
    const savedState = sessionStorage.getItem('visitorState');
    if (!savedState) {
      router.push('/visit');
    }
  }, [router]);

  return (
    <div className="min-h-[100dvh] min-h-[100svh] bg-surface flex flex-col items-center overflow-x-hidden">
      <NavjyotiBrandHeader variant="compact" />

      <main className="flex-1 w-full max-w-md mx-auto flex flex-col items-center px-3 sm:px-4 py-2 md:py-4 min-w-0">
        <div className="w-full space-y-3 sm:space-y-4 min-w-0">
          <button onClick={() => router.back()} className="flex items-center text-sm font-semibold text-secondary mb-1 sm:mb-2 min-h-[44px]">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to details
          </button>

          <div className="text-center pb-1 sm:pb-2">
            <h1 className="text-[clamp(18px,5vw,20px)] font-bold text-on-surface leading-tight">Take Your Photo</h1>
            <p className="text-[13px] sm:text-sm text-on-surface-variant mt-1">Please position your face clearly in the frame.</p>
          </div>

          <div className="w-full min-w-0 landscape:flex landscape:gap-4 landscape:items-center">
            <PhotoCapture />
          </div>
        </div>
      </main>
    </div>
  );
}
