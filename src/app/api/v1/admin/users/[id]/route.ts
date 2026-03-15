import { NextResponse } from 'next/server'
import { withAdmin } from '@/server/middleware/with-admin'
import { AdminService } from '@/server/services/admin.service'

// GET /api/v1/admin/users/:id
export const GET = withAdmin(async (req) => {
  const id = req.nextUrl.pathname.split('/').pop()!
  const user = await AdminService.getUser(id)
  return NextResponse.json({ success: true, data: user })
})

// PATCH /api/v1/admin/users/:id — Update user
export const PATCH = withAdmin(async (req) => {
  const id = req.nextUrl.pathname.split('/').pop()!
  const body = await req.json()
  const user = await AdminService.updateUser(id, body)
  return NextResponse.json({ success: true, data: user })
})

// DELETE /api/v1/admin/users/:id
export const DELETE = withAdmin(async (req) => {
  const id = req.nextUrl.pathname.split('/').pop()!
  const result = await AdminService.deleteUser(id)
  return NextResponse.json({ success: true, data: result })
})

// PUT /api/v1/admin/users/:id — Special actions (password, family)
export const PUT = withAdmin(async (req) => {
  const id = req.nextUrl.pathname.split('/').pop()!
  const body = await req.json()

  if (body.action === 'change-password') {
    if (!body.password || body.password.length < 6) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'Mat khau toi thieu 6 ky tu' } },
        { status: 400 },
      )
    }
    const result = await AdminService.changePassword(id, body.password)
    return NextResponse.json({ success: true, data: result })
  }

  if (body.action === 'assign-family') {
    const result = await AdminService.assignToFamily(id, body.familyId, body.role)
    return NextResponse.json({ success: true, data: result })
  }

  if (body.action === 'remove-family') {
    const result = await AdminService.removeFromFamily(id, body.familyId)
    return NextResponse.json({ success: true, data: result })
  }

  return NextResponse.json(
    { success: false, error: { code: 'VALIDATION', message: 'action khong hop le' } },
    { status: 400 },
  )
})
