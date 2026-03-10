// =============================================================================
// CFO Family Finance App — Application Error Class
// =============================================================================

export type ErrorCode =
    | 'BAD_REQUEST'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'UNPROCESSABLE_ENTITY'
    | 'TOO_MANY_REQUESTS'
    | 'INTERNAL_SERVER_ERROR'

const STATUS_MAP: Record<ErrorCode, number> = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
}

export class AppError extends Error {
    public readonly code: ErrorCode
    public readonly statusCode: number
    public readonly details?: unknown

    constructor(code: ErrorCode, message: string, details?: unknown) {
        super(message)
        this.name = 'AppError'
        this.code = code
        this.statusCode = STATUS_MAP[code]
        this.details = details
    }

    // ---- Static Factories ----

    static badRequest(message: string, details?: unknown) {
        return new AppError('BAD_REQUEST', message, details)
    }

    static unauthorized(message = 'Bạn cần đăng nhập để thực hiện hành động này') {
        return new AppError('UNAUTHORIZED', message)
    }

    static forbidden(message = 'Bạn không có quyền thực hiện hành động này') {
        return new AppError('FORBIDDEN', message)
    }

    static notFound(resource = 'Dữ liệu') {
        return new AppError('NOT_FOUND', `${resource} không tìm thấy`)
    }

    static conflict(message: string) {
        return new AppError('CONFLICT', message)
    }

    static unprocessable(message: string, details?: unknown) {
        return new AppError('UNPROCESSABLE_ENTITY', message, details)
    }

    static internal(message = 'Đã có lỗi xảy ra. Vui lòng thử lại.') {
        return new AppError('INTERNAL_SERVER_ERROR', message)
    }
}
