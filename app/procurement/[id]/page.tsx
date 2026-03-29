'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface RequirementItem { id: string; name: string; quantity: number; unit: string; notes?: string }
interface Vendor { id: string; name: string; phone: string; city: string; is_verified: boolean; categories: string[] }
interface BidItem { name: string; quantity: number; unit: string; unit_price: number; total_price: number; notes?: string }
interface Bid {
  id: string; status: string; total_amount: number; created_at: string
  delivery_by?: string; credit_terms?: string; notes?: string
  items: BidItem[]; vendor: Vendor
}
interface Requirement {
  id: string; title?: string; status: string; created_at: string
  delivery_by?: string; delivery_address?: string; credit_terms?: string; notes?: string
  items: RequirementItem[]
  bids: Bid[]
}

const BID_STATUS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-500 border-red-200',
}

export default function RequirementDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)
  const [requirement, setRequirement] = useState<Requirement | null>(null)
  const [loading, setLoading] = useState(true)
  const [acceptingBidId, setAcceptingBidId] = useState<string | null>(null)
  const [expandedBid, setExpandedBid] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [showCancel, setShowCancel] = useState(false)

  useEffect(() => { params.then(p => setId(p.id)) }, [params])

  useEffect(() => {
    if (!id) return
    api.get(`/procurement/requirements/${id}`)
      .then(res => setRequirement(res.data.requirement))
      .catch(() => { toast.error('Requirement नहीं मिली'); router.back() })
      .finally(() => setLoading(false))
  }, [id, router])

  async function handleAccept(bidId: string) {
    if (!id) return
    setAcceptingBidId(bidId)
    try {
      await api.post(`/procurement/requirements/${id}/accept/${bidId}`)
      toast.success('Bid accept हो गई! Vendors को notify किया गया।')
      // Reload
      const res = await api.get(`/procurement/requirements/${id}`)
      setRequirement(res.data.requirement)
    } catch {
      toast.error('Accept नहीं हो सका')
    } finally {
      setAcceptingBidId(null)
    }
  }

  async function handleCancel() {
    if (!id) return
    setCancelling(true)
    try {
      await api.delete(`/procurement/requirements/${id}`)
      toast.success('Requirement cancel हो गई')
      router.replace('/procurement')
    } catch {
      toast.error('Cancel नहीं हो सका')
    } finally {
      setCancelling(false)
      setShowCancel(false)
    }
  }

  if (loading) return (
    <div className="max-w-[480px] mx-auto px-4 pt-4 flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
    </div>
  )
  if (!requirement) return null

  const pendingBids = requirement.bids.filter(b => b.status === 'PENDING')
  const acceptedBid = requirement.bids.find(b => b.status === 'ACCEPTED')
  const isOpen = requirement.status === 'OPEN'
  const cheapestBid = pendingBids.length > 0
    ? pendingBids.reduce((min, b) => Number(b.total_amount) < Number(min.total_amount) ? b : min)
    : null

  return (
    <div className="max-w-[480px] mx-auto px-4 pb-24 pt-4">
      {/* Back */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-extrabold text-gray-900 truncate max-w-[280px]">
            {requirement.title || requirement.items.slice(0, 2).map(i => i.name).join(', ')}
          </h1>
          <p className="text-xs text-gray-400">{new Date(requirement.created_at).toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      {/* Status banner */}
      {requirement.status !== 'OPEN' && (
        <div className={`rounded-2xl px-4 py-3 mb-4 text-sm font-semibold text-center ${requirement.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            'bg-gray-100 text-gray-500 border border-gray-200'
          }`}>
          {requirement.status === 'ACCEPTED' ? '✅ Requirement fulfilled — bid accepted' : `❌ Requirement ${requirement.status.toLowerCase()}`}
        </div>
      )}

      {/* Requirement items */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-4">
        <div className="px-4 py-3 border-b border-gray-50">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Required Items</p>
        </div>
        <div className="px-4 py-3">
          <div className="flex flex-wrap gap-2 mb-3">
            {requirement.items.map(item => (
              <span key={item.id} className="bg-orange-50 text-orange-700 border border-orange-100 text-xs px-2.5 py-1 rounded-lg font-medium">
                {Number(item.quantity)} {item.unit} · {item.name}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400">
            {requirement.delivery_by && <span>📅 {new Date(requirement.delivery_by).toLocaleDateString('en-IN')}</span>}
            {requirement.credit_terms && <span>💳 {requirement.credit_terms}</span>}
            {requirement.delivery_address && <span>📍 {requirement.delivery_address}</span>}
          </div>
          {requirement.notes && <p className="text-xs text-gray-400 italic mt-2">"{requirement.notes}"</p>}
        </div>
      </div>

      {/* Bids section */}
      <div className="flex items-center justify-between mb-3">
        <p className="font-extrabold text-gray-800">
          {requirement.bids.length} Bid{requirement.bids.length !== 1 ? 's' : ''} Received
        </p>
        {pendingBids.length > 1 && (
          <span className="text-xs text-orange-500 font-semibold">Cheapest first</span>
        )}
      </div>

      {requirement.bids.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
          <span className="text-4xl">⏳</span>
          <p className="font-semibold text-gray-500 mt-3 text-sm">Bids का इंतज़ार है</p>
          <p className="text-xs text-gray-400 mt-1">Vendors को notify किया गया है</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {requirement.bids.map(bid => {
            const isCheapest = cheapestBid?.id === bid.id && pendingBids.length > 1
            const isExpanded = expandedBid === bid.id

            return (
              <motion.div
                key={bid.id}
                layout
                className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${bid.status === 'ACCEPTED' ? 'border-emerald-300' :
                    bid.status === 'REJECTED' ? 'border-red-100' :
                      isCheapest ? 'border-orange-300' : 'border-gray-100'
                  }`}
              >
                {isCheapest && (
                  <div className="bg-orange-500 text-white text-[10px] font-bold px-4 py-1 text-center tracking-widest uppercase">
                    ⭐ Best Price
                  </div>
                )}

                {/* Bid header */}
                <div className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-gray-800 text-sm">{bid.vendor.name}</p>
                        {bid.vendor.is_verified && (
                          <span className="text-[9px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">✓ Verified</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">{bid.vendor.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-extrabold text-gray-900">₹{Number(bid.total_amount).toLocaleString('en-IN')}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${BID_STATUS[bid.status] || 'bg-gray-100 text-gray-500'}`}>
                        {bid.status === 'ACCEPTED' ? '✓ Accepted' : bid.status === 'REJECTED' ? 'Not selected' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-gray-400">
                    {bid.delivery_by && <span>📅 {new Date(bid.delivery_by).toLocaleDateString('en-IN')}</span>}
                    {bid.credit_terms && <span>💳 {bid.credit_terms}</span>}
                  </div>
                  {bid.notes && <p className="text-xs text-gray-400 italic mt-1">"{bid.notes}"</p>}
                </div>

                {/* Expand toggle */}
                <button
                  onClick={() => setExpandedBid(isExpanded ? null : bid.id)}
                  className="w-full px-4 py-2 border-t border-gray-50 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                >
                  {isExpanded ? 'Hide items ↑' : `View item breakdown (${bid.items.length} items) ↓`}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-gray-50"
                    >
                      <div className="px-4 py-3">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-gray-400 border-b border-gray-50">
                              <th className="pb-1.5 text-left font-semibold">Item</th>
                              <th className="pb-1.5 text-right font-semibold">Qty</th>
                              <th className="pb-1.5 text-right font-semibold">Price</th>
                              <th className="pb-1.5 text-right font-semibold">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bid.items.map((item, i) => (
                              <tr key={i} className="border-b border-gray-50 last:border-0">
                                <td className="py-1.5 font-medium text-gray-700">{item.name}</td>
                                <td className="py-1.5 text-right text-gray-500">{Number(item.quantity)} {item.unit}</td>
                                <td className="py-1.5 text-right text-gray-500">₹{Number(item.unit_price).toFixed(2)}</td>
                                <td className="py-1.5 text-right font-semibold text-gray-800">₹{Number(item.total_price).toFixed(0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Accept button */}
                {isOpen && bid.status === 'PENDING' && (
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => handleAccept(bid.id)}
                      disabled={acceptingBidId !== null}
                      className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                    >
                      {acceptingBidId === bid.id
                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Accepting…</>
                        : '✓ यह Bid Accept करें'}
                    </button>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Cancel requirement */}
      {isOpen && (
        <div className="mt-6">
          {!showCancel ? (
            <button onClick={() => setShowCancel(true)} className="w-full py-3 border border-gray-200 text-gray-400 text-sm font-semibold rounded-2xl hover:border-red-200 hover:text-red-400 transition-colors">
              Requirement Cancel करें
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
              <p className="text-sm font-semibold text-red-700 mb-3">क्या आप sure हैं? सभी bids reject हो जाएंगी।</p>
              <div className="flex gap-3">
                <button onClick={() => setShowCancel(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold">
                  रहने दें
                </button>
                <button onClick={handleCancel} disabled={cancelling}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold disabled:opacity-50">
                  {cancelling ? 'Cancelling…' : 'हाँ, Cancel करें'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
