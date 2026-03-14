import { requireRole } from '../with-role'
import { type FamilyContext } from '@/server/types/api.types'

function makeCtx(role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'CHILD'): FamilyContext {
  return { userId: 'user-1', familyId: 'fam-1', role }
}

describe('requireRole', () => {
  it('OWNER passes OWNER requirement', () => {
    expect(requireRole('OWNER')(makeCtx('OWNER'))).toBeNull()
  })

  it('OWNER passes MEMBER requirement', () => {
    expect(requireRole('MEMBER')(makeCtx('OWNER'))).toBeNull()
  })

  it('OWNER passes CHILD requirement', () => {
    expect(requireRole('CHILD')(makeCtx('OWNER'))).toBeNull()
  })

  it('ADMIN passes ADMIN requirement', () => {
    expect(requireRole('ADMIN')(makeCtx('ADMIN'))).toBeNull()
  })

  it('ADMIN passes MEMBER requirement', () => {
    expect(requireRole('MEMBER')(makeCtx('ADMIN'))).toBeNull()
  })

  it('MEMBER passes MEMBER requirement', () => {
    expect(requireRole('MEMBER')(makeCtx('MEMBER'))).toBeNull()
  })

  it('CHILD passes CHILD requirement', () => {
    expect(requireRole('CHILD')(makeCtx('CHILD'))).toBeNull()
  })

  it('CHILD fails MEMBER requirement', () => {
    const result = requireRole('MEMBER')(makeCtx('CHILD'))
    expect(result).not.toBeNull()
    // The response should be a 403
    expect(result?.status).toBe(403)
  })

  it('MEMBER fails ADMIN requirement', () => {
    const result = requireRole('ADMIN')(makeCtx('MEMBER'))
    expect(result).not.toBeNull()
    expect(result?.status).toBe(403)
  })

  it('ADMIN fails OWNER requirement', () => {
    const result = requireRole('OWNER')(makeCtx('ADMIN'))
    expect(result).not.toBeNull()
    expect(result?.status).toBe(403)
  })

  it('CHILD fails OWNER requirement', () => {
    const result = requireRole('OWNER')(makeCtx('CHILD'))
    expect(result).not.toBeNull()
    expect(result?.status).toBe(403)
  })
})
