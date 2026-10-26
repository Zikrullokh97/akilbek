import { useCallback, useRef } from 'react';
import { useGestureStore } from '../store/gestureStore';
import { useSystemStore } from '../store/systemStore';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const gestureStore = useGestureStore();
  const systemStore = useSystemStore();

  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user',
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      systemStore.setStatus({ camera: 'active' });
      return true;
    } catch (err) {
      console.error('Camera access failed:', err);
      systemStore.setStatus({ camera: 'error' });
      return false;
    }
  }, [systemStore]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    systemStore.setStatus({ camera: 'inactive' });
    gestureStore.setTracking(false);
  }, [systemStore, gestureStore]);

  const getDevices = useCallback(async (): Promise<MediaDeviceInfo[]> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(d => d.kind === 'videoinput');
    } catch {
      return [];
    }
  }, []);

  return { videoRef, startCamera, stopCamera, getDevices };
}
