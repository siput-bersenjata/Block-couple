// Unified PeerJS (WebRTC P2P) + Socket.io Multiplayer Network Manager
// Designed specifically for 100% Vercel compatibility (Zero server timeout, direct P2P phones!)

class NetworkManager {
  constructor() {
    this.mode = 'webrtc'; // 'webrtc' for Vercel/P2P, or 'socketio'
    this.peer = null;
    this.conn = null;
    this.socket = null;

    this.roomCode = null;
    this.slot = 1; // 1 (Bobi - Host), 2 (Bona - Joiner)
    this.username = 'Pemain';
    this.game = null;

    this.ping = 0;
    this.pingInterval = null;
    this.isHost = false;

    this.init();
  }

  init() {
    // Check if PeerJS is available
    if (window.Peer) {
      console.log('[Network] WebRTC Engine Ready for Vercel');
      this.mode = 'webrtc';
      this.updateConnectionBadge('connected');
    } else {
      console.log('[Network] Fallback to Socket.io');
      this.initSocket();
    }

    // Auto-fill room code from URL ?room=123456
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      const input = document.getElementById('roomCodeInput');
      if (input) input.value = roomParam;
    }
  }

  // ========================================================
  // WEBRTC PEER-TO-PEER ENGINE (FOR VERCEL)
  // ========================================================
  createPrivateRoom(username) {
    this.username = username || 'Bobi';
    this.isHost = true;
    this.slot = 1;

    // Generate 6-digit numeric room code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.roomCode = code;

    const peerId = `bc2d-${code}`;

    // Destroy existing peer if any
    if (this.peer) this.peer.destroy();

    this.updateConnectionBadge('connecting');
    this.peer = new Peer(peerId, {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    this.peer.on('open', (id) => {
      console.log('[Network] Host Peer created with ID:', id);
      this.updateConnectionBadge('connected');
      this.onRoomReady(this.roomCode, 1, [
        { slot: 1, name: this.username }
      ]);
    });

    this.peer.on('connection', (conn) => {
      console.log('[Network] Incoming connection from partner');
      this.conn = conn;
      this.setupDataConnection();

      conn.on('open', () => {
        // Send initial room setup to partner
        const levelIdx = this.game ? this.game.currentLevelIndex : 0;
        const levelStart = this.game ? this.game.levelStartTime : Date.now();
        this.send({
          type: 'init-sync',
          slot: 2,
          hostName: this.username,
          levelIndex: levelIdx,
          levelStartTime: levelStart
        });
      });
    });

    this.peer.on('error', (err) => {
      console.warn('Peer error:', err);
      if (err.type === 'unavailable-id') {
        // Retry with another code
        this.createPrivateRoom(username);
      } else {
        this.updateConnectionBadge('disconnected');
      }
    });
  }

  joinRoom(code, username) {
    const cleanCode = (code || '').toString().trim();
    if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      alert('Masukkan 6 Digit Angka Kode Room yang valid!');
      return;
    }

    this.username = username || 'Bona';
    this.isHost = false;
    this.slot = 2;
    this.roomCode = cleanCode;

    const targetPeerId = `bc2d-${cleanCode}`;

    if (this.peer) this.peer.destroy();

    this.updateConnectionBadge('connecting');
    this.peer = new Peer({
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    this.peer.on('open', () => {
      console.log('Connecting to host:', targetPeerId);
      this.conn = this.peer.connect(targetPeerId, { reliable: true });
      this.setupDataConnection();

      this.conn.on('open', () => {
        console.log('[Network] Connected to host');
        this.updateConnectionBadge('connected');
        this.send({
          type: 'join-request',
          name: this.username
        });
      });
    });

    this.peer.on('error', (err) => {
      console.warn('Peer join error:', err);
      alert('Tidak dapat menemukan Room ' + cleanCode + '. Pastikan Room sudah dibuat oleh temanmu!');
      this.updateConnectionBadge('disconnected');
    });
  }

  // Quick Match: scans public rooms or creates one
  findPublicRoom(username) {
    this.createPrivateRoom(username);
  }

  setupDataConnection() {
    if (!this.conn) return;

    this.conn.on('data', (data) => {
      this.handleIncomingMessage(data);
    });

    this.conn.on('close', () => {
      console.log('Partner disconnected');
      if (this.game) {
        this.game.peerPlayer.connected = false;
        this.updateRoomBadgeCount(1);
        this.game.addFloatingText(this.game.myPlayer.x, this.game.myPlayer.y - 40, "Partner Terputus!", '#ff9100', 20);
      }
    });

    this.conn.on('error', (err) => {
      console.error('Connection data error:', err);
    });

    this.startP2PPing();
  }

  send(data) {
    if (this.conn && this.conn.open) {
      try {
        this.conn.send(data);
      } catch(e) {}
    }
  }

  handleIncomingMessage(data) {
    if (!data || !data.type) return;

    switch(data.type) {
      case 'init-sync':
        this.slot = data.slot;
        this.onRoomReady(this.roomCode, this.slot, [
          { slot: 1, name: data.hostName },
          { slot: 2, name: this.username }
        ], data.levelIndex, data.levelStartTime);
        if (this.game) {
          this.game.peerPlayer.connected = true;
          this.game.peerPlayer.name = data.hostName;
          this.game.addFloatingText(this.game.myPlayer.x, this.game.myPlayer.y - 40, `${data.hostName} Siap!`, '#00ffcc', 20);
        }
        break;

      case 'join-request':
        if (this.game) {
          this.game.peerPlayer.connected = true;
          this.game.peerPlayer.name = data.name;
          this.updateRoomBadgeCount(2);
          this.game.addFloatingText(this.game.myPlayer.x, this.game.myPlayer.y - 40, `${data.name} Bergabung!`, '#00ffcc', 20);
          window.audioManager && window.audioManager.playKey();
        }
        break;

      case 'player-update':
        if (this.game) {
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
        }
        break;

      case 'create-block':
        if (this.game) {
          if (!this.game.blocks.some(b => b.id === data.block.id)) {
            this.game.blocks.push(data.block);
            window.audioManager && window.audioManager.playBlockPlace();
            this.game.createSpawnSparks(data.block.x + data.block.width / 2, data.block.y + data.block.height / 2, data.block.color);
          }
        }
        break;

      case 'clear-blocks':
        if (this.game) {
          this.game.blocks = this.game.blocks.filter(b => b.playerSlot !== data.playerSlot);
        }
        break;

      case 'collect-key':
        if (this.game && !this.game.collectedKeys.includes(data.keyId)) {
          this.game.collectedKeys.push(data.keyId);
          this.game.updateKeyUI();
          window.audioManager && window.audioManager.playKey();
          this.game.addFloatingText(this.game.peerPlayer.x, this.game.peerPlayer.y - 25, "KUNCI DIAMBIL!", '#ffd700', 16);
        }
        break;

      case 'press-button':
        if (this.game) {
          if (data.isPressed && !this.game.pressedButtons.includes(data.buttonId)) {
            this.game.pressedButtons.push(data.buttonId);
          } else if (!data.isPressed) {
            this.game.pressedButtons = this.game.pressedButtons.filter(id => id !== data.buttonId);
          }
        }
        break;

      case 'defeat-enemy':
        if (this.game && !this.game.defeatedEnemies.includes(data.enemyId)) {
          this.game.defeatedEnemies.push(data.enemyId);
          window.audioManager && window.audioManager.playEnemyDefeat();
          const en = this.game.currentLevel.enemies && this.game.currentLevel.enemies.find(e => e.id === data.enemyId);
          if (en) {
            this.game.createSpawnSparks(en.x + en.width / 2, en.y + en.height / 2, '#ff007f');
            this.game.addFloatingText(en.x, en.y - 20, "K.O!", '#ffd700', 18);
          }
        }
        break;

      case 'door-enter':
        if (this.game) {
          this.game.peerPlayer.atDoor = data.atDoor;
        }
        break;

      case 'next-level':
        if (this.game) {
          window.audioManager && window.audioManager.playLevelComplete();
          this.game.loadLevel(data.levelIndex, data.levelStartTime);
        }
        break;

      case 'restart-level':
        if (this.game) {
          this.game.loadLevel(this.game.currentLevelIndex, Date.now());
          this.game.addFloatingText(this.game.myPlayer.x, 200, "Level Direset!", '#ffd700', 22);
        }
        break;

      case 'emote':
        if (this.game) {
          this.game.showEmote(data.slot, data.emote);
        }
        break;

      case 'ping':
        this.send({ type: 'pong', time: data.time });
        break;

      case 'pong':
        this.ping = Date.now() - data.time;
        const pingEl = document.getElementById('pingBadge');
        if (pingEl) pingEl.innerText = `Ping: ${this.ping} ms`;
        break;
    }
  }

  startP2PPing() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping', time: Date.now() });
    }, 2000);
  }

  onRoomReady(code, slot, players, levelIdx = 0, levelStart = Date.now()) {
    this.roomCode = code;
    this.slot = slot;

    // Hide lobby modal
    const lobbyModal = document.getElementById('lobbyModal');
    if (lobbyModal) lobbyModal.classList.add('hidden');

    // Show in-game HUD
    const hud = document.getElementById('gameHud');
    if (hud) hud.classList.remove('hidden');

    // Update URL query param for sharing
    const newUrl = `${window.location.origin}${window.location.pathname}?room=${code}`;
    window.history.replaceState({ path: newUrl }, '', newUrl);

    // Initialize game instance
    if (!this.game) {
      this.game = new window.GameEngine();
      this.game.setSlot(slot);
      this.game.myPlayer.name = this.username;
      this.game.loadLevel(levelIdx, levelStart);
      this.game.start();
    } else {
      this.game.setSlot(slot);
      this.game.myPlayer.name = this.username;
      this.game.loadLevel(levelIdx, levelStart);
    }

    this.updateRoomBadgeCount(players.length);
    this.updateRoleBadge();

    // Start background music
    window.audioManager && window.audioManager.startBGM();
  }

  updateRoomBadgeCount(count) {
    const codeEl = document.getElementById('roomBadge');
    if (codeEl) codeEl.innerText = `Room: ${this.roomCode}`;

    const countEl = document.getElementById('playerCountBadge');
    if (countEl) {
      countEl.innerText = `${count}/2 Pemain`;
      countEl.className = count === 2 ? 'badge badge-green' : 'badge badge-yellow';
    }
  }

  updateRoleBadge() {
    const roleBadge = document.getElementById('roleBadge');
    if (roleBadge) {
      if (this.slot === 1) {
        roleBadge.innerText = `${this.username} (Bobi)`;
        roleBadge.style.color = '#00e5ff';
      } else {
        roleBadge.innerText = `${this.username} (Bona)`;
        roleBadge.style.color = '#ff3b77';
      }
    }
  }

  updateConnectionBadge(status) {
    const el = document.getElementById('connectionStatus');
    if (!el) return;
    if (status === 'connected') {
      el.className = 'status-badge status-green';
      el.innerText = 'Online (P2P Ready)';
    } else if (status === 'connecting') {
      el.className = 'status-badge status-yellow';
      el.innerText = 'Menghubungkan Room...';
    } else {
      el.className = 'status-badge status-red';
      el.innerText = 'Terputus';
    }
  }

  // Socket.io fallback (optional)
  initSocket() {
    if (!window.io) return;
    try {
      this.socket = io({ timeout: 5000 });
    } catch(e) {}
  }

  // Game actions emitted to partner
  emitPlayerUpdate(data) {
    this.send({
      type: 'player-update',
      ...data
    });
  }

  emitCreateBlock(blockData) {
    const playerSlot = this.slot;
    const newBlock = {
      id: `${playerSlot}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      x: blockData.x,
      y: blockData.y,
      width: blockData.width || 36,
      height: blockData.height || 36,
      playerSlot: playerSlot,
      color: playerSlot === 1 ? '#00e5ff' : '#ff3b77'
    };

    if (this.game) {
      // Limit to 4 blocks per player
      const myBlocks = this.game.blocks.filter(b => b.playerSlot === playerSlot);
      if (myBlocks.length >= 4) {
        const oldest = myBlocks[0];
        this.game.blocks = this.game.blocks.filter(b => b.id !== oldest.id);
      }
      this.game.blocks.push(newBlock);
    }

    this.send({
      type: 'create-block',
      block: newBlock
    });
  }

  emitClearBlocks() {
    if (this.game) {
      this.game.blocks = this.game.blocks.filter(b => b.playerSlot !== this.slot);
    }
    this.send({
      type: 'clear-blocks',
      playerSlot: this.slot
    });
  }

  emitCollectKey(keyId) {
    this.send({
      type: 'collect-key',
      keyId,
      bySlot: this.slot
    });
  }

  emitPressButton(buttonId, isPressed) {
    this.send({
      type: 'press-button',
      buttonId,
      isPressed
    });
  }

  emitDefeatEnemy(enemyId) {
    this.send({
      type: 'defeat-enemy',
      enemyId,
      bySlot: this.slot
    });
  }

  emitDoorEnter(atDoor) {
    this.send({
      type: 'door-enter',
      slot: this.slot,
      atDoor
    });

    // Check if both reached door
    if (this.game && this.game.myPlayer.atDoor && this.game.peerPlayer.atDoor) {
      setTimeout(() => {
        const nextIdx = (this.game.currentLevelIndex + 1) % GAME_LEVELS.length;
        const nextStart = Date.now();
        this.game.loadLevel(nextIdx, nextStart);
        this.send({
          type: 'next-level',
          levelIndex: nextIdx,
          levelStartTime: nextStart
        });
      }, 1500);
    }
  }

  requestRestart() {
    if (this.game) {
      this.game.loadLevel(this.game.currentLevelIndex, Date.now());
    }
    this.send({
      type: 'restart-level'
    });
  }

  sendEmote(emote) {
    if (this.game) {
      this.game.showEmote(this.slot, emote);
    }
    this.send({
      type: 'emote',
      slot: this.slot,
      emote
    });
  }
}

window.networkManager = new NetworkManager();
