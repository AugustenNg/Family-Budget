import { createTransactionSchema, updateTransactionSchema, listTransactionsSchema } from '../transaction.schema'

describe('createTransactionSchema', () => {
  const validExpense = {
    sourceAccountId: 'acc-1',
    type: 'EXPENSE',
    amount: 100000,
    date: '2024-06-15',
  }

  it('accepts valid expense', () => {
    const result = createTransactionSchema.parse(validExpense)
    expect(result.sourceAccountId).toBe('acc-1')
    expect(result.type).toBe('EXPENSE')
    expect(result.amount).toBe(100000)
    expect(result.date).toBeInstanceOf(Date)
  })

  it('accepts valid income', () => {
    const result = createTransactionSchema.parse({
      ...validExpense,
      type: 'INCOME',
    })
    expect(result.type).toBe('INCOME')
  })

  it('accepts valid transfer with destAccountId', () => {
    const result = createTransactionSchema.parse({
      ...validExpense,
      type: 'TRANSFER',
      destAccountId: 'acc-2',
    })
    expect(result.type).toBe('TRANSFER')
    expect(result.destAccountId).toBe('acc-2')
  })

  it('rejects TRANSFER without destAccountId', () => {
    expect(() =>
      createTransactionSchema.parse({
        ...validExpense,
        type: 'TRANSFER',
      }),
    ).toThrow('destAccountId')
  })

  it('rejects TRANSFER with same source and dest', () => {
    expect(() =>
      createTransactionSchema.parse({
        ...validExpense,
        type: 'TRANSFER',
        destAccountId: 'acc-1',
      }),
    ).toThrow('destAccountId')
  })

  it('rejects negative amount', () => {
    expect(() =>
      createTransactionSchema.parse({
        ...validExpense,
        amount: -100,
      }),
    ).toThrow()
  })

  it('rejects zero amount', () => {
    expect(() =>
      createTransactionSchema.parse({
        ...validExpense,
        amount: 0,
      }),
    ).toThrow()
  })

  it('rejects empty sourceAccountId', () => {
    expect(() =>
      createTransactionSchema.parse({
        ...validExpense,
        sourceAccountId: '',
      }),
    ).toThrow()
  })

  it('rejects invalid type', () => {
    expect(() =>
      createTransactionSchema.parse({
        ...validExpense,
        type: 'INVALID',
      }),
    ).toThrow()
  })

  it('applies defaults for optional fields', () => {
    const result = createTransactionSchema.parse(validExpense)
    expect(result.isPending).toBe(false)
    expect(result.isExcluded).toBe(false)
  })

  it('accepts optional fields', () => {
    const result = createTransactionSchema.parse({
      ...validExpense,
      description: 'Test',
      categoryId: 'cat-1',
      tagIds: ['tag-1', 'tag-2'],
      location: 'Hanoi',
      isPending: true,
    })
    expect(result.description).toBe('Test')
    expect(result.tagIds).toEqual(['tag-1', 'tag-2'])
    expect(result.isPending).toBe(true)
  })
})

describe('updateTransactionSchema', () => {
  it('accepts partial update', () => {
    const result = updateTransactionSchema.parse({ amount: 200000 })
    expect(result.amount).toBe(200000)
    expect(result.type).toBeUndefined()
  })

  it('accepts empty object', () => {
    const result = updateTransactionSchema.parse({})
    expect(result).toEqual({})
  })

  it('allows nullable categoryId', () => {
    const result = updateTransactionSchema.parse({ categoryId: null })
    expect(result.categoryId).toBeNull()
  })
})

describe('listTransactionsSchema', () => {
  it('uses defaults for empty input', () => {
    const result = listTransactionsSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
    expect(result.sortBy).toBe('createdAt')
    expect(result.sortOrder).toBe('desc')
  })

  it('accepts filters', () => {
    const result = listTransactionsSchema.parse({
      type: 'EXPENSE',
      accountId: 'acc-1',
      search: 'coffee',
      minAmount: '10000',
      maxAmount: '50000',
    })
    expect(result.type).toBe('EXPENSE')
    expect(result.accountId).toBe('acc-1')
    expect(result.search).toBe('coffee')
    expect(result.minAmount).toBe(10000)
    expect(result.maxAmount).toBe(50000)
  })
})
