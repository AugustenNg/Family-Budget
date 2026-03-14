import { TransactionService } from '../transaction.service'
import { prisma } from '@/lib/prisma'
import { AppError } from '@/server/errors/app-error'

// Access mocked prisma
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('TransactionService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('creates EXPENSE transaction and decrements source balance', async () => {
      const mockTxCtx = {
        financialAccount: {
          findFirst: jest.fn()
            .mockResolvedValueOnce({ id: 'acc-1', familyId: 'fam-1', balance: 1000000 }),
          update: jest.fn().mockResolvedValue({}),
        },
        transaction: {
          create: jest.fn().mockResolvedValue({
            id: 'tx-1',
            sourceAccountId: 'acc-1',
            type: 'EXPENSE',
            amount: 50000,
          }),
        },
        transactionTag: {
          createMany: jest.fn(),
        },
      };

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(mockTxCtx))

      const result = await TransactionService.create('fam-1', 'user-1', {
        sourceAccountId: 'acc-1',
        type: 'EXPENSE',
        amount: 50000,
        date: new Date('2024-06-15'),
        isPending: false,
        isExcluded: false,
      })

      expect(result.id).toBe('tx-1')
      expect(mockTxCtx.financialAccount.findFirst).toHaveBeenCalledWith({
        where: { id: 'acc-1', familyId: 'fam-1' },
      })
      expect(mockTxCtx.financialAccount.update).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { balance: { increment: -50000 } },
      })
    })

    it('creates INCOME transaction and increments source balance', async () => {
      const mockTxCtx = {
        financialAccount: {
          findFirst: jest.fn()
            .mockResolvedValueOnce({ id: 'acc-1', familyId: 'fam-1' }),
          update: jest.fn().mockResolvedValue({}),
        },
        transaction: {
          create: jest.fn().mockResolvedValue({
            id: 'tx-2',
            type: 'INCOME',
            amount: 25000000,
          }),
        },
        transactionTag: { createMany: jest.fn() },
      };

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(mockTxCtx))

      await TransactionService.create('fam-1', 'user-1', {
        sourceAccountId: 'acc-1',
        type: 'INCOME',
        amount: 25000000,
        date: new Date(),
        isPending: false,
        isExcluded: false,
      })

      expect(mockTxCtx.financialAccount.update).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { balance: { increment: 25000000 } },
      })
    })

    it('creates TRANSFER and updates both accounts', async () => {
      const mockTxCtx = {
        financialAccount: {
          findFirst: jest.fn()
            .mockResolvedValueOnce({ id: 'acc-1', familyId: 'fam-1' })
            .mockResolvedValueOnce({ id: 'acc-2', familyId: 'fam-1' }),
          update: jest.fn().mockResolvedValue({}),
        },
        transaction: {
          create: jest.fn().mockResolvedValue({ id: 'tx-3', type: 'TRANSFER', amount: 1000000 }),
        },
        transactionTag: { createMany: jest.fn() },
      };

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(mockTxCtx))

      await TransactionService.create('fam-1', 'user-1', {
        sourceAccountId: 'acc-1',
        type: 'TRANSFER',
        amount: 1000000,
        destAccountId: 'acc-2',
        date: new Date(),
        isPending: false,
        isExcluded: false,
      })

      // Source account decremented
      expect(mockTxCtx.financialAccount.update).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { balance: { increment: -1000000 } },
      })
      // Dest account incremented
      expect(mockTxCtx.financialAccount.update).toHaveBeenCalledWith({
        where: { id: 'acc-2' },
        data: { balance: { increment: 1000000 } },
      })
    })

    it('throws NotFound when source account not in family', async () => {
      const mockTxCtx = {
        financialAccount: {
          findFirst: jest.fn().mockResolvedValue(null),
          update: jest.fn(),
        },
        transaction: { create: jest.fn() },
        transactionTag: { createMany: jest.fn() },
      };

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(mockTxCtx))

      await expect(
        TransactionService.create('fam-1', 'user-1', {
          sourceAccountId: 'nonexistent',
          type: 'EXPENSE',
          amount: 100,
          date: new Date(),
          isPending: false,
          isExcluded: false,
        }),
      ).rejects.toThrow(AppError)
    })

    it('links tags when provided', async () => {
      const mockTxCtx = {
        financialAccount: {
          findFirst: jest.fn().mockResolvedValue({ id: 'acc-1', familyId: 'fam-1' }),
          update: jest.fn().mockResolvedValue({}),
        },
        transaction: {
          create: jest.fn().mockResolvedValue({ id: 'tx-4' }),
        },
        transactionTag: {
          createMany: jest.fn().mockResolvedValue({}),
        },
      };

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(mockTxCtx))

      await TransactionService.create('fam-1', 'user-1', {
        sourceAccountId: 'acc-1',
        type: 'EXPENSE',
        amount: 50000,
        date: new Date(),
        tagIds: ['tag-1', 'tag-2'],
        isPending: false,
        isExcluded: false,
      })

      expect(mockTxCtx.transactionTag.createMany).toHaveBeenCalledWith({
        data: [
          { transactionId: 'tx-4', tagId: 'tag-1' },
          { transactionId: 'tx-4', tagId: 'tag-2' },
        ],
      })
    })
  })

  describe('getById', () => {
    it('throws NotFound when transaction does not exist', async () => {
      // Mock the TransactionRepo.findById
      jest.spyOn(require('@/server/repositories/transaction.repo').TransactionRepo, 'findById')
        .mockResolvedValue(null)

      await expect(
        TransactionService.getById('nonexistent', 'fam-1'),
      ).rejects.toThrow(AppError)
    })
  })
})
