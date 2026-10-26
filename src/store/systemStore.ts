import { create } from 'zustand';
import type { SystemStatus, AgentStatus, WSResponse } from '../types';

interface SystemStore {
  status: SystemStatus;
  agent: AgentStatus;
  emergencyStop: boolean;
  theme: 'dark' | 'light';
  activeSection: string;
  wsMessages: WSResponse[];
  performanceMetrics: {
    cameraFps: number;
    gestureLatency: number;
    wsLatency: number;
    executionLatency: number;
    cpuUsage: number;
    memoryUsage: number;
  };

  setStatus: (status: Partial<SystemStatus>) => void;
  setAgentStatus: (agent: Partial<AgentStatus>) => void;
  setEmergencyStop: (enabled: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setActiveSection: (section: string) => void;
  addWSMessage: (msg: WSResponse) => void;
  setPerformanceMetrics: (metrics: Partial<SystemStore['performanceMetrics']>) => void;
}

export const useSystemStore = create<SystemStore>((set) => ({
  status: {
    camera: 'inactive',
    microphone: 'inactive',
    agent: 'disconnected',
    gestures: 'inactive',
    voice: 'inactive',
    ai: 'unavailable',
  },
  agent: {
    connected: false,
    latency: 0,
    lastCommand: '',
    capabilities: [],
  },
  emergencyStop: false,
  theme: 'dark',
  activeSection: 'overview',
  wsMessages: [],
  performanceMetrics: {
    cameraFps: 0,
    gestureLatency: 0,
    wsLatency: 0,
    executionLatency: 0,
    cpuUsage: 0,
    memoryUsage: 0,
  },

  setStatus: (status) => set(state => ({
    status: { ...state.status, ...status }
  })),
  setAgentStatus: (agent) => set(state => ({
    agent: { ...state.agent, ...agent }
  })),
  setEmergencyStop: (enabled) => set({ emergencyStop: enabled }),
  setTheme: (theme) => set({ theme }),
  setActiveSection: (section) => set({ activeSection: section }),
  addWSMessage: (msg) => set(state => ({
    wsMessages: [...state.wsMessages.slice(-100), msg]
  })),
  setPerformanceMetrics: (metrics) => set(state => ({
    performanceMetrics: { ...state.performanceMetrics, ...metrics }
  })),
}));
