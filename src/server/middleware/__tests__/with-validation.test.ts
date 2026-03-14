import { validateBody, validateQuery } from '../with-validation'
import { z } from 'zod'
import { NextRequest } from 'next/server'
import { AppError } from '@/server/errors/app-error'

const testSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
})

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/test', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeGetRequest(params: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/test')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url)
}

describe('validateBody', () => {
  it('parses valid body', async () => {
    const req = makeRequest({ name: 'Test', amount: 100 })
    const result = await validateBody(req, testSchema)
    expect(result).toEqual({ name: 'Test', amount: 100 })
  })

  it('throws AppError for invalid body', async () => {
    const req = makeRequest({ name: '', amount: -1 })
    await expect(validateBody(req, testSchema)).rejects.toThrow(AppError)
  })

  it('throws AppError for empty body', async () => {
    const req = new NextRequest('http://localhost/api/test', {
      method: 'POST',
    })
    await expect(validateBody(req, testSchema)).rejects.toThrow(AppError)
  })

  it('includes error details for validation failure', async () => {
    const req = makeRequest({ name: '', amount: -1 })
    try {
      await validateBody(req, testSchema)
      fail('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).code).toBe('UNPROCESSABLE_ENTITY')
      expect((error as AppError).details).toBeDefined()
    }
  })
})

describe('validateQuery', () => {
  const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    search: z.string().optional(),
  })

  it('parses valid query params', () => {
    const req = makeGetRequest({ page: '2', search: 'test' })
    const result = validateQuery(req, querySchema)
    expect(result).toEqual({ page: 2, search: 'test' })
  })

  it('uses defaults for missing params', () => {
    const req = makeGetRequest({})
    const result = validateQuery(req, querySchema)
    expect(result.page).toBe(1)
  })

  it('throws AppError for invalid query', () => {
    const req = makeGetRequest({ page: '-1' })
    expect(() => validateQuery(req, querySchema)).toThrow(AppError)
  })
})
