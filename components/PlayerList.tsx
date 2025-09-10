"use client";

import type { Player } from "@/lib/types";

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string;
  hostId: string;
}

export function PlayerList({
  players,
  currentPlayerId,
  hostId,
}: PlayerListProps) {
  const getPlayerStatusIcon = (player: Player) => {
    if (!player.isConnected) return "🔴"; // Bağlantı kesildi
    if (player.isHost) return "👑"; // Host
    if (player.isReady) return "✅"; // Hazır
    return "⏳"; // Bekliyor
  };

  const getPlayerStatusText = (player: Player) => {
    if (!player.isConnected) return "Bağlantı kesildi";
    if (player.isHost) return "Host";
    if (player.isReady) return "Hazır";
    return "Bekliyor";
  };

  const getPlayerStatusColor = (player: Player) => {
    if (!player.isConnected) return "text-red-300";
    if (player.isHost) return "text-yellow-300";
    if (player.isReady) return "text-green-300";
    return "text-white/60";
  };

  // Oyuncuları sırala: Host önce, sonra hazır olanlar, sonra diğerleri
  const sortedPlayers = [...players].sort((a, b) => {
    // Host önce
    if (a.isHost && !b.isHost) return -1;
    if (!a.isHost && b.isHost) return 1;

    // Bağlantı durumu
    if (a.isConnected && !b.isConnected) return -1;
    if (!a.isConnected && b.isConnected) return 1;

    // Ready durumu (host olmayan için)
    if (!a.isHost && !b.isHost) {
      if (a.isReady && !b.isReady) return -1;
      if (!a.isReady && b.isReady) return 1;
    }

    // Alfabetik sıralama
    return a.nickname.localeCompare(b.nickname);
  });

  return (
    <div className="w-full bg-gradient-to-br from-primary to-primary-dark p-6 rounded-xl shadow-xl">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-white font-bold text-xl">
            Oyuncular ({players.length})
          </h2>
          <div className="text-white/70 text-sm">
            Hazır: {players.filter((p) => p.isReady || p.isHost).length}/
            {players.length}
          </div>
        </div>

        <div className="space-y-3">
          {sortedPlayers.map((player) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                player.id === currentPlayerId
                  ? "bg-white/20 border border-white/30" // Kendi oyuncu
                  : "bg-white/10 hover:bg-white/15" // Diğer oyuncular
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Status Icon */}
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10">
                  <span className="text-lg">{getPlayerStatusIcon(player)}</span>
                </div>

                {/* Player Info */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium ${
                        player.id === currentPlayerId
                          ? "text-white"
                          : "text-white/90"
                      }`}
                    >
                      {player.nickname}
                    </span>
                    {player.id === currentPlayerId && (
                      <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">
                        Siz
                      </span>
                    )}
                  </div>
                  <div className={`text-sm ${getPlayerStatusColor(player)}`}>
                    {getPlayerStatusText(player)}
                  </div>
                </div>
              </div>

              {/* Score & Join Time */}
              <div className="flex flex-col items-end">
                <div className="text-white/90 font-medium">
                  {player.score} puan
                </div>
                <div className="text-white/50 text-xs">
                  {new Date(player.joinedAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty Slots */}
        {players.length < 8 && (
          <div className="space-y-2">
            <div className="border-t border-white/20 pt-3">
              <div className="text-white/50 text-sm mb-2">
                Boş Slotlar ({8 - players.length})
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: Math.min(4, 8 - players.length) }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-center p-3 rounded-lg border-2 border-dashed border-white/20 text-white/40"
                    >
                      <span className="text-2xl">👤</span>
                      <span className="ml-2 text-sm">Boş</span>
                    </div>
                  )
                )}
              </div>
              {8 - players.length > 4 && (
                <div className="text-center text-white/40 text-xs mt-2">
                  +{8 - players.length - 4} slot daha
                </div>
              )}
            </div>
          </div>
        )}

        {/* Player Instructions */}
        <div className="border-t border-white/20 pt-3">
          <div className="text-white/60 text-sm text-center">
            💡 Host oyunu başlatabilir. Diğer oyuncular "Hazırım" butonuna
            basmalı.
          </div>
        </div>
      </div>
    </div>
  );
}
