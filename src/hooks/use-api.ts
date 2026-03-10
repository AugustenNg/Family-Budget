// =============================================================================
// CFO Family Finance App — Base API Fetch Wrapper
// Type-safe fetcher for use with TanStack Query
// =============================================================================

import { type ApiResponse } from '@/lib/api/response'

const BASE_URL = '/api/v1'

export class ApiError extends Error {
    public readonly code: string
    public readonly status: number
    public readonly details?: unknown

    constructor(code: string, message: string, status: number, details?: unknown) {
        super(message)
        this.name = 'ApiError'
        this.code = code
        this.status = status
        this.details = details
    }
}

// ---- Core fetcher ----

async function apiFetch<T>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const url = path.startsWith('/') ? `${BASE_URL}${path}` : `${BASE_URL}/${path}`

    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    })

    // Handle 204 No Content
    if (res.status === 204) {
        return undefined as T
    }

    const json = (await res.json()) as ApiResponse<T>

    if (!json.success) {
        throw new ApiError(
            json.error.code,
            json.error.message,
            res.status,
            json.error.details,
        )
    }

    return json.data
}

// ---- Convenience methods ----

export const api = {
    get<T>(path: string): Promise<T> {
        return apiFetch<T>(path, { method: 'GET' })
    },

    post<T>(path: string, body?: unknown): Promise<T> {
        return apiFetch<T>(path, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        })
    },

    patch<T>(path: string, body?: unknown): Promise<T> {
        return apiFetch<T>(path, {
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        })
    },

    delete<T>(path: string): Promise<T> {
        return apiFetch<T>(path, { method: 'DELETE' })
    },
}
