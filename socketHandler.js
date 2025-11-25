import jwt from "jsonwebtoken";
import userModel from "./models/userModel.js"; // Add this import

// Data structures
const connectedUsers = new Map();
const matchmakingQueue = [];
const gameRooms = new Map();

// Socket.IO initialization
const initializeSocket = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;

    console.log(
      "🔐 Authentication attempt - Token received:",
      token ? `${token.substring(0, 20)}...` : "NONE"
    );

    if (!token || token === "demo-token") {
      console.log("⚠️ No valid token, using demo mode");
      socket.userData = { userId: socket.id, username: "Guest", name: "Guest" };
      return next();
    }

    try {
      // Decode the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token decoded:", decoded);

      // Fetch user from database to get the name
      // Your generateToken probably only stores the user ID
      const user = await userModel.findById(
        decoded.id || decoded.userId || decoded._id
      );

      if (user) {
        socket.userData = {
          userId: user._id.toString(),
          username: user.name,
          name: user.name,
          email: user.email,
        };
        console.log("✅ User fetched from DB:", socket.userData);
      } else {
        console.log("⚠️ User not found in DB, using token data");
        socket.userData = decoded;
      }

      next();
    } catch (err) {
      console.log("⚠️ Token verification failed:", err.message);
      console.log("🔧 Using demo mode");
      socket.userData = { userId: socket.id, username: "Guest", name: "Guest" };
      next();
    }
  });

  io.on("connection", (socket) => {
    console.log("\n" + "=".repeat(50));
    console.log("🔵 NEW CONNECTION");
    console.log("📍 Socket ID:", socket.id);
    console.log(
      "🔍 Raw socket.userData:",
      JSON.stringify(socket.userData, null, 2)
    );

    // Extract username from various possible fields
    const username =
      socket.userData.username ||
      socket.userData.name ||
      socket.userData.user?.username ||
      socket.userData.user?.name ||
      "Guest";

    console.log(`✅ Final username extracted: "${username}"`);

    // Register user
    const userData = {
      id: socket.id,
      userId: socket.userData.userId || socket.userData.id || socket.id,
      name: username,
      status: "In Lobby",
    };

    connectedUsers.set(socket.id, userData);

    console.log("📝 Stored user data:", JSON.stringify(userData, null, 2));
    console.log("=".repeat(50) + "\n");

    // Send user their own data
    socket.emit("user-data", {
      name: userData.name,
      userId: userData.userId,
    });

    console.log("📤 Sent user-data to client:", {
      name: userData.name,
      userId: userData.userId,
    });

    // Broadcast updated online users
    broadcastOnlineUsers(io);

    // ==================== MATCHMAKING ====================
    socket.on("join-queue", () => {
      const user = connectedUsers.get(socket.id);
      if (!user) return;

      // Check if already in queue
      if (matchmakingQueue.find((u) => u.id === socket.id)) {
        socket.emit("error", { message: "Already in queue" });
        return;
      }

      // Add to queue
      matchmakingQueue.push(user);
      user.status = "In Queue";
      connectedUsers.set(socket.id, user);

      console.log(
        `🎮 ${user.name} joined queue. Queue size: ${matchmakingQueue.length}`
      );

      broadcastOnlineUsers(io);

      // Try to match players (2 players minimum)
      if (matchmakingQueue.length >= 2) {
        createGameRoom(io);
      }
    });

    socket.on("leave-queue", () => {
      removeFromQueue(socket.id);
      const user = connectedUsers.get(socket.id);
      if (user) {
        user.status = "In Lobby";
        connectedUsers.set(socket.id, user);
        console.log(`⏸️ ${user.name} left queue`);
        broadcastOnlineUsers(io);
      }
    });

    // ==================== CHAT ====================
    socket.on("send-message", (data) => {
      const user = connectedUsers.get(socket.id);
      if (!user) return;

      const message = {
        id: Date.now(),
        username: user.name,
        text: data.text,
        timestamp: new Date().toISOString(),
      };

      console.log(`💬 ${user.name}: ${data.text}`);
      io.emit("new-message", message);
    });

    // ==================== GAME LOGIC ====================
    socket.on("game-move", (data) => {
      const user = connectedUsers.get(socket.id);
      if (!user || !user.roomId) return;

      const room = gameRooms.get(user.roomId);
      if (!room) return;

      // Store player's move
      const playerIndex = room.players.findIndex((p) => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players[playerIndex].move = data.move;
        room.players[playerIndex].hasPlayed = true;
      }

      // Broadcast move made (without revealing the move)
      io.to(user.roomId).emit("player-moved", {
        playerId: socket.id,
        playerName: user.name,
      });

      console.log(`🎲 ${user.name} made a move: ${data.move}`);

      // Check if all players have played
      const allPlayed = room.players.every((p) => p.hasPlayed);
      if (allPlayed) {
        calculateWinner(io, room);
      }
    });

    socket.on("play-again", () => {
      const user = connectedUsers.get(socket.id);
      if (!user || !user.roomId) return;

      const room = gameRooms.get(user.roomId);
      if (!room) return;

      // Reset room
      room.players.forEach((p) => {
        p.move = null;
        p.hasPlayed = false;
      });
      room.result = null;

      console.log(`🔄 ${user.name} wants to play again`);
      io.to(user.roomId).emit("game-reset");
    });

    socket.on("leave-room", () => {
      leaveGameRoom(io, socket.id);
    });

    // ==================== DISCONNECTION ====================
    socket.on("disconnect", () => {
      const user = connectedUsers.get(socket.id);
      console.log(`❌ User disconnected: ${user?.name || socket.id}`);

      removeFromQueue(socket.id);
      leaveGameRoom(io, socket.id);
      connectedUsers.delete(socket.id);

      broadcastOnlineUsers(io);
    });
  });
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Create a game room with matched players
 */
function createGameRoom(io) {
  const playersToMatch = 2; // 2 players per game
  const matchedPlayers = matchmakingQueue.splice(0, playersToMatch);

  if (matchedPlayers.length < 2) {
    // Put them back if not enough
    matchmakingQueue.unshift(...matchedPlayers);
    return;
  }

  const roomId = `room_${Date.now()}`;

  // Create room
  const room = {
    id: roomId,
    players: matchedPlayers.map((p) => ({
      id: p.id,
      userId: p.userId,
      name: p.name,
      move: null,
      hasPlayed: false,
    })),
    createdAt: Date.now(),
    result: null,
  };

  gameRooms.set(roomId, room);

  // Update player status and assign room
  matchedPlayers.forEach((player) => {
    const user = connectedUsers.get(player.id);
    if (user) {
      user.status = "In Game";
      user.roomId = roomId;
      connectedUsers.set(player.id, user);

      // Join socket room
      io.sockets.sockets.get(player.id)?.join(roomId);
    }
  });

  console.log(
    `🎯 Created room ${roomId} with players: ${matchedPlayers
      .map((p) => p.name)
      .join(", ")}`
  );

  // Notify matched players
  io.to(roomId).emit("match-found", {
    roomId: roomId,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
    })),
  });

  broadcastOnlineUsers(io);
}

/**
 * Calculate Rock/Paper/Scissors winner
 */
function calculateWinner(io, room) {
  const moves = room.players.map((p) => ({ name: p.name, move: p.move }));

  let result;

  if (room.players.length === 2) {
    const [p1, p2] = room.players;

    if (p1.move === p2.move) {
      result = {
        winner: null,
        message: "It's a tie!",
        moves: moves,
      };
    } else if (
      (p1.move === "rock" && p2.move === "scissors") ||
      (p1.move === "scissors" && p2.move === "paper") ||
      (p1.move === "paper" && p2.move === "rock")
    ) {
      result = {
        winner: p1.name,
        winnerId: p1.id,
        message: `${p1.name} wins!`,
        moves: moves,
      };
    } else {
      result = {
        winner: p2.name,
        winnerId: p2.id,
        message: `${p2.name} wins!`,
        moves: moves,
      };
    }
  } else {
    // For more than 2 players (future implementation)
    result = {
      winner: null,
      message: "Multi-player not fully implemented",
      moves: moves,
    };
  }

  room.result = result;

  console.log(`🏆 Game result: ${result.message}`);

  // Broadcast result
  io.to(room.id).emit("game-result", result);
}

/**
 * Remove user from matchmaking queue
 */
function removeFromQueue(socketId) {
  const index = matchmakingQueue.findIndex((u) => u.id === socketId);
  if (index !== -1) {
    matchmakingQueue.splice(index, 1);
  }
}

/**
 * Handle player leaving game room
 */
function leaveGameRoom(io, socketId) {
  const user = connectedUsers.get(socketId);
  if (!user || !user.roomId) return;

  const room = gameRooms.get(user.roomId);
  if (room) {
    // Remove player from room
    room.players = room.players.filter((p) => p.id !== socketId);

    // If room is empty, delete it
    if (room.players.length === 0) {
      gameRooms.delete(user.roomId);
      console.log(`🗑️ Deleted empty room: ${user.roomId}`);
    } else {
      // Notify other players
      io.to(user.roomId).emit("player-left", {
        playerId: socketId,
        playerName: user.name,
      });
      console.log(`👋 ${user.name} left room ${user.roomId}`);
    }
  }

  // Update user status
  user.status = "In Lobby";
  user.roomId = null;
  connectedUsers.set(socketId, user);

  broadcastOnlineUsers(io);
}

/**
 * Broadcast online users to all clients
 */
function broadcastOnlineUsers(io) {
  const users = Array.from(connectedUsers.values());
  io.emit("online-users", {
    count: users.length,
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      status: u.status,
    })),
  });
}

export default initializeSocket;
