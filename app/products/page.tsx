'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AppHeader from '@/components/AppHeader'
import ProductCard from '@/components/ProductCard'
import EmptyState from '@/components/EmptyState'
import { getProducts } from '@/lib/api'
import { useCartStore, type Product } from '@/lib/store'

const CATEGORIES = ['All', 'Dairy', 'Atta/Grains', 'Oil/Ghee', 'Masale', 'Snacks', 'Drinks', 'Household', 'Personal Care', 'Other']

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-orange-50">
      <div className="skeleton h-24 w-full rounded-xl mb-3" />
      <div className="skeleton h-4 w-3/4 mb-2" />
      <div className="skeleton h-3 w-1/3 mb-3" />
      <div className="flex justify-between">
        <div className="skeleton h-6 w-14" />
        <div className="skeleton h-8 w-8 rounded-xl" />
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const { addItem } = useCartStore()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await getProducts()
      setProducts(res.data.products || [])
    } catch {
      toast.error('Products load नहीं हुए')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => products.filter((p: Product) => {
    const s = search.toLowerCase()
    return (
      (!s || p.name.toLowerCase().includes(s) || (p.barcode || '').includes(s)) &&
      (category === 'All' || p.category === category)
    )
  }), [products, search, category])

  function handleAddToCart(product: Product) {
    addItem(product)
    toast.success(`${product.name} cart में जोड़ा`, { icon: '🛒', duration: 1500 })
  }

  return (
    <div className="max-w-[480px] mx-auto">
      <AppHeader
        title="Products · सामान"
        titleHi={`${products.length} items in catalog`}
        right={
          <Link href="/products/new">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="flex items-center gap-1.5 h-9 px-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl shadow-md shadow-orange-200"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add
            </motion.button>
          </Link>
        }
      />

      <div className="px-4 pb-24 pt-3">
        {/* Search */}
        <div className="relative mb-3">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Name या barcode से search करें…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-orange-100 rounded-xl text-sm text-gray-800 placeholder:text-gray-300 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300">✕</button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {CATEGORIES.map((c) => (
            <motion.button
              key={c}
              whileTap={{ scale: 0.93 }}
              onClick={() => setCategory(c)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                category === c
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                  : 'bg-white text-gray-500 border border-gray-100'
              }`}
            >
              {c}
            </motion.button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            emoji="📦"
            title={search ? 'कोई result नहीं मिला' : 'Catalog खाली है'}
            subtitle={search ? 'दूसरे keywords से search करें' : 'पहला product add करके शुरू करें'}
            action={!search && (
              <Link href="/products/new">
                <motion.button whileTap={{ scale: 0.95 }}
                  className="px-5 py-3 bg-orange-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-200">
                  + पहला Product जोड़ें
                </motion.button>
              </Link>
            )}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <ProductCard product={p} onAdd={handleAddToCart} showStock />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
