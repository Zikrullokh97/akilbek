import { useCallback, useRef } from 'react';
import { useVoiceStore } from '../store/voiceStore';
import { useSystemStore } from '../store/systemStore';
import type { VoiceLanguage, AICommand } from '../types';

// Command intent parser - maps voice transcripts to structured commands
function parseIntent(transcript: string, language: VoiceLanguage): AICommand | null {
  const lower = transcript.toLowerCase().trim();
  
  // English commands
  if (language === 'en-US') {
    const appPatterns: Record<string, string> = {
      'open safari': 'open_application',
      'open chrome': 'open_application',
      'open firefox': 'open_application',
      'open finder': 'open_application',
      'open terminal': 'open_application',
      'open calculator': 'open_application',
      'open notes': 'open_application',
      'close window': 'close_window',
      'close the current window': 'close_window',
      'next application': 'focus_application',
      'switch application': 'focus_application',
      'increase volume': 'set_volume',
      'decrease volume': 'set_volume',
      'mute': 'set_volume',
      'increase brightness': 'set_brightness',
      'decrease brightness': 'set_brightness',
      'take a screenshot': 'take_screenshot',
      'screenshot': 'take_screenshot',
      'lock screen': 'lock_screen',
      'lock my screen': 'lock_screen',
      'open youtube': 'open_url',
      'search google': 'browser_search',
      'scroll down': 'mouse_scroll',
      'scroll up': 'mouse_scroll',
      'go back': 'browser_back',
      'new tab': 'new_tab',
      'close tab': 'close_tab',
    };

    for (const [pattern, intent] of Object.entries(appPatterns)) {
      if (lower.includes(pattern)) {
        const cmd: AICommand = {
          intent,
          requires_confirmation: intent === 'lock_screen',
        };

        // Extract application name
        if (intent === 'open_application') {
          const appMatch = lower.match(/open\s+(\w+)/);
          if (appMatch) cmd.application = appMatch[1];
        }

        // Extract search query
        if (intent === 'browser_search') {
          const queryMatch = lower.match(/search\s+google\s+for\s+(.+)/);
          if (queryMatch) cmd.query = queryMatch[1];
        }

        // Extract URL
        if (intent === 'open_url') {
          const urlMatch = lower.match(/open\s+(.+)/);
          if (urlMatch) cmd.query = urlMatch[1];
        }

        // Volume direction
        if (intent === 'set_volume') {
          if (lower.includes('increase') || lower.includes('up')) cmd.parameters = { direction: 'up' };
          else if (lower.includes('decrease') || lower.includes('down')) cmd.parameters = { direction: 'down' };
          else if (lower.includes('mute')) cmd.parameters = { direction: 'mute' };
        }

        // Scroll direction
        if (intent === 'mouse_scroll') {
          cmd.parameters = { direction: lower.includes('up') ? 'up' : 'down' };
        }

        return cmd;
      }
    }
  }

  // Uzbek commands
  if (language === 'uz-UZ') {
    const uzPatterns: Record<string, AICommand> = {
      'safari': { intent: 'open_application', application: 'Safari', requires_confirmation: false },
      'och': { intent: 'open_application', application: 'Safari', requires_confirmation: false },
      'ovozni balandlat': { intent: 'set_volume', parameters: { direction: 'up' }, requires_confirmation: false },
      'ovozni pasaytir': { intent: 'set_volume', parameters: { direction: 'down' }, requires_confirmation: false },
      'skrinshot ol': { intent: 'take_screenshot', requires_confirmation: false },
      'ekranni qulfla': { intent: 'lock_screen', requires_confirmation: true },
      'yangi oyna och': { intent: 'new_tab', requires_confirmation: false },
    };

    for (const [pattern, cmd] of Object.entries(uzPatterns)) {
      if (lower.includes(pattern)) return { ...cmd };
    }
  }

  // Russian commands
  if (language === 'ru-RU') {
    const ruPatterns: Record<string, AICommand> = {
      'открой браузер': { intent: 'open_application', application: 'Safari', requires_confirmation: false },
      'увеличь громкость': { intent: 'set_volume', parameters: { direction: 'up' }, requires_confirmation: false },
      'уменьши громкость': { intent: 'set_volume', parameters: { direction: 'down' }, requires_confirmation: false },
      'сделай скриншот': { intent: 'take_screenshot', requires_confirmation: false },
      'заблокируй экран': { intent: 'lock_screen', requires_confirmation: true },
    };

    for (const [pattern, cmd] of Object.entries(ruPatterns)) {
      if (lower.includes(pattern)) return { ...cmd };
    }
  }

  // Korean commands
  if (language === 'ko-KR') {
    const koPatterns: Record<string, AICommand> = {
      '사파리 열어': { intent: 'open_application', application: 'Safari', requires_confirmation: false },
      '볼륨 높여': { intent: 'set_volume', parameters: { direction: 'up' }, requires_confirmation: false },
      '볼륨 낮춰': { intent: 'set_volume', parameters: { direction: 'down' }, requires_confirmation: false },
      '스크린샷 찍어': { intent: 'take_screenshot', requires_confirmation: false },
      '화면 잠겨': { intent: 'lock_screen', requires_confirmation: true },
    };

    for (const [pattern, cmd] of Object.entries(koPatterns)) {
      if (lower.includes(pattern)) return { ...cmd };
    }
  }

  return null;
}

export function useVoiceEngine() {
  const voiceStore = useVoiceStore();
  const systemStore = useSystemStore();
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser');
      systemStore.setStatus({ voice: 'error' });
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = voiceStore.settings.language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      voiceStore.setListening(true);
      systemStore.setStatus({ voice: 'active', microphone: 'active' });
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const fullTranscript = finalTranscript || interimTranscript;
      voiceStore.setTranscript(fullTranscript);

      if (finalTranscript) {
        // Check for wake word
        if (fullTranscript.toLowerCase().includes(voiceStore.settings.wakeWord)) {
          voiceStore.setWakeWordActive(true);
          setTimeout(() => voiceStore.setWakeWordActive(false), 5000);
          return;
        }

        // Parse intent
        const command = parseIntent(fullTranscript, voiceStore.settings.language);
        if (command) {
          voiceStore.setInterpretedCommand(JSON.stringify(command, null, 2));
          voiceStore.addToHistory(fullTranscript, JSON.stringify(command));
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        systemStore.setStatus({ microphone: 'error' });
      }
    };

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (voiceStore.isListening) {
        try {
          recognition.start();
        } catch (e) {
          // Already started
        }
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  }, [voiceStore, systemStore]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    voiceStore.setListening(false);
    systemStore.setStatus({ voice: 'inactive' });
  }, [voiceStore, systemStore]);

  const setLanguage = useCallback((language: VoiceLanguage) => {
    voiceStore.setLanguage(language);
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [voiceStore]);

  return { startListening, stopListening, setLanguage };
}
