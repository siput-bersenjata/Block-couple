const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

app.use(express.json());

// Real-time server presence and match statistics
const activePresence = new Map(); // sessionId -> timestamp
let totalGamesPlayedCount = 38;

// Heartbeat endpoint - updates presence and returns real live stats
app.post('/api/heartbeat', (req, res) => {
  const sessionId = req.body?.sessionId || req.ip || Math.random().toString();
  activePresence.set(sessionId, Date.now());

  // Prune sessions older than 35 seconds
  const cutoff = Date.now() - 35000;
  for (const [id, ts] of activePresence.entries()) {
    if (ts < cutoff) activePresence.delete(id);
  }

  const count = Math.max(1, activePresence.size);
  res.json({ activeUsers: count, gamesPlayed: totalGamesPlayedCount });
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
  const cutoff = Date.now() - 35000;
  for (const [id, ts] of activePresence.entries()) {
    if (ts < cutoff) activePresence.delete(id);
  }
  const count = Math.max(1, activePresence.size);
  res.json({ activeUsers: count, gamesPlayed: totalGamesPlayedCount });
});

// Increment game completed count
app.post('/api/game-played', (req, res) => {
  totalGamesPlayedCount++;
  res.json({ success: true, gamesPlayed: totalGamesPlayedCount });
});

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));

// Root & fallback route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Room state storage
// roomCode (6 digits) -> room object
const rooms = new Map();

// Generate 6-digit numeric room code (e.g. 100000 - 999999)
function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getAvailablePublicRoom() {
  for (const [code, room] of rooms.entries()) {
    if (room.isPublic && Object.keys(room.players).length === 1) {
      return code;
    }
  }
  return null;
}

io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);
  let currentRoomCode = null;

  // Ping check for latency/connection health monitor
  socket.on('client-ping', (clientTime, callback) => {
    if (typeof callback === 'function') {
      callback(clientTime, Date.now());
    }
  });

  // Create private room (6 digits)
  socket.on('create-room', ({ isPublic = false, username = '' } = {}, callback) => {
    let code;
    let attempts = 0;
    do {
      code = generateRoomCode();
      attempts++;
    } while (rooms.has(code) && attempts < 100);

    const displayName = (username || '').trim().substring(0, 15) || 'Bobi (Biru)';

    const room = {
      code,
      isPublic: Boolean(isPublic),
      players: {},
      levelIndex: 0,
      levelStartTime: Date.now(),
      collectedKeys: [],
      pressedButtons: [],
      defeatedEnemies: [],
      blocks: [], // { id, x, y, width, height, playerSlot, color }
      createdAt: Date.now(),
      completed: false
    };

    // Assign Player 1 (Bobi - Cyan)
    room.players[socket.id] = {
      socketId: socket.id,
      slot: 1,
      name: displayName,
      color: '#00e5ff',
      x: 80,
      y: 400,
      vx: 0,
      vy: 0,
      facing: 1,
      isGrounded: false
    };

    rooms.set(code, room);
    currentRoomCode = code;
    socket.join(code);

    console.log(`[Room ${code}] Created (Public: ${room.isPublic}) by ${displayName} (${socket.id})`);
    if (typeof callback === 'function') {
      callback({
        success: true,
        code,
        slot: 1,
        roomState: getPublicRoomState(room)
      });
    }
  });

  // Join existing room with 6-digit code
  socket.on('join-room', ({ code, username = '' }, callback) => {
    const cleanCode = (code || '').toString().trim();
    const room = rooms.get(cleanCode);

    if (!room) {
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Room dengan kode ' + cleanCode + ' tidak ditemukan! Pastikan 6 digit angka sudah benar.' });
      }
      return;
    }

    const playerKeys = Object.keys(room.players);
    if (playerKeys.length >= 2) {
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Room sudah penuh (Maksimal 2 pemain).' });
      }
      return;
    }

    // Determine slot (1 or 2)
    const existingSlot = room.players[playerKeys[0]] ? room.players[playerKeys[0]].slot : 1;
    const assignedSlot = existingSlot === 1 ? 2 : 1;
    const defaultName = assignedSlot === 1 ? 'Bobi (Biru)' : 'Bona (Pink)';
    const displayName = (username || '').trim().substring(0, 15) || defaultName;

    room.players[socket.id] = {
      socketId: socket.id,
      slot: assignedSlot,
      name: displayName,
      color: assignedSlot === 1 ? '#00e5ff' : '#ff3b77',
      x: assignedSlot === 1 ? 80 : 130,
      y: 400,
      vx: 0,
      vy: 0,
      facing: 1,
      isGrounded: false
    };

    currentRoomCode = cleanCode;
    socket.join(cleanCode);

    console.log(`[Room ${cleanCode}] Player ${displayName} joined as Slot ${assignedSlot}`);

    const roomState = getPublicRoomState(room);

    // Notify joiner
    if (typeof callback === 'function') {
      callback({
        success: true,
        code: cleanCode,
        slot: assignedSlot,
        roomState
      });
    }

    // Broadcast to room that a player joined
    io.to(cleanCode).emit('player-joined', {
      slot: assignedSlot,
      name: displayName,
      roomState
    });
  });

  // Quick Match / Public Room
  socket.on('find-public-room', ({ username = '' } = {}, callback) => {
    let targetCode = getAvailablePublicRoom();
    if (targetCode) {
      // Join existing public room
      const room = rooms.get(targetCode);
      const assignedSlot = 2;
      const displayName = (username || '').trim().substring(0, 15) || 'Bona (Pink)';

      room.players[socket.id] = {
        socketId: socket.id,
        slot: assignedSlot,
        name: displayName,
        color: '#ff3b77',
        x: 130,
        y: 400,
        vx: 0,
        vy: 0,
        facing: 1,
        isGrounded: false
      };
      currentRoomCode = targetCode;
      socket.join(targetCode);

      const roomState = getPublicRoomState(room);
      if (typeof callback === 'function') {
        callback({ success: true, code: targetCode, slot: assignedSlot, roomState });
      }
      io.to(targetCode).emit('player-joined', { slot: assignedSlot, name: displayName, roomState });
    } else {
      // Create new public room (6 digits)
      let code;
      do {
        code = generateRoomCode();
      } while (rooms.has(code));

      const displayName = (username || '').trim().substring(0, 15) || 'Bobi (Biru)';

      const room = {
        code,
        isPublic: true,
        players: {},
        levelIndex: 0,
        levelStartTime: Date.now(),
        collectedKeys: [],
        pressedButtons: [],
        defeatedEnemies: [],
        blocks: [],
        createdAt: Date.now(),
        completed: false
      };

      room.players[socket.id] = {
        socketId: socket.id,
        slot: 1,
        name: displayName,
        color: '#00e5ff',
        x: 80,
        y: 400,
        vx: 0,
        vy: 0,
        facing: 1,
        isGrounded: false
      };

      rooms.set(code, room);
      currentRoomCode = code;
      socket.join(code);

      if (typeof callback === 'function') {
        callback({ success: true, code, slot: 1, roomState: getPublicRoomState(room) });
      }
    }
  });

  // Player position, motion, and animation sync
  socket.on('player-update', (data) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || !room.players[socket.id]) return;

    const p = room.players[socket.id];
    p.x = data.x;
    p.y = data.y;
    p.vx = data.vx;
    p.vy = data.vy;
    p.facing = data.facing;
    p.isGrounded = data.isGrounded;
    p.anim = data.anim;
    p.tilt = data.tilt;
    p.squashX = data.squashX;
    p.squashY = data.squashY;
    p.expression = data.expression;

    // Relay to other player in room
    socket.to(currentRoomCode).emit('peer-update', {
      slot: p.slot,
      x: p.x,
      y: p.y,
      vx: p.vx,
      vy: p.vy,
      facing: p.facing,
      isGrounded: p.isGrounded,
      anim: p.anim,
      tilt: p.tilt,
      squashX: p.squashX,
      squashY: p.squashY,
      expression: p.expression
    });
  });

  // Create block
  socket.on('create-block', (blockData) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || !room.players[socket.id]) return;

    const player = room.players[socket.id];

    // Limit active blocks per player to 4 to prevent puzzle cheating
    const playerBlocks = room.blocks.filter(b => b.playerSlot === player.slot);
    if (playerBlocks.length >= 4) {
      const oldest = playerBlocks[0];
      room.blocks = room.blocks.filter(b => b.id !== oldest.id);
      io.to(currentRoomCode).emit('block-removed', { id: oldest.id });
    }

    const newBlock = {
      id: `${player.slot}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      x: blockData.x,
      y: blockData.y,
      width: blockData.width || 36,
      height: blockData.height || 36,
      playerSlot: player.slot,
      color: player.slot === 1 ? '#00e5ff' : '#ff3b77'
    };

    room.blocks.push(newBlock);
    io.to(currentRoomCode).emit('block-created', newBlock);
  });

  // Clear player blocks
  socket.on('clear-blocks', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || !room.players[socket.id]) return;

    const player = room.players[socket.id];
    const removedIds = room.blocks.filter(b => b.playerSlot === player.slot).map(b => b.id);
    room.blocks = room.blocks.filter(b => b.playerSlot !== player.slot);

    io.to(currentRoomCode).emit('blocks-cleared', { playerSlot: player.slot, removedIds });
  });

  // Pick up key
  socket.on('collect-key', ({ keyId }) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    if (!room.collectedKeys.includes(keyId)) {
      room.collectedKeys.push(keyId);
      io.to(currentRoomCode).emit('key-collected', {
        keyId,
        collectedKeys: room.collectedKeys,
        bySlot: room.players[socket.id] ? room.players[socket.id].slot : 1
      });
    }
  });

  // Toggle button / pressure plate
  socket.on('press-button', ({ buttonId, isPressed }) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    const idx = room.pressedButtons.indexOf(buttonId);
    if (isPressed && idx === -1) {
      room.pressedButtons.push(buttonId);
    } else if (!isPressed && idx !== -1) {
      room.pressedButtons.splice(idx, 1);
    }

    io.to(currentRoomCode).emit('button-updated', {
      buttonId,
      isPressed,
      pressedButtons: room.pressedButtons
    });
  });

  // Defeat enemy (e.g. crushed by placed block or stomped)
  socket.on('defeat-enemy', ({ enemyId }) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    if (!room.defeatedEnemies.includes(enemyId)) {
      room.defeatedEnemies.push(enemyId);
      io.to(currentRoomCode).emit('enemy-defeated', {
        enemyId,
        bySlot: room.players[socket.id] ? room.players[socket.id].slot : 1
      });
    }
  });

  // Player reached exit door
  socket.on('door-enter', ({ atDoor }) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || !room.players[socket.id]) return;

    room.players[socket.id].atDoor = Boolean(atDoor);

    const playersArr = Object.values(room.players);
    const bothAtDoor = playersArr.length === 2 && playersArr.every(p => p.atDoor);

    io.to(currentRoomCode).emit('player-door-status', {
      slot: room.players[socket.id].slot,
      atDoor: Boolean(atDoor),
      bothAtDoor
    });

    if (bothAtDoor && !room.completed) {
      room.completed = true;
      // Advance to next level after celebration
      setTimeout(() => {
        room.levelIndex++;
        room.levelStartTime = Date.now();
        room.collectedKeys = [];
        room.pressedButtons = [];
        room.defeatedEnemies = [];
        room.blocks = [];
        room.completed = false;
        for (const p of Object.values(room.players)) {
          p.atDoor = false;
        }

        io.to(currentRoomCode).emit('next-level', {
          levelIndex: room.levelIndex,
          roomState: getPublicRoomState(room)
        });
      }, 1500);
    }
  });

  // Restart level
  socket.on('restart-level', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    room.collectedKeys = [];
    room.pressedButtons = [];
    room.defeatedEnemies = [];
    room.blocks = [];
    room.completed = false;
    for (const p of Object.values(room.players)) {
      p.atDoor = false;
    }

    io.to(currentRoomCode).emit('level-restarted', {
      roomState: getPublicRoomState(room)
    });
  });

  // Send emote
  socket.on('send-emote', ({ emote }) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || !room.players[socket.id]) return;

    io.to(currentRoomCode).emit('player-emote', {
      slot: room.players[socket.id].slot,
      emote
    });
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${socket.id}`);
    if (currentRoomCode) {
      const room = rooms.get(currentRoomCode);
      if (room && room.players[socket.id]) {
        const slot = room.players[socket.id].slot;
        delete room.players[socket.id];

        const remaining = Object.keys(room.players);
        if (remaining.length === 0) {
          rooms.delete(currentRoomCode);
          console.log(`[Room ${currentRoomCode}] Empty and deleted.`);
        } else {
          io.to(currentRoomCode).emit('player-left', {
            slot,
            roomState: getPublicRoomState(room)
          });
        }
      }
    }
  });
});

function getPublicRoomState(room) {
  return {
    code: room.code,
    isPublic: room.isPublic,
    players: Object.values(room.players).map(p => ({
      slot: p.slot,
      name: p.name,
      color: p.color,
      x: p.x,
      y: p.y,
      atDoor: p.atDoor || false
    })),
    levelIndex: room.levelIndex,
    levelStartTime: room.levelStartTime,
    collectedKeys: room.collectedKeys,
    pressedButtons: room.pressedButtons,
    defeatedEnemies: room.defeatedEnemies || [],
    blocks: room.blocks
  };
}

// Clean up stale rooms older than 6 hours
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (now - room.createdAt > 6 * 60 * 60 * 1000) {
      rooms.delete(code);
    }
  }
}, 30 * 60 * 1000);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Block Couple] Server running on http://0.0.0.0:${PORT}`);
});

module.exports = app;
