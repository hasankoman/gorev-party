"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LobbyForm } from "@/components/LobbyForm";
import { DevTools } from "@/components/DevTools";
import { useGameStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const {
    initializeSocket,
    createRoom,
    joinRoom,
    connectionState,
    currentRoom,
    clearError,
  } = useGameStore();

  useEffect(() => {
    // Socket bağlantısını kur
    initializeSocket();
  }, [initializeSocket]);

  useEffect(() => {
    // Oda oluşturuldu/katılındı ise yönlendir
    if (currentRoom) {
      router.push(`/room/${currentRoom.code}`);
    }
  }, [currentRoom, router]);

  const handleJoinRoom = (roomCode: string, nickname: string) => {
    console.log("Odaya katılma:", { roomCode, nickname });
    joinRoom(roomCode, nickname);
  };

  const handleCreateRoom = (nickname: string, isPublic: boolean) => {
    console.log("Oda oluşturma:", { nickname, isPublic });
    const roomName = isPublic ? `${nickname}'ın Public Odası` : undefined;
    createRoom(nickname, isPublic, roomName);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-background-secondary text-foreground p-4">
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="flex flex-col items-center mb-6 w-full">
          <h1 className="text-6xl font-bold mb-4 drop-shadow-sm text-center">
            Görev Party
          </h1>
          <p className="text-lg text-center text-muted mb-8">
            Gerçek zamanlı çok oyunculu görev tahmin oyunu
          </p>

          {/* Bağlantı Durumu */}
          <div className="w-full mb-4">
            {connectionState.isConnecting && (
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 text-center">
                <div className="text-blue-300 text-sm">
                  {connectionState.isReconnecting
                    ? "🔄 Yeniden bağlanıyor..."
                    : "🔗 Bağlanıyor..."}
                </div>
              </div>
            )}

            {connectionState.error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                <div className="text-red-300 text-sm mb-2">
                  ❌ {connectionState.error}
                </div>
                <button
                  onClick={clearError}
                  className="text-red-200 text-xs underline hover:text-red-100"
                >
                  Hatayı Kapat
                </button>
              </div>
            )}

            {connectionState.isConnected && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-2 text-center">
                <div className="text-green-300 text-sm">✅ Bağlantı aktif</div>
              </div>
            )}
          </div>
        </div>

        <LobbyForm
          onJoinRoom={handleJoinRoom}
          onCreateRoom={handleCreateRoom}
        />
      </div>
      <DevTools />
    </div>
  );
}
