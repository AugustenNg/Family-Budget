// =============================================================================
// CFO Family Finance App — Notifications API Routes
// =============================================================================

import { withFamily } from '@/server/middleware/with-family'
import { NotificationService } from '@/server/services/notification.service'
import { ok, handleApiError } from '@/lib/api/response'

export const GET = withFamily(async (req, ctx) => {
    try {
        const url = new URL(req.url)
        const unreadOnly = url.searchParams.get('unread') === 'true'
        const result = await NotificationService.list(ctx.familyId, ctx.userId, unreadOnly)
        return ok(result)
    } catch (error) {
        return handleApiError(error)
    }
})

// POST /api/v1/notifications — Mark all as read
export const POST = withFamily(async (_req, ctx) => {
    try {
        await NotificationService.markAllAsRead(ctx.familyId, ctx.userId)
        return ok({ success: true })
    } catch (error) {
        return handleApiError(error)
    }
})
