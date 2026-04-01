"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  WebSocketClient,
  ConnectionStatus,
} from "@/lib/websocket";
import type { WebSocketMessage } from "@/types/game";

interface UseWebSocketOptions {
  /** WebSocket path, e.g. "/api/ws/admin" */
  path: string;
  /** Called on every message from server */
  onMessage: (message: WebSocketMessage) => void;
  /** Whether to auto-connect on mount (default: true) */
  autoConnect?: boolean;
}

export function useWebSocket({ path, onMessage, autoConnect = true }: UseWebSocketOptions) {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const clientRef = useRef<WebSocketClient | null>(null);
  const onMessageRef = useRef(onMessage);

  // Keep onMessage ref current without re-creating the client
  onMessageRef.current = onMessage;

  useEffect(() => {
    const client = new WebSocketClient({
      path,
      onMessage: (msg) => onMessageRef.current(msg as WebSocketMessage),
      onStatusChange: setStatus,
    });
    clientRef.current = client;

    if (autoConnect) {
      client.connect();
    }

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [path, autoConnect]);

  const sendMessage = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    clientRef.current?.send(type, payload);
  }, []);

  const sendAction = useCallback((action: string, extra: Record<string, unknown> = {}) => {
    clientRef.current?.send("action", { action, ...extra });
  }, []);

  const connect = useCallback(() => {
    clientRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
  }, []);

  return {
    status,
    sendMessage,
    sendAction,
    connect,
    disconnect,
  };
}
