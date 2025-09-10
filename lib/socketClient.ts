"use client";

import { io, Socket } from "socket.io-client";
import type { SocketEvents, ServerEvents, SocketError } from "./types";

class SocketClient {
  private socket: Socket<ServerEvents, SocketEvents> | null = null;
  private url: string;
  private isManualDisconnect = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private lastRoomCode: string | null = null;
  private lastNickname: string | null = null;

  // Event listeners
  private listeners: Map<string, Set<Function>> = new Map();

  constructor() {
    this.url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3002";
  }

  // Singleton pattern
  private static instance: SocketClient | null = null;

  static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }

  // Connection management
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      console.log("🔗 Socket bağlantısı kuruluyor...", this.url);

      this.socket = io(this.url, {
        transports: ["websocket", "polling"],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 5000,
      });

      this.setupEventListeners();

      this.socket.on("connect", () => {
        console.log("✅ Socket bağlandı:", this.socket?.id);
        this.isManualDisconnect = false;
        this.reconnectAttempts = 0;
        this.emit("connection_state_changed", {
          isConnected: true,
          isConnecting: false,
        });

        // Oda yeniden katılımı
        this.handleReconnectToRoom();

        resolve();
      });

      this.socket.on("connect_error", (error) => {
        console.error("❌ Socket bağlantı hatası:", error);
        this.emit("connection_error", {
          type: "connection",
          message: "Sunucuya bağlanılamıyor",
          details: error,
        } as SocketError);
        reject(error);
      });

      this.socket.on("disconnect", (reason) => {
        console.log("🔌 Socket bağlantısı kesildi:", reason);
        this.emit("connection_state_changed", {
          isConnected: false,
          isConnecting: false,
        });

        if (!this.isManualDisconnect && reason !== "io client disconnect") {
          this.handleReconnect();
        }
      });
    });
  }

  disconnect(): void {
    console.log("👋 Socket bağlantısı manuel olarak kesiliyor...");
    this.isManualDisconnect = true;
    this.lastRoomCode = null;
    this.lastNickname = null;
    this.socket?.disconnect();
    this.emit("connection_state_changed", {
      isConnected: false,
      isConnecting: false,
    });
  }

  // Reconnect handling
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("🚫 Maksimum yeniden bağlanma denemesi aşıldı");
      this.emit("connection_error", {
        type: "connection",
        message: "Sunucuya yeniden bağlanılamıyor",
      } as SocketError);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(
      `🔄 Yeniden bağlanma denemesi ${this.reconnectAttempts}/${this.maxReconnectAttempts} (${delay}ms sonra)...`
    );
    this.emit("connection_state_changed", {
      isConnected: false,
      isConnecting: true,
      isReconnecting: true,
    });

    setTimeout(() => {
      if (!this.isManualDisconnect) {
        this.connect().catch(() => {
          // Hata zaten connect içinde handle ediliyor
        });
      }
    }, delay);
  }

  private handleReconnectToRoom(): void {
    if (this.lastRoomCode && this.lastNickname) {
      console.log(`🏠 Odaya yeniden katılıyor: ${this.lastRoomCode}`);
      this.joinRoom(this.lastRoomCode, this.lastNickname);
    }
  }

  // Socket event methods
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Server event'lerini dinle ve yeniden yayınla
    this.socket.on("room_created", (data) => this.emit("room_created", data));
    this.socket.on("room_joined", (data) => {
      this.lastRoomCode = data.roomCode;
      this.emit("room_joined", data);
    });
    this.socket.on("room_left", (data) => {
      this.lastRoomCode = null;
      this.emit("room_left", data);
    });
    this.socket.on("room_state", (room) => this.emit("room_state", room));
    this.socket.on("player_joined", (data) => this.emit("player_joined", data));
    this.socket.on("player_left", (data) => this.emit("player_left", data));
    this.socket.on("player_ready_changed", (data) =>
      this.emit("player_ready_changed", data)
    );
    this.socket.on("player_disconnected", (data) =>
      this.emit("player_disconnected", data)
    );
    this.socket.on("game_started", (data) => this.emit("game_started", data));
    this.socket.on("task_assigned", (data) => this.emit("task_assigned", data));
    this.socket.on("guess_window_open", (data) =>
      this.emit("guess_window_open", data)
    );
    this.socket.on("guess_submitted", (data) =>
      this.emit("guess_submitted", data)
    );
    this.socket.on("guess_window_closed", (data) =>
      this.emit("guess_window_closed", data)
    );
    this.socket.on("reveal", (data) => this.emit("reveal", data));
    this.socket.on("vote_updated", (data) => this.emit("vote_updated", data));
    this.socket.on("score_update", (data) => this.emit("score_update", data));
    this.socket.on("round_end", (data) => this.emit("round_end", data));
    this.socket.on("game_end", (data) => this.emit("game_end", data));
    this.socket.on("public_rooms", (data) => this.emit("public_rooms", data));
    this.socket.on("error", (data) => this.emit("socket_error", data));
    this.socket.on("pong", (data) => this.emit("pong", data));
  }

  // Game methods
  createRoom(nickname: string, isPublic: boolean, roomName?: string): void {
    this.lastNickname = nickname;
    this.socket?.emit("create_room", { nickname, isPublic, roomName });
  }

  joinRoom(roomCode: string, nickname: string): void {
    this.lastRoomCode = roomCode;
    this.lastNickname = nickname;
    this.socket?.emit("join_room", { roomCode, nickname });
  }

  leaveRoom(roomCode: string): void {
    this.lastRoomCode = null;
    this.socket?.emit("leave_room", { roomCode });
  }

  toggleReady(roomCode: string): void {
    this.socket?.emit("toggle_ready", { roomCode });
  }

  startGame(roomCode: string): void {
    this.socket?.emit("start_game", { roomCode });
  }

  submitTaskDone(roomCode: string): void {
    this.socket?.emit("submit_task_done", { roomCode });
  }

  submitGuess(roomCode: string, targetPlayerId: string, text: string): void {
    this.socket?.emit("submit_guess", { roomCode, targetPlayerId, text });
  }

  closeGuesses(roomCode: string, targetPlayerId: string): void {
    this.socket?.emit("close_guesses", { roomCode, targetPlayerId });
  }

  submitVote(roomCode: string, guessId: string, isCorrect: boolean): void {
    this.socket?.emit("submit_vote", { roomCode, guessId, isCorrect });
  }

  closeVoting(roomCode: string): void {
    this.socket?.emit("close_voting", { roomCode });
  }

  getPublicRooms(): void {
    this.socket?.emit("get_public_rooms");
  }

  getRoomState(roomCode: string): void {
    this.socket?.emit("get_room_state", { roomCode });
  }

  ping(data: any = {}): void {
    this.socket?.emit("ping", { ...data, timestamp: new Date().toISOString() });
  }

  // Event listener management
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Event callback error for ${event}:`, error);
        }
      });
    }
  }

  // Status getters
  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  get socketId(): string | null {
    return this.socket?.id ?? null;
  }

  get currentRoomCode(): string | null {
    return this.lastRoomCode;
  }

  get currentNickname(): string | null {
    return this.lastNickname;
  }
}

// Export singleton instance
export const socketClient = SocketClient.getInstance();
export default socketClient;
