import { useState, useCallback, useEffect } from 'react';

export type CameraStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable' | 'error';

export function useCamera() {
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    setStream(currentStream => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      return null;
    });
    setStatus(prev => prev === 'granted' ? 'idle' : prev);
  }, []);

  const startCamera = useCallback(async () => {
    setStatus('requesting');
    setErrorMessage('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('unavailable');
      setErrorMessage('Camera access is not supported by this browser.');
      return null;
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      setStream(newStream);
      setStatus('granted');
      return newStream;
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setStatus('denied');
        setErrorMessage('Camera access was denied. Please allow camera access from your browser settings and try again.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setStatus('unavailable');
        setErrorMessage('No camera is available on this device.');
      } else {
        setStatus('error');
        setErrorMessage(error.message || 'An unknown error occurred while accessing the camera.');
      }
      return null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    status,
    errorMessage,
    startCamera,
    stopCamera,
    stream
  };
}
