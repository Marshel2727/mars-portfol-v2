# Pembuka 3D dan identitas logo Marshel

Pembuka memakai Three.js dan `/models/marshel-intro-v1.glb`, hasil ekspor
`Marshel_Logo_Berantakan_ke_Rapi.blend`. Satu klip memuat semua gerakan objek;
durasi sumber sekitar 8 detik diputar menjadi 4 detik, lalu fade 300 ms.
Planet dan permukaan logam memakai tekstur hasil bake. Pencahayaan studio dan
atmosfer planet dibuat ulang di renderer web; hasilnya tidak identik piksel
dengan compositor EEVEE Blender.

## Perilaku

- Tampil pada pembukaan dokumen atau refresh halaman publik, termasuk tautan
  langsung ke `/projects`. Navigasi internal tidak memutar ulang intro.
- `/login` dan `/admin/*` melewati intro. Pengguna reduced motion langsung
  melihat halaman dan tidak mengunduh model.
- Halaman serta API dimuat di belakang intro. Durasi bukan indikator progres API.
- Tombol Lewati, Enter/Space dan Escape dapat menutup intro; Tab tetap berada
  pada tombol selama intro tampil. Scroll dan interaksi halaman dipulihkan
  setelah penutupan.
- Batas persiapan module/model/WebGL adalah 3 detik sejak effect dimulai.
  Jika model gagal, browser tidak mendukung WebGL, atau batas terlewati,
  halaman tetap terbuka. Total waktu normal mencakup persiapan, playback 4 detik,
  dan fade 300 ms.
- Setelah selesai, timer, observer, mixer, canvas, texture dan resource GPU
  dibersihkan. Tidak ada flag session/localStorage untuk melewati refresh.

## Aset

Logo header berasal dari render frame akhir, tanpa tulisan kecil. Favicon,
Apple touch icon, dan ikon PWA memakai lambang yang sama. Ikon PWA diberi
latar solid dan ruang aman untuk maskable icons. Nama aset memakai `v1` dan
cache Service Worker memakai `v4` agar ikon lama tidak tetap digunakan.

Sumber `.blend` tidak disalin ke bundle dan tidak diubah saat ekspor. Laporan
hash sumber, jumlah objek/channel animasi, dan tekstur bake berada di
`public/models/marshel-intro-v1.json`.

## Membuat ulang aset di Windows

Jalankan dari root repository, dengan Blender 5.2 dan Python/Pillow tersedia:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --disable-autoexec 'C:\PROJECT 3D\Marshel_3D_Animasi\Marshel_Logo_Berantakan_ke_Rapi.blend' --python scripts/export_marshel_intro.py -- --output front_end/public
python scripts/generate_marshel_icons.py
```

Referensi render awal/tengah/akhir serta tekstur sementara disimpan di
`docker-backups/intro-qa`, yang diabaikan Git. Untuk iterasi ekspor tanpa
mengulang render referensi, tambahkan `--reuse-references` pada perintah Blender.

## Verifikasi dan deployment

```powershell
cd front_end
npm.cmd ci
npm.cmd run lint
npm.cmd run build
```

Uji di browser: pembukaan dan refresh, navigasi internal, tautan logo ke
beranda, menu mobile, tema terang/gelap, reduced motion, model 404 atau lambat,
WebGL tidak tersedia, dan favicon/manifest. Periksa screenshot awal, tengah,
akhir untuk memastikan objek bergerak dan tersusun; build saja tidak
membuktikan animasi benar.

Upload commit frontend beserta aset dan lockfile ke GitHub agar Vercel
membangun versi baru. Tidak ada migrasi database atau pembaruan backend VPS.
