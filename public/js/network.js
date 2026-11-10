// Unified PeerJS (WebRTC P2P) Multiplayer & Matchmaking Engine
// Designed for 100% Vercel Serverless & Direct Phone-to-Phone WebRTC P2P

class NetworkManager {
  constructor() {
    this.mode = 'webrtc';
    this.peer = null;
    this.conn = null;

    this.roomCode = null;
    this.slot = 1; // 1 (Bobi - Host), 2 (Bona - Joiner)
    this.username = 'Pemain';
    this.game = null;

    this.ping = 0;
    this.pingInterval = null;
    this.isHost = false;
    this.isPublic = false;

    // Matchmaking timer & state
    this.matchmakingTimer = null;
    this.matchmakingSecondsLeft = 60;
    this.matchmakingProbePeer = null;

    // Reconnection handling
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 6;
    this.reconnectTimer = null;

    // Co-op Exit vote timer & state (5-second mutual agreement)
    this.exitVoteTimer = null;
    this.exitVoteSecondsLeft = 5;
    this.exitVoteActive = false;

    this.init();
  }

  init() {
    if (window.Peer) {
      console.log('[Network] WebRTC Engine Ready for Vercel');
      this.mode = 'webrtc';
      this.updateConnectionBadge('connected');
    }

    // Start real-time presence heartbeat to track actual active users
    this.startPresenceHeartbeat();

    // Auto-fill room code from URL ?room=123456
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      const input = document.getElementById('roomCodeInput');
      if (input) input.value = roomParam;
    }
  }

  // Real-time server presence & match statistics tracker
  startPresenceHeartbeat() {
    let deviceId = localStorage.getItem('bc_device_id');
    if (!deviceId) {
      deviceId = 'usr_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
      localStorage.setItem('bc_device_id', deviceId);
    }
    // Also save in cookie for cross-context
    document.cookie = `bc_device_id=${deviceId}; path=/; max-age=86400`;

    const sendHeartbeat = () => {
      fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: deviceId })
      })
      .then(r => r.json())
      .then(data => {
        if (data) {
          this.updateLobbyLiveStats(data.activeUsers, data.gamesPlayed);
        }
      })
      .catch(() => {});
    };

    sendHeartbeat();
    setInterval(sendHeartbeat, 12000);
  }

  updateLobbyLiveStats(activeUsers, gamesPlayed) {
    const userEl = document.getElementById('activeUsersCount');
    if (userEl) userEl.innerText = `${activeUsers} Pemain Aktif`;
    const gameEl = document.getElementById('gamesPlayedCount');
    if (gameEl) gameEl.innerText = `${gamesPlayed} Game Selesai`;
  }

  // ========================================================
  // SESSION PERSISTENCE & AUTO-RECONNECT ON ACCIDENTAL REFRESH
  // ========================================================
  saveLastPosition(x, y, levelIndex) {
    try {
      sessionStorage.setItem('bc_player_pos', JSON.stringify({
        x: Math.round(x),
        y: Math.round(y),
        levelIndex: levelIndex,
        roomCode: this.roomCode
      }));
    } catch(e) {}
  }

  getLastSavedPosition() {
    try {
      const raw = sessionStorage.getItem('bc_player_pos');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.roomCode === this.roomCode || !this.roomCode) && typeof parsed.x === 'number') {
        return parsed;
      }
    } catch(e) {}
    return null;
  }

  saveSession(levelIndex = 0) {
    try {
      const sessionData = {
        roomCode: this.roomCode,
        isHost: this.isHost,
        slot: this.slot,
        username: this.username,
        levelIndex: levelIndex,
        isPublic: this.isPublic,
        timestamp: Date.now()
      };
      sessionStorage.setItem('bc_session', JSON.stringify(sessionData));
    } catch (e) {
      console.warn('Failed to save session:', e);
    }
  }

  clearSession() {
    try {
      sessionStorage.removeItem('bc_session');
    } catch (e) {}
  }

  getSession() {
    try {
      const raw = sessionStorage.getItem('bc_session');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Valid if less than 6 hours old
      if (Date.now() - parsed.timestamp < 6 * 3600 * 1000) {
        return parsed;
      }
      this.clearSession();
      return null;
    } catch (e) {
      return null;
    }
  }

  tryAutoResume() {
    const session = this.getSession();
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');

    // If there is an active session and either matches URL room or has roomCode
    if (session && session.roomCode) {
      const targetRoom = (roomParam && roomParam === session.roomCode) ? roomParam : session.roomCode;
      console.log('[Network] Resuming active session from refresh:', session);

      this.username = session.username || 'Pemain';
      this.roomCode = targetRoom;
      this.isHost = session.isHost;
      this.slot = session.slot;
      this.isPublic = !!session.isPublic;

      const savedPos = this.getLastSavedPosition();

      if (this.isHost) {
        this.resumeAsHost(targetRoom, this.username, session.levelIndex || 0, savedPos);
      } else {
        this.joinRoom(targetRoom, this.username, true, session.levelIndex || 0, savedPos);
      }
      return true;
    }
    return false;
  }

  // ========================================================
  // HOST CREATION & RECREATION
  // ========================================================
  createPrivateRoom(username) {
    this.username = username || 'Bobi';
    this.isHost = true;
    this.isPublic = false;
    this.slot = 1;

    // Generate random 6-digit numeric room code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.roomCode = code;

    this.startHostPeer(`bc2d-${code}`, 0, null);
  }

  resumeAsHost(roomCode, username, levelIdx = 0, restorePos = null) {
    this.username = username || 'Bobi';
    this.isHost = true;
    this.roomCode = roomCode;
    this.slot = 1;

    console.log('[Network] Re-hosting room after refresh at last position:', roomCode, restorePos);
    this.startHostPeer(`bc2d-${roomCode}`, levelIdx, restorePos);
  }

  startHostPeer(peerId, startLevelIdx = 0, restorePos = null) {
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
      console.log('[Network] Host Peer active with ID:', id);
      this.updateConnectionBadge('connected');
      this.onRoomReady(this.roomCode, 1, [
        { slot: 1, name: this.username }
      ], startLevelIdx, Date.now(), restorePos);
      this.saveSession(startLevelIdx);
    });

    this.peer.on('connection', (conn) => {
      console.log('[Network] Partner connected to host');
      this.conn = conn;
      this.setupDataConnection();

      conn.on('open', () => {
        const levelIdx = this.game ? this.game.currentLevelIndex : startLevelIdx;
        const levelStart = this.game ? this.game.levelStartTime : Date.now();
        this.send({
          type: 'init-sync',
          slot: 2,
          hostName: this.username,
          levelIndex: levelIdx,
          levelStartTime: levelStart,
          hostX: this.game ? this.game.myPlayer.x : null,
          hostY: this.game ? this.game.myPlayer.y : null,
          keys: this.game ? this.game.collectedKeys : []
        });
      });
    });

    this.peer.on('error', (err) => {
      console.warn('Host Peer error:', err);
      if (err.type === 'unavailable-id') {
        if (!this.isPublic) {
          // If collision on private code, create a new random one
          this.createPrivateRoom(this.username);
        }
      } else {
        this.updateConnectionBadge('disconnected');
      }
    });
  }

  // ========================================================
  // JOIN ROOM (PRIVATE OR PUBLIC)
  // ========================================================
  joinRoom(code, username, isResume = false, initialLevelIdx = 0, restorePos = null) {
    const cleanCode = (code || '').toString().trim();
    if (!cleanCode) {
      alert('Masukkan Kode Room yang valid!');
      return;
    }

    this.username = username || 'Bona';
    this.isHost = false;
    this.slot = 2;
    this.roomCode = cleanCode;

    const targetPeerId = cleanCode.startsWith('bc2d-') ? cleanCode : `bc2d-${cleanCode}`;

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
      console.log('[Network] Client Peer connected to STUN. Now reaching host:', targetPeerId);
      this.conn = this.peer.connect(targetPeerId, { reliable: true });
      this.setupDataConnection();

      this.conn.on('open', () => {
        console.log('[Network] Connected to host!');
        this.updateConnectionBadge('connected');
        
        const myX = restorePos ? restorePos.x : (this.game ? this.game.myPlayer.x : null);
        const myY = restorePos ? restorePos.y : (this.game ? this.game.myPlayer.y : null);

        this.send({
          type: 'join-request',
          name: this.username,
          joinerX: myX,
          joinerY: myY
        });

        // If resuming on refresh, ready immediately at last position
        if (isResume) {
          this.onRoomReady(this.roomCode, 2, [
            { slot: 1, name: 'Bobi' },
            { slot: 2, name: this.username }
          ], initialLevelIdx, Date.now(), restorePos);
        }
        this.saveSession(initialLevelIdx);
      });
    });

    this.peer.on('error', (err) => {
      console.warn('Peer join error:', err);
      if (!isResume) {
        alert('Tidak dapat menemukan Room ' + cleanCode + '. Pastikan Room sudah dibuat dan aktif!');
      }
      this.updateConnectionBadge('disconnected');
    });
  }

  // ========================================================
  // PUBLIC MATCHMAKING SYSTEM (60-SECOND QUEUE WITH TIMEOUT MODAL)
  // ========================================================
  startPublicMatchmaking(username) {
    this.username = username || 'Pemain ' + Math.floor(10 + Math.random() * 89);
    this.isPublic = true;

    // Reset UI & open Matchmaking Modal
    const lobbyModal = document.getElementById('lobbyModal');
    if (lobbyModal) lobbyModal.classList.add('hidden');

    const timeoutModal = document.getElementById('matchTimeoutModal');
    if (timeoutModal) timeoutModal.classList.add('hidden');

    const mmModal = document.getElementById('matchmakingModal');
    if (mmModal) mmModal.classList.remove('hidden');

    const statusText = document.getElementById('matchmakingStatusText');
    if (statusText) statusText.innerText = 'Menghubungkan ke server antrean publik...';

    // Start 60-second countdown
    this.matchmakingSecondsLeft = 60;
    this.updateMatchmakingTimerUI();

    if (this.matchmakingTimer) clearInterval(this.matchmakingTimer);
    this.matchmakingTimer = setInterval(() => {
      this.matchmakingSecondsLeft--;
      this.updateMatchmakingTimerUI();

      if (this.matchmakingSecondsLeft <= 0) {
        this.handleMatchmakingTimeout();
      }
    }, 1000);

    // Step 1: Probe public lobby 'bc2d-pub-lobby-1' as a joiner
    this.probePublicLobby();
  }

  updateMatchmakingTimerUI() {
    const timerEl = document.getElementById('matchmakingTimer');
    if (timerEl) {
      const sec = this.matchmakingSecondsLeft;
      const formatted = sec < 10 ? `0${sec}` : `${sec}`;
      timerEl.innerText = `00:${formatted}`;
    }
  }

  probePublicLobby() {
    const publicRoomId = 'bc2d-pub-lobby-1';
    let hasConnected = false;

    if (this.matchmakingProbePeer) {
      this.matchmakingProbePeer.destroy();
      this.matchmakingProbePeer = null;
    }

    const probe = new Peer({
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });
    this.matchmakingProbePeer = probe;

    const probeTimeout = setTimeout(() => {
      if (!hasConnected && this.matchmakingProbePeer === probe) {
        console.log('[Matchmaking] No public host found. Becoming public host...');
        probe.destroy();
        this.hostPublicLobby(publicRoomId);
      }
    }, 2800);

    probe.on('open', () => {
      console.log('[Matchmaking] Probe peer ready. Trying to connect to existing public host:', publicRoomId);
      const conn = probe.connect(publicRoomId, { reliable: true });

      conn.on('open', () => {
        hasConnected = true;
        clearTimeout(probeTimeout);
        console.log('[Matchmaking] Found active public host! Joining as Player 2...');

        // Transition probe to active connection
        this.stopMatchmakingTimer();
        this.hideMatchmakingModal();

        this.peer = probe;
        this.conn = conn;
        this.matchmakingProbePeer = null;

        this.isHost = false;
        this.slot = 2;
        this.roomCode = 'Publik 1';

        this.setupDataConnection();
        this.send({
          type: 'join-request',
          name: this.username
        });
      });

      conn.on('error', () => {
        if (!hasConnected) {
          clearTimeout(probeTimeout);
          probe.destroy();
          this.hostPublicLobby(publicRoomId);
        }
      });
    });

    probe.on('error', () => {
      if (!hasConnected) {
        clearTimeout(probeTimeout);
        probe.destroy();
        this.hostPublicLobby(publicRoomId);
      }
    });
  }

  hostPublicLobby(publicRoomId) {
    if (this.matchmakingSecondsLeft <= 0) return;

    const statusText = document.getElementById('matchmakingStatusText');
    if (statusText) statusText.innerText = 'Menunggu pemain publik lain bergabung...';

    if (this.peer) this.peer.destroy();

    this.peer = new Peer(publicRoomId, {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    this.peer.on('open', () => {
      console.log('[Matchmaking] Public host established on', publicRoomId);
      this.isHost = true;
      this.slot = 1;
      this.roomCode = 'Publik 1';
    });

    this.peer.on('connection', (conn) => {
      console.log('[Matchmaking] Player 2 joined public lobby!');
      this.stopMatchmakingTimer();
      this.hideMatchmakingModal();

      this.conn = conn;
      this.setupDataConnection();

      conn.on('open', () => {
        this.onRoomReady(this.roomCode, 1, [
          { slot: 1, name: this.username }
        ], 0);

        this.send({
          type: 'init-sync',
          slot: 2,
          hostName: this.username,
          levelIndex: 0,
          levelStartTime: Date.now()
        });
      });
    });

    this.peer.on('error', (err) => {
      console.warn('[Matchmaking] Public host peer error:', err);
      if (err.type === 'unavailable-id') {
        // Someone occupied pub-lobby-1 just now; retry probe
        setTimeout(() => {
          if (this.matchmakingSecondsLeft > 2) this.probePublicLobby();
        }, 1000);
      }
    });
  }

  handleMatchmakingTimeout() {
    console.log('[Matchmaking] 60-second timeout reached. No players found.');
    this.stopMatchmakingTimer();
    this.cancelMatchmakingPeers();
    this.hideMatchmakingModal();

    // Show User-Requested Timeout Modal
    const timeoutModal = document.getElementById('matchTimeoutModal');
    if (timeoutModal) timeoutModal.classList.remove('hidden');
  }

  stopMatchmakingTimer() {
    if (this.matchmakingTimer) {
      clearInterval(this.matchmakingTimer);
      this.matchmakingTimer = null;
    }
  }

  cancelMatchmakingPeers() {
    if (this.matchmakingProbePeer) {
      this.matchmakingProbePeer.destroy();
      this.matchmakingProbePeer = null;
    }
    if (this.isPublic && this.isHost && (!this.conn || !this.conn.open)) {
      if (this.peer) {
        this.peer.destroy();
        this.peer = null;
      }
    }
  }

  cancelMatchmaking() {
    this.stopMatchmakingTimer();
    this.cancelMatchmakingPeers();
    this.hideMatchmakingModal();

    const lobbyModal = document.getElementById('lobbyModal');
    if (lobbyModal) lobbyModal.classList.remove('hidden');
  }

  hideMatchmakingModal() {
    const mmModal = document.getElementById('matchmakingModal');
    if (mmModal) mmModal.classList.add('hidden');
  }

  // ========================================================
  // DATA CONNECTION & MESSAGING
  // ========================================================
  setupDataConnection() {
    if (!this.conn) return;

    this.conn.on('data', (data) => {
      this.handleIncomingMessage(data);
    });

    this.conn.on('close', () => {
      console.log('[Network] Partner disconnected');
      if (this.game) {
        this.game.peerPlayer.connected = false;
        this.updateRoomBadgeCount(1);
        this.game.addFloatingText(this.game.myPlayer.x, this.game.myPlayer.y - 40, "Partner Terputus!", '#ff9100', 20);

        // Client auto-reconnect attempt if unexpected drop
        if (!this.isHost && this.roomCode && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptClientReconnect();
        }
      }
    });

    this.conn.on('error', (err) => {
      console.error('[Network] Connection data error:', err);
    });

    this.startP2PPing();
  }

  attemptClientReconnect() {
    this.reconnectAttempts++;
    console.log(`[Network] Auto-reconnecting to host (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.peer && this.roomCode) {
        const targetPeerId = this.roomCode.startsWith('bc2d-') ? this.roomCode : `bc2d-${this.roomCode}`;
        this.conn = this.peer.connect(targetPeerId, { reliable: true });
        this.setupDataConnection();

        this.conn.on('open', () => {
          console.log('[Network] Reconnected to host successfully!');
          this.reconnectAttempts = 0;
          this.send({
            type: 'join-request',
            name: this.username
          });
        });
      }
    }, 2000);
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
        const mySavedPos = this.getLastSavedPosition();
        if (mySavedPos && data.hostX) {
          mySavedPos.peerX = data.hostX;
          mySavedPos.peerY = data.hostY;
        }

        this.onRoomReady(this.roomCode, this.slot, [
          { slot: 1, name: data.hostName },
          { slot: 2, name: this.username }
        ], data.levelIndex, data.levelStartTime, mySavedPos);

        this.saveSession(data.levelIndex);

        if (this.game) {
          this.game.peerPlayer.connected = true;
          this.game.peerPlayer.name = data.hostName;
          if (typeof data.hostX === 'number') {
            this.game.peerPlayer.x = data.hostX;
            this.game.peerPlayer.y = data.hostY;
            this.game.peerPlayer.targetX = data.hostX;
            this.game.peerPlayer.targetY = data.hostY;
          }
          if (data.keys && Array.isArray(data.keys)) {
            this.game.collectedKeys = data.keys;
            this.game.updateKeyUI();
          }
          this.game.addFloatingText(this.game.myPlayer.x, this.game.myPlayer.y - 40, `${data.hostName} Siap!`, '#00ffcc', 20);
        }
        break;

      case 'join-request':
        if (this.game) {
          this.game.peerPlayer.connected = true;
          this.game.peerPlayer.name = data.name;
          if (typeof data.joinerX === 'number' && typeof data.joinerY === 'number') {
            this.game.peerPlayer.x = data.joinerX;
            this.game.peerPlayer.y = data.joinerY;
            this.game.peerPlayer.targetX = data.joinerX;
            this.game.peerPlayer.targetY = data.joinerY;
          }
          this.updateRoomBadgeCount(2);
          this.game.addFloatingText(this.game.myPlayer.x, this.game.myPlayer.y - 40, `${data.name} Bergabung!`, '#00ffcc', 20);
          window.audioManager && window.audioManager.playKey();

          // Sync current level index, host coordinates, and keys to newly joined partner
          this.send({
            type: 'init-sync',
            slot: 2,
            hostName: this.username,
            levelIndex: this.game.currentLevelIndex,
            levelStartTime: this.game.levelStartTime,
            hostX: this.game.myPlayer.x,
            hostY: this.game.myPlayer.y,
            keys: this.game.collectedKeys
          });
        }
        break;

      case 'player-update':
        if (this.game) {
          const peer = this.game.peerPlayer;
          peer.connected = true;
          peer.targetX = data.x;
          peer.targetY = data.y;
          peer.targetVx = data.vx;
          peer.targetVy = data.vy;
          peer.vx = data.vx;
          peer.vy = data.vy;
          peer.facing = data.facing;
          peer.isGrounded = data.isGrounded;
          peer.targetTilt = data.tilt || 0;
          peer.targetSquashX = data.squashX || 1;
          peer.targetSquashY = data.squashY || 1;
          peer.expression = data.expression || 'idle';
          peer.walkTime = data.walkTime || 0;

          // If jump takeoff detected on partner, trigger jump dust
          if (data.vy < -2.5 && (peer.lastVy === undefined || peer.lastVy >= -0.5)) {
            this.game.createDust(data.x + 16, data.y + 32);
          }
          // If landing detected on partner, trigger landing dust
          if (data.isGrounded && peer.lastGrounded === false && peer.lastVy > 1.5) {
            this.game.createDust(data.x + 16, data.y + 32);
          }
          peer.lastVy = data.vy;
          peer.lastGrounded = data.isGrounded;
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
          this.saveSession(data.levelIndex);
        }
        break;

      case 'restart-level':
        if (this.game) {
          this.game.loadLevel(this.game.currentLevelIndex, Date.now());
          this.game.addFloatingText(this.game.myPlayer.x, 200, "Level Direset!", '#ffd700', 22);
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

      case 'exit-vote-request':
        this.handleExitVoteRequest(data.sender);
        break;

      case 'exit-vote-agreed':
        this.handleExitVoteAgreed();
        break;

      case 'exit-vote-declined':
        this.handleExitVoteDeclined();
        break;

      case 'exit-vote-cancelled':
        this.handleExitVoteCancelled();
        break;
    }
  }

  startP2PPing() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping', time: Date.now() });
    }, 2000);
  }

  // ========================================================
  // ROOM READY & GAME TRANSITION
  // ========================================================
  onRoomReady(code, slot, players, levelIdx = 0, levelStart = Date.now(), restorePos = null) {
    this.roomCode = code;
    this.slot = slot;

    // Hide all modals
    const lobbyModal = document.getElementById('lobbyModal');
    if (lobbyModal) lobbyModal.classList.add('hidden');

    this.hideMatchmakingModal();
    const timeoutModal = document.getElementById('matchTimeoutModal');
    if (timeoutModal) timeoutModal.classList.add('hidden');

    // Show in-game HUD
    const hud = document.getElementById('gameHud');
    if (hud) hud.classList.remove('hidden');

    // Update URL query param for sharing
    if (!this.isPublic) {
      const newUrl = `${window.location.origin}${window.location.pathname}?room=${code}`;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }

    // Save session so accidental refresh resumes in-game
    this.saveSession(levelIdx);

    // Initialize or re-attach game instance with position restoration
    if (!this.game) {
      this.game = new window.GameEngine();
      this.game.setSlot(slot);
      this.game.myPlayer.name = this.username;
      this.game.loadLevel(levelIdx, levelStart, restorePos);
      this.game.start();
    } else {
      this.game.setSlot(slot);
      this.game.myPlayer.name = this.username;
      this.game.loadLevel(levelIdx, levelStart, restorePos);
    }

    this.updateRoomBadgeCount(players.length);
    this.updateRoleBadge();

    // Start background music
    window.audioManager && window.audioManager.startBGM();
  }

  // ========================================================
  // CO-OP EXIT VOTE SYSTEM (5 SECONDS MUTUAL AGREEMENT)
  // ========================================================
  requestExitVote() {
    const isCoopConnected = this.game && this.game.peerPlayer && this.game.peerPlayer.connected && this.conn && this.conn.open;
    if (!isCoopConnected) {
      if (confirm('Keluar dari Room dan kembali ke Beranda?')) {
        this.leaveRoom();
      }
      return;
    }

    if (this.exitVoteTimer) clearInterval(this.exitVoteTimer);
    this.exitVoteActive = true;
    this.exitVoteSecondsLeft = 5;

    this.send({
      type: 'exit-vote-request',
      sender: this.username
    });

    const modal = document.getElementById('exitVoteModal');
    const senderView = document.getElementById('exitVoteSenderView');
    const receiverView = document.getElementById('exitVoteReceiverView');
    const senderDesc = document.getElementById('exitVoteSenderText');
    const timerLabel = document.getElementById('exitVoteSenderTimer');
    const progressBar = document.getElementById('exitVoteSenderProgress');

    if (modal && senderView && receiverView) {
      senderView.classList.remove('hidden');
      receiverView.classList.add('hidden');
      modal.classList.remove('hidden');

      const partnerName = (this.game && this.game.peerPlayer && this.game.peerPlayer.name) ? this.game.peerPlayer.name : 'Partner';
      if (senderDesc) senderDesc.innerText = `Menunggu persetujuan ${partnerName} untuk keluar...`;
      if (timerLabel) timerLabel.innerText = '5s';
      if (progressBar) {
        progressBar.style.transition = 'none';
        progressBar.style.width = '100%';
        setTimeout(() => {
          if (progressBar) {
            progressBar.style.transition = 'width 5s linear';
            progressBar.style.width = '0%';
          }
        }, 30);
      }
    }

    this.exitVoteTimer = setInterval(() => {
      this.exitVoteSecondsLeft--;
      if (timerLabel) timerLabel.innerText = `${this.exitVoteSecondsLeft}s`;
      if (this.exitVoteSecondsLeft <= 0) {
        this.finishExitVoteTimeout();
      }
    }, 1000);
  }

  handleExitVoteRequest(senderName) {
    if (this.exitVoteTimer) clearInterval(this.exitVoteTimer);
    this.exitVoteActive = true;
    this.exitVoteSecondsLeft = 5;

    const modal = document.getElementById('exitVoteModal');
    const senderView = document.getElementById('exitVoteSenderView');
    const receiverView = document.getElementById('exitVoteReceiverView');
    const receiverDesc = document.getElementById('exitVoteReceiverText');
    const timerLabel = document.getElementById('exitVoteReceiverTimer');
    const progressBar = document.getElementById('exitVoteReceiverProgress');

    if (modal && senderView && receiverView) {
      senderView.classList.add('hidden');
      receiverView.classList.remove('hidden');
      modal.classList.remove('hidden');

      if (receiverDesc) {
        receiverDesc.innerText = `${senderName || 'Partner'} mengajak keluar ke Beranda Katalog Game.`;
      }
      if (timerLabel) timerLabel.innerText = '5s';
      if (progressBar) {
        progressBar.style.transition = 'none';
        progressBar.style.width = '100%';
        setTimeout(() => {
          if (progressBar) {
            progressBar.style.transition = 'width 5s linear';
            progressBar.style.width = '0%';
          }
        }, 30);
      }
    }

    this.exitVoteTimer = setInterval(() => {
      this.exitVoteSecondsLeft--;
      if (timerLabel) timerLabel.innerText = `${this.exitVoteSecondsLeft}s`;
      if (this.exitVoteSecondsLeft <= 0) {
        this.finishExitVoteTimeout();
      }
    }, 1000);
  }

  acceptExitVote() {
    this.send({ type: 'exit-vote-agreed' });
    this.closeExitVoteModal();
    this.leaveRoom();
    this.showToast('Kedua pemain setuju keluar ke Beranda');
  }

  handleExitVoteAgreed() {
    this.closeExitVoteModal();
    this.leaveRoom();
    this.showToast('Kedua pemain setuju keluar ke Beranda');
  }

  declineExitVote() {
    this.send({ type: 'exit-vote-declined' });
    this.closeExitVoteModal();
    this.showToast('Kamu memilih tetap bermain');
  }

  handleExitVoteDeclined() {
    this.closeExitVoteModal();
    const partnerName = (this.game && this.game.peerPlayer && this.game.peerPlayer.name) ? this.game.peerPlayer.name : 'Partner';
    this.showToast(`${partnerName} memilih untuk tetap bermain`);
  }

  cancelExitVote() {
    this.send({ type: 'exit-vote-cancelled' });
    this.closeExitVoteModal();
    this.showToast('Ajakan keluar dibatalkan');
  }

  handleExitVoteCancelled() {
    this.closeExitVoteModal();
    this.showToast('Ajakan keluar dibatalkan oleh partner');
  }

  finishExitVoteTimeout() {
    this.closeExitVoteModal();
    this.showToast('Waktu ajakan keluar 5 detik habis');
  }

  closeExitVoteModal() {
    if (this.exitVoteTimer) {
      clearInterval(this.exitVoteTimer);
      this.exitVoteTimer = null;
    }
    this.exitVoteActive = false;
    const modal = document.getElementById('exitVoteModal');
    if (modal) modal.classList.add('hidden');
  }

  showToast(msg) {
    if (window.showToast) {
      window.showToast(msg);
    }
  }

  // ========================================================
  // LEAVE ROOM / RETURN TO LOBBY
  // ========================================================
  leaveRoom() {
    this.closeExitVoteModal();
    this.clearSession();

    // Reset URL to clean base
    const cleanUrl = `${window.location.origin}${window.location.pathname}`;
    window.history.replaceState({}, '', cleanUrl);

    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    if (this.conn) {
      try { this.conn.close(); } catch(e) {}
      this.conn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch(e) {}
      this.peer = null;
    }

    this.roomCode = null;
    this.isHost = false;
    this.isPublic = false;

    // Hide HUD, show Lobby
    const hud = document.getElementById('gameHud');
    if (hud) hud.classList.add('hidden');

    const lobbyModal = document.getElementById('lobbyModal');
    if (lobbyModal) lobbyModal.classList.remove('hidden');

    this.updateConnectionBadge('connected');
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

  // ========================================================
  // IN-GAME BROADCASTS
  // ========================================================
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

    if (this.game && this.game.myPlayer.atDoor && this.game.peerPlayer.atDoor) {
      // Record completed match to real-time stats
      fetch('/api/game-played', { method: 'POST' }).catch(() => {});

      setTimeout(() => {
        const nextIdx = (this.game.currentLevelIndex + 1) % GAME_LEVELS.length;
        const nextStart = Date.now();
        this.game.loadLevel(nextIdx, nextStart);
        this.saveSession(nextIdx);

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
}

window.networkManager = new NetworkManager();
