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

// Tahmin aşamasını başlat
const startGuessPhase = (roomCode) => {
  const room = rooms.get(roomCode);
  const currentRound = rounds.get(room.currentRoundId);

  if (!room || !currentRound) {
    return { success: false, error: "Oda veya round bulunamadı" };
  }

  // İlk tahmin edilecek oyuncuyu seç (rastgele)
  const availablePlayers = room.players.filter((p) => p.isConnected);
  if (availablePlayers.length === 0) {
    return { success: false, error: "Aktif oyuncu yok" };
  }

  const targetPlayer =
    availablePlayers[Math.floor(Math.random() * availablePlayers.length)];

  // Round'u güncelle
  currentRound.status = "guessing";
  currentRound.targetPlayerId = targetPlayer.id;
  currentRound.guessDeadline = Date.now() + 60 * 1000; // 60 saniye
  currentRound.guesses = [];

  console.log(
    `🎯 Tahmin aşaması başladı: ${roomCode} - Target: ${targetPlayer.nickname}`
  );

  return {
    success: true,
    targetPlayer,
    round: currentRound,
    deadline: currentRound.guessDeadline,
  };
};

// Tahmin gönderme
const submitGuess = (roomCode, socketId, targetPlayerId, guessText) => {
  const room = rooms.get(roomCode);
  const currentRound = rounds.get(room?.currentRoundId);
  const player = players.get(socketId);

  if (!room || !currentRound || !player) {
    return { success: false, error: "Geçersiz durum" };
  }

  if (currentRound.status !== "guessing") {
    return { success: false, error: "Tahmin aşaması değil" };
  }

  if (currentRound.targetPlayerId !== targetPlayerId) {
    return { success: false, error: "Geçersiz hedef oyuncu" };
  }

  if (socketId === targetPlayerId) {
    return { success: false, error: "Kendi görevinizi tahmin edemezsiniz" };
  }

  // Süre kontrolü
  if (Date.now() > currentRound.guessDeadline) {
    return { success: false, error: "Tahmin süresi doldu" };
  }

  // Önceki tahmini kontrol et (bir kişi bir kez tahmin edebilir)
  const existingGuess = currentRound.guesses.find(
    (g) => g.fromPlayerId === socketId
  );
  if (existingGuess) {
    return { success: false, error: "Zaten tahmin gönderdiniz" };
  }

  // Tahmin oluştur
  const guess = {
    id: generateUniqueId(),
    roundId: currentRound.id,
    fromPlayerId: socketId,
    targetPlayerId,
    text: guessText.trim(),
    votes: [],
    submittedAt: Date.now(),
  };

  currentRound.guesses.push(guess);

  console.log(`🤔 Tahmin gönderildi: ${player.nickname} -> "${guessText}"`);

  return { success: true, guess, totalGuesses: currentRound.guesses.length };
};

// Tahmin penceresini kapat ve voting aşamasına geç
const closeGuessWindow = (roomCode, targetPlayerId) => {
  const room = rooms.get(roomCode);
  const currentRound = rounds.get(room?.currentRoundId);

  if (!room || !currentRound) {
    return { success: false, error: "Geçersiz durum" };
  }

  if (currentRound.targetPlayerId !== targetPlayerId) {
    return { success: false, error: "Geçersiz hedef oyuncu" };
  }

  // Voting aşamasına geç
  currentRound.status = "voting";
  currentRound.votingDeadline = Date.now() + 45 * 1000; // 45 saniye oylama süresi

  console.log(
    `🗳️  Oylama aşaması başladı: ${roomCode} - ${currentRound.guesses.length} tahmin`
  );

  return {
    success: true,
    round: currentRound,
    guesses: currentRound.guesses,
    votingDeadline: currentRound.votingDeadline,
  };
};

// Oy verme
const submitVote = (roomCode, socketId, guessId, isCorrect) => {
  const room = rooms.get(roomCode);
  const currentRound = rounds.get(room?.currentRoundId);
  const player = players.get(socketId);

  if (!room || !currentRound || !player) {
    return { success: false, error: "Geçersiz durum" };
  }

  if (currentRound.status !== "voting") {
    return { success: false, error: "Oylama aşaması değil" };
  }

  // Süre kontrolü
  if (Date.now() > currentRound.votingDeadline) {
    return { success: false, error: "Oylama süresi doldu" };
  }

  // Hedef oyuncu kendi tahminlerine oy veremez
  if (socketId === currentRound.targetPlayerId) {
    return { success: false, error: "Hedef oyuncu oy veremez" };
  }

  // Tahmin var mı kontrol et
  const guess = currentRound.guesses.find((g) => g.id === guessId);
  if (!guess) {
    return { success: false, error: "Tahmin bulunamadı" };
  }

  // Kendi tahminine oy veremez
  if (guess.fromPlayerId === socketId) {
    return { success: false, error: "Kendi tahmininize oy veremezsiniz" };
  }

  // Önceki oyunu kontrol et
  const existingVote = guess.votes?.find((v) => v.fromPlayerId === socketId);
  if (existingVote) {
    return { success: false, error: "Bu tahmin için zaten oy verdiniz" };
  }

  // Oy oluştur
  const vote = {
    id: generateUniqueId(),
    fromPlayerId: socketId,
    guessId,
    isCorrect,
    submittedAt: Date.now(),
  };

  // Votes array'ini initialize et
  if (!guess.votes) {
    guess.votes = [];
  }

  guess.votes.push(vote);

  console.log(
    `🗳️  Oy gönderildi: ${player.nickname} -> ${guess.text} (${
      isCorrect ? "Doğru" : "Yanlış"
    })`
  );

  return { success: true, vote, totalVotes: guess.votes.length };
};

// Oylama aşamasını kapat ve puanlama yap
const closeVoting = (roomCode) => {
  const room = rooms.get(roomCode);
  const currentRound = rounds.get(room?.currentRoundId);

  if (!room || !currentRound) {
    return { success: false, error: "Geçersiz durum" };
  }

  if (currentRound.status !== "voting") {
    return { success: false, error: "Oylama aşaması değil" };
  }

  // Scoring aşamasına geç
  currentRound.status = "scoring";

  // Puanları hesapla
  const scores = calculateRoundScores(currentRound, room.players);

  // Oyuncu puanlarını güncelle
  scores.forEach((scoreData) => {
    const player = room.players.find((p) => p.id === scoreData.playerId);
    if (player) {
      player.score += scoreData.points;
    }
  });

  console.log(`🏆 Puanlama tamamlandı: ${roomCode}`);

  return {
    success: true,
    round: currentRound,
    scores,
    players: room.players,
  };
};

// Round puanlarını hesapla
const calculateRoundScores = (round, players) => {
  const scores = [];
  const playersMap = new Map(players.map((p) => [p.id, p]));

  // Her oyuncu için puan hesapla
  players.forEach((player) => {
    let points = 0;
    let breakdown = {
      taskCompletion: 0,
      correctGuesses: 0,
      accurateGuess: 0,
      targetBonus: 0,
    };

    // 1. Görev tamamlama puanı (tüm oyuncular)
    breakdown.taskCompletion = 10;
    points += breakdown.taskCompletion;

    // 2. Hedef oyuncu değilse tahmin/oylama puanları
    if (player.id !== round.targetPlayerId) {
      // Kendi tahminini bul
      const myGuess = round.guesses.find((g) => g.fromPlayerId === player.id);

      // Verdiği doğru oylar
      round.guesses.forEach((guess) => {
        const correctVotes = guess.votes?.filter((v) => v.isCorrect) || [];
        const incorrectVotes = guess.votes?.filter((v) => !v.isCorrect) || [];
        const myVote = guess.votes?.find((v) => v.fromPlayerId === player.id);

        if (myVote) {
          // Çoğunluğun doğru dediği tahminlere doğru oy verdiyse +5
          // Çoğunluğun yanlış dediği tahminlere yanlış oy verdiyse +5
          const isCorrectByMajority =
            correctVotes.length > incorrectVotes.length;
          if (
            (myVote.isCorrect && isCorrectByMajority) ||
            (!myVote.isCorrect && !isCorrectByMajority)
          ) {
            breakdown.correctGuesses += 5;
            points += 5;
          }
        }
      });

      // Kendi tahmini için bonus
      if (myGuess && myGuess.votes && myGuess.votes.length > 0) {
        const correctVotes = myGuess.votes.filter((v) => v.isCorrect);
        const totalVotes = myGuess.votes.length;

        // Tahmininin %60+ doğru oylanması durumunda bonus
        if (correctVotes.length / totalVotes >= 0.6) {
          breakdown.accurateGuess = 15;
          points += breakdown.accurateGuess;
        }
      }
    } else {
      // 3. Hedef oyuncu bonusu (tahmin edilme zorluğuna göre)
      const totalGuesses = round.guesses.length;
      if (totalGuesses > 0) {
        // Tahmin sayısına göre bonus
        breakdown.targetBonus = Math.min(20, totalGuesses * 3);
        points += breakdown.targetBonus;
      }
    }

    scores.push({
      playerId: player.id,
      playerNickname: player.nickname,
      points,
      breakdown,
      isTarget: player.id === round.targetPlayerId,
    });
  });

  return scores;
};

// Sonraki round'u başlat
const startNextRound = (roomCode) => {
  const room = rooms.get(roomCode);
  const currentRound = rounds.get(room?.currentRoundId);

  if (!room || !currentRound) {
    return { success: false, error: "Geçersiz durum" };
  }

  // Önceki hedef oyuncuyu bul
  const previousTargetId = currentRound.targetPlayerId;

  // Henüz hedef olmamış oyuncuları bul
  const playedRounds = Array.from(rounds.values()).filter(
    (r) => r.roomCode === roomCode && r.status === "scoring"
  );
  const previousTargetIds = playedRounds.map((r) => r.targetPlayerId);

  const availablePlayers = room.players.filter(
    (p) => p.isConnected && !previousTargetIds.includes(p.id)
  );

  // Tüm oyuncular hedef olduysa oyunu bitir
  if (availablePlayers.length === 0) {
    room.status = "ended";
    console.log(`🏁 Oyun bitti: ${roomCode} - Tüm oyuncular hedef oldu`);
    return { success: true, gameEnded: true, finalScores: room.players };
  }

  // Sonraki hedef oyuncuyu seç
  const nextTarget = availablePlayers[0]; // İlk sıradaki

  // Yeni round oluştur
  const newRoundId = generateUniqueId();
  const newRound = {
    id: newRoundId,
    roomCode,
    targetPlayerId: nextTarget.id,
    taskId: null,
    status: "tasks",
    guesses: [],
    createdAt: new Date(),
  };

  rounds.set(newRoundId, newRound);
  room.currentRoundId = newRoundId;

  // Yeni görevler ata
  const playerIds = room.players.map((p) => p.id);
  const assignments = assignTasksToRoom(roomCode, playerIds);
  taskAssignments.set(roomCode, assignments);

  console.log(
    `🎯 Yeni round başladı: ${roomCode} - Target: ${nextTarget.nickname}`
  );

  return {
    success: true,
    gameEnded: false,
    room,
    round: newRound,
    targetPlayer: nextTarget,
    taskAssignments: assignments,
  };
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

    // Tahmin aşamasına geç
    const guessPhaseResult = startGuessPhase(roomCode);
    if (guessPhaseResult.success) {
      return {
        success: true,
        task,
        allCompleted: true,
        stats,
        nextPhase: guessPhaseResult,
      };
    }
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

  // Guess management
  startGuessPhase,
  submitGuess,
  closeGuessWindow,

  // Voting management
  submitVote,
  closeVoting,

  // Round management
  startNextRound,
  calculateRoundScores,

  // Player management
  togglePlayerReady,

  // Connection management
  handleDisconnect,
  handleReconnect,

  // Utilities
  generateUniqueId,
  generateRoomCode,
};
