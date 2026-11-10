// Socket.io Multiplayer Networking Manager
// Supports 6-Digit Room Codes, Username Creation, Ping Health Monitor & Sync

class NetworkManager {
  constructor() {
    this.socket = null;
    this.roomCode = null;
    this.slot = 1;
    this.username = 'Pemain';
    this.game = null;
    this.ping = 0;
    this.pingInterval = null;

    this.initSocket();
  }

  initSocket() {
    this.socket = io({
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to server with id:', this.socket.id);
      this.updateConnectionBadge('connected');
      this.startPingMonitor();

      // Check if URL has ?room=123456
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get('room');
      if (roomParam) {
        const input = document.getElementById('roomCodeInput');
        if (input) input.value = roomParam;
      }
    });

    this.socket.on('disconnect', () => {
      console.warn('⚠️ Disconnected from server');
      this.updateConnectionBadge('disconnected');
    });

    this.socket.on('reconnecting', () => {
      this.updateConnectionBadge('connecting');
    });

    // Room created / joined handlers
    this.socket.on('player-joined', ({ slot, name, roomState }) => {
      console.log(`[Event] Player joined: Slot ${slot} (${name})`);
      if (this.game) {
        this.game.peerPlayer.connected = true;
        this.game.peerPlayer.name = name;
        this.updateRoomUI(roomState);
        this.game.addFloatingText(this.game.myPlayer.x, this.game.myPlayer.y - 40, `${name} Telah Bergabung! 💕`, '#00ffcc', 20);
        window.audioManager && window.audioManager.playKey();
      }
    });

    this.socket.on('player-left', ({ slot, roomState }) => {
      console.log(`[Event] Player left: Slot ${slot}`);
      if (this.game) {
        this.game.peerPlayer.connected = false;
        this.updateRoomUI(roomState);
        this.game.addFloatingText(this.game.myPlayer.x, this.game.myPlayer.y - 40, "Partner Terputus! Menunggu... ⏳", '#ff9100', 20);
      }
    });

    // Peer position & animation sync
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
      peer.tilt = data.tilt || 0;
      peer.squashX = data.squashX || 1;
      peer.squashY = data.squashY || 1;
      peer.expression = data.expression || 'idle';
    });

    // Block sync
    this.socket.on('block-created', (newBlock) => {
      if (!this.game) return;
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

    // Defeated enemy sync
    this.socket.on('enemy-defeated', ({ enemyId, bySlot }) => {
      if (!this.game) return;
      if (!this.game.defeatedEnemies.includes(enemyId)) {
        this.game.defeatedEnemies.push(enemyId);
        window.audioManager && window.audioManager.playEnemyDefeat();
        const en = this.game.currentLevel.enemies && this.game.currentLevel.enemies.find(e => e.id === enemyId);
        if (en) {
          this.game.createSpawnSparks(en.x + en.width / 2, en.y + en.height / 2, '#ff007f');
          this.game.addFloatingText(en.x, en.y - 20, "K.O! ⭐", '#ffd700', 18);
        }
      }
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
      this.game.loadLevel(levelIndex, roomState.levelStartTime);
      this.updateRoomUI(roomState);
    });

    // Restart level
    this.socket.on('level-restarted', ({ roomState }) => {
      if (!this.game) return;
      this.game.loadLevel(roomState.levelIndex, roomState.levelStartTime);
      this.updateRoomUI(roomState);
      this.game.addFloatingText(this.game.myPlayer.x, 200, "Level Direset!", '#ffd700', 22);
    });

    // Emote sync
    this.socket.on('player-emote', ({ slot, emote }) => {
      if (this.game) {
        this.game.showEmote(slot, emote);
      }
    });
  }

  startPingMonitor() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (!this.socket.connected) return;
      const start = Date.now();
      this.socket.emit('client-ping', start, (clientTime) => {
        this.ping = Date.now() - clientTime;
        const pingEl = document.getElementById('pingBadge');
        if (pingEl) {
          pingEl.innerText = `📶 ${this.ping} ms`;
        }
      });
    }, 2500);
  }

  updateConnectionBadge(status) {
    const el = document.getElementById('connectionStatus');
    if (!el) return;
    if (status === 'connected') {
      el.className = 'status-badge status-green';
      el.innerText = '🟢 Terkoneksi';
    } else if (status === 'connecting') {
      el.className = 'status-badge status-yellow';
      el.innerText = '🟡 Menghubungkan...';
    } else {
      el.className = 'status-badge status-red';
      el.innerText = '🔴 Terputus';
    }
  }

  createPrivateRoom(username) {
    this.username = username || 'Bobi';
    this.socket.emit('create-room', { isPublic: false, username: this.username }, (response) => {
      if (response && response.success) {
        this.onRoomConnected(response.code, response.slot, response.roomState);
      } else {
        alert('Gagal membuat room. Periksa koneksi internet Anda.');
      }
    });
  }

  findPublicRoom(username) {
    this.username = username || 'Pemain';
    this.socket.emit('find-public-room', { username: this.username }, (response) => {
      if (response && response.success) {
        this.onRoomConnected(response.code, response.slot, response.roomState);
      } else {
        alert('Gagal mencari room publik.');
      }
    });
  }

  joinRoom(code, username) {
    const cleanCode = (code || '').toString().trim();
    if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      alert('Masukkan 6 Digit Angka Kode Room yang valid!');
      return;
    }
    this.username = username || 'Pemain';
    this.socket.emit('join-room', { code: cleanCode, username: this.username }, (response) => {
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

    // Update URL query param so user can copy link
    const newUrl = `${window.location.origin}${window.location.pathname}?room=${code}`;
    window.history.replaceState({ path: newUrl }, '', newUrl);

    // Initialize game instance
    if (!this.game) {
      this.game = new window.GameEngine();
      this.game.setSlot(slot);
      this.game.myPlayer.name = this.username;
      this.game.loadLevel(roomState.levelIndex || 0, roomState.levelStartTime);
      this.game.start();
    } else {
      this.game.setSlot(slot);
      this.game.myPlayer.name = this.username;
      this.game.loadLevel(roomState.levelIndex || 0, roomState.levelStartTime);
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
        roleBadge.innerText = `${this.username} (Bobi 💙)`;
        roleBadge.style.color = '#00e5ff';
      } else {
        roleBadge.innerText = `${this.username} (Bona 💖)`;
        roleBadge.style.color = '#ff3b77';
      }
    }

    if (this.game && roomState.players) {
      this.game.peerPlayer.connected = roomState.players.length === 2;
      const other = roomState.players.find(p => p.slot !== this.slot);
      if (other) {
        this.game.peerPlayer.name = other.name;
      }
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

  emitDefeatEnemy(enemyId) {
    this.socket.emit('defeat-enemy', { enemyId });
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
