import { useCallback, useRef, useEffect } from 'react';
import { useSystemStore } from '../store/systemStore';
import { useGestureStore } from '../store/gestureStore';
import type { WSCommand, WSResponse } from '../types';

const WS_URL = 'ws://127.0.0.1:8765/ws/control';
const RECONNECT_INTERVAL = 3000;
const HEARTBEAT_INTERVAL = 5000;
const MAX_RECONNECT_ATTEMPTS = 10;

export function useWebSocket() {
  const systemStore = useSystemStore();
  const gestureStore = useGestureStore();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const heartbeatRef = useRef<ReturnType<typeof setInterval>>();
  const reconnectCountRef = useRef(0);
  const authTokenRef = useRef<string>('');
  const commandQueueRef = useRef<WSCommand[]>([]);
  const lastMoveTimeRef = useRef(0);
  const MOVE_THROTTLE_MS = 33; // ~30fps for cursor updates

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const url = authTokenRef.current 
        ? `${WS_URL}?token=${authTokenRef.current}` 
        : WS_URL;
      
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        systemStore.setAgentStatus({ connected: true });
        systemStore.setStatus({ agent: 'connected' });
        reconnectCountRef.current = 0;

        // Start heartbeat
        heartbeatRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
          }
        }, HEARTBEAT_INTERVAL);

        // Process queued commands
        while (commandQueueRef.current.length > 0) {
          const cmd = commandQueueRef.current.shift();
          if (cmd) ws.send(JSON.stringify(cmd));
        }
      };

      ws.onmessage = (event) => {
        try {
          const response: WSResponse = JSON.parse(event.data);
          systemStore.addWSMessage(response);
          
          if (response.status === 'success') {
            systemStore.setAgentStatus({ lastCommand: response.message });
          }
        } catch (e) {
          console.error('Failed to parse WS message:', e);
        }
      };

      ws.onclose = () => {
        systemStore.setAgentStatus({ connected: false });
        systemStore.setStatus({ agent: 'disconnected' });
        
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
        }

        // Auto-reconnect
        if (reconnectCountRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectCountRef.current++;
            connect();
          }, RECONNECT_INTERVAL);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        systemStore.setStatus({ agent: 'error' });
      };
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
    }
  }, [systemStore]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    reconnectCountRef.current = MAX_RECONNECT_ATTEMPTS; // Prevent reconnect
  }, []);

  const sendCommand = useCallback((type: string, payload: Record<string, unknown>) => {
    const command: WSCommand = {
      version: '1.0',
      request_id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
    };

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(command));
    } else {
      commandQueueRef.current.push(command);
    }
  }, []);

  const sendMouseMove = useCallback((x: number, y: number) => {
    const now = Date.now();
    if (now - lastMoveTimeRef.current < MOVE_THROTTLE_MS) return;
    lastMoveTimeRef.current = now;

    sendCommand('mouse_move', { x: Math.round(x), y: Math.round(y) });
  }, [sendCommand]);

  const sendClick = useCallback((button: 'left' | 'right' = 'left') => {
    sendCommand('mouse_click', { button });
  }, [sendCommand]);

  const sendDoubleClick = useCallback(() => {
    sendCommand('mouse_click', { button: 'left', click_count: 2 });
  }, [sendCommand]);

  const sendScroll = useCallback((direction: 'up' | 'down', amount: number = 3) => {
    sendCommand('mouse_scroll', { direction, amount });
  }, [sendCommand]);

  const sendKeyboard = useCallback((key: string, modifiers?: string[]) => {
    sendCommand('keyboard_shortcut', { key, modifiers: modifiers || [] });
  }, [sendCommand]);

  const sendTypeText = useCallback((text: string) => {
    sendCommand('type_text', { text });
  }, [sendCommand]);

  const sendOpenApp = useCallback((appName: string) => {
    sendCommand('open_application', { application: appName });
  }, [sendCommand]);

  const sendEmergencyStop = useCallback(() => {
    sendCommand('emergency_stop', {});
  }, [sendCommand]);

  const setAuthToken = useCallback((token: string) => {
    authTokenRef.current = token;
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    sendCommand,
    sendMouseMove,
    sendClick,
    sendDoubleClick,
    sendScroll,
    sendKeyboard,
    sendTypeText,
    sendOpenApp,
    sendEmergencyStop,
    setAuthToken,
  };
}
