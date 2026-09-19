'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCamera } from '@/hooks/useCamera';
import { resizeAndCompressImage } from '@/utils/image';
import { uploadVisitorPhoto } from '@/lib/data/visitor-photos';
import { Camera, RefreshCw, Check, Loader2, AlertCircle } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

export function PhotoCapture() {
  const router = useRouter();
  const { status, errorMessage, startCamera, stopCamera, stream } = useCamera();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleCapture = async () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Draw standard unmirrored but maybe mirrored video frame
      // Mobile cameras usually do not mirror the actual bytes, only the preview might be mirrored by CSS
      // If we mirrored the video preview with scale-x-[-1], the canvas draws the original unmirrored image natively.
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(
        async (blob) => {
          if (blob) {
            setCapturedBlob(blob);
            setPreviewUrl(URL.createObjectURL(blob));
            stopCamera();
          }
        },
        'image/jpeg',
        0.9
      );
    }
  };

  const handleRetake = () => {
    setCapturedBlob(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setUploadError('');
    startCamera();
  };

  const handleFallbackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCapturedBlob(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadError('');
    }
  };

  const handleUsePhoto = async () => {
    if (!capturedBlob) return;

    try {
      setIsUploading(true);
      setUploadError('');

      // Optimize image
      const optimizedBlob = await resizeAndCompressImage(capturedBlob, 1000, 0.8);
      
      // Get session id or create one for temporary storage path
      let sessionId = sessionStorage.getItem('visitorSessionId');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem('visitorSessionId', sessionId);
      }

      // Upload
      const photoPath = await uploadVisitorPhoto(optimizedBlob, sessionId);

      // Save path to visitor state
      const stateStr = sessionStorage.getItem('visitorState');
      if (stateStr) {
        const state = JSON.parse(stateStr);
        state.photoPath = photoPath;
        sessionStorage.setItem('visitorState', JSON.stringify(state));
      }

      // Proceed
      router.push('/visit/review');
    } catch (err) {
      console.error(err);
      setUploadError('We couldn\'t upload your photo. Please check your connection and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (capturedBlob && previewUrl) {
    return (
      <div className="w-full flex flex-col items-center space-y-3 sm:space-y-4">
        <div className="relative w-full max-w-[min(85vw,280px)] sm:max-w-xs aspect-[3/4] bg-black rounded-xl overflow-hidden shadow-lg border border-outline-variant mx-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Captured preview" className="w-full h-full object-cover" />
        </div>

        {uploadError && (
          <div className="w-full p-3 sm:p-4 bg-error-container text-on-error-container rounded-lg flex items-start space-x-2 text-sm break-words">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{uploadError}</p>
          </div>
        )}

        <div className="w-full flex flex-col xs:flex-row gap-3 sm:gap-4">
          <PrimaryButton 
            onClick={handleRetake}
            disabled={isUploading}
            variant="secondary"
            icon={RefreshCw}
            className="w-full"
          >
            Retake
          </PrimaryButton>
          
          <PrimaryButton 
            onClick={handleUsePhoto}
            isLoading={isUploading}
            loadingText="Uploading..."
            icon={Check}
            className="w-full flex-[2]"
          >
            Use Photo
          </PrimaryButton>
        </div>
        
        <p className="text-xs text-center text-on-surface-variant max-w-xs mt-1 px-2">
          Your photo will be used only for visitor identification and your gate pass.
        </p>
      </div>
    );
  }

  if (status === 'requesting') {
    return (
      <div className="w-full flex justify-center">
        <div className="w-full max-w-[min(85vw,280px)] sm:max-w-xs aspect-[3/4] bg-surface-container-low border border-outline-variant rounded-xl flex items-center justify-center mx-auto">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (status === 'denied' || status === 'error' || status === 'unavailable') {
    return (
      <div className="w-full flex flex-col items-center space-y-6 text-center">
        <div className="p-6 bg-error-container text-on-error-container rounded-xl w-full">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-80" />
          <p className="font-semibold mb-2">Camera Access Failed</p>
          <p className="text-sm opacity-90 mb-4">{errorMessage}</p>
          
          <div className="flex flex-col space-y-3 w-full">
            <button 
              onClick={startCamera}
              className="w-full py-2.5 bg-on-error-container text-error-container rounded-lg text-sm font-semibold"
            >
              Try Camera Again
            </button>
            <div className="relative w-full">
              <input 
                type="file" 
                accept="image/*" 
                capture="user" 
                onChange={handleFallbackUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <button className="w-full py-2.5 border border-on-error-container/30 rounded-lg text-sm font-semibold">
                Take / Choose Photo Manually
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'granted') {
    return (
      <div className="w-full flex flex-col items-center space-y-3 sm:space-y-4">
        <div className="relative w-full max-w-[min(85vw,280px)] sm:max-w-xs aspect-[3/4] bg-black rounded-xl overflow-hidden shadow-lg border border-outline-variant mx-auto max-h-[min(55dvh,420px)]">
          {/* Use scale-x-[-1] if we want the preview mirrored. Typical for selfie cameras to act as mirrors. */}
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover scale-x-[-1]"
          />
          <div className="absolute inset-0 border-[3px] border-white/30 m-4 sm:m-8 rounded-lg pointer-events-none"></div>
          <p className="absolute bottom-2 sm:bottom-4 left-0 right-0 text-center text-white/90 text-xs sm:text-sm font-medium drop-shadow-md pointer-events-none px-2">
            Position your face inside the frame
          </p>
        </div>

        <button 
          onClick={handleCapture}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-outline p-1 active:scale-95 transition-transform shrink-0"
          aria-label="Capture Photo"
        >
          <div className="w-full h-full bg-primary rounded-full" />
        </button>
      </div>
    );
  }

  // Idle state
  return (
    <div className="w-full flex flex-col items-center space-y-3 sm:space-y-4">
      <div className="w-full max-w-[min(85vw,280px)] sm:max-w-xs aspect-[3/4] bg-surface-container-low border border-outline-variant rounded-xl flex flex-col items-center justify-center p-6 sm:p-8 text-center mx-auto">
        <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-on-surface-variant/50 mb-3 sm:mb-4" />
        <p className="text-on-surface mb-1 sm:mb-2 font-medium text-sm sm:text-base">Camera access is required</p>
        <p className="text-xs sm:text-sm text-on-surface-variant">to capture your visitor photograph.</p>
      </div>

      <PrimaryButton 
        onClick={startCamera}
        className="w-full"
      >
        Start Camera
      </PrimaryButton>
    </div>
  );
}
