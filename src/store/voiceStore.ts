import { create } from 'zustand';
import type { VoiceState, VoiceSettings, VoiceLanguage } from '../types';

interface VoiceStore extends VoiceState {
  settings: VoiceSettings;
  commandHistory: { transcript: string; command: string; timestamp: number }[];
  
  setListening: (isListening: boolean) => void;
  setTranscript: (transcript: string) => void;
  setInterpretedCommand: (command: string) => void;
  setLanguage: (language: VoiceLanguage) => void;
  setWakeWordActive: (active: boolean) => void;
  updateSettings: (settings: Partial<VoiceSettings>) => void;
  addToHistory: (transcript: string, command: string) => void;
  reset: () => void;
}

const defaultSettings: VoiceSettings = {
  language: 'en-US',
  wakeWord: 'hey gesture',
  pushToTalk: false,
  sensitivity: 0.8,
};

const initialState: VoiceState = {
  isListening: false,
  transcript: '',
  interpretedCommand: '',
  language: 'en-US',
  confidence: 0,
  wakeWordActive: false,
};

export const useVoiceStore = create<VoiceStore>((set, get) => ({
  ...initialState,
  settings: defaultSettings,
  commandHistory: [],

  setListening: (isListening) => set({ isListening }),
  setTranscript: (transcript) => set({ transcript }),
  setInterpretedCommand: (command) => set({ interpretedCommand: command }),
  setLanguage: (language) => set({ language }),
  setWakeWordActive: (active) => set({ wakeWordActive: active }),
  
  updateSettings: (newSettings) => set(state => ({
    settings: { ...state.settings, ...newSettings }
  })),

  addToHistory: (transcript, command) => {
    set(state => ({
      commandHistory: [...state.commandHistory.slice(-50), { transcript, command, timestamp: Date.now() }]
    }));
  },

  reset: () => set({ ...initialState }),
}));
