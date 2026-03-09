# 🏗️ Kế hoạch Xây dựng Chi tiết — CFO Family Finance App
*Cập nhật: 2026-03-08 | Dựa trên Master Document v1.0*

---

## 📊 Phân tích Gap — Những gì cần bổ sung vào Master Document

### Gap 1: Thiếu Onboarding Flow
- Hướng dẫn người dùng mới setup gia đình lần đầu (wizard 5 bước)
- Import dữ liệu từ Excel cũ
- Thiết lập danh mục + ngân sách đầu tháng đầu tiên

### Gap 2: Thiếu API Specification
- Không có mô tả REST endpoints
- Chưa có xác định Rate Limiting
- Chưa có Error Response format chuẩn

### Gap 3: Thiếu Multi-currency Details
- Cách xử lý khi có giao dịch USD/EUR
- Nguồn lấy tỷ giá (VCB API / openexchangerates.org)
- Cách hiển thị tài sản đa tệ trên dashboard

### Gap 4: Thiếu Quy trình Bảo mật Nâng cao
- Chưa có 2FA (TOTP)
- Chưa có PIN 6 số + sinh trắc học (Face ID / Touch ID via WebAuthn)
- Chưa rõ Session timeout policy

### Gap 5: Thiếu Export & Report
- Xuất báo cáo PDF hàng tháng
- Xuất sao kê Excel để nộp thuế
- Chia sẻ báo cáo với kế toán

### Gap 6: Thiếu Strategy cho Peer Comparison
- Cơ chế ẩn danh hóa dữ liệu
- Điều kiện opt-in (phải tự nguyện)
- Tần suất cập nhật benchmark

### Gap 7: Thiếu Testing Plan
- Unit tests cho business logic (tính lãi thẻ tín dụng, chiến lược trả nợ)
- Integration tests cho API
- E2E tests cho user flows chính

### Gap 8: Thiếu Deployment Pipeline
- CI/CD với GitHub Actions
- Preview deployments (Vercel)
- Environment management (dev/staging/prod)

---

## 🗄️ Database — Entities tổng quan

```
Users ──────────────── FamilyMembers ──── Family
                                              │
                   ┌──────────────────────────┤
                   │                          │
          FinancialAccounts           Categories
                   │                          │
                   └────── Transactions ──────┘
                                │
                ┌───────────────┼───────────────┐
           RecurringTx      Tags            AuditLog
                                │
                    ┌───────────┼───────────┐
                  Debts   Investments  SavingsGoals
                    │           │           │
              DebtPayments  Valuations  Contributions
                                │
                          NetWorthSnapshot
                          HealthScore
                          Notifications
                          OcrReceipts
                          BankImports
```

**Tổng: 30 tables**

---

## 🚀 Kế hoạch Xây dựng — 3 Phases

---

### PHASE 0: Nền móng (Tuần 1) ← ĐANG LÀM

**Mục tiêu:** Có môi trường dev chạy được, database kết nối, NextAuth hoạt động.

#### Hạng mục 0.1 — Project Setup
- [ ] `npx create-next-app@latest cfo-family --typescript --tailwind --app`
- [ ] Cài dependencies: `shadcn/ui`, `prisma`, `@prisma/client`, `next-auth`, `zustand`, `@tanstack/react-query`, `recharts`, `zod`
- [ ] Setup `.env` với Supabase connection strings
- [ ] Cấu hình `tsconfig.json` paths aliases (`@/`)
- [ ] Setup ESLint + Prettier + Husky pre-commit hooks

#### Hạng mục 0.2 — Database
- [x] Thiết kế Prisma schema (30 tables, 14 enums)
- [x] Viết seed file (danh mục hệ thống + gia đình demo)
- [x] Viết migration strategy
- [ ] **Chạy:** `npx prisma migrate dev --name init`
- [ ] **Chạy:** `npx prisma db seed`
- [ ] Kiểm tra bằng Prisma Studio

#### Hạng mục 0.3 — Authentication
- [ ] Cài `next-auth` + `@auth/prisma-adapter`
- [ ] Setup providers: Google OAuth + Email Magic Link
- [ ] Middleware bảo vệ routes `/dashboard/**`
- [ ] Trang `/login` đơn giản (chưa cần đẹp)

**Deliverable Phase 0:** App chạy được trên localhost, login với Google được, Prisma Studio hiển thị đúng schema.

---

### PHASE 1: Core Engine (Tuần 2-4)

**Mục tiêu:** Nhập giao dịch và xem dashboard được — đủ để dùng thực tế cơ bản.

#### Hạng mục 1.1 — Family Setup Wizard
Wizard 5 bước sau khi login lần đầu:
1. Đặt tên gia đình + chọn đồng tiền
2. Thêm tài khoản tài chính (ATM, ví, thẻ tín dụng)
3. Mời thành viên (vợ/chồng) qua email
4. Thiết lập ngân sách tháng đầu
5. Done! → Redirect to Dashboard

#### Hạng mục 1.2 — Dashboard (Bento-box UI)

**Widget 1: Heartbeat Pulse** (trung tâm)
- Điểm sức khỏe 0-100 (vòng tròn có animation nhịp tim)
- Dưới vòng tròn: Thu / Chi / Còn lại tháng này

**Widget 2: Tài khoản (Flip Cards)**
- Grid 2-3 thẻ flip, mỗi thẻ là 1 tài khoản
- Mặt trước: Số dư, tên ngân hàng, biểu tượng
- Mặt sau (flip): Hạn mức, ngày sao kê (thẻ tín dụng)

**Widget 3: Ngân sách (Gravity Progress Bars)**
- Top 5 danh mục chi tiêu trong tháng
- Thanh tiến độ có animation đỏ "ăn" vào xanh

**Widget 4: Giao dịch gần đây**
- 5-7 giao dịch mới nhất, inline icon + màu
- Nút "Xem tất cả" → /transactions

**Widget 5: Tài sản ròng (mini chart)**
- Sparkline 3 tháng gần nhất

#### Hạng mục 1.3 — Nhập giao dịch
- Modal/Sheet "Giao dịch mới" luôn accessible (floating button)
- Fields: Số tiền, Danh mục, Tài khoản, Ngày, Mô tả, Tags
- **Smart input:** Gõ số tiền → tự suggest danh mục dựa trên lịch sử
- Validate bằng `zod`
- Cập nhật số dư tài khoản realtime (Optimistic update với React Query)

#### Hạng mục 1.4 — Sổ quỹ (Transaction List)
- Infinite scroll / Pagination
- Filter: Tài khoản | Danh mục | Khoảng thời gian | Loại | Tags
- Search full-text theo mô tả
- Group by date (tiêu đề ngày giao dịch)
- Swipe để xóa (mobile UX)

#### Hạng mục 1.5 — Quản lý tài khoản
- CRUD FinancialAccount
- Trang chi tiết tài khoản: lịch sử giao dịch + biểu đồ mini

#### Hạng mục 1.6 — API Routes cần có (Phase 1)

```
POST   /api/transactions         Tạo giao dịch
GET    /api/transactions         Lấy danh sách (có filter/pagination)
PUT    /api/transactions/:id     Sửa giao dịch
DELETE /api/transactions/:id     Xóa giao dịch

GET    /api/accounts             Danh sách tài khoản
POST   /api/accounts             Tạo tài khoản
PUT    /api/accounts/:id         Sửa tài khoản

GET    /api/dashboard/summary    Tổng hợp cho Dashboard widgets
GET    /api/categories           Danh mục (có cả system + family)
```

**Deliverable Phase 1:** Nhập giao dịch → thấy ngay trên dashboard. Vợ chồng cùng xem realtime.

---

### PHASE 2: Family Workspace & Advanced (Tuần 5-8)

**Mục tiêu:** Đủ tính năng cho người dùng power user — ngân sách, nợ, đầu tư.

#### Hạng mục 2.1 — Ngân sách Zero-based
- Trang `/budget` với danh mục và mức chi tiêu đã set
- Thiết lập ngân sách theo tháng (copy từ tháng trước)
- Gravity Progress Bars nâng cao: tooltip chi tiết khi hover
- Alert tự động khi chạm 80% / 100%

#### Hạng mục 2.2 — Family Workspace
- Trang `/family/settings`: Quản lý thành viên
- Invite bằng email (gửi magic link)
- Role management: OWNER / ADMIN / MEMBER / CHILD
- Activity feed: "Chị Mai vừa chi 250k ăn trưa"
- Realtime sync dùng Supabase Realtime (WebSocket)

#### Hạng mục 2.3 — Quản lý Thẻ Tín Dụng
- Logic tính 45 ngày miễn lãi
- Hiển thị "Ngày sao kê: 25/03" và "Hạn thanh toán: 09/04"
- Danh sách chi tiêu "đang pending" (chưa sao kê)
- Cảnh báo nếu quên thanh toán (thông báo trước 3 ngày)
- Tạo giao dịch CREDIT_PAYMENT để "trả thẻ"

#### Hạng mục 2.4 — Quản lý Nợ (Debt Management)
- CRUD Debt (nhà, xe, vay tín chấp)
- Bảng khấu hao: Hiển thị từng kỳ (gốc, lãi, dư nợ)
- Robot gợi ý chiến lược: Snowball vs Avalanche
  - Snowball: Sắp xếp ưu tiên khoản nhỏ nhất
  - Avalanche: Sắp xếp ưu tiên lãi suất cao nhất
  - Hiển thị: "Nếu dùng Avalanche, tiết kiệm được 12tr tiền lãi"
- Timeline trả hết nợ (dự báo)

#### Hạng mục 2.5 — Portfolio Đầu tư
- CRUD Investment
- Tự nhập giá trị hiện tại (hoặc kéo từ API VNStock cho cổ phiếu VN)
- P&L chart: Lãi/Lỗ so với giá mua
- Asset allocation pie chart

#### Hạng mục 2.6 — Net Worth Timeline
- Đường cong tài sản ròng 12 tháng gần nhất
- Dự báo 1-3-5 năm (dùng linear regression đơn giản)
- Milestone markers (mua nhà, trả hết nợ xe, v.v.)

#### Hạng mục 2.7 — Giao dịch Lặp lại (Recurring)
- CRUD RecurringTransaction (hàng tháng, hàng tuần)
- Background job kiểm tra và tạo giao dịch (Vercel Cron Jobs)
- Thông báo khi giao dịch tự động được tạo

**API mới Phase 2:**
```
/api/budgets/**
/api/family/**
/api/debts/**
/api/investments/**
/api/savings-goals/**
/api/recurring/**
/api/net-worth/**
```

---

### PHASE 3: Automation & AI (Tháng 3+)

**Mục tiêu:** "Wow factor" — AI, automation, báo cáo chuyên nghiệp.

#### Hạng mục 3.1 — AI OCR Hóa đơn
- Upload ảnh hóa đơn (camera hoặc gallery)
- Gọi Google Vision API / AWS Textract / OpenAI Vision
- Parse: Tên cửa hàng, số tiền, ngày, mặt hàng
- Hiển thị preview + cho user confirm trước khi tạo giao dịch

#### Hạng mục 3.2 — Bank Statement Import
- Upload CSV sao kê ngân hàng
- Mapping template cho từng ngân hàng VN (VCB, TCB, MBB, ACB, BIDV, VPB)
- Auto-detect duplicate transactions
- Batch confirm: User chọn skip/import từng dòng

#### Hạng mục 3.3 — PWA (Progressive Web App)
- `next-pwa` setup
- Service Worker caching strategy
- Offline queue cho giao dịch chưa sync
- "Cài app" prompt trên iOS/Android

#### Hạng mục 3.4 — Cảnh báo & Thông báo
- In-app notification center
- Push notification (Web Push API)
- Tích hợp Zalo OA (Zalo Official Account API)
- Tích hợp Telegram Bot

#### Hạng mục 3.5 — Peer Comparison
- Opt-in: User chọn chia sẻ dữ liệu ẩn danh
- Phân nhóm theo thu nhập + thành phố
- Dashboard widget: "Gia đình bạn chi ăn uống 18% thu nhập, trung bình nhóm là 25% — rất tốt! 👍"

#### Hạng mục 3.6 — Export & Reports
- Báo cáo PDF tháng (dùng `@react-pdf/renderer`)
- Export Excel sao kê (dùng `xlsx`)
- Báo cáo thuế cuối năm

#### Hạng mục 3.7 — Bảo mật Nâng cao
- 2FA với TOTP (Google Authenticator)
- PIN 6 số cho quick access
- WebAuthn (Face ID / Touch ID) nếu thiết bị hỗ trợ
- Session management: Xem & revoke active sessions

---

## 🗓️ Timeline Chi tiết

| Tuần | Sprint | Deliverable |
|------|--------|-------------|
| 1 | Phase 0 | Prisma + Auth + Dev environment |
| 2 | Phase 1a | Dashboard UI tĩnh (đẹp, WOW) |
| 3 | Phase 1b | Nhập giao dịch + CRUD hoạt động |
| 4 | Phase 1c | Transaction list + Account management |
| 5 | Phase 2a | Ngân sách + Realtime sync |
| 6 | Phase 2b | Credit card logic + Debt management |
| 7 | Phase 2c | Investments + Net worth |
| 8 | Phase 2d | Family workspace + Recurring |
| 9+ | Phase 3 | OCR + PWA + Notifications + Export |

---

## 💻 Tech Stack Đầy đủ

```
Frontend:
  ├── Next.js 14+ (App Router)
  ├── TypeScript
  ├── Tailwind CSS
  ├── Shadcn/UI (components)
  ├── Recharts (biểu đồ)
  ├── Framer Motion (animations)
  └── React Hook Form + Zod (forms)

State Management:
  ├── Zustand (global client state)
  └── TanStack Query v5 (server state + cache)

Backend:
  ├── Next.js API Routes (Route Handlers)
  ├── Prisma ORM
  └── Zod (validation)

Database:
  ├── PostgreSQL (Supabase)
  ├── Supabase Realtime (WebSocket)
  └── Supabase Storage (hình ảnh OCR)

Auth:
  ├── NextAuth.js v5
  ├── Prisma Adapter
  └── Google OAuth + Email Magic Link

AI & Automation:
  ├── Google Vision API (OCR)
  ├── Vercel Cron Jobs (recurring transactions)
  └── Web Push API (notifications)

Deployment:
  ├── Vercel (hosting)
  ├── Supabase (database + realtime + storage)
  └── GitHub Actions (CI/CD)

Testing:
  ├── Jest + Testing Library (unit + integration)
  ├── Playwright (E2E)
  └── Prisma Test (isolated DB per test)
```

---

## 📁 Cấu trúc thư mục đầy đủ

```
cfo-family/
├── prisma/
│   ├── schema.prisma          ✅ Done
│   ├── seed.ts                ✅ Done
│   └── migrations/
│       └── README.md          ✅ Done
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── onboarding/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          # Dark mode shell
│   │   │   ├── page.tsx            # Dashboard (Bento-box)
│   │   │   ├── transactions/
│   │   │   │   ├── page.tsx        # Danh sách giao dịch
│   │   │   │   └── [id]/page.tsx   # Chi tiết giao dịch
│   │   │   ├── budget/page.tsx     # Ngân sách
│   │   │   ├── accounts/
│   │   │   │   ├── page.tsx        # Danh sách tài khoản
│   │   │   │   └── [id]/page.tsx   # Chi tiết tài khoản
│   │   │   ├── wealth/
│   │   │   │   ├── debt/page.tsx       # Quản lý nợ
│   │   │   │   ├── investments/page.tsx # Đầu tư
│   │   │   │   └── goals/page.tsx      # Mục tiêu tiết kiệm
│   │   │   ├── reports/page.tsx    # Báo cáo & Export
│   │   │   └── family/page.tsx     # Quản lý gia đình
│   │   │
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── transactions/route.ts
│   │       ├── transactions/[id]/route.ts
│   │       ├── accounts/route.ts
│   │       ├── budgets/route.ts
│   │       ├── debts/route.ts
│   │       ├── investments/route.ts
│   │       ├── dashboard/summary/route.ts
│   │       ├── ocr/route.ts
│   │       ├── import/route.ts
│   │       └── cron/                # Vercel cron jobs
│   │           └── recurring/route.ts
│   │
│   ├── components/
│   │   ├── ui/                      # Shadcn base components
│   │   ├── bento/
│   │   │   ├── HeartbeatPulse.tsx
│   │   │   ├── FlipCard.tsx
│   │   │   ├── GravityProgressBar.tsx
│   │   │   └── NetWorthSparkline.tsx
│   │   ├── transaction/
│   │   │   ├── TransactionForm.tsx
│   │   │   ├── TransactionList.tsx
│   │   │   └── TransactionItem.tsx
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       ├── Topbar.tsx
│   │       └── IncognitoBlur.tsx
│   │
│   ├── features/
│   │   ├── cashflow/
│   │   │   ├── health-score.ts      # Tính điểm sức khỏe
│   │   │   └── cashflow-analysis.ts # Phân tích dòng tiền
│   │   ├── credit/
│   │   │   ├── grace-period.ts      # Tính 45 ngày miễn lãi
│   │   │   └── statement-cycle.ts   # Chu kỳ sao kê
│   │   ├── debt/
│   │   │   ├── amortization.ts      # Bảng khấu hao
│   │   │   ├── snowball.ts          # Chiến lược snowball
│   │   │   └── avalanche.ts         # Chiến lược avalanche
│   │   ├── budget/
│   │   │   └── zero-based.ts        # Logic zero-based budgeting
│   │   └── forecast/
│   │       └── net-worth-projection.ts  # Dự báo tài sản ròng
│   │
│   ├── store/
│   │   ├── family.store.ts          # Zustand: family state
│   │   ├── ui.store.ts              # Zustand: UI state (incognito, sidebar)
│   │   └── account.store.ts         # Zustand: selected account
│   │
│   ├── lib/
│   │   ├── prisma.ts               # Prisma client singleton
│   │   ├── auth.ts                 # NextAuth config
│   │   ├── format.ts               # formatVND, formatDate, formatPercent
│   │   ├── validations/            # Zod schemas
│   │   │   ├── transaction.schema.ts
│   │   │   ├── account.schema.ts
│   │   │   └── budget.schema.ts
│   │   └── api/
│   │       └── response.ts         # Chuẩn hóa API response
│   │
│   └── types/
│       └── index.ts                # Shared TypeScript types
│
├── public/
│   └── icons/                      # Category icons SVG
│
├── docs/
│   ├── BUILD_PLAN.md              ✅ Đây
│   └── API_SPEC.md                # TODO
│
├── .env.example
├── .env.local
├── package.json
└── next.config.ts
```

---

## ⚡ Bước tiếp theo ngay bây giờ

1. **Tạo Supabase project** → Lấy `DATABASE_URL` và `DIRECT_URL`
2. **Chạy** `npx create-next-app@latest`
3. **Cài dependencies** và copy prisma/schema.prisma vào
4. **Chạy** `npx prisma migrate dev --name init`
5. **Chạy** `npx prisma db seed`
6. Bắt đầu code Dashboard UI

---

*Tài liệu này được tạo tự động dựa trên phân tích Master Document CFO Family App v1.0*
