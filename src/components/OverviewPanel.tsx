import { useSystemStore } from '../store/systemStore';
import { useGestureStore } from '../store/gestureStore';
import { useVoiceStore } from '../store/voiceStore';
import { 
  Camera, Mic, Wifi, Hand, Brain, Shield, 
  Activity, Zap, Cpu, HardDrive, Clock, CheckCircle2, 
  XCircle, AlertTriangle, WifiOff 
} from 'lucide-react';

function StatusBadge({ status, label }: { status: string; label: string }) {
  const colors: Record<string, string> = {
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    connected: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    ready: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    disconnected: 'bg-red-500/20 text-red-400 border-red-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    unavailable: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  const icons: Record<string, any> = {
    active: CheckCircle2,
    connected: CheckCircle2,
    ready: CheckCircle2,
    inactive: XCircle,
    disconnected: WifiOff,
    error: AlertTriangle,
    paused: AlertTriangle,
    unavailable: XCircle,
    processing: Activity,
  };

  const Icon = icons[status] || XCircle;
  const colorClass = colors[status] || colors.inactive;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${colorClass}`}>
      <Icon size={12} />
      <span>{label}</span>
      <span className="capitalize">{status}</span>
    </div>
  );
}

export default function OverviewPanel() {
  const { status, agent, performanceMetrics } = useSystemStore();
  const { currentGesture, gestureMode, fps, confidence } = useGestureStore();
  const { isListening, transcript, language } = useVoiceStore();

  return (
    <div className="space-y-6">
      {/* System Status Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatusCard icon={Camera} label="Camera" status={status.camera} />
        <StatusCard icon={Mic} label="Microphone" status={status.microphone} />
        <StatusCard icon={Wifi} label="Agent" status={status.agent} />
        <StatusCard icon={Hand} label="Gestures" status={status.gestures} />
        <StatusCard icon={Brain} label="AI Engine" status={status.ai} />
        <StatusCard icon={Shield} label="Safety" status={useSystemStore.getState().emergencyStop ? 'error' : 'active'} />
      </div>

      {/* Live Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Gesture Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Current Gesture</span>
              <span className="text-white font-mono capitalize">{currentGesture || 'none'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Mode</span>
              <span className={`font-mono ${gestureMode ? 'text-emerald-400' : 'text-gray-500'}`}>
                {gestureMode ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Confidence</span>
              <span className="text-white font-mono">{(confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">FPS</span>
              <span className="text-white font-mono">{fps}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Voice Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Listening</span>
              <span className={`font-mono ${isListening ? 'text-emerald-400' : 'text-gray-500'}`}>
                {isListening ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Language</span>
              <span className="text-white font-mono">{language}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Last Transcript</span>
              <span className="text-white font-mono text-xs truncate max-w-[150px]">
                {transcript || '—'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Agent Latency</span>
              <span className="text-white font-mono">{agent.latency}ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard icon={Activity} label="Camera FPS" value={`${performanceMetrics.cameraFps}`} unit="fps" />
          <MetricCard icon={Zap} label="Gesture" value={`${performanceMetrics.gestureLatency}`} unit="ms" />
          <MetricCard icon={Wifi} label="WebSocket" value={`${performanceMetrics.wsLatency}`} unit="ms" />
          <MetricCard icon={Clock} label="Execution" value={`${performanceMetrics.executionLatency}`} unit="ms" />
          <MetricCard icon={Cpu} label="CPU" value={`${performanceMetrics.cpuUsage}`} unit="%" />
          <MetricCard icon={HardDrive} label="Memory" value={`${performanceMetrics.memoryUsage}`} unit="MB" />
        </div>
      </div>

      {/* Last Command */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Last Executed Command</h3>
        <div className="font-mono text-sm text-gray-300 bg-black/30 rounded-lg p-3">
          {agent.lastCommand || 'No commands executed yet'}
        </div>
      </div>
    </div>
  );
}

function StatusCard({ icon: Icon, label, status }: { icon: any; label: string; status: string }) {
  const colors: Record<string, string> = {
    active: 'text-emerald-400',
    connected: 'text-emerald-400',
    ready: 'text-emerald-400',
    inactive: 'text-gray-500',
    disconnected: 'text-red-400',
    error: 'text-red-400',
    paused: 'text-yellow-400',
    unavailable: 'text-gray-500',
    processing: 'text-blue-400',
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 flex items-center gap-3">
      <div className={`p-2 rounded-xl bg-white/5 ${colors[status] || 'text-gray-500'}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className={`text-sm font-medium capitalize ${colors[status] || 'text-gray-400'}`}>{status}</p>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, unit }: { icon: any; label: string; value: string; unit: string }) {
  return (
    <div className="text-center">
      <Icon size={16} className="mx-auto text-gray-400 mb-1" />
      <p className="text-lg font-bold text-white font-mono">{value}</p>
      <p className="text-xs text-gray-500">{unit}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
