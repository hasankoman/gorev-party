"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/store";
import socketClient from "@/lib/socketClient";

export function DevTools() {
  const { connectionState, currentRoom, createRoom, joinRoom } = useGameStore();
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev.slice(-4),
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const testFunctions = [
    {
      name: "Ping Test",
      action: () => {
        addLog("Socket ping testi");
        socketClient.ping({ test: "DevTools ping" });
      },
    },
    {
      name: "Test Oda Oluştur",
      action: () => {
        addLog("Test odası oluşturuluyor - DevUser");
        createRoom("DevUser", true, "DevTools Test Odası");
      },
    },
    {
      name: "Test Odaya Katıl",
      action: () => {
        addLog("Test odaya katılma - DevUser2");
        // Mevcut bir oda varsa ona katıl
        if (currentRoom) {
          joinRoom(currentRoom.code, "DevUser2");
        } else {
          addLog("Önce bir oda oluşturun");
        }
      },
    },
    {
      name: "Bağlantı Durumu",
      action: () => {
        addLog(
          `Bağlantı: ${connectionState.isConnected ? "✅ Aktif" : "❌ Kapalı"}`
        );
        console.log("CONNECTION STATE:", connectionState);
      },
    },
    {
      name: "Oda Durumu",
      action: () => {
        if (currentRoom) {
          addLog(
            `Oda: ${currentRoom.code} (${currentRoom.players.length} oyuncu)`
          );
          console.log("CURRENT ROOM:", currentRoom);
        } else {
          addLog("Henüz odada değil");
        }
      },
    },
  ];

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          size="sm"
          variant="accent"
          onClick={() => setIsOpen(true)}
          className="rounded-full w-12 h-12 p-0"
        >
          🛠️
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 border border-gray-700 rounded-lg p-4 w-80 max-h-96 overflow-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-bold text-sm">Dev Tools</h3>
        <Button
          size="sm"
          onClick={() => setIsOpen(false)}
          className="p-1 h-6 w-6"
        >
          ✕
        </Button>
      </div>

      <div className="space-y-2 mb-4">
        {testFunctions.map((test, index) => (
          <Button
            key={index}
            size="sm"
            variant="secondary"
            onClick={test.action}
            className="w-full justify-start text-xs"
          >
            {test.name}
          </Button>
        ))}
      </div>

      <div className="border-t border-gray-700 pt-3">
        <h4 className="text-white text-xs font-medium mb-2">
          Son Aktiviteler:
        </h4>
        <div className="space-y-1">
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={index} className="text-xs text-gray-400 break-words">
                {log}
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-500">Henüz aktivite yok</div>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-500 space-y-1">
          <div>Next.js: 3003 | Socket: 3002</div>
          <div>
            Socket:{" "}
            {connectionState.isConnected ? "🟢 Bağlı" : "🔴 Bağlı değil"}
          </div>
          {currentRoom && <div>Oda: {currentRoom.code}</div>}
        </div>
      </div>
    </div>
  );
}
