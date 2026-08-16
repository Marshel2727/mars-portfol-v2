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

Dump tidak berisi akun atau password. Setelah deployment pertama, buat admin melalui endpoint bootstrap satu kali:

```bash
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@example.com","password":"GANTI_PASSWORD_KUAT"}'
```

Akun pertama otomatis mendapat role `admin`. Setelah itu endpoint register memerlukan JWT admin.

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
BACKEND_INTERNAL_URL=https://api.marshelportfolio.me
```

Set `FRONTEND_URL` backend ke domain production frontend, misalnya `https://marshelportfolio.me,https://www.marshelportfolio.me`.
