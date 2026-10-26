import { useSystemStore } from '../store/systemStore';
import { Shield, AlertOctagon, CheckCircle, XCircle, AlertTriangle, Power, Info, ExternalLink } from 'lucide-react';

export default function SafetyPanel({ onEmergencyStop }: { onEmergencyStop: () => void }) {
  const { status, emergencyStop, setEmergencyStop, agent } = useSystemStore();

  const permissions = [
    {
      name: 'Camera',
      status: status.camera === 'active' ? 'granted' : status.camera === 'error' ? 'denied' : 'unknown',
      path: 'System Preferences → Privacy & Security → Camera',
      required: 'Hand gesture tracking via webcam',
    },
    {
      name: 'Microphone',
      status: status.microphone === 'active' ? 'granted' : status.microphone === 'error' ? 'denied' : 'unknown',
      path: 'System Preferences → Privacy & Security → Microphone',
      required: 'Voice command recognition',
    },
    {
      name: 'Accessibility',
      status: 'unknown',
      path: 'System Preferences → Privacy & Security → Accessibility',
      required: 'Desktop automation (mouse, keyboard control)',
    },
    {
      name: 'Automation',
      status: 'unknown',
      path: 'System Preferences → Privacy & Security → Automation',
      required: 'Controlling other applications',
    },
    {
      name: 'Screen Recording',
      status: 'unknown',
      path: 'System Preferences → Privacy & Security → Screen Recording',
      required: 'Optional — only if screen capture features are enabled',
    },
  ];

  const capabilities = [
    { name: 'Mouse Movement', enabled: true, sensitive: false },
    { name: 'Mouse Click', enabled: true, sensitive: false },
    { name: 'Mouse Scroll', enabled: true, sensitive: false },
    { name: 'Keyboard Input', enabled: true, sensitive: true },
    { name: 'Open Applications', enabled: true, sensitive: false },
    { name: 'Close Windows', enabled: true, sensitive: true },
    { name: 'System Volume', enabled: true, sensitive: false },
    { name: 'Screen Lock', enabled: true, sensitive: true },
    { name: 'Screenshots', enabled: true, sensitive: true },
    { name: 'URL Opening', enabled: true, sensitive: false },
  ];

  return (
    <div className="space-y-6">
      {/* Emergency Stop */}
      <div className={`rounded-2xl border p-6 ${emergencyStop ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${emergencyStop ? 'bg-red-500/20' : 'bg-white/5'}`}>
              <AlertOctagon size={24} className={emergencyStop ? 'text-red-400' : 'text-gray-400'} />
            </div>
            <div>
              <h3 className="text-white font-semibold">Emergency Stop</h3>
              <p className="text-xs text-gray-400">
                {emergencyStop 
                  ? 'All automation is DISABLED. Click to resume.'
                  : 'Immediately disable all desktop automation'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const newState = !emergencyStop;
              setEmergencyStop(newState);
              if (newState) onEmergencyStop();
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              emergencyStop
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
            }`}
          >
            <Power size={18} />
            {emergencyStop ? 'Resume' : 'Emergency Stop'}
          </button>
        </div>
        {emergencyStop && (
          <div className="mt-4 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
            <p className="text-sm text-red-300">
              ⚠️ All gesture control, voice commands, and AI actions are paused. 
              The Python agent has been notified to stop all automation.
            </p>
          </div>
        )}
      </div>

      {/* Permission Diagnostics */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
          <Shield size={14} />
          macOS Permission Status
        </h3>
        <div className="space-y-3">
          {permissions.map(perm => (
            <div key={perm.name} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
              <div className={`mt-0.5 ${
                perm.status === 'granted' ? 'text-emerald-400' : 
                perm.status === 'denied' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {perm.status === 'granted' ? <CheckCircle size={16} /> : 
                 perm.status === 'denied' ? <XCircle size={16} /> : 
                 <AlertTriangle size={16} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white font-medium">{perm.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    perm.status === 'granted' ? 'bg-emerald-500/20 text-emerald-400' :
                    perm.status === 'denied' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {perm.status === 'granted' ? 'Granted' : perm.status === 'denied' ? 'Denied' : 'Unknown'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{perm.required}</p>
                <p className="text-xs text-gray-600 mt-0.5 font-mono">{perm.path}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="mt-4 w-full py-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30 text-sm hover:bg-blue-500/30 transition-all">
          Recheck Permissions
        </button>
      </div>

      {/* Authorized Capabilities */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Authorized Capabilities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {capabilities.map(cap => (
            <div key={cap.name} className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white">{cap.name}</span>
                {cap.sensitive && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                    Sensitive
                  </span>
                )}
              </div>
              <span className={`text-xs ${cap.enabled ? 'text-emerald-400' : 'text-gray-500'}`}>
                {cap.enabled ? '✓ Allowed' : '✕ Blocked'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Connection */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
          <Info size={14} />
          Agent Connection
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Status</span>
            <span className={`text-sm font-mono ${agent.connected ? 'text-emerald-400' : 'text-red-400'}`}>
              {agent.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Endpoint</span>
            <span className="text-sm font-mono text-gray-400">ws://127.0.0.1:8765</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Latency</span>
            <span className="text-sm font-mono text-white">{agent.latency}ms</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Last Command</span>
            <span className="text-sm font-mono text-gray-400 truncate max-w-[200px]">
              {agent.lastCommand || 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Safety Info */}
      <div className="bg-blue-500/5 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-5">
        <h3 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
          <Shield size={14} />
          Security Notes
        </h3>
        <ul className="space-y-1.5 text-xs text-gray-400">
          <li>• All data remains local — nothing is uploaded to external servers</li>
          <li>• The Python agent binds to 127.0.0.1 only (localhost)</li>
          <li>• WebSocket connections require session authentication</li>
          <li>• Destructive actions require explicit user confirmation</li>
          <li>• Emergency stop immediately halts all automation</li>
          <li>• Camera and microphone data never leaves your device</li>
        </ul>
      </div>
    </div>
  );
}
