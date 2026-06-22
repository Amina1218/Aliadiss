'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { Search } from 'lucide-react'

export function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/shop/products?q=${encodeURIComponent(q)}` : '/shop/products')
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 max-w-xl hidden md:block">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search phones, laptops, accessories..."
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-all"
        />
      </div>
    </form>
  )
}
