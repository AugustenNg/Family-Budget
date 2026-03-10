// =============================================================================
// CFO Family Finance App — Family Service
// Create, invite, manage family members
// =============================================================================

import { prisma } from '@/lib/prisma'
import { AppError } from '@/server/errors/app-error'
import { type FamilyRole } from '@prisma/client'

export class FamilyService {
    /**
     * Create a new family — the creator becomes OWNER
     */
    static async create(userId: string, name: string) {
        return prisma.$transaction(async (tx) => {
            const family = await tx.family.create({
                data: { name },
            })

            await tx.familyMember.create({
                data: {
                    familyId: family.id,
                    userId,
                    role: 'OWNER',
                    status: 'ACTIVE',
                    joinedAt: new Date(),
                },
            })

            return family
        })
    }

    /**
     * Invite a member by email
     */
    static async inviteMember(familyId: string, email: string, role: FamilyRole = 'MEMBER') {
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) throw AppError.notFound('Người dùng với email này')

        // Check if already a member
        const existing = await prisma.familyMember.findUnique({
            where: { familyId_userId: { familyId, userId: user.id } },
        })
        if (existing) throw AppError.conflict('Người dùng này đã là thành viên gia đình')

        return prisma.familyMember.create({
            data: {
                familyId,
                userId: user.id,
                role,
                status: 'INVITED',
            },
        })
    }

    /**
     * Get all members of a family
     */
    static async getMembers(familyId: string) {
        return prisma.familyMember.findMany({
            where: { familyId },
            include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            },
            orderBy: { invitedAt: 'asc' },
        })
    }

    /**
     * Change a member's role (OWNER only)
     */
    static async updateMemberRole(memberId: string, familyId: string, role: FamilyRole) {
        const member = await prisma.familyMember.findFirst({
            where: { id: memberId, familyId },
        })
        if (!member) throw AppError.notFound('Thành viên')

        // Cannot change OWNER role
        if (member.role === 'OWNER') {
            throw AppError.forbidden('Không thể thay đổi quyền của chủ gia đình')
        }

        return prisma.familyMember.update({
            where: { id: memberId },
            data: { role },
        })
    }

    /**
     * Remove a member
     */
    static async removeMember(memberId: string, familyId: string) {
        const member = await prisma.familyMember.findFirst({
            where: { id: memberId, familyId },
        })
        if (!member) throw AppError.notFound('Thành viên')
        if (member.role === 'OWNER') {
            throw AppError.forbidden('Không thể xóa chủ gia đình')
        }

        return prisma.familyMember.delete({ where: { id: memberId } })
    }
}
