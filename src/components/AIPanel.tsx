import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Bot, User, AlertTriangle, CheckCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  command?: any;
  timestamp: number;
  confirmed?: boolean;
}

export default function AIPanel({ onExecuteCommand }: { onExecuteCommand: (cmd: any) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'system',
      content: 'AI Assistant ready. I can help you control your Mac using natural language. Try commands like "Open Safari", "Take a screenshot", or "Increase volume".',
      timestamp: Date.now(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Parse natural language into commands
  const parseCommand = (text: string): any => {
    const lower = text.toLowerCase();
    
    // Application commands
    const appMatch = lower.match(/open\s+(\w+)/);
    if (appMatch) {
      return {
        intent: 'open_application',
        application: appMatch[1],
        requires_confirmation: false,
      };
    }

    if (lower.includes('close') && (lower.includes('window') || lower.includes('app'))) {
      return { intent: 'close_window', requires_confirmation: false };
    }

    // Volume
    if (lower.includes('volume') || lower.includes('louder') || lower.includes('quieter')) {
      const direction = lower.includes('up') || lower.includes('increase') || lower.includes('louder') ? 'up' : 'down';
      if (lower.includes('mute')) return { intent: 'set_volume', parameters: { direction: 'mute' }, requires_confirmation: false };
      return { intent: 'set_volume', parameters: { direction }, requires_confirmation: false };
    }

    // Screenshot
    if (lower.includes('screenshot') || lower.includes('screen capture')) {
      return { intent: 'take_screenshot', requires_confirmation: false };
    }

    // Lock screen
    if (lower.includes('lock') && lower.includes('screen')) {
      return { intent: 'lock_screen', requires_confirmation: true };
    }

    // Browser search
    const searchMatch = lower.match(/search\s+(?:google\s+)?(?:for\s+)?(.+)/);
    if (searchMatch) {
      return {
        intent: 'browser_search',
        query: searchMatch[1],
        application: 'Safari',
        requires_confirmation: false,
      };
    }

    // URL
    if (lower.includes('open') && (lower.includes('.com') || lower.includes('.org') || lower.includes('youtube') || lower.includes('google'))) {
      return { intent: 'open_url', query: text.replace('open ', ''), requires_confirmation: false };
    }

    // Brightness
    if (lower.includes('brightness')) {
      const direction = lower.includes('up') || lower.includes('increase') ? 'up' : 'down';
      return { intent: 'set_brightness', parameters: { direction }, requires_confirmation: false };
    }

    // Scroll
    if (lower.includes('scroll')) {
      const direction = lower.includes('up') ? 'up' : 'down';
      return { intent: 'mouse_scroll', parameters: { direction }, requires_confirmation: false };
    }

    // Keyboard shortcut
    if (lower.includes('undo')) return { intent: 'keyboard_shortcut', parameters: { key: 'z', modifiers: ['cmd'] }, requires_confirmation: false };
    if (lower.includes('copy')) return { intent: 'keyboard_shortcut', parameters: { key: 'c', modifiers: ['cmd'] }, requires_confirmation: false };
    if (lower.includes('paste')) return { intent: 'keyboard_shortcut', parameters: { key: 'v', modifiers: ['cmd'] }, requires_confirmation: false };
    if (lower.includes('select all')) return { intent: 'keyboard_shortcut', parameters: { key: 'a', modifiers: ['cmd'] }, requires_confirmation: false };

    return null;
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    // Simulate processing delay
    await new Promise(r => setTimeout(r, 500));

    const command = parseCommand(input);
    
    if (command) {
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-resp`,
        role: 'assistant',
        content: command.requires_confirmation
          ? `⚠️ This action requires confirmation:\n\n**${command.intent}**\n\nThis will ${command.intent.replace(/_/g, ' ')}. Do you want to proceed?`
          : `I'll execute: **${command.intent}**${command.application ? ` (${command.application})` : ''}${command.query ? ` — "${command.query}"` : ''}`,
        command,
        timestamp: Date.now(),
        confirmed: !command.requires_confirmation,
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (!command.requires_confirmation) {
        onExecuteCommand(command);
      }
    } else {
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-resp`,
        role: 'assistant',
        content: "I'm not sure how to handle that request. I can help with:\n• Opening/closing applications\n• Volume and brightness control\n• Taking screenshots\n• Browser searches\n• Keyboard shortcuts\n• Screen locking",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    }

    setIsProcessing(false);
  };

  const handleConfirm = (msg: ChatMessage) => {
    if (msg.command) {
      onExecuteCommand(msg.command);
      setMessages(prev => prev.map(m => 
        m.id === msg.id ? { ...m, confirmed: true, content: m.content.replace('⚠️', '✅') } : m
      ));
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;
      
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setInput(text);
        setIsListening(false);
      };

      recognition.onend = () => setIsListening(false);
      recognition.start();
      setIsListening(true);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Bot size={20} className="text-blue-400" />
          AI Assistant
        </h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-gray-400">Rule-based engine active</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role !== 'user' && (
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'system' ? 'bg-gray-500/20' : 'bg-blue-500/20'
              }`}>
                {msg.role === 'system' ? <AlertTriangle size={14} className="text-gray-400" /> : <Bot size={14} className="text-blue-400" />}
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
              msg.role === 'user' 
                ? 'bg-blue-500/20 border border-blue-500/30 text-white' 
                : msg.role === 'system'
                  ? 'bg-gray-500/10 border border-gray-500/20 text-gray-300'
                  : 'bg-white/5 border border-white/10 text-gray-200'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              {msg.command && !msg.confirmed && msg.command.requires_confirmation && (
                <button
                  onClick={() => handleConfirm(msg)}
                  className="mt-2 flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs border border-emerald-500/30 hover:bg-emerald-500/30"
                >
                  <CheckCircle size={12} />
                  Confirm & Execute
                </button>
              )}
              {msg.confirmed && msg.command && (
                <div className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle size={10} />
                  Executed
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <User size={14} className="text-blue-400" />
              </div>
            )}
          </div>
        ))}
        {isProcessing && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Bot size={14} className="text-blue-400" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <button
          onClick={toggleVoiceInput}
          className={`p-3 rounded-xl border transition-all ${
            isListening 
              ? 'bg-red-500/20 border-red-500/30 text-red-400' 
              : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
          }`}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Type a command or ask for help..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isProcessing}
          className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 hover:bg-blue-500/30 transition-all disabled:opacity-30"
        >
          <Send size={18} />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        {['Open Safari', 'Take screenshot', 'Increase volume', 'Lock screen'].map(action => (
          <button
            key={action}
            onClick={() => { setInput(action); }}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-all"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}
