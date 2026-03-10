// =============================================================================
// CFO Family Finance App — Audit Service
// Fire-and-forget logging for important actions
// =============================================================================

import { prisma } from '@/lib/prisma'

export class AuditService {
    /**
     * Fire-and-forget: log an action without blocking the response.
     * Errors are silently caught to prevent audit failures from breaking user flows.
     */
    static log(params: {
        familyId: string
        userId: string
        action: string
        entityType: string
        entityId: string
        details?: Record<string, unknown>
    }) {
        // Do not await — fire and forget
        prisma.auditLog
            .create({
                data: {
                    familyId: params.familyId,
                    userId: params.userId,
                    action: params.action,
                    entityType: params.entityType,
                    entityId: params.entityId,
                    details: params.details ?? {},
                    ipAddress: null,
                    userAgent: null,
                },
            })
            .catch((err) => {
                console.error('[AuditService] Failed to log:', err)
            })
    }
}
