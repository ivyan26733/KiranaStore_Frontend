'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getAvailableDeals, expressInterest } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface DealItem {
  id: string; name: string; category?: string
  quantity: number; unit: string; price_per_unit: number; min_order_qty?: number
}
interface Vendor { id: string; name: string; city: string; is_verified: boolean; categories: string[] }
interface Interest { id: string; status: string }
interface Deal {
  id: string; title: string; city: string; status: string
  valid_until?: string; notes?: string; created_at: string
  items: DealItem[]
  vendor: Vendor
  interests: Interest[]
  _count: { interests: number }
}

const CATEGORIES = ['All', 'Dairy', 'Atta/Grains', 'Oil/Ghee', 'Masale', 'Snacks', 'Drinks', 'Household', 'Personal Care', 'Tobacco', 'Frozen', 'Other']

export default function VendorDealsForShopkeeper() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')
  const [expandedDeal, setExpandedDeal] = useState<string | null>(null)
  const [expressingInterest, setExpressingInterest] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    getAvailableDeals(category !== 'All' ? { category } : undefined)
      .then(res => setDeals(res.data.deals))
      .catch(() => toast.error('Deals load नहीं हुईं'))
      .finally(() => setLoading(false))
  }, [category])

  async function handleInterest(dealId: string) {
    setExpressingInterest(dealId)
    try {
      await expressInterest(dealId)
      toast.success('Vendor को notify किया गया!')
      // Mark interest locally
      setDeals(prev => prev.map(d =>
        d.id === dealId
          ? { ...d, interests: [{ id: 'local', status: 'PENDING' }] }
          : d
      ))
    } catch {
      toast.error('Interest express नहीं हो सका')
    } finally {
      setExpressingInterest(null)
    }
  }

  return (
    <div className="max-w-[480px] mx-auto px-4 pb-24 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/procurement"
          className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Vendor Deals</h1>
          <p className="text-xs text-gray-400 mt-0.5">Vendors का available stock देखें</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              category === cat ? 'bg-orange-500 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-100'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <span className="text-5xl">🏪</span>
          <p className="font-semibold text-gray-600 mt-3">अभी कोई deal नहीं</p>
          <p className="text-xs text-gray-400 mt-1">Vendors ने अभी कोई offer नहीं डाला है</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {deals.map(deal => {
            const alreadyInterested = deal.interests.length > 0
            const isExpanded = expandedDeal === deal.id

            return (
              <motion.div key={deal.id} layout
                className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                {/* Vendor banner */}
                <div className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 text-sm leading-snug">{deal.title}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <p className="text-xs font-semibold text-gray-600">{deal.vendor.name}</p>
                        {deal.vendor.is_verified && (
                          <span className="text-[9px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">✓ Verified</span>
                        )}
                        <span className="text-[10px] text-gray-400">· {deal.vendor.city}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {deal.valid_until && (
                        <p className="text-[10px] text-amber-500 font-semibold">
                          ⏳ {new Date(deal.valid_until).toLocaleDateString('en-IN')} तक
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-0.5">{deal._count.interests} interested</p>
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="flex flex-wrap gap-1.5">
                    {deal.items.slice(0, 3).map(item => (
                      <span key={item.id} className="bg-orange-50 border border-orange-100 text-orange-700 text-xs px-2.5 py-1 rounded-lg font-medium">
                        {item.name} · ₹{Number(item.price_per_unit).toLocaleString('en-IN')}/{item.unit}
                      </span>
                    ))}
                    {deal.items.length > 3 && (
                      <span className="text-xs text-gray-400">+{deal.items.length - 3}</span>
                    )}
                  </div>

                  {deal.notes && (
                    <p className="text-xs text-gray-400 italic mt-2">"{deal.notes}"</p>
                  )}
                </div>

                {/* Expand toggle */}
                <button
                  onClick={() => setExpandedDeal(isExpanded ? null : deal.id)}
                  className="w-full px-4 py-2 border-t border-gray-50 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                >
                  {isExpanded ? 'Hide details ↑' : `View all ${deal.items.length} items ↓`}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-50 px-4 py-3">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-50">
                          <th className="pb-1.5 text-left font-semibold">Item</th>
                          <th className="pb-1.5 text-right font-semibold">Available</th>
                          <th className="pb-1.5 text-right font-semibold">Price/Unit</th>
                          <th className="pb-1.5 text-right font-semibold">Min Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deal.items.map(item => (
                          <tr key={item.id} className="border-b border-gray-50 last:border-0">
                            <td className="py-1.5 font-medium text-gray-700">
                              {item.name}
                              {item.category && <span className="ml-1 text-[9px] text-gray-400">({item.category})</span>}
                            </td>
                            <td className="py-1.5 text-right text-gray-500">{Number(item.quantity)} {item.unit}</td>
                            <td className="py-1.5 text-right font-semibold text-gray-800">₹{Number(item.price_per_unit).toLocaleString('en-IN')}</td>
                            <td className="py-1.5 text-right text-gray-400">
                              {item.min_order_qty ? `${Number(item.min_order_qty)} ${item.unit}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Interest button */}
                <div className="px-4 pb-4 pt-1">
                  <button
                    onClick={() => !alreadyInterested && handleInterest(deal.id)}
                    disabled={alreadyInterested || expressingInterest === deal.id}
                    className={`w-full py-3 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 ${
                      alreadyInterested
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                        : 'bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50'
                    }`}
                  >
                    {expressingInterest === deal.id
                      ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending…</>
                      : alreadyInterested
                      ? '✓ Interest भेज दी — vendor contact करेगा'
                      : '🤝 मुझे यह चाहिए — Vendor से बात करें'}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
