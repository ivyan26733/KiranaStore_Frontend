'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { getMyDeals, updateDealStatus } from '@/lib/vendorApi'
import toast from 'react-hot-toast'

interface DealItem {
  id: string; name: string; category?: string
  quantity: number; unit: string; price_per_unit: number; min_order_qty?: number
}
interface Interest {
  id: string; status: string; created_at: string
  shop: { name: string; city: string }
}
interface Deal {
  id: string; title: string; city: string; status: string
  valid_until?: string; notes?: string; created_at: string
  items: DealItem[]
  interests: Interest[]
  _count: { interests: number }
}

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  ACTIVE:    { label: 'Active',    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
  SOLD_OUT:  { label: 'Sold Out', badge: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-400' },
  CANCELLED: { label: 'Cancelled', badge: 'bg-slate-100 text-slate-500 border-slate-200',     dot: 'bg-slate-300' },
  EXPIRED:   { label: 'Expired',  badge: 'bg-slate-100 text-slate-500 border-slate-200',     dot: 'bg-slate-300' },
}

export default function VendorDeals() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDeal, setExpandedDeal] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    getMyDeals()
      .then(res => setDeals(res.data.deals))
      .catch(() => toast.error('Deals load नहीं हुईं'))
      .finally(() => setLoading(false))
  }, [])

  async function handleStatusChange(dealId: string, status: string) {
    setUpdating(dealId)
    try {
      const res = await updateDealStatus(dealId, status)
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, ...res.data.deal } : d))
      toast.success('Status updated')
    } catch {
      toast.error('Update नहीं हुआ')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">My Deals</h1>
          <p className="text-xs text-slate-400 mt-0.5">Shopkeepers को अपना stock बेचें</p>
        </div>
        <Link href="/vendor/deals/new">
          <div className="h-9 px-4 bg-indigo-600 text-white text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-200">
            + New Deal
          </div>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-5xl">📦</span>
          <p className="font-semibold text-slate-600 mt-3">अभी कोई deal नहीं</p>
          <p className="text-xs text-slate-400 mt-1">अपना stock shopkeepers को offer करें</p>
          <Link href="/vendor/deals/new"
            className="inline-block mt-5 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold">
            पहली Deal Post करें →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {deals.map(deal => {
            const cfg = STATUS_CONFIG[deal.status]
            const isExpanded = expandedDeal === deal.id
            return (
              <motion.div key={deal.id} layout className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                {/* Deal header */}
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${cfg?.dot}`} />
                        <h3 className="font-bold text-slate-800 truncate">{deal.title}</h3>
                      </div>
                      <p className="text-xs text-slate-400">📍 {deal.city} · {new Date(deal.created_at).toLocaleDateString('en-IN')}</p>
                      {deal.valid_until && (
                        <p className="text-xs text-amber-500 mt-0.5">⏳ Valid till {new Date(deal.valid_until).toLocaleDateString('en-IN')}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg?.badge}`}>
                        {cfg?.label}
                      </span>
                      <span className="text-xs font-semibold text-indigo-600">
                        {deal._count.interests} interested
                      </span>
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {deal.items.slice(0, 3).map(item => (
                      <span key={item.id} className="bg-slate-50 border border-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-lg font-medium">
                        {item.name} · ₹{Number(item.price_per_unit).toLocaleString('en-IN')}/{item.unit}
                      </span>
                    ))}
                    {deal.items.length > 3 && (
                      <span className="text-xs text-slate-400">+{deal.items.length - 3} more</span>
                    )}
                  </div>
                </div>

                {/* Expand button */}
                <button
                  onClick={() => setExpandedDeal(isExpanded ? null : deal.id)}
                  className="w-full px-5 py-2 border-t border-slate-50 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                >
                  {isExpanded ? 'Collapse ↑' : `Show all items & interests ↓`}
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-50 px-5 py-4">
                    {/* Full items table */}
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Items</p>
                    <table className="w-full text-xs mb-4">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-100">
                          <th className="pb-1.5 text-left font-semibold">Item</th>
                          <th className="pb-1.5 text-right font-semibold">Qty</th>
                          <th className="pb-1.5 text-right font-semibold">Price/Unit</th>
                          <th className="pb-1.5 text-right font-semibold">Min Order</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deal.items.map(item => (
                          <tr key={item.id} className="border-b border-slate-50 last:border-0">
                            <td className="py-1.5 font-medium text-slate-700">
                              {item.name}
                              {item.category && <span className="ml-1.5 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{item.category}</span>}
                            </td>
                            <td className="py-1.5 text-right text-slate-500">{Number(item.quantity)} {item.unit}</td>
                            <td className="py-1.5 text-right font-semibold text-slate-800">₹{Number(item.price_per_unit).toLocaleString('en-IN')}</td>
                            <td className="py-1.5 text-right text-slate-400">{item.min_order_qty ? `${Number(item.min_order_qty)} ${item.unit}` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Interested shopkeepers */}
                    {deal.interests.length > 0 && (
                      <>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Interested Shopkeepers</p>
                        <div className="flex flex-col gap-2 mb-4">
                          {deal.interests.map(interest => (
                            <div key={interest.id} className="flex items-center justify-between bg-indigo-50 rounded-xl px-3 py-2">
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{interest.shop.name}</p>
                                <p className="text-xs text-slate-400">{interest.shop.city} · {new Date(interest.created_at).toLocaleDateString('en-IN')}</p>
                              </div>
                              <span className="text-[10px] font-bold text-indigo-600 bg-white border border-indigo-200 px-2 py-0.5 rounded-full">
                                {interest.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Status actions */}
                    {deal.status === 'ACTIVE' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleStatusChange(deal.id, 'SOLD_OUT')}
                          disabled={updating === deal.id}
                          className="flex-1 py-2 border border-amber-200 text-amber-700 text-xs font-bold rounded-xl hover:bg-amber-50 transition-colors disabled:opacity-50">
                          Mark Sold Out
                        </button>
                        <button onClick={() => handleStatusChange(deal.id, 'CANCELLED')}
                          disabled={updating === deal.id}
                          className="flex-1 py-2 border border-red-200 text-red-500 text-xs font-bold rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50">
                          Cancel Deal
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
