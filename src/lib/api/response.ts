// =============================================================================
// CFO Family Finance App — Standardized API Response Format
// =============================================================================

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export interface ApiSuccess<T> {
  success: true
  data: T
  meta?: {
    page?: number
    limit?: number
    total?: number
    hasMore?: boolean
  }
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// -----------------------------------------------------------------------------
// Success Responses
// -----------------------------------------------------------------------------

export function ok<T>(data: T, meta?: ApiSuccess<T>['meta']): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data, meta }, { status: 200 })
}

export function created<T>(data: T): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status: 201 })
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

// -----------------------------------------------------------------------------
// Error Responses
// -----------------------------------------------------------------------------

export function badRequest(message: string, details?: unknown): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error: { code: 'BAD_REQUEST', message, details } },
    { status: 400 }
  )
}

export function unauthorized(message = 'Bạn cần đăng nhập để thực hiện hành động này'): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error: { code: 'UNAUTHORIZED', message } },
    { status: 401 }
  )
}

export function forbidden(message = 'Bạn không có quyền thực hiện hành động này'): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error: { code: 'FORBIDDEN', message } },
    { status: 403 }
  )
}

export function notFound(resource = 'Dữ liệu'): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error: { code: 'NOT_FOUND', message: `${resource} không tìm thấy` } },
    { status: 404 }
  )
}

export function conflict(message: string): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error: { code: 'CONFLICT', message } },
    { status: 409 }
  )
}

export function unprocessable(message: string, details?: unknown): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error: { code: 'UNPROCESSABLE_ENTITY', message, details } },
    { status: 422 }
  )
}

export function tooManyRequests(): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' } },
    { status: 429 }
  )
}

export function serverError(error?: unknown): NextResponse<ApiError> {
  console.error('[API Error]', error)
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Đã có lỗi xảy ra. Vui lòng thử lại.' } },
    { status: 500 }
  )
}

// -----------------------------------------------------------------------------
// Error Handler (dùng trong catch block)
// -----------------------------------------------------------------------------

export function handleApiError(error: unknown): NextResponse<ApiError> {
  if (error instanceof ZodError) {
    return unprocessable('Dữ liệu không hợp lệ', error.flatten())
  }

  if (error instanceof Error) {
    // Prisma unique constraint violation
    if (error.message.includes('Unique constraint')) {
      return conflict('Dữ liệu đã tồn tại trong hệ thống')
    }
    // Prisma not found
    if (error.message.includes('Record to update not found')) {
      return notFound()
    }
  }

  return serverError(error)
}
