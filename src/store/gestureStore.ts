import { create } from 'zustand';
import type { GestureState, GestureType, GestureSettings } from '../types';

interface GestureStore extends GestureState {
  settings: GestureSettings;
  gestureHistory: { gesture: GestureType; timestamp: number }[];
  pinchStartTime: number | null;
  lastClickTime: number;
  dragStartPos: { x: number; y: number } | null;
  
  // Actions
  setGesture: (gesture: GestureType, confidence: number) => void;
  setLandmarks: (landmarks: GestureState['landmarks']) => void;
  setCursorPosition: (x: number, y: number) => void;
  setTracking: (isTracking: boolean) => void;
  setGestureMode: (enabled: boolean) => void;
  setFPS: (fps: number) => void;
  updateSettings: (settings: Partial<GestureSettings>) => void;
  reset: () => void;
}

const defaultSettings: GestureSettings = {
  sensitivity: 0.7,
  smoothing: 0.6,
  pinchThreshold: 0.06,
  dominantHand: 'right',
  enabled: true,
  cursorSpeed: 1.0,
};

const initialState: GestureState = {
  currentGesture: 'none',
  confidence: 0,
  landmarks: [],
  cursorPosition: { x: 0, y: 0 },
  isTracking: false,
  gestureMode: false,
  fps: 0,
};

export const useGestureStore = create<GestureStore>((set, get) => ({
  ...initialState,
  settings: defaultSettings,
  gestureHistory: [],
  pinchStartTime: null,
  lastClickTime: 0,
  dragStartPos: null,

  setGesture: (gesture, confidence) => {
    const state = get();
    const now = Date.now();
    
    // Handle double pinch detection
    if (gesture === 'pinch') {
      if (now - state.lastClickTime < 400) {
        set({ currentGesture: 'double_pinch', confidence });
        set(state => ({ 
          lastClickTime: 0,
          gestureHistory: [...state.gestureHistory.slice(-20), { gesture: 'double_pinch', timestamp: now }]
        }));
        return;
      }
      set(state => ({ lastClickTime: now }));
    }

    set({ currentGesture: gesture, confidence });
    set(state => ({
      gestureHistory: [...state.gestureHistory.slice(-20), { gesture, timestamp: now }]
    }));
  },

  setLandmarks: (landmarks) => set({ landmarks }),
  
  setCursorPosition: (x, y) => set({ cursorPosition: { x, y } }),
  
  setTracking: (isTracking) => set({ isTracking }),
  
  setGestureMode: (enabled) => set({ gestureMode: enabled }),
  
  setFPS: (fps) => set({ fps }),
  
  updateSettings: (newSettings) => set(state => ({
    settings: { ...state.settings, ...newSettings }
  })),

  reset: () => set({ ...initialState }),
}));
