import { useState, useCallback, useEffect, useRef } from 'react';
import { useSystemStore } from './store/systemStore';
import { useGestureStore } from './store/gestureStore';
import { useCamera } from './hooks/useCamera';
import { useGestureEngine } from './hooks/useGestureEngine';
import { useVoiceEngine } from './hooks/useVoiceEngine';
import { useWebSocket } from './hooks/useWebSocket';
import OverviewPanel from './components/OverviewPanel';
import CameraPanel from './components/CameraPanel';
import GestureSettingsPanel from './components/GestureSettingsPanel';
import VoicePanel from './components/VoicePanel';
import AIPanel from './components/AIPanel';
import SafetyPanel from './components/SafetyPanel';
import { 
  LayoutDashboard, Camera, Hand, Mic, Bot, Shield, 
  Menu, X, Zap, Settings, ChevronRight
} from 'lucide-react';

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'camera', label: 'Live Camera', icon: Camera },
  { id: 'gestures', label: 'Gesture Settings', icon: Hand },
  { id: 'voice', label: 'Voice Control', icon: Mic },
  { id: 'ai', label: 'AI Assistant', icon: Bot },
  { id: 'safety', label: 'Safety Center', icon: Shield },
];

export default function App() {
  const { activeSection, setActiveSection, emergencyStop, theme, setTheme, status } = useSystemStore();
  const gestureStore = useGestureStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { videoRef, startCamera, stopCamera } = useCamera();
  const { start: startGestureEngine, stop: stopGestureEngine } = useGestureEngine(videoRef);
  const { startListening, stopListening } = useVoiceEngine();
  const ws = useWebSocket();

  // Handle camera start with gesture engine
  const handleStartCamera = useCallback(async () => {
    const success = await startCamera();
    if (success) {
      await startGestureEngine();
    }
    return success;
  }, [startCamera, startGestureEngine]);

  const handleStopCamera = useCallback(() => {
    stopGestureEngine();
    stopCamera();
  }, [stopCamera, stopGestureEngine]);

  // Handle voice
  const handleStartVoice = useCallback(() => {
    startListening();
  }, [startListening]);

  const handleStopVoice = useCallback(() => {
    stopListening();
  }, [stopListening]);

  // Handle emergency stop
  const handleEmergencyStop = useCallback(() => {
    ws.sendEmergencyStop();
    gestureStore.setGestureMode(false);
    gestureStore.updateSettings({ enabled: false });
  }, [ws, gestureStore]);

  // Handle AI command execution
  const handleExecuteCommand = useCallback((command: any) => {
    if (emergencyStop) return;

    switch (command.intent) {
      case 'open_application':
        ws.sendOpenApp(command.application || 'Safari');
        break;
      case 'mouse_move':
        ws.sendMouseMove(command.parameters?.x || 0, command.parameters?.y || 0);
        break;
      case 'mouse_click':
        ws.sendClick(command.parameters?.button || 'left');
        break;
      case 'mouse_scroll':
        ws.sendScroll(command.parameters?.direction || 'down');
        break;
      case 'keyboard_shortcut':
        ws.sendKeyboard(command.parameters?.key || '', command.parameters?.modifiers);
        break;
      case 'take_screenshot':
        ws.sendCommand('take_screenshot', {});
        break;
      case 'set_volume':
        ws.sendCommand('set_volume', command.parameters || {});
        break;
      case 'lock_screen':
        ws.sendCommand('lock_screen', {});
        break;
      case 'open_url':
        ws.sendCommand('open_url', { url: command.query });
        break;
      case 'browser_search':
        ws.sendCommand('browser_search', { query: command.query, application: command.application });
        break;
      default:
        ws.sendCommand(command.intent, command.parameters || {});
    }
  }, [ws, emergencyStop]);

  // Connect WebSocket on mount
  useEffect(() => {
    ws.connect();
    return () => ws.disconnect();
  }, []);

  // Keyboard shortcut for emergency stop (Ctrl+Shift+Q)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
        e.preventDefault();
        useSystemStore.getState().setEmergencyStop(true);
        handleEmergencyStop();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleEmergencyStop]);

  const renderPanel = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewPanel />;
      case 'camera':
        return <CameraPanel videoRef={videoRef} onStartCamera={handleStartCamera} onStopCamera={handleStopCamera} />;
      case 'gestures':
        return <GestureSettingsPanel />;
      case 'voice':
        return <VoicePanel onStart={handleStartVoice} onStop={handleStopVoice} />;
      case 'ai':
        return <AIPanel onExecuteCommand={handleExecuteCommand} />;
      case 'safety':
        return <SafetyPanel onEmergencyStop={handleEmergencyStop} />;
      default:
        return <OverviewPanel />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-40 h-full transition-all duration-300 bg-[#0d0d14]/95 backdrop-blur-xl border-r border-white/5 flex flex-col`}>
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-white/5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Hand size={16} className="text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <h1 className="text-sm font-bold text-white">Gesture Control</h1>
              <p className="text-xs text-gray-500">AI Desktop Assistant</p>
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hidden md:block"
          >
            <ChevronRight size={14} className={`transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveSection(item.id); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive 
                    ? 'bg-white/10 text-white border border-white/10' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-blue-400' : ''} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        {sidebarOpen && (
          <div className="p-3 border-t border-white/5">
            {/* Connection Status */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
              <div className={`w-2 h-2 rounded-full ${status.agent === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-400">
                {status.agent === 'connected' ? 'Agent Connected' : 'Agent Offline'}
              </span>
            </div>
            
            {/* Emergency indicator */}
            {emergencyStop && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <Zap size={14} className="text-red-400" />
                <span className="text-xs text-red-400 font-medium">Emergency Stop Active</span>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-[#0d0d14]/50 backdrop-blur-xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-400 md:hidden"
            >
              <Menu size={18} />
            </button>
            <h2 className="text-sm font-medium text-white">
              {navItems.find(n => n.id === activeSection)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick status indicators */}
            <div className="hidden md:flex items-center gap-2">
              <StatusDot color={status.camera} label="Cam" />
              <StatusDot color={status.voice} label="Mic" />
              <StatusDot color={status.agent} label="Agent" />
            </div>

            {/* Emergency stop button */}
            <button
              onClick={() => {
                const newStop = !emergencyStop;
                useSystemStore.getState().setEmergencyStop(newStop);
                if (newStop) handleEmergencyStop();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                emergencyStop
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
              }`}
            >
              <Zap size={12} />
              {emergencyStop ? 'Resume' : 'E-Stop'}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderPanel()}
        </div>
      </main>
    </div>
  );
}

function StatusDot({ color, label }: { color: string; label: string }) {
  const dotColor = color === 'active' || color === 'connected' || color === 'ready'
    ? 'bg-emerald-500'
    : color === 'error' || color === 'disconnected'
      ? 'bg-red-500'
      : 'bg-gray-500';

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5">
      <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}
