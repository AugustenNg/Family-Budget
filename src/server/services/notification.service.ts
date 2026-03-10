// =============================================================================
// CFO Family Finance App — Notification Service
// =============================================================================

import { prisma } from '@/lib/prisma'

export class NotificationService {
    static async list(familyId: string, userId: string, unreadOnly = false) {
        return prisma.notification.findMany({
            where: {
                familyId,
                userId,
                ...(unreadOnly && { isRead: false }),
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        })
    }

    static async markAsRead(id: string, userId: string) {
        return prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true, readAt: new Date() },
        })
    }

    static async markAllAsRead(familyId: string, userId: string) {
        return prisma.notification.updateMany({
            where: { familyId, userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        })
    }

    static async getUnreadCount(familyId: string, userId: string) {
        return prisma.notification.count({
            where: { familyId, userId, isRead: false },
        })
    }
}
