'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { ShieldCheck } from 'lucide-react'
import { formatBirr, WARRANTY_LABELS } from '@/lib/utils'
import { AddToCartButton } from './AddToCartButton'
import { ProductImage } from './ProductImage'

interface ShopProductCardProps {
  product: {
    id: string
    title: string
    priceBirr: number
    category: string
    warrantyType: string
    imageUrl?: string | null
    ramGb?: string | null
    batteryMah?: string | null
    storageGb?: string | null
    stock: number
    store: { name: string; city: string }
  }
}

export function ShopProductCard({ product }: ShopProductCardProps) {
  const warrantyVariant =
    product.warrantyType === 'OFFICIAL' ? 'blue' : product.warrantyType === 'SELLER' ? 'orange' : 'gray'
  const warrantyLabel = WARRANTY_LABELS[product.warrantyType as keyof typeof WARRANTY_LABELS]

  return (
    <div className="card overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group">
      <Link href={`/shop/product/${product.id}`} className="block">
        <div className="h-44 relative overflow-hidden">
          <ProductImage src={product.imageUrl} category={product.category} alt={product.title} emojiClassName="text-5xl" />
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <Badge variant="verified">
              <ShieldCheck className="w-3 h-3" /> Verified
            </Badge>
            <Badge variant={warrantyVariant}>{warrantyLabel}</Badge>
          </div>
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/shop/product/${product.id}`}>
          <p className="text-xs text-gray-400 mb-1">
            {product.store.name} · {product.store.city}
          </p>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-orange-600 transition-colors line-clamp-2">
            {product.title}
          </h3>
        </Link>

        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {product.ramGb && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-50 text-gray-500 font-medium">
              {product.ramGb}GB RAM
            </span>
          )}
          {product.batteryMah && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-50 text-gray-500 font-medium">
              {product.batteryMah}mAh
            </span>
          )}
          {product.storageGb && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-50 text-gray-500 font-medium">
              {product.storageGb}GB
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <p className="font-display text-base font-bold text-gray-900">{formatBirr(product.priceBirr)}</p>
          <AddToCartButton
            productId={product.id}
            disabled={product.stock === 0}
            variant="text"
          />
        </div>
      </div>
    </div>
  )
}
