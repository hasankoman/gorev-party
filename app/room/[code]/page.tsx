"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { RoomHeader } from "@/components/RoomHeader";
import { PlayerList } from "@/components/PlayerList";
import { ReadyPanel } from "@/components/ReadyPanel";
import { TaskPanel } from "@/components/TaskPanel";
import { WaitingPanel } from "@/components/WaitingPanel";
import { DevTools } from "@/components/DevTools";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.code as string;

  const {
    currentRoom,
    currentPlayer,
    currentTask,
    taskStats,
    connectionState,
    initializeSocket,
    getRoomState,
    leaveRoom,
  } = useGameStore();

  useEffect(() => {
    // Socket bağlantısını kur
    initializeSocket();
  }, [initializeSocket]);

  useEffect(() => {
    // Oda kodunu büyük harfe çevir ve oda durumunu getir
    if (connectionState.isConnected && roomCode) {
      const upperRoomCode = roomCode.toUpperCase();
      if (upperRoomCode !== roomCode) {
        // URL'i büyük harfli versiyonla değiştir
        router.replace(`/room/${upperRoomCode}`);
        return;
      }
      getRoomState(upperRoomCode);
    }
  }, [connectionState.isConnected, roomCode, getRoomState, router]);

  const handleLeaveRoom = () => {
    leaveRoom();
    router.push("/");
  };

  // Bağlantı yoksa bekleme ekranı
  if (!connectionState.isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-background-secondary text-foreground p-4">
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="bg-gradient-to-br from-primary to-primary-dark p-6 rounded-xl shadow-xl text-center">
            <h2 className="text-white font-bold text-2xl mb-4">
              {connectionState.isConnecting || connectionState.isReconnecting
                ? "🔄 Bağlanıyor..."
                : "🔌 Bağlantı Yok"}
            </h2>
            <div className="text-white/90 space-y-2">
              {connectionState.error ? (
                <p className="text-red-300">{connectionState.error}</p>
              ) : (
                <p>Sunucuya bağlanılıyor...</p>
              )}
            </div>
            <div className="mt-4">
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-gradient-to-br from-button to-button-dark text-white font-bold rounded-lg shadow-md hover:scale-105 transition-transform"
              >
                Ana Sayfaya Dön
              </button>
            </div>
          </div>
        </div>
        <DevTools />
      </div>
    );
  }

  // Oda bulunamazsa veya farklı odadaysa
  if (!currentRoom || currentRoom.code !== roomCode.toUpperCase()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-background-secondary text-foreground p-4">
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="bg-gradient-to-br from-primary to-primary-dark p-6 rounded-xl shadow-xl text-center">
            <h2 className="text-white font-bold text-2xl mb-4">
              ❌ Oda Bulunamadı
            </h2>
            <div className="text-white/90 space-y-2">
              <p>
                <strong>Aranan Oda:</strong> {roomCode.toUpperCase()}
              </p>
              <p>Bu oda mevcut değil veya erişim yok.</p>
            </div>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => router.push("/")}
                className="w-full px-4 py-2 bg-gradient-to-br from-button to-button-dark text-white font-bold rounded-lg shadow-md hover:scale-105 transition-transform"
              >
                Ana Sayfaya Dön
              </button>
              <div className="text-white/70 text-sm">
                Ana sayfadan mevcut odalara katılabilirsiniz
              </div>
            </div>
          </div>
        </div>
        <DevTools />
      </div>
    );
  }

  // Oyuncu bu odada değilse
  if (!currentPlayer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-background-secondary text-foreground p-4">
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="bg-gradient-to-br from-primary to-primary-dark p-6 rounded-xl shadow-xl text-center">
            <h2 className="text-white font-bold text-2xl mb-4">
              🚫 Erişim Yok
            </h2>
            <div className="text-white/90 space-y-2">
              <p>Bu odaya katılma yetkiniz yok.</p>
              <p>
                <strong>Oda:</strong> {currentRoom.name} ({currentRoom.code})
              </p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-gradient-to-br from-button to-button-dark text-white font-bold rounded-lg shadow-md hover:scale-105 transition-transform"
              >
                Ana Sayfaya Dön
              </button>
            </div>
          </div>
        </div>
        <DevTools />
      </div>
    );
  }

  // Ana oda sayfası
  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-background to-background-secondary text-foreground p-4">
      <div className="w-full max-w-2xl flex flex-col items-center space-y-6">
        {/* Oda Header */}
        <RoomHeader room={currentRoom} onLeaveRoom={handleLeaveRoom} />

        {/* Oyuncu Listesi */}
        <PlayerList
          players={currentRoom.players}
          currentPlayerId={currentPlayer.id}
          hostId={currentRoom.hostId}
        />

        {/* Game Content - State-based rendering */}
        {(() => {
          // Lobby state - show ready panel
          if (currentRoom.status === "lobby") {
            return (
              <ReadyPanel
                room={currentRoom}
                currentPlayer={currentPlayer}
                isHost={currentPlayer.isHost}
              />
            );
          }

          // Game running - show appropriate panel based on task state
          if (currentRoom.status === "running") {
            // Has task and not completed - show task panel
            if (currentTask && !currentTask.completed) {
              return <TaskPanel task={currentTask} taskStats={taskStats} />;
            }

            // Task completed or no task yet - show waiting panel
            if (currentTask?.completed) {
              return (
                <WaitingPanel
                  taskStats={taskStats}
                  message="Görevinizi tamamladınız!"
                />
              );
            }

            // No task assigned yet - waiting for task
            return (
              <WaitingPanel taskStats={taskStats} isWaitingForTask={true} />
            );
          }

          // Game ended
          if (currentRoom.status === "ended") {
            return (
              <div className="w-full bg-gradient-to-br from-secondary to-accent p-6 rounded-xl shadow-xl text-center">
                <h3 className="text-white font-bold text-xl mb-4">
                  🏁 Oyun Bitti
                </h3>
                <div className="text-white/90 space-y-2">
                  <p>Tebrikler! Oyun başarıyla tamamlandı.</p>
                  <div className="mt-4">
                    <button
                      onClick={() => window.location.reload()}
                      className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg transition-colors"
                    >
                      Yeni Oyun
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          // Unknown state
          return (
            <div className="w-full bg-gradient-to-br from-primary to-primary-dark p-6 rounded-xl shadow-xl text-center">
              <h3 className="text-white font-bold text-xl mb-2">
                🤔 Bilinmeyen Durum
              </h3>
              <div className="text-white/90">
                <p>Oyun durumu: {currentRoom.status}</p>
                <p className="text-sm mt-2">Sayfa yenilenmesi gerekebilir.</p>
              </div>
            </div>
          );
        })()}
      </div>

      <DevTools />
    </div>
  );
}
