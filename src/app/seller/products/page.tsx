'use client'
import { useEffect, useState, useRef } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Package, Plus, RefreshCw, Upload, ImageIcon } from 'lucide-react'
import { formatBirr, CATEGORY_LABELS } from '@/lib/utils'
import { ProductImage } from '@/components/shop/ProductImage'
import toast from 'react-hot-toast'

type StoreData = {
  id: string
  name: string
  status: string
  products: {
    id: string
    title: string
    priceBirr: number
    category: string
    status: string
    stock: number
    imageUrl: string | null
  }[]
}

const CATEGORIES = ['PHONE', 'LAPTOP', 'ACCESSORY', 'OTHER'] as const

export default function SellerProductsPage() {
  const [store, setStore] = useState<StoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [product, setProduct] = useState({
    title: '', description: '', category: 'PHONE', condition: 'New',
    priceBirr: '', warrantyType: 'NONE', warrantyMonths: '0', stock: '1',
    ramGb: '', batteryMah: '', cameraMp: '', processorType: '',
    screenSizeIn: '', screenResolution: '', storageGb: '',
  })

  const fetchStore = async () => {
    setLoading(true)
    const res = await fetch('/api/stores')
    const data = await res.json()
    setStore(data)
    setLoading(false)
  }

  useEffect(() => { fetchStore() }, [])

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        setImageUrl(data.url)
        setImagePreview(data.url)
        toast.success('Photo uploaded')
      } else {
        toast.error(data.error || 'Upload failed')
      }
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setProduct({
      title: '', description: '', category: 'PHONE', condition: 'New',
      priceBirr: '', warrantyType: 'NONE', warrantyMonths: '0', stock: '1',
      ramGb: '', batteryMah: '', cameraMp: '', processorType: '',
      screenSizeIn: '', screenResolution: '', storageGb: '',
    })
    setImageUrl(null)
    setImagePreview(null)
  }

  const submitProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageUrl) {
      toast.error('Please upload a product photo')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/stores/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, imageUrl }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Product submitted! Awaiting admin verification.')
        setShowForm(false)
        resetForm()
        fetchStore()
      } else {
        toast.error(data.error || 'Failed to submit product')
      }
    } finally {
      setSaving(false)
    }
  }

  const canPost = store?.status === 'APPROVED'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1">Product Listings</p>
          <h1 className="font-display text-2xl font-bold text-gray-900">My Products</h1>
          <p className="text-gray-500 text-sm mt-1">Upload a photo and post products — they appear in the shop after admin approval</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchStore} className="btn-secondary gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          {canPost && (
            <button onClick={() => setShowForm(v => !v)} className="btn-primary gap-2">
              <Plus className="w-4 h-4" /> {showForm ? 'Cancel' : 'Post Product'}
            </button>
          )}
        </div>
      </div>

      {!canPost && store && (
        <div className="card p-5 border-orange-100 bg-orange-50/50">
          <p className="text-sm font-semibold text-orange-800">
            Your store must be approved by admin before you can post products.
          </p>
        </div>
      )}

      {showForm && canPost && (
        <form onSubmit={submitProduct} className="card p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-gray-900">New product listing</h2>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Product photo *</label>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-full sm:w-40 h-40 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 flex-shrink-0">
                {imagePreview ? (
                  <ProductImage src={imagePreview} category={product.category} alt="Preview" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-xs">No photo</span>
                  </div>
                )}
              </div>
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="btn-secondary gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading…' : 'Upload photo'}
                </button>
                <p className="text-xs text-gray-400 mt-2">JPEG, PNG, WebP or GIF · Max 5 MB</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">Title</label>
              <input required value={product.title} onChange={e => setProduct(p => ({ ...p, title: e.target.value }))} className="input mt-1" placeholder="e.g. Samsung Galaxy S24" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea required value={product.description} onChange={e => setProduct(p => ({ ...p, description: e.target.value }))} rows={3} className="input mt-1 resize-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select value={product.category} onChange={e => setProduct(p => ({ ...p, category: e.target.value }))} className="input mt-1">
                {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Condition</label>
              <select value={product.condition} onChange={e => setProduct(p => ({ ...p, condition: e.target.value }))} className="input mt-1">
                <option value="New">New</option>
                <option value="Used">Used</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Price (ETB)</label>
              <input required type="number" min="1" value={product.priceBirr} onChange={e => setProduct(p => ({ ...p, priceBirr: e.target.value }))} className="input mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Stock</label>
              <input required type="number" min="1" value={product.stock} onChange={e => setProduct(p => ({ ...p, stock: e.target.value }))} className="input mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Warranty type</label>
              <select value={product.warrantyType} onChange={e => setProduct(p => ({ ...p, warrantyType: e.target.value }))} className="input mt-1">
                <option value="OFFICIAL">Official</option>
                <option value="SELLER">Seller</option>
                <option value="NONE">None</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Warranty months</label>
              <input type="number" min="0" value={product.warrantyMonths} onChange={e => setProduct(p => ({ ...p, warrantyMonths: e.target.value }))} className="input mt-1" />
            </div>
            {[
              { key: 'ramGb', label: 'RAM (GB)' },
              { key: 'storageGb', label: 'Storage (GB)' },
              { key: 'batteryMah', label: 'Battery (mAh)' },
              { key: 'cameraMp', label: 'Camera (MP)' },
              { key: 'processorType', label: 'Processor' },
              { key: 'screenSizeIn', label: 'Screen size (in)' },
              { key: 'screenResolution', label: 'Resolution' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <input value={product[key as keyof typeof product]} onChange={e => setProduct(p => ({ ...p, [key]: e.target.value }))} className="input mt-1" />
              </div>
            ))}
          </div>
          <button type="submit" disabled={saving || uploading} className="btn-primary">
            {saving ? 'Submitting...' : 'Submit for verification'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="card p-12 text-center">
          <RefreshCw className="w-6 h-6 text-gray-300 mx-auto mb-2 animate-spin" />
          <p className="text-sm text-gray-400">Loading products...</p>
        </div>
      ) : !store?.products?.length ? (
        <div className="card p-12 text-center">
          <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="font-medium text-gray-700">No products yet</p>
          <p className="text-sm text-gray-400 mt-1">Post a product with a photo — it appears in the shop after admin verifies it.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Product</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Price</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Stock</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {store.products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <ProductImage src={p.imageUrl} category={p.category} alt={p.title} emojiClassName="text-lg" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{p.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{formatBirr(p.priceBirr)}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{p.stock}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={p.status === 'VERIFIED' ? 'verified' : p.status === 'REJECTED' ? 'rejected' : 'pending'}>
                        {p.status === 'VERIFIED' ? 'Live in shop' : p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
