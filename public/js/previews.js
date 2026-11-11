// Game Catalog Gameplay Preview & Animated Cuplikan Engine
// Renders rich 2.5D gameplay illustrations and 60FPS live preview on hover!
// Supports Space Shooter, Tank Battle, Pac-Man, Math Challenge, Pong, Snake, and Platformer.

(function() {
  const PREVIEW_CONFIGS = {
    // 1. Shooter (Tembak-Tembakan)
    1: { genre: 'shooter', name: 'Space Blaster', bg: ['#030712', '#0f172a'], accent: '#00e5ff' },
    2: { genre: 'shooter', name: 'Laser Strike', bg: ['#0f051d', '#1e1b4b'], accent: '#a855f7' },

    // 2. Tank (Tank-Tankan)
    3: { genre: 'tank', name: 'Duo Tank Baja', bg: ['#090d16', '#1e293b'], accent: '#10b981' },
    4: { genre: 'tank', name: 'Arena Tank Gurun', bg: ['#1c1917', '#292524'], accent: '#f59e0b' },

    // 3. Pac-Man (Picman)
    5: { genre: 'pacman', name: 'Duo Pac-Maze', bg: ['#020617', '#0f172a'], accent: '#ffd700' },
    6: { genre: 'pacman', name: 'Pac-Man Neon', bg: ['#030712', '#172554'], accent: '#38bdf8' },

    // 4. Math (Soal Matematika)
    7: { genre: 'math', name: 'Kuis Matematika', bg: ['#0f172a', '#1e293b'], accent: '#00e5ff', q: '15 + 17 = ?', ans: '32', wrong1: '28', wrong2: '35' },
    8: { genre: 'math', name: 'Duel Otak Cepat', bg: ['#1e1b4b', '#312e81'], accent: '#c084fc', q: '8 × 7 = ?', ans: '56', wrong1: '54', wrong2: '62' },

    // 5. Pong & 6. Snake
    9: { genre: 'pong', name: 'Neon Pong', bg: ['#020617', '#0f172a'], accent: '#00e5ff' },
    10: { genre: 'snake', name: 'Duo Snake', bg: ['#022c22', '#064e3b'], accent: '#10b981' },

    // 7. Platformers (Levels 1-10)
    11: { genre: 'platformer', name: 'Slime Forest', bg: ['#0f172a', '#064e3b'], accent: '#10b981', obstacles: ['slime', 'key', 'door'] },
    12: { genre: 'platformer', name: 'Cliff Spring', bg: ['#0f172a', '#1e293b'], accent: '#f59e0b', obstacles: ['spring', 'drone', 'key'] },
    13: { genre: 'platformer', name: 'Laser Switch', bg: ['#1e1b4b', '#0f172a'], accent: '#8b5cf6', obstacles: ['switch', 'laser', 'key', 'door'] },
    14: { genre: 'platformer', name: 'Nebula Chasm', bg: ['#030712', '#111827'], accent: '#06b6d4', obstacles: ['spikes', 'drone', 'block', 'key'] },
    15: { genre: 'platformer', name: 'Love Tower', bg: ['#1e1b4b', '#3b0764'], accent: '#ff3b77', obstacles: ['moving_platform', 'key', 'door'] },
    16: { genre: 'platformer', name: 'Lava Rush', bg: ['#450a0a', '#180709'], accent: '#ef4444', obstacles: ['lava', 'spring', 'key'] },
    17: { genre: 'platformer', name: 'Dual Switch', bg: ['#172554', '#0f172a'], accent: '#3b82f6', obstacles: ['switch', 'laser', 'switch', 'door'] },
    18: { genre: 'platformer', name: 'Crystal Ice', bg: ['#082f49', '#0c4a6e'], accent: '#38bdf8', obstacles: ['spikes', 'drone', 'key'] },
    19: { genre: 'platformer', name: 'Triple Drone', bg: ['#1e1e24', '#0f172a'], accent: '#fbbf24', obstacles: ['drone', 'drone', 'key'] },
    20: { genre: 'platformer', name: 'Grand Master', bg: ['#2e1065', '#172554'], accent: '#ec4899', obstacles: ['laser', 'drone', 'slime', 'door'] }
  };

  const activeAnimations = {};

  // Master Drawer
  function drawGameplayScene(canvas, gameId, animTime = 0, isHovered = false) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cfg = PREVIEW_CONFIGS[gameId] || PREVIEW_CONFIGS[11];

    ctx.clearRect(0, 0, w, h);

    if (cfg.genre === 'shooter') {
      drawShooterPreview(ctx, w, h, animTime, isHovered, cfg);
    } else if (cfg.genre === 'tank') {
      drawTankPreview(ctx, w, h, animTime, isHovered, cfg);
    } else if (cfg.genre === 'pacman') {
      drawPacmanPreview(ctx, w, h, animTime, isHovered, cfg);
    } else if (cfg.genre === 'math') {
      drawMathPreview(ctx, w, h, animTime, isHovered, cfg);
    } else if (cfg.genre === 'pong') {
      drawPongPreview(ctx, w, h, animTime, isHovered, cfg);
    } else if (cfg.genre === 'snake') {
      drawSnakePreview(ctx, w, h, animTime, isHovered, cfg);
    } else {
      drawPlatformerPreview(ctx, w, h, animTime, isHovered, cfg);
    }
  }

  // 1. SHOOTER PREVIEW (TEMBAK-TEMBAKAN)
  function drawShooterPreview(ctx, w, h, animTime, isHovered, cfg) {
    // Starfield Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, cfg.bg[0]);
    bgGrad.addColorStop(1, cfg.bg[1]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Stars
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 30; i++) {
      const sx = (i * 37) % w;
      const sy = (i * 29 + animTime * 60) % h;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    // Alien Saucers
    const alienX = w * 0.5 + Math.sin(animTime * 3) * 40;
    const alienY = h * 0.28;
    drawMiniAlien(ctx, alienX, alienY, animTime);
    drawMiniAlien(ctx, alienX - 60, alienY + 12, animTime + 1);
    drawMiniAlien(ctx, alienX + 60, alienY + 12, animTime + 2);

    // Lasers Firing
    if (isHovered || animTime > 0) {
      const laserY = (h * 0.82 - (animTime * 280) % (h * 0.6));
      ctx.save();
      ctx.fillStyle = '#00e5ff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 8;
      ctx.fillRect(w * 0.35, laserY, 3, 14);
      ctx.fillStyle = '#ff3b77';
      ctx.shadowColor = '#ff3b77';
      ctx.fillRect(w * 0.65, (laserY + 20) % (h * 0.6) + h * 0.25, 3, 14);

      // Hit effect
      if (Math.abs(laserY - alienY) < 15) {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(alienX, alienY, 12, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Player Spaceships
    const shipSway = Math.sin(animTime * 4) * 12;
    drawMiniShip(ctx, w * 0.35 + shipSway, h * 0.82, '#00e5ff', animTime);
    drawMiniShip(ctx, w * 0.65 - shipSway, h * 0.82, '#ff3b77', animTime);
  }

  function drawMiniAlien(ctx, x, y, animTime) {
    ctx.save();
    ctx.translate(x, y);

    // Dome
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(0, -3, 6, Math.PI, 0);
    ctx.fill();

    // Saucer Disk
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawMiniShip(ctx, x, y, color, animTime) {
    ctx.save();
    ctx.translate(x, y);

    // Thruster
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(-4, 10);
    ctx.lineTo(0, 16 + Math.random() * 4);
    ctx.lineTo(4, 10);
    ctx.closePath();
    ctx.fill();

    // Body
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(10, 8);
    ctx.lineTo(0, 5);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 2. TANK PREVIEW (TANK-TANKAN)
  function drawTankPreview(ctx, w, h, animTime, isHovered, cfg) {
    // Floor
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    // Brick Obstacles in Center
    ctx.fillStyle = '#b45309';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(w * 0.48 - 8, h * 0.3 + i * 16, 16, 12);
    }

    // Bobi Tank (Left)
    const tankMove = Math.sin(animTime * 2) * 15;
    drawMiniTank(ctx, w * 0.22 + tankMove, h * 0.65, 0, '#00e5ff');

    // Bona Tank (Bottom Left)
    drawMiniTank(ctx, w * 0.22 - tankMove, h * 0.35, 0, '#ff3b77');

    // Enemy Tank (Right)
    drawMiniTank(ctx, w * 0.78, h * 0.5, Math.PI, '#ef4444');

    // Cannon Shell
    if (isHovered || animTime > 0) {
      const shellX = w * 0.28 + ((animTime * 200) % (w * 0.5));
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(shellX, h * 0.65, 3, 0, Math.PI * 2);
      ctx.fill();

      // Blast hit
      if (shellX > w * 0.45 && shellX < w * 0.52) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(w * 0.48, h * 0.65, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawMiniTank(ctx, x, y, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Treads
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-12, -10, 24, 5);
    ctx.fillRect(-12, 5, 24, 5);

    // Hull
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.fillRect(-10, -6, 20, 12);

    // Barrel
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, -2, 16, 4);

    ctx.restore();
  }

  // 3. PAC-MAN PREVIEW (PICMAN)
  function drawPacmanPreview(ctx, w, h, animTime, isHovered, cfg) {
    ctx.fillStyle = '#060a16';
    ctx.fillRect(0, 0, w, h);

    // Maze Corridors
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 16, w - 40, h - 32);
    ctx.strokeRect(w * 0.38, h * 0.32, w * 0.24, h * 0.36);

    // Dots
    ctx.fillStyle = '#fde047';
    for (let x = 40; x < w - 40; x += 22) {
      ctx.beginPath();
      ctx.arc(x, h * 0.22, 2.5, 0, Math.PI * 2);
      ctx.arc(x, h * 0.78, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Power Pellet
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(38, h * 0.22, 6, 0, Math.PI * 2);
    ctx.fill();

    // Pac-Mascot Bobi eating dots
    const pacX = 50 + (animTime * 80) % (w - 120);
    const mouth = 0.25 * Math.abs(Math.sin(animTime * 10));
    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(pacX, h * 0.22, 10, mouth * Math.PI, (2 - mouth) * Math.PI);
    ctx.lineTo(pacX, h * 0.22);
    ctx.closePath();
    ctx.fill();

    // Ghost Blinky chasing
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.beginPath();
    ctx.arc(pacX - 45, h * 0.22, 9, Math.PI, 0);
    ctx.lineTo(pacX - 36, h * 0.22 + 9);
    ctx.lineTo(pacX - 45, h * 0.22 + 6);
    ctx.lineTo(pacX - 54, h * 0.22 + 9);
    ctx.closePath();
    ctx.fill();
  }

  // 4. MATH PREVIEW (SOAL MATEMATIKA)
  function drawMathPreview(ctx, w, h, animTime, isHovered, cfg) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Floor
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, h * 0.76, w, h * 0.24);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, h * 0.76, w, 2);

    // Chalkboard Display
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(w * 0.25, 12, w * 0.5, 42, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = '800 16px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(cfg.q || '15 + 17 = ?', w * 0.5, 38);

    // 3 Answer Portals
    const portals = [
      { x: w * 0.25, val: cfg.wrong1 || '28', correct: false },
      { x: w * 0.5, val: cfg.ans || '32', correct: true },
      { x: w * 0.75, val: cfg.wrong2 || '35', correct: false }
    ];

    for (const p of portals) {
      const isCorrectP = p.correct && (isHovered || animTime > 0.5);
      ctx.fillStyle = isCorrectP ? 'rgba(16, 185, 129, 0.3)' : '#1e293b';
      ctx.strokeStyle = isCorrectP ? '#10b981' : '#00e5ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = isCorrectP ? '#10b981' : '#00e5ff';
      ctx.shadowBlur = isCorrectP ? 12 : 6;
      ctx.beginPath();
      ctx.roundRect(p.x - 24, h * 0.74 - 16, 48, 20, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = '800 12px Outfit, sans-serif';
      ctx.fillStyle = isCorrectP ? '#10b981' : '#ffd700';
      ctx.textAlign = 'center';
      ctx.fillText(p.val, p.x, h * 0.74 - 2);
    }

    // Bobi jumping to correct answer
    const jumpY = Math.sin(animTime * 5) < 0 ? Math.sin(animTime * 5) * 20 : 0;
    drawMiniMascot(ctx, w * 0.5, h * 0.74 - 26 + jumpY, 'bobi');

    if (isHovered || animTime > 0.8) {
      ctx.font = '800 12px Outfit, sans-serif';
      ctx.fillStyle = '#10b981';
      ctx.fillText('BENAR! +250', w * 0.5, h * 0.74 - 45);
    }
  }

  // 5. PONG PREVIEW
  function drawPongPreview(ctx, w, h, animTime, isHovered, cfg) {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);

    // Center Line
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(w * 0.5, 0); ctx.lineTo(w * 0.5, h); ctx.stroke();
    ctx.setLineDash([]);

    // Paddles
    const padY1 = h * 0.5 + Math.sin(animTime * 4) * 30;
    const padY2 = h * 0.5 - Math.sin(animTime * 4) * 30;
    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 8;
    ctx.fillRect(16, padY1 - 16, 6, 32);

    ctx.fillStyle = '#ff3b77';
    ctx.shadowColor = '#ff3b77';
    ctx.fillRect(w - 22, padY2 - 16, 6, 32);

    // Ball
    const ballX = w * 0.5 + Math.cos(animTime * 5) * (w * 0.4);
    const ballY = h * 0.5 + Math.sin(animTime * 5) * (h * 0.3);
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.beginPath(); ctx.arc(ballX, ballY, 5, 0, Math.PI * 2); ctx.fill();
  }

  // 6. SNAKE PREVIEW
  function drawSnakePreview(ctx, w, h, animTime, isHovered, cfg) {
    ctx.fillStyle = '#022c22';
    ctx.fillRect(0, 0, w, h);

    // Glowing Star Fruit
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(w * 0.6, h * 0.45, 6, 0, Math.PI * 2); ctx.fill();

    // Snake Body
    for (let i = 0; i < 7; i++) {
      const sx = w * 0.25 + (animTime * 60 - i * 14) % (w * 0.6);
      const sy = h * 0.55 + Math.sin(animTime * 4 + i * 0.3) * 12;
      ctx.fillStyle = i === 0 ? '#38bdf8' : '#10b981';
      ctx.beginPath(); ctx.arc(sx, sy, 5.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  // 7. PLATFORMER PREVIEW (ORIGINAL CO-OP DUO QUEST)
  function drawPlatformerPreview(ctx, w, h, animTime, isHovered, cfg) {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, cfg.bg[0]);
    bgGrad.addColorStop(1, cfg.bg[1]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Platforms
    drawPlatform(ctx, 0, h * 0.72, w * 0.38, h * 0.28, '#00e5ff');
    drawPlatform(ctx, w * 0.44, h * 0.62, w * 0.24, h * 0.38, cfg.accent);
    drawPlatform(ctx, w * 0.74, h * 0.48, w * 0.26, h * 0.52, '#ff3b77');

    // Trampoline
    if (cfg.obstacles && cfg.obstacles.includes('spring')) {
      const springBounce = isHovered && (Math.sin(animTime * 4) > 0.7);
      drawTrampoline(ctx, w * 0.28, h * 0.72, springBounce);
    }

    // Slime
    if (cfg.obstacles && cfg.obstacles.includes('slime')) {
      const slimeX = w * 0.48 + Math.sin(animTime * 2.5) * 18;
      drawSlime(ctx, slimeX, h * 0.62, animTime);
    }

    // Drone
    if (cfg.obstacles && cfg.obstacles.includes('drone')) {
      const droneX = w * 0.58 + Math.sin(animTime * 2) * 25;
      const droneY = h * 0.3 + Math.cos(animTime * 3) * 8;
      drawDrone(ctx, droneX, droneY, animTime);
    }

    // Door & Key
    drawHeartDoor(ctx, w * 0.85, h * 0.48, true);
    drawKey(ctx, w * 0.55, h * 0.44 + Math.sin(animTime * 4) * 4);

    // Characters
    const jump = Math.sin(animTime * 4) < 0 ? Math.sin(animTime * 4) * 18 : 0;
    drawMiniMascot(ctx, w * 0.16, h * 0.72 - 20 + jump, 'bobi');
    drawMiniMascot(ctx, w * 0.24, h * 0.72 - 20, 'bona');
  }

  // --- Platformer Asset Helpers ---
  function drawPlatform(ctx, x, y, w, h, accent, isMoving = false) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 6;
    ctx.fillRect(x, y, w, 3);
    ctx.shadowBlur = 0;
  }

  function drawMiniMascot(ctx, x, y, type) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = type === 'bobi' ? '#00e5ff' : '#ff3b77';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.roundRect(-10, -10, 20, 20, 4);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(-5, -3, 2, 4);
    ctx.fillRect(3, -3, 2, 4);

    ctx.restore();
  }

  function drawTrampoline(ctx, x, y, bounce) {
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x - 12, y - (bounce ? 2 : 4), 24, bounce ? 2 : 4);
  }

  function drawSlime(ctx, x, y, animTime) {
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(x, y - 6, 8, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
  }

  function drawDrone(ctx, x, y, animTime) {
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x - 8, y - 4, 16, 8);
    // Propeller
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 8);
    ctx.lineTo(x + 12, y - 8);
    ctx.stroke();
  }

  function drawHeartDoor(ctx, x, y, isOpen) {
    ctx.fillStyle = isOpen ? '#ff3b77' : '#1e293b';
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 12, y - 36, 24, 36);
  }

  function drawKey(ctx, x, y) {
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Manager API ---
  window.CatalogPreviewManager = {
    init() {
      const canvases = document.querySelectorAll('.game-preview-canvas');
      canvases.forEach(canvas => {
        const gameId = parseInt(canvas.getAttribute('data-game-id')) || 1;
        drawGameplayScene(canvas, gameId, 0, false);
      });

      this.bindHoverListeners();
    },

    bindHoverListeners() {
      const cards = document.querySelectorAll('.catalog-game-card');
      cards.forEach(card => {
        if (card.dataset.previewBound === 'true') return;
        card.dataset.previewBound = 'true';

        const gameId = parseInt(card.getAttribute('data-game-id')) || 1;
        const canvas = card.querySelector('.game-preview-canvas');
        if (!canvas) return;

        const startPreview = () => {
          if (activeAnimations[gameId]) return;
          card.classList.add('cuplikan-active');

          let startTime = performance.now();
          const loop = (now) => {
            const elapsed = (now - startTime) / 1000;
            drawGameplayScene(canvas, gameId, elapsed, true);
            if (activeAnimations[gameId]) {
              activeAnimations[gameId] = requestAnimationFrame(loop);
            }
          };
          activeAnimations[gameId] = requestAnimationFrame(loop);
        };

        const stopPreview = () => {
          if (activeAnimations[gameId]) {
            cancelAnimationFrame(activeAnimations[gameId]);
            delete activeAnimations[gameId];
          }
          card.classList.remove('cuplikan-active');
          drawGameplayScene(canvas, gameId, 0, false);
        };

        card.addEventListener('mouseenter', startPreview);
        card.addEventListener('mouseleave', stopPreview);

        const titleEl = card.querySelector('.game-card-title');
        if (titleEl) titleEl.addEventListener('mouseenter', startPreview);

        const previewBox = card.querySelector('.game-preview-container');
        if (previewBox) previewBox.addEventListener('mouseenter', startPreview);

        card.addEventListener('touchstart', () => {
          startPreview();
          setTimeout(stopPreview, 4500);
        }, { passive: true });
      });
    }
  };
})();
