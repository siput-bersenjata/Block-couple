// Block Couple - Main 2.5D Game Engine & Enhanced Renderer
// Smooth Parallax Camera, 3D Depth, Expressive Cube Animations, Enemies & Moving Platforms

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.currentLevelIndex = 0;
    this.currentLevel = GAME_LEVELS[0];
    this.levelStartTime = Date.now();

    // Camera 2.5D System
    this.camera = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      tilt: 0,
      scale: 1
    };

    // Local player identity
    this.localSlot = 1; // 1 (Bobi) or 2 (Bona)
    this.myPlayer = null;
    this.peerPlayer = null;

    // Room objects
    this.blocks = [];
    this.collectedKeys = [];
    this.pressedButtons = [];
    this.defeatedEnemies = [];

    // Particles and visual FX
    this.particles = [];
    this.floatingTexts = [];
    this.emotes = [];
    this.screenShake = 0;

    // Moving platform states
    this.movingPlatformDeltas = {};

    // Input state
    this.keysDown = {};
    this.touchState = {
      left: false,
      right: false,
      down: false,
      jump: false
    };

    // Physics constants - tuned for realistic, natural, and satisfying jump arcs
    this.GRAVITY = 0.36;
    this.MOVE_SPEED = 3.9;
    this.JUMP_FORCE = -9.2;
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
      tilt: 0,
      walkTime: 0,
      blinkTimer: Math.random() * 100 + 60,
      isBlinking: false,
      atDoor: false,
      expression: 'idle',
      hurtTimer: 0
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
      tilt: 0,
      walkTime: 0,
      blinkTimer: 100,
      isBlinking: false,
      atDoor: false,
      connected: false,
      expression: 'idle',
      hurtTimer: 0
    };
  }

  setSlot(slot) {
    this.localSlot = slot;
    this.myPlayer.slot = slot;
    this.myPlayer.color = slot === 1 ? '#00e5ff' : '#ff3b77';

    this.peerPlayer.slot = slot === 1 ? 2 : 1;
    this.peerPlayer.color = slot === 1 ? '#ff3b77' : '#00e5ff';

    this.respawnPlayers();
  }

  loadLevel(index, startTime, restorePos = null) {
    this.currentLevelIndex = index % GAME_LEVELS.length;
    this.currentLevel = GAME_LEVELS[this.currentLevelIndex];
    this.levelStartTime = startTime || Date.now();
    this.collectedKeys = [];
    this.pressedButtons = [];
    this.defeatedEnemies = [];
    this.blocks = [];
    this.respawnPlayers(restorePos);

    // If restorePos given, focus camera on restored player position!
    if (restorePos && typeof restorePos.x === 'number') {
      const maxCamX = Math.max(0, this.currentLevel.width - CANVAS_WIDTH);
      this.camera.x = Math.max(0, Math.min(maxCamX, restorePos.x - CANVAS_WIDTH / 2));
      this.camera.targetX = this.camera.x;
    } else {
      this.camera.x = 0;
      this.camera.targetX = 0;
    }

    // Visual notification
    this.addFloatingText(this.myPlayer.x + 100, 200, this.currentLevel.title, '#ffffff', 28);

    // Update HUD
    const titleEl = document.getElementById('levelTitle');
    if (titleEl) titleEl.innerText = this.currentLevel.title;
    const hintEl = document.getElementById('levelHint');
    if (hintEl) hintEl.innerText = this.currentLevel.hint;
    this.updateKeyUI();
  }

  respawnPlayers(restorePos = null) {
    const sp = this.currentLevel.spawns;
    if (restorePos && typeof restorePos.x === 'number') {
      // Spawn at last known position on refresh
      this.myPlayer.x = restorePos.x;
      this.myPlayer.y = restorePos.y;
      if (typeof restorePos.peerX === 'number') {
        this.peerPlayer.x = restorePos.peerX;
        this.peerPlayer.y = restorePos.peerY;
        this.peerPlayer.targetX = restorePos.peerX;
        this.peerPlayer.targetY = restorePos.peerY;
      }
    } else {
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
    }
    this.myPlayer.vx = 0;
    this.myPlayer.vy = 0;
    this.myPlayer.atDoor = false;
    this.myPlayer.hurtTimer = 0;
    this.peerPlayer.vx = 0;
    this.peerPlayer.vy = 0;
    this.peerPlayer.atDoor = false;
    this.peerPlayer.targetX = this.peerPlayer.x;
    this.peerPlayer.targetY = this.peerPlayer.y;
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
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

    // Touch controls
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

    bindTouchBtn('btnUp', () => { this.touchState.up = true; }, () => { this.touchState.up = false; });
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
      const appContainer = document.getElementById('appContainer');
      if (!container) return;
      const w = window.innerWidth;
      const h = window.innerHeight;

      const isPortrait = w < h;
      if (appContainer) {
        appContainer.classList.toggle('mode-portrait', isPortrait);
        appContainer.classList.toggle('mode-landscape', !isPortrait);
      }

      if (isPortrait) {
        // PORTRAIT SPLIT MODE:
        // Top game canvas takes full width 100vw, 16:9 ratio
        // Capped so it doesn't take more than 46% of viewport height
        let canvasW = w;
        let canvasH = Math.round(w * CANVAS_HEIGHT / CANVAS_WIDTH);
        const maxH = Math.floor(h * 0.46);
        if (canvasH > maxH) {
          canvasH = maxH;
          canvasW = Math.round(canvasH * CANVAS_WIDTH / CANVAS_HEIGHT);
        }
        this.canvas.style.width = `${canvasW}px`;
        this.canvas.style.height = `${canvasH}px`;
      } else if (h <= 650) {
        // MOBILE LANDSCAPE: Fullscreen edge-to-edge
        // Touch controls float inside the canvas corners
        const scale = Math.min(w / CANVAS_WIDTH, h / CANVAS_HEIGHT);
        this.canvas.style.width = `${Math.floor(CANVAS_WIDTH * scale)}px`;
        this.canvas.style.height = `${Math.floor(CANVAS_HEIGHT * scale)}px`;
      } else {
        // DESKTOP / TABLET LANDSCAPE
        const scale = Math.min((w - 32) / CANVAS_WIDTH, (h - 140) / CANVAS_HEIGHT, 1.25);
        this.canvas.style.width = `${Math.floor(CANVAS_WIDTH * scale)}px`;
        this.canvas.style.height = `${Math.floor(CANVAS_HEIGHT * scale)}px`;
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    setTimeout(handleResize, 50);
    setTimeout(handleResize, 300);
    setTimeout(handleResize, 1000);
  }

  requestPlaceBlock() {
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

    if (targetX < 10) targetX = 10;
    if (targetX > this.currentLevel.width - blockSize - 10) targetX = this.currentLevel.width - blockSize - 10;
    if (targetY < 20) targetY = 20;
    if (targetY > CANVAS_HEIGHT - blockSize - 10) targetY = CANVAS_HEIGHT - blockSize - 10;

    // Prevent placing inside solid ground
    const overlapsPlatform = this.currentLevel.platforms.some(plat => {
      if (plat.type === 'barrier' && this.isBarrierLowered(plat.id)) return false;
      return this.checkOverlap({ x: targetX, y: targetY, width: blockSize, height: blockSize }, plat);
    });

    // Prevent placing inside moving platform travel path (so platforms never penetrate or collide with blocks)
    const overlapsMovingPlatformTrack = (this.currentLevel.movingPlatforms || []).some(mp => {
      const minX = Math.min(mp.startX, mp.endX) - 4;
      const maxX = Math.max(mp.startX, mp.endX) + mp.width + 4;
      const minY = Math.min(mp.startY, mp.endY) - 4;
      const maxY = Math.max(mp.startY, mp.endY) + mp.height + 4;
      return this.checkOverlap(
        { x: targetX, y: targetY, width: blockSize, height: blockSize },
        { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
      );
    });

    if (overlapsPlatform || overlapsMovingPlatformTrack) return;

    if (window.networkManager) {
      window.networkManager.emitCreateBlock({
        x: targetX,
        y: targetY,
        width: blockSize,
        height: blockSize
      });
    }

    window.audioManager && window.audioManager.playBlockPlace();
    this.createSpawnSparks(targetX + blockSize / 2, targetY + blockSize / 2, this.myPlayer.color);
    
    // Check if placed block squashes an enemy underneath
    this.checkBlockSquashEnemy({ x: targetX, y: targetY, width: blockSize, height: blockSize });
  }

  requestClearBlocks() {
    if (window.networkManager) {
      window.networkManager.emitClearBlocks();
    }
    window.audioManager && window.audioManager.playBlockClear();
    this.addFloatingText(this.myPlayer.x, this.myPlayer.y - 20, "Balok Dihapus!", '#ffc107', 14);

    // Create dissolve shards
    const myBlocks = this.blocks.filter(b => b.playerSlot === this.localSlot);
    for (const b of myBlocks) {
      for (let i = 0; i < 8; i++) {
        this.particles.push({
          type: 'spark',
          x: b.x + Math.random() * b.width,
          y: b.y + Math.random() * b.height,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 3,
          color: b.color,
          radius: 3,
          alpha: 1,
          life: 0.6
        });
      }
    }
  }

  isBarrierLowered(barrierId) {
    const btn = this.currentLevel.buttons.find(b => b.linkedBarrierId === barrierId);
    if (!btn) return false;
    return this.pressedButtons.includes(btn.id);
  }

  // ========================================================
  // MAIN LOOP & UPDATES
  // ========================================================
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
    this.updateMovingPlatforms(dt);
    this.updateLocalPlayer(dt);
    this.updatePeerInterpolation(dt);
    this.updateCamera(dt);
    this.updateSprings(dt);
    this.updateEnemies(dt);
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

  // Synchronized Moving Platforms
  updateMovingPlatforms(dt) {
    if (!this.currentLevel.movingPlatforms) return;
    const elapsed = (Date.now() - this.levelStartTime) / 1000;

    for (const mp of this.currentLevel.movingPlatforms) {
      const cycle = Math.sin(elapsed * mp.speed);
      const prevX = mp.currentX || mp.x;
      const prevY = mp.currentY || mp.y;

      // Interpolate between start and end
      mp.currentX = mp.startX + (mp.endX - mp.startX) * ((cycle + 1) / 2);
      mp.currentY = mp.startY + (mp.endY - mp.startY) * ((cycle + 1) / 2);

      this.movingPlatformDeltas[mp.id] = {
        dx: mp.currentX - prevX,
        dy: mp.currentY - prevY
      };

      // Carry player if standing on it
      const mpBox = { x: mp.currentX, y: mp.currentY, width: mp.width, height: mp.height };
      const feetBox = { x: this.myPlayer.x, y: this.myPlayer.y + this.myPlayer.height - 2, width: this.myPlayer.width, height: 6 };

      if (this.checkOverlap(feetBox, mpBox) && this.myPlayer.vy >= 0) {
        this.myPlayer.x += this.movingPlatformDeltas[mp.id].dx;
        this.myPlayer.y += this.movingPlatformDeltas[mp.id].dy;
      }
    }
  }

  // Camera 2.5D with smooth tracking and subtle 3D tilt
  updateCamera(dt) {
    // Camera strictly follows THIS PLAYER's own character on their screen
    let targetFocusX = this.myPlayer.x + this.myPlayer.width / 2;

    // Lead camera slightly in player's facing direction for great view ahead
    targetFocusX += this.myPlayer.facing * 35;

    // Clamp camera within level bounds
    const maxCamX = Math.max(0, this.currentLevel.width - CANVAS_WIDTH);
    this.camera.targetX = Math.max(0, Math.min(maxCamX, targetFocusX - CANVAS_WIDTH / 2));

    // Smooth lerp follow
    const camDiff = this.camera.targetX - this.camera.x;
    this.camera.x += camDiff * 0.09;

    // Dynamic camera lean based on movement
    this.camera.tilt = Math.max(-0.02, Math.min(0.02, camDiff * 0.0004));
  }

  updateLocalPlayer(dt) {
    const p = this.myPlayer;

    if (p.hurtTimer > 0) {
      p.hurtTimer -= dt;
      return;
    }

    // Horizontal movement
    const left = this.keysDown['a'] || this.keysDown['arrowleft'] || this.touchState.left;
    const right = this.keysDown['d'] || this.keysDown['arrowright'] || this.touchState.right;

    if (left && !right) {
      p.vx = -this.MOVE_SPEED;
      p.facing = -1;
      p.walkTime += dt;
      p.tilt = -0.08;
      p.expression = 'walk';
    } else if (right && !left) {
      p.vx = this.MOVE_SPEED;
      p.facing = 1;
      p.walkTime += dt;
      p.tilt = 0.08;
      p.expression = 'walk';
    } else {
      p.vx *= this.FRICTION;
      p.tilt *= 0.75;
      if (Math.abs(p.vx) < 0.08) {
        p.vx = 0;
        p.expression = 'idle';
      }
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
        p.squashX = 0.82;
        p.squashY = 1.25;
        p.expression = 'jump';
        window.audioManager && window.audioManager.playJump();
        this.createDust(p.x + p.width / 2, p.y + p.height);
      } else {
        p.jumpBuffer--;
      }
    }

    // Variable jump height - smooth, realistic release
    const jumpHeld = this.keysDown['w'] || this.keysDown['arrowup'] || this.keysDown[' '] || this.touchState.jump;
    if (!jumpHeld && p.vy < -2.8) {
      p.vy += 0.38;
    }

    // Apply gravity
    p.vy += this.GRAVITY;
    if (p.vy > 9.5) p.vy = 9.5;

    if (p.vy > 1.8) {
      p.expression = 'fall';
    }

    // Move X and collide
    p.x += p.vx;
    this.resolveCollisionsX(p);

    // Move Y and collide
    p.y += p.vy;
    p.isGrounded = false;
    this.resolveCollisionsY(p);

    // Bounce squash and stretch back to 1
    p.squashX += (1 - p.squashX) * 0.16;
    p.squashY += (1 - p.squashY) * 0.16;

    // Blinking
    p.blinkTimer--;
    if (p.blinkTimer <= 0) {
      p.isBlinking = !p.isBlinking;
      p.blinkTimer = p.isBlinking ? 8 : (Math.random() * 120 + 80);
    }

    // Check Spikes / Void
    this.checkHazards(p);

    // Boundaries
    if (p.x < 0) p.x = 0;
    if (p.x > this.currentLevel.width - p.width) p.x = this.currentLevel.width - p.width;
    if (p.y > CANVAS_HEIGHT + 70) {
      this.handlePlayerHurt(p);
    }

    // Periodically save last known position for anti-refresh drop
    if (!this.lastPosSaveTime || Date.now() - this.lastPosSaveTime > 400) {
      this.lastPosSaveTime = Date.now();
      if (window.networkManager) {
        window.networkManager.saveLastPosition(p.x, p.y, this.currentLevelIndex);
      }
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
        tilt: p.tilt,
        squashX: p.squashX,
        squashY: p.squashY,
        expression: p.expression,
        anim: Math.abs(p.vx) > 0.5 ? 'walk' : 'idle'
      });
    }
  }

  updatePeerInterpolation(dt) {
    const peer = this.peerPlayer;
    if (!peer.connected) return;

    // Smooth movement interpolation
    peer.x += (peer.targetX - peer.x) * 0.45;
    peer.y += (peer.targetY - peer.y) * 0.45;

    // Smooth tilt interpolation (so character never stays tilted sideways!)
    const targetTilt = peer.targetTilt !== undefined ? peer.targetTilt : 0;
    peer.tilt += (targetTilt - peer.tilt) * 0.25;

    // Smooth squash/stretch interpolation
    const targetSquashX = peer.targetSquashX !== undefined ? peer.targetSquashX : 1;
    const targetSquashY = peer.targetSquashY !== undefined ? peer.targetSquashY : 1;
    peer.squashX += (targetSquashX - peer.squashX) * 0.25;
    peer.squashY += (targetSquashY - peer.squashY) * 0.25;

    // Accumulate walk time for foot animations
    if (Math.abs(peer.targetVx || peer.vx || 0) > 0.4 && peer.isGrounded) {
      peer.walkTime = (peer.walkTime || 0) + dt;
    }

    // Blinking
    peer.blinkTimer--;
    if (peer.blinkTimer <= 0) {
      peer.isBlinking = !peer.isBlinking;
      peer.blinkTimer = peer.isBlinking ? 8 : (Math.random() * 120 + 80);
    }
  }

  // Springs / Bounce Trampoline Pads (Reliable launch when walking or landing on pad)
  updateSprings(dt) {
    if (!this.currentLevel.springs) return;
    for (const sp of this.currentLevel.springs) {
      if (sp.cooldown > 0) {
        sp.cooldown -= dt;
        if (sp.cooldown < 0) sp.cooldown = 0;
      }
      if (sp.squish !== undefined) {
        sp.squish += (1 - sp.squish) * 0.16;
      }

      // Trampoline hit box (generous trigger zone so walking or landing launches reliably)
      const springHitBox = {
        x: sp.x - 2,
        y: sp.y - 4,
        width: sp.width + 4,
        height: sp.height + 6
      };

      // Local player trampoline bounce
      if ((sp.cooldown || 0) <= 0 && this.checkOverlap(this.myPlayer, springHitBox)) {
        const p = this.myPlayer;
        const bounce = (sp.bounceForce || -13) * 0.88;
        p.vy = bounce;
        p.y = sp.y - p.height - 3; // Lift above trampoline immediately
        p.isGrounded = false;
        p.coyoteTimer = 0;
        p.jumpBuffer = 0;
        p.squashX = 0.72;
        p.squashY = 1.38;
        p.expression = 'jump';

        sp.squish = 0.32;
        sp.cooldown = 0.45; // 450ms cooldown prevents rapid spamming

        window.audioManager && window.audioManager.playSpringBounce();
        this.createSpawnSparks(sp.x + sp.width / 2, sp.y, '#ffd700');
        this.addFloatingText(p.x, p.y - 25, "LOMPAT!", '#ffd700', 16);
      }

      // Visual response for peer player touching spring
      if (this.peerPlayer.connected && (sp.cooldown || 0) <= 0 && this.checkOverlap(this.peerPlayer, springHitBox)) {
        sp.squish = 0.32;
        sp.cooldown = 0.45;
        this.createSpawnSparks(sp.x + sp.width / 2, sp.y, '#ffd700');
      }
    }
  }

  // Enemies (Patrolling Spike Slimes & Flying Drones)
  updateEnemies(dt) {
    if (!this.currentLevel.enemies) return;
    const elapsed = (Date.now() - this.levelStartTime) / 1000;

    for (const en of this.currentLevel.enemies) {
      if (this.defeatedEnemies.includes(en.id)) continue;

      if (en.type === 'patroller') {
        // Linear bounce patrol
        if (!en.direction) en.direction = 1;
        en.x += en.direction * en.speed;
        if (en.x > en.maxX) {
          en.x = en.maxX;
          en.direction = -1;
        } else if (en.x < en.minX) {
          en.x = en.minX;
          en.direction = 1;
        }
      } else if (en.type === 'flying') {
        // Sinusoidal floating wave
        const cycle = (Math.sin(elapsed * en.frequency) + 1) / 2;
        en.x = en.minX + (en.maxX - en.minX) * cycle;
        en.y = en.baseY + Math.cos(elapsed * en.frequency * 1.5) * en.amplitude;
      }

      // Check collision with player
      const enBox = { x: en.x, y: en.y, width: en.width, height: en.height };
      if (this.checkOverlap(this.myPlayer, enBox)) {
        // If player is landing on top of patroller -> stomp defeat!
        if (this.myPlayer.vy > 1 && (this.myPlayer.y + this.myPlayer.height) < en.y + 12) {
          this.defeatEnemy(en.id);
          this.myPlayer.vy = -9; // Bounce up
        } else {
          this.handlePlayerHurt(this.myPlayer);
        }
      }
    }
  }

  checkBlockSquashEnemy(blockBox) {
    if (!this.currentLevel.enemies) return;
    for (const en of this.currentLevel.enemies) {
      if (this.defeatedEnemies.includes(en.id)) continue;
      const enBox = { x: en.x, y: en.y, width: en.width, height: en.height };
      if (this.checkOverlap(blockBox, enBox)) {
        this.defeatEnemy(en.id);
      }
    }
  }

  defeatEnemy(enemyId) {
    if (this.defeatedEnemies.includes(enemyId)) return;
    this.defeatedEnemies.push(enemyId);
    window.audioManager && window.audioManager.playEnemyDefeat();
    this.screenShake = 5;

    const en = this.currentLevel.enemies.find(e => e.id === enemyId);
    if (en) {
      this.createSpawnSparks(en.x + en.width / 2, en.y + en.height / 2, '#ff007f');
      this.addFloatingText(en.x, en.y - 20, "K.O!", '#ffd700', 18);
    }

    if (window.networkManager) {
      window.networkManager.emitDefeatEnemy(enemyId);
      window.networkManager.addScore(this.localSlot, 150);
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
    // Note: Players do NOT collide solidly with each other, allowing smooth passthrough without glitching/kicking

    for (const b of solidBoxes) {
      if (this.checkOverlap(p, b)) {
        if (p.vy > 0) {
          p.y = b.y - p.height;
          p.vy = 0;
          p.isGrounded = true;
          if (p.vy > 2.5) {
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
    // Moving platforms
    if (this.currentLevel.movingPlatforms) {
      for (const mp of this.currentLevel.movingPlatforms) {
        solids.push({
          x: mp.currentX || mp.x,
          y: mp.currentY || mp.y,
          width: mp.width,
          height: mp.height
        });
      }
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
    this.screenShake = 8;
    this.createSpawnSparks(p.x + p.width / 2, p.y + p.height / 2, '#ff1744');
    this.addFloatingText(p.x, p.y - 20, "Ouch!", '#ff1744', 18);
    
    // Respawn to start
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
      const keyBox = { x: key.x - 14, y: key.y - 14, width: 28, height: 28 };

      if (this.checkOverlap(this.myPlayer, keyBox)) {
        this.collectedKeys.push(key.id);
        window.audioManager && window.audioManager.playKey();
        this.createSpawnSparks(key.x, key.y, '#ffd700');
        this.addFloatingText(key.x, key.y - 25, "KUNCI DIAMBIL!", '#ffd700', 16);
        this.updateKeyUI();

        if (window.networkManager) {
          window.networkManager.emitCollectKey(key.id);
          window.networkManager.addScore(this.localSlot, 100);
        }

        if (this.collectedKeys.length === this.currentLevel.keys.length) {
          window.audioManager && window.audioManager.playDoorOpen();
          this.addFloatingText(this.myPlayer.x, this.myPlayer.y - 45, "PINTU TERBUKA! MENUJU PINTU!", '#00ffcc', 20);
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

    if (myAtDoor && (peerAtDoor || !this.peerPlayer.connected)) {
      this.createVictoryConfetti();
      if (!this.levelCompleted) {
        this.levelCompleted = true;
        window.audioManager && window.audioManager.playLevelComplete();
        this.addFloatingText(this.myPlayer.x, this.myPlayer.y - 45, "LEVEL SELESAI!", '#00ffcc', 24);

        if (window.networkManager) {
          window.networkManager.addScore(1, 300);
          window.networkManager.addScore(2, 300);
          window.networkManager.recordGamePlayed();
        }

        setTimeout(() => {
          this.levelCompleted = false;
          const nextLevelIdx = (this.currentLevelIndex + 1) % GAME_LEVELS.length;
          if (window.networkManager) {
            window.networkManager.broadcastLevelAdvance(nextLevelIdx);
          } else {
            this.loadLevel(nextLevelIdx);
          }
        }, 2200);
      }
    }
  }

  updateKeyUI() {
    const keyContainer = document.getElementById('keyTracker');
    if (!keyContainer) return;
    const total = this.currentLevel.keys.length;
    const collected = this.collectedKeys.length;
    keyContainer.innerHTML = `Kunci: <b>${collected} / ${total}</b>`;
  }

  updateCoupleLoveHearts() {
    if (!this.peerPlayer.connected) return;
    const dx = (this.myPlayer.x + 16) - (this.peerPlayer.x + 16);
    const dy = (this.myPlayer.y + 16) - (this.peerPlayer.y + 16);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 65 && Math.random() < 0.09) {
      const midX = (this.myPlayer.x + this.peerPlayer.x) / 2 + 16;
      const midY = (this.myPlayer.y + this.peerPlayer.y) / 2;
      this.particles.push({
        type: 'spark',
        x: midX + (Math.random() * 20 - 10),
        y: midY,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -1.3 - Math.random() * 0.8,
        color: '#ff3b77',
        radius: 3.5,
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
      for (let i = 0; i < 6; i++) {
        this.particles.push({
          type: 'confetti',
          x: this.camera.x + Math.random() * CANVAS_WIDTH,
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

  // ========================================================
  // RENDER ENGINE WITH 2.5D MULTI-LAYER PARALLAX & CAMERA TILT
  // ========================================================
  render() {
    const ctx = this.ctx;
    ctx.save();

    // Screen shake
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // LAYER 1: Distant Background (Parallax 0.05x)
    this.renderParallaxBackground(ctx);

    // Apply 2.5D Camera Translation & Dynamic Horizontal Tilt
    ctx.save();
    ctx.translate(-this.camera.x, 0);

    // Subtle 3D camera lean
    if (Math.abs(this.camera.tilt) > 0.001) {
      ctx.transform(1, 0, this.camera.tilt, 1, 0, 0);
    }

    // LAYER 2: Mid-ground Structures (Parallax 0.4x)
    this.renderMidgroundParallax(ctx);

    // LAYER 3: Main World Elements
    this.renderPlatforms(ctx);
    this.renderMovingPlatforms(ctx);
    this.renderSpikes(ctx);
    this.renderSprings(ctx);
    this.renderButtons(ctx);
    this.renderDoor(ctx);
    this.renderKeys(ctx);
    this.renderBlocks(ctx);
    this.renderEnemies(ctx);

    // Characters
    if (this.peerPlayer.connected) {
      this.renderCharacter(ctx, this.peerPlayer);
    }
    this.renderCharacter(ctx, this.myPlayer);

    // In-world particles
    this.renderParticles(ctx);

    // Overlays (Emotes, Floating texts)
    this.renderOverlays(ctx);

    ctx.restore(); // Restore camera translation

    // LAYER 4: Foreground Ambient Parallax (Floating Stardust/Spores)
    this.renderForegroundDust(ctx);

    ctx.restore();
  }

  // Multi-layer Parallax Sky & Cyber Mountains
  renderParallaxBackground(ctx) {
    // Deep twilight gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGrad.addColorStop(0, '#090d1a');
    skyGrad.addColorStop(0.5, '#12182c');
    skyGrad.addColorStop(1, '#241a38');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Distant Stars (scrolling slowly at 0.05x)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 50; i++) {
      const sx = ((i * 149 - this.camera.x * 0.05) % CANVAS_WIDTH + CANVAS_WIDTH) % CANVAS_WIDTH;
      const sy = (i * 97) % (CANVAS_HEIGHT - 120);
      ctx.fillRect(sx, sy, (i % 3 === 0) ? 2.5 : 1.5, (i % 3 === 0) ? 2.5 : 1.5);
    }

    // Distant Cyber Mountains silhouette (0.12x)
    const mtnOffset = -this.camera.x * 0.12;
    ctx.fillStyle = 'rgba(23, 28, 54, 0.6)';
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT);
    for (let x = 0; x <= CANVAS_WIDTH + 100; x += 80) {
      const peakY = 280 + Math.sin((x - mtnOffset) * 0.008) * 80 + Math.cos((x - mtnOffset) * 0.02) * 30;
      ctx.lineTo(x, peakY);
    }
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.closePath();
    ctx.fill();
  }

  // Midground floating pillars and neon skylines (0.35x)
  renderMidgroundParallax(ctx) {
    const mgOffset = this.camera.x * 0.65;
    ctx.fillStyle = 'rgba(38, 45, 84, 0.45)';
    for (let i = 0; i < 16; i++) {
      const px = i * 220 + 40;
      const py = 220 + ((i * 47) % 140);
      ctx.fillRect(px, py, 60, CANVAS_HEIGHT - py);
      
      // Neon edge
      ctx.fillStyle = 'rgba(0, 229, 255, 0.2)';
      ctx.fillRect(px, py, 60, 3);
      ctx.fillStyle = 'rgba(38, 45, 84, 0.45)';
    }
  }

  // 3D-Look Platforms with Depth Extrusion
  renderPlatforms(ctx) {
    for (const p of this.currentLevel.platforms) {
      if (p.type === 'barrier') {
        const lowered = this.isBarrierLowered(p.id);
        if (lowered) continue;

        // Laser barrier look
        ctx.fillStyle = 'rgba(255, 40, 80, 0.75)';
        ctx.fillRect(p.x, p.y, p.width, p.height);

        ctx.strokeStyle = '#ff1744';
        ctx.lineWidth = 3;
        ctx.strokeRect(p.x, p.y, p.width, p.height);

        ctx.fillStyle = '#ffffff';
        const stripeY = p.y + ((this.animTime * 140) % p.height);
        ctx.fillRect(p.x, stripeY, p.width, 4);
        continue;
      }

      // 3D Extrusion Side (Simulating block thickness/depth)
      const depthY = 12;
      ctx.fillStyle = '#171e3d';
      ctx.fillRect(p.x, p.y + p.height, p.width, depthY);

      // Main Platform Body
      ctx.fillStyle = '#263366';
      ctx.fillRect(p.x, p.y, p.width, p.height);

      // Top Cyber Grass/Rim (Neon Cyan)
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(p.x, p.y, p.width, 6);

      // Subtle 3D grid line
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(p.x, p.y, p.width, p.height);
    }
  }

  // Moving Platforms (with glowing gears / hover pads)
  renderMovingPlatforms(ctx) {
    if (!this.currentLevel.movingPlatforms) return;
    for (const mp of this.currentLevel.movingPlatforms) {
      const x = mp.currentX || mp.x;
      const y = mp.currentY || mp.y;

      ctx.save();
      // 3D Side
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(x, y + mp.height, mp.width, 6);

      // Platform body
      ctx.fillStyle = '#4338ca';
      this.drawRoundedRect(ctx, x, y, mp.width, mp.height, 4);
      ctx.fill();

      // Top glowing neon bar
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(x + 2, y, mp.width - 4, 4);

      // Glowing thrusters underneath
      ctx.fillStyle = '#00ffcc';
      ctx.fillRect(x + 12, y + mp.height + 4, 12, 4);
      ctx.fillRect(x + mp.width - 24, y + mp.height + 4, 12, 4);

      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      this.drawRoundedRect(ctx, x, y, mp.width, mp.height, 4);
      ctx.stroke();

      ctx.restore();
    }
  }

  // Springs / Bounce Trampoline Pads (with mechanical squish animation)
  renderSprings(ctx) {
    if (!this.currentLevel.springs) return;
    for (const sp of this.currentLevel.springs) {
      ctx.save();
      const squish = sp.squish !== undefined ? sp.squish : 1;
      const compression = (1 - squish) * 5; // Presses down when bounced

      // Base plate
      ctx.fillStyle = '#334155';
      ctx.fillRect(sp.x, sp.y + 8, sp.width, 6);

      // Coiled Spring
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sp.x + 8, sp.y + 8);
      ctx.lineTo(sp.x + 18, sp.y + 4 + compression);
      ctx.lineTo(sp.x + 26, sp.y + 8);
      ctx.stroke();

      // Top trampoline pad with subtle glow
      ctx.fillStyle = sp.cooldown > 0 ? '#10b981' : '#f59e0b';
      this.drawRoundedRect(ctx, sp.x, sp.y + compression, sp.width, 6, 3);
      ctx.fill();

      ctx.restore();
    }
  }

  // Enemies (Spike Slimes & Flying Drones)
  renderEnemies(ctx) {
    if (!this.currentLevel.enemies) return;
    const elapsed = (Date.now() - this.levelStartTime) / 1000;

    for (const en of this.currentLevel.enemies) {
      if (this.defeatedEnemies.includes(en.id)) continue;

      ctx.save();
      if (en.type === 'patroller') {
        // Spike Slime
        const squish = Math.sin(elapsed * 8) * 0.15;
        ctx.translate(en.x + en.width / 2, en.y + en.height);
        ctx.scale(1 + squish, 1 - squish);

        // Body
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.arc(0, -en.height / 2, en.width / 2, Math.PI, 0);
        ctx.lineTo(en.width / 2, 0);
        ctx.lineTo(-en.width / 2, 0);
        ctx.closePath();
        ctx.fill();

        // Top spike
        ctx.fillStyle = '#be185d';
        ctx.beginPath();
        ctx.moveTo(0, -en.height - 4);
        ctx.lineTo(6, -en.height + 2);
        ctx.lineTo(-6, -en.height + 2);
        ctx.closePath();
        ctx.fill();

        // Animated Slime Eye looking at player
        const lookDir = this.myPlayer.x < en.x ? -2.5 : 2.5;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -en.height / 2, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#831843';
        ctx.beginPath();
        ctx.arc(lookDir, -en.height / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (en.type === 'flying') {
        // Glitch Cyber Drone
        ctx.translate(en.x + en.width / 2, en.y + en.height / 2);

        // Rotating rotor blades
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2;
        const bladeW = Math.cos(elapsed * 25) * 16;
        ctx.beginPath();
        ctx.moveTo(-bladeW, -en.height / 2 - 2);
        ctx.lineTo(bladeW, -en.height / 2 - 2);
        ctx.stroke();

        // Drone metallic body
        ctx.fillStyle = '#374151';
        this.drawRoundedRect(ctx, -en.width / 2, -en.height / 2, en.width, en.height, 6);
        ctx.fill();

        // Glowing red sensor scanner
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 1.5;
        this.drawRoundedRect(ctx, -en.width / 2, -en.height / 2, en.width, en.height, 6);
        ctx.stroke();
      }
      ctx.restore();
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

      ctx.fillStyle = 'rgba(255, 23, 68, 0.25)';
      ctx.fillRect(sp.x, sp.y + 6, sp.width, sp.height);
    }
  }

  renderButtons(ctx) {
    for (const b of this.currentLevel.buttons) {
      const isPressed = this.pressedButtons.includes(b.id);
      const h = isPressed ? b.height * 0.4 : b.height;
      const y = isPressed ? b.y + b.height * 0.6 : b.y;

      ctx.fillStyle = '#37474f';
      ctx.fillRect(b.x - 4, b.y + b.height - 4, b.width + 8, 4);

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

    if (allKeysCollected) {
      const portalGrad = ctx.createLinearGradient(d.x, d.y, d.x + d.width, d.y + d.height);
      portalGrad.addColorStop(0, '#00e5ff');
      portalGrad.addColorStop(0.5, '#7c4dff');
      portalGrad.addColorStop(1, '#ff4081');
      ctx.fillStyle = portalGrad;
      ctx.fillRect(d.x, d.y, d.width, d.height);

      // Glowing geometric core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(d.x + d.width / 2, d.y + d.height / 2, 8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#334155';
      ctx.fillRect(d.x, d.y, d.width, d.height);

      // Crisp geometric padlock
      const cx = d.x + d.width / 2;
      const cy = d.y + d.height / 2;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 6, Math.PI, 0);
      ctx.stroke();

      ctx.fillStyle = '#cbd5e1';
      this.drawRoundedRect(ctx, cx - 8, cy - 2, 16, 12, 2);
      ctx.fill();
    }

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
      const bob = Math.sin(this.animTime * 4 + k.x) * 6;

      ctx.save();
      ctx.translate(k.x, k.y + bob);

      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 14;

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

      this.drawRoundedRect(ctx, b.x, b.y, b.width, b.height, 6);
      ctx.fill();

      // Top glossy highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      this.drawRoundedRect(ctx, b.x + 3, b.y + 3, b.width - 6, 8, 3);
      ctx.fill();

      // Geometric block pattern (clean, no emojis)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      const bx = b.x + b.width / 2;
      const by = b.y + b.height / 2;
      if (b.playerSlot === 1) {
        ctx.beginPath();
        ctx.moveTo(bx, by - 6);
        ctx.lineTo(bx + 6, by);
        ctx.lineTo(bx, by + 6);
        ctx.lineTo(bx - 6, by);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(bx, by, 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      this.drawRoundedRect(ctx, b.x, b.y, b.width, b.height, 6);
      ctx.stroke();

      ctx.restore();
    }
  }

  // Highly Expressive Cube Characters (Bobi & Bona)
  renderCharacter(ctx, p) {
    ctx.save();
    const cx = p.x + p.width / 2;
    const cy = p.y + p.height / 2;

    ctx.translate(cx, cy);

    // Apply movement tilt & dynamic squash/stretch
    ctx.rotate(p.tilt || 0);

    const isGrounded = p.isGrounded !== undefined ? p.isGrounded : true;
    const vy = p.vy || p.targetVy || 0;
    let baseSquashX = p.squashX || 1;
    let baseSquashY = p.squashY || 1;

    // Additional airborne stretch/squash for ultra-lively jump animations
    if (!isGrounded && vy < -1.5) {
      baseSquashX *= 0.92;
      baseSquashY *= 1.12;
    } else if (!isGrounded && vy > 1.8) {
      baseSquashX *= 1.06;
      baseSquashY *= 0.94;
    }

    ctx.scale(baseSquashX, baseSquashY);

    const w = p.width;
    const h = p.height;
    const halfW = w / 2;
    const halfH = h / 2;

    // Body shadow & box
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = p.color;
    this.drawRoundedRect(ctx, -halfW, -halfH, w, h, 8);
    ctx.fill();

    // Top glossy reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    this.drawRoundedRect(ctx, -halfW + 3, -halfH + 3, w - 6, 6, 3);
    ctx.fill();

    // Cute animated little feet (wobble when walking, tuck when jumping)
    const isWalking = Math.abs(p.vx || (p.targetVx || 0)) > 0.3 && isGrounded;
    const walkCycle = isWalking ? Math.sin((p.walkTime || 0) * 16) : 0;
    const isAirborne = !isGrounded;

    ctx.fillStyle = p.slot === 1 ? '#0077b6' : '#c2185b';
    ctx.shadowBlur = 0;
    if (isAirborne) {
      // Tucked feet while jumping/falling
      ctx.fillRect(-halfW + 5, halfH - 2, 7, 3);
      ctx.fillRect(halfW - 12, halfH - 2, 7, 3);
    } else {
      // Natural walking/standing feet
      ctx.fillRect(-halfW + 4, halfH - 3 + walkCycle * 2.5, 7, 4);
      ctx.fillRect(halfW - 11, halfH - 3 - walkCycle * 2.5, 7, 4);
    }

    // Rosy Cheeks
    ctx.fillStyle = p.slot === 1 ? 'rgba(0, 150, 255, 0.55)' : 'rgba(255, 60, 120, 0.65)';
    ctx.beginPath();
    ctx.arc(-halfW + 6, 4, 3.5, 0, Math.PI * 2);
    ctx.arc(halfW - 6, 4, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Eyes with look-direction tracking
    const eyeOffsetX = (p.facing || 1) * 3;
    const eyeOffsetY = Math.max(-2, Math.min(2, vy * 0.2));

    if (p.isBlinking) {
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-7 + eyeOffsetX, -2);
      ctx.lineTo(-2 + eyeOffsetX, -2);
      ctx.moveTo(2 + eyeOffsetX, -2);
      ctx.lineTo(7 + eyeOffsetX, -2);
      ctx.stroke();
    } else {
      // White eye sclera
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-5 + eyeOffsetX, -2 + eyeOffsetY, 4.5, 0, Math.PI * 2);
      ctx.arc(5 + eyeOffsetX, -2 + eyeOffsetY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Pupil
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-5 + eyeOffsetX * 1.3, -2 + eyeOffsetY, 2.5, 0, Math.PI * 2);
      ctx.arc(5 + eyeOffsetX * 1.3, -2 + eyeOffsetY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Catchlight spark
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-6 + eyeOffsetX * 1.3, -3 + eyeOffsetY, 1.2, 0, Math.PI * 2);
      ctx.arc(4 + eyeOffsetX * 1.3, -3 + eyeOffsetY, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mouth Expression (Excited open mouth on jump, wavy on fall, smile on idle/walk)
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    if (p.expression === 'jump' || (!isGrounded && vy < 0)) {
      // Cute excited open 'o' mouth
      ctx.fillStyle = '#ff6b81';
      ctx.arc(0, 3, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (p.expression === 'fall' || (!isGrounded && vy > 1.2)) {
      // Small wavy worried mouth
      ctx.moveTo(-3, 3);
      ctx.lineTo(3, 4);
      ctx.stroke();
    } else {
      // Gentle smile
      ctx.arc(0, 2, 3.5, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }

    // Distinguishing accessories
    if (p.slot === 1) {
      // Bobi's Gamer Cap
      ctx.fillStyle = '#0059b3';
      ctx.fillRect(-halfW - 2, -halfH - 4, w + 4, 6);
      ctx.fillRect(-halfW + 4, -halfH - 8, w - 8, 5);
      ctx.fillStyle = '#003d80';
      ctx.fillRect(p.facing > 0 ? -2 : -halfW - 6, -halfH - 2, halfW + 6, 3);
    } else {
      // Bona's geometric hairpin
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ff3b77';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(4, -halfH - 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Name tag
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    const tag = p.name ? (p.slot === this.localSlot ? `${p.name} (Kamu)` : p.name) : (p.slot === 1 ? 'Bobi' : 'Bona');
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
      if (p.type === 'confetti') {
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

  // Foreground ambient stardust (Parallax 1.3x)
  renderForegroundDust(ctx) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 20; i++) {
      const fx = ((i * 187 - this.camera.x * 1.3) % CANVAS_WIDTH + CANVAS_WIDTH) % CANVAS_WIDTH;
      const fy = ((i * 113 + this.animTime * 12) % CANVAS_HEIGHT);
      ctx.beginPath();
      ctx.arc(fx, fy, (i % 2 === 0) ? 2 : 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderOverlays(ctx) {
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
