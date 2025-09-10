"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/store";

interface LobbyFormProps {
  onJoinRoom?: (roomCode: string, nickname: string) => void;
  onCreateRoom?: (nickname: string, isPublic: boolean) => void;
}

export function LobbyForm({ onJoinRoom, onCreateRoom }: LobbyFormProps) {
  const { publicRooms, getPublicRooms, connectionState } = useGameStore();
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isCreatingPublic, setIsCreatingPublic] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Public odaları periyodik olarak güncelle
  useEffect(() => {
    if (connectionState.isConnected) {
      getPublicRooms();
      const interval = setInterval(getPublicRooms, 5000); // 5 saniyede bir güncelle
      return () => clearInterval(interval);
    }
  }, [connectionState.isConnected, getPublicRooms]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!nickname.trim()) {
      newErrors.nickname = "Rumuz gerekli";
    } else if (nickname.trim().length < 2) {
      newErrors.nickname = "Rumuz en az 2 karakter olmalı";
    } else if (nickname.trim().length > 20) {
      newErrors.nickname = "Rumuz en fazla 20 karakter olabilir";
    }

    if (roomCode && roomCode.length !== 6) {
      newErrors.roomCode = "Oda kodu 6 karakter olmalı";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleJoinRoom = (targetRoomCode?: string) => {
    if (!validateForm()) return;

    const codeToUse = targetRoomCode || roomCode;
    if (!codeToUse) {
      setErrors({ roomCode: "Oda kodu gerekli" });
      return;
    }

    onJoinRoom?.(codeToUse, nickname.trim());
  };

  const handleCreateRoom = (isPublic: boolean = isCreatingPublic) => {
    if (!validateForm()) return;
    onCreateRoom?.(nickname.trim(), isPublic);
  };

  const handleJoinPublicRoom = (room: (typeof publicRooms)[0]) => {
    if (!nickname.trim()) {
      setErrors({ nickname: "Önce rumuzunuzu girin" });
      return;
    }
    handleJoinRoom(room.code);
  };

  return (
    <div className="w-full space-y-4">
      {/* Nickname Input */}
      <div className="bg-gradient-to-br from-primary to-primary-dark p-6 rounded-xl shadow-xl">
        <h2 className="text-white font-bold text-lg mb-4 text-center">
          Oyuncu Bilgileri
        </h2>
        <div className="space-y-3">
          <div>
            <input
              type="text"
              placeholder="Rumuz"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-button ${
                errors.nickname ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
              maxLength={20}
            />
            {errors.nickname && (
              <p className="text-red-300 text-sm mt-1">{errors.nickname}</p>
            )}
          </div>
        </div>
      </div>

      {/* Private Room Section */}
      <div className="bg-gradient-to-br from-primary to-primary-dark p-6 rounded-xl shadow-xl">
        <h2 className="text-white font-bold text-lg mb-4 text-center">
          Private Oda
        </h2>
        <div className="space-y-3">
          <div>
            <input
              type="text"
              placeholder="Oda Kodu (6 karakter)"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-button ${
                errors.roomCode ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
              maxLength={6}
            />
            {errors.roomCode && (
              <p className="text-red-300 text-sm mt-1">{errors.roomCode}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => handleJoinRoom()}
              disabled={!nickname.trim() || !connectionState.isConnected}
            >
              Katıl
            </Button>
            <Button
              className="flex-1"
              variant="secondary"
              onClick={() => handleCreateRoom(false)}
              disabled={!nickname.trim() || !connectionState.isConnected}
            >
              Private Oluştur
            </Button>
          </div>
        </div>
      </div>

      {/* Public Rooms Section */}
      <div className="bg-gradient-to-br from-primary to-primary-dark p-6 rounded-xl shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold text-lg">Public Odalar</h3>
          <Button
            variant="accent"
            size="sm"
            onClick={() => handleCreateRoom(true)}
            disabled={!nickname.trim() || !connectionState.isConnected}
          >
            Public Oluştur
          </Button>
        </div>

        <div className="space-y-2">
          {publicRooms.length > 0 ? (
            publicRooms.map((room) => (
              <div
                key={room.code}
                className="bg-white/10 p-3 rounded-lg text-white hover:bg-white/15 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-medium">{room.name}</div>
                    <div className="text-sm opacity-75">
                      Kod: {room.code} • {room.playerCount}/{room.maxPlayers}{" "}
                      oyuncu
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleJoinPublicRoom(room)}
                    disabled={
                      !nickname.trim() ||
                      !connectionState.isConnected ||
                      room.playerCount >= room.maxPlayers
                    }
                    className={
                      room.playerCount >= room.maxPlayers ? "opacity-50" : ""
                    }
                  >
                    {room.playerCount >= room.maxPlayers ? "Dolu" : "Katıl"}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-white/60 py-8">
              <div className="text-4xl mb-2">🎮</div>
              <p>Henüz public oda yok</p>
              <p className="text-sm mt-1">İlk public odayı siz oluşturun!</p>
            </div>
          )}
        </div>
      </div>

      {/* Debug Info (geliştirme için) */}
      {process.env.NODE_ENV === "development" && (
        <div className="bg-gray-800/50 p-3 rounded-lg text-xs">
          <div className="text-gray-400 mb-1">Debug Info:</div>
          <div className="text-gray-300">
            Nickname: "{nickname}" | Room Code: "{roomCode}" | Errors:{" "}
            {Object.keys(errors).length}
          </div>
        </div>
      )}
    </div>
  );
}
