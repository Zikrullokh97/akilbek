import { useRef, useEffect, useCallback, useState } from 'react';
import { useGestureStore } from '../store/gestureStore';
import { useSystemStore } from '../store/systemStore';
import { Camera, CameraOff, Maximize2, Minimize2 } from 'lucide-react';

export default function CameraPanel({ 
  videoRef, 
  onStartCamera, 
  onStopCamera 
}: { 
  videoRef: React.RefObject<HTMLVideoElement>;
  onStartCamera: () => Promise<boolean>;
  onStopCamera: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { landmarks, currentGesture, isTracking, fps, cursorPosition, gestureMode } = useGestureStore();
  const { status } = useSystemStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);

  const handleStartCamera = useCallback(async () => {
    const success = await onStartCamera();
    setCameraStarted(success);
  }, [onStartCamera]);

  const handleStopCamera = useCallback(() => {
    onStopCamera();
    setCameraStarted(false);
  }, [onStopCamera]);

  // Draw landmarks on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || landmarks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    const connections = [
      [0,1],[1,2],[2,3],[3,4],       // Thumb
      [0,5],[5,6],[6,7],[7,8],       // Index
      [0,9],[9,10],[10,11],[11,12],  // Middle
      [0,13],[13,14],[14,15],[15,16],// Ring
      [0,17],[17,18],[18,19],[19,20],// Pinky
      [5,9],[9,13],[13,17],          // Palm
    ];

    ctx.strokeStyle = 'rgba(0, 200, 255, 0.6)';
    ctx.lineWidth = 2;

    for (const [start, end] of connections) {
      if (landmarks[start] && landmarks[end]) {
        ctx.beginPath();
        ctx.moveTo(landmarks[start].x * canvas.width, landmarks[start].y * canvas.height);
        ctx.lineTo(landmarks[end].x * canvas.width, landmarks[end].y * canvas.height);
        ctx.stroke();
      }
    }

    // Draw landmarks
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      const x = lm.x * canvas.width;
      const y = lm.y * canvas.height;
      
      ctx.beginPath();
      ctx.arc(x, y, i === 8 ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = i === 8 ? '#00ff88' : i === 4 ? '#ff6600' : '#00c8ff';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw cursor indicator
    if (gestureMode && currentGesture === 'point') {
      ctx.beginPath();
      ctx.arc(cursorPosition.x * canvas.width / window.innerWidth, cursorPosition.y * canvas.height / window.innerHeight, 8, 0, Math.PI * 2);
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [landmarks, currentGesture, cursorPosition, gestureMode, videoRef]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Live Camera Feed</h2>
        <div className="flex gap-2">
          {!cameraStarted ? (
            <button
              onClick={handleStartCamera}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
            >
              <Camera size={16} />
              Start Camera
            </button>
          ) : (
            <button
              onClick={handleStopCamera}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 hover:bg-red-500/30 transition-all"
            >
              <CameraOff size={16} />
              Stop Camera
            </button>
          )}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
          >
            {isFullscreen ? <Minimize2 size={16} className="text-gray-400" /> : <Maximize2 size={16} className="text-gray-400" />}
          </button>
        </div>
      </div>

      <div className={`relative bg-black/50 rounded-2xl overflow-hidden border border-white/10 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
        <div className="relative aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full object-cover transform -scale-x-100"
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full transform -scale-x-100"
          />
          
          {/* Overlay info */}
          <div className="absolute top-3 left-3 flex gap-2">
            <div className={`px-2 py-1 rounded-lg text-xs font-medium ${isTracking ? 'bg-emerald-500/80 text-white' : 'bg-red-500/80 text-white'}`}>
              {isTracking ? '● Tracking' : '○ No Hand'}
            </div>
            {gestureMode && (
              <div className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-500/80 text-white">
                Gesture Mode Active
              </div>
            )}
          </div>

          <div className="absolute top-3 right-3 flex gap-2">
            <div className="px-2 py-1 rounded-lg text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
              {fps} FPS
            </div>
          </div>

          {/* Gesture display */}
          <div className="absolute bottom-3 left-3 right-3">
            <div className="bg-black/60 backdrop-blur-sm rounded-xl p-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Detected Gesture</span>
                <span className="text-white font-mono font-bold capitalize text-lg">
                  {currentGesture !== 'none' ? currentGesture.replace('_', ' ') : '—'}
                </span>
              </div>
              <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-200"
                  style={{ width: `${useGestureStore.getState().confidence * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* No camera placeholder */}
          {!cameraStarted && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90">
              <Camera size={48} className="text-gray-600 mb-3" />
              <p className="text-gray-400 text-sm">Camera not started</p>
              <p className="text-gray-500 text-xs mt-1">Click "Start Camera" to begin hand tracking</p>
            </div>
          )}
        </div>
      </div>

      {/* Gesture Legend */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Gesture Reference</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { gesture: 'Point', desc: 'Move cursor', icon: '☝️' },
            { gesture: 'Pinch', desc: 'Left click', icon: '🤏' },
            { gesture: 'Fist', desc: 'Pause control', icon: '✊' },
            { gesture: 'Open Palm', desc: 'Toggle mode', icon: '🖐️' },
            { gesture: '2-Finger', desc: 'Scroll', icon: '✌️' },
            { gesture: 'Pinch+Hold', desc: 'Drag', icon: '🤏💫' },
            { gesture: 'Thumb+Mid', desc: 'Right click', icon: '👌' },
            { gesture: '2× Pinch', desc: 'Double click', icon: '🤏🤏' },
          ].map(({ gesture, desc, icon }) => (
            <div key={gesture} className={`flex items-center gap-2 p-2 rounded-lg ${currentGesture.toLowerCase().includes(gesture.toLowerCase().split(' ')[0]) ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-white/5'}`}>
              <span className="text-lg">{icon}</span>
              <div>
                <p className="text-xs text-white font-medium">{gesture}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
