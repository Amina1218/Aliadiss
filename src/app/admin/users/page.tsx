import { prisma } from '@/lib/db'
import { UserManagement } from '@/components/admin/UserManagement'

async function getUsers() {
  return prisma.user.findMany({
    include: {
      store: { select: { id: true, name: true, status: true } },
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function AdminUsersPage() {
  const users = await getUsers()

  return <UserManagement initialUsers={JSON.parse(JSON.stringify(users))} />
}
