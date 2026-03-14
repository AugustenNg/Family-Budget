import { AccountService } from '../account.service'
import { prisma } from '@/lib/prisma'
import { AppError } from '@/server/errors/app-error'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

// Mock the repository
jest.mock('@/server/repositories/account.repo', () => ({
  AccountRepo: {
    findMany: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  },
}))

const { AccountRepo } = require('@/server/repositories/account.repo')

describe('AccountService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('list', () => {
    it('calls repo with correct params', async () => {
      AccountRepo.findMany.mockResolvedValue([])
      await AccountService.list('fam-1')
      expect(AccountRepo.findMany).toHaveBeenCalledWith('fam-1', false)
    })

    it('passes includeInactive flag', async () => {
      AccountRepo.findMany.mockResolvedValue([])
      await AccountService.list('fam-1', true)
      expect(AccountRepo.findMany).toHaveBeenCalledWith('fam-1', true)
    })
  })

  describe('getById', () => {
    it('returns account when found', async () => {
      const mockAccount = { id: 'acc-1', name: 'VCB', familyId: 'fam-1' }
      AccountRepo.findById.mockResolvedValue(mockAccount)

      const result = await AccountService.getById('acc-1', 'fam-1')
      expect(result).toEqual(mockAccount)
    })

    it('throws NotFound when not found', async () => {
      AccountRepo.findById.mockResolvedValue(null)
      await expect(AccountService.getById('nonexistent', 'fam-1')).rejects.toThrow(AppError)
    })
  })

  describe('create', () => {
    it('creates account with correct data', async () => {
      const input = {
        name: 'New Account',
        type: 'BANK_ACCOUNT' as const,
        currency: 'VND',
        balance: 1000000,
        color: '#3B82F6',
        sortOrder: 0,
        gracePeriodDays: 0,
        includeInTotal: true,
        isShared: false,
      }

      ;(mockPrisma.financialAccount.create as jest.Mock).mockResolvedValue({
        id: 'acc-new',
        ...input,
        familyId: 'fam-1',
      })

      const result = await AccountService.create('fam-1', input)
      expect(result.id).toBe('acc-new')
      expect(mockPrisma.financialAccount.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          familyId: 'fam-1',
          name: 'New Account',
          type: 'BANK_ACCOUNT',
        }),
      })
    })
  })

  describe('softDelete', () => {
    it('throws NotFound when account does not exist', async () => {
      AccountRepo.findById.mockResolvedValue(null)
      await expect(AccountService.softDelete('nonexistent', 'fam-1')).rejects.toThrow(AppError)
    })

    it('soft deletes account with transactions', async () => {
      AccountRepo.findById.mockResolvedValue({ id: 'acc-1' })
      ;(mockPrisma.transaction.count as jest.Mock).mockResolvedValue(5)
      AccountRepo.softDelete.mockResolvedValue({ id: 'acc-1', isActive: false })

      await AccountService.softDelete('acc-1', 'fam-1')
      expect(AccountRepo.softDelete).toHaveBeenCalledWith('acc-1')
    })
  })
})
