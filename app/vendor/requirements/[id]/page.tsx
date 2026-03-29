'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getVendorRequirementById, submitBid, withdrawBid } from '@/lib/vendorApi'
import toast from 'react-hot-toast'

interface RequirementItem { id: string; name: string; quantity: number; unit: string; notes?: string }
interface Requirement {
  id: string; title?: string; status: string; created_at: string
  delivery_by?: string; delivery_address?: string; credit_terms?: string; notes?: string
  items: RequirementItem[]
  shop: { name: string; city: string; address?: string }
}
interface BidItem { name: string; quantity: number; unit: string; unit_price: string | number; total_price: string | number; notes?: string }
interface ExistingBid {
  id: string; status: string; total_amount: string | number
  delivery_by?: string; credit_terms?: string; notes?: string
  items: BidItem[]
}

const CREDIT_OPTIONS = ['Cash', 'Net-7', 'Net-14', 'Net-30']
const UNITS = ['cases', 'kg', 'units', 'cartons', 'litres', 'packs', 'dozens']

export default function VendorRequirementDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)
  const [requirement, setRequirement] = useState<Requirement | null>(null)
  const [existingBid, setExistingBid] = useState<ExistingBid | null>(null)
  const [loading, setLoading] = useState(true)
  const [bidMode, setBidMode] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Bid form state
  const [bidItems, setBidItems] = useState<{ name: string; quantity: number; unit: string; unit_price: number; total_price: number; notes: string }[]>([])
  const [deliveryBy, setDeliveryBy] = useState('')
  const [creditTerms, setCreditTerms] = useState('Cash')
  const [notes, setNotes] = useState('')
  const [validUntil, setValidUntil] = useState('')

  useEffect(() => { params.then(p => setId(p.id)) }, [params])

  useEffect(() => {
    if (!id) return
    getVendorRequirementById(id)
      .then(res => {
        setRequirement(res.data.requirement)
        const bid = res.data.my_bid
        if (bid) {
          setExistingBid(bid)
        } else {
          // Pre-fill bid items from requirement items
          setBidItems(res.data.requirement.items.map((item: RequirementItem) => ({
            name: item.name, quantity: Number(item.quantity), unit: item.unit,
            unit_price: 0, total_price: 0, notes: '',
          })))
        }
      })
      .catch(() => toast.error('Requirement not found.'))
      .finally(() => setLoading(false))
  }, [id])

  const totalAmount = bidItems.reduce((s, i) => s + i.total_price, 0)

  function updateBidItem(idx: number, field: string, value: number | string) {
    setBidItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const updated = { ...item, [field]: value }
      if (field === 'unit_price' || field === 'quantity') {
        updated.total_price = Number(updated.unit_price) * Number(updated.quantity)
      }
      return updated
    }))
  }

  async function handleSubmitBid() {
    if (!id) return
    if (bidItems.some(i => i.unit_price <= 0)) { toast.error('Enter price for all items.'); return }
    setSubmitting(true)
    try {
      await submitBid(id, {
        items: bidItems,
        total_amount: totalAmount,
        delivery_by: deliveryBy || undefined,
        credit_terms: creditTerms,
        notes: notes || undefined,
        valid_until: validUntil || undefined,
      })
      toast.success(existingBid ? 'Bid updated!' : 'Bid submitted!')
      router.replace('/vendor/bids')
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to submit bid.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleWithdraw() {
    if (!existingBid) return
    if (!confirm('Withdraw your bid?')) return
    try {
      await withdrawBid(existingBid.id)
      toast.success('Bid withdrawn.')
      router.replace('/vendor/bids')
    } catch { toast.error('Could not withdraw bid.') }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  )
  if (!requirement) return <div className="text-center py-16 text-slate-400">Requirement not found.</div>

  return (
    <div className="max-w-3xl">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Back to Requirements
      </button>

      {/* Requirement card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-5">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              {requirement.title || requirement.items.map(i => i.name).join(', ')}
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">🏪 {requirement.shop.name} · {requirement.shop.city}</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">OPEN</span>
        </div>

        <div className="px-6 py-4">
          {/* Items table */}
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Items Required</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                  <th className="pb-2 font-semibold">Item</th>
                  <th className="pb-2 font-semibold text-right">Qty</th>
                  <th className="pb-2 font-semibold text-right">Unit</th>
                </tr>
              </thead>
              <tbody>
                {requirement.items.map(item => (
                  <tr key={item.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 font-medium text-slate-800">{item.name}</td>
                    <td className="py-2.5 text-right text-slate-600">{Number(item.quantity)}</td>
                    <td className="py-2.5 text-right text-slate-400">{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100 text-sm">
            {requirement.delivery_by && (
              <div>
                <p className="text-xs text-slate-400 font-medium">Delivery by</p>
                <p className="font-semibold text-slate-700 mt-0.5">{new Date(requirement.delivery_by).toLocaleDateString('en-IN')}</p>
              </div>
            )}
            {requirement.credit_terms && (
              <div>
                <p className="text-xs text-slate-400 font-medium">Credit</p>
                <p className="font-semibold text-slate-700 mt-0.5">{requirement.credit_terms}</p>
              </div>
            )}
            {requirement.delivery_address && (
              <div>
                <p className="text-xs text-slate-400 font-medium">Deliver to</p>
                <p className="font-semibold text-slate-700 mt-0.5 truncate">{requirement.delivery_address}</p>
              </div>
            )}
          </div>

          {requirement.notes && (
            <div className="mt-3 bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-600 italic">
              "{requirement.notes}"
            </div>
          )}
        </div>
      </div>

      {/* ── Existing bid (read-only) ── */}
      {existingBid && !bidMode && (
        <div className={`bg-white rounded-2xl border shadow-sm mb-5 ${
          existingBid.status === 'ACCEPTED' ? 'border-emerald-200' :
          existingBid.status === 'REJECTED' ? 'border-red-200' :
          'border-indigo-200'
        }`}>
          <div className={`px-6 py-4 border-b flex items-center justify-between ${
            existingBid.status === 'ACCEPTED' ? 'border-emerald-100 bg-emerald-50/50' :
            existingBid.status === 'REJECTED' ? 'border-red-100 bg-red-50/50' :
            'border-indigo-100 bg-indigo-50/50'
          }`}>
            <p className="font-bold text-slate-800">Your Bid</p>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                existingBid.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                existingBid.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-200' :
                'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {existingBid.status === 'ACCEPTED' ? '✓ Won' : existingBid.status === 'REJECTED' ? 'Not Selected' : 'Pending Review'}
              </span>
            </div>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-extrabold text-slate-800">₹{Number(existingBid.total_amount).toLocaleString('en-IN')}</span>
              <span className="text-slate-400 text-sm">total bid</span>
            </div>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                  <th className="pb-2 font-semibold">Item</th>
                  <th className="pb-2 text-right font-semibold">Qty</th>
                  <th className="pb-2 text-right font-semibold">Price/Unit</th>
                  <th className="pb-2 text-right font-semibold">Total</th>
                </tr></thead>
                <tbody>
                  {existingBid.items.map((item, i) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 font-medium text-slate-800">{item.name}</td>
                      <td className="py-2 text-right text-slate-600">{Number(item.quantity)} {item.unit}</td>
                      <td className="py-2 text-right text-slate-600">₹{Number(item.unit_price).toFixed(2)}</td>
                      <td className="py-2 text-right font-semibold text-slate-800">₹{Number(item.total_price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 text-xs text-slate-500">
              {existingBid.delivery_by && <span>📅 {new Date(existingBid.delivery_by).toLocaleDateString('en-IN')}</span>}
              {existingBid.credit_terms && <span>💳 {existingBid.credit_terms}</span>}
            </div>
            {existingBid.status === 'PENDING' && (
              <div className="flex gap-3 mt-4">
                <button onClick={() => { setBidMode(true); setBidItems(existingBid.items.map(i => ({ name: i.name, quantity: Number(i.quantity), unit: i.unit, unit_price: Number(i.unit_price), total_price: Number(i.total_price), notes: i.notes || '' }))); setCreditTerms(existingBid.credit_terms || 'Cash'); setNotes(existingBid.notes || '') }}
                  className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                  Revise Bid
                </button>
                <button onClick={handleWithdraw}
                  className="px-4 py-2.5 border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 transition-colors">
                  Withdraw
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bid form ── */}
      {(!existingBid || bidMode) && requirement.status === 'OPEN' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">{bidMode ? 'Revise Your Bid' : 'Submit a Bid'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Fill in your prices for each item</p>
          </div>
          <div className="px-6 py-5">
            {/* Items pricing */}
            <div className="space-y-3 mb-5">
              {bidItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">{item.name}</label>
                    <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 rounded-lg px-2 py-2">
                      {item.quantity} {item.unit}
                    </div>
                  </div>
                  <div className="col-span-3">
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">Price/Unit (₹)</label>
                    <input type="number" min="0" step="0.01" value={item.unit_price || ''}
                      onChange={e => updateBidItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                      placeholder="0.00" />
                  </div>
                  <div className="col-span-3">
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">Unit</label>
                    <select value={item.unit} onChange={e => updateBidItem(idx, 'unit', e.target.value)}
                      className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none">
                      {UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 text-right">
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">Total</label>
                    <p className="text-sm font-bold text-slate-800 py-2">₹{item.total_price.toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center bg-indigo-50 rounded-xl px-4 py-3 mb-5">
              <span className="font-semibold text-indigo-700">Total Bid Amount</span>
              <span className="text-2xl font-extrabold text-indigo-700">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>

            {/* Extra fields */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Delivery By</label>
                <input type="date" value={deliveryBy} onChange={e => setDeliveryBy(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Payment Terms</label>
                <select value={creditTerms} onChange={e => setCreditTerms(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 outline-none">
                  {CREDIT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="Any special conditions, packaging details, etc."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-200 outline-none resize-none" />
            </div>

            <div className="flex gap-3">
              {bidMode && (
                <button onClick={() => setBidMode(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm">
                  Cancel
                </button>
              )}
              <button onClick={handleSubmitBid} disabled={submitting || totalAmount === 0}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</>
                  : `${bidMode ? 'Update' : 'Submit'} Bid · ₹${totalAmount.toLocaleString('en-IN')}`
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
