"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/store";
import type { Room, Player } from "@/lib/types";

interface ReadyPanelProps {
  room: Room;
  currentPlayer: Player;
  isHost: boolean;
}

export function ReadyPanel({ room, currentPlayer, isHost }: ReadyPanelProps) {
  const { toggleReady, startGame } = useGameStore();
  const [isStartingGame, setIsStartingGame] = useState(false);

  // Oyun başlatma koşullarını kontrol et
  const canStartGame = () => {
    if (room.status !== "lobby") return false;
    if (room.players.length < 2) return false; // Minimum 2 oyuncu

    // Host hariç tüm oyuncular hazır olmalı
    const nonHostPlayers = room.players.filter((p) => !p.isHost);
    return nonHostPlayers.every((p) => p.isReady);
  };

  const getStartGameDisabledReason = () => {
    if (room.status !== "lobby") return "Oyun zaten başladı";
    if (room.players.length < 2) return "En az 2 oyuncu gerekli";

    const nonHostPlayers = room.players.filter((p) => !p.isHost);
    const readyCount = nonHostPlayers.filter((p) => p.isReady).length;

    if (readyCount < nonHostPlayers.length) {
      return `${nonHostPlayers.length - readyCount} oyuncu daha hazır olmalı`;
    }

    return null;
  };

  const handleToggleReady = () => {
    toggleReady();
  };

  const handleStartGame = async () => {
    if (!canStartGame()) return;

    setIsStartingGame(true);
    try {
      startGame();
      // Oyun başlatıldıktan sonra UI güncellenmesini bekle
      setTimeout(() => setIsStartingGame(false), 2000);
    } catch (error) {
      console.error("Oyun başlatılamadı:", error);
      setIsStartingGame(false);
    }
  };

  // Oyun devam ediyorsa farklı panel göster
  if (room.status === "running") {
    return (
      <div className="w-full bg-gradient-to-br from-accent-orange to-accent-orange-dark p-6 rounded-xl shadow-xl text-center">
        <h3 className="text-white font-bold text-xl mb-4">
          🎮 Oyun Devam Ediyor
        </h3>
        <div className="text-white/90 space-y-2">
          <p>Round: {room.currentRoundId}</p>
          <p className="text-sm">Görev dağıtımı için bekleyin...</p>
        </div>
      </div>
    );
  }

  // Oyun bittiyse
  if (room.status === "ended") {
    return (
      <div className="w-full bg-gradient-to-br from-secondary to-accent p-6 rounded-xl shadow-xl text-center">
        <h3 className="text-white font-bold text-xl mb-4">🏁 Oyun Bitti</h3>
        <div className="text-white/90 space-y-2">
          <p>Tebrikler!</p>
          <div className="mt-4">
            <Button
              onClick={() => window.location.reload()}
              variant="primary"
              className="bg-white/20 hover:bg-white/30"
            >
              Yeni Oyun
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Lobby durumu - Ana ready panel
  return (
    <div className="w-full bg-gradient-to-br from-primary to-primary-dark p-6 rounded-xl shadow-xl">
      <div className="flex flex-col space-y-4">
        <h3 className="text-white font-bold text-xl text-center">
          Oyun Hazırlığı
        </h3>

        {/* Host Panel */}
        {isHost && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">👑</span>
              <span className="text-white font-medium">Host Kontrolü</span>
            </div>

            <div className="space-y-3">
              <div className="text-white/90 text-sm space-y-1">
                <div>
                  • Tüm oyuncular hazır olduğunda oyunu başlatabilirsiniz
                </div>
                <div>• Minimum 2 oyuncu gereklidir</div>
                <div>• Maksimum {room.maxPlayers} oyuncu katılabilir</div>
              </div>

              <Button
                onClick={handleStartGame}
                disabled={!canStartGame() || isStartingGame}
                variant="accent"
                className={`w-full ${
                  canStartGame()
                    ? "bg-green-600 hover:bg-green-700"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                {isStartingGame ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">🔄</span>
                    Oyun Başlatılıyor...
                  </span>
                ) : canStartGame() ? (
                  "🚀 Oyunu Başlat"
                ) : (
                  `❌ ${getStartGameDisabledReason()}`
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Player Ready Panel */}
        {!isHost && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">
                {currentPlayer.isReady ? "✅" : "⏳"}
              </span>
              <span className="text-white font-medium">
                {currentPlayer.isReady ? "Hazırsınız!" : "Hazır Olun"}
              </span>
            </div>

            <div className="space-y-3">
              <div className="text-white/90 text-sm">
                {currentPlayer.isReady ? (
                  <div className="space-y-1">
                    <div>• Host oyunu başlatmasını bekliyorsunuz</div>
                    <div>
                      • Hazır olmak istemiyorsanız butonu tekrar tıklayın
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div>• Oyuna başlamaya hazır olduğunuzda butona basın</div>
                    <div>• Host, herkes hazır olduğunda oyunu başlatacak</div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleToggleReady}
                variant={currentPlayer.isReady ? "secondary" : "primary"}
                className={`w-full ${
                  currentPlayer.isReady
                    ? "bg-red-600/80 hover:bg-red-600"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {currentPlayer.isReady ? "❌ Hazır Değilim" : "✅ Hazırım"}
              </Button>
            </div>
          </div>
        )}

        {/* Game Status */}
        <div className="bg-white/10 rounded-lg p-4 text-center">
          <div className="text-white/90 space-y-2">
            <div className="flex justify-between items-center">
              <span>Oyuncu Sayısı:</span>
              <span className="font-medium">
                {room.players.length}/{room.maxPlayers}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Hazır Oyuncular:</span>
              <span className="font-medium">
                {room.players.filter((p) => p.isReady || p.isHost).length}/
                {room.players.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Durum:</span>
              <span
                className={`font-medium ${
                  canStartGame() ? "text-green-300" : "text-yellow-300"
                }`}
              >
                {canStartGame() ? "Başlatılabilir" : "Bekleniyor"}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-white/60 text-sm text-center space-y-1">
          <div>💡 Oyun başladığında size rastgele görevler verilecek</div>
          <div>🎯 Diğer oyuncuların görevlerini tahmin etmeye çalışın</div>
        </div>
      </div>
    </div>
  );
}
