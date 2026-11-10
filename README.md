# 🎮 Block Couple: Duo Quest

Game 2D Co-op Platformer Multiplayer realtime untuk 2 orang pemain, dioptimalkan untuk layar ponsel (HP) & browser desktop.

## ✨ Fitur Game
- **2 Karakter Lucu & Menggemaskan:**
  - **Bobi (Biru / Cyan 💙):** Topi gamer retro, efek balok kristal es.
  - **Bona (Pink / Mawar 💖):** Pita cantik, efek balok permen cinta.
  - Saat Bobi & Bona berdiri berdekatan, partikel hati cinta (❤️) akan bermekaran!
- **Mekanik Buat Balok (Block Builder):**
  - Pemain bisa membuat balok di depan mereka untuk jembatan jurang / jalan berlubang.
  - Bisa membuat balok di bawah kaki saat melompat untuk membuat anak tangga tinggi.
  - Tombol pembersih balok jika salah tempat atau ingin menghemat kuota balok (maksimal 4 balok per pemain).
- **Rintangan & Co-op Puzzles:**
  - **Jalan Berlubang / Jurang Duri:** Jatuh ke duri akan memicu respawn instan tanpa penalti.
  - **Anak Tangga Menjulang:** Tebing tinggi yang membutuhkan susunan tangga balok atau pijakan kepala partner.
  - **Tombol Lantai & Pembatas Laser:** Menginjak saklar bersama untuk membuka jalan rahasia.
  - **Kunci Emas (🔑) & Pintu Keluar (🚪):** Kumpulkan semua kunci, dan **KEDUA pemain** harus berdiri di depan pintu keluar untuk menuntaskan level!
- **5 Level Penuh Tantangan:**
  - Level 1: *Jembatan Berlubang* (Pengenalan Balok & Jurang)
  - Level 2: *Anak Tangga Menjulang* (Tebing Tinggi & Stacking Balok)
  - Level 3: *Tombol Kerjasama* (Saklar Lantai & Gerbang Laser)
  - Level 4: *Jurang Kembar & Duri Panjang* (Estafet Balok Melintasi Jurang Lebar)
  - Level 5: *Puncak Cinta Block Couple* (Menara Cinta & Kembang Api Kemenangan)
- **Audio Sintesis Prosedural:**
  - Menggunakan Web Audio API internal (tanpa beban download file MP3/WAV eksternal, anti 404).
  - Dilengkapi BGM riang serta SFX lompat, pasang balok, ambil kunci, saklar, dan kemenangan.
- **Kontrol Lengkap (Ponsel & PC):**
  - **Ponsel:** Virtual Touch Buttons di layar (D-Pad Kiri/Kanan/Bawah, Tombol Lompat, Pasang Balok, Hapus Balok, & Emote).
  - **Komputer:** Keyboard A/D/Panah (Gerak), W/Spasi (Lompat), S/Panah Bawah (Arahkan Balok ke Bawah), E/X (Pasang Balok), C (Hapus Balok), R (Reset Level).
- **Sistem Room Multiplayer:**
  - **Room Publik:** Matchmaking otomatis mencari lawan/partner.
  - **Room Privat:** Kode unik 4 karakter + Tombol Salin Link sekali klik untuk kirim ke WhatsApp / chat teman.

---

## 🚀 Panduan Deploy ke Render

1. Di Render Dashboard (seperti pada screenshot Anda), klik **Web Services** (pilihan kedua di baris atas).
2. Hubungkan repository GitHub ini: `Block-couple`.
3. Masukkan konfigurasi:
   - **Name:** `block-couple`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
4. Klik **Deploy Web Service**!
5. Setelah status menjadi `Live`, buka URL Render (misal `https://block-couple.onrender.com`) langsung dari ponsel dan nikmati permainannya bersama teman Anda!
