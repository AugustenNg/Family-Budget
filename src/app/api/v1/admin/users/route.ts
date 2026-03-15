import { NextResponse } from 'next/server'
import { withAdmin } from '@/server/middleware/with-admin'
import { AdminService } from '@/server/services/admin.service'

// GET /api/v1/admin/users — List all users
export const GET = withAdmin(async () => {
  const users = await AdminService.listUsers()
  return NextResponse.json({ success: true, data: users })
})

// POST /api/v1/admin/users — Create new user
export const POST = withAdmin(async (req) => {
  const body = await req.json()
  const { email, password, name, phone, isSystemAdmin } = body

  if (!email || !password || !name) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'email, password, name bat buoc' } },
      { status: 400 },
    )
  }

  if (password.length < 6) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Mat khau toi thieu 6 ky tu' } },
      { status: 400 },
    )
  }

  const user = await AdminService.createUser({ email, password, name, phone, isSystemAdmin })
  return NextResponse.json({ success: true, data: user }, { status: 201 })
})
