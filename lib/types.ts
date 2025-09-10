// Paylaşılan tip tanımları (client + server)

export interface Player {
  id: string;
  nickname: string;
  isReady: boolean;
  isHost: boolean;
  score: number;
  isConnected: boolean;
  joinedAt: Date;
}

export interface Room {
  code: string;
  name: string;
  status: "lobby" | "running" | "ended";
  public: boolean;
  maxPlayers: number;
  currentRoundId: string | null;
  hostId: string;
  players: Player[];
  createdAt: Date;
}

export interface Round {
  id: string;
  roomCode: string;
  targetPlayerId: string | null;
  taskId: string | null;
  status: "tasks" | "guessing" | "voting" | "scoring" | "done";
  guesses: Guess[];
  guessDeadline?: number;
  votingDeadline?: number;
  createdAt: Date;
}

export interface Task {
  id: string;
  text: string;
  playerId: string;
  assignedAt: number;
  completed: boolean;
  completedAt: number | null;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}

export interface Guess {
  id: string;
  roundId: string;
  fromPlayerId: string;
  targetPlayerId: string;
  text: string;
  votes: Vote[];
  submittedAt: number;
}

export interface Vote {
  id: string;
  fromPlayerId: string;
  guessId: string;
  isCorrect: boolean;
  submittedAt: number;
}

export interface ScoreBreakdown {
  taskCompletion: number;
  correctGuesses: number;
  accurateGuess: number;
  targetBonus: number;
}

export interface RoundScore {
  playerId: string;
  playerNickname: string;
  points: number;
  breakdown: ScoreBreakdown;
  isTarget: boolean;
}

// Socket Event Types
export interface SocketEvents {
  // Client to Server
  create_room: (data: {
    nickname: string;
    isPublic: boolean;
    roomName?: string;
  }) => void;
  join_room: (data: { roomCode: string; nickname: string }) => void;
  leave_room: (data: { roomCode: string }) => void;
  toggle_ready: (data: { roomCode: string }) => void;
  start_game: (data: { roomCode: string }) => void;
  submit_task_done: (data: { roomCode: string }) => void;
  submit_guess: (data: {
    roomCode: string;
    targetPlayerId: string;
    text: string;
  }) => void;
  close_guesses: (data: { roomCode: string; targetPlayerId: string }) => void;
  vote_guess: (data: {
    roomCode: string;
    guessId: string;
    isCorrect: boolean;
  }) => void;
  get_public_rooms: () => void;
  get_room_state: (data: { roomCode: string }) => void;
  ping: (data: any) => void;
}

export interface ServerEvents {
  // Server to Client
  room_created: (data: { roomCode: string; room: Room }) => void;
  room_joined: (data: { roomCode: string; room: Room }) => void;
  room_left: (data: { roomCode: string }) => void;
  room_state: (room: Room) => void;
  player_joined: (data: { player: Player }) => void;
  player_left: (data: { playerId: string; playerNickname: string }) => void;
  player_ready_changed: (data: {
    playerId: string;
    isReady: boolean;
    playerNickname: string;
  }) => void;
  player_disconnected: (data: {
    playerId: string;
    playerNickname: string;
  }) => void;
  game_started: (data: {
    roomCode: string;
    roundId: string;
    room: Room;
  }) => void;
  task_assigned: (data: { taskId: string; text: string }) => void;
  guess_window_open: (data: {
    targetPlayerId: string;
    deadline?: number;
  }) => void;
  guess_submitted: (data: { guess: Guess }) => void;
  guess_window_closed: (data: { targetPlayerId: string }) => void;
  reveal: (data: {
    targetPlayerId: string;
    taskId: string;
    taskText: string;
    guesses: Guess[];
  }) => void;
  vote_updated: (data: {
    guessId: string;
    correctVotes: number;
    wrongVotes: number;
  }) => void;
  score_update: (data: {
    scores: Array<{ playerId: string; score: number }>;
  }) => void;
  round_end: (data: { roundId: string }) => void;
  game_end: (data: {
    finalScores: Array<{ playerId: string; nickname: string; score: number }>;
  }) => void;
  public_rooms: (data: { rooms: PublicRoom[] }) => void;
  error: (data: { message: string }) => void;
  pong: (data: any) => void;
}

// Utility Types
export interface PublicRoom {
  code: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  isPublic: boolean;
}

export interface GameSettings {
  maxPlayers: number;
  roundCount?: number;
  taskCategories?: string[];
  timeouts: {
    guessWindow: number;
    votingWindow: number;
    roundTransition: number;
  };
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  error: string | null;
  socketId: string | null;
}

export interface GameState {
  // Connection state
  connectionState: ConnectionState;

  // Current game data
  currentRoom: Room | null;
  currentPlayer: Player | null;
  currentRound: Round | null;

  // Task data
  currentTask: Task | null;
  taskStats: TaskStats | null;

  // Guess data
  currentGuessTarget: Player | null;
  guessDeadline: number | null;
  currentGuesses: Guess[];
  myGuess: Guess | null;

  // Voting data
  votingDeadline: number | null;
  myVotes: Map<string, Vote>; // guessId -> Vote
  actualTask: string | null;

  // Scoring data
  roundScores: RoundScore[];

  // UI state
  publicRooms: PublicRoom[];

  // Actions
  initializeSocket: () => Promise<void>;
  createRoom: (nickname: string, isPublic: boolean, roomName?: string) => void;
  joinRoom: (roomCode: string, nickname: string) => void;
  leaveRoom: () => void;
  toggleReady: () => void;
  startGame: () => void;
  submitTaskDone: () => void;
  submitGuess: (targetPlayerId: string, text: string) => void;
  closeGuesses: (targetPlayerId: string) => void;
  submitVote: (guessId: string, isCorrect: boolean) => void;
  closeVoting: () => void;
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
  setCurrentGuessTarget: (player: Player | null) => void;
  setGuessDeadline: (deadline: number | null) => void;
  setCurrentGuesses: (guesses: Guess[]) => void;
  setMyGuess: (guess: Guess | null) => void;
  addGuess: (guess: Guess) => void;
  setVotingDeadline: (deadline: number | null) => void;
  setMyVotes: (votes: Map<string, Vote>) => void;
  addVote: (guessId: string, vote: Vote) => void;
  setActualTask: (task: string | null) => void;
  setRoundScores: (scores: RoundScore[]) => void;
  updatePlayerInRoom: (playerId: string, updates: Partial<Player>) => void;
  addPlayerToRoom: (player: Player) => void;
  removePlayerFromRoom: (playerId: string) => void;
}

// Error Types
export type SocketError = {
  type: "connection" | "room" | "game" | "validation";
  message: string;
  details?: any;
};

// Form Data Types
export interface JoinRoomData {
  roomCode: string;
  nickname: string;
}

export interface CreateRoomData {
  nickname: string;
  isPublic: boolean;
  roomName?: string;
}
