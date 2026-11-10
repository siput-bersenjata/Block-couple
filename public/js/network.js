// Socket.io Multiplayer Networking Manager

class NetworkManager {
  constructor() {
    this.socket = null;
    this.roomCode = null;
    this.slot = 1;
    this.game = null;
    this.initSocket();
  }

  initSocket() {
    this.socket = io({
      reconnectionAttempts: 5,
      timeout: 10000
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to server with id:', this.socket.id);
      // Check if URL has ?room=CODE
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get('room');
      if (roomParam) {
        document.getElementById('roomCodeInput').value = roomParam;
        this.joinRoom(roomParam);
      }
    });

    // Room created / joined handlers
    this.socket.on('player-joined', ({ slot, roomState }) => {
      console.log(`[Event] Player joined: Slot ${slot}`);
      if (this.game) {
        this.game.peerPlayer.connected = true;
        this.updateRoomUI(roomState);
        this.game.addFloatingText(CANVAS_WIDTH / 2, 200, "Partner Telah Bergabung! Siap Bermain! 💕", '#00ffcc', 20);
        window.audioManager && window.audioManager.playKey();
      }
    });

    this.socket.on('player-left', ({ slot, roomState }) => {
      console.log(`[Event] Player left: Slot ${slot}`);
      if (this.game) {
        this.game.peerPlayer.connected = false;
        this.updateRoomUI(roomState);
        this.game.addFloatingText(CANVAS_WIDTH / 2, 200, "Partner Terputus! Menunggu... ⏳", '#ff9100', 20);
      }
    });

    // Peer position sync
    this.socket.on('peer-update', (data) => {
      if (!this.game) return;
      const peer = this.game.peerPlayer;
      peer.connected = true;
      peer.targetX = data.x;
      peer.targetY = data.y;
      peer.vx = data.vx;
      peer.vy = data.vy;
      peer.facing = data.facing;
      peer.isGrounded = data.isGrounded;
    });

    // Block sync
    this.socket.on('block-created', (newBlock) => {
      if (!this.game) return;
      // Add if not already present
      if (!this.game.blocks.some(b => b.id === newBlock.id)) {
        this.game.blocks.push(newBlock);
        if (newBlock.playerSlot !== this.game.localSlot) {
          window.audioManager && window.audioManager.playBlockPlace();
          this.game.createSpawnSparks(newBlock.x + newBlock.width / 2, newBlock.y + newBlock.height / 2, newBlock.color);
        }
      }
    });

    this.socket.on('block-removed', ({ id }) => {
      if (!this.game) return;
      this.game.blocks = this.game.blocks.filter(b => b.id !== id);
    });

    this.socket.on('blocks-cleared', ({ playerSlot, removedIds }) => {
      if (!this.game) return;
      this.game.blocks = this.game.blocks.filter(b => b.playerSlot !== playerSlot);
    });

    // Key collected sync
    this.socket.on('key-collected', ({ keyId, collectedKeys, bySlot }) => {
      if (!this.game) return;
      if (!this.game.collectedKeys.includes(keyId)) {
        this.game.collectedKeys.push(keyId);
        this.game.updateKeyUI();
        if (bySlot !== this.game.localSlot) {
          window.audioManager && window.audioManager.playKey();
          this.game.addFloatingText(this.game.peerPlayer.x, this.game.peerPlayer.y - 25, "KUNCI DIAMBIL! 🔑", '#ffd700', 16);
        }
      }
    });

    // Button toggle sync
    this.socket.on('button-updated', ({ buttonId, isPressed, pressedButtons }) => {
      if (!this.game) return;
      this.game.pressedButtons = pressedButtons;
    });

    // Door sync
    this.socket.on('player-door-status', ({ slot, atDoor, bothAtDoor }) => {
      if (!this.game) return;
      if (slot !== this.game.localSlot) {
        this.game.peerPlayer.atDoor = atDoor;
      }
    });

    // Advance to next level
    this.socket.on('next-level', ({ levelIndex, roomState }) => {
      if (!this.game) return;
      window.audioManager && window.audioManager.playLevelComplete();
      this.game.loadLevel(levelIndex);
      this.updateRoomUI(roomState);
    });

    // Restart level
    this.socket.on('level-restarted', ({ roomState }) => {
      if (!this.game) return;
      this.game.loadLevel(roomState.levelIndex);
      this.updateRoomUI(roomState);
      this.game.addFloatingText(CANVAS_WIDTH / 2, 200, "Level Direset!", '#ffd700', 22);
    });

    // Emote sync
    this.socket.on('player-emote', ({ slot, emote }) => {
      if (this.game) {
        this.game.showEmote(slot, emote);
      }
    });
  }

  createPrivateRoom() {
    this.socket.emit('create-room', { isPublic: false }, (response) => {
      if (response && response.success) {
        this.onRoomConnected(response.code, response.slot, response.roomState);
      } else {
        alert('Gagal membuat room. Coba lagi.');
      }
    });
  }

  findPublicRoom() {
    this.socket.emit('find-public-room', (response) => {
      if (response && response.success) {
        this.onRoomConnected(response.code, response.slot, response.roomState);
      } else {
        alert('Gagal mencari room publik.');
      }
    });
  }

  joinRoom(code) {
    if (!code) {
      alert('Masukkan kode room terlebih dahulu!');
      return;
    }
    this.socket.emit('join-room', { code }, (response) => {
      if (response && response.success) {
        this.onRoomConnected(response.code, response.slot, response.roomState);
      } else {
        alert(response.error || 'Gagal bergabung ke room.');
      }
    });
  }

  onRoomConnected(code, slot, roomState) {
    this.roomCode = code;
    this.slot = slot;

    // Hide lobby modal
    const lobbyModal = document.getElementById('lobbyModal');
    if (lobbyModal) lobbyModal.classList.add('hidden');

    // Show in-game HUD
    const hud = document.getElementById('gameHud');
    if (hud) hud.classList.remove('hidden');

    // Setup URL query param so user can copy link
    const newUrl = `${window.location.origin}${window.location.pathname}?room=${code}`;
    window.history.replaceState({ path: newUrl }, '', newUrl);

    // Initialize game instance
    if (!this.game) {
      this.game = new window.GameEngine();
      this.game.setSlot(slot);
      this.game.loadLevel(roomState.levelIndex || 0);
      this.game.start();
    } else {
      this.game.setSlot(slot);
      this.game.loadLevel(roomState.levelIndex || 0);
    }

    this.updateRoomUI(roomState);

    // Start background music
    window.audioManager && window.audioManager.startBGM();
  }

  updateRoomUI(roomState) {
    const codeEl = document.getElementById('roomBadge');
    if (codeEl) codeEl.innerText = `Room: ${this.roomCode}`;

    const countEl = document.getElementById('playerCountBadge');
    if (countEl) {
      const count = roomState.players ? roomState.players.length : 1;
      countEl.innerText = `${count}/2 Pemain`;
      countEl.className = count === 2 ? 'badge badge-green' : 'badge badge-yellow';
    }

    const roleBadge = document.getElementById('roleBadge');
    if (roleBadge) {
      if (this.slot === 1) {
        roleBadge.innerText = 'Kamu: Bobi (Biru 💙)';
        roleBadge.style.color = '#00e5ff';
      } else {
        roleBadge.innerText = 'Kamu: Bona (Pink 💖)';
        roleBadge.style.color = '#ff3b77';
      }
    }

    if (this.game && roomState.players) {
      this.game.peerPlayer.connected = roomState.players.length === 2;
    }
  }

  emitPlayerUpdate(data) {
    this.socket.emit('player-update', data);
  }

  emitCreateBlock(blockData) {
    this.socket.emit('create-block', blockData);
  }

  emitClearBlocks() {
    this.socket.emit('clear-blocks');
  }

  emitCollectKey(keyId) {
    this.socket.emit('collect-key', { keyId });
  }

  emitPressButton(buttonId, isPressed) {
    this.socket.emit('press-button', { buttonId, isPressed });
  }

  emitDoorEnter(atDoor) {
    this.socket.emit('door-enter', { atDoor });
  }

  requestRestart() {
    this.socket.emit('restart-level');
  }

  sendEmote(emote) {
    this.socket.emit('send-emote', { emote });
    if (this.game) {
      this.game.showEmote(this.slot, emote);
    }
  }
}

window.networkManager = new NetworkManager();
