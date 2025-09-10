const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { setupSocketEvents } = require("./events");
const { getPublicRooms, getAllRooms } = require("./rooms");

const app = express();
const server = createServer(app);

// CORS ayarları
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3003",
    ],
    credentials: true,
  })
);

// Socket.IO sunucusu
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3003",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Temel health check
app.get("/health", (req, res) => {
  const rooms = getAllRooms();
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "mission-game-socket",
    version: "0.1.0",
    stats: {
      totalRooms: rooms.length,
      publicRooms: getPublicRooms().length,
      totalPlayers: rooms.reduce((sum, room) => sum + room.players.length, 0),
    },
  });
});

// Public odaları API endpoint'i
app.get("/api/public-rooms", (req, res) => {
  try {
    const publicRooms = getPublicRooms();
    res.json({
      success: true,
      rooms: publicRooms,
      count: publicRooms.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Odalar getirilemedi",
    });
  }
});

// Socket event handler'larını kur
setupSocketEvents(io);

const PORT = process.env.SOCKET_PORT || 3002;

server.listen(PORT, () => {
  console.log(`🚀 Socket sunucusu ${PORT} portunda çalışıyor`);
  console.log(`📡 Socket.IO endpoint: http://localhost:${PORT}`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});
