// Mock Prisma client globally for all tests
jest.mock('@/lib/prisma', () => ({
  prisma: {
    financialAccount: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    transaction: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      count: jest.fn(),
    },
    transactionTag: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    budget: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    budgetAlert: {
      createMany: jest.fn(),
    },
    debt: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    debtPayment: {
      create: jest.fn(),
    },
    savingsGoal: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    savingsContribution: {
      create: jest.fn(),
    },
    investment: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    familyMember: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((fn: Function) => fn({
      financialAccount: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      transaction: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      transactionTag: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      budget: {
        create: jest.fn(),
      },
      budgetAlert: {
        createMany: jest.fn(),
      },
      debt: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      debtPayment: {
        create: jest.fn(),
      },
      savingsGoal: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      savingsContribution: {
        create: jest.fn(),
      },
      notification: {
        create: jest.fn(),
      },
    })),
  },
}))

// Mock NextAuth
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}))
