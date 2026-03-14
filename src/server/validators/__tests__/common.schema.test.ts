import {
  paginationSchema,
  dateRangeSchema,
  sortSchema,
  amountSchema,
  rateSchema,
  idSchema,
  searchSchema,
} from '../common.schema'

describe('paginationSchema', () => {
  it('uses defaults when no input', () => {
    const result = paginationSchema.parse({})
    expect(result).toEqual({ page: 1, limit: 20 })
  })

  it('coerces string numbers', () => {
    const result = paginationSchema.parse({ page: '3', limit: '50' })
    expect(result).toEqual({ page: 3, limit: 50 })
  })

  it('rejects page < 1', () => {
    expect(() => paginationSchema.parse({ page: 0 })).toThrow()
  })

  it('rejects limit > 100', () => {
    expect(() => paginationSchema.parse({ limit: 101 })).toThrow()
  })

  it('rejects limit < 1', () => {
    expect(() => paginationSchema.parse({ limit: 0 })).toThrow()
  })
})

describe('dateRangeSchema', () => {
  it('accepts empty object', () => {
    const result = dateRangeSchema.parse({})
    expect(result.from).toBeUndefined()
    expect(result.to).toBeUndefined()
  })

  it('accepts valid date range', () => {
    const result = dateRangeSchema.parse({
      from: '2024-01-01',
      to: '2024-12-31',
    })
    expect(result.from).toBeInstanceOf(Date)
    expect(result.to).toBeInstanceOf(Date)
  })

  it('rejects from > to', () => {
    expect(() =>
      dateRangeSchema.parse({
        from: '2024-12-31',
        to: '2024-01-01',
      }),
    ).toThrow()
  })

  it('allows same date for from and to', () => {
    const result = dateRangeSchema.parse({
      from: '2024-06-15',
      to: '2024-06-15',
    })
    expect(result.from).toBeInstanceOf(Date)
  })
})

describe('sortSchema', () => {
  it('uses defaults', () => {
    const result = sortSchema.parse({})
    expect(result).toEqual({ sortBy: 'createdAt', sortOrder: 'desc' })
  })

  it('accepts valid sort', () => {
    const result = sortSchema.parse({ sortBy: 'amount', sortOrder: 'asc' })
    expect(result).toEqual({ sortBy: 'amount', sortOrder: 'asc' })
  })

  it('rejects invalid sortOrder', () => {
    expect(() => sortSchema.parse({ sortOrder: 'random' })).toThrow()
  })
})

describe('amountSchema', () => {
  it('accepts positive number', () => {
    expect(amountSchema.parse(100)).toBe(100)
  })

  it('coerces string to number', () => {
    expect(amountSchema.parse('500')).toBe(500)
  })

  it('rejects zero', () => {
    expect(() => amountSchema.parse(0)).toThrow()
  })

  it('rejects negative', () => {
    expect(() => amountSchema.parse(-100)).toThrow()
  })
})

describe('rateSchema', () => {
  it('accepts 0', () => {
    expect(rateSchema.parse(0)).toBe(0)
  })

  it('accepts 1', () => {
    expect(rateSchema.parse(1)).toBe(1)
  })

  it('accepts 0.5', () => {
    expect(rateSchema.parse(0.5)).toBe(0.5)
  })

  it('rejects > 1', () => {
    expect(() => rateSchema.parse(1.1)).toThrow()
  })

  it('rejects negative', () => {
    expect(() => rateSchema.parse(-0.1)).toThrow()
  })
})

describe('idSchema', () => {
  it('accepts non-empty string', () => {
    expect(idSchema.parse('abc-123')).toBe('abc-123')
  })

  it('rejects empty string', () => {
    expect(() => idSchema.parse('')).toThrow()
  })
})

describe('searchSchema', () => {
  it('accepts undefined', () => {
    expect(searchSchema.parse(undefined)).toBeUndefined()
  })

  it('accepts valid string', () => {
    expect(searchSchema.parse('test')).toBe('test')
  })

  it('rejects string > 200 chars', () => {
    expect(() => searchSchema.parse('a'.repeat(201))).toThrow()
  })
})
