// Block Couple - Multi-Genre Co-op Game Engine Modes
// Extends GameEngine with Shooter, Tank, Pacman, Math, Pong, and Snake modes!

(function () {
  if (typeof window === 'undefined') return;

  function drawRoundRect(ctx, x, y, w, h, r = 4) {
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.rect(x, y, w, h);
    }
  }

  // Precise Circle to AABB Rectangle Overlap test
  function circleRectOverlap(cx, cy, radius, rx, ry, rw, rh) {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) < (radius * radius);
  }

  // Initialize Game Mode Extension
  function attachGameModes(GameEngine) {
    if (!GameEngine || !GameEngine.prototype) return;

    // --- Master Mode Switcher ---
    GameEngine.prototype.loadGame = function (gameId, levelIndex = 0, startTime = Date.now(), restorePos = null) {
      this.currentGameId = Number(gameId) || 1;
      const gameDef = (window.COOP_GAMES || []).find(g => Number(g.id) === this.currentGameId) || window.COOP_GAMES[0];
      this.gameMode = gameDef ? (gameDef.mode || 'platformer') : 'platformer';
      this.gameTitle = gameDef ? gameDef.title : 'Petualangan Co-op';

      // Clear all prior mode states so no residual objects or banners linger
      this.floatingTexts = [];
      this.particles = [];
      this.shooter = null;
      this.tank = null;
      this.pacman = null;
      this.math = null;
      this.pong = null;
      this.snake = null;

      // Update HUD Labels based on mode
      this.updateModeControls();

      // Update in-game HUD Level Title
      const titleEl = document.getElementById('levelTitle');
      if (titleEl) titleEl.innerText = this.gameTitle;

      // Toggle key tracker visibility
      const keyTracker = document.getElementById('keyTracker');
      if (keyTracker) {
        if (this.gameMode === 'platformer') {
          keyTracker.classList.remove('hidden');
        } else {
          keyTracker.classList.add('hidden');
        }
      }

      if (this.gameMode === 'shooter') {
        this.initShooterMode(levelIndex);
      } else if (this.gameMode === 'tank') {
        this.initTankMode(levelIndex);
      } else if (this.gameMode === 'pacman') {
        this.initPacmanMode(levelIndex);
      } else if (this.gameMode === 'math') {
        this.initMathMode(levelIndex);
      } else if (this.gameMode === 'pong') {
        this.initPongMode(levelIndex);
      } else if (this.gameMode === 'snake') {
        this.initSnakeMode(levelIndex);
      } else {
        // Default Platformer Duo Quest
        this.loadLevel(levelIndex, startTime, restorePos);
      }
    };

    // Shared explosion particle generator
    GameEngine.prototype.createExplosion = function (x, y, color = '#ffd700', count = 14) {
      if (!this.particles) this.particles = [];
      const n = count || 14;
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 / n) * i + (Math.random() - 0.5) * 0.4;
        const speed = 2 + Math.random() * 4;
        this.particles.push({
          type: 'spark',
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: color || '#ffd700',
          radius: 2.5 + Math.random() * 2,
          alpha: 1,
          life: 0.5 + Math.random() * 0.4
        });
      }
      if (window.audioManager) {
        try {
          if (typeof window.audioManager.playExplosion === 'function') {
            window.audioManager.playExplosion();
          } else if (typeof window.audioManager.playEnemyDefeat === 'function') {
            window.audioManager.playEnemyDefeat();
          }
        } catch (e) { }
      }
    };

    // Universal In-Canvas Glassmorphic HUD Renderer
    // Renders complete, polished, never-cut-off game metrics across all arcade modes
    GameEngine.prototype.renderCanvasHUD = function (options) {
      const ctx = this.ctx;
      const {
        leftBadge = '',
        leftColor = '#00e5ff',
        centerBadge = '',
        centerColor = '#f59e0b',
        rightBadge = '',
        rightColor = '#ffd700'
      } = options;

      ctx.save();
      const topY = 14;
      const height = 34;

      // 1. Left HUD Badge Pill
      if (leftBadge) {
        ctx.font = '800 14px Outfit, sans-serif';
        const leftText = leftBadge;
        const textWidth = ctx.measureText(leftText).width;
        const pillW = Math.max(120, textWidth + 28);
        const pillX = 24;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.40)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        drawRoundRect(ctx, pillX, topY, pillW, height, 17);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = leftColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(leftText, pillX + pillW / 2, topY + height / 2 + 1);
      }

      // 2. Center HUD Badge Pill
      if (centerBadge) {
        ctx.font = '800 14px Outfit, sans-serif';
        const centerText = centerBadge;
        const textWidth = ctx.measureText(centerText).width;
        const pillW = Math.max(150, textWidth + 32);
        const pillX = 480 - pillW / 2;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        drawRoundRect(ctx, pillX, topY, pillW, height, 17);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = centerColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(centerText, 480, topY + height / 2 + 1);
      }

      // 3. Right Score HUD Badge Pill (ALWAYS right-aligned, 24px safe margin from 960 edge)
      if (rightBadge) {
        ctx.font = '800 15px Outfit, sans-serif';
        const rightText = rightBadge;
        const textWidth = ctx.measureText(rightText).width;
        const pillW = Math.max(140, textWidth + 32);
        const pillX = 936 - pillW; // Safely lands at 936, NEVER cuts off at 960

        ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.50)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        drawRoundRect(ctx, pillX, topY, pillW, height, 17);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = rightColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(rightText, pillX + pillW / 2, topY + height / 2 + 1);
      }

      ctx.restore();
    };

    // Update Touch Controls & HUD text for each mode
    GameEngine.prototype.updateModeControls = function () {
      const btnJump = document.getElementById('btnJump');
      const btnPlace = document.getElementById('btnPlace');
      const btnClear = document.getElementById('btnClear');
      const btnUp = document.getElementById('btnUp');
      const banner = document.getElementById('hintBanner');

      if (this.gameMode === 'shooter') {
        if (btnJump) btnJump.querySelector('.btn-main-label').innerText = 'TEMBAK';
        if (btnPlace) btnPlace.querySelector('.btn-main-label').innerText = 'BOM';
        if (btnClear) btnClear.classList.add('hidden');
        if (btnUp) btnUp.classList.add('hidden');
        if (banner) banner.innerText = 'Gunakan tombol [KIRI] & [KANAN] untuk menghindar, dan [TEMBAK] untuk tembak alien!';
      } else if (this.gameMode === 'tank') {
        if (btnJump) btnJump.querySelector('.btn-main-label').innerText = 'TEMBAK';
        if (btnPlace) btnPlace.querySelector('.btn-main-label').innerText = 'PERISAI';
        if (btnClear) btnClear.classList.add('hidden');
        if (btnUp) btnUp.classList.remove('hidden');
        if (banner) banner.innerText = 'Kendalikan tank dengan 4 arah, hancurkan bata rintangan dan tembak tank musuh!';
      } else if (this.gameMode === 'pacman') {
        if (btnJump) btnJump.querySelector('.btn-main-label').innerText = 'TURBO';
        if (btnPlace) btnPlace.classList.add('hidden');
        if (btnClear) btnClear.classList.add('hidden');
        if (btnUp) btnUp.classList.remove('hidden');
        if (banner) banner.innerText = 'Makan semua titik energi di labirin! Hindari hantu atau makan Pelet Bintang untuk membalas!';
      } else if (this.gameMode === 'math') {
        if (btnJump) btnJump.querySelector('.btn-main-label').innerText = 'LOMPAT';
        if (btnPlace) btnPlace.classList.remove('hidden');
        if (btnPlace) btnPlace.querySelector('.btn-main-label').innerText = 'INJAK';
        if (btnClear) btnClear.classList.add('hidden');
        if (btnUp) btnUp.classList.remove('hidden');
        if (banner) banner.innerText = 'Pecahkan soal matematika di atas! Lompat dan injak portal angka yang benar bersama partner!';
      } else if (this.gameMode === 'snake') {
        if (btnJump) btnJump.querySelector('.btn-main-label').innerText = 'BAWAH';
        if (btnPlace) btnPlace.classList.remove('hidden');
        if (btnPlace) btnPlace.querySelector('.btn-main-label').innerText = 'TURBO';
        if (btnClear) btnClear.classList.add('hidden');
        if (btnUp) btnUp.classList.remove('hidden');
        if (banner) banner.innerText = 'Kendalikan ular dengan 4 arah! Makan bintang energi emas dan raih rekor skor bersama partner!';
      } else if (this.gameMode === 'pong') {
        if (btnJump) btnJump.querySelector('.btn-main-label').innerText = 'BAWAH';
        if (btnPlace) btnPlace.classList.add('hidden');
        if (btnClear) btnClear.classList.add('hidden');
        if (btnUp) btnUp.classList.remove('hidden');
        if (banner) banner.innerText = 'Gerakkan raket ke atas & bawah untuk menangkis bola energi neon bersama partner!';
      } else {
        // Platformer
        if (btnJump) btnJump.querySelector('.btn-main-label').innerText = 'LOMPAT';
        if (btnPlace) btnPlace.classList.remove('hidden');
        if (btnPlace) btnPlace.querySelector('.btn-main-label').innerText = 'BALOK';
        if (btnClear) btnClear.classList.remove('hidden');
        if (btnClear) btnClear.querySelector('.btn-main-label').innerText = 'HAPUS';
        if (btnUp) btnUp.classList.remove('hidden');
        if (banner) banner.innerText = 'Gunakan tombol [Buat Balok] untuk jembatan jurang, dan hindari / kurung monster lendir!';
      }
    };

    // ========================================================
    // 1. SHOOTER MODE (SPACE BLASTER & ALIEN INVASION)
    // ========================================================
    GameEngine.prototype.initShooterMode = function (levelIndex) {
      this.camera.x = 0;
      this.camera.y = 0;
      this.camera.targetX = 0;
      this.camera.tilt = 0;

      // P1 & P2 Spaceships
      this.myPlayer.x = this.localSlot === 1 ? 320 : 600;
      this.myPlayer.y = 450;
      this.myPlayer.vx = 0;
      this.myPlayer.vy = 0;
      this.peerPlayer.x = this.localSlot === 1 ? 600 : 320;
      this.peerPlayer.y = 450;
      this.peerPlayer.vx = 0;
      this.peerPlayer.vy = 0;

      this.shooter = {
        wave: levelIndex + 1,
        score: 0,
        shootCooldown: 0,
        lasers: [],
        enemyBullets: [],
        aliens: [],
        stars: [],
        waveCleared: false,
        waveTimer: 0
      };

      // Generate Background Starfield
      for (let i = 0; i < 70; i++) {
        this.shooter.stars.push({
          x: Math.random() * 960,
          y: Math.random() * 540,
          speed: 40 + Math.random() * 120,
          size: 1 + Math.random() * 2,
          color: Math.random() > 0.5 ? '#00e5ff' : '#ffffff'
        });
      }

      this.spawnAlienWave();
      this.addFloatingText(480, 260, (this.gameTitle || 'DUO SPACE BLASTER').toUpperCase(), '#00e5ff', 28);
    };

    GameEngine.prototype.spawnAlienWave = function () {
      this.shooter.aliens = [];
      const rows = 3;
      const cols = 7;
      const startX = 140;
      const startY = 80;
      const spacingX = 100;
      const spacingY = 55;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          this.shooter.aliens.push({
            x: startX + c * spacingX,
            y: startY + r * spacingY,
            vx: 60 + this.shooter.wave * 12,
            hp: r === 0 ? 2 : 1,
            maxHp: r === 0 ? 2 : 1,
            type: r === 0 ? 'commander' : (r === 1 ? 'saucer' : 'drone'),
            shootTimer: 1.5 + Math.random() * 4
          });
        }
      }
    };

    GameEngine.prototype.updateShooter = function (dt) {
      const s = this.shooter;
      if (!s) return;

      // Update Starfield
      for (const star of s.stars) {
        star.y += star.speed * dt;
        if (star.y > 540) {
          star.y = 0;
          star.x = Math.random() * 960;
        }
      }

      // Local Ship Movement
      let moveDir = 0;
      if (this.keysDown['arrowleft'] || this.keysDown['a'] || this.touchState.left) moveDir -= 1;
      if (this.keysDown['arrowright'] || this.keysDown['d'] || this.touchState.right) moveDir += 1;

      this.myPlayer.x += moveDir * 360 * dt;
      this.myPlayer.x = Math.max(40, Math.min(920, this.myPlayer.x));

      // Local Ship Shooting
      s.shootCooldown -= dt;
      const wantsShoot = this.keysDown[' '] || this.keysDown['arrowup'] || this.keysDown['w'] || this.touchState.jump;
      if (wantsShoot && s.shootCooldown <= 0) {
        s.shootCooldown = 0.22;
        const color = this.localSlot === 1 ? '#00e5ff' : '#ff3b77';
        // Dual laser
        s.lasers.push({ x: this.myPlayer.x - 12, y: this.myPlayer.y - 10, vy: -650, color, owner: this.localSlot });
        s.lasers.push({ x: this.myPlayer.x + 12, y: this.myPlayer.y - 10, vy: -650, color, owner: this.localSlot });
        if (window.audioManager) {
          try {
            if (typeof window.audioManager.playLaser === 'function') window.audioManager.playLaser();
            else if (typeof window.audioManager.playJump === 'function') window.audioManager.playJump();
          } catch (e) { }
        }
      }

      // Update Lasers
      for (let i = s.lasers.length - 1; i >= 0; i--) {
        const l = s.lasers[i];
        l.y += l.vy * dt;

        // Collision with Aliens
        let hit = false;
        for (let j = s.aliens.length - 1; j >= 0; j--) {
          const a = s.aliens[j];
          if (Math.abs(l.x - a.x) < 24 && Math.abs(l.y - a.y) < 20) {
            hit = true;
            a.hp -= 1;
            if (a.hp <= 0) {
              // Destroy alien
              this.createExplosion(a.x, a.y, '#10b981', 18);
              s.aliens.splice(j, 1);
              s.score += 100;
              this.addFloatingText(a.x, a.y - 10, '+100', '#ffd700', 18);
              if (window.audioManager && typeof window.audioManager.playEnemyDefeat === 'function') {
                try { window.audioManager.playEnemyDefeat(); } catch (e) { }
              }
            } else {
              this.createExplosion(a.x, a.y, '#ffd700', 6);
            }
            break;
          }
        }

        if (hit || l.y < -20) {
          s.lasers.splice(i, 1);
        }
      }

      // Update Aliens Patrol & Descend
      let hitEdge = false;
      for (const a of s.aliens) {
        a.x += a.vx * dt;
        if (a.x < 50 || a.x > 910) hitEdge = true;

        // Alien shooting
        a.shootTimer -= dt;
        if (a.shootTimer <= 0) {
          a.shootTimer = 2.5 + Math.random() * 3.5;
          s.enemyBullets.push({ x: a.x, y: a.y + 16, vy: 240 });
        }
      }

      if (hitEdge) {
        for (const a of s.aliens) {
          a.vx = -a.vx;
          a.y += 20;
        }
      }

      // Update Enemy Bullets
      for (let i = s.enemyBullets.length - 1; i >= 0; i--) {
        const b = s.enemyBullets[i];
        b.y += b.vy * dt;
        if (b.y > 550) s.enemyBullets.splice(i, 1);
      }

      // Wave Complete Check
      if (s.aliens.length === 0 && !s.waveCleared) {
        s.waveCleared = true;
        s.waveTimer = 3;
        this.addFloatingText(480, 240, 'WAVE BERSIH! +500 PTS', '#00e5ff', 32);
        s.score += 500;
        if (window.audioManager && typeof window.audioManager.playDoorOpen === 'function') {
          try { window.audioManager.playDoorOpen(); } catch (e) { }
        }
      }

      if (s.waveCleared) {
        s.waveTimer -= dt;
        if (s.waveTimer <= 0) {
          s.wave++;
          s.waveCleared = false;
          this.spawnAlienWave();
        }
      }

      // Peer Ship Interpolation
      this.updatePeerInterpolation(dt);
      this.updateParticles(dt);
    };

    GameEngine.prototype.renderShooter = function () {
      const ctx = this.ctx;
      const s = this.shooter;

      // Background Starfield
      ctx.fillStyle = '#060a16';
      ctx.fillRect(0, 0, 960, 540);

      // Stars
      for (const star of s.stars) {
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render Lasers
      for (const l of s.lasers) {
        ctx.save();
        ctx.fillStyle = l.color;
        ctx.shadowColor = l.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(l.x - 2.5, l.y - 12, 5, 20);
        ctx.restore();
      }

      // Render Enemy Bullets
      for (const b of s.enemyBullets) {
        ctx.save();
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Render Aliens
      for (const a of s.aliens) {
        this.drawAlienSaucer(ctx, a.x, a.y, a.type, a.hp);
      }

      // Render Ships
      this.drawSpaceShip(ctx, this.myPlayer.x, this.myPlayer.y, this.localSlot === 1 ? 'bobi' : 'bona');
      if (this.peerPlayer.connected) {
        this.drawSpaceShip(ctx, this.peerPlayer.x, this.peerPlayer.y, this.localSlot === 1 ? 'bona' : 'bobi');
      }

      // Particles & Floating Text
      this.renderParticles(ctx);
      this.renderFloatingTexts(ctx);

      // Modern Never-Cut-Off Canvas HUD
      this.renderCanvasHUD({
        leftBadge: `GELOMBANG: ${s.wave}  |  ALIEN: ${s.aliens.length}`,
        leftColor: '#00e5ff',
        centerBadge: (this.gameTitle || 'DUO SPACE BLASTER').toUpperCase(),
        centerColor: '#c084fc',
        rightBadge: `SKOR: ${s.score} PTS`,
        rightColor: '#ffd700'
      });
    };

    GameEngine.prototype.drawSpaceShip = function (ctx, x, y, type) {
      ctx.save();
      ctx.translate(x, y);

      const color = type === 'bobi' ? '#00e5ff' : '#ff3b77';
      const engineColor = type === 'bobi' ? '#38bdf8' : '#f43f5e';

      // Thruster Flame
      ctx.fillStyle = engineColor;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(-8, 16);
      ctx.lineTo(0, 24 + Math.random() * 8);
      ctx.lineTo(8, 16);
      ctx.closePath();
      ctx.fill();

      // Ship Hull (Aerodynamic Delta Wing)
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(18, 14);
      ctx.lineTo(8, 12);
      ctx.lineTo(0, 16);
      ctx.lineTo(-8, 12);
      ctx.lineTo(-18, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cockpit Window (Mascot face inside!)
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, -2, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pilot Eyes
      ctx.fillStyle = '#000';
      ctx.fillRect(-3, -4, 2, 3);
      ctx.fillRect(2, -4, 2, 3);

      ctx.restore();
    };

    GameEngine.prototype.drawAlienSaucer = function (ctx, x, y, type, hp) {
      ctx.save();
      ctx.translate(x, y);

      const hullColor = type === 'commander' ? '#ec4899' : (type === 'saucer' ? '#10b981' : '#a855f7');

      // Saucer Dome
      ctx.fillStyle = '#00e5ff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, -6, 9, Math.PI, 0);
      ctx.fill();

      // Alien Eyes inside dome
      ctx.fillStyle = '#000';
      ctx.fillRect(-4, -8, 2, 3);
      ctx.fillRect(2, -8, 2, 3);

      // Saucer Disc
      ctx.fillStyle = hullColor;
      ctx.shadowColor = hullColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Blinking Navigation Lights
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(-12, 1, 2, 0, Math.PI * 2);
      ctx.arc(0, 2, 2, 0, Math.PI * 2);
      ctx.arc(12, 1, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    // ========================================================
    // 2. TANK BATTLE MODE (DUO TANK BAJA 2D WITH ADAPTIVE AI)
    // ========================================================
    GameEngine.prototype.initTankMode = function (levelIndex) {
      this.camera.x = 0;
      this.camera.y = 0;
      this.camera.targetX = 0;
      this.camera.tilt = 0;

      // P1 & P2 Tanks
      this.myPlayer.x = this.localSlot === 1 ? 120 : 120;
      this.myPlayer.y = this.localSlot === 1 ? 200 : 340;
      this.myPlayer.angle = 0; // facing right
      this.myPlayer.hurtTimer = 0;
      this.peerPlayer.x = this.localSlot === 1 ? 120 : 120;
      this.peerPlayer.y = this.localSlot === 1 ? 340 : 200;
      this.peerPlayer.angle = 0;
      this.peerPlayer.hurtTimer = 0;

      const level = Math.max(1, Math.min(10, (levelIndex || 0) + 1));
      this.tankLevelIndex = levelIndex || 0;
      const difficultyNames = [
        'Mudah', 'Normal', 'Siaga', 'Tangguh', 'Sulit',
        'Pakar', 'Komandan', 'Master', 'Ekstrim', 'Neraka Baja'
      ];
      const diffName = difficultyNames[level - 1] || 'Normal';

      this.tank = {
        level: level,
        diffName: diffName,
        score: (this.tank && this.tank.score) || 0,
        shells: [],
        cooldown: 0,
        bricks: [],
        enemyTanks: [],
        cleared: false
      };

      // Generate Destructible Brick Barriers
      const layout = [
        { x: 340, y: 120, w: 40, h: 100 },
        { x: 340, y: 320, w: 40, h: 100 },
        { x: 480, y: 200, w: 40, h: 140 },
        { x: 620, y: 120, w: 40, h: 100 },
        { x: 620, y: 320, w: 40, h: 100 }
      ];

      for (const block of layout) {
        for (let bx = block.x; bx < block.x + block.w; bx += 20) {
          for (let by = block.y; by < block.y + block.h; by += 20) {
            this.tank.bricks.push({ x: bx, y: by, w: 18, h: 18, hp: 1 });
          }
        }
      }

      // Generate Enemy Tanks based on chosen difficulty level
      const enemyConfigs = [];
      if (level === 1) {
        enemyConfigs.push(
          { x: 820, y: 150, type: 'standard', hp: 1, maxHp: 1, color: '#ef4444', speed: 80, shootInterval: 4.2 },
          { x: 820, y: 390, type: 'standard', hp: 1, maxHp: 1, color: '#ef4444', speed: 80, shootInterval: 4.5 }
        );
      } else if (level === 2) {
        enemyConfigs.push(
          { x: 820, y: 140, type: 'standard', hp: 1, maxHp: 1, color: '#ef4444', speed: 95, shootInterval: 3.6 },
          { x: 820, y: 400, type: 'standard', hp: 1, maxHp: 1, color: '#ef4444', speed: 95, shootInterval: 3.8 }
        );
      } else if (level === 3) {
        enemyConfigs.push(
          { x: 820, y: 120, type: 'standard', hp: 1, maxHp: 1, color: '#ef4444', speed: 105, shootInterval: 3.2 },
          { x: 820, y: 420, type: 'standard', hp: 1, maxHp: 1, color: '#ef4444', speed: 105, shootInterval: 3.2 },
          { x: 740, y: 270, type: 'scout', hp: 1, maxHp: 1, color: '#f97316', speed: 135, shootInterval: 2.8 }
        );
      } else if (level === 4) {
        enemyConfigs.push(
          { x: 820, y: 120, type: 'heavy', hp: 2, maxHp: 2, color: '#b91c1c', speed: 95, shootInterval: 2.6 },
          { x: 820, y: 420, type: 'standard', hp: 1, maxHp: 1, color: '#ef4444', speed: 120, shootInterval: 2.8 },
          { x: 740, y: 270, type: 'scout', hp: 1, maxHp: 1, color: '#f97316', speed: 145, shootInterval: 2.4 }
        );
      } else if (level === 5) {
        enemyConfigs.push(
          { x: 820, y: 100, type: 'heavy', hp: 2, maxHp: 2, color: '#b91c1c', speed: 105, shootInterval: 2.3 },
          { x: 820, y: 440, type: 'heavy', hp: 2, maxHp: 2, color: '#b91c1c', speed: 105, shootInterval: 2.3 },
          { x: 740, y: 200, type: 'scout', hp: 1, maxHp: 1, color: '#f97316', speed: 160, shootInterval: 2.0 },
          { x: 740, y: 340, type: 'standard', hp: 1, maxHp: 1, color: '#ef4444', speed: 130, shootInterval: 2.2 }
        );
      } else if (level === 6) {
        enemyConfigs.push(
          { x: 820, y: 100, type: 'heavy', hp: 2, maxHp: 2, color: '#b91c1c', speed: 115, shootInterval: 2.0 },
          { x: 820, y: 440, type: 'heavy', hp: 2, maxHp: 2, color: '#b91c1c', speed: 115, shootInterval: 2.0 },
          { x: 740, y: 190, type: 'scout', hp: 1, maxHp: 1, color: '#f97316', speed: 170, shootInterval: 1.8 },
          { x: 740, y: 350, type: 'scout', hp: 1, maxHp: 1, color: '#f97316', speed: 170, shootInterval: 1.8 }
        );
      } else if (level === 7) {
        enemyConfigs.push(
          { x: 840, y: 270, type: 'commander', hp: 3, maxHp: 3, color: '#7c3aed', speed: 125, shootInterval: 1.6 },
          { x: 820, y: 110, type: 'heavy', hp: 2, maxHp: 2, color: '#b91c1c', speed: 120, shootInterval: 1.9 },
          { x: 820, y: 430, type: 'heavy', hp: 2, maxHp: 2, color: '#b91c1c', speed: 120, shootInterval: 1.9 },
          { x: 720, y: 270, type: 'scout', hp: 1, maxHp: 1, color: '#f97316', speed: 180, shootInterval: 1.6 }
        );
      } else if (level === 8) {
        enemyConfigs.push(
          { x: 840, y: 270, type: 'commander', hp: 3, maxHp: 3, color: '#7c3aed', speed: 135, shootInterval: 1.4 },
          { x: 820, y: 100, type: 'heavy', hp: 2, maxHp: 2, color: '#b91c1c', speed: 125, shootInterval: 1.6 },
          { x: 820, y: 440, type: 'heavy', hp: 2, maxHp: 2, color: '#b91c1c', speed: 125, shootInterval: 1.6 },
          { x: 740, y: 180, type: 'scout', hp: 1, maxHp: 1, color: '#f97316', speed: 190, shootInterval: 1.4 },
          { x: 740, y: 360, type: 'scout', hp: 1, maxHp: 1, color: '#f97316', speed: 190, shootInterval: 1.4 }
        );
      } else if (level === 9) {
        enemyConfigs.push(
          { x: 840, y: 200, type: 'commander', hp: 3, maxHp: 3, color: '#7c3aed', speed: 145, shootInterval: 1.2 },
          { x: 840, y: 340, type: 'commander', hp: 3, maxHp: 3, color: '#7c3aed', speed: 145, shootInterval: 1.2 },
          { x: 820, y: 90, type: 'heavy', hp: 2, maxHp: 2, color: '#b91c1c', speed: 135, shootInterval: 1.4 },
          { x: 820, y: 450, type: 'heavy', hp: 2, maxHp: 2, color: '#b91c1c', speed: 135, shootInterval: 1.4 },
          { x: 730, y: 270, type: 'scout', hp: 1, maxHp: 1, color: '#f97316', speed: 200, shootInterval: 1.2 }
        );
      } else {
        // Level 10: Neraka Baja
        enemyConfigs.push(
          { x: 850, y: 270, type: 'titan', hp: 4, maxHp: 4, color: '#d946ef', speed: 160, shootInterval: 1.0 },
          { x: 830, y: 120, type: 'commander', hp: 3, maxHp: 3, color: '#7c3aed', speed: 150, shootInterval: 1.1 },
          { x: 830, y: 420, type: 'commander', hp: 3, maxHp: 3, color: '#7c3aed', speed: 150, shootInterval: 1.1 },
          { x: 750, y: 100, type: 'heavy', hp: 2, maxHp: 2, color: '#b91c1c', speed: 140, shootInterval: 1.3 },
          { x: 750, y: 440, type: 'heavy', hp: 2, maxHp: 2, color: '#b91c1c', speed: 140, shootInterval: 1.3 },
          { x: 720, y: 270, type: 'scout', hp: 1, maxHp: 1, color: '#f97316', speed: 215, shootInterval: 1.0 }
        );
      }

      for (const cfg of enemyConfigs) {
        this.tank.enemyTanks.push({
          x: cfg.x,
          y: cfg.y,
          angle: Math.PI, // Facing player (left)
          vx: 0,
          vy: 0,
          speed: cfg.speed,
          shootInterval: cfg.shootInterval,
          shootCooldown: 1.5 + Math.random() * 2,
          thinkTimer: Math.random() * 0.5,
          type: cfg.type,
          hp: cfg.hp,
          maxHp: cfg.maxHp,
          color: cfg.color
        });
      }

      this.addFloatingText(480, 260, `DUO TANK: LEVEL ${level} (${diffName.toUpperCase()})`, '#00e5ff', 28);
    };

    GameEngine.prototype.updateTank = function (dt) {
      const t = this.tank;
      if (!t) return;

      const level = t.level || 1;

      // Hurt timer countdown
      if (this.myPlayer.hurtTimer > 0) this.myPlayer.hurtTimer -= dt;
      if (this.peerPlayer.hurtTimer > 0) this.peerPlayer.hurtTimer -= dt;

      // Anti-stuck safety guard for tank: if ever caught inside a brick, relocate to base
      for (const b of t.bricks) {
        if (circleRectOverlap(this.myPlayer.x, this.myPlayer.y, 16, b.x, b.y, 20, 20)) {
          this.myPlayer.x = 120;
          this.myPlayer.y = this.localSlot === 1 ? 200 : 340;
          break;
        }
      }

      // Tank 4-way Control
      let vx = 0;
      let vy = 0;
      if (this.keysDown['arrowleft'] || this.keysDown['a'] || this.touchState.left) vx -= 1;
      if (this.keysDown['arrowright'] || this.keysDown['d'] || this.touchState.right) vx += 1;
      if (this.keysDown['arrowup'] || this.keysDown['w'] || this.touchState.up) vy -= 1;
      if (this.keysDown['arrowdown'] || this.keysDown['s'] || this.touchState.down) vy += 1;

      const speed = 200;
      if (vx !== 0 || vy !== 0) {
        this.myPlayer.angle = Math.atan2(vy, vx);

        // Axis-separated movement with brick collision check (tank radius = 18)
        let nextX = this.myPlayer.x + vx * speed * dt;
        nextX = Math.max(50, Math.min(910, nextX));
        let blockedX = false;
        for (const b of t.bricks) {
          if (circleRectOverlap(nextX, this.myPlayer.y, 18, b.x, b.y, 20, 20)) {
            blockedX = true;
            break;
          }
        }
        if (!blockedX) this.myPlayer.x = nextX;

        let nextY = this.myPlayer.y + vy * speed * dt;
        nextY = Math.max(50, Math.min(490, nextY));
        let blockedY = false;
        for (const b of t.bricks) {
          if (circleRectOverlap(this.myPlayer.x, nextY, 18, b.x, b.y, 20, 20)) {
            blockedY = true;
            break;
          }
        }
        if (!blockedY) this.myPlayer.y = nextY;
      }

      // Broadcast position and angle to peer via network
      if (window.networkManager && typeof window.networkManager.emitPlayerUpdate === 'function') {
        window.networkManager.emitPlayerUpdate({
          x: this.myPlayer.x,
          y: this.myPlayer.y,
          angle: this.myPlayer.angle,
          vx: vx * speed,
          vy: vy * speed
        });
      }

      // Firing Cannon
      t.cooldown -= dt;
      const wantsFire = this.keysDown[' '] || this.touchState.jump;
      if (wantsFire && t.cooldown <= 0) {
        t.cooldown = 0.35;
        const ang = this.myPlayer.angle || 0;
        t.shells.push({
          x: this.myPlayer.x + Math.cos(ang) * 24,
          y: this.myPlayer.y + Math.sin(ang) * 24,
          vx: Math.cos(ang) * 480,
          vy: Math.sin(ang) * 480,
          bounces: 1,
          owner: this.localSlot,
          color: '#ffd700'
        });
        if (window.audioManager) {
          try {
            if (typeof window.audioManager.playLaser === 'function') window.audioManager.playLaser();
            else if (typeof window.audioManager.playSpringBounce === 'function') window.audioManager.playSpringBounce();
          } catch (e) { }
        }
      }

      // Update Shells
      for (let i = t.shells.length - 1; i >= 0; i--) {
        const s = t.shells[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;

        // Bounce on boundary
        if (s.x < 20 || s.x > 940) {
          s.vx = -s.vx;
          s.bounces = (s.bounces || 0) - 1;
        }
        if (s.y < 20 || s.y > 520) {
          s.vy = -s.vy;
          s.bounces = (s.bounces || 0) - 1;
        }

        // Hit Brick Walls
        let hit = false;
        for (let j = t.bricks.length - 1; j >= 0; j--) {
          const b = t.bricks[j];
          if (Math.abs(s.x - b.x) < 14 && Math.abs(s.y - b.y) < 14) {
            hit = true;
            this.createExplosion(b.x, b.y, '#f97316', 10);
            t.bricks.splice(j, 1);
            break;
          }
        }

        // Hit Enemy Tanks (if player shell)
        if (!hit && s.owner !== 'enemy') {
          for (let k = t.enemyTanks.length - 1; k >= 0; k--) {
            const e = t.enemyTanks[k];
            if (Math.abs(s.x - e.x) < 22 && Math.abs(s.y - e.y) < 22) {
              hit = true;
              e.hp = (e.hp || 1) - 1;
              if (e.hp <= 0) {
                this.createExplosion(e.x, e.y, e.color || '#ef4444', 25);
                t.enemyTanks.splice(k, 1);
                const pts = (e.maxHp || 1) * 150 + 100;
                t.score += pts;
                this.addFloatingText(e.x, e.y - 12, `+${pts} TANK HANCUR!`, '#ffd700', 20);
                if (window.audioManager && typeof window.audioManager.playEnemyDefeat === 'function') {
                  try { window.audioManager.playEnemyDefeat(); } catch (e) { }
                }

                // Check victory / level clear
                if (t.enemyTanks.length === 0 && !t.cleared) {
                  t.cleared = true;
                  t.score += 1000;
                  this.addFloatingText(480, 260, `LEVEL ${level} SELESAI! +1000 PTS`, '#ffd700', 32);
                  if (window.audioManager && typeof window.audioManager.playLevelComplete === 'function') {
                    try { window.audioManager.playLevelComplete(); } catch (err) { }
                  }
                  setTimeout(() => {
                    if (this.gameMode === 'tank') {
                      this.initTankMode((this.tankLevelIndex || 0) + 1);
                    }
                  }, 2500);
                }
              } else {
                this.createExplosion(s.x, s.y, '#f97316', 10);
                this.addFloatingText(e.x, e.y - 12, `HIT! ${e.hp} HP`, '#fbbf24', 18);
              }
              break;
            }
          }
        }

        // Hit Player (if enemy shell)
        if (!hit && s.owner === 'enemy') {
          // Check local player
          if (Math.hypot(s.x - this.myPlayer.x, s.y - this.myPlayer.y) < 22) {
            hit = true;
            if ((this.myPlayer.hurtTimer || 0) <= 0) {
              this.myPlayer.hurtTimer = 2.0;
              this.createExplosion(this.myPlayer.x, this.myPlayer.y, '#ef4444', 20);
              this.addFloatingText(this.myPlayer.x, this.myPlayer.y - 15, 'TERTEMBAK MUSUH! -100', '#ef4444', 22);
              t.score = Math.max(0, t.score - 100);
              if (window.audioManager && typeof window.audioManager.playHurt === 'function') {
                try { window.audioManager.playHurt(); } catch (err) { }
              }
              // Respawn to base
              this.myPlayer.x = 120;
              this.myPlayer.y = this.localSlot === 1 ? 200 : 340;
            }
          }

          // Check peer player if connected
          if (!hit && this.peerPlayer && this.peerPlayer.connected) {
            if (Math.hypot(s.x - this.peerPlayer.x, s.y - this.peerPlayer.y) < 22) {
              hit = true;
              this.createExplosion(this.peerPlayer.x, this.peerPlayer.y, '#ef4444', 20);
            }
          }
        }

        if (hit || (s.bounces !== undefined && s.bounces < 0)) {
          t.shells.splice(i, 1);
        }
      }

      // Update Enemy Tanks AI & Autonomous Movement
      for (let k = 0; k < t.enemyTanks.length; k++) {
        const e = t.enemyTanks[k];

        // Target closest living player
        let target = this.myPlayer;
        if (this.peerPlayer && this.peerPlayer.connected) {
          const d1 = Math.hypot(this.myPlayer.x - e.x, this.myPlayer.y - e.y);
          const d2 = Math.hypot(this.peerPlayer.x - e.x, this.peerPlayer.y - e.y);
          if (d2 < d1) target = this.peerPlayer;
        }

        // AI Think Timer (decision making interval)
        e.thinkTimer = (e.thinkTimer || 0) - dt;
        if (e.thinkTimer <= 0) {
          e.thinkTimer = 0.35 + Math.random() * Math.max(0.2, 0.65 - level * 0.04);

          const dx = target.x - e.x;
          const dy = target.y - e.y;
          const dist = Math.hypot(dx, dy);

          // Aim calculation with predictive lead aiming on higher levels
          let aimAngle = Math.atan2(dy, dx);
          if (level >= 5 && target.vx !== undefined) {
            const leadTime = Math.min(0.45, dist / 500);
            const predX = target.x + (target.vx || 0) * leadTime;
            const predY = target.y + (target.vy || 0) * leadTime;
            aimAngle = Math.atan2(predY - e.y, predX - e.x);
          }
          e.angle = aimAngle;

          // Strategic Movement Behavior:
          let desiredVx = 0;
          let desiredVy = 0;

          if (dist > 300) {
            // Far away: Advance toward player
            if (Math.abs(dx) > Math.abs(dy)) {
              desiredVx = Math.sign(dx) * e.speed;
              desiredVy = Math.random() > 0.6 ? Math.sign(dy) * e.speed * 0.5 : 0;
            } else {
              desiredVy = Math.sign(dy) * e.speed;
              desiredVx = Math.random() > 0.6 ? Math.sign(dx) * e.speed * 0.5 : 0;
            }
          } else if (dist < 140) {
            // Too close: Tactical back-up / retreat to maintain firing range
            desiredVx = -Math.sign(dx) * e.speed * 0.75;
            desiredVy = Math.random() > 0.5 ? e.speed * 0.75 : -e.speed * 0.75;
          } else {
            // Mid range: Strafe perpendicular to dodge incoming player shots
            desiredVx = -Math.sin(aimAngle) * e.speed * 0.9;
            desiredVy = Math.cos(aimAngle) * e.speed * 0.9;
            if (Math.random() > 0.5) {
              desiredVx = -desiredVx;
              desiredVy = -desiredVy;
            }
          }

          e.vx = desiredVx;
          e.vy = desiredVy;
        }

        // Apply movement with solid brick & arena boundary collisions
        let nextX = e.x + e.vx * dt;
        let nextY = e.y + e.vy * dt;

        nextX = Math.max(60, Math.min(900, nextX));
        nextY = Math.max(60, Math.min(480, nextY));

        let blockedX = false;
        let blockedY = false;
        for (const b of t.bricks) {
          if (circleRectOverlap(nextX, e.y, 18, b.x, b.y, 20, 20)) blockedX = true;
          if (circleRectOverlap(e.x, nextY, 18, b.x, b.y, 20, 20)) blockedY = true;
        }

        if (!blockedX) e.x = nextX; else e.vx = -e.vx;
        if (!blockedY) e.y = nextY; else e.vy = -e.vy;

        // Shooting AI: Fire cannon when ready and within range
        e.shootCooldown = (e.shootCooldown || 2) - dt;
        if (e.shootCooldown <= 0) {
          const distToTarget = Math.hypot(target.x - e.x, target.y - e.y);
          if (distToTarget < (650 + level * 35)) {
            // Fire enemy cannon shell!
            t.shells.push({
              x: e.x + Math.cos(e.angle) * 24,
              y: e.y + Math.sin(e.angle) * 24,
              vx: Math.cos(e.angle) * (340 + level * 18),
              vy: Math.sin(e.angle) * (340 + level * 18),
              bounces: level >= 5 ? 1 : 0,
              owner: 'enemy',
              color: '#ef4444'
            });
            t.enemyFiredCount = (t.enemyFiredCount || 0) + 1;

            if (window.audioManager && typeof window.audioManager.playLaser === 'function') {
              try { window.audioManager.playLaser(); } catch (err) { }
            }
          }
          // Reset cooldown with slight random variation
          e.shootCooldown = e.shootInterval * (0.8 + Math.random() * 0.4);
        }
      }

      this.updatePeerInterpolation(dt);
      this.updateParticles(dt);
    };

    GameEngine.prototype.renderTank = function () {
      const ctx = this.ctx;
      const t = this.tank;

      // Arena Floor
      ctx.fillStyle = '#0b1120';
      ctx.fillRect(0, 0, 960, 540);

      // Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 960; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 540); ctx.stroke();
      }
      for (let y = 0; y < 540; y += 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(960, y); ctx.stroke();
      }

      // Brick Obstacles
      for (const b of t.bricks) {
        ctx.fillStyle = '#b45309';
        ctx.fillRect(b.x - 9, b.y - 9, b.w, b.h);
        ctx.strokeStyle = '#d97706';
        ctx.strokeRect(b.x - 9, b.y - 9, b.w, b.h);
      }

      // Cannon Shells (Gold for player, Crimson for enemy)
      for (const s of t.shells) {
        ctx.save();
        ctx.fillStyle = s.color || (s.owner === 'enemy' ? '#ef4444' : '#ffd700');
        ctx.shadowColor = s.owner === 'enemy' ? '#ef4444' : '#f59e0b';
        ctx.shadowBlur = s.owner === 'enemy' ? 12 : 8;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.owner === 'enemy' ? 5 : 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Render Player Tanks (with invulnerability flash if hurt)
      if ((this.myPlayer.hurtTimer || 0) <= 0 || Math.floor(Date.now() / 100) % 2 === 0) {
        this.drawTankSprite(ctx, this.myPlayer.x, this.myPlayer.y, this.myPlayer.angle || 0, this.localSlot === 1 ? '#00e5ff' : '#ff3b77');
      }
      if (this.peerPlayer.connected) {
        if ((this.peerPlayer.hurtTimer || 0) <= 0 || Math.floor(Date.now() / 100) % 2 === 0) {
          this.drawTankSprite(ctx, this.peerPlayer.x, this.peerPlayer.y, this.peerPlayer.angle || 0, this.localSlot === 1 ? '#ff3b77' : '#00e5ff');
        }
      }

      // Render Enemy Tanks with AI Sight Lines and Health Bars
      for (const e of t.enemyTanks) {
        // Red laser sight line when tank is about to fire (< 0.6s)
        if (e.shootCooldown < 0.6) {
          ctx.save();
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(e.x, e.y);
          ctx.lineTo(e.x + Math.cos(e.angle) * 320, e.y + Math.sin(e.angle) * 320);
          ctx.stroke();
          ctx.restore();
        }

        // Draw Tank Sprite
        this.drawTankSprite(ctx, e.x, e.y, e.angle, e.color || '#ef4444', e.type);

        // Draw HP bar above heavy/commander tanks
        if (e.maxHp > 1) {
          const barW = 28;
          const barH = 4;
          ctx.save();
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(e.x - barW / 2, e.y - 24, barW, barH);
          ctx.fillStyle = e.hp > 1 ? '#22c55e' : '#ef4444';
          ctx.fillRect(e.x - barW / 2, e.y - 24, (barW * e.hp) / e.maxHp, barH);
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1;
          ctx.strokeRect(e.x - barW / 2, e.y - 24, barW, barH);
          ctx.restore();
        }
      }

      this.renderParticles(ctx);
      this.renderFloatingTexts(ctx);

      // Modern Never-Cut-Off Canvas HUD with Difficulty Indicator
      this.renderCanvasHUD({
        leftBadge: `TANK MUSUH: ${t.enemyTanks.length}`,
        leftColor: '#00e5ff',
        centerBadge: `TINGKAT: LEVEL ${t.level} (${(t.diffName || 'NORMAL').toUpperCase()})`,
        centerColor: '#f59e0b',
        rightBadge: `SKOR: ${t.score} PTS`,
        rightColor: '#ffd700'
      });
    };

    GameEngine.prototype.drawTankSprite = function (ctx, x, y, angle, color, type = 'standard') {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Special Titan / Commander glowing aura
      if (type === 'titan' || type === 'commander') {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 14;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Treads
      const treadWidth = type === 'titan' ? 40 : 36;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-treadWidth / 2, -16, treadWidth, 8);
      ctx.fillRect(-treadWidth / 2, 8, treadWidth, 8);

      // Hull
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      const hullW = type === 'scout' ? 24 : (type === 'titan' ? 32 : 28);
      drawRoundRect(ctx, -hullW / 2, -10, hullW, 20, 4);
      ctx.fill();

      // Cannon Turret
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, type === 'titan' ? 10 : 8, 0, Math.PI * 2);
      ctx.fill();

      // Cannon Barrel
      const barrelLen = type === 'scout' ? 20 : (type === 'titan' ? 26 : 22);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, -3, barrelLen, 6);

      ctx.restore();
    };

    // ========================================================
    // 3. PAC-MAN / PICMAN MODE (DUO PAC-MAZE)
    // ========================================================
    GameEngine.prototype.initPacmanMode = function (levelIndex) {
      this.camera.x = 0;
      this.camera.y = 0;
      this.camera.targetX = 0;
      this.camera.tilt = 0;

      // P1 & P2 Spawn Points - Open, spacious bottom runway below the ghost house
      // 74px vertical clearance from ghost house and boundary, 160px horizontal clearance from divider walls
      this.myPlayer.x = this.localSlot === 1 ? 440 : 520;
      this.myPlayer.y = 414;
      this.myPlayer.pacAngle = this.localSlot === 1 ? Math.PI : 0;
      this.myPlayer.isMoving = false;
      this.myPlayer.chompTimer = 0;

      this.peerPlayer.x = this.localSlot === 1 ? 520 : 440;
      this.peerPlayer.y = 414;
      this.peerPlayer.pacAngle = this.localSlot === 1 ? 0 : Math.PI;
      this.peerPlayer.isMoving = false;
      this.peerPlayer.chompTimer = 0;

      // Solid Maze Walls (Outer Boundaries + Ghost House + Interior Corridors)
      const walls = [
        // Outer arena border walls (14px thickness)
        { x: 50, y: 38, w: 860, h: 14 },   // Top border
        { x: 50, y: 488, w: 860, h: 14 },  // Bottom border
        { x: 48, y: 38, w: 14, h: 464 },   // Left border
        { x: 898, y: 38, w: 14, h: 464 },  // Right border

        // Ghost House (outer boundaries x: 360 to 600, y: 180 to 340)
        { x: 360, y: 180, w: 16, h: 160 }, // Left wall
        { x: 584, y: 180, w: 16, h: 160 }, // Right wall
        { x: 360, y: 324, w: 240, h: 16 }, // Bottom wall
        { x: 360, y: 180, w: 80, h: 16 },  // Top-left roof
        { x: 520, y: 180, w: 80, h: 16 },  // Top-right roof

        // Interior Maze Divider Corridors
        { x: 160, y: 120, w: 120, h: 20 }, // Top-left horizontal bar
        { x: 680, y: 120, w: 120, h: 20 }, // Top-right horizontal bar
        { x: 160, y: 400, w: 120, h: 20 }, // Bottom-left horizontal bar
        { x: 680, y: 400, w: 120, h: 20 }, // Bottom-right horizontal bar
        { x: 210, y: 220, w: 20, h: 100 }, // Mid-left vertical bar
        { x: 730, y: 220, w: 20, h: 100 }  // Mid-right vertical bar
      ];

      // Ghost House Top Gate (gap x: 440 to 520, y: 180) - Solid for players, exit-only for ghosts
      const gate = { x: 440, y: 180, w: 80, h: 16 };

      this.pacman = {
        score: 0,
        walls: walls,
        gate: gate,
        dots: [],
        powerPellets: [],
        invulnerableTimer: 0,
        cleared: false,
        ghosts: [
          { x: 440, y: 240, color: '#ef4444', name: 'Blinky', vx: 0, vy: -90, changeTimer: 1.0, state: 'exiting' },
          { x: 520, y: 240, color: '#ec4899', name: 'Pinky', vx: 0, vy: -90, changeTimer: 1.5, state: 'exiting' },
          { x: 480, y: 270, color: '#00e5ff', name: 'Inky', vx: 0, vy: -90, changeTimer: 2.0, state: 'exiting' }
        ],
        frightenedTimer: 0
      };

      // Generate Dot Grid strictly inside open corridors with wall clearance
      for (let x = 90; x <= 870; x += 36) {
        for (let y = 75; y <= 465; y += 36) {
          // Never place dots inside or on ghost house perimeter
          if (x >= 345 && x <= 615 && y >= 165 && y <= 350) continue;

          // Keep player spawn points clean
          if (Math.hypot(x - 440, y - 414) < 25 || Math.hypot(x - 520, y - 414) < 25) continue;

          // Check if dot overlaps or is within 18px of any wall
          let collides = false;
          for (const w of walls) {
            if (circleRectOverlap(x, y, 18, w.x, w.y, w.w, w.h)) {
              collides = true;
              break;
            }
          }
          if (!collides) {
            this.pacman.dots.push({ x, y, radius: 3.5 });
          }
        }
      }

      // 4 Power Pellets in open corner corridors
      this.pacman.powerPellets = [
        { x: 90, y: 75 },
        { x: 870, y: 75 },
        { x: 90, y: 465 },
        { x: 870, y: 465 }
      ];

      this.addFloatingText(480, 260, (this.gameTitle || 'DUO PAC-MAZE').toUpperCase(), '#ffd700', 28);
    };

    GameEngine.prototype.updatePacman = function (dt) {
      const p = this.pacman;
      if (!p) return;

      if (p.invulnerableTimer > 0) p.invulnerableTimer -= dt;

      // Anti-stuck safety guard: If player is ever detected inside a wall or gate, instantly relocate to safe spawn
      const safeSpawn = (this.localSlot === 1) ? { x: 440, y: 414 } : { x: 520, y: 414 };
      let isStuck = false;
      for (const w of p.walls) {
        if (circleRectOverlap(this.myPlayer.x, this.myPlayer.y, 14, w.x, w.y, w.w, w.h)) {
          isStuck = true;
          break;
        }
      }
      if (!isStuck && circleRectOverlap(this.myPlayer.x, this.myPlayer.y, 14, p.gate.x, p.gate.y, p.gate.w, p.gate.h)) {
        isStuck = true;
      }
      if (isStuck) {
        this.myPlayer.x = safeSpawn.x;
        this.myPlayer.y = safeSpawn.y;
      }

      // Pacman 4-way movement
      let vx = 0;
      let vy = 0;
      if (this.keysDown['arrowleft'] || this.keysDown['a'] || this.touchState.left) vx -= 1;
      if (this.keysDown['arrowright'] || this.keysDown['d'] || this.touchState.right) vx += 1;
      if (this.keysDown['arrowup'] || this.keysDown['w'] || this.touchState.up) vy -= 1;
      if (this.keysDown['arrowdown'] || this.keysDown['s'] || this.touchState.down) vy += 1;

      // Turbo speed
      const isTurbo = this.keysDown[' '] || this.keysDown['shift'] || this.touchState.jump;
      const speed = isTurbo ? 280 : 210;

      const isMoving = (vx !== 0 || vy !== 0);
      this.myPlayer.isMoving = isMoving;

      if (isMoving) {
        const rad = 15;

        // X movement with solid wall collision test
        let nextX = this.myPlayer.x + vx * speed * dt;
        let blockedX = false;
        for (const w of p.walls) {
          if (circleRectOverlap(nextX, this.myPlayer.y, rad, w.x, w.y, w.w, w.h)) {
            blockedX = true;
            break;
          }
        }
        if (!blockedX && circleRectOverlap(nextX, this.myPlayer.y, rad, p.gate.x, p.gate.y, p.gate.w, p.gate.h)) {
          blockedX = true;
        }
        if (!blockedX) this.myPlayer.x = nextX;

        // Y movement with solid wall collision test
        let nextY = this.myPlayer.y + vy * speed * dt;
        let blockedY = false;
        for (const w of p.walls) {
          if (circleRectOverlap(this.myPlayer.x, nextY, rad, w.x, w.y, w.w, w.h)) {
            blockedY = true;
            break;
          }
        }
        if (!blockedY && circleRectOverlap(this.myPlayer.x, nextY, rad, p.gate.x, p.gate.y, p.gate.w, p.gate.h)) {
          blockedY = true;
        }
        if (!blockedY) this.myPlayer.y = nextY;

        // Exact 4-way orientation angle (0: right, Math.PI/2: down, Math.PI: left, -Math.PI/2: up)
        this.myPlayer.pacAngle = Math.atan2(vy, vx);
        this.myPlayer.facing = vx < 0 ? -1 : 1;
        this.myPlayer.chompTimer = (this.myPlayer.chompTimer || 0) + dt * (isTurbo ? 22 : 16);
      }

      // Broadcast position and angle to peer via network
      if (window.networkManager && typeof window.networkManager.emitPlayerUpdate === 'function') {
        window.networkManager.emitPlayerUpdate({
          x: this.myPlayer.x,
          y: this.myPlayer.y,
          vx: vx * speed,
          vy: vy * speed,
          facing: this.myPlayer.facing,
          pacAngle: this.myPlayer.pacAngle,
          isMoving: isMoving,
          chompTimer: this.myPlayer.chompTimer
        });
      }

      // Peer Player chomp update
      if (this.peerPlayer.connected) {
        if (this.peerPlayer.isMoving || Math.hypot(this.peerPlayer.vx, this.peerPlayer.vy) > 10) {
          this.peerPlayer.chompTimer = (this.peerPlayer.chompTimer || 0) + dt * 16;
          this.peerPlayer.isMoving = true;
          if (this.peerPlayer.pacAngle === undefined && (this.peerPlayer.vx !== 0 || this.peerPlayer.vy !== 0)) {
            this.peerPlayer.pacAngle = Math.atan2(this.peerPlayer.vy, this.peerPlayer.vx);
          }
        } else {
          this.peerPlayer.isMoving = false;
        }
      }

      // Eat Dots
      for (let i = p.dots.length - 1; i >= 0; i--) {
        const dot = p.dots[i];
        if (Math.hypot(this.myPlayer.x - dot.x, this.myPlayer.y - dot.y) < 20) {
          p.dots.splice(i, 1);
          p.score += 10;
          this.createCoinParticles(dot.x, dot.y, '#fde047');
          if (window.audioManager && typeof window.audioManager.playWaka === 'function') {
            try { window.audioManager.playWaka(); } catch (e) { }
          }
          break;
        }
      }

      // Check all dots cleared
      if (p.dots.length === 0 && !p.cleared) {
        p.cleared = true;
        p.score += 1000;
        this.addFloatingText(480, 240, 'LABIRIN BERSIH! +1000 PTS', '#ffd700', 32);
        if (window.audioManager && typeof window.audioManager.playLevelComplete === 'function') {
          try { window.audioManager.playLevelComplete(); } catch (e) { }
        }
        setTimeout(() => {
          if (this.gameMode === 'pacman') {
            this.initPacmanMode((this.currentLevelIndex || 0) + 1);
          }
        }, 3000);
      }

      // Eat Power Pellet
      for (let i = p.powerPellets.length - 1; i >= 0; i--) {
        const pp = p.powerPellets[i];
        if (Math.hypot(this.myPlayer.x - pp.x, this.myPlayer.y - pp.y) < 22) {
          p.powerPellets.splice(i, 1);
          p.score += 50;
          p.frightenedTimer = 8; // 8 seconds of frightened ghosts
          this.addFloatingText(pp.x, pp.y, 'POWER UP! HANTU BIRU!', '#00e5ff', 24);
          if (window.audioManager && typeof window.audioManager.playDoorOpen === 'function') {
            try { window.audioManager.playDoorOpen(); } catch (e) { }
          }
          break;
        }
      }

      if (p.frightenedTimer > 0) p.frightenedTimer -= dt;

      // Ghost roaming & collision
      for (const g of p.ghosts) {
        // State 1: Exiting ghost house through the open top gate
        if (g.state === 'exiting') {
          const targetX = 480;
          const targetY = 150;
          const dx = targetX - g.x;
          const dy = targetY - g.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 8) {
            g.vx = (dx / dist) * 75;
            g.vy = (dy / dist) * 75;
            g.x += g.vx * dt;
            g.y += g.vy * dt;
          } else {
            g.y = 150;
            g.state = 'patrol';
            g.vx = Math.random() > 0.5 ? 90 : -90;
            g.vy = 0;
            g.changeTimer = 1.0;
          }
          continue;
        }

        // State 2: Patrolling corridors outside house with full wall collision
        g.changeTimer = (g.changeTimer || 0) - dt;
        if (g.changeTimer <= 0) {
          g.changeTimer = 1.5 + Math.random() * 2;
          const dirs = [
            { vx: 90, vy: 0 },
            { vx: -90, vy: 0 },
            { vx: 0, vy: 90 },
            { vx: 0, vy: -90 }
          ];
          if (p.frightenedTimer > 0) {
            const awayDir = Math.atan2(g.y - this.myPlayer.y, g.x - this.myPlayer.x);
            g.vx = Math.cos(awayDir) * 60;
            g.vy = Math.sin(awayDir) * 60;
          } else if (Math.random() < 0.45) {
            const toPlayer = Math.atan2(this.myPlayer.y - g.y, this.myPlayer.x - g.x);
            if (Math.abs(Math.cos(toPlayer)) > Math.abs(Math.sin(toPlayer))) {
              g.vx = Math.cos(toPlayer) > 0 ? 95 : -95;
              g.vy = 0;
            } else {
              g.vx = 0;
              g.vy = Math.sin(toPlayer) > 0 ? 95 : -95;
            }
          } else {
            const pick = dirs[Math.floor(Math.random() * dirs.length)];
            g.vx = pick.vx;
            g.vy = pick.vy;
          }
        }

        let testGX = g.x + g.vx * dt;
        let testGY = g.y + g.vy * dt;
        let ghostBlocked = false;

        for (const w of p.walls) {
          if (circleRectOverlap(testGX, testGY, 13, w.x, w.y, w.w, w.h)) {
            ghostBlocked = true;
            break;
          }
        }
        if (!ghostBlocked && circleRectOverlap(testGX, testGY, 13, p.gate.x, p.gate.y, p.gate.w, p.gate.h)) {
          ghostBlocked = true;
        }

        if (ghostBlocked) {
          // Deflect and choose orthogonal direction
          g.changeTimer = 0.5 + Math.random() * 0.8;
          if (Math.abs(g.vx) > 0) {
            g.vy = Math.random() > 0.5 ? 90 : -90;
            g.vx = 0;
          } else {
            g.vx = Math.random() > 0.5 ? 90 : -90;
            g.vy = 0;
          }
        } else {
          g.x = testGX;
          g.y = testGY;
        }

        // Player touches ghost
        if (Math.hypot(this.myPlayer.x - g.x, this.myPlayer.y - g.y) < 24) {
          if (p.frightenedTimer > 0) {
            // Eat ghost!
            g.x = 480;
            g.y = 250;
            g.state = 'exiting';
            p.score += 200;
            this.createExplosion(g.x, g.y, '#00e5ff', 16);
            this.addFloatingText(this.myPlayer.x, this.myPlayer.y - 12, '+200 HANTU TERMAKAN!', '#00e5ff', 22);
            if (window.audioManager && typeof window.audioManager.playEnemyDefeat === 'function') {
              try { window.audioManager.playEnemyDefeat(); } catch (e) { }
            }
          } else if ((p.invulnerableTimer || 0) <= 0) {
            // Caught by ghost!
            p.invulnerableTimer = 2.0;
            this.createExplosion(this.myPlayer.x, this.myPlayer.y, '#ef4444', 16);
            this.addFloatingText(this.myPlayer.x, this.myPlayer.y - 15, 'TERTANGKAP HANTU!', '#ef4444', 22);
            if (window.audioManager && typeof window.audioManager.playHurt === 'function') {
              try { window.audioManager.playHurt(); } catch (e) { }
            }
            // Respawn to open bottom runway (completely clear of any walls)
            this.myPlayer.x = this.localSlot === 1 ? 440 : 520;
            this.myPlayer.y = 414;
            this.myPlayer.pacAngle = this.localSlot === 1 ? Math.PI : 0;
          }
        }
      }

      this.updatePeerInterpolation(dt);
      this.updateParticles(dt);
    };

    GameEngine.prototype.renderPacman = function () {
      const ctx = this.ctx;
      const p = this.pacman;

      // Dark Neon Maze Floor
      ctx.fillStyle = '#060a16';
      ctx.fillRect(0, 0, 960, 540);

      // Render Solid Maze Walls & Corridors
      ctx.save();
      ctx.strokeStyle = '#1d4ed8';
      ctx.fillStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#1d4ed8';
      ctx.shadowBlur = 8;

      for (const w of p.walls) {
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeRect(w.x, w.y, w.w, w.h);
      }

      // Glowing Translucent Gate Barrier
      ctx.strokeStyle = '#ec4899';
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.gate.x + 2, p.gate.y + 8);
      ctx.lineTo(p.gate.x + p.gate.w - 2, p.gate.y + 8);
      ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = '#ec4899';
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(442, 180);
      ctx.lineTo(518, 180);
      ctx.stroke();
      ctx.restore();

      // Dots
      ctx.fillStyle = '#fde047';
      for (const dot of p.dots) {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Power Pellets (Pulsing large stars)
      for (const pp of p.powerPellets) {
        ctx.save();
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Ghosts
      for (const g of p.ghosts) {
        const isFrightened = p.frightenedTimer > 0;
        // Flash warning when frightened timer is about to run out (< 2.5s)
        const isFlashing = isFrightened && p.frightenedTimer < 2.5 && Math.floor(Date.now() / 150) % 2 === 0;
        const ghostColor = isFrightened ? (isFlashing ? '#ffffff' : '#38bdf8') : g.color;
        this.drawGhostSprite(ctx, g.x, g.y, ghostColor, isFrightened, g.vx, g.vy);
      }

      // Draw Pac-Mascots (Bobi & Bona with animated 4-directional mouth chomp)
      const myAngle = this.myPlayer.pacAngle || 0;
      this.drawPacMascot(
        ctx,
        this.myPlayer.x,
        this.myPlayer.y,
        this.localSlot === 1 ? 'bobi' : 'bona',
        myAngle,
        this.myPlayer.isMoving,
        this.myPlayer.chompTimer,
        (p.invulnerableTimer || 0) > 0
      );
      if (this.peerPlayer.connected) {
        const peerAngle = this.peerPlayer.pacAngle !== undefined ? this.peerPlayer.pacAngle : (this.peerPlayer.facing === -1 ? Math.PI : 0);
        this.drawPacMascot(
          ctx,
          this.peerPlayer.x,
          this.peerPlayer.y,
          this.localSlot === 1 ? 'bona' : 'bobi',
          peerAngle,
          this.peerPlayer.isMoving,
          this.peerPlayer.chompTimer,
          false
        );
      }

      this.renderParticles(ctx);
      this.renderFloatingTexts(ctx);

      // Modern Never-Cut-Off Canvas HUD
      const centerMsg = (p.frightenedTimer || 0) > 0
        ? `HANTU BIRU: ${Math.ceil(p.frightenedTimer)}S`
        : (this.gameTitle || 'DUO PAC-MAZE').toUpperCase();
      this.renderCanvasHUD({
        leftBadge: `TITIK SISA: ${p.dots.length}`,
        leftColor: '#00e5ff',
        centerBadge: centerMsg,
        centerColor: (p.frightenedTimer || 0) > 0 ? '#38bdf8' : '#e2e8f0',
        rightBadge: `SKOR: ${p.score} PTS`,
        rightColor: '#ffd700'
      });
    };

    GameEngine.prototype.drawGhostSprite = function (ctx, x, y, color, isFrightened, vx = 0, vy = 0) {
      ctx.save();
      ctx.translate(x, y);

      // Cute floating bobbing motion
      const floatY = Math.sin(Date.now() / 180 + x * 0.05) * 2;
      ctx.translate(0, floatY);

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;

      // Tentacles wave cycle
      const skirtWave = Math.sin(Date.now() / 100 + x * 0.1) * 2;

      // Ghost Head & Body
      ctx.beginPath();
      ctx.arc(0, -4, 13, Math.PI, 0);
      ctx.lineTo(13, 11);
      ctx.lineTo(7, 8 + skirtWave);
      ctx.lineTo(0, 11 - skirtWave);
      ctx.lineTo(-7, 8 + skirtWave);
      ctx.lineTo(-13, 11);
      ctx.closePath();
      ctx.fill();

      // Ghost Eyes - pupils look towards ghost movement direction!
      const eyeDirX = vx > 10 ? 1.5 : (vx < -10 ? -1.5 : 0);
      const eyeDirY = vy > 10 ? 1.5 : (vy < -10 ? -1.5 : 0);

      if (isFrightened) {
        // Scared wavy face
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-4, -4, 2.5, 0, Math.PI * 2);
        ctx.arc(4, -4, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-5, 4);
        ctx.lineTo(-2, 2);
        ctx.lineTo(1, 4);
        ctx.lineTo(4, 2);
        ctx.stroke();
      } else {
        // Normal expressive eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-4.5, -4, 3.8, 0, Math.PI * 2);
        ctx.arc(4.5, -4, 3.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(-4.5 + eyeDirX, -4 + eyeDirY, 2.0, 0, Math.PI * 2);
        ctx.arc(4.5 + eyeDirX, -4 + eyeDirY, 2.0, 0, Math.PI * 2);
        ctx.fill();

        // Twinkle catchlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-4.0 + eyeDirX, -4.5 + eyeDirY, 0.8, 0, Math.PI * 2);
        ctx.arc(5.0 + eyeDirX, -4.5 + eyeDirY, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    GameEngine.prototype.drawPacMascot = function (ctx, x, y, type, angle = 0, isMoving = false, chompTimer = 0, isInvulnerable = false) {
      if (isInvulnerable && Math.floor(Date.now() / 100) % 2 === 0) return; // Flash effect when invulnerable

      ctx.save();
      ctx.translate(x, y);

      // Normalize angle to [-PI, PI]
      let normAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      if (normAngle > Math.PI) normAngle -= Math.PI * 2;

      // Handle orientation: mouth points in movement direction while keeping eyes upright
      if (Math.abs(normAngle) > Math.PI / 2) {
        // Facing Leftward (quadrant 2 or 3)
        ctx.scale(-1, 1);
        ctx.rotate(Math.PI - normAngle);
      } else {
        // Facing Rightward, Upward, or Downward (quadrant 1 or 4)
        ctx.rotate(normAngle);
      }

      const color = type === 'bobi' ? '#00e5ff' : '#ff3b77';
      const glowColor = type === 'bobi' ? '#38bdf8' : '#f43f5e';
      const innerColor = type === 'bobi' ? '#083344' : '#4c0519';

      // Chomp animation: mouth opening between 0.05 and 0.28 PI
      // When moving, lively chomp rhythm; when stopped, cute slight parting
      const chompVal = isMoving ? Math.abs(Math.sin(chompTimer || (Date.now() / 110))) : 0.18;
      const mouthAngle = 0.05 + chompVal * 0.25; // 0.05 PI (~9 deg) to 0.30 PI (~54 deg)

      // Outer Glow
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 10;

      // Inner mouth dark background
      ctx.fillStyle = innerColor;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();

      // Main Pac-Man Body Wedge
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, 15, mouthAngle * Math.PI, (2 - mouthAngle) * Math.PI);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      // 2.5D Glossy Highlight arc on top curve
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(0, -2, 12, Math.PI * 1.15, Math.PI * 1.65);
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.stroke();

      // Expressive Mascot Eye
      // Eye White / Sclera
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(3.5, -7.5, 3.8, 0, Math.PI * 2);
      ctx.fill();

      // Pupil (looking forward toward mouth direction)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(4.6, -7.5, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // White Catchlight / Twinkle Highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(5.4, -8.3, 1.0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    // ========================================================
    // 4. MATH CHALLENGE MODE (SOAL MATEMATIKA CO-OP)
    // ========================================================
    GameEngine.prototype.initMathMode = function (levelIndex) {
      this.camera.x = 0;
      this.camera.y = 0;
      this.camera.targetX = 0;
      this.camera.tilt = 0;

      this.myPlayer.x = 200;
      this.myPlayer.y = 380;
      this.peerPlayer.x = 760;
      this.peerPlayer.y = 380;

      this.math = {
        score: 0,
        streak: 0,
        timer: 14,
        question: '',
        correctAnswer: 0,
        portals: []
      };

      this.nextMathQuestion();
      this.addFloatingText(480, 260, (this.gameTitle || 'KUIS MATEMATIKA CO-OP').toUpperCase(), '#c084fc', 28);
    };

    GameEngine.prototype.nextMathQuestion = function () {
      const m = this.math;
      m.timer = 14;

      const ops = ['+', '-', 'x'];
      const op = ops[Math.floor(Math.random() * ops.length)];
      let a = Math.floor(10 + Math.random() * 40);
      let b = Math.floor(5 + Math.random() * 30);
      let ans = 0;

      if (op === '+') {
        ans = a + b;
        m.question = `${a} + ${b} = ?`;
      } else if (op === '-') {
        if (a < b) { const tmp = a; a = b; b = tmp; }
        ans = a - b;
        m.question = `${a} - ${b} = ?`;
      } else {
        a = Math.floor(3 + Math.random() * 8);
        b = Math.floor(3 + Math.random() * 9);
        ans = a * b;
        m.question = `${a} × ${b} = ?`;
      }

      m.correctAnswer = ans;

      // 3 Answer Portals
      const wrong1 = ans + (Math.random() > 0.5 ? 2 : -3);
      const wrong2 = ans + (Math.random() > 0.5 ? -4 : 5);
      const values = [ans, wrong1, wrong2].sort(() => Math.random() - 0.5);

      m.portals = [
        { x: 260, y: 390, val: values[0], correct: values[0] === ans },
        { x: 480, y: 390, val: values[1], correct: values[1] === ans },
        { x: 700, y: 390, val: values[2], correct: values[2] === ans }
      ];
    };

    GameEngine.prototype.updateMath = function (dt) {
      const m = this.math;
      if (!m) return;

      m.timer -= dt;
      if (m.timer <= 0) {
        this.addFloatingText(480, 200, 'WAKTU HABIS!', '#ef4444', 24);
        m.streak = 0;
        this.nextMathQuestion();
      }

      // Basic platformer run/jump
      this.updateLocalPlayer(dt);

      // Check portal stepping
      for (const p of m.portals) {
        if (Math.abs(this.myPlayer.x - p.x) < 35 && Math.abs(this.myPlayer.y - (p.y - 20)) < 25) {
          if (p.correct) {
            m.streak++;
            const bonus = 200 + m.streak * 50;
            m.score += bonus;
            this.addFloatingText(p.x, p.y - 40, `BENAR! +${bonus}`, '#10b981', 26);
            this.createExplosion(p.x, p.y, '#10b981', 20);
            if (window.audioManager && typeof window.audioManager.playDoorOpen === 'function') {
              try { window.audioManager.playDoorOpen(); } catch (e) { }
            }
            this.nextMathQuestion();
          } else {
            m.streak = 0;
            this.addFloatingText(p.x, p.y - 40, 'KURANG TEPAT!', '#ef4444', 22);
            this.createExplosion(p.x, p.y, '#ef4444', 12);
            if (window.audioManager && typeof window.audioManager.playHurt === 'function') {
              try { window.audioManager.playHurt(); } catch (e) { }
            }
            this.nextMathQuestion();
          }
          break;
        }
      }

      this.updatePeerInterpolation(dt);
      this.updateParticles(dt);
    };

    GameEngine.prototype.renderMath = function () {
      const ctx = this.ctx;
      const m = this.math;

      // Dark Academy Arena
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 960, 540);

      // Floor
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 420, 960, 120);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 420, 960, 2);

      // Digital Math Board Display
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      drawRoundRect(ctx, 280, 50, 400, 110, 14);
      ctx.fill();
      ctx.stroke();

      ctx.font = '700 15px Outfit, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText('SOAL MATEMATIKA CO-OP', 480, 80);

      ctx.font = '800 36px Outfit, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(m.question, 480, 125);

      // Timer Bar
      const timerWidth = Math.max(0, (m.timer / 14) * 360);
      ctx.fillStyle = m.timer < 4 ? '#ef4444' : '#10b981';
      ctx.fillRect(300, 145, timerWidth, 6);

      // Portals on Floor
      for (const p of m.portals) {
        ctx.save();
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        drawRoundRect(ctx, p.x - 45, p.y - 15, 90, 30, 8);
        ctx.fill();
        ctx.stroke();

        ctx.font = '800 20px Outfit, sans-serif';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.fillText(p.val.toString(), p.x, p.y + 7);
        ctx.restore();
      }

      // Render Players
      this.renderPlayer(this.myPlayer, this.localSlot === 1 ? 'bobi' : 'bona');
      if (this.peerPlayer.connected) {
        this.renderPlayer(this.peerPlayer, this.localSlot === 1 ? 'bona' : 'bobi');
      }

      this.renderParticles(ctx);
      this.renderFloatingTexts(ctx);

      // Modern Never-Cut-Off Canvas HUD
      this.renderCanvasHUD({
        leftBadge: `KOMBO: ${m.streak}x  |  SISA: ${Math.ceil(m.timer)}S`,
        leftColor: '#00e5ff',
        centerBadge: `SOAL: ${m.question} = ?`,
        centerColor: '#c084fc',
        rightBadge: `SKOR: ${m.score} PTS`,
        rightColor: '#ffd700'
      });
    };

    GameEngine.prototype.renderPlayer = function (player, type) {
      if (typeof this.renderCharacter === 'function') {
        this.renderCharacter(this.ctx, player);
      }
    };

    GameEngine.prototype.renderFloatingTexts = function (ctx) {
      if (typeof this.renderOverlays === 'function') {
        this.renderOverlays(ctx);
      }
    };

    GameEngine.prototype.createCoinParticles = function (x, y, color = '#ffd700') {
      if (typeof this.createSpawnSparks === 'function') {
        this.createSpawnSparks(x, y, color);
      }
    };

    // ========================================================
    // 5. SNAKE MODE (DUO SNAKE: PEMBURU BINTANG ENERGI)
    // ========================================================
    GameEngine.prototype.initSnakeMode = function (levelIndex) {
      this.camera.x = 0;
      this.camera.y = 0;
      this.camera.targetX = 0;
      this.camera.tilt = 0;
      this.particles = [];
      this.floatingTexts = [];

      const cellSize = 20;
      this.snake = {
        cellSize: cellSize,
        stepTimer: 0,
        stepInterval: 0.11,
        score: 0,
        stars: [],
        minX: 3,
        maxX: 44,
        minY: 3,
        maxY: 23,
        p1: {
          body: [
            { x: 12, y: 13 },
            { x: 11, y: 13 },
            { x: 10, y: 13 },
            { x: 9, y: 13 }
          ],
          dir: { x: 1, y: 0 },
          nextDir: { x: 1, y: 0 },
          color: '#00e5ff',
          name: 'Bobi',
          type: 'bobi',
          length: 4
        },
        p2: {
          body: [
            { x: 35, y: 13 },
            { x: 36, y: 13 },
            { x: 37, y: 13 },
            { x: 38, y: 13 }
          ],
          dir: { x: -1, y: 0 },
          nextDir: { x: -1, y: 0 },
          color: '#ff3b77',
          name: 'Bona',
          type: 'bona',
          length: 4
        }
      };

      // Spawn initial energy stars
      this.spawnSnakeStars(5);

      this.addFloatingText(480, 260, (this.gameTitle || 'DUO SNAKE: PEMBURU BINTANG ENERGI').toUpperCase(), '#00e5ff', 28);
    };

    GameEngine.prototype.spawnSnakeStars = function (count) {
      if (!this.snake) return;
      const s = this.snake;
      for (let i = 0; i < count; i++) {
        if (s.stars.length >= 8) break;
        // Search for a location that is NOT inside any snake body and not on an existing star
        for (let attempt = 0; attempt < 80; attempt++) {
          const x = Math.floor(s.minX + 1 + Math.random() * (s.maxX - s.minX - 2));
          const y = Math.floor(s.minY + 1 + Math.random() * (s.maxY - s.minY - 2));

          const starConflict = s.stars.some(st => st.x === x && st.y === y);
          if (starConflict) continue;

          const p1Conflict = s.p1 && s.p1.body && s.p1.body.some(b => b.x === x && b.y === y);
          if (p1Conflict) continue;

          const p2Conflict = s.p2 && s.p2.body && s.p2.body.some(b => b.x === x && b.y === y);
          if (p2Conflict) continue;

          const isMega = Math.random() < 0.25;
          s.stars.push({
            x,
            y,
            isMega,
            points: isMega ? 50 : 15,
            spawnTime: Date.now()
          });
          break;
        }
      }
    };

    GameEngine.prototype.updateSnake = function (dt) {
      const s = this.snake;
      if (!s) return;

      // CRITICAL: Update particle effects and floating text animations so they fade out and disappear!
      this.updateParticles(dt);

      const mySnake = this.localSlot === 1 ? s.p1 : s.p2;
      const peerSnake = this.localSlot === 1 ? s.p2 : s.p1;

      // Local player steering
      let nd = mySnake.nextDir;
      if (this.keysDown['arrowleft'] || this.keysDown['a'] || this.touchState.left) {
        if (mySnake.dir.x !== 1) nd = { x: -1, y: 0 };
      } else if (this.keysDown['arrowright'] || this.keysDown['d'] || this.touchState.right) {
        if (mySnake.dir.x !== -1) nd = { x: 1, y: 0 };
      } else if (this.keysDown['arrowup'] || this.keysDown['w'] || this.touchState.up) {
        if (mySnake.dir.y !== 1) nd = { x: 0, y: -1 };
      } else if (this.keysDown['arrowdown'] || this.keysDown['s'] || this.touchState.down || this.touchState.jump) {
        if (mySnake.dir.y !== -1) nd = { x: 0, y: 1 };
      }
      mySnake.nextDir = nd;

      // Broadcast steering to peer player in multiplayer
      if (window.networkManager && typeof window.networkManager.emitPlayerUpdate === 'function') {
        window.networkManager.emitPlayerUpdate({
          snakeDir: mySnake.nextDir
        });
      }

      // Turbo boost when holding place button or shift
      const isTurbo = this.keysDown['shift'] || this.keysDown[' '] || this.touchState.place;
      const stepSpeed = isTurbo ? s.stepInterval * 0.55 : s.stepInterval;

      // Autonomous partner AI steering toward nearest star when playing solo
      if (!this.peerPlayer.connected) {
        if (s.stars.length > 0) {
          const head = peerSnake.body[0];
          let closest = s.stars[0];
          let minDist = Math.abs(closest.x - head.x) + Math.abs(closest.y - head.y);
          for (let i = 1; i < s.stars.length; i++) {
            const d = Math.abs(s.stars[i].x - head.x) + Math.abs(s.stars[i].y - head.y);
            if (d < minDist) { minDist = d; closest = s.stars[i]; }
          }
          let pd = peerSnake.dir;
          if (closest.x > head.x && peerSnake.dir.x !== -1) pd = { x: 1, y: 0 };
          else if (closest.x < head.x && peerSnake.dir.x !== 1) pd = { x: -1, y: 0 };
          else if (closest.y > head.y && peerSnake.dir.y !== -1) pd = { x: 0, y: 1 };
          else if (closest.y < head.y && peerSnake.dir.y !== 1) pd = { x: 0, y: -1 };
          peerSnake.nextDir = pd;
        }
      }

      s.stepTimer += dt;
      if (s.stepTimer >= stepSpeed) {
        s.stepTimer = 0;

        this.stepOneSnake(mySnake);
        this.stepOneSnake(peerSnake);

        if (s.stars.length < 4) {
          this.spawnSnakeStars(2);
        }
      }
    };

    GameEngine.prototype.stepOneSnake = function (snk) {
      const s = this.snake;
      snk.dir = snk.nextDir;
      const head = snk.body[0];
      let newHead = { x: head.x + snk.dir.x, y: head.y + snk.dir.y };

      // Wrap around arena borders
      if (newHead.x < s.minX) newHead.x = s.maxX;
      if (newHead.x > s.maxX) newHead.x = s.minX;
      if (newHead.y < s.minY) newHead.y = s.maxY;
      if (newHead.y > s.maxY) newHead.y = s.minY;

      // Check star collision
      let eatenIdx = -1;
      for (let i = 0; i < s.stars.length; i++) {
        if (s.stars[i].x === newHead.x && s.stars[i].y === newHead.y) {
          eatenIdx = i;
          break;
        }
      }

      if (eatenIdx !== -1) {
        const star = s.stars[eatenIdx];
        s.stars.splice(eatenIdx, 1);
        s.score += star.points;
        snk.length += star.isMega ? 2 : 1;

        const px = newHead.x * s.cellSize + s.cellSize / 2;
        const py = newHead.y * s.cellSize + s.cellSize / 2;
        this.addFloatingText(px, py - 12, `+${star.points}`, star.isMega ? '#00e5ff' : '#ffd700', 20);
        this.createCoinParticles(px, py, star.isMega ? '#00e5ff' : '#ffd700');
        if (window.audioManager && window.audioManager.playKey) {
          window.audioManager.playKey();
        }
      }

      snk.body.unshift(newHead);
      while (snk.body.length > snk.length) {
        snk.body.pop();
      }
    };

    GameEngine.prototype.renderSnake = function () {
      const ctx = this.ctx;
      const s = this.snake;
      if (!s) return;

      // Background Cyber Grid
      ctx.fillStyle = '#060a16';
      ctx.fillRect(0, 0, 960, 540);

      // Arena Board Outline
      const boardX = s.minX * s.cellSize;
      const boardY = s.minY * s.cellSize;
      const boardW = (s.maxX - s.minX + 1) * s.cellSize;
      const boardH = (s.maxY - s.minY + 1) * s.cellSize;

      ctx.save();
      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 3;
      ctx.strokeRect(boardX - 4, boardY - 4, boardW + 8, boardH + 8);

      // Grid Dots
      ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
      for (let x = s.minX; x <= s.maxX; x += 2) {
        for (let y = s.minY; y <= s.maxY; y += 2) {
          ctx.fillRect(x * s.cellSize + 9, y * s.cellSize + 9, 2, 2);
        }
      }
      ctx.restore();

      // Render Energy Stars
      const animAngle = (Date.now() / 400);
      for (const st of s.stars) {
        const sx = st.x * s.cellSize + s.cellSize / 2;
        const sy = st.y * s.cellSize + s.cellSize / 2;
        this.drawEnergyStar(ctx, sx, sy, st.isMega, animAngle);
      }

      // Render Snakes (Bobi & Bona)
      this.drawOneSnake(ctx, s.p1);
      this.drawOneSnake(ctx, s.p2);

      // Particles & Floating Text
      this.renderParticles(ctx);
      this.renderFloatingTexts(ctx);

      // Modern Never-Cut-Off Canvas HUD
      this.renderCanvasHUD({
        leftBadge: `BOBI: ${s.p1.length}  |  BONA: ${s.p2.length}`,
        leftColor: '#00e5ff',
        centerBadge: (this.gameTitle || 'DUO SNAKE').toUpperCase(),
        centerColor: '#22c55e',
        rightBadge: `SKOR: ${s.score} PTS`,
        rightColor: '#ffd700'
      });
    };

    GameEngine.prototype.drawOneSnake = function (ctx, snk) {
      const s = this.snake;
      const cs = s.cellSize;

      // Draw Body Segments (tail to head-1)
      for (let i = snk.body.length - 1; i >= 1; i--) {
        const seg = snk.body[i];
        const segX = seg.x * cs;
        const segY = seg.y * cs;
        const alpha = Math.max(0.35, 1 - (i / (snk.body.length + 4)) * 0.5);

        ctx.save();
        ctx.fillStyle = snk.color;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = snk.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        drawRoundRect(ctx, segX + 2, segY + 2, cs - 4, cs - 4, 5);
        ctx.fill();
        ctx.restore();
      }

      // Draw Snake Head (with cute mascot eyes!)
      const head = snk.body[0];
      const hx = head.x * cs;
      const hy = head.y * cs;

      ctx.save();
      ctx.fillStyle = snk.color;
      ctx.shadowColor = snk.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      drawRoundRect(ctx, hx + 1, hy + 1, cs - 2, cs - 2, 6);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#000000';
      const eyeDx = snk.dir.x;
      const eyeDy = snk.dir.y;
      if (eyeDx !== 0) {
        const ox = eyeDx > 0 ? 12 : 4;
        ctx.fillRect(hx + ox, hy + 5, 3, 4);
        ctx.fillRect(hx + ox, hy + 11, 3, 4);
      } else {
        const oy = eyeDy > 0 ? 12 : 4;
        ctx.fillRect(hx + 5, hy + oy, 4, 3);
        ctx.fillRect(hx + 11, hy + oy, 4, 3);
      }

      // Bona's cute hairclip
      if (snk.type === 'bona') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(hx + 4, hy + 4, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    GameEngine.prototype.drawEnergyStar = function (ctx, cx, cy, isMega, angle) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      const color = isMega ? '#00e5ff' : '#ffd700';
      const rOuter = isMega ? 12 : 8;
      const rInner = isMega ? 5 : 3.5;

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = isMega ? 16 : 8;

      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const r = (i % 2 === 0) ? rOuter : rInner;
        const a = (i * Math.PI) / 4;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    // ========================================================
    // 6. PONG MODE (NEON PONG: PERTARUNGAN REFLEKS)
    // ========================================================
    GameEngine.prototype.initPongMode = function (levelIndex) {
      this.camera.x = 0;
      this.camera.y = 0;
      this.camera.targetX = 0;
      this.camera.tilt = 0;

      this.pong = {
        p1: { x: 50, y: 270, w: 18, h: 90, vy: 0, color: '#00e5ff', name: 'Bobi', type: 'bobi' },
        p2: { x: 910, y: 270, w: 18, h: 90, vy: 0, color: '#ff3b77', name: 'Bona', type: 'bona' },
        ball: {
          x: 480,
          y: 270,
          vx: 380 * (Math.random() > 0.5 ? 1 : -1),
          vy: 180 * (Math.random() > 0.5 ? 1 : -1),
          radius: 9,
          speed: 400
        },
        rally: 0,
        maxRally: 0,
        score: 0,
        trail: []
      };

      this.addFloatingText(480, 260, (this.gameTitle || 'NEON PONG: PERTARUNGAN REFLEKS').toUpperCase(), '#00e5ff', 28);
    };

    GameEngine.prototype.updatePong = function (dt) {
      const p = this.pong;
      if (!p) return;

      const myPad = this.localSlot === 1 ? p.p1 : p.p2;
      const peerPad = this.localSlot === 1 ? p.p2 : p.p1;

      // Local player paddle movement
      let moveDir = 0;
      if (this.keysDown['arrowup'] || this.keysDown['w'] || this.touchState.up) moveDir -= 1;
      if (this.keysDown['arrowdown'] || this.keysDown['s'] || this.touchState.down || this.touchState.jump) moveDir += 1;

      myPad.y += moveDir * 420 * dt;
      myPad.y = Math.max(90, Math.min(450, myPad.y));

      // Autonomous peer AI when playing solo
      if (!this.peerPlayer.connected) {
        const diff = p.ball.y - peerPad.y;
        if (Math.abs(diff) > 12) {
          peerPad.y += Math.sign(diff) * Math.min(Math.abs(diff), 360 * dt);
        }
        peerPad.y = Math.max(90, Math.min(450, peerPad.y));
      }

      // Ball Movement
      const b = p.ball;
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Trail history
      p.trail.unshift({ x: b.x, y: b.y, time: Date.now() });
      if (p.trail.length > 8) p.trail.pop();

      // Top and Bottom Neon Bumper Collisions
      if (b.y <= 50 && b.vy < 0) {
        b.y = 50;
        b.vy = Math.abs(b.vy);
        this.createCoinParticles(b.x, b.y, '#00e5ff');
      } else if (b.y >= 490 && b.vy > 0) {
        b.y = 490;
        b.vy = -Math.abs(b.vy);
        this.createCoinParticles(b.x, b.y, '#ff3b77');
      }

      // Paddle Collisions (Left & Right)
      if (b.vx < 0 && b.x - b.radius <= p.p1.x + p.p1.w / 2 && b.x + b.radius >= p.p1.x - p.p1.w / 2) {
        if (Math.abs(b.y - p.p1.y) <= p.p1.h / 2 + b.radius) {
          b.vx = Math.abs(b.vx) * 1.05;
          const hitOffset = (b.y - p.p1.y) / (p.p1.h / 2);
          b.vy = hitOffset * 320;
          p.rally++;
          p.score += 10 * p.rally;
          this.createCoinParticles(b.x, b.y, '#00e5ff');
          if (p.rally % 5 === 0) {
            this.addFloatingText(b.x, b.y - 18, `RELI x${p.rally}!`, '#00e5ff', 22);
          }
        }
      }

      if (b.vx > 0 && b.x + b.radius >= p.p2.x - p.p2.w / 2 && b.x - b.radius <= p.p2.x + p.p2.w / 2) {
        if (Math.abs(b.y - p.p2.y) <= p.p2.h / 2 + b.radius) {
          b.vx = -Math.abs(b.vx) * 1.05;
          const hitOffset = (b.y - p.p2.y) / (p.p2.h / 2);
          b.vy = hitOffset * 320;
          p.rally++;
          p.score += 10 * p.rally;
          this.createCoinParticles(b.x, b.y, '#ff3b77');
          if (p.rally % 5 === 0) {
            this.addFloatingText(b.x, b.y - 18, `RELI x${p.rally}!`, '#ff3b77', 22);
          }
        }
      }

      // Out of bounds (Ball passed paddle)
      if (b.x < 10 || b.x > 950) {
        p.maxRally = Math.max(p.maxRally, p.rally);
        p.rally = 0;
        b.x = 480;
        b.y = 270;
        b.vx = 380 * (Math.random() > 0.5 ? 1 : -1);
        b.vy = 180 * (Math.random() > 0.5 ? 1 : -1);
        this.addFloatingText(480, 240, 'RELI BARU!', '#ffd700', 22);
      }

      this.updateParticles(dt);
    };

    GameEngine.prototype.renderPong = function () {
      const ctx = this.ctx;
      const p = this.pong;
      if (!p) return;

      // Dark Neon Court Background
      ctx.fillStyle = '#060a16';
      ctx.fillRect(0, 0, 960, 540);

      // Court Borders & Center Line
      ctx.save();
      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 3;
      ctx.strokeRect(30, 40, 900, 460);

      // Center Line (Dashed)
      ctx.setLineDash([10, 10]);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
      ctx.beginPath();
      ctx.moveTo(480, 40);
      ctx.lineTo(480, 500);
      ctx.stroke();

      // Center Circle
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(480, 270, 60, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Ball Trail
      for (let i = 0; i < p.trail.length; i++) {
        const tr = p.trail[i];
        const alpha = Math.max(0, 0.6 - (i / p.trail.length) * 0.6);
        ctx.fillStyle = '#ffd700';
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, p.ball.radius * (1 - i * 0.08), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Ball
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(p.ball.x, p.ball.y, p.ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Paddles
      this.drawPongPaddle(ctx, p.p1);
      this.drawPongPaddle(ctx, p.p2);

      // Particles & Floating Text
      this.renderParticles(ctx);
      this.renderFloatingTexts(ctx);

      // Modern Never-Cut-Off Canvas HUD
      this.renderCanvasHUD({
        leftBadge: `RELI TERBAIK: ${p.maxRally || p.rally}`,
        leftColor: '#00e5ff',
        centerBadge: `RELI: ${p.rally} PANTULAN`,
        centerColor: '#38bdf8',
        rightBadge: `SKOR: ${p.score} PTS`,
        rightColor: '#ffd700'
      });
    };

    GameEngine.prototype.drawPongPaddle = function (ctx, pad) {
      ctx.save();
      ctx.fillStyle = pad.color;
      ctx.shadowColor = pad.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      drawRoundRect(ctx, pad.x - pad.w / 2, pad.y - pad.h / 2, pad.w, pad.h, 9);
      ctx.fill();

      // Paddle mascot face indicator in center of paddle
      ctx.fillStyle = '#000000';
      ctx.fillRect(pad.x - 4, pad.y - 6, 2, 4);
      ctx.fillRect(pad.x + 2, pad.y - 6, 2, 4);
      ctx.restore();
    };

    // Master dispatcher for update & render
    const origUpdate = GameEngine.prototype.update;
    GameEngine.prototype.update = function (dt) {
      if (this.gameMode === 'shooter') {
        this.updateShooter(dt);
      } else if (this.gameMode === 'tank') {
        this.updateTank(dt);
      } else if (this.gameMode === 'pacman') {
        this.updatePacman(dt);
      } else if (this.gameMode === 'math') {
        this.updateMath(dt);
      } else if (this.gameMode === 'pong') {
        this.updatePong(dt);
      } else if (this.gameMode === 'snake') {
        this.updateSnake(dt);
      } else {
        origUpdate.call(this, dt);
      }
    };

    const origRender = GameEngine.prototype.render;
    GameEngine.prototype.render = function () {
      if (this.gameMode === 'shooter') {
        this.renderShooter();
      } else if (this.gameMode === 'tank') {
        this.renderTank();
      } else if (this.gameMode === 'pacman') {
        this.renderPacman();
      } else if (this.gameMode === 'math') {
        this.renderMath();
      } else if (this.gameMode === 'pong') {
        this.renderPong();
      } else if (this.gameMode === 'snake') {
        this.renderSnake();
      } else {
        origRender.call(this);
      }
    };
  }

  // Hook GameEngine once loaded
  if (window.GameEngine) {
    attachGameModes(window.GameEngine);
  } else {
    window.addEventListener('DOMContentLoaded', () => {
      if (window.GameEngine) attachGameModes(window.GameEngine);
    });
  }
})();

