// Game Catalog Gameplay Preview & Animated Cuplikan Engine
// Renders rich 2.5D gameplay illustrations and 60FPS live preview on hover!

(function() {
  const PREVIEW_CONFIGS = {
    1: { name: 'Slime Forest', bg: ['#0f172a', '#064e3b'], accent: '#10b981', obstacles: ['slime', 'key', 'door'], bobiAction: 'run', bonaAction: 'block' },
    2: { name: 'Cliff Spring', bg: ['#0f172a', '#1e293b'], accent: '#f59e0b', obstacles: ['spring', 'drone', 'key'], bobiAction: 'spring_jump', bonaAction: 'run' },
    3: { name: 'Laser Switch', bg: ['#1e1b4b', '#0f172a'], accent: '#8b5cf6', obstacles: ['switch', 'laser', 'key', 'door'], bobiAction: 'press_switch', bonaAction: 'run' },
    4: { name: 'Nebula Chasm', bg: ['#030712', '#111827'], accent: '#06b6d4', obstacles: ['spikes', 'drone', 'block', 'key'], bobiAction: 'jump', bonaAction: 'place_bridge' },
    5: { name: 'Love Tower', bg: ['#1e1b4b', '#3b0764'], accent: '#ff3b77', obstacles: ['moving_platform', 'key', 'door'], bobiAction: 'moving_lift', bonaAction: 'run' },
    6: { name: 'Lava Rush', bg: ['#450a0a', '#180709'], accent: '#ef4444', obstacles: ['lava', 'spring', 'key'], bobiAction: 'spring_jump', bonaAction: 'run' },
    7: { name: 'Dual Switch', bg: ['#172554', '#0f172a'], accent: '#3b82f6', obstacles: ['switch', 'laser', 'switch', 'door'], bobiAction: 'press_switch', bonaAction: 'run' },
    8: { name: 'Crystal Ice', bg: ['#082f49', '#0c4a6e'], accent: '#38bdf8', obstacles: ['spikes', 'drone', 'key'], bobiAction: 'jump', bonaAction: 'place_bridge' },
    9: { name: 'Triple Drone', bg: ['#1e1e24', '#0f172a'], accent: '#fbbf24', obstacles: ['drone', 'drone', 'key'], bobiAction: 'duck', bonaAction: 'run' },
    10: { name: 'Grand Master', bg: ['#2e1065', '#172554'], accent: '#ec4899', obstacles: ['laser', 'drone', 'slime', 'door'], bobiAction: 'run', bonaAction: 'jump' },
    11: { name: 'Bridge Collapse', bg: ['#1e293b', '#0f172a'], accent: '#00e5ff', obstacles: ['spikes', 'block', 'key'], bobiAction: 'jump', bonaAction: 'place_bridge' },
    12: { name: 'Switch Chain', bg: ['#312e81', '#1e1b4b'], accent: '#a855f7', obstacles: ['switch', 'laser', 'door'], bobiAction: 'press_switch', bonaAction: 'run' },
    13: { name: 'Double Slime', bg: ['#022c22', '#0f172a'], accent: '#10b981', obstacles: ['slime', 'slime', 'key'], bobiAction: 'stomp_slime', bonaAction: 'run' },
    14: { name: 'Wind Cliff', bg: ['#0c4a6e', '#0369a1'], accent: '#38bdf8', obstacles: ['drone', 'spring', 'key'], bobiAction: 'spring_jump', bonaAction: 'run' },
    15: { name: 'Moving Spikes', bg: ['#18181b', '#09090b'], accent: '#f43f5e', obstacles: ['moving_platform', 'spikes', 'key'], bobiAction: 'moving_lift', bonaAction: 'jump' },
    16: { name: 'Twin Riddle', bg: ['#1e1b4b', '#3b0764'], accent: '#c084fc', obstacles: ['key', 'key', 'door'], bobiAction: 'run', bonaAction: 'run' },
    17: { name: 'Multi Lift', bg: ['#0f172a', '#1e293b'], accent: '#eab308', obstacles: ['moving_platform', 'moving_platform', 'door'], bobiAction: 'moving_lift', bonaAction: 'jump' },
    18: { name: 'Crystal Cave', bg: ['#164e63', '#083344'], accent: '#22d3ee', obstacles: ['spikes', 'block', 'key'], bobiAction: 'place_bridge', bonaAction: 'run' },
    19: { name: 'Speed Laser', bg: ['#450a0a', '#1e1b4b'], accent: '#f43f5e', obstacles: ['laser', 'switch', 'door'], bobiAction: 'press_switch', bonaAction: 'run' },
    20: { name: 'Eternal Glory', bg: ['#3b0764', '#0f172a'], accent: '#ffd700', obstacles: ['door', 'spring', 'drone'], bobiAction: 'spring_jump', bonaAction: 'jump' }
  };

  const activeAnimations = {};

  // Procedural 2.5D Drawer
  function drawGameplayScene(canvas, gameId, animTime = 0, isHovered = false) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cfg = PREVIEW_CONFIGS[gameId] || PREVIEW_CONFIGS[1];

    ctx.clearRect(0, 0, w, h);

    // 1. Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, cfg.bg[0]);
    bgGrad.addColorStop(1, cfg.bg[1]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle Grid / Starfield in distance
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Distant mountain silhouette
    ctx.fillStyle = 'rgba(10, 15, 30, 0.55)';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h * 0.65);
    ctx.lineTo(w * 0.28, h * 0.42);
    ctx.lineTo(w * 0.55, h * 0.58);
    ctx.lineTo(w * 0.82, h * 0.38);
    ctx.lineTo(w, h * 0.55);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // 2. Platforms Setup (Multi-Tier 2.5D)
    // Left Base Platform
    drawPlatform(ctx, 0, h * 0.72, w * 0.38, h * 0.28, '#00e5ff');
    // Middle Platform
    drawPlatform(ctx, w * 0.44, h * 0.62, w * 0.24, h * 0.38, cfg.accent);
    // Right Goal Platform
    drawPlatform(ctx, w * 0.74, h * 0.48, w * 0.26, h * 0.52, '#ff3b77');

    // Moving Platform (if applicable)
    if (cfg.obstacles.includes('moving_platform')) {
      const moveOffset = Math.sin(animTime * 2) * 18;
      drawPlatform(ctx, w * 0.36 + moveOffset, h * 0.46, w * 0.16, 10, '#ffd700', true);
    }

    // Spikes / Lava at bottom
    if (cfg.obstacles.includes('lava')) {
      drawLavaHazard(ctx, w * 0.38, h * 0.85, w * 0.36, h * 0.15, animTime);
    } else if (cfg.obstacles.includes('spikes')) {
      drawSpikesHazard(ctx, w * 0.38, h * 0.88, w * 0.36, 16);
    }

    // 3. Game Hazards & Gadgets
    // Laser Barrier & Switch
    if (cfg.obstacles.includes('laser')) {
      const laserActive = !cfg.obstacles.includes('switch') || (Math.sin(animTime * 1.5) > 0.2);
      drawLaserBarrier(ctx, w * 0.68, h * 0.15, 12, h * 0.55, laserActive, animTime);
    }
    if (cfg.obstacles.includes('switch')) {
      const isPressed = Math.sin(animTime * 1.5) <= 0.2;
      drawSwitch(ctx, w * 0.49, h * 0.62, isPressed);
    }

    // Trampoline Spring
    if (cfg.obstacles.includes('spring')) {
      const springBounce = isHovered && (Math.sin(animTime * 4) > 0.7);
      drawTrampoline(ctx, w * 0.28, h * 0.72, springBounce);
    }

    // Slime Monster
    if (cfg.obstacles.includes('slime')) {
      const slimeX = w * 0.48 + Math.sin(animTime * 2.5) * 18;
      drawSlime(ctx, slimeX, h * 0.62, animTime);
    }

    // Flying Drone
    if (cfg.obstacles.includes('drone')) {
      const droneX = w * 0.56 + Math.cos(animTime * 2) * 22;
      const droneY = h * 0.24 + Math.sin(animTime * 3) * 10;
      drawDrone(ctx, droneX, droneY, animTime);
    }

    // Golden Key
    if (cfg.obstacles.includes('key')) {
      const keyY = h * 0.34 + Math.sin(animTime * 3) * 6;
      drawGoldenKey(ctx, w * 0.56, keyY, animTime);
    }

    // Heart Door
    if (cfg.obstacles.includes('door')) {
      drawGoalDoor(ctx, w * 0.84, h * 0.48, animTime);
    }

    // 4. Draw Characters (Bobi & Bona)
    // Bobi (Player 1 - Cyan)
    let bobiX = w * 0.12;
    let bobiY = h * 0.72;
    let bobiJump = false;

    if (isHovered) {
      if (cfg.bobiAction === 'spring_jump') {
        const cycle = (animTime * 2) % (Math.PI * 2);
        bobiX = w * 0.15 + Math.sin(cycle) * 28;
        bobiY = h * 0.72 - Math.max(0, Math.sin(cycle)) * 46;
        bobiJump = Math.sin(cycle) > 0.1;
      } else {
        bobiX = w * 0.14 + Math.sin(animTime * 3) * 20;
        bobiY = h * 0.72 - Math.abs(Math.sin(animTime * 6)) * 12;
        bobiJump = Math.abs(Math.sin(animTime * 6)) > 0.3;
      }
    }
    drawCharacter(ctx, bobiX, bobiY, '#00e5ff', 'bobi', bobiJump, animTime);

    // Bona (Player 2 - Magenta)
    let bonaX = w * 0.24;
    let bonaY = h * 0.72;
    let bonaJump = false;

    if (isHovered) {
      bonaX = w * 0.24 + Math.cos(animTime * 2.8) * 16;
      bonaY = h * 0.72 - Math.abs(Math.cos(animTime * 5.6)) * 10;
      bonaJump = Math.abs(Math.cos(animTime * 5.6)) > 0.3;
    }
    drawCharacter(ctx, bonaX, bonaY, '#ff3b77', 'bona', bonaJump, animTime);

    // Bridge Blocks (if applicable)
    if (cfg.bonaAction === 'place_bridge') {
      drawPlacedBlock(ctx, w * 0.38, h * 0.72 - 16, '#ff3b77', animTime);
    }

    // 5. Overlay Polish & Vignette
    // Top-to-bottom subtle border glow
    ctx.strokeStyle = isHovered ? 'rgba(0, 229, 255, 0.65)' : 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    // Bottom soft shadow for text contrast
    const botGrad = ctx.createLinearGradient(0, h * 0.75, 0, h);
    botGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    botGrad.addColorStop(1, 'rgba(10, 15, 30, 0.85)');
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, h * 0.75, w, h * 0.25);
  }

  // --- Helpers for Geometry & Assets ---
  function drawPlatform(ctx, x, y, w, h, neonColor, isMoving = false) {
    ctx.fillStyle = '#111827';
    ctx.fillRect(x, y, w, h);

    // Neon edge highlight
    ctx.fillStyle = neonColor;
    ctx.fillRect(x, y, w, 4);

    // Subtle edge highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(x, y + 4, w, 2);

    if (isMoving) {
      // Glow under moving platform
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.fillRect(x + 4, y + 6, w - 8, 4);
    }
  }

  function drawCharacter(ctx, x, y, color, type, isJumping, animTime) {
    const size = 22;
    const drawY = y - size;

    ctx.save();
    ctx.translate(x, drawY);

    // Body
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, 5);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Face / Eyes
    const blink = (Math.sin(animTime * 2.5) > 0.95);
    ctx.fillStyle = '#000000';
    if (blink) {
      ctx.fillRect(5, 9, 4, 1.5);
      ctx.fillRect(13, 9, 4, 1.5);
    } else {
      ctx.beginPath();
      ctx.arc(7, 9, 2.2, 0, Math.PI * 2);
      ctx.arc(15, 9, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Eye catchlights
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(7.5, 8.5, 0.8, 0, Math.PI * 2);
      ctx.arc(15.5, 8.5, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Accessory: Bobi Cap vs Bona Bow
    if (type === 'bobi') {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(2, -4, 18, 4);
      ctx.fillRect(14, -2, 6, 2);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(17, -2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawSlime(ctx, x, y, animTime) {
    const squash = 1 + Math.sin(animTime * 6) * 0.15;
    const w = 20 * squash;
    const h = 16 / squash;

    ctx.save();
    ctx.translate(x, y - h);
    ctx.fillStyle = '#a855f7';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Slime Eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2 - 1, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(w / 2 + 1, h / 2 - 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawDrone(ctx, x, y, animTime) {
    ctx.save();
    ctx.translate(x, y);

    // Propeller spinning
    const propW = 20 * Math.cos(animTime * 20);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-propW / 2, -6);
    ctx.lineTo(propW / 2, -6);
    ctx.stroke();

    // Body
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(-10, -5, 20, 12, 4);
    ctx.fill();

    // Glowing Scanner Eye
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 1, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Thruster sparks
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-2, 7, 4, 3 + Math.sin(animTime * 15) * 2);
    ctx.restore();
  }

  function drawLaserBarrier(ctx, x, y, w, h, active, animTime) {
    ctx.fillStyle = '#475569';
    ctx.fillRect(x, y, w, 8);
    ctx.fillRect(x, y + h - 8, w, 8);

    if (active) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.75)';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;
      ctx.fillRect(x + 2, y + 8, w - 4, h - 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 4, y + 8, w - 8, h - 16);
      ctx.shadowBlur = 0;
    }
  }

  function drawSwitch(ctx, x, y, isPressed) {
    ctx.fillStyle = '#475569';
    ctx.fillRect(x - 12, y - 4, 24, 4);

    ctx.fillStyle = isPressed ? '#22c55e' : '#f59e0b';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 6;
    const btnHeight = isPressed ? 2 : 6;
    ctx.fillRect(x - 9, y - 4 - btnHeight, 18, btnHeight);
    ctx.shadowBlur = 0;
  }

  function drawTrampoline(ctx, x, y, isBouncing) {
    ctx.fillStyle = '#334155';
    ctx.fillRect(x, y - 4, 22, 4);

    ctx.fillStyle = isBouncing ? '#00e5ff' : '#f59e0b';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 6;
    ctx.fillRect(x + 2, y - 8, 18, 4);
    ctx.shadowBlur = 0;
  }

  function drawGoldenKey(ctx, x, y, animTime) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(0, -1.5, 8, 3);
    ctx.fillRect(5, 1, 2.5, 3.5);
    ctx.restore();
  }

  function drawGoalDoor(ctx, x, y, animTime) {
    ctx.fillStyle = '#1e1b4b';
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(x, y - 36, 24, 36, [6, 6, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // Heart icon inside door
    ctx.fillStyle = '#ff3b77';
    ctx.beginPath();
    ctx.arc(x + 8.5, y - 20, 3, 0, Math.PI * 2);
    ctx.arc(x + 15.5, y - 20, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 5.5, y - 18.5);
    ctx.lineTo(x + 18.5, y - 18.5);
    ctx.lineTo(x + 12, y - 11);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function drawSpikesHazard(ctx, x, y, w, h) {
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 6;
    const spikeW = 8;
    const count = Math.floor(w / spikeW);
    for (let i = 0; i < count; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * spikeW, y + h);
      ctx.lineTo(x + i * spikeW + spikeW / 2, y);
      ctx.lineTo(x + (i + 1) * spikeW, y + h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  function drawLavaHazard(ctx, x, y, w, h, animTime) {
    const lavaGrad = ctx.createLinearGradient(0, y, 0, y + h);
    lavaGrad.addColorStop(0, '#f97316');
    lavaGrad.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = lavaGrad;
    ctx.fillRect(x, y, w, h);

    // Glowing bubbling ripples
    ctx.fillStyle = '#fef08a';
    for (let i = 0; i < 4; i++) {
      const rx = x + ((i * 30 + animTime * 15) % w);
      ctx.beginPath();
      ctx.arc(rx, y + 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlacedBlock(ctx, x, y, color, animTime) {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.fillRect(x, y, 16, 16);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(x + 2, y + 2, 12, 2);
    ctx.shadowBlur = 0;
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

        // Trigger on card hover
        card.addEventListener('mouseenter', startPreview);
        card.addEventListener('mouseleave', stopPreview);

        // Also explicitly trigger on title hover (as requested by user)
        const titleEl = card.querySelector('.game-card-title');
        if (titleEl) {
          titleEl.addEventListener('mouseenter', startPreview);
        }

        // Also trigger on preview canvas container hover
        const previewBox = card.querySelector('.game-preview-container');
        if (previewBox) {
          previewBox.addEventListener('mouseenter', startPreview);
        }

        // Also bind to mobile tap / touch
        card.addEventListener('touchstart', () => {
          startPreview();
          setTimeout(stopPreview, 4500);
        }, { passive: true });
      });
    }
  };
})();
