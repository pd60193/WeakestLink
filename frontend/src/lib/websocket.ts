/**
 * WebSocket client utility with auto-reconnect and message parsing.
 */

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export interface WebSocketClientOptions {
  /** Path appended to WS_BASE, e.g. "/api/ws/admin" */
  path: string;
  /** Called on every parsed message from server */
  onMessage: (message: { type: string; payload: Record<string, unknown> }) => void;
  /** Called when connection status changes */
  onStatusChange?: (status: ConnectionStatus) => void;
  /** Max reconnect attempts before giving up (default: Infinity) */
  maxReconnectAttempts?: number;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private options: WebSocketClientOptions;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private closed = false;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options: WebSocketClientOptions) {
    this.options = options;
  }

  connect(): void {
    this.closed = false;
    this.reconnectAttempts = 0;
    this._connect();
  }

  disconnect(): void {
    this.closed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.options.onStatusChange?.("disconnected");
  }

  send(type: string, payload: Record<string, unknown> = {}): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  get status(): ConnectionStatus {
    if (!this.ws) return "disconnected";
    if (this.ws.readyState === WebSocket.OPEN) return "connected";
    if (this.ws.readyState === WebSocket.CONNECTING) return "connecting";
    return "disconnected";
  }

  private _connect(): void {
    if (this.closed) return;

    this.options.onStatusChange?.("connecting");
    const url = `${WS_BASE}${this.options.path}`;

    try {
      this.ws = new WebSocket(url);
    } catch {
      this._scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.options.onStatusChange?.("connected");
      // Start ping keepalive
      this.pingInterval = setInterval(() => {
        this.send("ping");
      }, 30000);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.options.onMessage(data);
      } catch {
        // Ignore unparseable messages
      }
    };

    this.ws.onclose = () => {
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }
      this.options.onStatusChange?.("disconnected");
      if (!this.closed) {
        this._scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // onclose will fire after onerror, which handles reconnection
    };
  }

  private _scheduleReconnect(): void {
    const maxAttempts = this.options.maxReconnectAttempts ?? Infinity;
    if (this.reconnectAttempts >= maxAttempts) return;

    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this._connect();
    }, delay);
  }
}
