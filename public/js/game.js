// Block Couple - Main Game Engine & Renderer
// Supports Mobile Touch Screens & Desktop Keyboards

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.currentLevelIndex = 0;
    this.currentLevel = GAME_LEVELS[0];

    // Local player identity
    this.localSlot = 1; // 1 (Bobi) or 2 (Bona)
    this.myPlayer = null;
    this.peerPlayer = null;

    // Room objects
    this.blocks = [];
    this.collectedKeys = [];
    this.pressedButtons = [];

    // Particles and visual FX
    this.particles = [];
    this.floatingTexts = [];
    this.emotes = []; // { slot, text, x, y, life }
    this.screenShake = 0;

    // Input state
    this.keysDown = {};
    this.touchState = {
      left: false,
      right: false,
      down: false,
      jump: false
    };

    // Physics constants
    this.GRAVITY = 0.58;
    this.MOVE_SPEED = 4.2;
    this.JUMP_FORCE = -11.6;
    this.FRICTION = 0.82;

    this.animTime = 0;
    this.lastLoopTime = performance.now();
    this.gameRunning = false;

    this.initPlayers();
    this.setupInputs();
    this.setupResize();
  }

  initPlayers() {
    this.myPlayer = {
      slot: this.localSlot,
      name: this.localSlot === 1 ? 'Bobi' : 'Bona',
      color: this.localSlot === 1 ? '#00e5ff' : '#ff3b77',
      x: 80,
      y: 400,
      width: 32,
      height: 32,
      vx: 0,
      vy: 0,
      facing: 1,
      isGrounded: false,
      coyoteTimer: 0,
      jumpBuffer: 0,
      squashX: 1,
      squashY: 1,
      blinkTimer: Math.random() * 100 + 60,
      isBlinking: false,
      atDoor: false
    };

    this.peerPlayer = {
      slot: this.localSlot === 1 ? 2 : 1,
      name: this.localSlot === 1 ? 'Bona' : 'Bobi',
      color: this.localSlot === 1 ? '#ff3b77' : '#00e5ff',
      x: 130,
      y: 400,
      width: 32,
      height: 32,
      vx: 0,
      vy: 0,
      facing: 1,
      isGrounded: false,
      targetX: 130,
      targetY: 400,
      squashX: 1,
      squashY: 1,
      blinkTimer: 100,
      isBlinking: false,
      atDoor: false,
      connected: false
    };
  }

  setSlot(slot) {
    this.localSlot = slot;
    this.myPlayer.slot = slot;
    this.myPlayer.name = slot === 1 ? 'Bobi' : 'Bona';
    this.myPlayer.color = slot === 1 ? '#00e5ff' : '#ff3b77';

    this.peerPlayer.slot = slot === 1 ? 2 : 1;
    this.peerPlayer.name = slot === 1 ? 'Bona' : 'Bobi';
    this.peerPlayer.color = slot === 1 ? '#ff3b77' : '#00e5ff';

    this.respawnPlayers();
  }

  loadLevel(index) {
    this.currentLevelIndex = index % GAME_LEVELS.length;
    this.currentLevel = GAME_LEVELS[this.currentLevelIndex];
    this.collectedKeys = [];
    this.pressedButtons = [];
    this.blocks = [];
    this.respawnPlayers();

    // Visual notification
    this.addFloatingText(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40, this.currentLevel.title, '#ffffff', 32);
    
    // Update UI
    const titleEl = document.getElementById('levelTitle');
    if (titleEl) titleEl.innerText = this.currentLevel.title;
    const hintEl = document.getElementById('levelHint');
    if (hintEl) hintEl.innerText = this.currentLevel.hint;
    this.updateKeyUI();
  }

  respawnPlayers() {
    const sp = this.currentLevel.spawns;
    if (this.localSlot === 1) {
      this.myPlayer.x = sp.p1.x;
      this.myPlayer.y = sp.p1.y;
      this.peerPlayer.x = sp.p2.x;
      this.peerPlayer.y = sp.p2.y;
    } else {
      this.myPlayer.x = sp.p2.x;
      this.myPlayer.y = sp.p2.y;
      this.peerPlayer.x = sp.p1.x;
      this.peerPlayer.y = sp.p1.y;
    }
    this.myPlayer.vx = 0;
    this.myPlayer.vy = 0;
    this.myPlayer.atDoor = false;
    this.peerPlayer.vx = 0;
    this.peerPlayer.vy = 0;
    this.peerPlayer.atDoor = false;
    this.peerPlayer.targetX = this.peerPlayer.x;
    this.peerPlayer.targetY = this.peerPlayer.y;
  }

  setupInputs() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      // Prevent browser scroll on arrow / space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      this.keysDown[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key.toLowerCase() === 'w' || e.key === 'ArrowUp') {
        this.myPlayer.jumpBuffer = 6;
      }
      if (e.key.toLowerCase() === 'e' || e.key.toLowerCase() === 'x') {
        this.requestPlaceBlock();
      }
      if (e.key.toLowerCase() === 'c') {
        this.requestClearBlocks();
      }
      if (e.key.toLowerCase() === 'r') {
        window.networkManager && window.networkManager.requestRestart();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysDown[e.key.toLowerCase()] = false;
    });

    // Touch button inputs for mobile
    const bindTouchBtn = (elementId, startHandler, endHandler) => {
      const el = document.getElementById(elementId);
      if (!el) return;

      const onStart = (e) => {
        e.preventDefault();
        window.audioManager && window.audioManager.init();
        startHandler();
      };
      const onEnd = (e) => {
        e.preventDefault();
        endHandler();
      };

      el.addEventListener('touchstart', onStart, { passive: false });
      el.addEventListener('touchend', onEnd, { passive: false });
      el.addEventListener('touchcancel', onEnd, { passive: false });
      el.addEventListener('mousedown', onStart);
      el.addEventListener('mouseup', onEnd);
      el.addEventListener('mouseleave', onEnd);
    };

    bindTouchBtn('btnLeft', () => { this.touchState.left = true; }, () => { this.touchState.left = false; });
    bindTouchBtn('btnRight', () => { this.touchState.right = true; }, () => { this.touchState.right = false; });
    bindTouchBtn('btnDown', () => { this.touchState.down = true; }, () => { this.touchState.down = false; });
    bindTouchBtn('btnJump', () => { 
      this.touchState.jump = true; 
      this.myPlayer.jumpBuffer = 6;
    }, () => { 
      this.touchState.jump = false; 
    });
    bindTouchBtn('btnPlace', () => { this.requestPlaceBlock(); }, () => {});
    bindTouchBtn('btnClear', () => { this.requestClearBlocks(); }, () => {});
  }

  setupResize() {
    const handleResize = () => {
      const container = document.getElementById('gameContainer');
      if (!container) return;
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Keep 16:9 ratio
      let scale = Math.min(w / CANVAS_WIDTH, (h - 90) / CANVAS_HEIGHT);
      if (scale > 1.25) scale = 1.25;
      if (scale < 0.35) scale = 0.35;

      this.canvas.style.width = `${Math.floor(CANVAS_WIDTH * scale)}px`;
      this.canvas.style.height = `${Math.floor(CANVAS_HEIGHT * scale)}px`;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    setTimeout(handleResize, 100);
  }

  requestPlaceBlock() {
    // Placement logic:
    // If aiming down or airborne downwards: place directly below player (stepping stone / stair)
    // Else: place in front of player
    const isAimingDown = this.keysDown['s'] || this.keysDown['arrowdown'] || this.touchState.down;
    let targetX, targetY;
    const blockSize = 36;

    if (isAimingDown) {
      targetX = Math.round(this.myPlayer.x / blockSize) * blockSize;
      targetY = Math.round((this.myPlayer.y + this.myPlayer.height + 4) / blockSize) * blockSize;
    } else {
      const offset = this.myPlayer.facing > 0 ? this.myPlayer.width + 8 : -blockSize - 8;
      targetX = Math.round((this.myPlayer.x + offset) / blockSize) * blockSize;
      targetY = Math.round(this.myPlayer.y / blockSize) * blockSize;
    }

    // Keep inside bounds
    if (targetX < 10) targetX = 10;
    if (targetX > CANVAS_WIDTH - blockSize - 10) targetX = CANVAS_WIDTH - blockSize - 10;
    if (targetY < 20) targetY = 20;
    if (targetY > CANVAS_HEIGHT - blockSize - 10) targetY = CANVAS_HEIGHT - blockSize - 10;

    // Check collision with solid platforms to prevent building inside ground
    const overlapsPlatform = this.currentLevel.platforms.some(plat => {
      if (plat.type === 'barrier' && this.isBarrierLowered(plat.id)) return false;
      return this.checkOverlap({ x: targetX, y: targetY, width: blockSize, height: blockSize }, plat);
    });

    if (overlapsPlatform) return;

    // Send to socket
    if (window.networkManager) {
      window.networkManager.emitCreateBlock({
        x: targetX,
        y: targetY,
        width: blockSize,
        height: blockSize
      });
    }

    // Sound and particle
    window.audioManager && window.audioManager.playBlockPlace();
    this.createSpawnSparks(targetX + blockSize / 2, targetY + blockSize / 2, this.myPlayer.color);
  }

  requestClearBlocks() {
    if (window.networkManager) {
      window.networkManager.emitClearBlocks();
    }
    window.audioManager && window.audioManager.playBlockClear();
    this.addFloatingText(this.myPlayer.x, this.myPlayer.y - 20, "Balok Dihapus!", '#ffc107', 14);
  }

  isBarrierLowered(barrierId) {
    // Check if any button linking to this barrier is pressed
    const btn = this.currentLevel.buttons.find(b => b.linkedBarrierId === barrierId);
    if (!btn) return false;
    return this.pressedButtons.includes(btn.id);
  }

  // Main Loop
  start() {
    if (this.gameRunning) return;
    this.gameRunning = true;
    const loop = (currentTime) => {
      const dt = Math.min((currentTime - this.lastLoopTime) / 1000, 0.05);
      this.lastLoopTime = currentTime;
      this.animTime += dt;

      this.update(dt);
      this.render();

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update(dt) {
    this.updateLocalPlayer(dt);
    this.updatePeerInterpolation(dt);
    this.updateButtons();
    this.updateKeys();
    this.updateDoor();
    this.updateParticles(dt);
    this.updateCoupleLoveHearts();

    if (this.screenShake > 0) {
      this.screenShake -= dt * 25;
      if (this.screenShake < 0) this.screenShake = 0;
    }
  }

  updateLocalPlayer(dt) {
    const p = this.myPlayer;

    // Horizontal movement
    const left = this.keysDown['a'] || this.keysDown['arrowleft'] || this.touchState.left;
    const right = this.keysDown['d'] || this.keysDown['arrowright'] || this.touchState.right;

    if (left && !right) {
      p.vx = -this.MOVE_SPEED;
      p.facing = -1;
    } else if (right && !left) {
      p.vx = this.MOVE_SPEED;
      p.facing = 1;
    } else {
      p.vx *= this.FRICTION;
      if (Math.abs(p.vx) < 0.08) p.vx = 0;
    }

    // Coyote time & jump buffer
    if (p.isGrounded) {
      p.coyoteTimer = 7;
    } else if (p.coyoteTimer > 0) {
      p.coyoteTimer--;
    }

    if (p.jumpBuffer > 0) {
      if (p.coyoteTimer > 0) {
        p.vy = this.JUMP_FORCE;
        p.coyoteTimer = 0;
        p.jumpBuffer = 0;
        p.isGrounded = false;
        p.squashX = 0.75;
        p.squashY = 1.35;
        window.audioManager && window.audioManager.playJump();
        this.createDust(p.x + p.width / 2, p.y + p.height);
      } else {
        p.jumpBuffer--;
      }
    }

    // Variable jump height
    const jumpHeld = this.keysDown['w'] || this.keysDown['arrowup'] || this.keysDown[' '] || this.touchState.jump;
    if (!jumpHeld && p.vy < -4) {
      p.vy += 0.9;
    }

    // Apply gravity
    p.vy += this.GRAVITY;
    if (p.vy > 14) p.vy = 14;

    // Move X and collide
    p.x += p.vx;
    this.resolveCollisionsX(p);

    // Move Y and collide
    p.y += p.vy;
    p.isGrounded = false;
    this.resolveCollisionsY(p);

    // Bounce squash and stretch back to 1
    p.squashX += (1 - p.squashX) * 0.15;
    p.squashY += (1 - p.squashY) * 0.15;

    // Blinking
    p.blinkTimer--;
    if (p.blinkTimer <= 0) {
      p.isBlinking = !p.isBlinking;
      p.blinkTimer = p.isBlinking ? 8 : (Math.random() * 120 + 80);
    }

    // Check Spikes / Void
    this.checkHazards(p);

    // Keep in canvas borders
    if (p.x < 0) p.x = 0;
    if (p.x > CANVAS_WIDTH - p.width) p.x = CANVAS_WIDTH - p.width;
    if (p.y > CANVAS_HEIGHT + 60) {
      this.handlePlayerHurt(p);
    }

    // Broadcast update to peer via socket
    if (window.networkManager) {
      window.networkManager.emitPlayerUpdate({
        x: p.x,
        y: p.y,
        vx: p.vx,
        vy: p.vy,
        facing: p.facing,
        isGrounded: p.isGrounded,
        anim: Math.abs(p.vx) > 0.5 ? 'walk' : 'idle'
      });
    }
  }

  updatePeerInterpolation(dt) {
    const peer = this.peerPlayer;
    if (!peer.connected) return;

    // Smooth lerp to target position received from socket
    peer.x += (peer.targetX - peer.x) * 0.35;
    peer.y += (peer.targetY - peer.y) * 0.35;

    peer.squashX += (1 - peer.squashX) * 0.15;
    peer.squashY += (1 - peer.squashY) * 0.15;

    peer.blinkTimer--;
    if (peer.blinkTimer <= 0) {
      peer.isBlinking = !peer.isBlinking;
      peer.blinkTimer = peer.isBlinking ? 8 : (Math.random() * 120 + 80);
    }
  }

  resolveCollisionsX(p) {
    const solidBoxes = this.getAllSolidBoxes();
    for (const b of solidBoxes) {
      if (this.checkOverlap(p, b)) {
        if (p.vx > 0) {
          p.x = b.x - p.width;
        } else if (p.vx < 0) {
          p.x = b.x + b.width;
        }
        p.vx = 0;
      }
    }
  }

  resolveCollisionsY(p) {
    const solidBoxes = this.getAllSolidBoxes();
    // Also player can stand on peer's head!
    if (this.peerPlayer.connected) {
      solidBoxes.push({
        x: this.peerPlayer.x,
        y: this.peerPlayer.y,
        width: this.peerPlayer.width,
        height: this.peerPlayer.height
      });
    }

    for (const b of solidBoxes) {
      if (this.checkOverlap(p, b)) {
        if (p.vy > 0) {
          p.y = b.y - p.height;
          p.vy = 0;
          p.isGrounded = true;
          // Landing squash
          if (p.vy > 3) {
            p.squashX = 1.25;
            p.squashY = 0.8;
            this.createDust(p.x + p.width / 2, p.y + p.height);
          }
        } else if (p.vy < 0) {
          p.y = b.y + b.height;
          p.vy = 0;
        }
      }
    }
  }

  getAllSolidBoxes() {
    const solids = [];
    // Platforms
    for (const plat of this.currentLevel.platforms) {
      if (plat.type === 'barrier' && this.isBarrierLowered(plat.id)) {
        continue;
      }
      solids.push(plat);
    }
    // Placed blocks
    for (const blk of this.blocks) {
      solids.push(blk);
    }
    return solids;
  }

  checkOverlap(r1, r2) {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  checkHazards(p) {
    for (const spike of this.currentLevel.spikes) {
      if (this.checkOverlap(p, spike)) {
        this.handlePlayerHurt(p);
        break;
      }
    }
  }

  handlePlayerHurt(p) {
    window.audioManager && window.audioManager.playHurt();
    this.screenShake = 6;
    this.createSpawnSparks(p.x + p.width / 2, p.y + p.height / 2, '#ff1744');
    this.addFloatingText(p.x, p.y - 20, "Ouch!", '#ff1744', 18);
    
    // Respawn to starting platform
    const sp = this.currentLevel.spawns;
    const spawnPos = p.slot === 1 ? sp.p1 : sp.p2;
    p.x = spawnPos.x;
    p.y = spawnPos.y;
    p.vx = 0;
    p.vy = 0;
  }

  updateButtons() {
    for (const btn of this.currentLevel.buttons) {
      const buttonTriggerArea = {
        x: btn.x,
        y: btn.y - 6,
        width: btn.width,
        height: btn.height + 6
      };

      // Check if player or block or peer is pressing it
      const myPressed = this.checkOverlap(this.myPlayer, buttonTriggerArea);
      const peerPressed = this.peerPlayer.connected && this.checkOverlap(this.peerPlayer, buttonTriggerArea);
      const blockPressed = this.blocks.some(b => this.checkOverlap(b, buttonTriggerArea));

      const isPressed = myPressed || peerPressed || blockPressed;
      const wasPressed = this.pressedButtons.includes(btn.id);

      if (isPressed && !wasPressed) {
        this.pressedButtons.push(btn.id);
        window.audioManager && window.audioManager.playButtonPress();
        if (window.networkManager) {
          window.networkManager.emitPressButton(btn.id, true);
        }
      } else if (!isPressed && wasPressed) {
        this.pressedButtons = this.pressedButtons.filter(id => id !== btn.id);
        if (window.networkManager) {
          window.networkManager.emitPressButton(btn.id, false);
        }
      }
    }
  }

  updateKeys() {
    for (const key of this.currentLevel.keys) {
      if (this.collectedKeys.includes(key.id)) continue;
      const keyBox = { x: key.x - 12, y: key.y - 12, width: 24, height: 24 };

      if (this.checkOverlap(this.myPlayer, keyBox)) {
        this.collectedKeys.push(key.id);
        window.audioManager && window.audioManager.playKey();
        this.createSpawnSparks(key.x, key.y, '#ffd700');
        this.addFloatingText(key.x, key.y - 25, "KUNCI DIAMBIL! 🔑", '#ffd700', 16);
        this.updateKeyUI();

        if (window.networkManager) {
          window.networkManager.emitCollectKey(key.id);
        }

        // Check if all keys collected
        if (this.collectedKeys.length === this.currentLevel.keys.length) {
          window.audioManager && window.audioManager.playDoorOpen();
          this.addFloatingText(CANVAS_WIDTH / 2, 100, "PINTU TERBUKA! PERGI KE PINTU! 🚪✨", '#00ffcc', 22);
        }
      }
    }
  }

  updateDoor() {
    const door = this.currentLevel.door;
    const allKeysCollected = this.collectedKeys.length === this.currentLevel.keys.length;

    const myAtDoor = allKeysCollected && this.checkOverlap(this.myPlayer, door);
    if (myAtDoor !== this.myPlayer.atDoor) {
      this.myPlayer.atDoor = myAtDoor;
      if (window.networkManager) {
        window.networkManager.emitDoorEnter(myAtDoor);
      }
    }

    const peerAtDoor = this.peerPlayer.connected && allKeysCollected && this.checkOverlap(this.peerPlayer, door);
    this.peerPlayer.atDoor = peerAtDoor;

    if (myAtDoor && peerAtDoor) {
      // Level complete celebration!
      this.createVictoryConfetti();
    }
  }

  updateKeyUI() {
    const keyContainer = document.getElementById('keyTracker');
    if (!keyContainer) return;
    const total = this.currentLevel.keys.length;
    const collected = this.collectedKeys.length;
    keyContainer.innerHTML = `🔑 <b>${collected} / ${total}</b> Kunci`;
  }

  updateCoupleLoveHearts() {
    if (!this.peerPlayer.connected) return;
    // Calculate distance between Bobi and Bona
    const dx = (this.myPlayer.x + 16) - (this.peerPlayer.x + 16);
    const dy = (this.myPlayer.y + 16) - (this.peerPlayer.y + 16);
    const dist = Math.sqrt(dx * dx + dy * dy);

    // When couple stands close together, spawn sweet floating heart particles!
    if (dist < 60 && Math.random() < 0.08) {
      const midX = (this.myPlayer.x + this.peerPlayer.x) / 2 + 16;
      const midY = (this.myPlayer.y + this.peerPlayer.y) / 2;
      this.particles.push({
        type: 'heart',
        x: midX + (Math.random() * 20 - 10),
        y: midY,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -1.2 - Math.random() * 0.8,
        scale: 0.8 + Math.random() * 0.5,
        alpha: 1,
        life: 1
      });
    }
  }

  // FX Helpers
  createDust(x, y) {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        type: 'dust',
        x: x + (Math.random() * 12 - 6),
        y: y,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 1.5,
        radius: 3 + Math.random() * 3,
        alpha: 0.7,
        life: 0.6
      });
    }
  }

  createSpawnSparks(x, y, color) {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i;
      const speed = 2 + Math.random() * 3;
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        radius: 3,
        alpha: 1,
        life: 0.8
      });
    }
  }

  createVictoryConfetti() {
    if (Math.random() < 0.4) {
      const colors = ['#00e5ff', '#ff3b77', '#ffd700', '#00ff88', '#ffffff', '#e040fb'];
      for (let i = 0; i < 5; i++) {
        this.particles.push({
          type: 'confetti',
          x: Math.random() * CANVAS_WIDTH,
          y: -10,
          vx: (Math.random() - 0.5) * 3,
          vy: 2 + Math.random() * 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 6 + Math.random() * 6,
          rotation: Math.random() * Math.PI,
          rotSpeed: (Math.random() - 0.5) * 0.2,
          alpha: 1,
          life: 2.5
        });
      }
    }
  }

  addFloatingText(x, y, text, color = '#ffffff', size = 18) {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      size,
      alpha: 1,
      life: 1.5
    });
  }

  showEmote(slot, emoteChar) {
    const isMe = slot === this.myPlayer.slot;
    const targetPlayer = isMe ? this.myPlayer : this.peerPlayer;
    this.emotes.push({
      slot,
      char: emoteChar,
      x: targetPlayer.x + 16,
      y: targetPlayer.y - 25,
      alpha: 1,
      life: 2
    });
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      p.alpha = Math.max(0, p.life);

      if (p.type === 'confetti') {
        p.rotation += p.rotSpeed;
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= dt * 24;
      ft.life -= dt;
      ft.alpha = Math.max(0, ft.life / 1.5);
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    for (let i = this.emotes.length - 1; i >= 0; i--) {
      const em = this.emotes[i];
      em.y -= dt * 15;
      em.life -= dt;
      em.alpha = Math.max(0, em.life / 2);
      if (em.life <= 0) {
        this.emotes.splice(i, 1);
      }
    }
  }

  // ==========================================
  // RENDER ENGINE
  // ==========================================
  render() {
    const ctx = this.ctx;
    ctx.save();

    // Screen shake
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // Background Gradient (Cyber-cute twilight sky)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGrad.addColorStop(0, '#0d1326');
    skyGrad.addColorStop(0.6, '#1a1f3c');
    skyGrad.addColorStop(1, '#2b1b3d');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Decorative grid/stars background
    this.renderBackgroundDetails(ctx);

    // Platforms & Terrain
    this.renderPlatforms(ctx);

    // Spikes (Jalan Berlubang / Hazard)
    this.renderSpikes(ctx);

    // Buttons / Pressure Plates
    this.renderButtons(ctx);

    // Exit Door
    this.renderDoor(ctx);

    // Keys
    this.renderKeys(ctx);

    // Placed Blocks
    this.renderBlocks(ctx);

    // Characters (Bobi & Bona)
    if (this.peerPlayer.connected) {
      this.renderCharacter(ctx, this.peerPlayer);
    }
    this.renderCharacter(ctx, this.myPlayer);

    // Particles & FX
    this.renderParticles(ctx);

    // Floating Emotes & Texts
    this.renderOverlays(ctx);

    ctx.restore();
  }

  renderBackgroundDetails(ctx) {
    // Subtle star dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let i = 0; i < 40; i++) {
      const x = ((i * 137) % CANVAS_WIDTH);
      const y = ((i * 83) % (CANVAS_HEIGHT - 100));
      ctx.fillRect(x, y, 2, 2);
    }
  }

  renderPlatforms(ctx) {
    for (const p of this.currentLevel.platforms) {
      if (p.type === 'barrier') {
        const lowered = this.isBarrierLowered(p.id);
        if (lowered) continue; // Lowered barrier is open!

        // Laser barrier look
        ctx.fillStyle = 'rgba(255, 40, 80, 0.7)';
        ctx.fillRect(p.x, p.y, p.width, p.height);

        ctx.strokeStyle = '#ff1744';
        ctx.lineWidth = 3;
        ctx.strokeRect(p.x, p.y, p.width, p.height);

        // Animated laser stripe
        ctx.fillStyle = '#ffffff';
        const stripeY = p.y + ((this.animTime * 120) % p.height);
        ctx.fillRect(p.x, stripeY, p.width, 4);
        continue;
      }

      // Solid ground platforms
      // Top grassy/neon rim
      ctx.fillStyle = '#303f9f';
      ctx.fillRect(p.x, p.y, p.width, p.height);

      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(p.x, p.y, p.width, 5);

      // Subtle border
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(p.x, p.y, p.width, p.height);
    }
  }

  renderSpikes(ctx) {
    for (const sp of this.currentLevel.spikes) {
      const spikeCount = Math.floor(sp.width / 18);
      ctx.fillStyle = '#ff1744';
      ctx.strokeStyle = '#b71c1c';
      ctx.lineWidth = 2;

      for (let i = 0; i < spikeCount; i++) {
        const sx = sp.x + i * 18;
        ctx.beginPath();
        ctx.moveTo(sx, sp.y + sp.height);
        ctx.lineTo(sx + 9, sp.y + 4);
        ctx.lineTo(sx + 18, sp.y + sp.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Red ominous hazard glow in pit
      ctx.fillStyle = 'rgba(255, 23, 68, 0.25)';
      ctx.fillRect(sp.x, sp.y + 6, sp.width, sp.height);
    }
  }

  renderButtons(ctx) {
    for (const b of this.currentLevel.buttons) {
      const isPressed = this.pressedButtons.includes(b.id);
      const h = isPressed ? b.height * 0.4 : b.height;
      const y = isPressed ? b.y + b.height * 0.6 : b.y;

      // Base plate
      ctx.fillStyle = '#37474f';
      ctx.fillRect(b.x - 4, b.y + b.height - 4, b.width + 8, 4);

      // Pressure pad
      ctx.fillStyle = isPressed ? '#00e676' : '#ffd600';
      ctx.fillRect(b.x, y, b.width, h);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(b.x, y, b.width, h);
    }
  }

  renderDoor(ctx) {
    const d = this.currentLevel.door;
    const allKeysCollected = this.collectedKeys.length === this.currentLevel.keys.length;

    // Door frame
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(d.x - 4, d.y - 4, d.width + 8, d.height + 4);
    ctx.strokeStyle = allKeysCollected ? '#00e5ff' : '#64748b';
    ctx.lineWidth = 3;
    ctx.strokeRect(d.x - 4, d.y - 4, d.width + 8, d.height + 4);

    // Door interior
    if (allKeysCollected) {
      // Swirling portal gradient
      const portalGrad = ctx.createLinearGradient(d.x, d.y, d.x + d.width, d.y + d.height);
      portalGrad.addColorStop(0, '#00e5ff');
      portalGrad.addColorStop(0.5, '#7c4dff');
      portalGrad.addColorStop(1, '#ff4081');
      ctx.fillStyle = portalGrad;
      ctx.fillRect(d.x, d.y, d.width, d.height);

      // Heart emblem in portal center
      ctx.font = '22px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('💖', d.x + d.width / 2, d.y + d.height / 2 + 8);
    } else {
      // Locked wooden/metal door
      ctx.fillStyle = '#334155';
      ctx.fillRect(d.x, d.y, d.width, d.height);

      // Lock icon
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🔒', d.x + d.width / 2, d.y + d.height / 2 + 8);
    }

    // Door readiness indicator
    const playersAtDoorCount = (this.myPlayer.atDoor ? 1 : 0) + (this.peerPlayer.atDoor ? 1 : 0);
    if (allKeysCollected) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${playersAtDoorCount}/2 Siap!`, d.x + d.width / 2, d.y - 12);
    }
  }

  renderKeys(ctx) {
    for (const k of this.currentLevel.keys) {
      if (this.collectedKeys.includes(k.id)) continue;
      // Floating sine wave animation
      const bob = Math.sin(this.animTime * 4 + k.x) * 6;

      ctx.save();
      ctx.translate(k.x, k.y + bob);

      // Outer glow
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 14;

      // Golden Key graphic
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(0, -6, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, -6, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-2, 0, 4, 14);
      ctx.fillRect(0, 5, 5, 3);
      ctx.fillRect(0, 10, 5, 3);

      ctx.restore();
    }
  }

  renderBlocks(ctx) {
    for (const b of this.blocks) {
      ctx.save();
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;

      // Rounded block
      this.drawRoundedRect(ctx, b.x, b.y, b.width, b.height, 6);
      ctx.fill();

      // Top glossy highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      this.drawRoundedRect(ctx, b.x + 3, b.y + 3, b.width - 6, 8, 3);
      ctx.fill();

      // Center cute pattern
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(b.playerSlot === 1 ? '❄️' : '🌸', b.x + b.width / 2, b.y + b.height / 2 + 5);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      this.drawRoundedRect(ctx, b.x, b.y, b.width, b.height, 6);
      ctx.stroke();

      ctx.restore();
    }
  }

  renderCharacter(ctx, p) {
    ctx.save();
    const cx = p.x + p.width / 2;
    const cy = p.y + p.height / 2;

    ctx.translate(cx, cy);
    ctx.scale(p.squashX, p.squashY);

    const w = p.width;
    const h = p.height;
    const halfW = w / 2;
    const halfH = h / 2;

    // Body glow & main box
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = p.color;
    this.drawRoundedRect(ctx, -halfW, -halfH, w, h, 8);
    ctx.fill();

    // Top glossy reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    this.drawRoundedRect(ctx, -halfW + 3, -halfH + 3, w - 6, 6, 3);
    ctx.fill();

    // Cheeks blush
    ctx.fillStyle = p.slot === 1 ? 'rgba(0, 150, 255, 0.5)' : 'rgba(255, 60, 120, 0.6)';
    ctx.beginPath();
    ctx.arc(-halfW + 6, 4, 3.5, 0, Math.PI * 2);
    ctx.arc(halfW - 6, 4, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    const eyeOffsetX = p.facing * 3;
    if (p.isBlinking) {
      // Blinking closed eye slits (^_^)
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-7 + eyeOffsetX, -2);
      ctx.lineTo(-2 + eyeOffsetX, -2);
      ctx.moveTo(2 + eyeOffsetX, -2);
      ctx.lineTo(7 + eyeOffsetX, -2);
      ctx.stroke();
    } else {
      // Expressive wide sparkling eyes
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-5 + eyeOffsetX, -2, 4, 0, Math.PI * 2);
      ctx.arc(5 + eyeOffsetX, -2, 4, 0, Math.PI * 2);
      ctx.fill();

      // Eye glint highlights
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-6 + eyeOffsetX, -4, 1.8, 0, Math.PI * 2);
      ctx.arc(4 + eyeOffsetX, -4, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Distinguishing accessories:
    if (p.slot === 1) {
      // Bobi: Blue Gamer Cap / Beanie
      ctx.fillStyle = '#0059b3';
      ctx.fillRect(-halfW - 2, -halfH - 4, w + 4, 6);
      ctx.fillRect(-halfW + 4, -halfH - 8, w - 8, 5);
      // Cap visor
      ctx.fillStyle = '#003d80';
      ctx.fillRect(p.facing > 0 ? -2 : -halfW - 6, -halfH - 2, halfW + 6, 3);
    } else {
      // Bona: Cute Ribbon Bow on top
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🎀', 0, -halfH - 2);
    }

    // Name tag & player indicator
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    const tag = p.slot === this.localSlot ? `${p.name} (Kamu)` : p.name;
    ctx.fillText(tag, 0, -halfH - 14);

    ctx.restore();
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  renderParticles(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      if (p.type === 'heart') {
        ctx.font = `${Math.floor(18 * p.scale)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('💖', p.x, p.y);
      } else if (p.type === 'confetti') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'dust') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  renderOverlays(ctx) {
    // Floating texts
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    // Emotes
    for (const em of this.emotes) {
      ctx.save();
      ctx.globalAlpha = em.alpha;
      ctx.font = '28px Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 6;
      ctx.fillText(em.char, em.x, em.y);
      ctx.restore();
    }
  }
}

window.GameEngine = GameEngine;
