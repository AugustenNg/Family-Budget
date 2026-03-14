import { BudgetService } from '../budget.service'
import { prisma } from '@/lib/prisma'
import { AppError } from '@/server/errors/app-error'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('BudgetService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('creates budget with auto-generated alerts', async () => {
      ;(mockPrisma.budget.findFirst as jest.Mock).mockResolvedValue(null) // no duplicate

      const mockTxCtx = {
        budget: {
          create: jest.fn().mockResolvedValue({ id: 'budget-1', categoryId: 'cat-1' }),
        },
        budgetAlert: {
          createMany: jest.fn().mockResolvedValue({}),
        },
      };

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(mockTxCtx))

      const result = await BudgetService.create('fam-1', {
        categoryId: 'cat-1',
        amount: 5000000,
        currency: 'VND',
        periodStart: new Date('2024-06-01'),
        periodEnd: new Date('2024-06-30'),
        rollover: false,
        alertThresholds: [50, 80, 100],
      })

      expect(result.id).toBe('budget-1')
      expect(mockTxCtx.budgetAlert.createMany).toHaveBeenCalledWith({
        data: [
          { budgetId: 'budget-1', thresholdPercent: 50 },
          { budgetId: 'budget-1', thresholdPercent: 80 },
          { budgetId: 'budget-1', thresholdPercent: 100 },
        ],
      })
    })

    it('uses custom alert thresholds', async () => {
      ;(mockPrisma.budget.findFirst as jest.Mock).mockResolvedValue(null)

      const mockTxCtx = {
        budget: {
          create: jest.fn().mockResolvedValue({ id: 'budget-2' }),
        },
        budgetAlert: {
          createMany: jest.fn().mockResolvedValue({}),
        },
      };

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(mockTxCtx))

      await BudgetService.create('fam-1', {
        categoryId: 'cat-1',
        amount: 3000000,
        currency: 'VND',
        periodStart: new Date('2024-06-01'),
        periodEnd: new Date('2024-06-30'),
        rollover: false,
        alertThresholds: [75, 90],
      })

      expect(mockTxCtx.budgetAlert.createMany).toHaveBeenCalledWith({
        data: [
          { budgetId: 'budget-2', thresholdPercent: 75 },
          { budgetId: 'budget-2', thresholdPercent: 90 },
        ],
      })
    })

    it('throws Conflict for duplicate budget', async () => {
      ;(mockPrisma.budget.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-budget',
        categoryId: 'cat-1',
      })

      await expect(
        BudgetService.create('fam-1', {
          categoryId: 'cat-1',
          amount: 5000000,
          currency: 'VND',
          periodStart: new Date('2024-06-01'),
          periodEnd: new Date('2024-06-30'),
          rollover: false,
          alertThresholds: [50, 80, 100],
        }),
      ).rejects.toThrow(AppError)
    })
  })

  describe('delete', () => {
    it('throws NotFound when budget does not exist', async () => {
      ;(mockPrisma.budget.findFirst as jest.Mock).mockResolvedValue(null)
      await expect(BudgetService.delete('nonexistent', 'fam-1')).rejects.toThrow(AppError)
    })

    it('deletes existing budget', async () => {
      ;(mockPrisma.budget.findFirst as jest.Mock).mockResolvedValue({ id: 'b-1' })
      ;(mockPrisma.budget.delete as jest.Mock).mockResolvedValue({})

      const result = await BudgetService.delete('b-1', 'fam-1')
      expect(result).toEqual({ deleted: true })
    })
  })
})
