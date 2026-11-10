// Level definitions for Block Couple (960 x 540 coordinate space)
// Features: Jalan berlubang, anak tangga / tebing tinggi, kunci pembuka pintu, tombol kerjasama!

const GAME_LEVELS = [
  // ==========================================
  // LEVEL 1: Jembatan Pertama (Tutorial Balok & Jurang)
  // ==========================================
  {
    id: 1,
    title: "Level 1: Jembatan Berlubang",
    hint: "Gunakan tombol [📦 Buat Balok] untuk menutupi jalan berlubang!",
    spawns: {
      p1: { x: 80, y: 440 },
      p2: { x: 130, y: 440 }
    },
    // Solid terrain
    platforms: [
      // Left start island
      { x: 0, y: 480, width: 280, height: 60, type: 'ground' },
      // Center island
      { x: 420, y: 480, width: 180, height: 60, type: 'ground' },
      // Right exit island
      { x: 740, y: 480, width: 220, height: 60, type: 'ground' },
      // Small step on center
      { x: 490, y: 440, width: 60, height: 40, type: 'ground' }
    ],
    // Spike pits (Jalan berlubang maut)
    spikes: [
      { x: 280, y: 510, width: 140, height: 30 },
      { x: 600, y: 510, width: 140, height: 30 }
    ],
    // Keys to collect
    keys: [
      { id: 'k1_1', x: 505, y: 390 }
    ],
    // Co-op Buttons (None for level 1 tutorial)
    buttons: [],
    // Exit Door (Both players must reach here with all keys collected)
    door: { x: 860, y: 400, width: 50, height: 80 }
  },

  // ==========================================
  // LEVEL 2: Anak Tangga Menjulang (High Steps & Stacking)
  // ==========================================
  {
    id: 2,
    title: "Level 2: Anak Tangga Menjulang",
    hint: "Lompat lalu buat balok di bawah kakimu untuk membuat anak tangga tinggi!",
    spawns: {
      p1: { x: 60, y: 440 },
      p2: { x: 110, y: 440 }
    },
    platforms: [
      // Ground base
      { x: 0, y: 480, width: 240, height: 60, type: 'ground' },
      // High cliff 1
      { x: 340, y: 360, width: 140, height: 180, type: 'ground' },
      // High cliff 2 (Even higher anak tangga)
      { x: 580, y: 240, width: 140, height: 300, type: 'ground' },
      // Final platform at top right
      { x: 800, y: 160, width: 160, height: 380, type: 'ground' }
    ],
    spikes: [
      { x: 240, y: 510, width: 100, height: 30 },
      { x: 480, y: 510, width: 100, height: 30 },
      { x: 720, y: 510, width: 80, height: 30 }
    ],
    keys: [
      { id: 'k2_1', x: 400, y: 310 },
      { id: 'k2_2', x: 640, y: 190 }
    ],
    buttons: [],
    door: { x: 860, y: 80, width: 50, height: 80 }
  },

  // ==========================================
  // LEVEL 3: Kerjasama Tombol & Laser
  // ==========================================
  {
    id: 3,
    title: "Level 3: Tombol Kerjasama",
    hint: "Satu orang berdiri di tombol (atau timpa balok) agar pintu pembatas terbuka!",
    spawns: {
      p1: { x: 60, y: 440 },
      p2: { x: 100, y: 440 }
    },
    platforms: [
      // Ground left
      { x: 0, y: 480, width: 320, height: 60, type: 'ground' },
      // Upper puzzle chamber floor
      { x: 220, y: 320, width: 300, height: 25, type: 'ground' },
      // Wall barrier dividing bottom and top
      { x: 500, y: 180, width: 20, height: 360, type: 'ground' },
      // Bottom chamber right
      { x: 520, y: 480, width: 220, height: 60, type: 'ground' },
      // High exit chamber
      { x: 780, y: 340, width: 180, height: 200, type: 'ground' },
      // Dynamic barrier that disappears when button is pressed
      { id: 'barrier_b1', x: 500, y: 60, width: 20, height: 120, type: 'barrier' }
    ],
    spikes: [
      { x: 320, y: 510, width: 180, height: 30 },
      { x: 740, y: 510, width: 40, height: 30 }
    ],
    buttons: [
      // Button on upper chamber; when stepped on or block placed on it, lowers barrier_b1
      { id: 'btn_1', x: 340, y: 305, width: 45, height: 15, linkedBarrierId: 'barrier_b1' }
    ],
    keys: [
      // Key locked inside the chamber
      { id: 'k3_1', x: 620, y: 430 }
    ],
    door: { x: 860, y: 260, width: 50, height: 80 }
  },

  // ==========================================
  // LEVEL 4: Labirin Jurang Kembar
  // ==========================================
  {
    id: 4,
    title: "Level 4: Jurang Kembar & Duri Panjang",
    hint: "Gunakan balok Bobi & Bona secara bergantian untuk membuat jembatan panjang!",
    spawns: {
      p1: { x: 60, y: 440 },
      p2: { x: 100, y: 440 }
    },
    platforms: [
      // Platform 1 (Start)
      { x: 0, y: 480, width: 180, height: 60, type: 'ground' },
      // Floating Pillar 1
      { x: 300, y: 380, width: 80, height: 160, type: 'ground' },
      // Floating Pillar 2 (High)
      { x: 480, y: 260, width: 80, height: 280, type: 'ground' },
      // Floating Pillar 3
      { x: 660, y: 360, width: 80, height: 180, type: 'ground' },
      // End platform
      { x: 820, y: 460, width: 140, height: 80, type: 'ground' },
      // Dynamic barrier for puzzle
      { id: 'barrier_b2', x: 820, y: 340, width: 20, height: 120, type: 'barrier' }
    ],
    spikes: [
      { x: 180, y: 510, width: 120, height: 30 },
      { x: 380, y: 510, width: 100, height: 30 },
      { x: 560, y: 510, width: 100, height: 30 },
      { x: 740, y: 510, width: 80, height: 30 }
    ],
    buttons: [
      { id: 'btn_2', x: 500, y: 245, width: 40, height: 15, linkedBarrierId: 'barrier_b2' }
    ],
    keys: [
      { id: 'k4_1', x: 330, y: 330 },
      { id: 'k4_2', x: 690, y: 310 }
    ],
    door: { x: 870, y: 380, width: 50, height: 80 }
  },

  // ==========================================
  // LEVEL 5: Puncak Menara Cinta (Grand Finale)
  // ==========================================
  {
    id: 5,
    title: "Level 5: Puncak Cinta Block Couple",
    hint: "Capai puncak bersama-sama! Kumpulkan 3 Permata Cinta!",
    spawns: {
      p1: { x: 70, y: 450 },
      p2: { x: 120, y: 450 }
    },
    platforms: [
      // Base floor
      { x: 0, y: 490, width: 300, height: 50, type: 'ground' },
      { x: 660, y: 490, width: 300, height: 50, type: 'ground' },
      // Stair tiers
      { x: 140, y: 380, width: 120, height: 25, type: 'ground' },
      { x: 700, y: 380, width: 120, height: 25, type: 'ground' },
      { x: 280, y: 280, width: 120, height: 25, type: 'ground' },
      { x: 560, y: 280, width: 120, height: 25, type: 'ground' },
      // Grand Throne Center platform at the very top
      { x: 380, y: 160, width: 200, height: 30, type: 'ground' }
    ],
    spikes: [
      { x: 300, y: 515, width: 360, height: 25 }
    ],
    buttons: [],
    keys: [
      { id: 'k5_1', x: 190, y: 330 },
      { id: 'k5_2', x: 750, y: 330 },
      { id: 'k5_3', x: 470, y: 100 }
    ],
    door: { x: 455, y: 80, width: 50, height: 80 }
  }
];

if (typeof module !== 'undefined') {
  module.exports = { GAME_LEVELS };
}
