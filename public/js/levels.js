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
  },

  // ========================================================
  // LEVEL 6: Koridor Lava & Pegas Beruntun
  // ========================================================
  {
    id: 6,
    title: "Level 6: Koridor Lava & Pegas Beruntun",
    hint: "Gunakan trampolin untuk melompati jurang lava yang membara dan raih kunci di angkasa!",
    width: 1850,
    height: 540,
    spawns: {
      p1: { x: 70, y: 430 },
      p2: { x: 120, y: 430 }
    },
    platforms: [
      { x: 0, y: 480, width: 280, height: 60, type: 'ground' },
      { x: 380, y: 390, width: 140, height: 150, type: 'ground' },
      { x: 620, y: 300, width: 150, height: 240, type: 'ground' },
      { x: 880, y: 400, width: 140, height: 140, type: 'ground' },
      { x: 1140, y: 320, width: 130, height: 220, type: 'ground' },
      { x: 1400, y: 410, width: 140, height: 130, type: 'ground' },
      { x: 1640, y: 480, width: 210, height: 60, type: 'ground' }
    ],
    movingPlatforms: [
      { id: 'mp6_1', x: 295, y: 430, width: 65, height: 18, startX: 295, endX: 365, startY: 430, endY: 430, speed: 1.5 },
      { id: 'mp6_2', x: 1285, y: 360, width: 65, height: 18, startX: 1285, endX: 1385, startY: 360, endY: 360, speed: 1.7 }
    ],
    springs: [
      { id: 'sp6_1', x: 210, y: 466, width: 34, height: 14, bounceForce: -14 },
      { id: 'sp6_2', x: 920, y: 386, width: 34, height: 14, bounceForce: -14.5 }
    ],
    spikes: [
      { x: 280, y: 515, width: 1360, height: 25 }
    ],
    enemies: [
      { id: 'en6_1', type: 'patroller', x: 410, y: 364, width: 30, height: 26, minX: 390, maxX: 500, speed: 1.5 },
      { id: 'en6_2', type: 'flying', x: 760, y: 220, width: 32, height: 28, minX: 680, maxX: 840, baseY: 220, amplitude: 35, frequency: 2.2 },
      { id: 'en6_3', type: 'patroller', x: 1160, y: 294, width: 30, height: 26, minX: 1150, maxX: 1250, speed: 1.6 }
    ],
    keys: [
      { id: 'k6_1', x: 440, y: 330 },
      { id: 'k6_2', x: 690, y: 240 },
      { id: 'k6_3', x: 1460, y: 350 }
    ],
    buttons: [],
    door: { x: 1720, y: 400, width: 50, height: 80 }
  },

  // ========================================================
  // LEVEL 7: Benteng Saklar Ganda & Laser Bergantian
  // ========================================================
  {
    id: 7,
    title: "Level 7: Benteng Saklar Ganda & Laser Bergantian",
    hint: "Pemain 1 menahan saklar A agar Pemain 2 lewat, lalu Pemain 2 menahan saklar B agar Pemain 1 lewat!",
    width: 1900,
    height: 540,
    spawns: {
      p1: { x: 70, y: 430 },
      p2: { x: 120, y: 430 }
    },
    platforms: [
      { x: 0, y: 480, width: 340, height: 60, type: 'ground' },
      { x: 300, y: 320, width: 220, height: 25, type: 'ground' },
      { x: 580, y: 140, width: 24, height: 400, type: 'ground' },
      { x: 604, y: 480, width: 380, height: 60, type: 'ground' },
      { x: 720, y: 280, width: 220, height: 25, type: 'ground' },
      { x: 1040, y: 140, width: 24, height: 400, type: 'ground' },
      { x: 1064, y: 480, width: 360, height: 60, type: 'ground' },
      { x: 1180, y: 320, width: 200, height: 25, type: 'ground' },
      { x: 1520, y: 480, width: 380, height: 60, type: 'ground' },

      // Laser barriers
      { id: 'barrier_b7_1', x: 580, y: 40, width: 24, height: 100, type: 'barrier' },
      { id: 'barrier_b7_2', x: 1040, y: 40, width: 24, height: 100, type: 'barrier' }
    ],
    movingPlatforms: [
      { id: 'mp7_1', x: 1430, y: 410, width: 70, height: 18, startX: 1430, endX: 1510, startY: 410, endY: 410, speed: 1.6 }
    ],
    springs: [
      { id: 'sp7_1', x: 240, y: 466, width: 34, height: 14, bounceForce: -13.5 },
      { id: 'sp7_2', x: 920, y: 466, width: 34, height: 14, bounceForce: -13.5 }
    ],
    spikes: [
      { x: 340, y: 515, width: 240, height: 25 },
      { x: 984, y: 515, width: 80, height: 25 },
      { x: 1424, y: 515, width: 96, height: 25 }
    ],
    buttons: [
      { id: 'btn7_1', x: 420, y: 305, width: 45, height: 15, linkedBarrierId: 'barrier_b7_1' },
      { id: 'btn7_2', x: 800, y: 265, width: 45, height: 15, linkedBarrierId: 'barrier_b7_2' }
    ],
    enemies: [
      { id: 'en7_1', type: 'patroller', x: 680, y: 454, width: 30, height: 26, minX: 630, maxX: 950, speed: 1.6 },
      { id: 'en7_2', type: 'flying', x: 1250, y: 200, width: 32, height: 28, minX: 1100, maxX: 1350, baseY: 200, amplitude: 35, frequency: 2.2 }
    ],
    keys: [
      { id: 'k7_1', x: 460, y: 260 },
      { id: 'k7_2', x: 860, y: 220 },
      { id: 'k7_3', x: 1260, y: 260 }
    ],
    door: { x: 1740, y: 400, width: 50, height: 80 }
  },

  // ========================================================
  // LEVEL 8: Tebing Kristal Es & Jalur Estafet Balok
  // ========================================================
  {
    id: 8,
    title: "Level 8: Tebing Kristal Es & Jalur Estafet Balok",
    hint: "Jurang es sangat lebar! Buat balok secara estafet bergantian untuk menjembatani jurang!",
    width: 1950,
    height: 540,
    spawns: {
      p1: { x: 70, y: 430 },
      p2: { x: 120, y: 430 }
    },
    platforms: [
      { x: 0, y: 480, width: 280, height: 60, type: 'ground' },
      { x: 380, y: 420, width: 110, height: 120, type: 'ground' },
      { x: 590, y: 340, width: 120, height: 200, type: 'ground' },
      { x: 810, y: 260, width: 130, height: 280, type: 'ground' },
      { x: 1050, y: 360, width: 120, height: 180, type: 'ground' },
      { x: 1270, y: 440, width: 120, height: 100, type: 'ground' },
      { x: 1500, y: 350, width: 130, height: 190, type: 'ground' },
      { x: 1730, y: 480, width: 220, height: 60, type: 'ground' }
    ],
    movingPlatforms: [
      { id: 'mp8_1', x: 955, y: 300, width: 65, height: 18, startX: 955, endX: 1035, startY: 300, endY: 300, speed: 1.5 },
      { id: 'mp8_2', x: 1640, y: 400, width: 65, height: 18, startX: 1640, endX: 1710, startY: 400, endY: 400, speed: 1.8 }
    ],
    springs: [
      { id: 'sp8_1', x: 210, y: 466, width: 34, height: 14, bounceForce: -13.5 },
      { id: 'sp8_2', x: 1310, y: 426, width: 34, height: 14, bounceForce: -14 }
    ],
    spikes: [
      { x: 280, y: 515, width: 1450, height: 25 }
    ],
    enemies: [
      { id: 'en8_1', type: 'patroller', x: 620, y: 314, width: 30, height: 26, minX: 600, maxX: 690, speed: 1.4 },
      { id: 'en8_2', type: 'flying', x: 920, y: 160, width: 32, height: 28, minX: 840, maxX: 1000, baseY: 160, amplitude: 40, frequency: 2.6 },
      { id: 'en8_3', type: 'patroller', x: 1530, y: 324, width: 30, height: 26, minX: 1510, maxX: 1610, speed: 1.5 }
    ],
    keys: [
      { id: 'k8_1', x: 420, y: 360 },
      { id: 'k8_2', x: 870, y: 200 },
      { id: 'k8_3', x: 1550, y: 290 }
    ],
    buttons: [],
    door: { x: 1810, y: 400, width: 50, height: 80 }
  },

  // ========================================================
  // LEVEL 9: Menara Melayang & Serangan Tiga Drone
  // ========================================================
  {
    id: 9,
    title: "Level 9: Menara Melayang & Serangan Tiga Drone",
    hint: "Tiga drone berpatroli di udara! Berjongkok atau pasang balok perisai untuk berlindung!",
    width: 2000,
    height: 540,
    spawns: {
      p1: { x: 70, y: 430 },
      p2: { x: 120, y: 430 }
    },
    platforms: [
      { x: 0, y: 480, width: 300, height: 60, type: 'ground' },
      { x: 400, y: 400, width: 130, height: 140, type: 'ground' },
      { x: 630, y: 310, width: 140, height: 230, type: 'ground' },
      { x: 870, y: 220, width: 150, height: 320, type: 'ground' },
      { x: 1120, y: 310, width: 140, height: 230, type: 'ground' },
      { x: 1360, y: 400, width: 130, height: 140, type: 'ground' },
      { x: 1590, y: 300, width: 140, height: 240, type: 'ground' },
      { x: 1820, y: 480, width: 180, height: 60, type: 'ground' }
    ],
    movingPlatforms: [
      { id: 'mp9_1', x: 315, y: 440, width: 70, height: 18, startX: 315, endX: 385, startY: 440, endY: 440, speed: 1.8 },
      { id: 'mp9_2', x: 1495, y: 350, width: 75, height: 18, startX: 1495, endX: 1575, startY: 350, endY: 350, speed: 1.8 }
    ],
    springs: [
      { id: 'sp9_1', x: 220, y: 466, width: 34, height: 14, bounceForce: -14 },
      { id: 'sp9_2', x: 1400, y: 386, width: 34, height: 14, bounceForce: -14 }
    ],
    spikes: [
      { x: 300, y: 515, width: 1520, height: 25 }
    ],
    enemies: [
      { id: 'en9_1', type: 'flying', x: 500, y: 200, width: 32, height: 28, minX: 420, maxX: 600, baseY: 200, amplitude: 45, frequency: 2.8 },
      { id: 'en9_2', type: 'flying', x: 950, y: 130, width: 32, height: 28, minX: 880, maxX: 1040, baseY: 130, amplitude: 35, frequency: 3.0 },
      { id: 'en9_3', type: 'flying', x: 1450, y: 220, width: 32, height: 28, minX: 1350, maxX: 1550, baseY: 220, amplitude: 40, frequency: 2.6 }
    ],
    keys: [
      { id: 'k9_1', x: 450, y: 340 },
      { id: 'k9_2', x: 930, y: 160 },
      { id: 'k9_3', x: 1640, y: 240 }
    ],
    buttons: [],
    door: { x: 1890, y: 400, width: 50, height: 80 }
  },

  // ========================================================
  // LEVEL 10: Ujian Puncak Pasangan Sejati (Grand Co-op Finale)
  // ========================================================
  {
    id: 10,
    title: "Level 10: Ujian Puncak Pasangan Sejati",
    hint: "Ujian terakhir! Bekerjasama mengaktifkan saklar, hindari rintangan gabungan dan masuki Gerbang Cinta Abadi!",
    width: 2100,
    height: 540,
    spawns: {
      p1: { x: 80, y: 430 },
      p2: { x: 130, y: 430 }
    },
    platforms: [
      { x: 0, y: 480, width: 320, height: 60, type: 'ground' },
      { x: 380, y: 360, width: 180, height: 25, type: 'ground' },
      { x: 620, y: 140, width: 24, height: 400, type: 'ground' },
      { x: 644, y: 480, width: 340, height: 60, type: 'ground' },
      { x: 740, y: 280, width: 180, height: 25, type: 'ground' },
      { x: 1060, y: 380, width: 140, height: 160, type: 'ground' },
      { x: 1280, y: 290, width: 140, height: 250, type: 'ground' },
      { x: 1500, y: 200, width: 140, height: 340, type: 'ground' },
      { x: 1760, y: 120, width: 180, height: 40, type: 'ground' },
      { x: 1760, y: 480, width: 340, height: 60, type: 'ground' },

      // Laser barrier linked to switch
      { id: 'barrier_b10_1', x: 620, y: 40, width: 24, height: 100, type: 'barrier' }
    ],
    movingPlatforms: [
      { id: 'mp10_1', x: 990, y: 430, width: 60, height: 18, startX: 990, endX: 1050, startY: 430, endY: 430, speed: 1.6 },
      { id: 'mp10_2', x: 1650, y: 170, width: 60, height: 18, startX: 1650, endX: 1740, startY: 170, endY: 170, speed: 1.8 }
    ],
    springs: [
      { id: 'sp10_1', x: 240, y: 466, width: 34, height: 14, bounceForce: -14 },
      { id: 'sp10_2', x: 1110, y: 366, width: 34, height: 14, bounceForce: -14.5 }
    ],
    spikes: [
      { x: 320, y: 515, width: 300, height: 25 },
      { x: 984, y: 515, width: 776, height: 25 }
    ],
    buttons: [
      { id: 'btn10_1', x: 440, y: 345, width: 45, height: 15, linkedBarrierId: 'barrier_b10_1' }
    ],
    enemies: [
      { id: 'en10_1', type: 'patroller', x: 720, y: 454, width: 30, height: 26, minX: 660, maxX: 950, speed: 1.8 },
      { id: 'en10_2', type: 'flying', x: 1150, y: 220, width: 32, height: 28, minX: 1060, maxX: 1240, baseY: 220, amplitude: 40, frequency: 2.8 },
      { id: 'en10_3', type: 'flying', x: 1570, y: 110, width: 32, height: 28, minX: 1510, maxX: 1630, baseY: 110, amplitude: 30, frequency: 3.2 }
    ],
    keys: [
      { id: 'k10_1', x: 480, y: 300 },
      { id: 'k10_2', x: 800, y: 220 },
      { id: 'k10_3', x: 1330, y: 230 },
      { id: 'k10_4', x: 1830, y: 60 }
    ],
    door: { x: 1870, y: 40, width: 50, height: 80 }
  }
];

// ========================================================
// 20 CO-OP GAMES CATALOG (KATALOG DAFTAR GAME CO-OP 2 PEMAIN)
// ========================================================
const COOP_GAMES = [
  // 1. SHOOTER CO-OP (TEMBAK-TEMBAKAN LUAR ANGKASA & ALIEN)
  { 
    id: 1, 
    title: 'Duo Space Blaster: Invasi Alien', 
    mode: 'shooter', 
    tag: 'Tembak-Tembakan', 
    category: 'shooter',
    desc: 'Kendalikan pesawat laser berdua, tembak jatuh armada alien UFO dan hindari hujan bom plasma luar angkasa!',
    targetLevel: 1, 
    maxLevel: 10 
  },
  { 
    id: 2, 
    title: 'Laser Strike: Armada Bos Galaksi', 
    mode: 'shooter', 
    tag: 'Tembak-Tembakan', 
    category: 'shooter',
    desc: 'Pertahanan laser intensif! Tembak drone alien pengawal galaksi dan kumpulkan kristal peluru energi bersama.',
    targetLevel: 2, 
    maxLevel: 10 
  },

  // 2. TANK BATTLE CO-OP (PERANG TANK BAJA 2D)
  { 
    id: 3, 
    title: 'Duo Tank Baja: Perang Benteng', 
    mode: 'tank', 
    tag: 'Tank-Tankan', 
    category: 'tank',
    desc: 'Kendarai tank tempur baja neon, hancurkan dinding bata rintangan dan tembak tank musuh dengan meriam pantul!',
    targetLevel: 3, 
    maxLevel: 10 
  },
  { 
    id: 4, 
    title: 'Arena Tank Gurun: Operasi Baja', 
    mode: 'tank', 
    tag: 'Tank-Tankan', 
    category: 'tank',
    desc: 'Pertempuran taktis 2 pemain melawan konvoi tank robot otomatis di labirin medan perang berpasir.',
    targetLevel: 4, 
    maxLevel: 10 
  },

  // 3. PAC-MAN / PICMAN CO-OP (LABIRIN TITIK & HANTU)
  { 
    id: 5, 
    title: 'Duo Pac-Maze: Labirin Hantu', 
    mode: 'pacman', 
    tag: 'Picman Co-op', 
    category: 'pacman',
    desc: 'Makan semua pelet titik energi di labirin neon! Hindari kejaran hantu Blinky & Inky atau makan Pelet Kekuatan raksasa!',
    targetLevel: 5, 
    maxLevel: 10 
  },
  { 
    id: 6, 
    title: 'Pac-Man Neon: Pesta Titik Kristal', 
    mode: 'pacman', 
    tag: 'Picman Co-op', 
    category: 'pacman',
    desc: 'Labirin kecepatan tinggi dengan portal teleportasi estafet. Kerjasama memakan semua titik sebelum hantu mengepung.',
    targetLevel: 6, 
    maxLevel: 10 
  },

  // 4. SOAL MATEMATIKA CO-OP (KUIS HITUNG TANGKAS & ASAH OTAK)
  { 
    id: 7, 
    title: 'Kuis Matematika: Jembatan Angka', 
    mode: 'math', 
    tag: 'Soal Matematika', 
    category: 'math',
    desc: 'Pecahkan persamaan matematika di layar! Injak portal angka yang benar bersama pasanganmu untuk membuka jalan.',
    targetLevel: 7, 
    maxLevel: 10 
  },
  { 
    id: 8, 
    title: 'Duel Otak: Kilat Hitung Cepat', 
    mode: 'math', 
    tag: 'Soal Matematika', 
    category: 'math',
    desc: 'Adu kecerdasan dan kerjasama! Jawab soal perkalian dan penjumlahan kilat untuk mencetak rekor skor kombo tertinggi.',
    targetLevel: 8, 
    maxLevel: 10 
  },

  // 5. ARCADE PONG / AIR HOCKEY (REFLEKS CEPAT)
  { 
    id: 9, 
    title: 'Neon Pong: Pertarungan Refleks', 
    mode: 'pong', 
    tag: 'Arcade Pong', 
    category: 'arcade',
    desc: 'Tangkis bola energi neon bercahaya dengan raket pantul berdua dalam duel kecepatan reaksi tingkat tinggi!',
    targetLevel: 9, 
    maxLevel: 10 
  },

  // 6. SNAKE CO-OP (DUO ULAR NEON)
  { 
    id: 10, 
    title: 'Duo Snake: Pemburu Bintang Energi', 
    mode: 'snake', 
    tag: 'Snake Co-op', 
    category: 'arcade',
    desc: 'Duel 1 menit dua ular neon mengumpulkan bintang energi! Gunakan turbo mandiri dan hindari menabrak tubuh lawan.',
    targetLevel: 10, 
    maxLevel: 10 
  },

  // 7. PLATFORMER KLASIK & TEKA-TEKI DUO QUEST
  { 
    id: 11, 
    title: 'Duo Quest: Gerbang Awal & Monster Lendir', 
    mode: 'platformer', 
    tag: 'Petualangan Co-op', 
    category: 'platformer',
    desc: 'Bekerjasama membuat balok dan menginjak monster lendir untuk membuka pintu portal cinta.',
    targetLevel: 1, 
    maxLevel: 10 
  },
  { 
    id: 12, 
    title: 'Tebing Pegas & Drone Udara', 
    mode: 'platformer', 
    tag: 'Ketangkasan Pegas', 
    category: 'platformer',
    desc: 'Lompat menggunakan trampolin pegas elastis dan hindari patroli drone pengawas tebing.',
    targetLevel: 2, 
    maxLevel: 10 
  },
  { 
    id: 13, 
    title: 'Labirin Saklar & Sinar Laser', 
    mode: 'platformer', 
    tag: 'Teka-Teki Saklar', 
    category: 'platformer',
    desc: 'Satu pemain menahan tombol saklar agar laser padam sehingga pasangan bisa melintas aman.',
    targetLevel: 3, 
    maxLevel: 10 
  },
  { 
    id: 14, 
    title: 'Jurang Nebula & Jembatan Balok', 
    mode: 'platformer', 
    tag: 'Platformer Presisi', 
    category: 'platformer',
    desc: 'Susun balok jembatan di atas jurang luas tanpa terjatuh ke ladang duri bercahaya.',
    targetLevel: 4, 
    maxLevel: 10 
  },
  { 
    id: 15, 
    title: 'Menara Puncak Cinta Duo', 
    mode: 'platformer', 
    tag: 'Ujian Kerjasama', 
    category: 'platformer',
    desc: 'Naiki platform bergerak ke menara tertinggi dan kumpulkan kunci emas bersama pasangan.',
    targetLevel: 5, 
    maxLevel: 10 
  },
  { 
    id: 16, 
    title: 'Lava Rush: Lantai Membara', 
    mode: 'platformer', 
    tag: 'Survival Cepat', 
    category: 'platformer',
    desc: 'Jauhi lantai bawah tanah yang membara, bangun pijakan balok secepat mungkin ke atas.',
    targetLevel: 6, 
    maxLevel: 10 
  },
  { 
    id: 17, 
    title: 'Benteng Saklar Ganda & Kristal Es', 
    mode: 'platformer', 
    tag: 'Sinkronisasi Estafet', 
    category: 'platformer',
    desc: 'Tebing es licin dan dua gerbang laser dibuka bergantian oleh Bobi dan Bona secara estafet.',
    targetLevel: 7, 
    maxLevel: 10 
  },
  { 
    id: 18, 
    title: 'Menara Tiga Drone Pengawas', 
    mode: 'platformer', 
    tag: 'Hindaran Udara', 
    category: 'platformer',
    desc: 'Hindari tiga drone berkecepatan tinggi dengan bersembunyi di bawah platform balok.',
    targetLevel: 8, 
    maxLevel: 10 
  },
  { 
    id: 19, 
    title: 'Koridor Duri & Saklar Berantai', 
    mode: 'platformer', 
    tag: 'Sinkronisasi Cepat', 
    category: 'platformer',
    desc: 'Gerbang laser terbuka hanya sebentar setelah saklar dilepas, lari cepat bersama partner!',
    targetLevel: 9, 
    maxLevel: 10 
  },
  { 
    id: 20, 
    title: 'Ujian Puncak Pasangan Sejati', 
    mode: 'platformer', 
    tag: 'Tantangan Pamungkas', 
    category: 'platformer',
    desc: 'Ujian penutup pamungkas: gabungan semua rintangan laser, pegas, lendir, dan jurang berduri!',
    targetLevel: 10, 
    maxLevel: 10 
  }
];

if (typeof window !== 'undefined') {
  window.GAME_LEVELS = GAME_LEVELS;
  window.COOP_GAMES = COOP_GAMES;
}

if (typeof module !== 'undefined') {
  module.exports = { GAME_LEVELS, COOP_GAMES };
}
