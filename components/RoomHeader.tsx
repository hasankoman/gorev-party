"use client";

import { Button } from "@/components/ui/button";
import type { Room } from "@/lib/types";

interface RoomHeaderProps {
  room: Room;
  onLeaveRoom: () => void;
}

export function RoomHeader({ room, onLeaveRoom }: RoomHeaderProps) {
  const getStatusText = () => {
    switch (room.status) {
      case "lobby":
        return "Lobide Bekliyor";
      case "running":
        return "Oyun Devam Ediyor";
      case "ended":
        return "Oyun Bitti";
      default:
        return room.status;
    }
  };

  const getStatusColor = () => {
    switch (room.status) {
      case "lobby":
        return "text-blue-300";
      case "running":
        return "text-green-300";
      case "ended":
        return "text-gray-300";
      default:
        return "text-white";
    }
  };

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      // TODO: Toast notification eklenebilir
      console.log("Oda kodu kopyalandı:", room.code);
    } catch (error) {
      console.error("Oda kodu kopyalanamadı:", error);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-primary to-primary-dark p-6 rounded-xl shadow-xl">
      <div className="flex flex-col space-y-4">
        {/* Başlık ve Çıkış */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-white font-bold text-2xl mb-2">{room.name}</h1>
            <div className="text-white/90 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-white/70">Oda Kodu:</span>
                <button
                  onClick={copyRoomCode}
                  className="font-mono bg-white/10 px-3 py-1 rounded-md hover:bg-white/20 transition-colors"
                  title="Kopyalamak için tıklayın"
                >
                  {room.code}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/70">Durum:</span>
                <span className={getStatusColor()}>{getStatusText()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/70">Oyuncu:</span>
                <span>
                  {room.players.length}/{room.maxPlayers}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/70">Tür:</span>
                <span className="flex items-center gap-1">
                  {room.public ? (
                    <>
                      <span>🌐</span>
                      <span>Public</span>
                    </>
                  ) : (
                    <>
                      <span>🔒</span>
                      <span>Private</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onLeaveRoom}
              className="bg-red-600/80 hover:bg-red-600 border-red-500"
            >
              Odadan Çık
            </Button>
          </div>
        </div>

        {/* Host Bilgisi */}
        <div className="border-t border-white/20 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-white/70">Host:</span>
            {(() => {
              const host = room.players.find((p) => p.id === room.hostId);
              return host ? (
                <div className="flex items-center gap-2">
                  <span className="text-yellow-300">👑</span>
                  <span className="text-white font-medium">
                    {host.nickname}
                  </span>
                  {!host.isConnected && (
                    <span className="text-red-300 text-sm">
                      (Bağlantı kesildi)
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-red-300">Host bulunamadı</span>
              );
            })()}
          </div>
        </div>

        {/* Oda Bilgileri (Debug) */}
        {process.env.NODE_ENV === "development" && (
          <div className="border-t border-white/20 pt-4">
            <details className="text-white/60 text-xs">
              <summary className="cursor-pointer hover:text-white/80">
                🛠️ Debug Bilgileri
              </summary>
              <div className="mt-2 space-y-1 font-mono">
                <div>Created: {new Date(room.createdAt).toLocaleString()}</div>
                <div>Round: {room.currentRoundId || "None"}</div>
                <div>Host ID: {room.hostId}</div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
