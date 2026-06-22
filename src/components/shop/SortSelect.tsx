'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function SortSelect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeSort = searchParams.get('sort') ?? 'newest'

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'newest') params.delete('sort')
    else params.set('sort', value)
    router.push(`/shop/products?${params.toString()}`)
  }

  return (
    <select
      value={activeSort}
      onChange={(e) => handleChange(e.target.value)}
      className="text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-700"
    >
      <option value="newest">Newest first</option>
      <option value="price_asc">Price: Low → High</option>
      <option value="price_desc">Price: High → Low</option>
    </select>
  )
}
