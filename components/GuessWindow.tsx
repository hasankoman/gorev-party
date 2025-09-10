"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/store";
import type { Player } from "@/lib/types";

interface GuessWindowProps {
  targetPlayer: Player;
  deadline: number | null;
  isMyGuess: boolean;
}

export function GuessWindow({
  targetPlayer,
  deadline,
  isMyGuess,
}: GuessWindowProps) {
  const { submitGuess, closeGuesses, myGuess, currentGuesses, currentPlayer } =
    useGameStore();
  const [guessText, setGuessText] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (!deadline) return;

    const updateTimer = () => {
      const now = Date.now();
      const left = Math.max(0, deadline - now);
      setTimeLeft(left);

      if (left === 0) {
        // Süre doldu, otomatik kapat
        if (currentPlayer?.isHost) {
          closeGuesses(targetPlayer.id);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [deadline, closeGuesses, targetPlayer.id, currentPlayer]);

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };

  const handleSubmitGuess = async () => {
    if (!guessText.trim() || isSubmitting || myGuess) return;

    setIsSubmitting(true);
    try {
      submitGuess(targetPlayer.id, guessText.trim());
      // Clear form after submission
      setGuessText("");
    } catch (error) {
      console.error("Tahmin gönderilemedi:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseGuesses = () => {
    closeGuesses(targetPlayer.id);
  };

  const canCloseGuesses =
    currentPlayer?.isHost || currentPlayer?.id === targetPlayer.id;
  const hasSubmittedGuess = !!myGuess;
  const guessCount = currentGuesses.length;

  return (
    <div className="w-full bg-gradient-to-br from-tile-warm to-tile-warm-dark p-6 rounded-xl shadow-xl">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-white font-bold text-2xl mb-2">
            🎯 Tahmin Zamanı
          </h2>
          <div className="text-white/90 text-lg">
            <span className="font-medium">{targetPlayer.nickname}</span>
            {isMyGuess ? " (siz)" : ""} hangi görevi yaptı?
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

        {/* Guess Stats */}
        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex justify-between items-center text-white/90 text-sm">
            <div className="flex items-center gap-2">
              <span>📊 Gönderilen Tahmin:</span>
              <span className="font-medium">{guessCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>👥 Katılımcı:</span>
              <span className="font-medium">
                {currentGuesses.length + (hasSubmittedGuess ? 1 : 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Guess Form */}
        {!isMyGuess && !hasSubmittedGuess && timeLeft && timeLeft > 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm mb-2">
                Tahmininiz (max 100 karakter):
              </label>
              <textarea
                value={guessText}
                onChange={(e) => setGuessText(e.target.value)}
                placeholder="Örnek: 10 kez el çırpmak"
                className="w-full p-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 resize-none"
                rows={3}
                maxLength={100}
                disabled={isSubmitting}
              />
              <div className="text-white/60 text-xs mt-1 text-right">
                {guessText.length}/100
              </div>
            </div>

            <Button
              onClick={handleSubmitGuess}
              disabled={
                !guessText.trim() || isSubmitting || guessText.length > 100
              }
              className={`w-full py-3 text-lg font-bold rounded-lg shadow-lg transition-all ${
                !guessText.trim() || isSubmitting || guessText.length > 100
                  ? "bg-gray-500 opacity-50 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 hover:scale-105"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">🔄</span>
                  Gönderiliyor...
                </span>
              ) : (
                "📤 Tahmini Gönder"
              )}
            </Button>
          </div>
        )}

        {/* My Guess Submitted */}
        {!isMyGuess && hasSubmittedGuess && myGuess && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
            <div className="text-center">
              <div className="text-green-300 font-medium mb-2">
                ✅ Tahmin Gönderildi!
              </div>
              <div className="text-white/90 bg-white/10 rounded p-3">
                "{myGuess.text}"
              </div>
              <div className="text-white/60 text-sm mt-2">
                Diğer tahminleri bekliyoruz...
              </div>
            </div>
          </div>
        )}

        {/* Target Player View */}
        {isMyGuess && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
            <div className="text-center">
              <div className="text-yellow-300 font-medium mb-2">
                🎭 Siz Hedefsiniz!
              </div>
              <div className="text-white/90 space-y-2">
                <p>Diğer oyuncular sizin görevinizi tahmin etmeye çalışıyor.</p>
                <p className="text-sm">
                  Tahmin süresi dolduğunda cevaplar açıklanacak.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Host Controls */}
        {canCloseGuesses && guessCount > 0 && (
          <div className="border-t border-white/20 pt-4">
            <Button
              onClick={handleCloseGuesses}
              variant="secondary"
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              🔍 Tahminleri Kapat ve Cevabı Göster
            </Button>
            <div className="text-white/60 text-xs text-center mt-2">
              {currentPlayer?.isHost ? "Host olarak" : "Hedef oyuncu olarak"}{" "}
              tahmin penceresini kapatabilirsiniz
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white/10 rounded-lg p-4">
          <div className="text-white/70 text-sm text-center space-y-1">
            <div>💡 Mümkün olduğunca spesifik tahmin edin</div>
            <div>🎯 Her oyuncu sadece bir tahmin gönderebilir</div>
            <div>⏰ Süre dolduğunda otomatik olarak kapanır</div>
          </div>
        </div>

        {/* Debug Info (Development) */}
        {process.env.NODE_ENV === "development" && (
          <div className="border-t border-white/20 pt-4">
            <details className="text-white/50 text-xs">
              <summary className="cursor-pointer hover:text-white/70">
                🛠️ Debug - Guess Window
              </summary>
              <div className="mt-2 space-y-1 font-mono">
                <div>
                  Target Player: {targetPlayer.nickname} ({targetPlayer.id})
                </div>
                <div>
                  Deadline:{" "}
                  {deadline ? new Date(deadline).toLocaleTimeString() : "None"}
                </div>
                <div>
                  Time Left: {timeLeft ? Math.ceil(timeLeft / 1000) : 0}s
                </div>
                <div>Is My Guess: {isMyGuess ? "Yes" : "No"}</div>
                <div>Has Submitted: {hasSubmittedGuess ? "Yes" : "No"}</div>
                <div>Total Guesses: {guessCount}</div>
                <div>Can Close: {canCloseGuesses ? "Yes" : "No"}</div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
