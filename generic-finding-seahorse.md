# Backend Architecture Plan — CFO Family Finance App

## Context

Phase 1 FE hoan thanh (Zustand + localStorage, 8 pages, full CRUD). Can xay dung BE hoan chinh voi:
- Multi-layer validation (Zod + business rules)
- Controller → Service → Repository separation
- Family-scoped data + RBAC
- Production-ready, scalable

**Existing infrastructure:** Prisma schema (30 tables), API response helpers (`src/lib/api/response.ts`), Prisma client (`src/lib/prisma.ts`), feature modules (`src/features/`), NextAuth + TanStack Query dependencies installed.

---

## 1. Directory Structure

```
src/
  app/api/v1/
    auth/[...nextauth]/route.ts
    transactions/route.ts                    # GET, POST
    transactions/[id]/route.ts               # GET, PATCH, DELETE
    accounts/route.ts + [id]/route.ts
    budgets/route.ts + [id]/route.ts
    debts/route.ts + [id]/route.ts
      debts/[id]/payments/route.ts
      debts/[id]/amortization/route.ts
    investments/route.ts + [id]/route.ts
      investments/[id]/valuations/route.ts
    goals/route.ts + [id]/route.ts
      goals/[id]/contribute/route.ts
    categories/route.ts + [id]/route.ts
    tags/route.ts + [id]/route.ts
    summary/route.ts
      summary/net-worth/route.ts
      summary/health-score/route.ts
    family/route.ts
      family/members/route.ts + [id]/route.ts
    notifications/route.ts + settings/route.ts
    recurring/route.ts + [id]/route.ts

  server/
    errors/app-error.ts                      # AppError class (badRequest, notFound, etc.)
    types/api.types.ts                       # AuthContext, FamilyContext, RouteHandler
    middleware/
      with-auth.ts                           # Session verification → inject userId
      with-family.ts                         # Family membership → inject familyId + role
      with-role.ts                           # RBAC: OWNER > ADMIN > MEMBER > CHILD
      with-validation.ts                     # validateBody() / validateQuery() via Zod
    validators/
      common.schema.ts                       # pagination, dateRange, sort, amount, rate
      transaction.schema.ts
      account.schema.ts
      budget.schema.ts
      debt.schema.ts
      investment.schema.ts
      goal.schema.ts
      family.schema.ts
      category.schema.ts
      tag.schema.ts
      recurring.schema.ts
    services/
      transaction.service.ts                 # CRUD + atomic balance side effects
      account.service.ts
      budget.service.ts                      # dedup + alert checks
      debt.service.ts                        # payment recording + amortization
      investment.service.ts
      goal.service.ts                        # contributeToGoal flow
      summary.service.ts                     # dashboard aggregation + health score
      family.service.ts
      category.service.ts
      notification.service.ts
      audit.service.ts                       # fire-and-forget logging
      tag.service.ts
      recurring.service.ts
    repositories/
      transaction.repo.ts
      account.repo.ts
      budget.repo.ts
      debt.repo.ts
      investment.repo.ts
      goal.repo.ts
      family.repo.ts
      category.repo.ts
      notification.repo.ts
      audit.repo.ts

  hooks/
    use-api.ts                               # Base fetch wrapper with error handling
    queries/
      use-transactions.ts
      use-accounts.ts
      use-budgets.ts
      use-summary.ts
      use-debts.ts
      use-investments.ts
      use-goals.ts
      use-family.ts
    mutations/
      use-add-transaction.ts
      use-update-transaction.ts
      use-delete-transaction.ts
      (... similar for other entities)

  providers/
    query-provider.tsx                       # TanStack QueryClientProvider
    auth-provider.tsx                        # NextAuth SessionProvider

  lib/
    auth.ts                                  # NEW: NextAuth v5 config
```

---

## 2. Middleware Chain

```
Request → withFamily() → requireRole() → validateBody/Query() → Service → Response
              |                |                  |
         session check    role hierarchy      Zod parse
         family lookup    OWNER>ADMIN>       type-safe input
         inject ctx       MEMBER>CHILD       auto error format
```

**Pattern:** Higher-order functions wrapping route handlers:

```typescript
// Route handler example
export const POST = withFamily(async (req, ctx) => {
  try {
    const roleCheck = requireRole('MEMBER')(ctx)
    if (roleCheck) return roleCheck
    const body = await validateBody(req, createTransactionSchema)
    const result = await TransactionService.create(ctx.familyId, ctx.userId, body)
    return created(result)
  } catch (error) {
    return handleApiError(error)
  }
})
```

---

## 3. Validation Schemas (Zod)

### Common (`common.schema.ts`)
- `paginationSchema`: page (min 1), limit (1-100, default 20)
- `dateRangeSchema`: from/to + refinement (from <= to)
- `sortSchema`: sortBy + sortOrder (asc/desc)
- `amountSchema`: positive number, max 18 digits
- `rateSchema`: 0-1 range

### Transaction (`transaction.schema.ts`)
- `createTransactionSchema`: sourceAccountId, type enum, amount, date, destAccountId?
  - **Refinement:** TRANSFER requires destAccountId
  - **Refinement:** source !== dest
- `updateTransactionSchema`: partial of create
- `listTransactionsSchema`: pagination + dateRange + type/accountId/categoryId/search/minAmount/maxAmount

### Account (`account.schema.ts`)
- **Refinement:** CREDIT_CARD requires creditLimit + statementDay

### Budget (`budget.schema.ts`)
- **Refinement:** periodStart < periodEnd
- alertThresholds: number[] default [50, 80, 100]

### Goal (`goal.schema.ts`)
- `contributeToGoalSchema`: amount (positive) + fromAccountId + notes?

### Debt (`debt.schema.ts`)
- `createDebtPaymentSchema`: paymentAmount = principalPortion + interestPortion

---

## 4. Service Layer — Atomic Side Effects

### TransactionService.create() — `prisma.$transaction()`:
1. Verify sourceAccount belongs to familyId
2. Create Transaction record
3. Update sourceAccount.balance (+income / -expense / -transfer)
4. Update destAccount.balance (TRANSFER only)
5. Create TransactionTag links
6. Check & trigger BudgetAlerts if EXPENSE

### TransactionService.update() — `prisma.$transaction()`:
1. Reverse OLD balance effects on source + dest accounts
2. Apply NEW balance effects
3. Update Transaction record

### TransactionService.delete() — `prisma.$transaction()`:
1. Reverse balance effects
2. Delete TransactionTag links
3. Delete Transaction record

### GoalService.contribute() — `prisma.$transaction()`:
1. Verify goal not completed + account has sufficient balance
2. Cap amount at remaining target
3. Create SavingsContribution
4. Increment goal.currentAmount
5. Decrement account.balance
6. Create TRANSFER Transaction with description "Dong gop muc tieu: {name}"
7. If goal completed → create Notification

### SummaryService.getDashboardSummary():
- 7 parallel Prisma queries: income, expense, accounts, debts, investments, budgets, budgetSpending
- Compute: totalAssets, totalLiabilities, netWorth, savingsRate, budgetCompliance
- Integrate existing `calculateHealthScore()` from `src/features/cashflow/health-score.ts`

### BudgetService.create():
- Dedup check: no existing budget for same categoryId + overlapping period
- Auto-create BudgetAlert records for thresholds [50, 80, 100]

---

## 5. API Endpoints

| Method | Path | Min Role | Side Effects |
|--------|------|----------|-------------|
| **Transactions** ||||
| GET | /api/v1/transactions | CHILD | — |
| POST | /api/v1/transactions | MEMBER | account.balance +/-, budget alert check |
| PATCH | /api/v1/transactions/:id | MEMBER | reverse old + apply new balances |
| DELETE | /api/v1/transactions/:id | MEMBER | reverse balances |
| **Accounts** ||||
| GET | /api/v1/accounts | CHILD | — |
| POST | /api/v1/accounts | ADMIN | — |
| PATCH | /api/v1/accounts/:id | ADMIN | — |
| DELETE | /api/v1/accounts/:id | OWNER | soft-delete (isActive=false) |
| **Budgets** ||||
| GET | /api/v1/budgets | MEMBER | computed "spent" from TX aggregate |
| POST | /api/v1/budgets | ADMIN | dedup check + create alerts |
| PATCH | /api/v1/budgets/:id | ADMIN | — |
| DELETE | /api/v1/budgets/:id | ADMIN | cascade delete alerts |
| **Debts** ||||
| GET/POST | /api/v1/debts | MEMBER/ADMIN | — |
| POST | /api/v1/debts/:id/payments | MEMBER | debt.balance -= principal, account.balance -= payment |
| GET | /api/v1/debts/:id/amortization | MEMBER | computed via `calculateAmortization()` |
| **Investments** ||||
| GET/POST | /api/v1/investments | MEMBER/ADMIN | — |
| POST | /api/v1/investments/:id/valuations | MEMBER | update investment.currentValue |
| **Goals** ||||
| GET/POST | /api/v1/goals | MEMBER | — |
| POST | /api/v1/goals/:id/contribute | MEMBER | goal += amount, account -= amount, create TX |
| **Summary** ||||
| GET | /api/v1/summary | MEMBER | computed from 7 parallel queries |
| GET | /api/v1/summary/health-score | MEMBER | uses existing health-score.ts |
| **Family** ||||
| POST | /api/v1/family | Auth | create family + owner membership |
| POST | /api/v1/family/members | ADMIN | invite via email |
| PATCH | /api/v1/family/members/:id | OWNER | change role |
| **Categories/Tags** ||||
| GET | /api/v1/categories | CHILD | system + custom |
| POST | /api/v1/categories | ADMIN | custom only |

---

## 6. Auth Setup

**File: `src/lib/auth.ts`**
- NextAuth v5 with PrismaAdapter
- Google OAuth provider
- JWT session strategy
- Callbacks: inject user.id into JWT + session

**File: `src/app/api/v1/auth/[...nextauth]/route.ts`**
- Export `{ GET, POST }` from handlers

---

## 7. FE Migration: Zustand → TanStack Query

**Keep in Zustand (UI state):** activeMonth, sidebarCollapsed, blurSensitive, modal states, form drafts.

**Move to server:** transactions, accounts, budgets, debts, investments, goals, categories, summary.

**Per page migration:**
```
useAppStore(s => s.transactions)  →  useTransactions()
store.addTransaction()            →  useAddTransaction().mutate()
store.getSummary()                →  useSummary()
```

**Invalidation pattern:** on mutation success, invalidate related queries:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['transactions'] })
  queryClient.invalidateQueries({ queryKey: ['accounts'] })
  queryClient.invalidateQueries({ queryKey: ['summary'] })
  queryClient.invalidateQueries({ queryKey: ['budgets'] })
}
```

---

## 8. Implementation Phases

### Phase A: Foundation (2-3 days)
- [ ] `src/lib/auth.ts` — NextAuth v5 + Google OAuth + PrismaAdapter
- [ ] `src/server/errors/app-error.ts`
- [ ] `src/server/types/api.types.ts`
- [ ] `src/server/middleware/` — with-auth, with-family, with-role, with-validation
- [ ] `src/server/validators/common.schema.ts`
- [ ] `src/providers/query-provider.tsx` + `auth-provider.tsx`
- [ ] `src/hooks/use-api.ts`
- [ ] Update `src/lib/api/response.ts` to handle AppError

### Phase B: Core CRUD (4-5 days)
- [ ] Transaction: validator → service → routes → hooks
- [ ] Account: validator → service → routes → hooks
- [ ] Category + Tag: validators → services → routes
- [ ] Summary: service → route → hook

### Phase C: Complex Flows (3-4 days)
- [ ] Budget: service + alert logic
- [ ] Goal: service + contributeToGoal
- [ ] Debt: service + payment + amortization integration
- [ ] Investment: service + valuation

### Phase D: Family + Support (2-3 days)
- [ ] Family: create/invite/manage
- [ ] Notifications: CRUD + read status
- [ ] Audit logging
- [ ] Recurring transactions

### Phase E: FE Migration (3-5 days)
- [ ] Wrap layout with providers (QueryProvider + AuthProvider)
- [ ] Migrate pages: Dashboard → Transactions → Accounts → Budget → Wealth
- [ ] Strip Zustand to UI-only
- [ ] Remove mock-data.ts

---

## 9. Critical Files

**Reuse existing:**
- `src/lib/api/response.ts` — extend handleApiError for AppError
- `src/lib/prisma.ts` — keep as-is
- `src/features/cashflow/health-score.ts` → SummaryService
- `src/features/debt/amortization.ts` → DebtService
- `prisma/schema.prisma` → run `prisma migrate dev`

**Create new:** ~70 files across `src/server/`, `src/hooks/`, `src/providers/`, `src/app/api/v1/`

---

## 10. Verification

1. **DB:** `npx prisma migrate dev --name init` → seed data
2. **Auth:** Login with Google → session created → API returns user data
3. **CRUD:** POST /api/v1/transactions → account balance updated → GET /api/v1/summary reflects change
4. **Atomic:** POST transaction + kill mid-request → no partial state
5. **RBAC:** CHILD cannot POST /api/v1/accounts → 403
6. **Validation:** POST with amount=-1 → 422 with Zod error details
7. **E2E:** Browser: create transaction → verify balance → reload → data from DB
