"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { RoundScore, Player } from "@/lib/types";

interface ResultsPanelProps {
  roundScores: RoundScore[];
  players: Player[];
  isWaitingForNextRound?: boolean;
}

export function ResultsPanel({
  roundScores,
  players,
  isWaitingForNextRound = false,
}: ResultsPanelProps) {
  const [expandedScore, setExpandedScore] = useState<string | null>(null);

  const toggleExpanded = (playerId: string) => {
    setExpandedScore(expandedScore === playerId ? null : playerId);
  };

  const sortedScores = [...roundScores].sort((a, b) => b.points - a.points);
  const highestScore = sortedScores[0]?.points || 0;

  const formatBreakdown = (breakdown: any) => {
    const items = [];
    if (breakdown.taskCompletion > 0) {
      items.push(`Görev: +${breakdown.taskCompletion}`);
    }
    if (breakdown.correctGuesses > 0) {
      items.push(`Doğru Oylar: +${breakdown.correctGuesses}`);
    }
    if (breakdown.accurateGuess > 0) {
      items.push(`İyi Tahmin: +${breakdown.accurateGuess}`);
    }
    if (breakdown.targetBonus > 0) {
      items.push(`Hedef Bonusu: +${breakdown.targetBonus}`);
    }
    return items.join(" • ");
  };

  const getPlayerTotalScore = (playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    return player?.score || 0;
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}.`;
  };

  const getScoreColor = (points: number) => {
    if (points === highestScore && points > 0) return "text-yellow-300";
    if (points >= highestScore * 0.8) return "text-green-300";
    if (points >= highestScore * 0.5) return "text-blue-300";
    return "text-white";
  };

  const getScoreBg = (points: number) => {
    if (points === highestScore && points > 0)
      return "bg-yellow-500/20 border-yellow-500/30";
    if (points >= highestScore * 0.8)
      return "bg-green-500/20 border-green-500/30";
    if (points >= highestScore * 0.5)
      return "bg-blue-500/20 border-blue-500/30";
    return "bg-white/10 border-white/20";
  };

  return (
    <div className="w-full bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-xl shadow-xl">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-white font-bold text-2xl mb-2">
            🏆 Round Sonuçları
          </h2>
          <div className="text-white/90">Bu round'da kazanılan puanlar</div>
          {isWaitingForNextRound && (
            <div className="mt-2 text-yellow-300 text-sm">
              ⏳ Sonraki round başlıyor...
            </div>
          )}
        </div>

        {/* Scores List */}
        <div className="space-y-3">
          {sortedScores.map((scoreData, index) => {
            const isExpanded = expandedScore === scoreData.playerId;
            const totalScore = getPlayerTotalScore(scoreData.playerId);
            const colorClass = getScoreColor(scoreData.points);
            const bgClass = getScoreBg(scoreData.points);

            return (
              <div
                key={scoreData.playerId}
                className={`${bgClass} border rounded-lg p-4 hover:bg-white/15 transition-colors cursor-pointer`}
                onClick={() => toggleExpanded(scoreData.playerId)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getRankIcon(index)}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">
                          {scoreData.playerNickname}
                        </span>
                        {scoreData.isTarget && (
                          <span className="text-xs bg-yellow-500/30 text-yellow-300 px-2 py-1 rounded">
                            🎯 HEDEF
                          </span>
                        )}
                      </div>
                      <div className="text-white/70 text-sm">
                        Toplam: {totalScore} puan
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`${colorClass} font-bold text-xl`}>
                      +{scoreData.points}
                    </div>
                    <div className="text-white/60 text-xs">
                      {isExpanded ? "Gizle" : "Detay"}
                    </div>
                  </div>
                </div>

                {/* Expanded Breakdown */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="text-white/90 text-sm space-y-2">
                      <div className="font-medium mb-2">Puan Dağılımı:</div>

                      {scoreData.breakdown.taskCompletion > 0 && (
                        <div className="flex justify-between">
                          <span>📋 Görev Tamamlama:</span>
                          <span className="text-green-300">
                            +{scoreData.breakdown.taskCompletion}
                          </span>
                        </div>
                      )}

                      {scoreData.breakdown.correctGuesses > 0 && (
                        <div className="flex justify-between">
                          <span>🗳️ Doğru Oylar:</span>
                          <span className="text-blue-300">
                            +{scoreData.breakdown.correctGuesses}
                          </span>
                        </div>
                      )}

                      {scoreData.breakdown.accurateGuess > 0 && (
                        <div className="flex justify-between">
                          <span>🎯 İyi Tahmin Bonusu:</span>
                          <span className="text-purple-300">
                            +{scoreData.breakdown.accurateGuess}
                          </span>
                        </div>
                      )}

                      {scoreData.breakdown.targetBonus > 0 && (
                        <div className="flex justify-between">
                          <span>🎭 Hedef Oyuncu Bonusu:</span>
                          <span className="text-yellow-300">
                            +{scoreData.breakdown.targetBonus}
                          </span>
                        </div>
                      )}

                      <div className="border-t border-white/20 pt-2 mt-2">
                        <div className="flex justify-between font-bold">
                          <span>Toplam:</span>
                          <span className={colorClass}>
                            +{scoreData.points}
                          </span>
                        </div>
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
          <div className="text-center">
            <div className="text-white/80 text-sm mb-2">Round Özeti</div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-white font-bold text-lg">
                  {roundScores.length}
                </div>
                <div className="text-white/70 text-xs">Katılımcı</div>
              </div>
              <div>
                <div className="text-white font-bold text-lg">
                  {Math.round(
                    roundScores.reduce((sum, s) => sum + s.points, 0) /
                      roundScores.length
                  )}
                </div>
                <div className="text-white/70 text-xs">Ortalama Puan</div>
              </div>
              <div>
                <div className="text-white font-bold text-lg">
                  {highestScore}
                </div>
                <div className="text-white/70 text-xs">En Yüksek</div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Leaderboard */}
        <div className="bg-white/10 rounded-lg p-4">
          <div className="text-center mb-3">
            <h3 className="text-white font-bold text-lg">📊 Genel Sıralama</h3>
          </div>

          <div className="space-y-2">
            {[...players]
              .sort((a, b) => b.score - a.score)
              .map((player, index) => (
                <div
                  key={player.id}
                  className="flex justify-between items-center text-white/90"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{getRankIcon(index)}</span>
                    <span className="font-medium">{player.nickname}</span>
                  </div>
                  <span className="font-bold">{player.score}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white/10 rounded-lg p-4">
          <div className="text-white/70 text-sm text-center space-y-1">
            <div>🏆 Her round sonunda puanlar hesaplanır</div>
            <div>🎯 Tüm oyuncular hedef olana kadar devam eder</div>
            <div>🥇 En yüksek puana sahip oyuncu kazanır</div>
          </div>
        </div>

        {/* Debug Info (Development) */}
        {process.env.NODE_ENV === "development" && (
          <div className="border-t border-white/20 pt-4">
            <details className="text-white/50 text-xs">
              <summary className="cursor-pointer hover:text-white/70">
                🛠️ Debug - Results Panel
              </summary>
              <div className="mt-2 space-y-1 font-mono">
                <div>Round Scores: {roundScores.length}</div>
                <div>Players: {players.length}</div>
                <div>Highest Score: {highestScore}</div>
                <div>
                  Waiting for Next: {isWaitingForNextRound ? "Yes" : "No"}
                </div>
                <div>Expanded: {expandedScore || "None"}</div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
