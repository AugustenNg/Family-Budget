# Huong dan gan ten mien nhacogu.net cho CFO Family

> Huong dan nay giup ban ket noi ten mien `nhacogu.net` voi app CFO Family
> chay tren may chu NAS tai nha, bao mat bang Cloudflare Tunnel.

---

## Tong quan kien truc

```
Nguoi dung (Internet)
    |
    v
[Cloudflare CDN + SSL]  <-- An IP may chu, chong DDoS, HTTPS mien phi
    |
    v
[Cloudflare Tunnel]     <-- Khong can mo port, khong lo IP
    |  (ket noi outbound tu may chu)
    v
[May chu NAS: 127.0.0.1:3000]  <-- Next.js chi listen localhost
    |
    v
[PostgreSQL: 127.0.0.1:5432]   <-- Database chi localhost
```

**Uu diem:**
- IP may chu KHONG BAO GIO bi lo
- Khong can mo port tren router
- SSL/HTTPS tu dong (mien phi)
- Chong DDoS boi Cloudflare
- Khong ai co the truy cap truc tiep vao may chu

---

## Buoc 1: Tao tai khoan Cloudflare (mien phi)

1. Truy cap https://dash.cloudflare.com/sign-up
2. Dang ky tai khoan bang email
3. Sau khi dang nhap, bam **"Add a site"**
4. Nhap: `nhacogu.net`
5. Chon plan **Free** → bam **Continue**
6. Cloudflare se hien thi 2 nameservers, dang:
   ```
   xxx.ns.cloudflare.com
   yyy.ns.cloudflare.com
   ```
7. **Ghi lai 2 nameservers nay** — can dung o Buoc 2

---

## Buoc 2: Doi nameservers tren Nhan Hoa

1. Dang nhap https://nhanhoa.com → **Quan ly ten mien**
2. Chon `nhacogu.net`
3. Tim muc **Nameserver** hoac **DNS**
4. Xoa nameservers cu, thay bang 2 nameservers cua Cloudflare:
   ```
   xxx.ns.cloudflare.com
   yyy.ns.cloudflare.com
   ```
5. Luu lai
6. **Cho 5-30 phut** de nameservers cap nhat

### Kiem tra:
```bash
dig NS nhacogu.net @8.8.8.8 +short
```
Khi thay nameservers Cloudflare → thanh cong!

---

## Buoc 3: Tao Cloudflare Tunnel

Chay tren may chu NAS:

### 3.1 Dang nhap Cloudflare tu terminal
```bash
/home/august/cloudflared tunnel login
```
- Se hien thi 1 link → mo link do tren trinh duyet
- Chon domain `nhacogu.net` → Authorize
- Quay lai terminal, se thay "You have successfully logged in"

### 3.2 Tao tunnel
```bash
/home/august/cloudflared tunnel create cfo-family
```
- Se tao file credentials tai: `~/.cloudflared/<TUNNEL_ID>.json`
- Ghi lai **TUNNEL_ID** (chuoi dai dang: `a1b2c3d4-...`)

### 3.3 Tao file cau hinh tunnel
```bash
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: <TUNNEL_ID>
credentials-file: /home/august/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: nhacogu.net
    service: http://127.0.0.1:3000
  - hostname: "*.nhacogu.net"
    service: http://127.0.0.1:3000
  - service: http_status:404
EOF
```
> **THAY `<TUNNEL_ID>` bang ID thuc te** tu buoc 3.2

### 3.4 Tao DNS record tu dong
```bash
/home/august/cloudflared tunnel route dns cfo-family nhacogu.net
```
Lenh nay tu dong tao CNAME record tren Cloudflare DNS.

### 3.5 Test tunnel
```bash
/home/august/cloudflared tunnel run cfo-family
```
- Mo trinh duyet: https://nhacogu.net
- Neu thay app CFO Family → THANH CONG!
- Bam Ctrl+C de dung test

### 3.6 Chay tunnel lau dai bang PM2
```bash
pm2 start /home/august/cloudflared -- tunnel run cfo-family --name cfo-tunnel
pm2 save
```

Hoac chay nhu system service:
```bash
sudo /home/august/cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

---

## Buoc 4: Cap nhat cau hinh app

### 4.1 Cap nhat .env
Sua file `/nas_data/augustNg/File/Family Budget/self-hosted/.env.production`:

```bash
# Doi dong nay:
NEXTAUTH_URL="http://100.105.36.108:3000"

# Thanh:
NEXTAUTH_URL="https://nhacogu.net"
```

### 4.2 Apply va restart
```bash
cd "/nas_data/augustNg/File/Family Budget"
cp self-hosted/.env.production .env
cp self-hosted/.env.production .env.production
npm run build
pm2 restart cfo-family
```

---

## Buoc 5: Cap nhat Google OAuth

1. Vao https://console.cloud.google.com
2. APIs & Services → **Credentials**
3. Chon OAuth 2.0 Client ID da tao
4. Sua cac truong:

**Authorized JavaScript origins:**
```
https://nhacogu.net
```

**Authorized redirect URIs:**
```
https://nhacogu.net/api/auth/callback/google
```

5. Bam **Save**

> **Luu y:** Xoa cac URI cu (http://100.105.36.108:3000/...) neu co

---

## Buoc 6: Cau hinh Cloudflare bao mat (khuyen nghi)

Dang nhap Cloudflare Dashboard → chon `nhacogu.net`:

### 6.1 SSL/TLS
- Vao **SSL/TLS** → chon **Full (strict)**
  (Cloudflare Tunnel tu dong dung HTTPS)

### 6.2 Firewall Rules (Security → WAF)
Tao rule:
- **Block** requests from **known bots** (tru Googlebot)
- **Challenge** requests from **threat score > 10**

### 6.3 Page Rules (tuy chon)
- `nhacogu.net/api/*` → **Cache Level: Bypass** (khong cache API)
- `nhacogu.net/*` → **Security Level: High**

### 6.4 Under Attack Mode
- Khi bi DDoS: bat **Under Attack Mode** trong Overview

---

## Kiem tra bao mat

### Test 1: IP co bi lo khong?
```bash
# Tu may khac:
dig nhacogu.net A +short
# Phai tra ve IP cua Cloudflare (104.x.x.x), KHONG phai IP may chu
```

### Test 2: Truy cap truc tiep co bi chan khong?
```bash
# Thu truy cap truc tiep bang IP may chu:
curl http://192.168.1.179:3000
# Phai bi connection refused (server chi listen 127.0.0.1)
```

### Test 3: HTTPS co hoat dong khong?
```bash
curl -I https://nhacogu.net
# Phai tra ve 200 voi security headers
```

### Test 4: Dang nhap Google
1. Mo https://nhacogu.net/auth/signin
2. Bam "Dang nhap voi Google"
3. Chon tai khoan → redirect ve app
4. Kiem tra session hoat dong

---

## Cac lenh quan ly

```bash
# Xem trang thai tat ca services
pm2 status

# Xem logs app
pm2 logs cfo-family

# Xem logs tunnel
pm2 logs cfo-tunnel

# Restart app
pm2 restart cfo-family

# Restart tunnel
pm2 restart cfo-tunnel

# Backup database thu cong
bash "/nas_data/augustNg/File/Family Budget/self-hosted/backup.sh"

# Xem danh sach tunnels
/home/august/cloudflared tunnel list
```

---

## Xu ly su co

| Van de | Cach xu ly |
|--------|-----------|
| Trang trang khi truy cap domain | Kiem tra tunnel dang chay: `pm2 status` |
| Loi SSL | Cloudflare SSL → doi sang "Full" |
| Loi 502 Bad Gateway | App chua start: `pm2 restart cfo-family` |
| Loi Google OAuth callback | Kiem tra redirect URI trong Google Console |
| Database connection failed | `sudo systemctl status postgresql` |
| Khong truy cap duoc | Kiem tra tunnel: `pm2 logs cfo-tunnel` |
| Domain chua tro dung | Cho 5-30 phut sau khi doi nameservers |

---

## Tom tat

| Thanh phan | Dia chi |
|-----------|---------|
| **App** | https://nhacogu.net |
| **Dang nhap** | https://nhacogu.net/auth/signin |
| **API** | https://nhacogu.net/api/v1/* |
| **Google OAuth Redirect** | https://nhacogu.net/api/auth/callback/google |
| **Database** | localhost:5432/cfo_family |
| **Cloudflare Dashboard** | https://dash.cloudflare.com |
| **Google Cloud Console** | https://console.cloud.google.com |

---

*Tao boi CFO Family Self-Hosted Setup — 2026-03-15*
