'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import api from "@/lib/api"
import toast from 'react-hot-toast'

const UNITS = ['cases', 'kg', 'units', 'cartons', 'litres', 'packs', 'dozens', 'pieces']
const CREDIT_OPTIONS = ['Cash', 'Net-7', 'Net-14', 'Net-30']

interface Item { name: string; quantity: string; unit: string; notes: string }

const emptyItem = (): Item => ({ name: '', quantity: '1', unit: 'units', notes: '' })

export default function NewRequirement() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  // Step 1 — Items
  const [items, setItems] = useState<Item[]>([emptyItem()])

  // Step 2 — Delivery details
  const [title, setTitle] = useState('')
  const [deliveryBy, setDeliveryBy] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [creditTerms, setCreditTerms] = useState('Cash')
  const [notes, setNotes] = useState('')

  function addItem() { setItems(p => [...p, emptyItem()]) }
  function removeItem(idx: number) { if (items.length > 1) setItems(p => p.filter((_, i) => i !== idx)) }
  function updateItem(idx: number, field: keyof Item, val: string) {
    setItems(p => p.map((item, i) => i === idx ? { ...item, [field]: val } : item))
  }

  function validateStep1() {
    const invalid = items.some(i => !i.name.trim() || !i.quantity || Number(i.quantity) <= 0)
    if (invalid) { toast.error('सभी items का नाम और quantity भरें'); return false }
    return true
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      await api.post('/procurement/requirements', {
        title: title.trim() || undefined,
        items: items.map(i => ({
          name: i.name.trim(),
          quantity: Number(i.quantity),
          unit: i.unit,
          notes: i.notes.trim() || undefined,
        })),
        delivery_by: deliveryBy || undefined,
        delivery_address: deliveryAddress.trim() || undefined,
        credit_terms: creditTerms,
        notes: notes.trim() || undefined,
      })
      toast.success('Requirement post हो गई!')
      router.replace('/procurement')
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-[480px] mx-auto px-4 pb-24 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => step === 1 ? router.back() : setStep(1)}
          className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-extrabold text-gray-900">नई Requirement</h1>
          <p className="text-xs text-gray-400">Step {step} of 2</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 h-1.5 rounded-full bg-orange-500" />
        <div className={`flex-1 h-1.5 rounded-full transition-all ${step === 2 ? 'bg-orange-500' : 'bg-gray-100'}`} />
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Items ── */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <p className="text-sm font-bold text-gray-700 mb-4">आपको क्या चाहिए?</p>

            <div className="flex flex-col gap-3 mb-4">
              {items.map((item, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder={`Item ${idx + 1} (जैसे: Maggi, Tata Salt…)`}
                        value={item.name}
                        onChange={e => updateItem(idx, 'name', e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-100 rounded-xl text-sm placeholder:text-gray-300 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition"
                      />
                    </div>
                    {items.length > 1 && (
                      <button onClick={() => removeItem(idx)}
                        className="w-9 h-9 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors flex items-center justify-center shrink-0 mt-0.5">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="number" min="0.1" step="0.1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={e => updateItem(idx, 'quantity', e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                    />
                    <select value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-200 outline-none">
                      {UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Notes (optional) — जैसे: 12-pack only, fresh stock"
                    value={item.notes}
                    onChange={e => updateItem(idx, 'notes', e.target.value)}
                    className="w-full mt-2 px-3 py-2 border border-gray-100 rounded-xl text-xs placeholder:text-gray-300 focus:ring-2 focus:ring-orange-200 outline-none transition"
                  />
                </div>
              ))}
            </div>

            <button onClick={addItem}
              className="w-full py-3 border-2 border-dashed border-orange-200 text-orange-500 font-bold text-sm rounded-2xl hover:bg-orange-50 transition-colors mb-6">
              + और Item add करें
            </button>

            <button
              onClick={() => { if (validateStep1()) setStep(2) }}
              className="w-full py-4 bg-orange-500 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-orange-200">
              Next: Delivery Details →
            </button>
          </motion.div>
        )}

        {/* ── Step 2: Details ── */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <p className="text-sm font-bold text-gray-700 mb-4">Delivery Details</p>

            {/* Summary */}
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-5">
              <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">Your Items</p>
              {items.filter(i => i.name).map((item, i) => (
                <div key={i} className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{item.name}</span>
                  <span className="text-gray-500">{item.quantity} {item.unit}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Title (optional)</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="जैसे: Weekly FMCG Restock"
                  className="w-full px-3.5 py-2.5 border border-gray-100 rounded-xl text-sm placeholder:text-gray-300 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1.5">Delivery By</label>
                  <input type="date" value={deliveryBy} onChange={e => setDeliveryBy(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-200 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1.5">Payment Terms</label>
                  <select value={creditTerms} onChange={e => setCreditTerms(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-200 outline-none">
                    {CREDIT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Delivery Address</label>
                <input type="text" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}
                  placeholder="जहाँ delivery आनी चाहिए"
                  className="w-full px-3.5 py-2.5 border border-gray-100 rounded-xl text-sm placeholder:text-gray-300 focus:ring-2 focus:ring-orange-200 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Additional Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  placeholder="कोई ख़ास बात जो vendor को पता होनी चाहिए"
                  className="w-full px-3.5 py-2.5 border border-gray-100 rounded-xl text-sm placeholder:text-gray-300 focus:ring-2 focus:ring-orange-200 outline-none resize-none" />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-6 w-full py-4 bg-orange-500 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-orange-200 disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting
                ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Post हो रहा है…</>
                : '📢 Requirement Post करें'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
