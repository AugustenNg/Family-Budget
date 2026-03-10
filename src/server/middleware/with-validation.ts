// =============================================================================
// CFO Family Finance App — Validation Middleware
// Zod-based body & query string validation
// =============================================================================

import { type NextRequest } from 'next/server'
import { type ZodSchema, ZodError } from 'zod'
import { AppError } from '@/server/errors/app-error'

/**
 * Parse and validate request JSON body against a Zod schema.
 * Throws AppError(UNPROCESSABLE_ENTITY) with flattened Zod error details on failure.
 *
 * Usage:
 * ```ts
 * const body = await validateBody(req, createTransactionSchema)
 * // body is fully typed
 * ```
 */
export async function validateBody<T>(
    req: NextRequest,
    schema: ZodSchema<T>,
): Promise<T> {
    let raw: unknown
    try {
        raw = await req.json()
    } catch {
        throw AppError.badRequest('Request body không hợp lệ hoặc trống')
    }

    try {
        return schema.parse(raw)
    } catch (error) {
        if (error instanceof ZodError) {
            throw AppError.unprocessable('Dữ liệu không hợp lệ', error.flatten())
        }
        throw error
    }
}

/**
 * Parse and validate URL search params against a Zod schema.
 * Converts URLSearchParams to a plain object before parsing.
 *
 * Usage:
 * ```ts
 * const query = validateQuery(req, listTransactionsSchema)
 * ```
 */
export function validateQuery<T>(
    req: NextRequest,
    schema: ZodSchema<T>,
): T {
    const url = new URL(req.url)
    const raw: Record<string, string> = {}
    url.searchParams.forEach((value, key) => {
        raw[key] = value
    })

    try {
        return schema.parse(raw)
    } catch (error) {
        if (error instanceof ZodError) {
            throw AppError.unprocessable('Query params không hợp lệ', error.flatten())
        }
        throw error
    }
}
