"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/store";
import type { Guess, Player } from "@/lib/types";

interface VotingPanelProps {
  guesses: Guess[];
  targetPlayer: Player;
  actualTask: string;
  deadline: number | null;
  isTargetPlayer: boolean;
  playersMap: Map<string, Player>;
}

export function VotingPanel({
  guesses,
  targetPlayer,
  actualTask,
  deadline,
  isTargetPlayer,
  playersMap,
}: VotingPanelProps) {
  const { submitVote, closeVoting, myVotes, currentPlayer } = useGameStore();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Countdown timer
  useEffect(() => {
    if (!deadline) return;

    const updateTimer = () => {
      const now = Date.now();
      const left = Math.max(0, deadline - now);
      setTimeLeft(left);

      if (left === 0 && currentPlayer?.isHost) {
        // Süre doldu, otomatik kapat
        closeVoting();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [deadline, closeVoting, currentPlayer]);

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };

  const getPlayerNickname = (playerId: string) => {
    const player = playersMap.get(playerId);
    return player?.nickname || "Bilinmeyen Oyuncu";
  };

  const handleVote = (guessId: string, isCorrect: boolean) => {
    submitVote(guessId, isCorrect);
  };

  const getVoteStats = (guess: Guess) => {
    const correctVotes = guess.votes?.filter((v) => v.isCorrect) || [];
    const incorrectVotes = guess.votes?.filter((v) => !v.isCorrect) || [];
    return {
      correct: correctVotes.length,
      incorrect: incorrectVotes.length,
      total: guess.votes?.length || 0,
    };
  };

  const hasVoted = (guessId: string) => myVotes.has(guessId);
  const getMyVote = (guessId: string) => myVotes.get(guessId);

  const totalVotesSubmitted = guesses.filter((g) => hasVoted(g.id)).length;
  const canCloseVoting = currentPlayer?.isHost;

  if (guesses.length === 0) {
    return (
      <div className="w-full bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-xl">
        <div className="text-center">
          <div className="text-4xl mb-4">🤷‍♂️</div>
          <h3 className="text-white font-bold text-xl mb-2">Tahmin Yok</h3>
          <div className="text-white/80">
            <p>Oylayacak tahmin bulunmuyor.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-xl">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-white font-bold text-2xl mb-2">
            🗳️ Oylama Zamanı
          </h2>
          <div className="text-white/90">
            <div className="text-lg mb-2">
              <span className="font-medium">{targetPlayer.nickname}</span>'in
              görevi:
            </div>
            <div className="bg-white/20 rounded-lg p-3 font-medium text-lg">
              "{actualTask}"
            </div>
          </div>
        </div>

        {/* Timer */}
        {deadline && timeLeft !== null && (
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-white/80 text-sm mb-1">Kalan Süre</div>
            <div
              className={`text-2xl font-bold ${
                timeLeft < 10000 ? "text-red-300" : "text-white"
              }`}
            >
              {formatTime(timeLeft)}
            </div>
            {timeLeft < 10000 && (
              <div className="text-red-300 text-xs mt-1">⚠️ Süre azalıyor!</div>
            )}
          </div>
        )}

        {/* Voting Progress */}
        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex justify-between items-center text-white/90 text-sm">
            <div className="flex items-center gap-2">
              <span>📊 Oyladığınız:</span>
              <span className="font-medium">
                {totalVotesSubmitted}/{guesses.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>📝 Toplam Tahmin:</span>
              <span className="font-medium">{guesses.length}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-2 bg-white/20 rounded-full h-2">
            <div
              className="bg-white/60 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(totalVotesSubmitted / guesses.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Target Player Message */}
        {isTargetPlayer && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
            <div className="text-center">
              <div className="text-yellow-300 font-medium mb-2">
                🎭 Siz Hedefsiniz!
              </div>
              <div className="text-white/90 space-y-2">
                <p>Diğer oyuncular sizin görevinizi tahmin ediyor.</p>
                <p className="text-sm">Tahminleri oylamaya katılamazsınız.</p>
              </div>
            </div>
          </div>
        )}

        {/* Guesses List */}
        {!isTargetPlayer && (
          <div className="space-y-4">
            <h3 className="text-white font-bold text-lg text-center">
              Bu tahminler doğru mu?
            </h3>

            {guesses.map((guess, index) => {
              const playerNickname = getPlayerNickname(guess.fromPlayerId);
              const voted = hasVoted(guess.id);
              const myVote = getMyVote(guess.id);
              const voteStats = getVoteStats(guess);
              const isMyGuess = guess.fromPlayerId === currentPlayer?.id;

              return (
                <div
                  key={guess.id}
                  className={`bg-white/10 rounded-lg p-4 ${
                    voted ? "ring-2 ring-white/40" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <span className="text-white font-medium">
                          {playerNickname}
                          {isMyGuess && " (siz)"}
                        </span>
                        <div className="text-white/70 text-xs">
                          {voteStats.total} oy • {voteStats.correct} doğru •{" "}
                          {voteStats.incorrect} yanlış
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Guess Text */}
                  <div className="text-white/90 mb-4">
                    <div className="bg-white/10 rounded p-3 text-center">
                      <span className="font-medium">"{guess.text}"</span>
                    </div>
                  </div>

                  {/* Voting Buttons */}
                  {!isMyGuess && !voted && timeLeft && timeLeft > 0 && (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleVote(guess.id, true)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all hover:scale-105"
                      >
                        ✅ Doğru
                      </Button>
                      <Button
                        onClick={() => handleVote(guess.id, false)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all hover:scale-105"
                      >
                        ❌ Yanlış
                      </Button>
                    </div>
                  )}

                  {/* Vote Status */}
                  {voted && myVote && (
                    <div className="text-center">
                      <div
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                          myVote.isCorrect
                            ? "bg-green-500/20 text-green-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {myVote.isCorrect ? "✅ Doğru" : "❌ Yanlış"} oyladınız
                      </div>
                    </div>
                  )}

                  {/* My Guess */}
                  {isMyGuess && (
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-500/20 text-blue-300">
                        🎯 Sizin tahmininiz
                      </div>
                    </div>
                  )}

                  {/* Time's Up */}
                  {!voted && (!timeLeft || timeLeft <= 0) && !isMyGuess && (
                    <div className="text-center">
                      <div className="text-orange-300 text-sm">
                        ⏰ Oylama süresi doldu
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Host Controls */}
        {canCloseVoting && (
          <div className="border-t border-white/20 pt-4">
            <Button
              onClick={closeVoting}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all hover:scale-105"
            >
              🏆 Oylamayı Kapat ve Puanları Göster
            </Button>
            <div className="text-white/60 text-xs text-center mt-2">
              Host olarak oylamayı kapatabilirsiniz
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white/10 rounded-lg p-4">
          <div className="text-white/70 text-sm text-center space-y-1">
            <div>💡 Her tahmin için doğru/yanlış oyu verin</div>
            <div>🎯 Kendi tahmininize oy veremezsiniz</div>
            <div>🏆 Doğru oylarınız puan getirir</div>
          </div>
        </div>

        {/* Debug Info (Development) */}
        {process.env.NODE_ENV === "development" && (
          <div className="border-t border-white/20 pt-4">
            <details className="text-white/50 text-xs">
              <summary className="cursor-pointer hover:text-white/70">
                🛠️ Debug - Voting Panel
              </summary>
              <div className="mt-2 space-y-1 font-mono">
                <div>
                  Target: {targetPlayer.nickname} ({targetPlayer.id})
                </div>
                <div>Actual Task: {actualTask}</div>
                <div>
                  Deadline:{" "}
                  {deadline ? new Date(deadline).toLocaleTimeString() : "None"}
                </div>
                <div>
                  Time Left: {timeLeft ? Math.ceil(timeLeft / 1000) : 0}s
                </div>
                <div>Is Target Player: {isTargetPlayer ? "Yes" : "No"}</div>
                <div>
                  Votes Submitted: {totalVotesSubmitted}/{guesses.length}
                </div>
                <div>Can Close: {canCloseVoting ? "Yes" : "No"}</div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
