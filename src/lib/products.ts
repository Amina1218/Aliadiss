import type { Prisma } from '@prisma/client'

/** Products visible on the customer shop: verified, in stock, from approved stores */
export const publishedProductWhere: Prisma.ProductWhereInput = {
  status: 'VERIFIED',
  stock: { gt: 0 },
  store: { status: 'APPROVED' },
}
