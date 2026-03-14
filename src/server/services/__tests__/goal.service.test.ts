import { GoalService } from '../goal.service'
import { prisma } from '@/lib/prisma'
import { AppError } from '@/server/errors/app-error'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('GoalService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('contribute', () => {
    it('contributes to goal and decrements account balance', async () => {
      const mockTxCtx = {
        savingsGoal: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'goal-1',
            familyId: 'fam-1',
            name: 'Japan Trip',
            targetAmount: 80000000,
            currentAmount: 30000000,
            isCompleted: false,
          }),
          update: jest.fn().mockResolvedValue({}),
        },
        financialAccount: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'acc-1',
            familyId: 'fam-1',
            balance: 50000000,
          }),
          update: jest.fn().mockResolvedValue({}),
        },
        savingsContribution: {
          create: jest.fn().mockResolvedValue({ id: 'contrib-1' }),
        },
        transaction: {
          create: jest.fn().mockResolvedValue({}),
        },
        notification: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(mockTxCtx))

      const result = await GoalService.contribute('goal-1', 'fam-1', 'user-1', {
        amount: 5000000,
        fromAccountId: 'acc-1',
      })

      expect(result.actualAmount).toBe(5000000)
      expect(result.isCompleted).toBe(false)
      expect(mockTxCtx.financialAccount.update).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { balance: { decrement: 5000000 } },
      })
    })

    it('caps contribution at remaining target', async () => {
      const mockTxCtx = {
        savingsGoal: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'goal-1',
            familyId: 'fam-1',
            name: 'Goal',
            targetAmount: 10000000,
            currentAmount: 8000000,
            isCompleted: false,
          }),
          update: jest.fn().mockResolvedValue({}),
        },
        financialAccount: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'acc-1',
            familyId: 'fam-1',
            balance: 50000000,
          }),
          update: jest.fn().mockResolvedValue({}),
        },
        savingsContribution: {
          create: jest.fn().mockResolvedValue({ id: 'contrib-1' }),
        },
        transaction: {
          create: jest.fn().mockResolvedValue({}),
        },
        notification: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(mockTxCtx))

      const result = await GoalService.contribute('goal-1', 'fam-1', 'user-1', {
        amount: 5000000, // More than remaining 2M
        fromAccountId: 'acc-1',
      })

      expect(result.actualAmount).toBe(2000000) // Capped
      expect(result.isCompleted).toBe(true) // Goal completed
    })

    it('creates notification on goal completion', async () => {
      const mockTxCtx = {
        savingsGoal: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'goal-1',
            familyId: 'fam-1',
            name: 'Goal',
            targetAmount: 10000000,
            currentAmount: 9500000,
            isCompleted: false,
          }),
          update: jest.fn().mockResolvedValue({}),
        },
        financialAccount: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'acc-1',
            familyId: 'fam-1',
            balance: 50000000,
          }),
          update: jest.fn().mockResolvedValue({}),
        },
        savingsContribution: {
          create: jest.fn().mockResolvedValue({ id: 'c-1' }),
        },
        transaction: {
          create: jest.fn().mockResolvedValue({}),
        },
        notification: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(mockTxCtx))

      await GoalService.contribute('goal-1', 'fam-1', 'user-1', {
        amount: 500000,
        fromAccountId: 'acc-1',
      })

      expect(mockTxCtx.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'SAVINGS_GOAL_REACHED',
        }),
      })
    })

    it('throws error when goal is already completed', async () => {
      const mockTxCtx = {
        savingsGoal: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'goal-1',
            isCompleted: true,
          }),
        },
        financialAccount: { findFirst: jest.fn() },
      };

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(mockTxCtx))

      await expect(
        GoalService.contribute('goal-1', 'fam-1', 'user-1', {
          amount: 1000,
          fromAccountId: 'acc-1',
        }),
      ).rejects.toThrow(AppError)
    })

    it('throws error when account balance insufficient', async () => {
      const mockTxCtx = {
        savingsGoal: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'goal-1',
            targetAmount: 10000000,
            currentAmount: 0,
            isCompleted: false,
          }),
        },
        financialAccount: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'acc-1',
            familyId: 'fam-1',
            balance: 500, // Insufficient
          }),
        },
      };

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(mockTxCtx))

      await expect(
        GoalService.contribute('goal-1', 'fam-1', 'user-1', {
          amount: 1000,
          fromAccountId: 'acc-1',
        }),
      ).rejects.toThrow(AppError)
    })
  })
})
