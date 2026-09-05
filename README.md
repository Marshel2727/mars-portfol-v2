# Mars Portfolio v2

Portfolio full-stack dengan Next.js, Flask, MySQL, Nginx, panel admin, dan konten publik yang dapat diedit.

## Deploy dengan Docker Compose

1. Salin konfigurasi environment:

   ```bash
   cp .env.example .env
   ```

2. Ganti seluruh nilai `CHANGE_ME` dan sesuaikan `FRONTEND_URL` dengan domain deployment.

3. Build dan jalankan service:

   ```bash
   docker compose up --build -d
   ```

4. Periksa status dan log backend:

   ```bash
   docker compose ps
   docker compose logs --tail=100 backend
   ```

Aplikasi dilayani Nginx pada port `80`. MySQL hanya dipublikasikan ke `127.0.0.1` pada `DB_HOST_PORT`, sehingga tidak terbuka langsung ke internet.

## Database awal

Folder `database/` berisi schema lengkap dan data publik terkurasi. MySQL otomatis menjalankan file-file SQL tersebut saat `db_data` masih kosong untuk pertama kalinya.

Dump publik tidak menyertakan data privat dari tabel `users`, `messages`, dan `push_subscriptions`. Schema tabel-tabel tersebut tetap tersedia agar aplikasi berjalan normal. Data uji lama juga tidak dimasukkan.

Jangan menjalankan `docker compose down -v` pada server yang sudah berisi data kecuali Anda memang ingin menghapus volume database dan upload.

## Membuat admin pertama

Dump tidak berisi akun atau password. Setelah deployment pertama, buat admin dari terminal server (password diminta secara tersembunyi):

```bash
docker compose exec backend flask create-admin
```

Perintah hanya bisa digunakan ketika belum ada akun. Endpoint register selalu memerlukan sesi admin dan CSRF; bootstrap publik sudah ditutup. Akun yang sudah ada tidak perlu dibuat ulang.

## Backup sebelum update

```bash
docker compose exec -T db mysqldump \
  -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > backup.sql
```

Simpan `.env`, backup database, dan volume upload di luar repository GitHub.

## Deployment hybrid: VPS backend + Vercel frontend

Jalankan hanya database dan backend di VPS:

```bash
docker compose up --build -d db backend
```

Port Flask dan MySQL hanya bind ke `127.0.0.1`. Pasang `deploy/nginx-api.conf` pada Nginx host, lalu arahkan `api.marshelportfolio.me` ke VPS dan aktifkan HTTPS.

Pada project frontend Vercel, gunakan root directory `front_end` dan environment berikut:

```text
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_BASE_URL=/
NEXT_PUBLIC_SITE_URL=https://v2.marshelportfolio.me
BACKEND_INTERNAL_URL=https://api.marshelportfolio.me
```

Set `FRONTEND_URL` backend ke domain production frontend, misalnya `https://marshelportfolio.me,https://www.marshelportfolio.me`.

## Catatan pembaruan keamanan (kode lokal)

- Deploy frontend dan backend yang baru bersama-sama, lalu login ulang. JWT sekarang hanya dikirim melalui cookie HttpOnly `admin_session`; JavaScript hanya membaca cookie CSRF. Frontend memakai `/api` pada origin yang sama melalui rewrite `BACKEND_INTERNAL_URL`.
- Set `FRONTEND_URL` persis ke origin website, misalnya `https://v2.marshelportfolio.me`. Login dari origin di luar daftar akan ditolak.
- `JWT_COOKIE_SECURE` default `true` untuk HTTPS. Untuk development HTTP saja, set `false` pada environment backend. Jika memakai Compose, tambahkan penerusan environment baru ini sendiri pada service backend; file `.env` saja tidak otomatis meneruskan semua variabel ke container.
- Pembatasan login: 10 permintaan per akun dan 30 per IP setiap 15 menit. Form kontak: 5 permintaan per IP setiap 10 menit. Respons penolakan memakai HTTP 429 dan `Retry-After`.
- Limiter dan pencabutan sesi logout memakai SQLite privat yang dibagi antarkerja Gunicorn pada satu host. Atur `SECURITY_STORE_PATH` ke lokasi persisten yang dapat ditulis backend; jangan letakkan dalam `static/uploads`. Default: `back_end/instance/security.sqlite3`. Mount lokasi tersebut saat deployment agar pencabutan sesi bertahan setelah container dibuat ulang. Untuk banyak replika/host, ganti dengan penyimpanan bersama.
- Atur `TRUSTED_PROXY_HOPS` hanya sesuai jumlah proxy yang benar-benar dipercaya dan pastikan backend tidak bisa diakses langsung. Default 0 tidak memercayai header IP dari klien; semua pengunjung dapat terhitung sebagai IP proxy sampai konfigurasi ini disesuaikan.
- Upload: maksimal 5 MB per gambar dan 16 megapiksel, diverifikasi dan dikodekan ulang tanpa metadata. GIF/WebP animasi disimpan sebagai gambar statis frame pertama. Total request dibatasi 20 MB.
- Endpoint `GET /api/health` memeriksa database dan mengembalikan 200 atau 503 tanpa membocorkan detail koneksi.
- Metadata, preview, dan sitemap memakai `NEXT_PUBLIC_SITE_URL`; default `https://v2.marshelportfolio.me`. Sitemap dinamis membutuhkan `BACKEND_INTERNAL_URL` yang dapat dijangkau server Next.js.
- Tidak ada perubahan skema MySQL pada pembaruan ini. Backup, konfigurasi proxy/volume, monitoring, dan deployment tetap dilakukan pemilik server.

## Pengujian lokal

Backend menggunakan database SQLite sementara; pengujian tidak mengakses database operasional:

```bash
python -m pip install -r back_end/requirements.txt
python -m unittest discover -s back_end/tests -v
cd front_end
npm ci
npm run lint
npm run build
```
