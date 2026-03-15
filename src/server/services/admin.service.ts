// =============================================================================
// CFO Family Finance App — Admin Service
// User CRUD, role management, system administration
// =============================================================================

import { prisma } from '@/lib/prisma'
import { AppError } from '@/server/errors/app-error'
import bcrypt from 'bcryptjs'
import type { FamilyRole } from '@prisma/client'

const SALT_ROUNDS = 12

export class AdminService {
  /**
   * List all users with their family memberships
   */
  static async listUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        phone: true,
        isSystemAdmin: true,
        createdAt: true,
        updatedAt: true,
        passwordHash: false,
        familyMemberships: {
          select: {
            id: true,
            role: true,
            status: true,
            family: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get single user details
   */
  static async getUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        phone: true,
        locale: true,
        timezone: true,
        currency: true,
        isSystemAdmin: true,
        createdAt: true,
        updatedAt: true,
        passwordHash: false,
        familyMemberships: {
          select: {
            id: true,
            role: true,
            status: true,
            canAddTransaction: true,
            canViewReports: true,
            invitedAt: true,
            joinedAt: true,
            family: { select: { id: true, name: true } },
          },
        },
      },
    })
    if (!user) throw AppError.notFound('User')
    return user
  }

  /**
   * Create a new user with email/password
   */
  static async createUser(input: {
    email: string
    password: string
    name: string
    phone?: string
    isSystemAdmin?: boolean
  }) {
    // Check duplicate
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    })
    if (existing) throw AppError.conflict('Email da ton tai')

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)

    return prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        phone: input.phone,
        isSystemAdmin: input.isSystemAdmin ?? false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isSystemAdmin: true,
        createdAt: true,
      },
    })
  }

  /**
   * Update user info
   */
  static async updateUser(
    userId: string,
    input: {
      name?: string
      email?: string
      phone?: string
      isSystemAdmin?: boolean
    },
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw AppError.notFound('User')

    // Check email conflict
    if (input.email && input.email !== user.email) {
      const existing = await prisma.user.findUnique({
        where: { email: input.email },
      })
      if (existing) throw AppError.conflict('Email da ton tai')
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.email && { email: input.email }),
        ...(input.phone !== undefined && { phone: input.phone || null }),
        ...(input.isSystemAdmin !== undefined && { isSystemAdmin: input.isSystemAdmin }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isSystemAdmin: true,
        updatedAt: true,
      },
    })
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw AppError.notFound('User')

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    })

    return { success: true }
  }

  /**
   * Delete user and all related data
   */
  static async deleteUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw AppError.notFound('User')
    if (user.isSystemAdmin) throw AppError.forbidden('Khong the xoa system admin')

    await prisma.user.delete({ where: { id: userId } })
    return { deleted: true }
  }

  /**
   * Assign user to a family with a role
   */
  static async assignToFamily(
    userId: string,
    familyId: string,
    role: FamilyRole,
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw AppError.notFound('User')

    const family = await prisma.family.findUnique({ where: { id: familyId } })
    if (!family) throw AppError.notFound('Family')

    // Upsert membership
    return prisma.familyMember.upsert({
      where: { familyId_userId: { familyId, userId } },
      create: {
        familyId,
        userId,
        role,
        status: 'ACTIVE',
        joinedAt: new Date(),
      },
      update: {
        role,
        status: 'ACTIVE',
      },
    })
  }

  /**
   * Remove user from family
   */
  static async removeFromFamily(userId: string, familyId: string) {
    await prisma.familyMember.delete({
      where: { familyId_userId: { familyId, userId } },
    })
    return { removed: true }
  }

  /**
   * List all families
   */
  static async listFamilies() {
    return prisma.family.findMany({
      select: {
        id: true,
        name: true,
        currency: true,
        createdAt: true,
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Create a family and optionally assign an owner
   */
  static async createFamily(name: string, ownerUserId?: string) {
    return prisma.$transaction(async (tx) => {
      const family = await tx.family.create({
        data: { name },
      })

      if (ownerUserId) {
        await tx.familyMember.create({
          data: {
            familyId: family.id,
            userId: ownerUserId,
            role: 'OWNER',
            status: 'ACTIVE',
            joinedAt: new Date(),
          },
        })
      }

      return family
    })
  }

  /**
   * Get system stats
   */
  static async getStats() {
    const [users, families, transactions, accounts] = await Promise.all([
      prisma.user.count(),
      prisma.family.count(),
      prisma.transaction.count(),
      prisma.financialAccount.count(),
    ])
    return { users, families, transactions, accounts }
  }
}
