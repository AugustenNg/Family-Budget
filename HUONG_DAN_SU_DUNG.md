# CFO Family — Huong Dan Su Dung

> Ung dung quan ly tai chinh gia dinh chuyen nghiep

**Link truy cap:** https://cfo-family-budget.vercel.app

**GitHub:** https://github.com/AugustenNg/Family-Budget

---

## Muc luc

1. [Tong quan](#1-tong-quan)
2. [Bat dau su dung](#2-bat-dau-su-dung)
3. [Dashboard (Tong quan)](#3-dashboard)
4. [Quan ly giao dich](#4-quan-ly-giao-dich)
5. [Quan ly tai khoan](#5-quan-ly-tai-khoan)
6. [Ngan sach](#6-ngan-sach)
7. [Tai san & No](#7-tai-san--no)
8. [Gia dinh & Phan quyen](#8-gia-dinh--phan-quyen)
9. [Bao cao](#9-bao-cao)
10. [Che do Demo vs Thuc te](#10-che-do-demo-vs-thuc-te)
11. [Cau hinh Production](#11-cau-hinh-production)

---

## 1. Tong quan

CFO Family la ung dung quan ly tai chinh gia dinh voi cac tinh nang:

- **Dashboard** thong minh voi chi so suc khoe tai chinh
- **Giao dich** thu/chi/chuyen khoan voi phan loai tu dong
- **Tai khoan** ngan hang, vi dien tu, the tin dung, tien mat
- **Ngan sach** theo danh muc voi canh bao vuot nguong
- **No & Dau tu** theo doi khoan vay, muc tieu tiet kiem, dau tu
- **Gia dinh** moi thanh vien, phan quyen 4 cap
- **Bao cao** bieu do chi tieu, xu huong, so sanh thang

---

## 2. Bat dau su dung

### Che do Demo (khong can dang nhap)

1. Truy cap https://cfo-family-budget.vercel.app
2. App tu dong hien thi du lieu mau
3. Ban co the them/sua/xoa giao dich, tai khoan... de thu nghiem
4. Du lieu luu trong trinh duyet (localStorage)

### Che do Thuc te (dang nhap Google)

1. Truy cap https://cfo-family-budget.vercel.app/auth/signin
2. Bam **"Dang nhap voi Google"**
3. Chon tai khoan Google cua ban
4. Lan dau: chuyen sang trang **Tao gia dinh** (/auth/onboarding)
5. Nhap ten gia dinh (VD: "Gia dinh Nguyen Van A")
6. Bam **"Tao gia dinh & Bat dau"**
7. Ban tro thanh **OWNER** (Chu ho) voi quyen cao nhat

---

## 3. Dashboard

Trang chinh hien thi tong quan tai chinh:

| Thanh phan | Mo ta |
|------------|-------|
| **Dong tien** | Tong thu - Tong chi trong thang, ty le tiet kiem |
| **Tai khoan** | So du tat ca tai khoan (ngan hang, vi, tien mat) |
| **Tai san rong** | Tong tai san - Tong no |
| **Ngan sach** | Tien do chi tieu theo danh muc |
| **Giao dich gan day** | 5 giao dich moi nhat |
| **Canh bao** | Ngan sach sap vuot, no den han |

### Thao tac:
- Bam vao tung khoi de xem chi tiet
- Chuyen thang bang nut "Thang truoc/Thang sau"
- Bam bieu tuong mat de an/hien so tien (Blur Sensitive)

---

## 4. Quan ly giao dich

**Duong dan:** /transactions

### Them giao dich moi
1. Bam nut **"+ Them giao dich"**
2. Chon loai: Thu nhap / Chi tieu / Chuyen khoan
3. Nhap so tien, mo ta, chon danh muc
4. Chon tai khoan nguon
5. Voi chuyen khoan: chon them tai khoan dich
6. Bam **"Luu"**

### Loc va tim kiem
- **Tim kiem** theo mo ta
- **Loc theo loai**: Thu nhap, Chi tieu, Chuyen khoan
- **Loc theo danh muc**: An uong, Di lai, Nha o...
- **Loc theo thoi gian**: Tuan nay, Thang nay, Tuy chon

### Sua/Xoa
- Bam vao giao dich de xem chi tiet
- Bam icon but chi de sua
- Bam icon thung rac de xoa (can xac nhan)

> **Luu y**: Khi tao/sua/xoa giao dich, so du tai khoan tu dong cap nhat (atomic transaction)

---

## 5. Quan ly tai khoan

**Duong dan:** /accounts

### Cac loai tai khoan
| Loai | Vi du |
|------|-------|
| **CASH** | Vi tien mat |
| **BANK_ACCOUNT** | Vietcombank, MBBank, Techcombank |
| **CREDIT_CARD** | Visa, Mastercard (Liability) |
| **SAVINGS** | Tiet kiem ngan hang |
| **E_WALLET** | MoMo, ZaloPay, VNPay |
| **INVESTMENT** | Tai khoan chung khoan |
| **LOAN** | Khoan vay (Liability) |

### Them tai khoan
1. Bam **"+ Them tai khoan"**
2. Nhap ten, chon loai, nhap so du ban dau
3. Chon mau hien thi (tuy chon)
4. Bam **"Luu"**

### Xoa tai khoan
- Tai khoan co giao dich se duoc **vo hieu hoa** (soft delete), khong xoa vinh vien
- Tai khoan khong co giao dich se bi xoa hoan toan

---

## 6. Ngan sach

**Duong dan:** /budget

### Thiet lap ngan sach
1. Bam **"+ Tao ngan sach"**
2. Chon danh muc (An uong, Di lai, Giai tri...)
3. Nhap han muc (VD: 5.000.000 VND/thang)
4. Chon ky: ngay bat dau - ngay ket thuc
5. Bam **"Luu"**

### Canh bao tu dong
- He thong tu dong tao 3 muc canh bao: **50%, 80%, 100%**
- Khi chi tieu dat nguong, canh bao hien thi tren Dashboard
- Co the tuy chinh muc canh bao khi tao ngan sach

### Theo doi
- Thanh tien do hien thi % da chi
- Mau xanh: < 50% | Mau vang: 50-80% | Mau do: > 80%
- Xem chi tiet giao dich trong tung danh muc ngan sach

---

## 7. Tai san & No

**Duong dan:** /wealth

### Muc tieu tiet kiem (Goals)
1. Bam **"+ Muc tieu moi"**
2. Nhap ten (VD: "Mua xe", "Du lich Nhat")
3. Nhap so tien muc tieu va thoi han
4. **Dong gop**: Bam "Dong gop" tren muc tieu, nhap so tien
   - Tien duoc tru tu tai khoan nguon
   - Khi dat 100%, he thong gui thong bao

### Khoan no (Debts)
- Theo doi khoan vay: nha, xe, tin dung, ca nhan
- **Ghi nhan thanh toan**: Moi lan tra no, so du tu dong cap nhat
- **Lich tra no** (Amortization): Xem bang tra gop chi tiet

### Dau tu (Investments)
- Theo doi co phieu, quy, trai phieu, vang, crypto
- Cap nhat gia tri dinh ky
- Xem lai/lo chua thuc hien

---

## 8. Gia dinh & Phan quyen

**Duong dan:** /family

### He thong phan quyen 4 cap

| Vai tro | Quyen han |
|---------|-----------|
| **OWNER** (Chu ho) | Toan quyen: quan ly thanh vien, xoa gia dinh, tat ca chuc nang |
| **ADMIN** (Quan tri) | Gan nhu OWNER: them/xoa thanh vien, quan ly tai chinh |
| **MEMBER** (Thanh vien) | Xem + nhap giao dich, quan ly tai khoan ca nhan |
| **CHILD** (Con cai) | Chi xem: xem giao dich, tai khoan duoc phep |

### Moi thanh vien
1. Vao trang **Gia dinh** (/family)
2. Bam **"Moi thanh vien"**
3. Nhap email Google cua nguoi duoc moi
4. Chon vai tro (ADMIN / MEMBER / CHILD)
5. Bam **"Gui loi moi"**
6. Nguoi duoc moi dang nhap bang Google se tu dong tham gia

### Quan ly thanh vien (can quyen ADMIN+)
- **Doi vai tro**: Bam vao thanh vien > Chon vai tro moi
- **Tam khoa**: Chuyen trang thai sang SUSPENDED
- **Xoa**: Loai khoi gia dinh

### Quyen cua CHILD (con cai)
- Chi xem duoc cac tai khoan duoc OWNER/ADMIN cho phep
- Khong the them/sua/xoa giao dich
- Khong xem duoc bao cao tai chinh

---

## 9. Bao cao

**Duong dan:** /reports

### Cac loai bao cao
- **Chi tieu theo danh muc**: Bieu do tron phan bo chi tieu
- **Xu huong thu chi**: Bieu do duong theo thang
- **So sanh thang**: So sanh 2 thang bat ky
- **Dong tien**: Bieu do cashflow theo thoi gian
- **Top chi tieu**: 10 giao dich lon nhat
- **Suc khoe tai chinh**: Diem so tong hop (Health Score)

### Xuat bao cao
- Xem truc tiep tren app
- Du lieu cap nhat realtime khi co giao dich moi

---

## 10. Che do Demo vs Thuc te

App ho tro 2 che do hoat dong song song:

| | Demo | Thuc te |
|---|------|---------|
| **Dang nhap** | Khong can | Google OAuth |
| **Du lieu** | Mau, luu localStorage | Database PostgreSQL |
| **Chia se** | Chi 1 nguoi | Ca gia dinh |
| **Mat du lieu** | Khi xoa trinh duyet | Khong mat |
| **API** | Khong | Day du REST API |
| **Phan quyen** | Khong | 4 cap RBAC |

**Chuyen doi tu dong:** Khi dang nhap Google, app tu dong dung API. Khi chua dang nhap, dung du lieu demo.

---

## 11. Cau hinh Production

De su dung day du (co database, dang nhap, chia se gia dinh), can cau hinh:

### 11.1 Tao Database (Supabase)

1. Vao [supabase.com](https://supabase.com) > Tao project moi
2. Copy **Database URL** va **Direct URL** tu Settings > Database
3. Chay migration:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

### 11.2 Tao Google OAuth

1. Vao [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services > Credentials > Create OAuth Client ID
3. Application type: **Web application**
4. Authorized redirect URIs: `https://cfo-family-budget.vercel.app/api/auth/callback/google`
5. Copy **Client ID** va **Client Secret**

### 11.3 Cau hinh Environment Variables tren Vercel

Vao [Vercel Dashboard](https://vercel.com) > Project Settings > Environment Variables:

```
DATABASE_URL = postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
DIRECT_URL = postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
NEXTAUTH_URL = https://cfo-family-budget.vercel.app
NEXTAUTH_SECRET = (tao bang: openssl rand -base64 32)
GOOGLE_CLIENT_ID = [tu Google Cloud Console]
GOOGLE_CLIENT_SECRET = [tu Google Cloud Console]
```

Sau khi cau hinh xong, bam **Redeploy** tren Vercel.

---

## Phim tat & Meo

| Thao tac | Cach lam |
|----------|---------|
| An/Hien so tien | Bam icon con mat tren Dashboard |
| Chuyen thang | Bam "<" / ">" tren Dashboard |
| Tim giao dich nhanh | Ctrl+K hoac bam vao thanh tim kiem |
| Thu gon sidebar | Bam icon menu goc trai |

---

## Ho tro

- **Bug report:** https://github.com/AugustenNg/Family-Budget/issues
- **Source code:** https://github.com/AugustenNg/Family-Budget

---

*CFO Family v0.1.0 — Xay dung boi AugustenNg*
