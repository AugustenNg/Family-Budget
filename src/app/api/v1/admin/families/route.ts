import { NextResponse } from 'next/server'
import { withAdmin } from '@/server/middleware/with-admin'
import { AdminService } from '@/server/services/admin.service'

export const GET = withAdmin(async () => {
  const families = await AdminService.listFamilies()
  return NextResponse.json({ success: true, data: families })
})

export const POST = withAdmin(async (req) => {
  const { name, ownerUserId } = await req.json()
  if (!name) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Ten gia dinh bat buoc' } },
      { status: 400 },
    )
  }
  const family = await AdminService.createFamily(name, ownerUserId)
  return NextResponse.json({ success: true, data: family }, { status: 201 })
})
