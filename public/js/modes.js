// Block Couple - Multi-Genre Co-op Game Engine Modes
// Extends GameEngine with Shooter, Tank, Pacman, Math, Pong, and Snake modes!

(function() {
  if (typeof window === 'undefined') return;

  function drawRoundRect(ctx, x, y, w, h, r = 4) {
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.rect(x, y, w, h);
    }
  }

  // Initialize Game Mode Extension
  function attachGameModes(GameEngine) {
    if (!GameEngine || !GameEngine.prototype) return;

    // --- Master Mode Switcher ---
    GameEngine.prototype.loadGame = function(gameId, levelIndex = 0, startTime = Date.now(), restorePos = null) {
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
    GameEngine.prototype.createExplosion = function(x, y, color = '#ffd700', count = 14) {
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
        } catch(e) {}
      }
    };

    // Update Touch Controls & HUD text for each mode
    GameEngine.prototype.updateModeControls = function() {
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
    GameEngine.prototype.initShooterMode = function(levelIndex) {
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

    GameEngine.prototype.spawnAlienWave = function() {
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

    GameEngine.prototype.updateShooter = function(dt) {
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
          } catch(e) {}
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
                try { window.audioManager.playEnemyDefeat(); } catch(e) {}
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
          try { window.audioManager.playDoorOpen(); } catch(e) {}
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

    GameEngine.prototype.renderShooter = function() {
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

      // HUD Overlay
      ctx.save();
      ctx.font = '700 16px Outfit, sans-serif';
      ctx.fillStyle = '#00e5ff';
      ctx.fillText(`WAVE: ${s.wave}`, 40, 40);
      ctx.fillStyle = '#ffd700';
      ctx.fillText(`SKOR CO-OP: ${s.score}`, 820, 40);
      ctx.restore();
    };

    GameEngine.prototype.drawSpaceShip = function(ctx, x, y, type) {
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

    GameEngine.prototype.drawAlienSaucer = function(ctx, x, y, type, hp) {
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
    // 2. TANK BATTLE MODE (DUO TANK BAJA 2D)
    // ========================================================
    GameEngine.prototype.initTankMode = function(levelIndex) {
      this.camera.x = 0;
      this.camera.y = 0;
      this.camera.targetX = 0;
      this.camera.tilt = 0;

      // P1 & P2 Tanks
      this.myPlayer.x = this.localSlot === 1 ? 120 : 120;
      this.myPlayer.y = this.localSlot === 1 ? 200 : 340;
      this.myPlayer.angle = 0; // facing right
      this.peerPlayer.x = this.localSlot === 1 ? 120 : 120;
      this.peerPlayer.y = this.localSlot === 1 ? 340 : 200;
      this.peerPlayer.angle = 0;

      this.tank = {
        score: 0,
        shells: [],
        cooldown: 0,
        bricks: [],
        enemyTanks: []
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

      // Spawn Enemy Tanks
      this.tank.enemyTanks.push(
        { x: 800, y: 140, angle: Math.PI, vx: 0, vy: 50, shootTimer: 2 },
        { x: 800, y: 400, angle: Math.PI, vx: 0, vy: -50, shootTimer: 3 }
      );

      this.addFloatingText(480, 260, (this.gameTitle || 'DUO TANK BAJA').toUpperCase(), '#00e5ff', 28);
    };

    GameEngine.prototype.updateTank = function(dt) {
      const t = this.tank;
      if (!t) return;

      // Tank 4-way Control
      let vx = 0;
      let vy = 0;
      if (this.keysDown['arrowleft'] || this.keysDown['a'] || this.touchState.left) vx -= 1;
      if (this.keysDown['arrowright'] || this.keysDown['d'] || this.touchState.right) vx += 1;
      if (this.keysDown['arrowup'] || this.keysDown['w'] || this.touchState.up) vy -= 1;
      if (this.keysDown['arrowdown'] || this.keysDown['s'] || this.touchState.down) vy += 1;

      const speed = 200;
      if (vx !== 0 || vy !== 0) {
        this.myPlayer.x += vx * speed * dt;
        this.myPlayer.y += vy * speed * dt;
        this.myPlayer.angle = Math.atan2(vy, vx);

        // Keep inside bounds
        this.myPlayer.x = Math.max(50, Math.min(910, this.myPlayer.x));
        this.myPlayer.y = Math.max(50, Math.min(490, this.myPlayer.y));
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
          owner: this.localSlot
        });
        if (window.audioManager) {
          try {
            if (typeof window.audioManager.playLaser === 'function') window.audioManager.playLaser();
            else if (typeof window.audioManager.playSpringBounce === 'function') window.audioManager.playSpringBounce();
          } catch(e) {}
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
          s.bounces--;
        }
        if (s.y < 20 || s.y > 520) {
          s.vy = -s.vy;
          s.bounces--;
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

        // Hit Enemy Tanks
        for (let k = t.enemyTanks.length - 1; k >= 0; k--) {
          const e = t.enemyTanks[k];
          if (Math.abs(s.x - e.x) < 22 && Math.abs(s.y - e.y) < 22) {
            hit = true;
            this.createExplosion(e.x, e.y, '#ef4444', 25);
            t.enemyTanks.splice(k, 1);
            t.score += 250;
            this.addFloatingText(e.x, e.y - 10, '+250 TANK HANCUR!', '#ffd700', 20);
            if (window.audioManager && typeof window.audioManager.playEnemyDefeat === 'function') {
              try { window.audioManager.playEnemyDefeat(); } catch(e) {}
            }
            break;
          }
        }

        if (hit || s.bounces < 0) {
          t.shells.splice(i, 1);
        }
      }

      // Update Enemy Tanks
      for (const e of t.enemyTanks) {
        e.y += e.vy * dt;
        if (e.y < 100 || e.y > 440) e.vy = -e.vy;
      }

      this.updatePeerInterpolation(dt);
      this.updateParticles(dt);
    };

    GameEngine.prototype.renderTank = function() {
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

      // Cannon Shells
      for (const s of t.shells) {
        ctx.save();
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Render Player Tanks
      this.drawTankSprite(ctx, this.myPlayer.x, this.myPlayer.y, this.myPlayer.angle || 0, this.localSlot === 1 ? '#00e5ff' : '#ff3b77');
      if (this.peerPlayer.connected) {
        this.drawTankSprite(ctx, this.peerPlayer.x, this.peerPlayer.y, this.peerPlayer.angle || 0, this.localSlot === 1 ? '#ff3b77' : '#00e5ff');
      }

      // Render Enemy Tanks
      for (const e of t.enemyTanks) {
        this.drawTankSprite(ctx, e.x, e.y, e.angle, '#ef4444');
      }

      this.renderParticles(ctx);
      this.renderFloatingTexts(ctx);

      // HUD
      ctx.save();
      ctx.font = '700 16px Outfit, sans-serif';
      ctx.fillStyle = '#00e5ff';
      ctx.fillText(`TANK MUSUH: ${t.enemyTanks.length}`, 40, 40);
      ctx.fillStyle = '#ffd700';
      ctx.fillText(`SKOR: ${t.score}`, 840, 40);
      ctx.restore();
    };

    GameEngine.prototype.drawTankSprite = function(ctx, x, y, angle, color) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Treads
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-18, -16, 36, 8);
      ctx.fillRect(-18, 8, 36, 8);

      // Hull
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      drawRoundRect(ctx, -14, -10, 28, 20, 4);
      ctx.fill();

      // Cannon Turret
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();

      // Cannon Barrel
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, -3, 22, 6);

      ctx.restore();
    };

    // ========================================================
    // 3. PAC-MAN / PICMAN MODE (DUO PAC-MAZE)
    // ========================================================
    GameEngine.prototype.initPacmanMode = function(levelIndex) {
      this.camera.x = 0;
      this.camera.y = 0;
      this.camera.targetX = 0;
      this.camera.tilt = 0;

      this.myPlayer.x = 240;
      this.myPlayer.y = 270;
      this.myPlayer.pacAngle = 0;
      this.myPlayer.isMoving = false;
      this.myPlayer.chompTimer = 0;

      this.peerPlayer.x = 720;
      this.peerPlayer.y = 270;
      this.peerPlayer.pacAngle = Math.PI;
      this.peerPlayer.isMoving = false;
      this.peerPlayer.chompTimer = 0;

      this.pacman = {
        score: 0,
        dots: [],
        powerPellets: [],
        invulnerableTimer: 0,
        cleared: false,
        ghosts: [
          { x: 440, y: 220, color: '#ef4444', name: 'Blinky', vx: 90, vy: 0, changeTimer: 1.5 },
          { x: 520, y: 220, color: '#ec4899', name: 'Pinky', vx: -90, vy: 0, changeTimer: 1.8 },
          { x: 480, y: 260, color: '#00e5ff', name: 'Inky', vx: 0, vy: 90, changeTimer: 2.2 }
        ],
        frightenedTimer: 0
      };

      // Generate Dot Grid
      for (let x = 100; x <= 860; x += 40) {
        for (let y = 80; y <= 460; y += 40) {
          // Avoid center ghost house
          if (x > 380 && x < 580 && y > 180 && y < 320) continue;
          this.pacman.dots.push({ x, y, radius: 3.5 });
        }
      }

      // 4 Power Pellets in corners
      this.pacman.powerPellets = [
        { x: 100, y: 80 },
        { x: 860, y: 80 },
        { x: 100, y: 460 },
        { x: 860, y: 460 }
      ];

      this.addFloatingText(480, 260, (this.gameTitle || 'DUO PAC-MAZE').toUpperCase(), '#ffd700', 28);
    };

    GameEngine.prototype.updatePacman = function(dt) {
      const p = this.pacman;
      if (!p) return;

      if (p.invulnerableTimer > 0) p.invulnerableTimer -= dt;

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
        this.myPlayer.x += vx * speed * dt;
        this.myPlayer.y += vy * speed * dt;

        // Exact 4-way orientation angle (0: right, Math.PI/2: down, Math.PI: left, -Math.PI/2: up)
        this.myPlayer.pacAngle = Math.atan2(vy, vx);
        this.myPlayer.facing = vx < 0 ? -1 : 1;
        this.myPlayer.chompTimer = (this.myPlayer.chompTimer || 0) + dt * (isTurbo ? 22 : 16);

        // Clamping to arena boundaries
        this.myPlayer.x = Math.max(68, Math.min(892, this.myPlayer.x));
        this.myPlayer.y = Math.max(58, Math.min(482, this.myPlayer.y));
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
            try { window.audioManager.playWaka(); } catch(e) {}
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
          try { window.audioManager.playLevelComplete(); } catch(e) {}
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
            try { window.audioManager.playDoorOpen(); } catch(e) {}
          }
          break;
        }
      }

      if (p.frightenedTimer > 0) p.frightenedTimer -= dt;

      // Ghost roaming & collision
      for (const g of p.ghosts) {
        // Ghost AI roam
        g.changeTimer = (g.changeTimer || 0) - dt;
        if (g.changeTimer <= 0) {
          g.changeTimer = 1.5 + Math.random() * 2;
          const dirs = [
            { vx: 90, vy: 0 },
            { vx: -90, vy: 0 },
            { vx: 0, vy: 90 },
            { vx: 0, vy: -90 }
          ];
          // If frightened, wander slower away from player
          if (p.frightenedTimer > 0) {
            const awayDir = Math.atan2(g.y - this.myPlayer.y, g.x - this.myPlayer.x);
            g.vx = Math.cos(awayDir) * 60;
            g.vy = Math.sin(awayDir) * 60;
          } else {
            // Chance to track player
            if (Math.random() < 0.45) {
              const toPlayer = Math.atan2(this.myPlayer.y - g.y, this.myPlayer.x - g.x);
              // Pick closest cardinal direction
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
        }

        g.x += g.vx * dt;
        g.y += g.vy * dt;

        // Arena boundary bouncing
        if (g.x < 70) { g.x = 70; g.vx = Math.abs(g.vx); }
        if (g.x > 890) { g.x = 890; g.vx = -Math.abs(g.vx); }
        if (g.y < 60) { g.y = 60; g.vy = Math.abs(g.vy); }
        if (g.y > 480) { g.y = 480; g.vy = -Math.abs(g.vy); }

        // Player touches ghost
        if (Math.hypot(this.myPlayer.x - g.x, this.myPlayer.y - g.y) < 24) {
          if (p.frightenedTimer > 0) {
            // Eat ghost!
            g.x = 480;
            g.y = 260;
            g.changeTimer = 2.0;
            p.score += 200;
            this.createExplosion(g.x, g.y, '#00e5ff', 16);
            this.addFloatingText(this.myPlayer.x, this.myPlayer.y - 12, '+200 HANTU TERMAKAN!', '#00e5ff', 22);
            if (window.audioManager && typeof window.audioManager.playEnemyDefeat === 'function') {
              try { window.audioManager.playEnemyDefeat(); } catch(e) {}
            }
          } else if ((p.invulnerableTimer || 0) <= 0) {
            // Caught by ghost!
            p.invulnerableTimer = 2.0;
            this.createExplosion(this.myPlayer.x, this.myPlayer.y, '#ef4444', 16);
            this.addFloatingText(this.myPlayer.x, this.myPlayer.y - 15, 'TERTANGKAP HANTU!', '#ef4444', 22);
            if (window.audioManager && typeof window.audioManager.playHurt === 'function') {
              try { window.audioManager.playHurt(); } catch(e) {}
            }
            // Respawn to starting side
            this.myPlayer.x = this.localSlot === 1 ? 240 : 720;
            this.myPlayer.y = 270;
            this.myPlayer.pacAngle = this.localSlot === 1 ? 0 : Math.PI;
          }
        }
      }

      this.updatePeerInterpolation(dt);
      this.updateParticles(dt);
    };

    GameEngine.prototype.renderPacman = function() {
      const ctx = this.ctx;
      const p = this.pacman;

      // Dark Neon Maze Floor
      ctx.fillStyle = '#060a16';
      ctx.fillRect(0, 0, 960, 540);

      // Maze Wall Outer Borders (Cyberpunk double-line)
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 4;
      ctx.strokeRect(50, 40, 860, 460);

      // Ghost House with Open Top Gate
      ctx.strokeStyle = '#1e40af';
      ctx.lineWidth = 3;
      ctx.beginPath();
      // Left side of roof
      ctx.moveTo(360, 180);
      ctx.lineTo(440, 180);
      // Gap for gate between 440 and 520
      ctx.moveTo(520, 180);
      ctx.lineTo(600, 180);
      // Right wall
      ctx.lineTo(600, 340);
      // Floor
      ctx.lineTo(360, 340);
      // Left wall
      ctx.lineTo(360, 180);
      ctx.stroke();

      // Glowing Translucent Gate Barrier
      ctx.save();
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

      // HUD
      ctx.save();
      ctx.font = '700 16px Outfit, sans-serif';
      ctx.fillStyle = '#00e5ff';
      ctx.fillText(`TITIK SISA: ${p.dots.length}`, 50, 30);
      ctx.fillStyle = '#ffd700';
      ctx.fillText(`SKOR: ${p.score}`, 820, 30);
      ctx.restore();
    };

    GameEngine.prototype.drawGhostSprite = function(ctx, x, y, color, isFrightened, vx = 0, vy = 0) {
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

    GameEngine.prototype.drawPacMascot = function(ctx, x, y, type, angle = 0, isMoving = false, chompTimer = 0, isInvulnerable = false) {
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

      // Unique character mascot accessories:
      if (type === 'bona') {
        // Bona's cute hair ribbon / bow on top
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(-2, -15, 3.5, 0, Math.PI * 2);
        ctx.arc(4, -15, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(1, -15, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Bobi's cute cyber antenna or cap badge
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-1, -17, 2, 3);
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(0, -18, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    // ========================================================
    // 4. MATH CHALLENGE MODE (SOAL MATEMATIKA CO-OP)
    // ========================================================
    GameEngine.prototype.initMathMode = function(levelIndex) {
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

    GameEngine.prototype.nextMathQuestion = function() {
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

    GameEngine.prototype.updateMath = function(dt) {
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
              try { window.audioManager.playDoorOpen(); } catch(e) {}
            }
            this.nextMathQuestion();
          } else {
            m.streak = 0;
            this.addFloatingText(p.x, p.y - 40, 'KURANG TEPAT!', '#ef4444', 22);
            this.createExplosion(p.x, p.y, '#ef4444', 12);
            if (window.audioManager && typeof window.audioManager.playHurt === 'function') {
              try { window.audioManager.playHurt(); } catch(e) {}
            }
            this.nextMathQuestion();
          }
          break;
        }
      }

      this.updatePeerInterpolation(dt);
      this.updateParticles(dt);
    };

    GameEngine.prototype.renderMath = function() {
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

      // HUD
      ctx.save();
      ctx.font = '700 16px Outfit, sans-serif';
      ctx.fillStyle = '#00e5ff';
      ctx.fillText(`KOMBO: ${m.streak}x`, 50, 40);
      ctx.fillStyle = '#ffd700';
      ctx.fillText(`SKOR: ${m.score}`, 840, 40);
      ctx.restore();
    };

    GameEngine.prototype.renderPlayer = function(player, type) {
      if (typeof this.renderCharacter === 'function') {
        this.renderCharacter(this.ctx, player);
      }
    };

    GameEngine.prototype.renderFloatingTexts = function(ctx) {
      if (typeof this.renderOverlays === 'function') {
        this.renderOverlays(ctx);
      }
    };

    GameEngine.prototype.createCoinParticles = function(x, y, color = '#ffd700') {
      if (typeof this.createSpawnSparks === 'function') {
        this.createSpawnSparks(x, y, color);
      }
    };

    // ========================================================
    // 5. SNAKE MODE (DUO SNAKE: PEMBURU BINTANG ENERGI)
    // ========================================================
    GameEngine.prototype.initSnakeMode = function(levelIndex) {
      this.camera.x = 0;
      this.camera.y = 0;
      this.camera.targetX = 0;
      this.camera.tilt = 0;

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

    GameEngine.prototype.spawnSnakeStars = function(count) {
      if (!this.snake) return;
      const s = this.snake;
      for (let i = 0; i < count; i++) {
        if (s.stars.length >= 8) break;
        const x = Math.floor(s.minX + 1 + Math.random() * (s.maxX - s.minX - 2));
        const y = Math.floor(s.minY + 1 + Math.random() * (s.maxY - s.minY - 2));
        const exists = s.stars.some(st => st.x === x && st.y === y);
        if (!exists) {
          const isMega = Math.random() < 0.25;
          s.stars.push({
            x,
            y,
            isMega,
            points: isMega ? 50 : 15,
            spawnTime: Date.now()
          });
        }
      }
    };

    GameEngine.prototype.updateSnake = function(dt) {
      const s = this.snake;
      if (!s) return;

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

    GameEngine.prototype.stepOneSnake = function(snk) {
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

    GameEngine.prototype.renderSnake = function() {
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

      // In-game Mode HUD
      ctx.save();
      ctx.font = '700 16px Outfit, sans-serif';
      ctx.fillStyle = '#00e5ff';
      ctx.fillText(`BOBI: ${s.p1.length} SEGMEN`, boardX, 32);
      ctx.fillStyle = '#ff3b77';
      ctx.fillText(`BONA: ${s.p2.length} SEGMEN`, boardX + 220, 32);
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'right';
      ctx.fillText(`SKOR DUO: ${s.score} PTS`, boardX + boardW, 32);
      ctx.restore();
    };

    GameEngine.prototype.drawOneSnake = function(ctx, snk) {
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

    GameEngine.prototype.drawEnergyStar = function(ctx, cx, cy, isMega, angle) {
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
    GameEngine.prototype.initPongMode = function(levelIndex) {
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

    GameEngine.prototype.updatePong = function(dt) {
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
    };

    GameEngine.prototype.renderPong = function() {
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

      // HUD Overlay
      ctx.save();
      ctx.font = '800 18px Outfit, sans-serif';
      ctx.fillStyle = '#00e5ff';
      ctx.fillText(`RELI: ${p.rally} HITS`, 480, 32);
      ctx.font = '700 16px Outfit, sans-serif';
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'right';
      ctx.fillText(`SKOR: ${p.score} PTS`, 920, 32);
      ctx.restore();
    };

    GameEngine.prototype.drawPongPaddle = function(ctx, pad) {
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
    GameEngine.prototype.update = function(dt) {
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
    GameEngine.prototype.render = function() {
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

