import { NextResponse } from 'next/server'
import { withAdmin } from '@/server/middleware/with-admin'
import { AdminService } from '@/server/services/admin.service'

export const GET = withAdmin(async () => {
  const stats = await AdminService.getStats()
  return NextResponse.json({ success: true, data: stats })
})
