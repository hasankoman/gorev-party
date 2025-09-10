"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/store";
import type { Task, TaskStats } from "@/lib/types";

interface TaskPanelProps {
  task: Task;
  taskStats: TaskStats | null;
}

export function TaskPanel({ task, taskStats }: TaskPanelProps) {
  const { submitTaskDone } = useGameStore();
  const [isCompleting, setIsCompleting] = useState(false);

  const handleCompleteTask = async () => {
    if (task.completed) return;

    setIsCompleting(true);
    try {
      submitTaskDone();
      // Completion onayı gelene kadar button'u disable et
      setTimeout(() => setIsCompleting(false), 2000);
    } catch (error) {
      console.error("Görev tamamlanamadı:", error);
      setIsCompleting(false);
    }
  };

  const formatTimeElapsed = () => {
    const elapsed = Date.now() - task.assignedAt;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes > 0) {
      return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="w-full bg-gradient-to-br from-tile-warm to-tile-warm-dark p-6 rounded-xl shadow-xl">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-white font-bold text-2xl mb-2">🎯 Göreviniz</h2>
          <div className="text-white/80 text-sm">
            Görevinizi tamamladığınızda butona basın
          </div>
        </div>

        {/* Task Text */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
          <div className="text-white text-xl font-medium leading-relaxed">
            "{task.text}"
          </div>
        </div>

        {/* Task Status */}
        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex justify-between items-center text-white/90 text-sm">
            <div className="flex items-center gap-2">
              <span>Durum:</span>
              <span
                className={`font-medium ${
                  task.completed ? "text-green-300" : "text-yellow-300"
                }`}
              >
                {task.completed ? "✅ Tamamlandı" : "⏳ Devam ediyor"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Süre:</span>
              <span className="font-mono">{formatTimeElapsed()}</span>
            </div>
          </div>

          {task.completed && task.completedAt && (
            <div className="mt-2 text-white/70 text-xs text-center">
              {new Date(task.completedAt).toLocaleTimeString()} tarihinde
              tamamlandı
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex flex-col items-center space-y-4">
          {!task.completed ? (
            <Button
              onClick={handleCompleteTask}
              disabled={isCompleting}
              className={`w-full py-4 text-lg font-bold rounded-lg shadow-lg transition-all ${
                isCompleting
                  ? "bg-gray-500 opacity-50 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 hover:scale-105"
              }`}
            >
              {isCompleting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">🔄</span>
                  Tamamlanıyor...
                </span>
              ) : (
                "✅ Görevimi Tamamladım"
              )}
            </Button>
          ) : (
            <div className="w-full py-4 text-lg font-bold rounded-lg bg-green-500/50 text-white text-center">
              ✅ Görev Tamamlandı!
            </div>
          )}

          <div className="text-white/60 text-sm text-center max-w-md">
            💡 Görevinizi gerçekten tamamladığınızdan emin olun. Diğer oyuncular
            size göre tahmin yapacak.
          </div>
        </div>

        {/* Progress */}
        {taskStats && (
          <div className="border-t border-white/20 pt-4">
            <div className="text-center">
              <div className="text-white/90 text-sm mb-2">
                Tüm Oyuncuların Durumu
              </div>

              <div className="flex justify-center items-center gap-4 text-white/80 text-sm">
                <div className="flex items-center gap-1">
                  <span>✅</span>
                  <span>{taskStats.completed} tamamlandı</span>
                </div>
                <div className="w-px h-4 bg-white/30"></div>
                <div className="flex items-center gap-1">
                  <span>⏳</span>
                  <span>{taskStats.pending} devam ediyor</span>
                </div>
                <div className="w-px h-4 bg-white/30"></div>
                <div className="flex items-center gap-1">
                  <span>📊</span>
                  <span>%{taskStats.completionRate}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-green-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${taskStats.completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Debug Info (Development) */}
        {process.env.NODE_ENV === "development" && (
          <div className="border-t border-white/20 pt-4">
            <details className="text-white/50 text-xs">
              <summary className="cursor-pointer hover:text-white/70">
                🛠️ Debug Bilgileri
              </summary>
              <div className="mt-2 space-y-1 font-mono">
                <div>Task ID: {task.id}</div>
                <div>Player ID: {task.playerId}</div>
                <div>
                  Assigned: {new Date(task.assignedAt).toLocaleString()}
                </div>
                <div>Completed: {task.completed ? "Yes" : "No"}</div>
                {task.completedAt && (
                  <div>
                    Completed At: {new Date(task.completedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
