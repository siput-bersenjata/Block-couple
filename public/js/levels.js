// Expansive 2.5D Multi-Layer Level Designs for Block Couple
// Features: Wide parallax scrolling, Moving Platforms, Enemies (Patrollers & Flying Drones), Spring Pads, Gaps, Stairs, Co-op Switches, and Golden Keys!

const GAME_LEVELS = [
  // ========================================================
  // LEVEL 1: Gerbang Awal & Monster Lendir (Tutorial & Slime)
  // ========================================================
  {
    id: 1,
    title: "Level 1: Gerbang Awal & Monster Lendir",
    hint: "Gunakan tombol [Buat Balok] untuk jembatan jurang, dan hindari / kurung monster lendir!",
    width: 1500,
    height: 540,
    spawns: {
      p1: { x: 70, y: 430 },
      p2: { x: 120, y: 430 }
    },
    platforms: [
      // Start Zone
      { x: 0, y: 480, width: 340, height: 60, type: 'ground' },
      // Middle Island 1
      { x: 460, y: 480, width: 220, height: 60, type: 'ground' },
      // Step up platform (Anak tangga)
      { x: 760, y: 420, width: 180, height: 120, type: 'ground' },
      // Higher platform
      { x: 1020, y: 350, width: 200, height: 190, type: 'ground' },
      // Goal Zone
      { x: 1300, y: 480, width: 200, height: 60, type: 'ground' }
    ],
    movingPlatforms: [
      // Moving platform over gap between 1020 and 1300
      { id: 'mp1_1', x: 1200, y: 420, width: 80, height: 20, startX: 1180, endX: 1280, startY: 420, endY: 420, speed: 1.2 }
    ],
    springs: [
      // Spring pad on start zone to easily reach high areas
      { id: 'sp1_1', x: 280, y: 466, width: 34, height: 14, bounceForce: -13 }
    ],
    spikes: [
      { x: 340, y: 515, width: 120, height: 25 },
      { x: 680, y: 515, width: 80, height: 25 }
    ],
    enemies: [
      // Patrolling spike slime on middle island
      { id: 'en1_1', type: 'patroller', x: 500, y: 454, width: 30, height: 26, minX: 470, maxX: 650, speed: 1.3 }
    ],
    keys: [
      { id: 'k1_1', x: 840, y: 370 },
      { id: 'k1_2', x: 1110, y: 290 }
    ],
    buttons: [],
    door: { x: 1400, y: 400, width: 50, height: 80 }
  },

  // ========================================================
  // LEVEL 2: Tebing Anak Tangga & Drone Terbang
  // ========================================================
  {
    id: 2,
    title: "Level 2: Tebing Anak Tangga & Drone Terbang",
    hint: "Buat balok bertingkat (anak tangga) atau injak pegas trampolin untuk naik tebing!",
    width: 1700,
    height: 540,
    spawns: {
      p1: { x: 70, y: 430 },
      p2: { x: 120, y: 430 }
    },
    platforms: [
      // Base start
      { x: 0, y: 480, width: 300, height: 60, type: 'ground' },
      // Stepping cliff 1
      { x: 380, y: 380, width: 140, height: 160, type: 'ground' },
      // Stepping cliff 2 (Very high)
      { x: 600, y: 270, width: 150, height: 270, type: 'ground' },
      // Floating bridge
      { x: 840, y: 220, width: 220, height: 25, type: 'ground' },
      // Descending towers
      { x: 1140, y: 330, width: 140, height: 210, type: 'ground' },
      // Exit pedestal
      { x: 1360, y: 480, width: 340, height: 60, type: 'ground' }
    ],
    movingPlatforms: [
      // Vertical lift elevator
      { id: 'mp2_1', x: 760, y: 380, width: 70, height: 20, startX: 760, endX: 760, startY: 420, endY: 230, speed: 1.5 }
    ],
    springs: [
      { id: 'sp2_1', x: 230, y: 466, width: 34, height: 14, bounceForce: -14.5 },
      { id: 'sp2_2', x: 1230, y: 316, width: 34, height: 14, bounceForce: -13 }
    ],
    spikes: [
      { x: 300, y: 515, width: 80, height: 25 },
      { x: 520, y: 515, width: 80, height: 25 },
      { x: 750, y: 515, width: 610, height: 25 }
    ],
    enemies: [
      // Ground patroller on cliff 2
      { id: 'en2_1', type: 'patroller', x: 630, y: 244, width: 30, height: 26, minX: 610, maxX: 720, speed: 1.4 },
      // Flying Glitch Drone hovering over the gap
      { id: 'en2_2', type: 'flying', x: 950, y: 160, width: 32, height: 28, minX: 860, maxX: 1040, baseY: 160, amplitude: 35, frequency: 2.2 }
    ],
    keys: [
      { id: 'k2_1', x: 440, y: 330 },
      { id: 'k2_2', x: 940, y: 140 },
      { id: 'k2_3', x: 1200, y: 270 }
    ],
    buttons: [],
    door: { x: 1580, y: 400, width: 50, height: 80 }
  },

  // ========================================================
  // LEVEL 3: Ruang Saklar & Labirin Laser Co-op
  // ========================================================
  {
    id: 3,
    title: "Level 3: Ruang Saklar & Labirin Laser",
    hint: "Satu pemain menahan tombol saklar agar laser terbuka dan pasanganmu bisa lewat!",
    width: 1750,
    height: 540,
    spawns: {
      p1: { x: 70, y: 430 },
      p2: { x: 120, y: 430 }
    },
    platforms: [
      // Starting deck
      { x: 0, y: 480, width: 320, height: 60, type: 'ground' },
      // Upper switch balcony
      { x: 260, y: 310, width: 260, height: 25, type: 'ground' },
      // Wall separator
      { x: 580, y: 120, width: 24, height: 420, type: 'ground' },
      // Central lower arena
      { x: 604, y: 480, width: 440, height: 60, type: 'ground' },
      // Upper puzzle ceiling
      { x: 700, y: 260, width: 300, height: 25, type: 'ground' },
      // Far right goal wall
      { x: 1260, y: 180, width: 24, height: 360, type: 'ground' },
      // End platform
      { x: 1284, y: 480, width: 460, height: 60, type: 'ground' },

      // Laser barrier 1 (controlled by upper button)
      { id: 'barrier_b3_1', x: 580, y: 40, width: 24, height: 80, type: 'barrier' },
      // Laser barrier 2 (controlled by central arena button)
      { id: 'barrier_b3_2', x: 1260, y: 40, width: 24, height: 140, type: 'barrier' }
    ],
    movingPlatforms: [
      { id: 'mp3_1', x: 1080, y: 380, width: 85, height: 20, startX: 1060, endX: 1220, startY: 380, endY: 380, speed: 1.6 }
    ],
    springs: [
      { id: 'sp3_1', x: 200, y: 466, width: 34, height: 14, bounceForce: -13.5 },
      { id: 'sp3_2', x: 980, y: 466, width: 34, height: 14, bounceForce: -14 }
    ],
    spikes: [
      { x: 320, y: 515, width: 260, height: 25 },
      { x: 1044, y: 515, width: 240, height: 25 }
    ],
    buttons: [
      // Button on upper balcony lowers barrier 1
      { id: 'btn3_1', x: 420, y: 295, width: 45, height: 15, linkedBarrierId: 'barrier_b3_1' },
      // Button on upper chamber lowers barrier 2
      { id: 'btn3_2', x: 840, y: 245, width: 45, height: 15, linkedBarrierId: 'barrier_b3_2' }
    ],
    enemies: [
      // Patrol slime in central arena
      { id: 'en3_1', type: 'patroller', x: 670, y: 454, width: 30, height: 26, minX: 620, maxX: 950, speed: 1.8 },
      // Flying drone patrolling the ceiling
      { id: 'en3_2', type: 'flying', x: 850, y: 190, width: 32, height: 28, minX: 740, maxX: 960, baseY: 190, amplitude: 25, frequency: 2.0 }
    ],
    keys: [
      { id: 'k3_1', x: 480, y: 240 },
      { id: 'k3_2', x: 880, y: 390 }
    ],
    door: { x: 1600, y: 400, width: 50, height: 80 }
  },

  // ========================================================
  // LEVEL 4: Jurang Nebula & Kawanan Drone
  // ========================================================
  {
    id: 4,
    title: "Level 4: Jurang Nebula & Kawanan Drone",
    hint: "Bangun balok di udara secara estafet! Waspadai drone yang melayang cepat!",
    width: 1850,
    height: 540,
    spawns: {
      p1: { x: 70, y: 430 },
      p2: { x: 120, y: 430 }
    },
    platforms: [
      { x: 0, y: 480, width: 260, height: 60, type: 'ground' },
      { x: 380, y: 400, width: 100, height: 140, type: 'ground' },
      { x: 620, y: 300, width: 100, height: 240, type: 'ground' },
      { x: 880, y: 420, width: 120, height: 120, type: 'ground' },
      { x: 1140, y: 280, width: 110, height: 260, type: 'ground' },
      { x: 1400, y: 380, width: 100, height: 160, type: 'ground' },
      { x: 1620, y: 480, width: 230, height: 60, type: 'ground' }
    ],
    movingPlatforms: [
      { id: 'mp4_1', x: 490, y: 350, width: 80, height: 20, startX: 490, endX: 610, startY: 350, endY: 350, speed: 1.8 },
      { id: 'mp4_2', x: 1260, y: 340, width: 80, height: 20, startX: 1260, endX: 1390, startY: 340, endY: 340, speed: 2.0 }
    ],
    springs: [
      { id: 'sp4_1', x: 200, y: 466, width: 34, height: 14, bounceForce: -13 },
      { id: 'sp4_2', x: 920, y: 406, width: 34, height: 14, bounceForce: -15 }
    ],
    spikes: [
      { x: 260, y: 515, width: 1360, height: 25 }
    ],
    enemies: [
      { id: 'en4_1', type: 'flying', x: 500, y: 220, width: 32, height: 28, minX: 420, maxX: 600, baseY: 220, amplitude: 40, frequency: 2.5 },
      { id: 'en4_2', type: 'patroller', x: 640, y: 274, width: 30, height: 26, minX: 625, maxX: 710, speed: 1.5 },
      { id: 'en4_3', type: 'flying', x: 1020, y: 240, width: 32, height: 28, minX: 950, maxX: 1120, baseY: 240, amplitude: 50, frequency: 2.8 },
      { id: 'en4_4', type: 'patroller', x: 1160, y: 254, width: 30, height: 26, minX: 1145, maxX: 1240, speed: 1.6 }
    ],
    keys: [
      { id: 'k4_1', x: 430, y: 340 },
      { id: 'k4_2', x: 670, y: 240 },
      { id: 'k4_3', x: 1450, y: 320 }
    ],
    buttons: [],
    door: { x: 1720, y: 400, width: 50, height: 80 }
  },

  // ========================================================
  // LEVEL 5: Puncak Cinta Block Couple (Grand Finale Tower)
  // ========================================================
  {
    id: 5,
    title: "Level 5: Puncak Cinta Block Couple",
    hint: "Bekerjasama menaiki Menara Cinta Agung! Bersiap untuk pesta kemenangan!",
    width: 1920,
    height: 540,
    spawns: {
      p1: { x: 80, y: 430 },
      p2: { x: 130, y: 430 }
    },
    platforms: [
      // Base floors
      { x: 0, y: 480, width: 360, height: 60, type: 'ground' },
      { x: 1560, y: 480, width: 360, height: 60, type: 'ground' },
      // Pyramid stepping tiers (Anak tangga menara)
      { x: 300, y: 390, width: 140, height: 30, type: 'ground' },
      { x: 1480, y: 390, width: 140, height: 30, type: 'ground' },
      { x: 480, y: 310, width: 140, height: 30, type: 'ground' },
      { x: 1300, y: 310, width: 140, height: 30, type: 'ground' },
      { x: 660, y: 230, width: 140, height: 30, type: 'ground' },
      { x: 1120, y: 230, width: 140, height: 30, type: 'ground' },
      // Imperial Center Apex (Throne of Unity)
      { x: 860, y: 150, width: 200, height: 35, type: 'ground' }
    ],
    movingPlatforms: [
      // Cross-moving platforms towards the summit
      { id: 'mp5_1', x: 800, y: 220, width: 60, height: 18, startX: 790, endX: 860, startY: 220, endY: 220, speed: 1.5 },
      { id: 'mp5_2', x: 1060, y: 220, width: 60, height: 18, startX: 1060, endX: 1130, startY: 220, endY: 220, speed: 1.5 }
    ],
    springs: [
      { id: 'sp5_1', x: 260, y: 466, width: 34, height: 14, bounceForce: -14 },
      { id: 'sp5_2', x: 1620, y: 466, width: 34, height: 14, bounceForce: -14 }
    ],
    spikes: [
      { x: 360, y: 515, width: 1200, height: 25 }
    ],
    enemies: [
      { id: 'en5_1', type: 'patroller', x: 500, y: 284, width: 30, height: 26, minX: 485, maxX: 610, speed: 1.6 },
      { id: 'en5_2', type: 'patroller', x: 1320, y: 284, width: 30, height: 26, minX: 1305, maxX: 1430, speed: 1.6 },
      { id: 'en5_3', type: 'flying', x: 960, y: 80, width: 32, height: 28, minX: 890, maxX: 1030, baseY: 80, amplitude: 25, frequency: 3.0 }
    ],
    keys: [
      { id: 'k5_1', x: 550, y: 260 },
      { id: 'k5_2', x: 1370, y: 260 },
      { id: 'k5_3', x: 960, y: 90 }
    ],
    door: { x: 935, y: 70, width: 50, height: 80 }
  }
];

if (typeof module !== 'undefined') {
  module.exports = { GAME_LEVELS };
}
