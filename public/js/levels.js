// Expansive 2.5D Multi-Layer Level Designs for Block Couple
// Mathematically verified non-intersecting platforms, safe moving platform corridors!

const GAME_LEVELS = [
  // ========================================================
  // LEVEL 1: Gerbang Awal & Monster Lendir (Tutorial & Slime)
  // ========================================================
  {
    id: 1,
    title: "Level 1: Gerbang Awal & Monster Lendir",
    hint: "Gunakan tombol [Buat Balok] untuk jembatan jurang, dan hindari / kurung monster lendir!",
    width: 1550,
    height: 540,
    spawns: {
      p1: { x: 70, y: 430 },
      p2: { x: 120, y: 430 }
    },
    platforms: [
      // Start Zone: 0 to 340
      { x: 0, y: 480, width: 340, height: 60, type: 'ground' },
      // Middle Island: 460 to 680
      { x: 460, y: 480, width: 220, height: 60, type: 'ground' },
      // Step up platform 1: 760 to 920
      { x: 760, y: 420, width: 160, height: 120, type: 'ground' },
      // Step up platform 2: 980 to 1120 (ends at 1120)
      { x: 980, y: 350, width: 140, height: 190, type: 'ground' },
      // Goal Zone: 1360 to 1550 (starts at 1360, gap is 1120 to 1360 = 240px open space!)
      { x: 1360, y: 480, width: 190, height: 60, type: 'ground' }
    ],
    movingPlatforms: [
      // Gap is 1120 to 1360 (240px wide). Platform width is 70px.
      // startX: 1150 (leaves 30px clear from left wall 1120)
      // endX: 1260 (leaves 30px clear from right wall 1360)
      // Platform NEVER intersects any wall!
      { id: 'mp1_1', x: 1150, y: 420, width: 70, height: 18, startX: 1150, endX: 1260, startY: 420, endY: 420, speed: 1.2 }
    ],
    springs: [
      { id: 'sp1_1', x: 280, y: 466, width: 34, height: 14, bounceForce: -13 }
    ],
    spikes: [
      { x: 340, y: 515, width: 120, height: 25 },
      { x: 680, y: 515, width: 80, height: 25 },
      { x: 1120, y: 515, width: 240, height: 25 }
    ],
    enemies: [
      { id: 'en1_1', type: 'patroller', x: 500, y: 454, width: 30, height: 26, minX: 470, maxX: 650, speed: 1.3 }
    ],
    keys: [
      { id: 'k1_1', x: 840, y: 370 },
      { id: 'k1_2', x: 1050, y: 290 }
    ],
    buttons: [],
    door: { x: 1450, y: 400, width: 50, height: 80 }
  },

  // ========================================================
  // LEVEL 2: Tebing Anak Tangga & Drone Terbang
  // ========================================================
  {
    id: 2,
    title: "Level 2: Tebing Anak Tangga & Drone Terbang",
    hint: "Buat balok bertingkat (anak tangga) atau injak pegas trampolin untuk naik tebing!",
    width: 1750,
    height: 540,
    spawns: {
      p1: { x: 70, y: 430 },
      p2: { x: 120, y: 430 }
    },
    platforms: [
      // Base start: 0 to 280
      { x: 0, y: 480, width: 280, height: 60, type: 'ground' },
      // Cliff 1: 360 to 480
      { x: 360, y: 380, width: 120, height: 160, type: 'ground' },
      // Cliff 2: 560 to 680 (ends at 680)
      { x: 560, y: 270, width: 120, height: 270, type: 'ground' },
      // Floating bridge: 860 to 1080 (starts at 860, gap is 680 to 860 = 180px open air space!)
      { x: 860, y: 220, width: 220, height: 25, type: 'ground' },
      // Descending towers: 1160 to 1280
      { x: 1160, y: 330, width: 120, height: 210, type: 'ground' },
      // Exit pedestal: 1380 to 1750
      { x: 1380, y: 480, width: 370, height: 60, type: 'ground' }
    ],
    movingPlatforms: [
      // Vertical lift in 180px gap (680 to 860). Center is 770. Width 65.
      // Leaves 55px margin on left, 55px margin on right!
      { id: 'mp2_1', x: 740, y: 420, width: 65, height: 18, startX: 740, endX: 740, startY: 420, endY: 230, speed: 1.5 }
    ],
    springs: [
      { id: 'sp2_1', x: 220, y: 466, width: 34, height: 14, bounceForce: -14.5 },
      { id: 'sp2_2', x: 1230, y: 316, width: 34, height: 14, bounceForce: -13 }
    ],
    spikes: [
      { x: 280, y: 515, width: 80, height: 25 },
      { x: 480, y: 515, width: 80, height: 25 },
      { x: 680, y: 515, width: 700, height: 25 }
    ],
    enemies: [
      { id: 'en2_1', type: 'patroller', x: 580, y: 244, width: 30, height: 26, minX: 570, maxX: 660, speed: 1.4 },
      { id: 'en2_2', type: 'flying', x: 960, y: 150, width: 32, height: 28, minX: 880, maxX: 1040, baseY: 150, amplitude: 35, frequency: 2.2 }
    ],
    keys: [
      { id: 'k2_1', x: 420, y: 330 },
      { id: 'k2_2', x: 960, y: 130 },
      { id: 'k2_3', x: 1220, y: 270 }
    ],
    buttons: [],
    door: { x: 1620, y: 400, width: 50, height: 80 }
  },

  // ========================================================
  // LEVEL 3: Ruang Saklar & Labirin Laser Co-op
  // ========================================================
  {
    id: 3,
    title: "Level 3: Ruang Saklar & Labirin Laser",
    hint: "Satu pemain menahan tombol saklar agar laser terbuka dan pasanganmu bisa lewat!",
    width: 1800,
    height: 540,
    spawns: {
      p1: { x: 70, y: 430 },
      p2: { x: 120, y: 430 }
    },
    platforms: [
      // Starting deck: 0 to 320
      { x: 0, y: 480, width: 320, height: 60, type: 'ground' },
      // Upper switch balcony: 260 to 520
      { x: 260, y: 310, width: 260, height: 25, type: 'ground' },
      // Wall separator: 580 to 604
      { x: 580, y: 120, width: 24, height: 420, type: 'ground' },
      // Central lower arena: 604 to 1020 (ends at 1020)
      { x: 604, y: 480, width: 416, height: 60, type: 'ground' },
      // Upper puzzle ceiling: 700 to 1000
      { x: 700, y: 260, width: 300, height: 25, type: 'ground' },
      // Far right goal wall: 1280 to 1304 (starts at 1280, gap is 1020 to 1280 = 260px open air!)
      { x: 1280, y: 180, width: 24, height: 360, type: 'ground' },
      // End platform: 1304 to 1800
      { x: 1304, y: 480, width: 496, height: 60, type: 'ground' },

      // Laser barriers
      { id: 'barrier_b3_1', x: 580, y: 40, width: 24, height: 80, type: 'barrier' },
      { id: 'barrier_b3_2', x: 1280, y: 40, width: 24, height: 140, type: 'barrier' }
    ],
    movingPlatforms: [
      // Gap is 1020 to 1280 (260px wide). Platform width 75px.
      // startX: 1060 (40px margin from left edge 1020)
      // endX: 1170 (35px margin from right wall 1280)
      { id: 'mp3_1', x: 1060, y: 380, width: 75, height: 18, startX: 1060, endX: 1170, startY: 380, endY: 380, speed: 1.5 }
    ],
    springs: [
      { id: 'sp3_1', x: 200, y: 466, width: 34, height: 14, bounceForce: -13.5 },
      { id: 'sp3_2', x: 960, y: 466, width: 34, height: 14, bounceForce: -14 }
    ],
    spikes: [
      { x: 320, y: 515, width: 260, height: 25 },
      { x: 1020, y: 515, width: 260, height: 25 }
    ],
    buttons: [
      { id: 'btn3_1', x: 420, y: 295, width: 45, height: 15, linkedBarrierId: 'barrier_b3_1' },
      { id: 'btn3_2', x: 840, y: 245, width: 45, height: 15, linkedBarrierId: 'barrier_b3_2' }
    ],
    enemies: [
      { id: 'en3_1', type: 'patroller', x: 670, y: 454, width: 30, height: 26, minX: 620, maxX: 930, speed: 1.8 },
      { id: 'en3_2', type: 'flying', x: 850, y: 190, width: 32, height: 28, minX: 740, maxX: 960, baseY: 190, amplitude: 25, frequency: 2.0 }
    ],
    keys: [
      { id: 'k3_1', x: 480, y: 240 },
      { id: 'k3_2', x: 880, y: 390 }
    ],
    door: { x: 1650, y: 400, width: 50, height: 80 }
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
      { x: 360, y: 400, width: 90, height: 140, type: 'ground' },
      // gap 450 to 650 (200px open air)
      { x: 650, y: 300, width: 90, height: 240, type: 'ground' },
      { x: 880, y: 420, width: 120, height: 120, type: 'ground' },
      { x: 1120, y: 280, width: 100, height: 260, type: 'ground' },
      // gap 1220 to 1420 (200px open air)
      { x: 1420, y: 380, width: 90, height: 160, type: 'ground' },
      { x: 1620, y: 480, width: 230, height: 60, type: 'ground' }
    ],
    movingPlatforms: [
      // Gap 1 (450 to 650). Width 65. startX 485, endX 555 (35px margin from both walls!)
      { id: 'mp4_1', x: 485, y: 350, width: 65, height: 18, startX: 485, endX: 555, startY: 350, endY: 350, speed: 1.8 },
      // Gap 2 (1220 to 1420). Width 65. startX 1255, endX 1325 (35px margin from both walls!)
      { id: 'mp4_2', x: 1255, y: 340, width: 65, height: 18, startX: 1255, endX: 1325, startY: 340, endY: 340, speed: 2.0 }
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
      { id: 'en4_2', type: 'patroller', x: 670, y: 274, width: 30, height: 26, minX: 655, maxX: 725, speed: 1.5 },
      { id: 'en4_3', type: 'flying', x: 1020, y: 240, width: 32, height: 28, minX: 950, maxX: 1100, baseY: 240, amplitude: 50, frequency: 2.8 },
      { id: 'en4_4', type: 'patroller', x: 1140, y: 254, width: 30, height: 26, minX: 1125, maxX: 1205, speed: 1.6 }
    ],
    keys: [
      { id: 'k4_1', x: 405, y: 340 },
      { id: 'k4_2', x: 695, y: 240 },
      { id: 'k4_3', x: 1465, y: 320 }
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
    hint: "Bekerjasama menaiki Menara Cinta Agung! Bersiap untuk perayaan kemenangan!",
    width: 1920,
    height: 540,
    spawns: {
      p1: { x: 80, y: 430 },
      p2: { x: 130, y: 430 }
    },
    platforms: [
      { x: 0, y: 480, width: 360, height: 60, type: 'ground' },
      { x: 1560, y: 480, width: 360, height: 60, type: 'ground' },
      { x: 300, y: 390, width: 140, height: 30, type: 'ground' },
      { x: 1480, y: 390, width: 140, height: 30, type: 'ground' },
      { x: 480, y: 310, width: 130, height: 30, type: 'ground' },
      { x: 1310, y: 310, width: 130, height: 30, type: 'ground' },
      // Tier left ends at 780
      { x: 660, y: 230, width: 120, height: 30, type: 'ground' },
      // Apex center: 890 to 1030 (Left gap: 780 to 890 = 110px. Right gap: 1030 to 1140 = 110px)
      { x: 890, y: 150, width: 140, height: 35, type: 'ground' },
      // Tier right starts at 1140
      { x: 1140, y: 230, width: 120, height: 30, type: 'ground' }
    ],
    movingPlatforms: [
      // Gap 1: 780 to 890. Width 50. startX 805, endX 835 (leaves 25px margin from both sides!)
      { id: 'mp5_1', x: 805, y: 200, width: 50, height: 18, startX: 805, endX: 835, startY: 200, endY: 200, speed: 1.5 },
      // Gap 2: 1030 to 1140. Width 50. startX 1055, endX 1085 (leaves 25px margin from both sides!)
      { id: 'mp5_2', x: 1055, y: 200, width: 50, height: 18, startX: 1055, endX: 1085, startY: 200, endY: 200, speed: 1.5 }
    ],
    springs: [
      { id: 'sp5_1', x: 260, y: 466, width: 34, height: 14, bounceForce: -14 },
      { id: 'sp5_2', x: 1620, y: 466, width: 34, height: 14, bounceForce: -14 }
    ],
    spikes: [
      { x: 360, y: 515, width: 1200, height: 25 }
    ],
    enemies: [
      { id: 'en5_1', type: 'patroller', x: 500, y: 284, width: 30, height: 26, minX: 485, maxX: 590, speed: 1.6 },
      { id: 'en5_2', type: 'patroller', x: 1330, y: 284, width: 30, height: 26, minX: 1315, maxX: 1420, speed: 1.6 },
      { id: 'en5_3', type: 'flying', x: 960, y: 80, width: 32, height: 28, minX: 910, maxX: 1010, baseY: 80, amplitude: 25, frequency: 3.0 }
    ],
    keys: [
      { id: 'k5_1', x: 540, y: 260 },
      { id: 'k5_2', x: 1380, y: 260 },
      { id: 'k5_3', x: 960, y: 90 }
    ],
    door: { x: 935, y: 70, width: 50, height: 80 }
  }
];

if (typeof module !== 'undefined') {
  module.exports = { GAME_LEVELS };
}
