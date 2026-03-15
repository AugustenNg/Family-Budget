// =============================================================================
// Seed admin user: admin / august1009@
// Run: npx tsx prisma/seed-admin.ts
// =============================================================================

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@cfofamily.local'
  const password = 'august1009@'
  const name = 'Admin'

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, isSystemAdmin: true },
    create: {
      email,
      name,
      passwordHash,
      isSystemAdmin: true,
    },
  })

  console.log(`\n✓ Admin user created/updated:`)
  console.log(`  Email:    ${email}`)
  console.log(`  Password: ${password}`)
  console.log(`  ID:       ${user.id}`)
  console.log(`  Admin:    ${user.isSystemAdmin}\n`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
