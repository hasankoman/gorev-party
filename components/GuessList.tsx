"use client";

import { useState } from "react";
import type { Guess, Player } from "@/lib/types";

interface GuessListProps {
  guesses: Guess[];
  targetPlayer: Player;
  actualTask?: string;
  showActualTask?: boolean;
  playersMap?: Map<string, Player>;
}

export function GuessList({
  guesses,
  targetPlayer,
  actualTask,
  showActualTask = false,
  playersMap = new Map(),
}: GuessListProps) {
  const [expandedGuess, setExpandedGuess] = useState<string | null>(null);

  const getPlayerNickname = (playerId: string) => {
    const player = playersMap.get(playerId);
    return player?.nickname || "Bilinmeyen Oyuncu";
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const toggleExpanded = (guessId: string) => {
    setExpandedGuess(expandedGuess === guessId ? null : guessId);
  };

  if (guesses.length === 0) {
    return (
      <div className="w-full bg-gradient-to-br from-primary to-primary-dark p-6 rounded-xl shadow-xl">
        <div className="text-center">
          <div className="text-4xl mb-4">🤔</div>
          <h3 className="text-white font-bold text-xl mb-2">
            Henüz Tahmin Yok
          </h3>
          <div className="text-white/80">
            <p>{targetPlayer.nickname} için tahmin gönderen olmadı.</p>
            <p className="text-sm mt-1">İlk tahmin siz gönderin!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-primary to-primary-dark p-6 rounded-xl shadow-xl">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-white font-bold text-xl mb-2">
            📝 Gönderilen Tahminler
          </h3>
          <div className="text-white/80">
            <span className="font-medium">{targetPlayer.nickname}</span> için{" "}
            {guesses.length} tahmin
          </div>
        </div>

        {/* Actual Task (if revealed) */}
        {showActualTask && actualTask && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
            <div className="text-center">
              <div className="text-green-300 font-medium mb-2">
                ✅ Gerçek Görev
              </div>
              <div className="text-white text-lg font-medium bg-white/10 rounded p-3">
                "{actualTask}"
              </div>
            </div>
          </div>
        )}

        {/* Guess List */}
        <div className="space-y-3">
          {guesses.map((guess, index) => {
            const isExpanded = expandedGuess === guess.id;
            const playerNickname = getPlayerNickname(guess.fromPlayerId);

            return (
              <div
                key={guess.id}
                className="bg-white/10 rounded-lg p-4 hover:bg-white/15 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Player Info */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-white font-medium">
                        {playerNickname}
                      </span>
                      <span className="text-white/60 text-xs">
                        {formatTime(guess.submittedAt)}
                      </span>
                    </div>

                    {/* Guess Text */}
                    <div className="text-white/90">
                      {showActualTask || isExpanded ? (
                        <div className="bg-white/10 rounded p-3">
                          "{guess.text}"
                        </div>
                      ) : (
                        <div className="bg-white/5 rounded p-3 border-2 border-dashed border-white/20">
                          <span className="text-white/60 italic">
                            Tahmin gizli (açıklama aşamasında görünecek)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Expand Button (during guessing phase) */}
                    {!showActualTask && (
                      <button
                        onClick={() => toggleExpanded(guess.id)}
                        className="text-white/60 hover:text-white text-xs mt-2 underline"
                      >
                        {isExpanded ? "Gizle" : "Tahmini Göster"}
                      </button>
                    )}
                  </div>

                  {/* Vote Section (if revealed) */}
                  {showActualTask && (
                    <div className="ml-4 text-center">
                      <div className="text-white/80 text-xs mb-1">Oylama</div>
                      <div className="space-y-1">
                        <div className="text-green-300 text-sm">
                          ✓{" "}
                          {guess.votes?.filter((v) => v.isCorrect).length || 0}
                        </div>
                        <div className="text-red-300 text-sm">
                          ✗{" "}
                          {guess.votes?.filter((v) => !v.isCorrect).length || 0}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accuracy Indicator (if revealed) */}
                {showActualTask && actualTask && (
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-xs">Doğruluk:</span>
                      <div className="flex items-center gap-2">
                        {/* Simple accuracy check */}
                        {guess.text
                          .toLowerCase()
                          .includes(actualTask.toLowerCase().split(" ")[0]) ? (
                          <span className="text-green-300 text-xs">
                            🎯 Yakın
                          </span>
                        ) : (
                          <span className="text-orange-300 text-xs">
                            🤔 Uzak
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="bg-white/10 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-white font-bold text-lg">
                {guesses.length}
              </div>
              <div className="text-white/70 text-xs">Toplam Tahmin</div>
            </div>
            <div>
              <div className="text-white font-bold text-lg">
                {new Set(guesses.map((g) => g.fromPlayerId)).size}
              </div>
              <div className="text-white/70 text-xs">Katılımcı</div>
            </div>
            <div>
              <div className="text-white font-bold text-lg">
                {showActualTask ? "✅" : "⏳"}
              </div>
              <div className="text-white/70 text-xs">
                {showActualTask ? "Açıklandı" : "Bekliyor"}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {!showActualTask && (
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-white/70 text-sm text-center space-y-1">
              <div>💡 Tahminler gizli tutulur</div>
              <div>🔍 Süre dolduğunda veya host kapatınca açıklanır</div>
              <div>🗳️ Açıklandıktan sonra oylama yapılır</div>
            </div>
          </div>
        )}

        {/* Debug Info (Development) */}
        {process.env.NODE_ENV === "development" && (
          <div className="border-t border-white/20 pt-4">
            <details className="text-white/50 text-xs">
              <summary className="cursor-pointer hover:text-white/70">
                🛠️ Debug - Guess List
              </summary>
              <div className="mt-2 space-y-1 font-mono">
                <div>
                  Target: {targetPlayer.nickname} ({targetPlayer.id})
                </div>
                <div>Total Guesses: {guesses.length}</div>
                <div>Show Actual Task: {showActualTask ? "Yes" : "No"}</div>
                <div>Actual Task: {actualTask || "Not provided"}</div>
                <div>Players Map Size: {playersMap.size}</div>
                <div>Expanded Guess: {expandedGuess || "None"}</div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
