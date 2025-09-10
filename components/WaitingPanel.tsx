"use client";

import type { TaskStats } from "@/lib/types";

interface WaitingPanelProps {
  taskStats: TaskStats | null;
  isWaitingForTask?: boolean;
  message?: string;
}

export function WaitingPanel({
  taskStats,
  isWaitingForTask = false,
  message,
}: WaitingPanelProps) {
  const getMainMessage = () => {
    if (message) return message;
    if (isWaitingForTask) return "Görev atanması bekleniyor...";
    return "Diğer oyuncuların görevlerini tamamlamasını bekliyorsunuz";
  };

  const getSubMessage = () => {
    if (isWaitingForTask) {
      return "Oyun başladı! Size bir görev atanması için bekleyin.";
    }
    return "Görevinizi tamamladınız. Diğer oyuncular görevlerini bitirene kadar bekleyin.";
  };

  const getProgressMessage = () => {
    if (!taskStats) return "Durum bilgisi yükleniyor...";

    if (taskStats.completed === taskStats.total) {
      return "🎉 Tüm görevler tamamlandı! Tahmin aşaması başlıyor...";
    }

    return `${taskStats.completed}/${taskStats.total} oyuncu görevini tamamladı (%${taskStats.completionRate})`;
  };

  return (
    <div className="w-full bg-gradient-to-br from-primary to-primary-dark p-6 rounded-xl shadow-xl">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="text-6xl mb-4">{isWaitingForTask ? "📋" : "⏳"}</div>
          <h2 className="text-white font-bold text-2xl mb-2">
            {getMainMessage()}
          </h2>
          <div className="text-white/80 text-lg">{getSubMessage()}</div>
        </div>

        {/* Progress Section */}
        {taskStats && !isWaitingForTask && (
          <div className="bg-white/10 rounded-lg p-6">
            <div className="text-center space-y-4">
              <div className="text-white/90 text-lg">
                {getProgressMessage()}
              </div>

              {/* Progress Stats */}
              <div className="flex justify-center items-center gap-6 text-white/80 text-sm">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl">✅</span>
                  <span className="font-medium">{taskStats.completed}</span>
                  <span className="text-xs">Tamamlandı</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl">⏳</span>
                  <span className="font-medium">{taskStats.pending}</span>
                  <span className="text-xs">Devam ediyor</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl">📊</span>
                  <span className="font-medium">
                    %{taskStats.completionRate}
                  </span>
                  <span className="text-xs">Tamamlanma</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-md mx-auto">
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      taskStats.completionRate === 100
                        ? "bg-green-400"
                        : "bg-blue-400"
                    }`}
                    style={{ width: `${taskStats.completionRate}%` }}
                  ></div>
                </div>
                <div className="text-white/60 text-xs text-center mt-1">
                  {taskStats.completionRate}% tamamlandı
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Animation */}
        <div className="flex justify-center">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce"></div>
            <div
              className="w-3 h-3 bg-white/60 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-3 h-3 bg-white/60 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white/10 rounded-lg p-4">
          <div className="text-white/70 text-sm text-center space-y-2">
            {isWaitingForTask ? (
              <>
                <div>💡 Size özel bir görev atanacak</div>
                <div>
                  🎯 Görevinizi tamamladığınızda diğer oyuncular tahmin yapacak
                </div>
              </>
            ) : (
              <>
                <div>
                  💡 Herkes görevini tamamlayınca tahmin aşaması başlayacak
                </div>
                <div>
                  🎯 Diğer oyuncuların görevlerini tahmin etmeye çalışacaksınız
                </div>
              </>
            )}
          </div>
        </div>

        {/* Refresh Info */}
        <div className="text-center">
          <div className="text-white/50 text-xs">
            Durum otomatik olarak güncellenecek
          </div>
        </div>

        {/* Debug Info (Development) */}
        {process.env.NODE_ENV === "development" && taskStats && (
          <div className="border-t border-white/20 pt-4">
            <details className="text-white/50 text-xs">
              <summary className="cursor-pointer hover:text-white/70">
                🛠️ Debug - Task Stats
              </summary>
              <div className="mt-2 space-y-1 font-mono">
                <div>Total: {taskStats.total}</div>
                <div>Completed: {taskStats.completed}</div>
                <div>Pending: {taskStats.pending}</div>
                <div>Completion Rate: {taskStats.completionRate}%</div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
