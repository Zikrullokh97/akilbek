import { useEffect, useRef, useCallback } from 'react';
import { useGestureStore } from '../store/gestureStore';
import { useSystemStore } from '../store/systemStore';
import type { GestureType, HandLandmark } from '../types';

// Gesture classification using landmark geometry
function classifyGesture(landmarks: HandLandmark[], settings: { pinchThreshold: number; sensitivity: number }): GestureType {
  if (landmarks.length < 21) return 'none';

  const thumb = landmarks[4];
  const index = landmarks[8];
  const middle = landmarks[12];
  const ring = landmarks[16];
  const pinky = landmarks[20];
  const wrist = landmarks[0];
  const indexMCP = landmarks[5];
  const middleMCP = landmarks[9];

  // Calculate distances
  const dist = (a: HandLandmark, b: HandLandmark) =>
    Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);

  const thumbIndexDist = dist(thumb, index);
  const thumbMiddleDist = dist(thumb, middle);

  // Finger extension detection
  const indexExtended = index.y < indexMCP.y - 0.02;
  const middleExtended = middle.y < middleMCP.y - 0.02;
  const ringExtended = ring.y < landmarks[13].y - 0.02;
  const pinkyExtended = pinky.y < landmarks[17].y - 0.02;

  // Open palm: all fingers extended
  if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
    return 'open_palm';
  }

  // Fist: no fingers extended
  if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    return 'fist';
  }

  // Pinch: thumb + index close together
  if (thumbIndexDist < settings.pinchThreshold) {
    return 'pinch';
  }

  // Right click pinch: thumb + middle close
  if (thumbMiddleDist < settings.pinchThreshold) {
    return 'right_click_pinch';
  }

  // Point: only index extended
  if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    return 'point';
  }

  // Scroll: index + middle extended, moving vertically
  if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
    return 'scroll';
  }

  // Drag: pinch with movement (handled by state machine)
  if (thumbIndexDist < settings.pinchThreshold * 1.5) {
    return 'drag';
  }

  return 'none';
}

// Calculate smoothed cursor position
function smoothPosition(
  current: { x: number; y: number },
  target: { x: number; y: number },
  factor: number
): { x: number; y: number } {
  return {
    x: current.x + (target.x - current.x) * (1 - factor),
    y: current.y + (target.y - current.y) * (1 - factor),
  };
}

export function useGestureEngine(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const gestureStore = useGestureStore();
  const systemStore = useSystemStore();
  const handLandmarkerRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const fpsCounterRef = useRef<number[]>([]);
  const smoothPosRef = useRef({ x: 0, y: 0 });
  const palmHoldStartRef = useRef<number | null>(null);
  const dragActiveRef = useRef(false);

  const detect = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !handLandmarkerRef.current || !gestureStore.settings.enabled) {
      animFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    if (video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    const now = performance.now();
    
    try {
      const results = handLandmarkerRef.current.detectForVideo(video, now);
      
      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks: HandLandmark[] = results.landmarks[0].map((lm: any) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
        }));

        gestureStore.setLandmarks(landmarks);
        gestureStore.setTracking(true);

        // Classify gesture
        const gesture = classifyGesture(landmarks, gestureStore.settings);
        const confidence = results.handWorldLandmarks?.[0] ? 0.85 : 0.6;
        gestureStore.setGesture(gesture, confidence);

        // Cursor control - index finger tip for pointing
        if (gesture === 'point' && gestureStore.gestureMode) {
          const indexTip = landmarks[8];
          // Mirror X coordinate for natural movement
          const targetX = (1 - indexTip.x) * window.innerWidth;
          const targetY = indexTip.y * window.innerHeight;
          
          const smoothed = smoothPosition(
            smoothPosRef.current,
            { x: targetX, y: targetY },
            gestureStore.settings.smoothing
          );
          smoothPosRef.current = smoothed;
          gestureStore.setCursorPosition(smoothed.x, smoothed.y);
        }

        // Open palm hold detection for gesture mode toggle
        if (gesture === 'open_palm') {
          if (!palmHoldStartRef.current) {
            palmHoldStartRef.current = now;
          } else if (now - palmHoldStartRef.current > 1000) {
            gestureStore.setGestureMode(!gestureStore.gestureMode);
            palmHoldStartRef.current = null;
          }
        } else {
          palmHoldStartRef.current = null;
        }

        // Drag state machine
        if (gesture === 'drag' && gestureStore.gestureMode) {
          if (!dragActiveRef.current) {
            dragActiveRef.current = true;
          }
        } else if (dragActiveRef.current && gesture !== 'drag') {
          dragActiveRef.current = false;
        }
      } else {
        gestureStore.setTracking(false);
        gestureStore.setGesture('none', 0);
      }
    } catch (err) {
      console.error('Gesture detection error:', err);
    }

    // FPS calculation
    if (lastFrameTimeRef.current > 0) {
      const delta = now - lastFrameTimeRef.current;
      fpsCounterRef.current.push(1000 / delta);
      if (fpsCounterRef.current.length > 30) fpsCounterRef.current.shift();
      const avgFps = fpsCounterRef.current.reduce((a, b) => a + b, 0) / fpsCounterRef.current.length;
      gestureStore.setFPS(Math.round(avgFps));
    }
    lastFrameTimeRef.current = now;

    animFrameRef.current = requestAnimationFrame(detect);
  }, [videoRef, gestureStore, systemStore]);

  const start = useCallback(async () => {
    try {
      const vision = await import('@mediapipe/tasks-vision');
      const { HandLandmarker, FilesetResolver } = vision;

      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      handLandmarkerRef.current = await HandLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      systemStore.setStatus({ camera: 'active', gestures: 'active' });
      animFrameRef.current = requestAnimationFrame(detect);
    } catch (err) {
      console.error('Failed to initialize MediaPipe:', err);
      systemStore.setStatus({ camera: 'error', gestures: 'inactive' });
    }
  }, [detect, systemStore]);

  const stop = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (handLandmarkerRef.current) {
      handLandmarkerRef.current.close();
      handLandmarkerRef.current = null;
    }
    gestureStore.setTracking(false);
    systemStore.setStatus({ camera: 'inactive', gestures: 'inactive' });
  }, [gestureStore, systemStore]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return { start, stop, handLandmarkerRef };
}
