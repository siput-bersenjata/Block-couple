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
      this.currentGameId = gameId || 1;
      const gameDef = (window.COOP_GAMES || []).find(g => g.id === this.currentGameId) || window.COOP_GAMES[0];
      this.gameMode = gameDef ? (gameDef.mode || 'platformer') : 'platformer';
      this.gameTitle = gameDef ? gameDef.title : 'Petualangan Co-op';

      // Update HUD Labels based on mode
      this.updateModeControls();

      // Update in-game HUD Level Title
      const titleEl = document.getElementById('levelTitle');
      if (titleEl) titleEl.innerText = this.gameTitle;

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
      } else if (this.gameMode === 'pong' || this.gameMode === 'snake') {
        if (btnJump) btnJump.querySelector('.btn-main-label').innerText = 'AKSI';
        if (btnPlace) btnPlace.classList.add('hidden');
        if (btnClear) btnClear.classList.add('hidden');
        if (btnUp) btnUp.classList.remove('hidden');
        if (banner) banner.innerText = 'Kendalikan dengan gesit untuk meraih rekor skor co-op tertinggi!';
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
      this.addFloatingText(480, 260, 'DUO SPACE BLASTER: WAVE ' + this.shooter.wave, '#00e5ff', 32);
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
        window.audioManager && window.audioManager.jump();
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
              window.audioManager && window.audioManager.stomp();
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
        window.audioManager && window.audioManager.portal();
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

      this.addFloatingText(480, 260, 'DUO TANK BAJA: BENTENG TEMPUR', '#00e5ff', 32);
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
        window.audioManager && window.audioManager.bump();
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
            window.audioManager && window.audioManager.stomp();
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
      this.peerPlayer.x = 720;
      this.peerPlayer.y = 270;

      this.pacman = {
        score: 0,
        dots: [],
        powerPellets: [],
        ghosts: [
          { x: 440, y: 220, color: '#ef4444', name: 'Blinky', vx: 80, vy: 0 },
          { x: 520, y: 220, color: '#ec4899', name: 'Pinky', vx: -80, vy: 0 },
          { x: 480, y: 260, color: '#00e5ff', name: 'Inky', vx: 0, vy: 80 }
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

      this.addFloatingText(480, 260, 'DUO PAC-MAZE: PESTA TITIK ENERGI', '#ffd700', 32);
    };

    GameEngine.prototype.updatePacman = function(dt) {
      const p = this.pacman;
      if (!p) return;

      // Pacman 4-way movement
      let vx = 0;
      let vy = 0;
      if (this.keysDown['arrowleft'] || this.keysDown['a'] || this.touchState.left) vx -= 1;
      if (this.keysDown['arrowright'] || this.keysDown['d'] || this.touchState.right) vx += 1;
      if (this.keysDown['arrowup'] || this.keysDown['w'] || this.touchState.up) vy -= 1;
      if (this.keysDown['arrowdown'] || this.keysDown['s'] || this.touchState.down) vy += 1;

      const speed = 210;
      if (vx !== 0 || vy !== 0) {
        this.myPlayer.x += vx * speed * dt;
        this.myPlayer.y += vy * speed * dt;
        this.myPlayer.facing = vx < 0 ? -1 : 1;
        this.myPlayer.x = Math.max(60, Math.min(900, this.myPlayer.x));
        this.myPlayer.y = Math.max(60, Math.min(480, this.myPlayer.y));
      }

      // Eat Dots
      for (let i = p.dots.length - 1; i >= 0; i--) {
        const dot = p.dots[i];
        if (Math.hypot(this.myPlayer.x - dot.x, this.myPlayer.y - dot.y) < 18) {
          p.dots.splice(i, 1);
          p.score += 10;
          break;
        }
      }

      // Eat Power Pellet
      for (let i = p.powerPellets.length - 1; i >= 0; i--) {
        const pp = p.powerPellets[i];
        if (Math.hypot(this.myPlayer.x - pp.x, this.myPlayer.y - pp.y) < 22) {
          p.powerPellets.splice(i, 1);
          p.score += 50;
          p.frightenedTimer = 8; // 8 seconds of frightened ghosts
          this.addFloatingText(pp.x, pp.y, 'POWER UP! HANTU BIRU!', '#00e5ff', 24);
          window.audioManager && window.audioManager.portal();
          break;
        }
      }

      if (p.frightenedTimer > 0) p.frightenedTimer -= dt;

      // Ghost roaming & collision
      for (const g of p.ghosts) {
        g.x += g.vx * dt;
        g.y += g.vy * dt;
        if (g.x < 100 || g.x > 860) g.vx = -g.vx;
        if (g.y < 80 || g.y > 460) g.vy = -g.vy;

        // Player touches ghost
        if (Math.hypot(this.myPlayer.x - g.x, this.myPlayer.y - g.y) < 22) {
          if (p.frightenedTimer > 0) {
            // Eat ghost!
            g.x = 480;
            g.y = 240;
            p.score += 200;
            this.addFloatingText(this.myPlayer.x, this.myPlayer.y - 10, '+200 HANTU TERMAKAN!', '#00e5ff', 22);
            window.audioManager && window.audioManager.stomp();
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

      // Maze Wall Borders (Cyberpunk double-line)
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 4;
      ctx.strokeRect(50, 40, 860, 460);
      ctx.strokeRect(360, 180, 240, 160);

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
        this.drawGhostSprite(ctx, g.x, g.y, isFrightened ? '#38bdf8' : g.color, isFrightened);
      }

      // Draw Pac-Mascots (Bobi & Bona with animated mouth chomp)
      this.drawPacMascot(ctx, this.myPlayer.x, this.myPlayer.y, this.localSlot === 1 ? 'bobi' : 'bona', this.myPlayer.facing);
      if (this.peerPlayer.connected) {
        this.drawPacMascot(ctx, this.peerPlayer.x, this.peerPlayer.y, this.localSlot === 1 ? 'bona' : 'bobi', this.peerPlayer.facing);
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

    GameEngine.prototype.drawGhostSprite = function(ctx, x, y, color, isFrightened) {
      ctx.save();
      ctx.translate(x, y);

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;

      // Ghost Head & Body
      ctx.beginPath();
      ctx.arc(0, -4, 12, Math.PI, 0);
      ctx.lineTo(12, 12);
      ctx.lineTo(6, 8);
      ctx.lineTo(0, 12);
      ctx.lineTo(-6, 8);
      ctx.lineTo(-12, 12);
      ctx.closePath();
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-4, -4, 3.5, 0, Math.PI * 2);
      ctx.arc(4, -4, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isFrightened ? '#ef4444' : '#0f172a';
      ctx.beginPath();
      ctx.arc(-4, -4, 1.8, 0, Math.PI * 2);
      ctx.arc(4, -4, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    GameEngine.prototype.drawPacMascot = function(ctx, x, y, type, facing) {
      ctx.save();
      ctx.translate(x, y);
      if (facing === -1) ctx.scale(-1, 1);

      const color = type === 'bobi' ? '#00e5ff' : '#ff3b77';
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;

      const mouthAngle = 0.25 * Math.abs(Math.sin(Date.now() / 150));
      ctx.beginPath();
      ctx.arc(0, 0, 14, mouthAngle * Math.PI, (2 - mouthAngle) * Math.PI);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      // Eye
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(2, -6, 2.5, 0, Math.PI * 2);
      ctx.fill();

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
      this.addFloatingText(480, 260, 'KUIS MATEMATIKA CO-OP!', '#00e5ff', 32);
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
            window.audioManager && window.audioManager.portal();
            this.nextMathQuestion();
          } else {
            m.streak = 0;
            this.addFloatingText(p.x, p.y - 40, 'KURANG TEPAT!', '#ef4444', 22);
            this.createExplosion(p.x, p.y, '#ef4444', 12);
            window.audioManager && window.audioManager.hurt();
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

    // ========================================================
    // 5. PONG MODE & 6. SNAKE MODE STUBS
    // ========================================================
    GameEngine.prototype.initPongMode = function(lvl) {
      this.initMathMode(lvl); // Fallback to math mode with custom skin
    };
    GameEngine.prototype.initSnakeMode = function(lvl) {
      this.initPacmanMode(lvl); // Fallback to pacman mode
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

