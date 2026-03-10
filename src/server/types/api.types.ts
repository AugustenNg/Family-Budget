// =============================================================================
// CFO Family Finance App — API Type Definitions
// =============================================================================

import { type FamilyRole } from '@prisma/client'
import { type NextRequest, type NextResponse } from 'next/server'

// ---- Context types injected by middleware ----

export interface AuthContext {
    userId: string
}

export interface FamilyContext extends AuthContext {
    familyId: string
    role: FamilyRole
}

// ---- Route handler signatures ----

/** Route handler that requires authentication only */
export type AuthRouteHandler = (
    req: NextRequest,
    ctx: AuthContext,
) => Promise<NextResponse>

/** Route handler that requires family membership */
export type FamilyRouteHandler = (
    req: NextRequest,
    ctx: FamilyContext,
) => Promise<NextResponse>

// ---- Route params helper ----

export interface RouteParams {
    params: Promise<{ id: string }>
}

// ---- Pagination ----

export interface PaginationInput {
    page: number
    limit: number
}

export interface PaginationMeta {
    page: number
    limit: number
    total: number
    hasMore: boolean
}

// ---- Date range ----

export interface DateRangeInput {
    from?: Date
    to?: Date
}

// ---- Sort ----

export interface SortInput {
    sortBy: string
    sortOrder: 'asc' | 'desc'
}
