'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

interface WSMessage {
  type: string;
  requestId?: string;
  data?: Record<string, unknown>;
}

type MessageHandler = (data: Record<string, unknown>) => void;

interface PendingRequest {
  resolve: (data: Record<string, unknown>) => void;
  reject: (err: Error) => void;
}

interface UseBuzzerWSOptions {
  /** Event slug for this buzzer session */
  eventSlug?: string;
  /** Whether to connect as coordinator */
  isCoordinator?: boolean;
  /** Auto reconnect on disconnect */
  autoReconnect?: boolean;
  /** Reconnect interval in ms */
  reconnectInterval?: number;
  /** Max reconnect attempts */
  maxReconnectAttempts?: number;
}

interface UseBuzzerWSReturn {
  /** Current connection state */
  connectionState: ConnectionState;
  /** Send a message and wait for response */
  send: (type: string, data?: Record<string, unknown>) => Promise<Record<string, unknown>>;
  /** Send a message without waiting for response */
  emit: (type: string, data?: Record<string, unknown>) => void;
  /** Subscribe to a message type */
  on: (type: string, handler: MessageHandler) => () => void;
  /** Unsubscribe from a message type */
  off: (type: string, handler: MessageHandler) => void;
  /** Manually reconnect */
  reconnect: () => void;
  /** Disconnect */
  disconnect: () => void;
}

/**
 * Get the WebSocket URL for the buzzer server
 */
function getWSUrl(): string {
  const configured = process.env.NEXT_PUBLIC_WS_URL?.trim();
  
  if (configured) {
    const hasScheme = configured.startsWith('ws://') || configured.startsWith('wss://');
    const inferredScheme =
      typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws';
    const base = hasScheme ? configured : `${inferredScheme}://${configured}`;
    return base.endsWith('/buzzer') ? base : `${base.replace(/\/+$/, '')}/buzzer`;
  }

  if (typeof window === 'undefined') {
    return 'ws://localhost:5001/buzzer';
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const apiHost = apiUrl ? new URL(apiUrl).hostname : null;
  const windowHost = window.location.hostname;
  const isLocalHost = (host: string | null) => host === 'localhost' || host === '127.0.0.1';
  const baseHost = apiHost && !isLocalHost(apiHost) ? apiHost : windowHost;
  const isSecure =
    window.location.protocol === 'https:' || (apiUrl ? new URL(apiUrl).protocol === 'https:' : false);
  const protocol = isSecure ? 'wss:' : 'ws:';
  const wsPort = process.env.NEXT_PUBLIC_WS_PORT || (isLocalHost(baseHost) ? '5001' : '');
  const portSegment = wsPort ? `:${wsPort}` : '';

  return `${protocol}//${baseHost}${portSegment}/buzzer`;
}

/**
 * Hook for connecting to the Bun native WebSocket buzzer server
 */
export function useBuzzerWS(options: UseBuzzerWSOptions = {}): UseBuzzerWSReturn {
  const {
    eventSlug = 'think-link',
    isCoordinator = false,
    autoReconnect = true,
    reconnectInterval = 2000,
    maxReconnectAttempts = 10,
  } = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');

  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());
  const pendingRequestsRef = useRef<Map<string, PendingRequest>>(new Map());
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isConnectingRef = useRef(false);

  /**
   * Add a message handler
   */
  const on = useCallback((type: string, handler: MessageHandler) => {
    if (!handlersRef.current.has(type)) {
      handlersRef.current.set(type, new Set());
    }
    handlersRef.current.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      handlersRef.current.get(type)?.delete(handler);
    };
  }, []);

  /**
   * Remove a message handler
   */
  const off = useCallback((type: string, handler: MessageHandler) => {
    handlersRef.current.get(type)?.delete(handler);
  }, []);

  /**
   * Emit a message to all handlers
   */
  const emitToHandlers = useCallback((type: string, data: Record<string, unknown>) => {
    const handlers = handlersRef.current.get(type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch {
          // Handler error - ignore
        }
      });
    }
  }, []);

  /**
   * Send a message without waiting for response
   */
  const emit = useCallback((type: string, data?: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const message: WSMessage = { type, data };
    ws.send(JSON.stringify(message));
  }, []);

  /**
   * Send a message and wait for response
   */
  const send = useCallback(
    (type: string, data?: Record<string, unknown>): Promise<Record<string, unknown>> => {
      return new Promise((resolve, reject) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          reject(new Error('WebSocket not connected'));
          return;
        }

        const requestId = crypto.randomUUID();
        const message: WSMessage = { type, requestId, data };

        // Set timeout for response
        const timeout = setTimeout(() => {
          pendingRequestsRef.current.delete(requestId);
          reject(new Error(`Request timeout: ${type}`));
        }, 10000);

        // Store pending request with timeout clearing
        pendingRequestsRef.current.set(requestId, {
          resolve: (responseData) => {
            clearTimeout(timeout);
            pendingRequestsRef.current.delete(requestId);
            resolve(responseData);
          },
          reject: (err) => {
            clearTimeout(timeout);
            pendingRequestsRef.current.delete(requestId);
            reject(err);
          },
        });

        ws.send(JSON.stringify(message));
      });
    },
    []
  );

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    if (isConnectingRef.current || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    isConnectingRef.current = true;
    setConnectionState('connecting');

    const wsUrl = getWSUrl();

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      isConnectingRef.current = false;
      reconnectAttemptsRef.current = 0;
      setConnectionState('connected');

      // Join as coordinator or participant
      if (isCoordinator) {
        send('coordinator:join')
          .then(() => {
            send('coordinator:select-event', { eventSlug });
          })
          .catch(() => {
            // Join failed - ignore
          });
      } else {
        send('participant:check-session', { eventSlug }).catch(() => {
          // Check session failed - ignore
        });
      }

      emitToHandlers('connect', {});
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        const { type, requestId, data = {} } = message;

        // Check if this is a response to a pending request
        if (requestId && type.endsWith(':response')) {
          const pending = pendingRequestsRef.current.get(requestId);
          if (pending) {
            pending.resolve(data);
            return;
          }
        }

        // Emit to handlers
        emitToHandlers(type, data);
      } catch {
        // Parse error - ignore
      }
    };

    ws.onclose = () => {
      isConnectingRef.current = false;
      wsRef.current = null;

      // Reject all pending requests
      pendingRequestsRef.current.forEach(({ reject }) => {
        reject(new Error('Connection closed'));
      });
      pendingRequestsRef.current.clear();

      emitToHandlers('disconnect', {});

      // Auto reconnect
      if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
        setConnectionState('reconnecting');
        reconnectAttemptsRef.current++;

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectInterval);
      } else {
        setConnectionState('disconnected');
      }
    };

    ws.onerror = () => {
      isConnectingRef.current = false;
    };
  }, [
    eventSlug,
    isCoordinator,
    autoReconnect,
    reconnectInterval,
    maxReconnectAttempts,
    send,
    emitToHandlers,
  ]);

  /**
   * Manually reconnect
   */
  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  /**
   * Disconnect
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectAttemptsRef.current = maxReconnectAttempts; // Prevent auto-reconnect
    if (wsRef.current) {
      wsRef.current.close();
    }
  }, [maxReconnectAttempts]);

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    connectionState,
    send,
    emit,
    on,
    off,
    reconnect,
    disconnect,
  };
}

export { getWSUrl };
export type { ConnectionState, UseBuzzerWSOptions, UseBuzzerWSReturn };

