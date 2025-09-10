"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import socketClient from "./socketClient";
import type {
  GameState,
  Room,
  Player,
  Round,
  Task,
  TaskStats,
  PublicRoom,
  ConnectionState,
  SocketError,
} from "./types";

interface GameStore extends GameState {
  // Actions
  initializeSocket: () => Promise<void>;
  disconnectSocket: () => void;
  createRoom: (nickname: string, isPublic: boolean, roomName?: string) => void;
  joinRoom: (roomCode: string, nickname: string) => void;
  leaveRoom: () => void;
  toggleReady: () => void;
  startGame: () => void;
  submitTaskDone: () => void;
  getPublicRooms: () => void;
  getRoomState: (roomCode: string) => void;
  clearError: () => void;

  // Internal state setters
  setConnectionState: (state: Partial<ConnectionState>) => void;
  setCurrentRoom: (room: Room | null) => void;
  setCurrentPlayer: (player: Player | null) => void;
  setCurrentRound: (round: Round | null) => void;
  setCurrentTask: (task: Task | null) => void;
  setTaskStats: (stats: TaskStats | null) => void;
  setPublicRooms: (rooms: PublicRoom[]) => void;
  updatePlayerInRoom: (playerId: string, updates: Partial<Player>) => void;
  addPlayerToRoom: (player: Player) => void;
  removePlayerFromRoom: (playerId: string) => void;
}

const initialConnectionState: ConnectionState = {
  isConnected: false,
  isConnecting: false,
  isReconnecting: false,
  error: null,
  socketId: null,
};

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentRoom: null,
      currentPlayer: null,
      currentRound: null,
      currentTask: null,
      taskStats: null,
      currentGuessTarget: null,
      guessDeadline: null,
      currentGuesses: [],
      myGuess: null,
      votingDeadline: null,
      myVotes: new Map(),
      actualTask: null,
      roundScores: [],
      publicRooms: [],
      connectionState: initialConnectionState,

      // Actions
      initializeSocket: async () => {
        const state = get();

        if (state.connectionState.isConnected) {
          return;
        }

        set((state) => ({
          connectionState: {
            ...state.connectionState,
            isConnecting: true,
            error: null,
          },
        }));

        try {
          // Socket event listeners setup
          socketClient.on("connection_state_changed", (connectionData) => {
            set((state) => ({
              connectionState: {
                ...state.connectionState,
                ...connectionData,
                socketId: socketClient.socketId,
              },
            }));
          });

          socketClient.on("connection_error", (error: SocketError) => {
            set((state) => ({
              connectionState: {
                ...state.connectionState,
                isConnecting: false,
                isReconnecting: false,
                error: error.message,
              },
            }));
          });

          socketClient.on("room_created", (data) => {
            set({
              currentRoom: data.room,
              currentPlayer:
                data.room.players.find((p) => p.id === socketClient.socketId) ||
                null,
            });
          });

          socketClient.on("room_joined", (data) => {
            set({
              currentRoom: data.room,
              currentPlayer:
                data.room.players.find((p) => p.id === socketClient.socketId) ||
                null,
            });
          });

          socketClient.on("room_left", () => {
            set({
              currentRoom: null,
              currentPlayer: null,
              currentRound: null,
            });
          });

          socketClient.on("room_state", (room) => {
            set((state) => ({
              currentRoom: room,
              currentPlayer:
                room.players.find((p) => p.id === socketClient.socketId) ||
                state.currentPlayer,
            }));
          });

          socketClient.on("player_joined", (data) => {
            const state = get();
            if (state.currentRoom) {
              state.addPlayerToRoom(data.player);
            }
          });

          socketClient.on("player_left", (data) => {
            const state = get();
            if (state.currentRoom) {
              state.removePlayerFromRoom(data.playerId);
            }
          });

          socketClient.on("player_ready_changed", (data) => {
            const state = get();
            if (state.currentRoom) {
              state.updatePlayerInRoom(data.playerId, {
                isReady: data.isReady,
              });
            }
          });

          socketClient.on("player_disconnected", (data) => {
            const state = get();
            if (state.currentRoom) {
              state.updatePlayerInRoom(data.playerId, { isConnected: false });
            }
          });

          socketClient.on("game_started", (data) => {
            set({
              currentRoom: data.room,
              currentRound: {
                id: data.roundId,
                roomCode: data.roomCode,
                targetPlayerId: null,
                taskId: null,
                status: "tasks",
                guesses: [],
                createdAt: new Date(),
              },
            });
          });

          // Task events
          socketClient.on("task_assigned", (data) => {
            console.log("TASK ASSIGNED:", data);
            set({
              currentTask: {
                id: data.taskId,
                text: data.text,
                playerId: socketClient.socketId || "",
                assignedAt: Date.now(),
                completed: false,
                completedAt: null,
              },
            });
          });

          socketClient.on("task_completed", (data) => {
            console.log("TASK COMPLETED:", data);
            set((state) => ({
              currentTask: state.currentTask
                ? {
                    ...state.currentTask,
                    completed: true,
                    completedAt: data.completedAt,
                  }
                : null,
            }));
          });

          socketClient.on("task_progress", (data) => {
            console.log("TASK PROGRESS:", data);
            set({
              taskStats: data.stats,
            });
          });

          socketClient.on("all_tasks_completed", (data) => {
            console.log("ALL TASKS COMPLETED:", data);
            set({
              taskStats: data.stats,
            });
          });

          // Guess phase events
          socketClient.on("guess_phase_started", (data) => {
            console.log("GUESS PHASE STARTED:", data);
            set({
              currentGuessTarget: data.targetPlayer,
              guessDeadline: data.deadline,
              currentGuesses: [],
              myGuess: null,
            });
          });

          socketClient.on("guess_window_open", (data) => {
            console.log("GUESS WINDOW OPEN:", data);
            set({
              currentGuessTarget: {
                id: data.targetPlayerId,
                nickname: data.targetPlayerNickname,
                isReady: false,
                isHost: false,
                score: 0,
                isConnected: true,
                joinedAt: new Date(),
              },
              guessDeadline: data.deadline,
            });
          });

          socketClient.on("guess_submitted", (data) => {
            console.log("GUESS SUBMITTED:", data);
            const state = get();

            // Kendi tahmini ise myGuess'e kaydet
            if (data.guess.fromPlayerId === socketClient.socketId) {
              set({
                myGuess: data.guess,
              });
            }

            // Tahmin listesine ekle (eğer zaten yoksa)
            const existingGuess = state.currentGuesses.find(
              (g) => g.id === data.guess.id
            );
            if (!existingGuess) {
              set({
                currentGuesses: [...state.currentGuesses, data.guess],
              });
            }
          });

          socketClient.on("guess_window_closed", (data) => {
            console.log("GUESS WINDOW CLOSED:", data);
            set({
              guessDeadline: null,
            });
          });

          socketClient.on("reveal", (data) => {
            console.log("REVEAL:", data);
            set({
              currentGuesses: data.guesses,
            });
          });

          // Voting events
          socketClient.on("voting_started", (data) => {
            console.log("VOTING STARTED:", data);
            set({
              currentGuesses: data.guesses,
              actualTask: data.taskText,
              votingDeadline: data.votingDeadline,
              myVotes: new Map(),
            });
          });

          socketClient.on("vote_submitted", (data) => {
            console.log("VOTE SUBMITTED:", data);
            // Vote feedback handled locally
          });

          socketClient.on("voting_closed", (data) => {
            console.log("VOTING CLOSED:", data);
            set({
              roundScores: data.scores,
              votingDeadline: null,
            });
          });

          // Round events
          socketClient.on("next_round_started", (data) => {
            console.log("NEXT ROUND STARTED:", data);
            set({
              currentRoom: data.room,
              currentRound: data.round,
              currentGuessTarget: null,
              guessDeadline: null,
              votingDeadline: null,
              currentGuesses: [],
              myGuess: null,
              myVotes: new Map(),
              actualTask: null,
              roundScores: [],
            });
          });

          socketClient.on("game_ended", (data) => {
            console.log("GAME ENDED:", data);
            set((state) => ({
              currentRoom: state.currentRoom
                ? {
                    ...state.currentRoom,
                    status: "ended" as const,
                    players: data.finalScores,
                  }
                : null,
              currentGuessTarget: null,
              guessDeadline: null,
              votingDeadline: null,
              currentGuesses: [],
              myGuess: null,
              myVotes: new Map(),
              actualTask: null,
              roundScores: data.finalScores,
            }));
          });

          socketClient.on("public_rooms", (data) => {
            set({ publicRooms: data.rooms });
          });

          socketClient.on("socket_error", (error) => {
            console.error("Socket error:", error);
            set((state) => ({
              connectionState: {
                ...state.connectionState,
                error: error.message,
              },
            }));
          });

          // Connect to socket
          await socketClient.connect();

          // Get initial public rooms
          socketClient.getPublicRooms();
        } catch (error) {
          console.error("Socket initialization failed:", error);
          set((state) => ({
            connectionState: {
              ...state.connectionState,
              isConnecting: false,
              error: "Bağlantı kurulamadı",
            },
          }));
        }
      },

      disconnectSocket: () => {
        socketClient.disconnect();
        set({
          currentRoom: null,
          currentPlayer: null,
          currentRound: null,
          connectionState: initialConnectionState,
        });
      },

      createRoom: (nickname: string, isPublic: boolean, roomName?: string) => {
        socketClient.createRoom(nickname, isPublic, roomName);
      },

      joinRoom: (roomCode: string, nickname: string) => {
        socketClient.joinRoom(roomCode, nickname);
      },

      leaveRoom: () => {
        const { currentRoom } = get();
        if (currentRoom) {
          socketClient.leaveRoom(currentRoom.code);
        }
      },

      toggleReady: () => {
        const { currentRoom } = get();
        if (currentRoom) {
          socketClient.toggleReady(currentRoom.code);
        }
      },

      startGame: () => {
        const { currentRoom } = get();
        if (currentRoom) {
          socketClient.startGame(currentRoom.code);
        }
      },

      submitTaskDone: () => {
        const { currentRoom } = get();
        if (currentRoom) {
          socketClient.submitTaskDone(currentRoom.code);
        }
      },

      submitGuess: (targetPlayerId: string, text: string) => {
        const { currentRoom } = get();
        if (currentRoom) {
          socketClient.submitGuess(currentRoom.code, targetPlayerId, text);
        }
      },

      closeGuesses: (targetPlayerId: string) => {
        const { currentRoom } = get();
        if (currentRoom) {
          socketClient.closeGuesses(currentRoom.code, targetPlayerId);
        }
      },

      submitVote: (guessId: string, isCorrect: boolean) => {
        const { currentRoom } = get();
        if (currentRoom) {
          socketClient.submitVote(currentRoom.code, guessId, isCorrect);

          // Local vote tracking
          const vote = {
            id: `vote_${Date.now()}`,
            fromPlayerId: socketClient.socketId || "",
            guessId,
            isCorrect,
            submittedAt: Date.now(),
          };

          set((state) => {
            const newVotes = new Map(state.myVotes);
            newVotes.set(guessId, vote);
            return { myVotes: newVotes };
          });
        }
      },

      closeVoting: () => {
        const { currentRoom } = get();
        if (currentRoom) {
          socketClient.closeVoting(currentRoom.code);
        }
      },

      getPublicRooms: () => {
        socketClient.getPublicRooms();
      },

      getRoomState: (roomCode: string) => {
        socketClient.getRoomState(roomCode);
      },

      clearError: () => {
        set((state) => ({
          connectionState: {
            ...state.connectionState,
            error: null,
          },
        }));
      },

      // Internal state setters
      setConnectionState: (newState) => {
        set((state) => ({
          connectionState: { ...state.connectionState, ...newState },
        }));
      },

      setCurrentRoom: (room) => {
        set({ currentRoom: room });
      },

      setCurrentPlayer: (player) => {
        set({ currentPlayer: player });
      },

      setCurrentRound: (round) => {
        set({ currentRound: round });
      },

      setCurrentTask: (task) => {
        set({ currentTask: task });
      },

      setTaskStats: (stats) => {
        set({ taskStats: stats });
      },

      setCurrentGuessTarget: (player) => {
        set({ currentGuessTarget: player });
      },

      setGuessDeadline: (deadline) => {
        set({ guessDeadline: deadline });
      },

      setCurrentGuesses: (guesses) => {
        set({ currentGuesses: guesses });
      },

      setMyGuess: (guess) => {
        set({ myGuess: guess });
      },

      addGuess: (guess) => {
        set((state) => ({
          currentGuesses: [...state.currentGuesses, guess],
        }));
      },

      setVotingDeadline: (deadline) => {
        set({ votingDeadline: deadline });
      },

      setMyVotes: (votes) => {
        set({ myVotes: votes });
      },

      addVote: (guessId, vote) => {
        set((state) => {
          const newVotes = new Map(state.myVotes);
          newVotes.set(guessId, vote);
          return { myVotes: newVotes };
        });
      },

      setActualTask: (task) => {
        set({ actualTask: task });
      },

      setRoundScores: (scores) => {
        set({ roundScores: scores });
      },

      setPublicRooms: (rooms) => {
        set({ publicRooms: rooms });
      },

      updatePlayerInRoom: (playerId, updates) => {
        set((state) => {
          if (!state.currentRoom) return state;

          const updatedPlayers = state.currentRoom.players.map((player) =>
            player.id === playerId ? { ...player, ...updates } : player
          );

          return {
            currentRoom: { ...state.currentRoom, players: updatedPlayers },
            currentPlayer:
              state.currentPlayer?.id === playerId
                ? { ...state.currentPlayer, ...updates }
                : state.currentPlayer,
          };
        });
      },

      addPlayerToRoom: (player) => {
        set((state) => {
          if (!state.currentRoom) return state;

          // Oyuncu zaten varsa güncelle, yoksa ekle
          const existingPlayerIndex = state.currentRoom.players.findIndex(
            (p) => p.id === player.id
          );
          const updatedPlayers = [...state.currentRoom.players];

          if (existingPlayerIndex >= 0) {
            updatedPlayers[existingPlayerIndex] = player;
          } else {
            updatedPlayers.push(player);
          }

          return {
            currentRoom: { ...state.currentRoom, players: updatedPlayers },
          };
        });
      },

      removePlayerFromRoom: (playerId) => {
        set((state) => {
          if (!state.currentRoom) return state;

          const updatedPlayers = state.currentRoom.players.filter(
            (p) => p.id !== playerId
          );

          return {
            currentRoom: { ...state.currentRoom, players: updatedPlayers },
          };
        });
      },
    }),
    {
      name: "game-store",
    }
  )
);
