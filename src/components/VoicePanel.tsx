import { useVoiceStore } from '../store/voiceStore';
import { useSystemStore } from '../store/systemStore';
import { Mic, MicOff, Globe, Volume2 } from 'lucide-react';
import type { VoiceLanguage } from '../types';

const languages: { code: VoiceLanguage; name: string; flag: string }[] = [
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'uz-UZ', name: "O'zbek", flag: '🇺🇿' },
  { code: 'ru-RU', name: 'Русский', flag: '🇷🇺' },
  { code: 'ko-KR', name: '한국어', flag: '🇰🇷' },
];

export default function VoicePanel({ 
  onStart, 
  onStop 
}: { 
  onStart: () => void;
  onStop: () => void;
}) {
  const { isListening, transcript, interpretedCommand, language, settings, updateSettings, commandHistory } = useVoiceStore();
  const { status } = useSystemStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Voice Control</h2>
        <button
          onClick={isListening ? onStop : onStart}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
            isListening
              ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
          }`}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </button>
      </div>

      {/* Language Selection */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
          <Globe size={14} />
          Language
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => updateSettings({ language: lang.code })}
              className={`flex items-center gap-2 p-3 rounded-xl text-sm transition-all ${
                language === lang.code
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="font-medium">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Live Transcript */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
          <Volume2 size={14} />
          Live Transcript
        </h3>
        <div className={`relative p-4 rounded-xl border ${isListening ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-black/30'}`}>
          {isListening && (
            <div className="absolute top-2 right-2 flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          )}
          <p className={`font-mono text-sm ${transcript ? 'text-white' : 'text-gray-600'}`}>
            {transcript || 'Speak a command...'}
          </p>
        </div>
      </div>

      {/* Interpreted Command */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Interpreted Command</h3>
        <pre className="bg-black/30 rounded-xl p-4 text-xs text-emerald-400 font-mono overflow-x-auto">
          {interpretedCommand || 'No command interpreted yet'}
        </pre>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
          <label className="text-sm text-gray-400 mb-2 block">Wake Word</label>
          <input
            type="text"
            value={settings.wakeWord}
            onChange={(e) => updateSettings({ wakeWord: e.target.value })}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-blue-500/50"
            placeholder="hey gesture"
          />
          <p className="text-xs text-gray-500 mt-1">Say this phrase to activate voice commands</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
          <label className="text-sm text-gray-400 mb-3 block">Push-to-Talk</label>
          <button
            onClick={() => updateSettings({ pushToTalk: !settings.pushToTalk })}
            className={`w-full py-2 rounded-xl text-sm font-medium transition-all ${
              settings.pushToTalk
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-white/5 text-gray-400 border border-white/10'
            }`}
          >
            {settings.pushToTalk ? '✓ Enabled (Hold Space)' : '✕ Disabled'}
          </button>
        </div>
      </div>

      {/* Command History */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Command History</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {commandHistory.length === 0 ? (
            <p className="text-gray-600 text-sm">No commands yet</p>
          ) : (
            [...commandHistory].reverse().map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-white/5">
                <span className="text-xs text-gray-500 font-mono whitespace-nowrap">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
                <div>
                  <p className="text-xs text-white">"{item.transcript}"</p>
                  <p className="text-xs text-gray-500 font-mono truncate">{item.command}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
