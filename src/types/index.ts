// Gesture types
export type GestureType =
  | 'none'
  | 'point'
  | 'pinch'
  | 'double_pinch'
  | 'right_click_pinch'
  | 'fist'
  | 'scroll'
  | 'drag'
  | 'open_palm';

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface GestureState {
  currentGesture: GestureType;
  confidence: number;
  landmarks: HandLandmark[];
  cursorPosition: { x: number; y: number };
  isTracking: boolean;
  gestureMode: boolean;
  fps: number;
}

// Voice types
export type VoiceLanguage = 'en-US' | 'uz-UZ' | 'ru-RU' | 'ko-KR';

export interface VoiceState {
  isListening: boolean;
  transcript: string;
  interpretedCommand: string;
  language: VoiceLanguage;
  confidence: number;
  wakeWordActive: boolean;
}

// WebSocket types
export interface WSCommand {
  version: string;
  request_id: string;
  type: string;
  payload: Record<string, unknown>;
}

export interface WSResponse {
  request_id: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: Record<string, unknown>;
}

export interface AgentStatus {
  connected: boolean;
  latency: number;
  lastCommand: string;
  capabilities: string[];
}

// AI types
export interface AICommand {
  intent: string;
  application?: string;
  query?: string;
  action?: string;
  parameters?: Record<string, unknown>;
  requires_confirmation: boolean;
}

// System status
export interface SystemStatus {
  camera: 'active' | 'inactive' | 'error';
  microphone: 'active' | 'inactive' | 'error';
  agent: 'connected' | 'disconnected' | 'error';
  gestures: 'active' | 'inactive' | 'paused';
  voice: 'active' | 'inactive' | 'error';
  ai: 'ready' | 'unavailable' | 'processing';
}

// Settings
export interface GestureSettings {
  sensitivity: number;
  smoothing: number;
  pinchThreshold: number;
  dominantHand: 'left' | 'right' | 'both';
  enabled: boolean;
  cursorSpeed: number;
}

export interface VoiceSettings {
  language: VoiceLanguage;
  wakeWord: string;
  pushToTalk: boolean;
  sensitivity: number;
}
