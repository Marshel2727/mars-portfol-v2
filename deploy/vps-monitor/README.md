# Setup Read-Only VPS Monitor Agent

Agent ini berjalan di host VPS memakai Python 3 standar (tanpa instalasi `pip` tambahan, hanya ~10–15 MB RAM), bersifat **murni read-only**, dan tidak membuka port ke internet.

## 1. Cek IP Bridge Docker (`docker0`) di VPS
Agar container `mars-portfol-backend-1` bisa memanggil agent di host melalui `host.docker.internal`, bind agent ke IP interface `docker0` (umumnya `172.17.0.1`):

```bash
ip -4 addr show docker0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}'
```

## 2. Buat Token & File Environment Agent (`/etc/vps-monitor.env`)

```bash
TOKEN=$(python3 -c "import secrets; print(secrets.token_urlsafe(48))")
DOCKER_GW=$(ip -4 addr show docker0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}')

sudo tee /etc/vps-monitor.env >/dev/null <<EOF
VPS_MONITOR_BIND=${DOCKER_GW}
VPS_MONITOR_PORT=9109
VPS_MONITOR_TOKEN=${TOKEN}
EOF

sudo chmod 600 /etc/vps-monitor.env
echo "Token untuk .env mars-portfol: ${TOKEN}"
```

## 3. Pasang & Jalankan Service `systemd`

```bash
sudo cp /home/marshel2727/apps/mars-portfol/deploy/vps-monitor/vps-monitor.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now vps-monitor
sudo systemctl status vps-monitor
```

Verifikasi dari VPS:
```bash
source /etc/vps-monitor.env
curl -i "http://${VPS_MONITOR_BIND}:${VPS_MONITOR_PORT}/health"
curl -s -H "Authorization: Bearer ${VPS_MONITOR_TOKEN}" "http://${VPS_MONITOR_BIND}:${VPS_MONITOR_PORT}/metrics" | head -c 300
```

## 4. Hubungkan ke Backend `mars-portfol`
Tambahkan pada `/home/marshel2727/apps/mars-portfol/.env`:

```env
VPS_MONITOR_URL=http://host.docker.internal:9109/metrics
VPS_MONITOR_TOKEN=<TOKEN_YANG_SAMA_DENGAN_DI_ATAS>
```

Lalu rebuild backend:
```bash
cd /home/marshel2727/apps/mars-portfol
docker compose up --build -d backend
```
