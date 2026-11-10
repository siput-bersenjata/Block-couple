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

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint for Render
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Room state storage
// roomCode -> { code, isPublic, players: { socketId: { id, slot, x, y, vx, vy, facing, isGrounded, blocksLeft } }, levelIndex, keysCollected: Set, blocks: [], buttonsPressed: Set, lastActivity: timestamp }
const rooms = new Map();

function generateRoomCode() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
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

  // Create private room
  socket.on('create-room', ({ isPublic = false } = {}, callback) => {
    let code;
    do {
      code = generateRoomCode();
    } while (rooms.has(code));

    const room = {
      code,
      isPublic: Boolean(isPublic),
      players: {},
      levelIndex: 0,
      collectedKeys: [],
      pressedButtons: [],
      blocks: [], // { id, x, y, width, height, playerSlot, color }
      createdAt: Date.now(),
      completed: false
    };

    // Assign Player 1 (Bobi - Cyan)
    room.players[socket.id] = {
      socketId: socket.id,
      slot: 1,
      name: 'Bobi (Biru)',
      color: '#00d2ff',
      x: 60,
      y: 400,
      vx: 0,
      vy: 0,
      facing: 1,
      isGrounded: false
    };

    rooms.set(code, room);
    currentRoomCode = code;
    socket.join(code);

    console.log(`[Room ${code}] Created (Public: ${room.isPublic}) by player ${socket.id}`);
    if (typeof callback === 'function') {
      callback({
        success: true,
        code,
        slot: 1,
        roomState: getPublicRoomState(room)
      });
    }
  });

  // Join existing room
  socket.on('join-room', ({ code }, callback) => {
    const upperCode = (code || '').trim().toUpperCase();
    const room = rooms.get(upperCode);

    if (!room) {
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Room tidak ditemukan! Periksa kembali kodenya.' });
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

    room.players[socket.id] = {
      socketId: socket.id,
      slot: assignedSlot,
      name: assignedSlot === 1 ? 'Bobi (Biru)' : 'Bona (Pink)',
      color: assignedSlot === 1 ? '#00d2ff' : '#ff4d88',
      x: assignedSlot === 1 ? 60 : 100,
      y: 400,
      vx: 0,
      vy: 0,
      facing: 1,
      isGrounded: false
    };

    currentRoomCode = upperCode;
    socket.join(upperCode);

    console.log(`[Room ${upperCode}] Player joined: ${socket.id} as Slot ${assignedSlot}`);

    const roomState = getPublicRoomState(room);

    // Notify joiner
    if (typeof callback === 'function') {
      callback({
        success: true,
        code: upperCode,
        slot: assignedSlot,
        roomState
      });
    }

    // Broadcast to room that a player joined
    io.to(upperCode).emit('player-joined', {
      slot: assignedSlot,
      roomState
    });
  });

  // Quick Match / Public Room
  socket.on('find-public-room', (callback) => {
    let targetCode = getAvailablePublicRoom();
    if (targetCode) {
      // Join existing
      const room = rooms.get(targetCode);
      const assignedSlot = 2;
      room.players[socket.id] = {
        socketId: socket.id,
        slot: assignedSlot,
        name: 'Bona (Pink)',
        color: '#ff4d88',
        x: 100,
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
      io.to(targetCode).emit('player-joined', { slot: assignedSlot, roomState });
    } else {
      // Create new public room
      let code;
      do {
        code = generateRoomCode();
      } while (rooms.has(code));

      const room = {
        code,
        isPublic: true,
        players: {},
        levelIndex: 0,
        collectedKeys: [],
        pressedButtons: [],
        blocks: [],
        createdAt: Date.now(),
        completed: false
      };

      room.players[socket.id] = {
        socketId: socket.id,
        slot: 1,
        name: 'Bobi (Biru)',
        color: '#00d2ff',
        x: 60,
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

  // Player position and motion sync
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

    // Relay to other player in room
    socket.to(currentRoomCode).emit('peer-update', {
      slot: p.slot,
      x: p.x,
      y: p.y,
      vx: p.vx,
      vy: p.vy,
      facing: p.facing,
      isGrounded: p.isGrounded,
      anim: p.anim
    });
  });

  // Create block
  socket.on('create-block', (blockData) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || !room.players[socket.id]) return;

    const player = room.players[socket.id];

    // Limit active blocks per player to 4 to prevent clutter and keep puzzle challenge
    const playerBlocks = room.blocks.filter(b => b.playerSlot === player.slot);
    if (playerBlocks.length >= 4) {
      // Remove the oldest block placed by this player
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
      // Advance to next level after brief celebration
      setTimeout(() => {
        room.levelIndex++;
        room.collectedKeys = [];
        room.pressedButtons = [];
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
    collectedKeys: room.collectedKeys,
    pressedButtons: room.pressedButtons,
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
  console.log(`🎮 Block Couple Server running on http://0.0.0.0:${PORT}`);
});
