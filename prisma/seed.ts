import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const adminHash = await bcrypt.hash('admin123', 12)
  await prisma.user.upsert({
    where: { email: 'admin@aliadiss.com' },
    update: {},
    create: { name: 'Super Admin', email: 'admin@aliadiss.com', passwordHash: adminHash, role: Role.SUPER_ADMIN },
  })

  console.log('Seed complete — admin account only.')
  console.log('Customers and sellers must register through the website.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
