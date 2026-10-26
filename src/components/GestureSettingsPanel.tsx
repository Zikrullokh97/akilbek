import { useGestureStore } from '../store/gestureStore';
import { Settings, RotateCcw } from 'lucide-react';

export default function GestureSettingsPanel() {
  const { settings, updateSettings, reset } = useGestureStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Gesture Settings</h2>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sensitivity */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
          <label className="text-sm text-gray-400 mb-2 block">Sensitivity</label>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={settings.sensitivity}
            onChange={(e) => updateSettings({ sensitivity: parseFloat(e.target.value) })}
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">Low</span>
            <span className="text-xs text-white font-mono">{(settings.sensitivity * 100).toFixed(0)}%</span>
            <span className="text-xs text-gray-500">High</span>
          </div>
        </div>

        {/* Smoothing */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
          <label className="text-sm text-gray-400 mb-2 block">Cursor Smoothing</label>
          <input
            type="range"
            min="0.1"
            max="0.95"
            step="0.05"
            value={settings.smoothing}
            onChange={(e) => updateSettings({ smoothing: parseFloat(e.target.value) })}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">Responsive</span>
            <span className="text-xs text-white font-mono">{(settings.smoothing * 100).toFixed(0)}%</span>
            <span className="text-xs text-gray-500">Smooth</span>
          </div>
        </div>

        {/* Pinch Threshold */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
          <label className="text-sm text-gray-400 mb-2 block">Pinch Threshold</label>
          <input
            type="range"
            min="0.02"
            max="0.15"
            step="0.005"
            value={settings.pinchThreshold}
            onChange={(e) => updateSettings({ pinchThreshold: parseFloat(e.target.value) })}
            className="w-full accent-purple-500"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">Tight</span>
            <span className="text-xs text-white font-mono">{settings.pinchThreshold.toFixed(3)}</span>
            <span className="text-xs text-gray-500">Loose</span>
          </div>
        </div>

        {/* Cursor Speed */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
          <label className="text-sm text-gray-400 mb-2 block">Cursor Speed</label>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.1"
            value={settings.cursorSpeed}
            onChange={(e) => updateSettings({ cursorSpeed: parseFloat(e.target.value) })}
            className="w-full accent-orange-500"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">Slow</span>
            <span className="text-xs text-white font-mono">{settings.cursorSpeed.toFixed(1)}x</span>
            <span className="text-xs text-gray-500">Fast</span>
          </div>
        </div>

        {/* Dominant Hand */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
          <label className="text-sm text-gray-400 mb-3 block">Dominant Hand</label>
          <div className="flex gap-2">
            {(['left', 'right', 'both'] as const).map(hand => (
              <button
                key={hand}
                onClick={() => updateSettings({ dominantHand: hand })}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  settings.dominantHand === hand
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                {hand === 'left' ? '🤚 Left' : hand === 'right' ? '🖐️ Right' : '✋ Both'}
              </button>
            ))}
          </div>
        </div>

        {/* Enable/Disable */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
          <label className="text-sm text-gray-400 mb-3 block">Gesture Control</label>
          <button
            onClick={() => updateSettings({ enabled: !settings.enabled })}
            className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${
              settings.enabled
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {settings.enabled ? '✓ Gestures Enabled' : '✕ Gestures Disabled'}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            {settings.enabled 
              ? 'Hand gestures will control the cursor and trigger actions.'
              : 'All gesture recognition is paused. Camera will remain active.'}
          </p>
        </div>
      </div>

      {/* Calibration */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Calibration</h3>
        <p className="text-xs text-gray-500 mb-4">
          Calibrate gesture recognition for your hand size and movement patterns. 
          Hold your hand in front of the camera and follow the on-screen instructions.
        </p>
        <button className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30 hover:bg-blue-500/30 transition-all text-sm">
          <Settings size={14} className="inline mr-2" />
          Run Calibration
        </button>
      </div>
    </div>
  );
}
