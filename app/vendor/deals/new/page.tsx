'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createDeal } from '@/lib/vendorApi'
import { useVendorStore } from '@/lib/vendorStore'
import toast from 'react-hot-toast'

const UNITS = ['cases', 'kg', 'units', 'cartons', 'litres', 'packs', 'dozens', 'pieces']
const CATEGORIES = ['Dairy', 'Atta/Grains', 'Oil/Ghee', 'Masale', 'Snacks', 'Drinks', 'Household', 'Personal Care', 'Tobacco', 'Frozen', 'Other']

interface DealItem { name: string; category: string; quantity: string; unit: string; price_per_unit: string; min_order_qty: string }
const emptyItem = (): DealItem => ({ name: '', category: '', quantity: '', unit: 'cases', price_per_unit: '', min_order_qty: '' })

export default function NewDeal() {
  const router = useRouter()
  const { vendor } = useVendorStore()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const [items, setItems] = useState<DealItem[]>([emptyItem()])
  const [title, setTitle] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')

  function updateItem(idx: number, field: keyof DealItem, val: string) {
    setItems(p => p.map((item, i) => i === idx ? { ...item, [field]: val } : item))
  }

  function validateStep1() {
    const invalid = items.some(i => !i.name.trim() || !i.quantity || Number(i.quantity) <= 0 || !i.price_per_unit || Number(i.price_per_unit) <= 0)
    if (invalid) { toast.error('हर item का नाम, quantity और price भरें'); return false }
    return true
  }

  async function handleSubmit() {
    if (!title.trim()) { toast.error('Deal का title डालें'); return }
    setSubmitting(true)
    try {
      await createDeal({
        title: title.trim(),
        valid_until: validUntil || undefined,
        notes: notes.trim() || undefined,
        items: items.map(i => ({
          name: i.name.trim(),
          category: i.category || undefined,
          quantity: Number(i.quantity),
          unit: i.unit,
          price_per_unit: Number(i.price_per_unit),
          min_order_qty: i.min_order_qty ? Number(i.min_order_qty) : undefined,
        })),
      })
      toast.success('Deal post हो गई!')
      router.replace('/vendor/deals')
    } catch {
      toast.error('Deal post नहीं हो सकी')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => step === 1 ? router.back() : setStep(1)}
          className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-extrabold text-slate-800">New Deal Post</h1>
          <p className="text-xs text-slate-400">Step {step} of 2 · {vendor?.city}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 h-1.5 rounded-full bg-indigo-600" />
        <div className={`flex-1 h-1.5 rounded-full transition-all ${step === 2 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <p className="text-sm font-bold text-slate-700 mb-4">आप क्या बेचना चाहते हैं?</p>

            <div className="flex flex-col gap-3 mb-4">
              {items.map((item, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start gap-2 mb-2">
                    <input
                      type="text"
                      placeholder={`Item ${idx + 1} (जैसे: Amul Butter, Maggi…)`}
                      value={item.name}
                      onChange={e => updateItem(idx, 'name', e.target.value)}
                      className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                    />
                    {items.length > 1 && (
                      <button onClick={() => setItems(p => p.filter((_, i) => i !== idx))}
                        className="w-9 h-9 rounded-xl bg-red-50 text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Category */}
                  <select value={item.category} onChange={e => updateItem(idx, 'category', e.target.value)}
                    className="w-full mb-2 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 focus:ring-2 focus:ring-indigo-200 outline-none">
                    <option value="">Category (optional)</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Available Qty</label>
                      <div className="flex gap-1">
                        <input type="number" min="0.1" step="0.1" placeholder="Qty"
                          value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)}
                          className="w-20 px-2 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 outline-none" />
                        <select value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)}
                          className="flex-1 px-2 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 outline-none">
                          {UNITS.map(u => <option key={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Price / Unit (₹)</label>
                      <input type="number" min="0" step="0.01" placeholder="0.00"
                        value={item.price_per_unit} onChange={e => updateItem(idx, 'price_per_unit', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 outline-none" />
                    </div>
                  </div>

                  <div className="mt-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Min Order Qty (optional)</label>
                    <input type="number" min="0" step="0.1" placeholder="Minimum order quantity"
                      value={item.min_order_qty} onChange={e => updateItem(idx, 'min_order_qty', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-200 outline-none" />
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setItems(p => [...p, emptyItem()])}
              className="w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-600 font-bold text-sm rounded-2xl hover:bg-indigo-50 transition-colors mb-6">
              + और Item add करें
            </button>

            <button onClick={() => { if (validateStep1()) setStep(2) }}
              className="w-full py-4 bg-indigo-600 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-indigo-200">
              Next: Deal Details →
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <p className="text-sm font-bold text-slate-700 mb-4">Deal Details</p>

            {/* Items summary */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-5">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Your Items</p>
              {items.filter(i => i.name).map((item, i) => (
                <div key={i} className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700 font-medium">{item.name}</span>
                  <span className="text-slate-500">{item.quantity} {item.unit} @ ₹{item.price_per_unit}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">Deal Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="जैसे: Fresh Amul Stock Arrived — Delhi NCR"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">Valid Until (optional)</label>
                <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 outline-none" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">Notes (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  placeholder="Payment terms, delivery area, special conditions…"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-200 outline-none resize-none" />
              </div>
            </div>

            <button onClick={handleSubmit} disabled={submitting}
              className="mt-6 w-full py-4 bg-indigo-600 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting
                ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Posting…</>
                : '📢 Deal Post करें'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
