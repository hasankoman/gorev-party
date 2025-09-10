// In-memory veri yapıları ve yardımcı fonksiyonlar
const {
  assignTasksToRoom,
  completeTask,
  areAllTasksCompleted,
  getTaskStats,
} = require("./tasks");

// Map'ler ile in-memory store
const rooms = new Map(); // roomCode -> Room
const players = new Map(); // socketId -> Player
const rounds = new Map(); // roundId -> Round
const taskAssignments = new Map(); // roomCode -> Map(playerId -> task)

// Utility fonksiyonları
const generateRoomCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Room yönetimi
const createRoom = (hostSocketId, hostNickname, isPublic = false, roomName) => {
  const roomCode = generateRoomCode();

  // Aynı kod varsa yeniden üret
  while (rooms.has(roomCode)) {
    roomCode = generateRoomCode();
  }

  const host = {
    id: hostSocketId,
    nickname: hostNickname,
    isReady: false,
    isHost: true,
    score: 0,
    isConnected: true,
    joinedAt: new Date(),
  };

  const room = {
    code: roomCode,
    name: roomName || `${hostNickname}'ın Odası`,
    players: [host],
    status: "lobby", // lobby, running, ended
    currentRoundId: null,
    public: isPublic,
    createdAt: new Date(),
    hostId: hostSocketId,
    maxPlayers: 8,
  };

  rooms.set(roomCode, room);
  players.set(hostSocketId, host);

  console.log(
    `🏠 Oda oluşturuldu: ${roomCode} (${
      isPublic ? "Public" : "Private"
    }) - Host: ${hostNickname}`
  );
  return room;
};

const joinRoom = (roomCode, socketId, nickname) => {
  const room = rooms.get(roomCode);
  if (!room) {
    return { success: false, error: "Oda bulunamadı" };
  }

  if (room.status !== "lobby") {
    return { success: false, error: "Oyun devam ediyor, katılamazsınız" };
  }

  if (room.players.length >= room.maxPlayers) {
    return { success: false, error: "Oda dolu" };
  }

  // Aynı nickname kontrolü
  if (room.players.some((p) => p.nickname === nickname)) {
    return { success: false, error: "Bu rumuz zaten kullanılıyor" };
  }

  const player = {
    id: socketId,
    nickname,
    isReady: false,
    isHost: false,
    score: 0,
    isConnected: true,
    joinedAt: new Date(),
  };

  room.players.push(player);
  players.set(socketId, player);

  console.log(
    `👤 ${nickname} odaya katıldı: ${roomCode} (${room.players.length}/${room.maxPlayers})`
  );
  return { success: true, room };
};

const leaveRoom = (socketId) => {
  const player = players.get(socketId);
  if (!player) return null;

  const room = Array.from(rooms.values()).find((r) =>
    r.players.some((p) => p.id === socketId)
  );

  if (!room) return null;

  // Oyuncuyu odadan çıkar
  room.players = room.players.filter((p) => p.id !== socketId);
  players.delete(socketId);

  console.log(`👋 ${player.nickname} odadan ayrıldı: ${room.code}`);

  // Oda boşsa sil
  if (room.players.length === 0) {
    rooms.delete(room.code);
    console.log(`🗑️  Boş oda silindi: ${room.code}`);
    return { room: null, wasDeleted: true };
  }

  // Host ayrıldıysa yeni host belirle
  if (player.isHost && room.players.length > 0) {
    const newHost = room.players[0];
    newHost.isHost = true;
    room.hostId = newHost.id;
    console.log(`👑 Yeni host: ${newHost.nickname} (${room.code})`);
  }

  return { room, wasDeleted: false };
};

const togglePlayerReady = (socketId) => {
  const player = players.get(socketId);
  if (!player) return null;

  player.isReady = !player.isReady;

  const room = Array.from(rooms.values()).find((r) =>
    r.players.some((p) => p.id === socketId)
  );

  console.log(
    `${player.isReady ? "✅" : "❌"} ${player.nickname} hazır durumu: ${
      player.isReady
    }`
  );
  return { player, room };
};

const canStartGame = (room) => {
  if (!room || room.status !== "lobby") return false;
  if (room.players.length < 2) return false; // Minimum 2 oyuncu

  // Host hariç tüm oyuncular hazır olmalı
  const nonHostPlayers = room.players.filter((p) => !p.isHost);
  return nonHostPlayers.every((p) => p.isReady);
};

const startGame = (roomCode) => {
  const room = rooms.get(roomCode);
  if (!room || !canStartGame(room)) {
    return { success: false, error: "Oyun başlatılamıyor" };
  }

  room.status = "running";

  // Tüm oyunculara görev ata
  const playerIds = room.players.map((p) => p.id);
  const assignments = assignTasksToRoom(roomCode, playerIds);
  taskAssignments.set(roomCode, assignments);

  // İlk round oluştur (görev aşaması)
  const roundId = generateUniqueId();
  const round = {
    id: roundId,
    roomCode,
    targetPlayerId: null, // Henüz hedef oyuncu yok
    taskId: null,
    status: "tasks", // tasks, guessing, reveal, scoring, done
    guesses: [],
    createdAt: new Date(),
  };

  rounds.set(roundId, round);
  room.currentRoundId = roundId;

  console.log(`🎮 Oyun başladı: ${roomCode} - Round: ${roundId}`);
  console.log(`📋 ${assignments.size} oyuncuya görev atandı`);

  return { success: true, room, round, taskAssignments: assignments };
};

// Public odaları getir
const getPublicRooms = () => {
  return Array.from(rooms.values())
    .filter((room) => room.public && room.status === "lobby")
    .map((room) => ({
      code: room.code,
      name: room.name,
      playerCount: room.players.length,
      maxPlayers: room.maxPlayers,
      isPublic: room.public,
    }));
};

// Görev tamamlama
const submitTaskDone = (roomCode, socketId) => {
  const room = rooms.get(roomCode);
  const assignments = taskAssignments.get(roomCode);

  if (!room || !assignments || room.status !== "running") {
    return { success: false, error: "Geçersiz oda durumu" };
  }

  // Görev tamamla
  const task = completeTask(roomCode, socketId, assignments);
  if (!task) {
    return { success: false, error: "Görev bulunamadı" };
  }

  console.log(`✅ ${task.text} tamamlandı (${socketId})`);

  // Tüm görevler tamamlandı mı kontrol et
  if (areAllTasksCompleted(assignments)) {
    console.log(`🎯 Tüm görevler tamamlandı! (${roomCode})`);
    // TODO: Sonraki aşamaya geç (tahmin etme)
  }

  const stats = getTaskStats(assignments);
  return {
    success: true,
    task,
    allCompleted: areAllTasksCompleted(assignments),
    stats,
  };
};

// Getter fonksiyonları
const getRoom = (roomCode) => rooms.get(roomCode);
const getPlayer = (socketId) => players.get(socketId);
const getRound = (roundId) => rounds.get(roundId);
const getAllRooms = () => Array.from(rooms.values());
const getTaskAssignments = (roomCode) => taskAssignments.get(roomCode);

// Disconnect handling
const handleDisconnect = (socketId) => {
  const player = players.get(socketId);
  if (!player) return null;

  // Oyuncuyu offline yap (hemen silme, reconnect şansı ver)
  player.isConnected = false;
  player.disconnectedAt = new Date();

  console.log(`🔌 ${player.nickname} bağlantısı kesildi: ${socketId}`);

  const room = Array.from(rooms.values()).find((r) =>
    r.players.some((p) => p.id === socketId)
  );

  return { player, room };
};

// Reconnect handling
const handleReconnect = (oldSocketId, newSocketId) => {
  const player = players.get(oldSocketId);
  if (!player) return null;

  // Socket ID güncelle
  players.delete(oldSocketId);
  player.id = newSocketId;
  player.isConnected = true;
  delete player.disconnectedAt;
  players.set(newSocketId, player);

  const room = Array.from(rooms.values()).find((r) =>
    r.players.some((p) => p.id === newSocketId)
  );

  if (room && room.hostId === oldSocketId) {
    room.hostId = newSocketId;
  }

  console.log(
    `🔄 ${player.nickname} yeniden bağlandı: ${oldSocketId} -> ${newSocketId}`
  );
  return { player, room };
};

module.exports = {
  // Store getters
  getRoom,
  getPlayer,
  getRound,
  getAllRooms,
  getPublicRooms,
  getTaskAssignments,

  // Room management
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  canStartGame,

  // Task management
  submitTaskDone,

  // Player management
  togglePlayerReady,

  // Connection management
  handleDisconnect,
  handleReconnect,

  // Utilities
  generateUniqueId,
  generateRoomCode,
};
