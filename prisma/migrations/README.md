# Database Migration Guide

## Quy trình Migration

### Lần đầu setup (Development)
```bash
# 1. Tạo database trên Supabase, lấy connection string
# 2. Copy .env.example → .env và điền DATABASE_URL

# 3. Chạy migration lần đầu
npx prisma migrate dev --name init

# 4. Seed dữ liệu mẫu
npx prisma db seed

# 5. Mở Prisma Studio để kiểm tra
npx prisma studio
```

### Khi thay đổi schema
```bash
# Tạo migration mới
npx prisma migrate dev --name <tên_thay_đổi>

# Ví dụ:
npx prisma migrate dev --name add_peer_comparison
npx prisma migrate dev --name update_transaction_add_location
```

### Production deployment
```bash
# KHÔNG dùng migrate dev trên production
npx prisma migrate deploy
```

## Naming Convention cho Migrations
- `init` — migration khởi tạo
- `add_<feature>` — thêm bảng/cột mới
- `update_<table>_<change>` — sửa bảng
- `drop_<table>` — xóa bảng (cần cẩn thận)
- `index_<table>_<columns>` — thêm index

## Database Indexes Strategy

### Indexes đã có trong schema (@@index)
Tất cả foreign keys đều được index. Ngoài ra có composite indexes:

| Bảng | Index | Mục đích |
|------|-------|----------|
| Transaction | (familyId, date) | Dashboard queries |
| Transaction | (familyId, type, date) | Filter theo loại + khoảng thời gian |
| Transaction | (userId, isRead) | Notification unread count |
| NetWorthSnapshot | (familyId, snapshotDate) | Unique + timeline query |
| FinancialHealthScore | (familyId, scoreDate) | Unique + trend query |

### Supabase Row Level Security (RLS) — Phase 2

Sau khi có auth, bật RLS để bảo mật:

```sql
-- Enable RLS
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;

-- Policy: Chỉ thành viên gia đình mới xem được giao dịch
CREATE POLICY "Family members only" ON "Transaction"
  FOR ALL USING (
    "familyId" IN (
      SELECT "familyId" FROM "FamilyMember"
      WHERE "userId" = auth.uid()
      AND "status" = 'ACTIVE'
    )
  );
```

## Backup Strategy

| Loại | Tần suất | Giữ lại |
|------|----------|---------|
| Point-in-time Recovery | Continuous (Supabase Pro) | 7 ngày |
| Daily Export | 00:00 UTC | 30 ngày |
| Monthly Archive | Ngày 1 hàng tháng | Vĩnh viễn |

Supabase tự động backup nếu dùng Pro plan.
