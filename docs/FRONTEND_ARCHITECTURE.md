# CFO Family Finance App — Frontend Architecture

> Phase 1 Frontend hoan chinh — Zustand + localStorage, san sang cho Phase 2 Backend integration

---

## 1. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 14+ |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.4 |
| UI Components | Custom (Glass Morphism) | — |
| Charts | Recharts | 2.x |
| State | Zustand + persist middleware | 4.5 |
| Storage | localStorage (Phase 1) | — |
| Animation | CSS Keyframes + Tailwind | — |

---

## 2. Directory Structure

```
src/
├── app/
│   ├── globals.css                    # Design tokens, custom classes
│   ├── layout.tsx                     # Root layout (fonts, metadata)
│   └── (dashboard)/                   # Route group — all pages share Sidebar
│       ├── layout.tsx                 # Dashboard shell: Sidebar + main content
│       ├── page.tsx                   # / — Dashboard tong quan
│       ├── transactions/page.tsx      # /transactions — So quy
│       ├── accounts/page.tsx          # /accounts — Tai khoan
│       ├── budget/page.tsx            # /budget — Ngan sach
│       ├── wealth/page.tsx            # /wealth — Tai san & No
│       ├── reports/page.tsx           # /reports — Bao cao
│       ├── family/page.tsx            # /family — Gia dinh
│       └── settings/page.tsx          # /settings — Cai dat
│
├── components/
│   ├── Portal.tsx                     # React Portal (escape overflow/backdrop-filter)
│   ├── layout/
│   │   ├── Sidebar.tsx                # Navigation sidebar (collapsible)
│   │   └── Topbar.tsx                 # Page header + incognito toggle
│   ├── bento/
│   │   ├── FlipCard.tsx               # 3D flip card for accounts
│   │   ├── GravityProgressBar.tsx     # Animated budget progress bar
│   │   └── HeartbeatPulse.tsx         # Circular health score with pulse
│   └── modals/
│       └── AddTransactionModal.tsx    # Global add transaction modal
│
├── features/
│   ├── debt/amortization.ts           # Snowball/Avalanche calculators
│   ├── credit/grace-period.ts         # 45-day grace period logic
│   └── cashflow/health-score.ts       # Financial health scoring engine
│
└── lib/
    ├── store.ts                       # Zustand store — all state + CRUD
    ├── mock-data.ts                   # Types + seed data
    ├── format.ts                      # Vietnamese formatting utilities
    ├── prisma.ts                      # Prisma client singleton (Phase 2)
    └── api/response.ts               # API response helpers (Phase 2)
```

---

## 3. Zustand Store (`src/lib/store.ts`)

### 3.1 State Shape

```typescript
interface AppState {
  // --- Data ---
  accounts:     Account[]
  transactions: Transaction[]
  budgets:      Budget[]
  debts:        Debt[]
  investments:  Investment[]
  goals:        Goal[]

  // --- Actions ---
  addTransaction:    (tx: NewTransaction) => void
  updateTransaction: (id: string, patch: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void

  addAccount:    (acc: Partial<Account>) => void
  updateAccount: (id: string, patch: Partial<Account>) => void

  addBudget:    (b: Partial<Budget>) => void
  updateBudget: (id: string, patch: Partial<Budget>) => void
  deleteBudget: (id: string) => void

  addDebt:       (d: Partial<Debt>) => void
  addInvestment: (inv: Partial<Investment>) => void
  addGoal:       (g: Partial<Goal>) => void
  contributeToGoal: (goalId: string, amount: number, fromAccountId: string) => void

  // --- Computed ---
  getSummary: () => Summary
}
```

### 3.2 Side Effects

Moi action co side-effect tu dong:

| Action | Side Effects |
|--------|-------------|
| `addTransaction` | `account.balance += amount` (INCOME) hoac `-= amount` (EXPENSE); `budget.spent += amount` |
| `updateTransaction` | Reverse old impact, apply new impact |
| `deleteTransaction` | Reverse balance + budget spent |
| `contributeToGoal` | `goal.current += amount`; `account.balance -= amount`; auto-create TRANSFER transaction |
| `addBudget` | Prevent duplicate categoryId; auto-correct metadata from BUDGET_CATEGORIES |

### 3.3 Persistence

```typescript
persist(stateCreator, {
  name: 'cfo-family-store-v1',
  storage: createJSONStorage(() => localStorage),
  onRehydrateStorage: () => (state) => {
    // Convert ISO date strings back to Date objects
  }
})
```

### 3.4 Exported Constants

| Constant | Muc dich |
|----------|---------|
| `ALL_CATEGORIES` | Array of `{ name, icon }` — all transaction categories |
| `BUDGET_CATEGORIES` | Array of `{ id, name, icon, color }` — budget category metadata |
| `CATEGORY_BUDGET_MAP` | Maps category name → budget categoryId |

---

## 4. Pages Chi Tiet

### 4.1 Dashboard (`/`)

**Layout:** Bento grid responsive

| Section | Component | Du lieu |
|---------|-----------|--------|
| Suc khoe dong tien | `HeartbeatPulse` | `getSummary().healthScore` |
| Tai khoan | `FlipCard` x4 | `accounts.slice(0,4)` |
| Tai san rong | Net worth cards | `getSummary().netWorth` |
| Ngan sach thang | `GravityProgressBar` | `budgets` |
| Giao dich gan day | Transaction list | `transactions.slice(0,8)` |
| Tom tat nhanh | Stats pills | savingsRate, budgetCompliance, emergencyFund |
| Canh bao | Alert cards | Budget overruns, credit warnings |

### 4.2 Giao dich (`/transactions`)

**Layout:** Filter bar + grouped transaction list

- **Filters:** Search, Type (ALL/INCOME/EXPENSE/TRANSFER), Account dropdown
- **Grouped by:** Date (Vietnamese locale)
- **TransactionRow:** Expandable — click to show detail panel with Edit/Delete
- **EditTransactionModal:** Rendered via `<Portal>` to escape `.card overflow-hidden`
- **Delete flow:** 2-step confirm with warning message

### 4.3 Tai khoan (`/accounts`)

**Layout:** Summary cards + categorized account grids

- **Categories:** Bank & Cash, Credit Cards, Savings & Investment
- **FlipCard:** 3D hover-flip showing front (balance) / back (details)
- **AccountDetailModal:** Shows recent transactions, stats, Edit button
- **AddAccountModal:** Type selector (Bank/Credit/Savings) + form

### 4.4 Ngan sach (`/budget`)

**Layout:** Month tabs + Donut gauge + Budget bars

- **Month selector:** T1-T12/2026 tabs
- **Circular gauge:** SVG showing overall usage %
- **GravityProgressBar:** Per-category animated bars with badges
- **Zero-based Budgeting:** Allocation tracker (Thu nhap - Ngan sach = 0)
- **AddBudgetModal:** Available categories only (deduplication), quick amount buttons
- **EditBudgetModal:** Edit amount + Delete with confirm

### 4.5 Tai san & No (`/wealth`)

**Layout:** 3-tab system

| Tab | Noi dung |
|-----|---------|
| **Quan ly No** | Debt list, Snowball/Avalanche strategy picker, amortization schedule, extra payment slider |
| **Dau tu** | Investment list with type/return rate, total value cards |
| **Muc tieu** | Goal cards with progress, "+ Dong gop" modal, contribution from account |

### 4.6 Bao cao (`/reports`)

**Layout:** Full Recharts dashboard

| Chart | Type | Du lieu |
|-------|------|--------|
| Thu Chi 6 Thang | `BarChart` | Monthly income/expense/savings |
| Chi Tieu Theo Danh Muc | Radial/Pie | Category % breakdown |
| Ngan Sach vs Thuc Te | Horizontal `BarChart` | Budget vs actual per category |
| Tiet Kiem Luy Ke | `AreaChart` | Monthly + cumulative savings |
| So Du Tai Khoan | Progress bars | Per-account balances |
| Nguon Thu Nhap | Stacked bar | Income sources |
| Bang Tong Ket | Table | Category summary with status badges |

### 4.7 Gia dinh (`/family`)

**Layout:** Family overview + member comparison

- **Family banner:** Name, member count, health score badge
- **Member cards:** Income, expense, savings, contribution %
- **So Sanh Thu Chi:** BarChart comparing members
- **Ngan Sach Chi Tieu Chung:** Shared budgets with member portion bars
- **Giao Dich Gan Day:** Recent family transactions
- **Canh Bao:** Budget overrun alerts
- **Tom Tat Thang:** Family financial summary

### 4.8 Cai dat (`/settings`)

- Profile display (read-only Phase 1)
- Theme toggle (dark/light)
- Notification preferences (6 toggles)
- Security section (placeholder)
- Data export/backup/delete

---

## 5. Reusable Components

### 5.1 `FlipCard`

```typescript
Props: { account: Account }
```

- 3D CSS perspective flip (hover/click)
- Front: type label, name, balance, credit bar, account masking
- Back: Magnetic strip, credit details, bank info
- Gradient background per account type

### 5.2 `GravityProgressBar`

```typescript
Props: { budget: Budget, animate?: boolean }
```

- Header: icon + name + badges (Vuot!/Gan het)
- Animated fill bar with gradient + glow effect
- Color coding: green (<80%), amber (80-100%), red (>100%)
- Footer: percentage + remaining amount

### 5.3 `HeartbeatPulse`

```typescript
Props: { score: number, income: number, expense: number, savings: number }
```

- SVG circular progress ring
- 2-layer animated pulse rings
- Center: emoji + score + level label
- Below: 3 stat pills (income/expense/savings)

### 5.4 `Portal`

```typescript
Props: { children: ReactNode }
```

- Renders children into `document.body` via `createPortal`
- Escapes parent `overflow: hidden` and `backdrop-filter` containing blocks
- Used for modals rendered inside `.card` containers

### 5.5 `Topbar`

```typescript
Props: { title: string, subtitle?: string, onAdd?: () => void }
```

- Page title + subtitle
- Date display (Vietnamese locale)
- Incognito toggle (blur sensitive numbers)
- Notification bell + Add button

### 5.6 `Sidebar`

- Fixed navigation with 7 routes
- Collapsible (icon-only mode)
- Active route highlighting
- User profile section

---

## 6. Feature Modules

### 6.1 Debt Amortization (`features/debt/amortization.ts`)

| Function | Input | Output |
|----------|-------|--------|
| `calculateAmortization` | `DebtInput` | `AmortizationRow[]` |
| `calculateDebtPayoff` | `DebtInput, extraPayment?` | `DebtPayoffResult` |
| `calculateSnowball` | `DebtInput[], extraBudget?` | Strategy result (smallest balance first) |
| `calculateAvalanche` | `DebtInput[], extraBudget?` | Strategy result (highest interest first) |
| `compareStrategies` | `DebtInput[], extraBudget?` | Side-by-side comparison + recommendation |

### 6.2 Credit Card Grace Period (`features/credit/grace-period.ts`)

| Function | Muc dich |
|----------|---------|
| `getCurrentStatementCycle` | Tinh chu ky sao ke hien tai |
| `calculateGraceDaysForTransaction` | So ngay mien lai cho giao dich |
| `isChargingInterest` | Kiem tra co bi tinh lai khong |
| `calculateCreditInterest` | Tinh lai the tin dung |
| `getCreditWarningMessage` | Canh bao muc do: safe/warning/danger |

### 6.3 Financial Health Score (`features/cashflow/health-score.ts`)

**Scoring Weights:**

| Component | Weight | Metric |
|-----------|--------|--------|
| Savings | 25% | savingsRate >= 20% = 100 |
| Emergency Fund | 20% | >= 6 months = 100 |
| Debt | 20% | DTI ratio <= 36% = 100 |
| Budget | 15% | compliance rate |
| Investment | 15% | investmentRate >= 10% = 100 |
| Cashflow | 5% | income > expense |

**Levels:** Xuat sac (>=85) | Tot (>=70) | Trung binh (>=50) | Yeu (>=30) | Nguy hiem (<30)

---

## 7. Formatting Utilities (`lib/format.ts`)

| Function | Input | Output |
|----------|-------|--------|
| `formatVND(1500000)` | number | `"1.500.000 dong"` |
| `formatVNDShort(1500000)` | number | `"1,5tr"` |
| `formatVNDSigned(-50000)` | number | `"-50.000 dong"` |
| `formatDate(date)` | Date | `"Thu Bay, 08/03/2026"` |
| `formatDateSmart(date)` | Date | `"Hom nay"` / `"Hom qua"` / date |
| `formatRelative(date)` | Date | `"3 gio truoc"` |
| `formatPercent(0.2456)` | number | `"24.56%"` |
| `maskAccountNumber("1234")` | string | `"**** **** **** 1234"` |

---

## 8. Design System

### 8.1 CSS Variables (Dark Theme)

```css
--bg-base:       #020617    /* Slate 950 */
--bg-card:       rgba(255,255,255,0.04)
--border:        rgba(255,255,255,0.08)
--text-primary:  #f8fafc    /* Slate 50 */
--text-secondary:#94a3b8    /* Slate 400 */
--text-muted:    #475569    /* Slate 600 */
--emerald:       #10b981
--indigo:        #6366f1
--red:           #ef4444
--amber:         #f59e0b
--sidebar-width: 240px
```

### 8.2 Key Custom Classes

| Class | Muc dich |
|-------|---------|
| `.card` | Glass morphism container: backdrop-filter blur(12px) |
| `.card-glass` | Enhanced glass: blur(20px), used for modals |
| `.modal-overlay` | Fixed fullscreen backdrop with blur |
| `.flip-card` | 3D perspective container |
| `.input-field` | Styled input with focus ring |
| `.blur-sensitive` | Blurs amount when incognito mode active |
| `.gravity-bar-fill` | Animated budget bar with glow |
| `.pulse-ring-1/2` | Heartbeat pulse animations |
| `.font-num` | Monospace numbers (Roboto Mono, tabular-nums) |

### 8.3 Animations

| Animation | Duration | Effect |
|-----------|----------|--------|
| `fade-in` | 0.25s | Opacity 0 → 1 |
| `slide-up` | 0.35s | TranslateY(16px) → 0 + fade |
| `shimmer` | 1.5s infinite | Skeleton loading gradient |
| `pulse-ring` | 2s/3s infinite | Expanding ring + fade |
| `gravity-danger` | 0.5s infinite | Flicker for over-budget |

---

## 9. Data Flow

```
User Action
    │
    ▼
Page Component (e.g., TransactionsPage)
    │
    ├── useAppStore(s => s.transactions)     ← Subscribe to state
    │
    ├── User clicks "Them giao dich"
    │       │
    │       ▼
    │   AddTransactionModal
    │       │
    │       ├── Form validation
    │       │
    │       ▼
    │   store.addTransaction(tx)
    │       │
    │       ├── transactions.push(newTx)          ← Primary effect
    │       ├── account.balance += amount          ← Side effect
    │       ├── budget.spent += amount             ← Side effect
    │       │
    │       ▼
    │   Zustand notify all subscribers
    │       │
    │       ├── TransactionsPage re-renders        ← List updates
    │       ├── Dashboard re-renders               ← Summary updates
    │       └── BudgetPage re-renders              ← Spent updates
    │
    └── persist middleware
            │
            ▼
        localStorage.setItem('cfo-family-store-v1', state)
```

---

## 10. Known Limitations (Phase 1)

| # | Limitation | Phase 2 Fix |
|---|-----------|-------------|
| 1 | Du lieu chi luu localStorage (mat khi clear browser) | Supabase PostgreSQL |
| 2 | Khong co authentication | NextAuth.js v5 + Google OAuth |
| 3 | Khong realtime sync giua devices | Supabase Realtime |
| 4 | Mock family members (hardcoded) | Family table + invitations |
| 5 | Khong co OCR receipt scanning | Supabase Storage + AI OCR |
| 6 | Reports dung du lieu tinh | Server-side aggregation queries |
| 7 | Settings chua luu | User preferences table |
| 8 | Hydration warning (HeartbeatPulse SVG) | `suppressHydrationWarning` or dynamic import |

---

## 11. API Contract (Phase 2 Ready)

File `src/lib/api/response.ts` da cung cap cac helper:

```typescript
// Success
ok<T>(data, meta?)       → 200
created<T>(data)         → 201
noContent()              → 204

// Errors
badRequest(msg, details) → 400
unauthorized(msg)        → 401
forbidden(msg)           → 403
notFound(resource)       → 404
conflict(msg)            → 409
unprocessable(msg, det)  → 422
tooManyRequests()        → 429
serverError(error)       → 500

// Auto error handler
handleApiError(error)    → Handles Zod, Prisma, generic errors
```

---

## 12. Migration Path: Phase 1 → Phase 2

```
Phase 1 (Current)              Phase 2 (Target)
─────────────────              ────────────────
Zustand store          →       TanStack Query + Zustand (optimistic)
localStorage           →       Supabase PostgreSQL via Prisma
Mock data              →       API routes (/api/v1/*)
Client-side calc       →       Server-side aggregation
No auth                →       NextAuth.js v5
Single user            →       Multi-user + Family
No validation          →       Zod schemas + server validation
```

**Migration strategy:**
1. Keep Zustand for UI state (modals, filters, theme)
2. Replace data arrays with TanStack Query hooks
3. Add API routes with Zod validation + Prisma queries
4. Keep existing components — only change data source
5. Add optimistic updates for instant UI feedback

---

*Last updated: 2026-03-09*
*Generated from Phase 1 codebase analysis*
