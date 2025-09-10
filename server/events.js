const {
  createRoom,
  joinRoom,
  leaveRoom,
  togglePlayerReady,
  startGame,
  canStartGame,
  getRoom,
  getPlayer,
  getPublicRooms,
  getTaskAssignments,
  submitTaskDone,
  startGuessPhase,
  submitGuess,
  closeGuessWindow,
  submitVote,
  closeVoting,
  startNextRound,
  handleDisconnect,
} = require("./rooms");

// Socket event handler'ları
const setupSocketEvents = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔗 Yeni client bağlandı: ${socket.id}`);

    // Oda oluşturma
    socket.on("create_room", (data) => {
      try {
        const { nickname, isPublic, roomName } = data;

        if (!nickname?.trim()) {
          socket.emit("error", { message: "Nickname gerekli" });
          return;
        }

        const room = createRoom(socket.id, nickname.trim(), isPublic, roomName);

        // Odaya katıl
        socket.join(room.code);

        // Oda oluşturuldu mesajı
        socket.emit("room_created", {
          roomCode: room.code,
          room: serializeRoom(room),
        });

        // Oda durumunu gönder
        socket.emit("room_state", serializeRoom(room));

        console.log(`✅ Oda oluşturuldu: ${room.code} - ${nickname}`);
      } catch (error) {
        console.error("Create room error:", error);
        socket.emit("error", { message: "Oda oluşturulamadı" });
      }
    });

    // Odaya katılma
    socket.on("join_room", (data) => {
      try {
        const { roomCode, nickname } = data;

        if (!roomCode?.trim() || !nickname?.trim()) {
          socket.emit("error", { message: "Oda kodu ve nickname gerekli" });
          return;
        }

        const result = joinRoom(
          roomCode.trim().toUpperCase(),
          socket.id,
          nickname.trim()
        );

        if (!result.success) {
          socket.emit("error", { message: result.error });
          return;
        }

        // Socket'i odaya ekle
        socket.join(roomCode);

        // Katılan oyuncuya oda durumunu gönder
        socket.emit("room_joined", {
          roomCode,
          room: serializeRoom(result.room),
        });

        // Odadaki tüm oyunculara güncel durumu gönder
        io.to(roomCode).emit("room_state", serializeRoom(result.room));

        // Diğer oyunculara bilgilendirme
        socket.to(roomCode).emit("player_joined", {
          player: serializePlayer(getPlayer(socket.id)),
        });

        console.log(`✅ Odaya katıldı: ${roomCode} - ${nickname}`);
      } catch (error) {
        console.error("Join room error:", error);
        socket.emit("error", { message: "Odaya katılamadı" });
      }
    });

    // Odadan ayrılma
    socket.on("leave_room", (data) => {
      try {
        const { roomCode } = data;
        const player = getPlayer(socket.id);

        if (!player) {
          socket.emit("error", { message: "Oyuncu bulunamadı" });
          return;
        }

        const result = leaveRoom(socket.id);
        if (!result) {
          socket.emit("error", { message: "Odadan ayrılamadı" });
          return;
        }

        // Socket'i odadan çıkar
        socket.leave(roomCode);

        // Oyuncuya onay gönder
        socket.emit("room_left", { roomCode });

        if (!result.wasDeleted && result.room) {
          // Odadaki diğer oyunculara güncel durumu gönder
          io.to(roomCode).emit("room_state", serializeRoom(result.room));
          io.to(roomCode).emit("player_left", {
            playerId: socket.id,
            playerNickname: player.nickname,
          });
        }

        console.log(`👋 Odadan ayrıldı: ${roomCode} - ${player.nickname}`);
      } catch (error) {
        console.error("Leave room error:", error);
        socket.emit("error", { message: "Odadan ayrılamadı" });
      }
    });

    // Hazır durumu değiştirme
    socket.on("toggle_ready", (data) => {
      try {
        const { roomCode } = data;
        const result = togglePlayerReady(socket.id);

        if (!result) {
          socket.emit("error", { message: "Hazır durumu değiştirilemedi" });
          return;
        }

        // Odadaki tüm oyunculara güncel durumu gönder
        io.to(roomCode).emit("room_state", serializeRoom(result.room));

        // Ready durumu değişti mesajı
        io.to(roomCode).emit("player_ready_changed", {
          playerId: socket.id,
          isReady: result.player.isReady,
          playerNickname: result.player.nickname,
        });

        console.log(
          `${result.player.isReady ? "✅" : "❌"} Ready değişti: ${
            result.player.nickname
          }`
        );
      } catch (error) {
        console.error("Toggle ready error:", error);
        socket.emit("error", { message: "Hazır durumu değiştirilemedi" });
      }
    });

    // Oyunu başlatma (sadece host)
    socket.on("start_game", (data) => {
      try {
        const { roomCode } = data;
        const room = getRoom(roomCode);
        const player = getPlayer(socket.id);

        if (!room || !player) {
          socket.emit("error", { message: "Oda veya oyuncu bulunamadı" });
          return;
        }

        if (!player.isHost) {
          socket.emit("error", { message: "Sadece host oyunu başlatabilir" });
          return;
        }

        if (!canStartGame(room)) {
          socket.emit("error", { message: "Tüm oyuncular hazır değil" });
          return;
        }

        const result = startGame(roomCode);
        if (!result.success) {
          socket.emit("error", { message: result.error });
          return;
        }

        // Tüm oyunculara oyun başladı mesajı
        io.to(roomCode).emit("game_started", {
          roomCode,
          roundId: result.round.id,
          room: serializeRoom(result.room),
        });

        console.log(`🎮 Oyun başladı: ${roomCode}`);

        // Her oyuncuya kendi görevini gönder
        const taskAssignments = result.taskAssignments;
        if (taskAssignments) {
          room.players.forEach((player) => {
            const task = taskAssignments.get(player.id);
            if (task) {
              io.to(player.id).emit("task_assigned", {
                taskId: task.id,
                text: task.text,
              });
              console.log(
                `📋 Görev atandı: ${player.nickname} -> "${task.text}"`
              );
            }
          });
        }
      } catch (error) {
        console.error("Start game error:", error);
        socket.emit("error", { message: "Oyun başlatılamadı" });
      }
    });

    // Görev tamamlama
    socket.on("submit_task_done", (data) => {
      try {
        const { roomCode } = data;
        const room = getRoom(roomCode);
        const player = getPlayer(socket.id);

        if (!room || !player) {
          socket.emit("error", { message: "Oda veya oyuncu bulunamadı" });
          return;
        }

        if (room.status !== "running") {
          socket.emit("error", { message: "Oyun devam etmiyor" });
          return;
        }

        const result = submitTaskDone(roomCode, socket.id);
        if (!result.success) {
          socket.emit("error", { message: result.error });
          return;
        }

        console.log(
          `✅ Görev tamamlandı: ${player.nickname} - "${result.task.text}"`
        );

        // Oyuncuya onay gönder
        socket.emit("task_completed", {
          taskId: result.task.id,
          completedAt: result.task.completedAt,
        });

        // Odadaki tüm oyunculara progress güncellemesi gönder
        io.to(roomCode).emit("task_progress", {
          stats: result.stats,
          playerNickname: player.nickname,
          allCompleted: result.allCompleted,
        });

        // Tüm görevler tamamlandıysa tahmin aşamasına geç
        if (result.allCompleted) {
          console.log(`🎯 Tüm görevler tamamlandı! (${roomCode})`);

          if (result.nextPhase && result.nextPhase.success) {
            // Tahmin aşaması başladı
            io.to(roomCode).emit("guess_phase_started", {
              message: "Tahmin aşaması başlıyor!",
              targetPlayer: result.nextPhase.targetPlayer,
              deadline: result.nextPhase.deadline,
              round: result.nextPhase.round,
            });

            // Tahmin penceresi açıldı
            io.to(roomCode).emit("guess_window_open", {
              targetPlayerId: result.nextPhase.targetPlayer.id,
              targetPlayerNickname: result.nextPhase.targetPlayer.nickname,
              deadline: result.nextPhase.deadline,
            });

            console.log(
              `🎯 Tahmin aşaması başladı: ${result.nextPhase.targetPlayer.nickname}`
            );
          } else {
            // Fallback - eski mesaj
            io.to(roomCode).emit("all_tasks_completed", {
              message: "Tüm görevler tamamlandı! Tahmin aşaması başlıyor...",
              stats: result.stats,
            });
          }
        }
      } catch (error) {
        console.error("Submit task done error:", error);
        socket.emit("error", { message: "Görev tamamlanamadı" });
      }
    });

    // Tahmin gönderme
    socket.on("submit_guess", (data) => {
      try {
        const { roomCode, targetPlayerId, text } = data;
        const room = getRoom(roomCode);
        const player = getPlayer(socket.id);

        if (!room || !player) {
          socket.emit("error", { message: "Oda veya oyuncu bulunamadı" });
          return;
        }

        if (!text || !text.trim()) {
          socket.emit("error", { message: "Tahmin metni gerekli" });
          return;
        }

        if (text.trim().length > 100) {
          socket.emit("error", {
            message: "Tahmin çok uzun (max 100 karakter)",
          });
          return;
        }

        const result = submitGuess(roomCode, socket.id, targetPlayerId, text);
        if (!result.success) {
          socket.emit("error", { message: result.error });
          return;
        }

        console.log(
          `🤔 Tahmin gönderildi: ${player.nickname} -> "${text.trim()}"`
        );

        // Tahmin gönderen oyuncuya onay
        socket.emit("guess_submitted", {
          guess: result.guess,
          totalGuesses: result.totalGuesses,
        });

        // Odadaki tüm oyunculara tahmin bilgisi (tahmin metnini göstermeden)
        socket.to(roomCode).emit("guess_submitted", {
          guess: {
            id: result.guess.id,
            fromPlayerId: result.guess.fromPlayerId,
            fromPlayerNickname: player.nickname,
            targetPlayerId: result.guess.targetPlayerId,
            submittedAt: result.guess.submittedAt,
            // text gizli
          },
          totalGuesses: result.totalGuesses,
        });
      } catch (error) {
        console.error("Submit guess error:", error);
        socket.emit("error", { message: "Tahmin gönderilemedi" });
      }
    });

    // Tahmin penceresini kapat
    socket.on("close_guesses", (data) => {
      try {
        const { roomCode, targetPlayerId } = data;
        const room = getRoom(roomCode);
        const player = getPlayer(socket.id);

        if (!room || !player) {
          socket.emit("error", { message: "Oda veya oyuncu bulunamadı" });
          return;
        }

        // Sadece host veya hedef oyuncu kapatabilir
        if (!player.isHost && socket.id !== targetPlayerId) {
          socket.emit("error", {
            message: "Tahmin penceresini kapatma yetkiniz yok",
          });
          return;
        }

        const result = closeGuessWindow(roomCode, targetPlayerId);
        if (!result.success) {
          socket.emit("error", { message: result.error });
          return;
        }

        console.log(`🗳️  Oylama aşaması başladı: ${roomCode}`);

        // Tahminleri ve gerçek görevi göster + oylama başlat
        const taskAssignments = getTaskAssignments(roomCode);
        const targetTask = taskAssignments
          ? taskAssignments.get(targetPlayerId)
          : null;

        io.to(roomCode).emit("guess_window_closed", {
          targetPlayerId,
        });

        io.to(roomCode).emit("voting_started", {
          targetPlayerId,
          targetPlayerNickname:
            getPlayer(targetPlayerId)?.nickname || "Bilinmeyen",
          taskId: targetTask?.id || null,
          taskText: targetTask?.text || "Görev bulunamadı",
          guesses: result.guesses,
          votingDeadline: result.votingDeadline,
        });
      } catch (error) {
        console.error("Close guesses error:", error);
        socket.emit("error", { message: "Tahmin penceresi kapatılamadı" });
      }
    });

    // Oy verme
    socket.on("submit_vote", (data) => {
      try {
        const { roomCode, guessId, isCorrect } = data;
        const room = getRoom(roomCode);
        const player = getPlayer(socket.id);

        if (!room || !player) {
          socket.emit("error", { message: "Oda veya oyuncu bulunamadı" });
          return;
        }

        if (typeof isCorrect !== "boolean") {
          socket.emit("error", { message: "Geçersiz oy değeri" });
          return;
        }

        const result = submitVote(roomCode, socket.id, guessId, isCorrect);
        if (!result.success) {
          socket.emit("error", { message: result.error });
          return;
        }

        console.log(
          `🗳️  Oy gönderildi: ${player.nickname} -> ${
            isCorrect ? "Doğru" : "Yanlış"
          }`
        );

        // Oy gönderen oyuncuya onay
        socket.emit("vote_submitted", {
          vote: result.vote,
          totalVotes: result.totalVotes,
        });

        // Odadaki tüm oyunculara oy bilgisi (oy detayını göstermeden)
        socket.to(roomCode).emit("vote_submitted", {
          guessId,
          totalVotes: result.totalVotes,
          voterNickname: player.nickname,
        });
      } catch (error) {
        console.error("Submit vote error:", error);
        socket.emit("error", { message: "Oy gönderilemedi" });
      }
    });

    // Oylama aşamasını kapat
    socket.on("close_voting", (data) => {
      try {
        const { roomCode } = data;
        const room = getRoom(roomCode);
        const player = getPlayer(socket.id);

        if (!room || !player) {
          socket.emit("error", { message: "Oda veya oyuncu bulunamadı" });
          return;
        }

        // Sadece host kapatabilir
        if (!player.isHost) {
          socket.emit("error", {
            message: "Oylama aşamasını kapatma yetkiniz yok",
          });
          return;
        }

        const result = closeVoting(roomCode);
        if (!result.success) {
          socket.emit("error", { message: result.error });
          return;
        }

        console.log(`🏆 Puanlama tamamlandı: ${roomCode}`);

        // Puanlama sonuçlarını göster
        io.to(roomCode).emit("voting_closed", {
          scores: result.scores,
          players: result.players,
        });

        // 3 saniye sonra sonraki round'a geç (veya oyunu bitir)
        setTimeout(() => {
          const nextRoundResult = startNextRound(roomCode);
          if (nextRoundResult.success) {
            if (nextRoundResult.gameEnded) {
              // Oyun bitti
              io.to(roomCode).emit("game_ended", {
                finalScores: nextRoundResult.finalScores,
                winner: nextRoundResult.finalScores.reduce((prev, current) =>
                  prev.score > current.score ? prev : current
                ),
              });
            } else {
              // Sonraki round başladı
              io.to(roomCode).emit("next_round_started", {
                room: nextRoundResult.room,
                round: nextRoundResult.round,
                targetPlayer: nextRoundResult.targetPlayer,
              });

              // Her oyuncuya yeni görevini gönder
              nextRoundResult.taskAssignments.forEach((task, playerId) => {
                io.to(playerId).emit("task_assigned", {
                  taskId: task.id,
                  text: task.text,
                });
              });
            }
          }
        }, 3000);
      } catch (error) {
        console.error("Close voting error:", error);
        socket.emit("error", { message: "Oylama kapatılamadı" });
      }
    });

    // Public odaları listele
    socket.on("get_public_rooms", () => {
      try {
        const publicRooms = getPublicRooms();
        socket.emit("public_rooms", { rooms: publicRooms });
      } catch (error) {
        console.error("Get public rooms error:", error);
        socket.emit("error", { message: "Odalar listelenemedi" });
      }
    });

    // Oda durumunu getir
    socket.on("get_room_state", (data) => {
      try {
        const { roomCode } = data;
        const room = getRoom(roomCode);

        if (!room) {
          socket.emit("error", { message: "Oda bulunamadı" });
          return;
        }

        socket.emit("room_state", serializeRoom(room));
      } catch (error) {
        console.error("Get room state error:", error);
        socket.emit("error", { message: "Oda durumu alınamadı" });
      }
    });

    // Disconnect handling
    socket.on("disconnect", () => {
      try {
        const result = handleDisconnect(socket.id);

        if (result && result.room) {
          // Odadaki diğer oyunculara disconnect bilgisi gönder
          socket.to(result.room.code).emit("player_disconnected", {
            playerId: socket.id,
            playerNickname: result.player.nickname,
          });

          // 10 saniye sonra oyuncuyu tamamen sil (reconnect şansı)
          setTimeout(() => {
            const player = getPlayer(socket.id);
            if (player && !player.isConnected) {
              leaveRoom(socket.id);
              console.log(
                `🗑️  ${result.player.nickname} 10 saniye sonra silindi`
              );
            }
          }, 10000);
        }

        console.log(`🔌 Client bağlantısı kesildi: ${socket.id}`);
      } catch (error) {
        console.error("Disconnect error:", error);
      }
    });

    // Ping-pong test
    socket.on("ping", (data) => {
      socket.emit("pong", {
        ...data,
        timestamp: new Date().toISOString(),
        socketId: socket.id,
      });
    });
  });
};

// Serialize fonksiyonları (client'a gönderilecek veri formatı)
const serializeRoom = (room) => {
  if (!room) return null;

  return {
    code: room.code,
    name: room.name,
    status: room.status,
    public: room.public,
    maxPlayers: room.maxPlayers,
    currentRoundId: room.currentRoundId,
    hostId: room.hostId,
    players: room.players.map(serializePlayer),
    createdAt: room.createdAt,
  };
};

const serializePlayer = (player) => {
  if (!player) return null;

  return {
    id: player.id,
    nickname: player.nickname,
    isReady: player.isReady,
    isHost: player.isHost,
    score: player.score,
    isConnected: player.isConnected,
    joinedAt: player.joinedAt,
  };
};

module.exports = {
  setupSocketEvents,
  serializeRoom,
  serializePlayer,
};
