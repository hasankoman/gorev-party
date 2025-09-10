"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { RoomHeader } from "@/components/RoomHeader";
import { PlayerList } from "@/components/PlayerList";
import { ReadyPanel } from "@/components/ReadyPanel";
import { TaskPanel } from "@/components/TaskPanel";
import { WaitingPanel } from "@/components/WaitingPanel";
import { GuessWindow } from "@/components/GuessWindow";
import { GuessList } from "@/components/GuessList";
import { VotingPanel } from "@/components/VotingPanel";
import { ResultsPanel } from "@/components/ResultsPanel";
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
    currentGuessTarget,
    guessDeadline,
    currentGuesses,
    myGuess,
    votingDeadline,
    myVotes,
    actualTask,
    roundScores,
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

          // Game running - show appropriate panel based on game state
          if (currentRoom.status === "running") {
            const playersMap = new Map(
              currentRoom.players.map((p) => [p.id, p])
            );

            // Results phase - scoring sonuçları
            if (roundScores.length > 0) {
              return (
                <ResultsPanel
                  roundScores={roundScores}
                  players={currentRoom.players}
                  isWaitingForNextRound={true}
                />
              );
            }

            // Voting phase - oylama aşaması
            if (votingDeadline && actualTask && currentGuessTarget) {
              const isTargetPlayer = currentGuessTarget.id === currentPlayer.id;

              return (
                <VotingPanel
                  guesses={currentGuesses}
                  targetPlayer={currentGuessTarget}
                  actualTask={actualTask}
                  deadline={votingDeadline}
                  isTargetPlayer={isTargetPlayer}
                  playersMap={playersMap}
                />
              );
            }

            // Guess phase - tahmin aşaması
            if (currentGuessTarget && guessDeadline) {
              const isMyGuess = currentGuessTarget.id === currentPlayer.id;

              return (
                <div className="space-y-6">
                  <GuessWindow
                    targetPlayer={currentGuessTarget}
                    deadline={guessDeadline}
                    isMyGuess={isMyGuess}
                  />

                  {currentGuesses.length > 0 && (
                    <GuessList
                      guesses={currentGuesses}
                      targetPlayer={currentGuessTarget}
                      playersMap={playersMap}
                      showActualTask={false}
                    />
                  )}
                </div>
              );
            }

            // Task phase - görev aşaması
            if (currentTask && !currentTask.completed) {
              return <TaskPanel task={currentTask} taskStats={taskStats} />;
            }

            // Task completed, waiting for others or next phase
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
            const sortedPlayers = [...currentRoom.players].sort(
              (a, b) => b.score - a.score
            );
            const winner = sortedPlayers[0];

            return (
              <div className="w-full bg-gradient-to-br from-yellow-500 to-orange-600 p-6 rounded-xl shadow-xl">
                <div className="text-center mb-6">
                  <h2 className="text-white font-bold text-3xl mb-2">
                    🏁 Oyun Bitti!
                  </h2>
                  {winner && (
                    <div className="text-white/90 space-y-2">
                      <div className="text-2xl">🥇</div>
                      <div className="text-xl font-bold">
                        {winner.nickname} Kazandı!
                      </div>
                      <div className="text-lg">
                        {winner.score} puan ile birinci oldu
                      </div>
                    </div>
                  )}
                </div>

                {/* Final Leaderboard */}
                <div className="bg-white/10 rounded-lg p-4 mb-6">
                  <h3 className="text-white font-bold text-lg text-center mb-4">
                    📊 Final Sıralama
                  </h3>
                  <div className="space-y-3">
                    {sortedPlayers.map((player, index) => {
                      const getRankIcon = (i: number) => {
                        if (i === 0) return "🥇";
                        if (i === 1) return "🥈";
                        if (i === 2) return "🥉";
                        return `${i + 1}.`;
                      };

                      return (
                        <div
                          key={player.id}
                          className={`flex justify-between items-center p-3 rounded-lg ${
                            index === 0
                              ? "bg-yellow-500/20 border border-yellow-500/30"
                              : "bg-white/10"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {getRankIcon(index)}
                            </span>
                            <div>
                              <div className="text-white font-bold">
                                {player.nickname}
                                {player.id === currentPlayer?.id && " (siz)"}
                              </div>
                              {index === 0 && (
                                <div className="text-yellow-300 text-sm">
                                  👑 Şampiyon
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-white font-bold text-xl">
                            {player.score}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Game Summary */}
                <div className="bg-white/10 rounded-lg p-4 mb-6">
                  <div className="text-center text-white/90 space-y-2">
                    <div className="text-sm">
                      🎮 Toplam {sortedPlayers.length} oyuncu katıldı
                    </div>
                    <div className="text-sm">
                      🏆 En yüksek skor: {winner?.score || 0} puan
                    </div>
                    <div className="text-sm">⭐ Tebrikler herkese!</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-lg"
                  >
                    🎮 Yeni Oyun Başlat
                  </button>

                  <button
                    onClick={() => router.push("/")}
                    className="w-full px-6 py-2 bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg transition-colors"
                  >
                    🏠 Ana Sayfaya Dön
                  </button>
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
