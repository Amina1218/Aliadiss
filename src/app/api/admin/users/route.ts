import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

function requireAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export async function GET() {
  const session = await getSession()
  const authError = requireAdmin(session)
  if (authError) return authError

  const users = await prisma.user.findMany({
    include: {
      store: { select: { id: true, name: true, status: true } },
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  const authError = requireAdmin(session)
  if (authError) return authError

  const body = await req.json()
  const {
    name,
    email,
    password,
    storeName,
    legalName,
    legalCredentials,
    city,
    address,
    approveStore,
  } = body

  if (!name || !email || !password || !storeName || !legalName || !legalCredentials || !city) {
    return NextResponse.json({ error: 'All seller and store fields are required' }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'STORE_OWNER',
      store: {
        create: {
          name: storeName.trim(),
          legalName: legalName.trim(),
          legalCredentials: legalCredentials.trim(),
          city: city.trim(),
          address: address?.trim() || null,
          status: approveStore ? 'APPROVED' : 'PENDING',
        },
      },
    },
    include: {
      store: { select: { id: true, name: true, status: true } },
      _count: { select: { orders: true } },
    },
  })

  return NextResponse.json(user, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  const authError = requireAdmin(session)
  if (authError) return authError

  const { userId, action, rejectionReason } = await req.json()
  if (!userId || !action) {
    return NextResponse.json({ error: 'userId and action are required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { store: true },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.role === 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Cannot modify admin accounts' }, { status: 403 })
  }

  if (action === 'grantPosting') {
    if (user.role !== 'STORE_OWNER' || !user.store) {
      return NextResponse.json({ error: 'User is not a seller with a store' }, { status: 400 })
    }
    const store = await prisma.store.update({
      where: { id: user.store.id },
      data: { status: 'APPROVED', rejectionReason: null },
    })
    return NextResponse.json({ user, store })
  }

  if (action === 'revokePosting') {
    if (!user.store) {
      return NextResponse.json({ error: 'Seller has no store' }, { status: 400 })
    }
    const store = await prisma.store.update({
      where: { id: user.store.id },
      data: {
        status: 'REJECTED',
        rejectionReason: rejectionReason || 'Posting permission revoked by admin',
      },
    })
    return NextResponse.json({ user, store })
  }

  if (action === 'demote') {
    const updated = await prisma.$transaction(async (tx) => {
      if (user.store) {
        await tx.store.update({
          where: { id: user.store.id },
          data: {
            status: 'REJECTED',
            rejectionReason: rejectionReason || 'Seller access removed by admin',
          },
        })
      }
      return tx.user.update({
        where: { id: userId },
        data: { role: 'CUSTOMER' },
        include: {
          store: { select: { id: true, name: true, status: true } },
          _count: { select: { orders: true } },
        },
      })
    })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  const authError = requireAdmin(session)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.role === 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Cannot delete admin accounts' }, { status: 403 })
  }

  await prisma.user.delete({ where: { id: userId } })
  return NextResponse.json({ ok: true })
}
