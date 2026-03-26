'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'
import { createProduct, getProductByBarcode } from '@/lib/api'

// Dynamically imported — avoids SSR issues with camera APIs
const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false })

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 'barcode',  q: 'क्या product का barcode है?',              hint: 'Camera से scan करें या manually type करें' },
  { id: 'name',     q: 'Product का नाम क्या है?',                  hint: 'जैसे आप customers को बताते हैं' },
  { id: 'category', q: 'Category चुनें',                           hint: 'सही category से stock manage करना आसान होगा' },
  { id: 'unit',     q: 'किस unit में बिकता है?',                   hint: 'Piece, Kg, Litre...' },
  { id: 'price',    q: 'MRP और selling price बताएं',               hint: 'MRP = company price · Selling = आपका price' },
  { id: 'stock',    q: 'Opening stock कितना है?',                  hint: 'अभी जितना है — बाद में update होता रहेगा' },
  { id: 'confirm',  q: 'सब कुछ सही है?',                           hint: 'एक बार review करें फिर submit करें' },
]

const CATEGORIES = [
  { label: 'Dairy',         emoji: '🥛' }, { label: 'Atta/Grains',   emoji: '🌾' },
  { label: 'Oil/Ghee',      emoji: '🛢️' }, { label: 'Masale',         emoji: '🧂' },
  { label: 'Snacks',        emoji: '🍬' }, { label: 'Drinks',          emoji: '🥤' },
  { label: 'Household',     emoji: '🧹' }, { label: 'Personal Care',   emoji: '🧴' },
  { label: 'Vegetables',    emoji: '🥦' }, { label: 'Other',           emoji: '📦' },
]

const UNITS = [
  { label: 'Piece', value: 'piece', emoji: '1️⃣' }, { label: 'Kg',    value: 'kg',    emoji: '⚖️' },
  { label: 'Litre', value: 'litre', emoji: '🫙' }, { label: 'Pack',  value: 'pack',  emoji: '📦' },
  { label: 'Dozen', value: 'dozen', emoji: '🔢' },
]

const DRAFT_KEY = 'dukaanos_product_draft'
const STEP_KEY  = 'dukaanos_product_step'

// ─── Typing animation ─────────────────────────────────────────────────────────
function TypedText({ text, onDone }) {
  const [shown, setShown] = useState('')
  useEffect(() => {
    setShown('')
    let i = 0
    const t = setInterval(() => {
      setShown(text.slice(0, ++i))
      if (i >= text.length) { clearInterval(t); onDone?.() }
    }, 18)
    return () => clearInterval(t)
  }, [text])
  return <>{shown}{shown.length < text.length && <span className="text-orange-400 animate-pulse">|</span>}</>
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function Progress({ step, total }) {
  const pct = Math.round((step / (total - 1)) * 100)
  const labels = ['Almost starting...', 'Going well!', 'Halfway there!', 'More than half!', 'Almost done!', 'Last step!', 'Ready!']
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-gray-400 font-medium">{labels[Math.min(step, labels.length - 1)]}</span>
        <span className="text-[11px] font-bold text-orange-500">{pct}%</span>
      </div>
      <div className="h-1 bg-orange-100 rounded-full overflow-hidden">
        <motion.div className="h-full bg-orange-500 rounded-full" animate={{ width: `${pct}%` }} transition={{ duration: 0.45, ease: 'easeOut' }} />
      </div>
    </div>
  )
}

export default function NewProductPage() {
  const router = useRouter()
  const inputRef = useRef(null)
  const [step, setStep] = useState(0)
  const [typingDone, setTypingDone] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [barcodeLoading, setBarcodeLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    barcode: '', name: '', category: '', unit: 'piece',
    mrp: '', selling_price: '', current_stock: '0', low_stock_alert: '5',
  })

  // ── Draft restore ──
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY)
      const savedStep = localStorage.getItem(STEP_KEY)
      if (draft) {
        setForm(JSON.parse(draft))
        if (savedStep && parseInt(savedStep) > 0) {
          setStep(parseInt(savedStep))
          toast('Draft restore हुआ — जहाँ छोड़ा था वहाँ से शुरू 💾', { duration: 2500 })
        }
      }
    } catch { /* ignore */ }
  }, [])

  // ── Auto-save ──
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
    localStorage.setItem(STEP_KEY, String(step))
  }, [form, step])

  // ── Focus input when step changes ──
  useEffect(() => {
    if (typingDone) setTimeout(() => inputRef.current?.focus(), 80)
  }, [typingDone, step])

  function update(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function goTo(n) { setTypingDone(false); setStep(n) }

  // ── Barcode scan result ──
  async function handleBarcode(code) {
    setShowScanner(false)
    update('barcode', code)
    setBarcodeLoading(true)
    try {
      const res = await getProductByBarcode(code)
      const p = res.data.product
      setForm(f => ({
        ...f, barcode: code,
        name: p.name, category: p.category || f.category,
        mrp: String(p.mrp), selling_price: String(p.selling_price), unit: p.unit || f.unit,
      }))
      toast.success('Product मिला! Details auto-fill हुए ✅')
    } catch {
      toast('New product — manually fill करें ✏️', { icon: '🆕' })
    } finally {
      setBarcodeLoading(false)
      goTo(1)
    }
  }

  // ── Validation ──
  function canGoNext() {
    const id = STEPS[step].id
    if (id === 'name')     return form.name.trim().length > 1
    if (id === 'category') return !!form.category
    if (id === 'price')    return parseFloat(form.mrp) > 0 && parseFloat(form.selling_price) > 0
    return true
  }

  function next() {
    if (!canGoNext()) { toast.error('यह field जरूरी है'); return }
    if (step < STEPS.length - 1) goTo(step + 1)
  }

  // ── Submit ──
  async function handleSubmit() {
    setSubmitting(true)
    try {
      await createProduct({
        name: form.name.trim(), barcode: form.barcode || undefined,
        category: form.category, unit: form.unit,
        mrp: parseFloat(form.mrp), selling_price: parseFloat(form.selling_price),
        current_stock: parseInt(form.current_stock) || 0,
        low_stock_alert: parseInt(form.low_stock_alert) || 5,
      })
      localStorage.removeItem(DRAFT_KEY)
      localStorage.removeItem(STEP_KEY)
      toast.success('Product add हो गया! 🎉')
      router.replace('/products')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submit नहीं हुआ')
    } finally {
      setSubmitting(false)
    }
  }

  const current = STEPS[step]

  return (
    <>
      {/* Barcode scanner overlay */}
      <AnimatePresence>
        {showScanner && (
          <BarcodeScanner onDetect={handleBarcode} onClose={() => setShowScanner(false)} />
        )}
      </AnimatePresence>

      <div className="max-w-[480px] mx-auto min-h-screen flex flex-col bg-[#fffbf5]">

        {/* ── Top bar ──────────────────────────────────────────────────── */}
        <div className="px-5 pt-5 pb-4 border-b border-orange-100/60">
          <div className="flex items-center justify-between mb-4">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => step === 0 ? router.back() : goTo(step - 1)}
              className="w-9 h-9 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>
            <p className="text-xs font-semibold text-gray-400">
              Step {step + 1} / {STEPS.length}
            </p>
            <button
              onClick={() => { localStorage.removeItem(DRAFT_KEY); localStorage.removeItem(STEP_KEY); router.back() }}
              className="text-xs text-gray-400 font-medium py-1 px-2"
            >
              Cancel
            </button>
          </div>
          <Progress step={step} total={STEPS.length} />
        </div>

        {/* ── Chat bubble ──────────────────────────────────────────────── */}
        <div className="px-5 pt-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-2xl bg-orange-500 flex items-center justify-center text-lg shrink-0 shadow-md shadow-orange-200 mt-0.5">
                🏪
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm border border-gray-100 px-4 py-3 shadow-sm flex-1">
                <p className="text-[15px] font-semibold text-gray-800 leading-snug">
                  <TypedText text={current.q} onDone={() => setTypingDone(true)} />
                </p>
                {typingDone && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-gray-400 mt-1">
                    {current.hint}
                  </motion.p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Input area ───────────────────────────────────────────────── */}
        <div className="flex-1 px-5 pt-5 pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, delay: 0.08 }}
              className="flex flex-col gap-3"
            >

              {/* BARCODE */}
              {current.id === 'barcode' && (
                <>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setShowScanner(true)}
                    className="w-full flex items-center justify-center gap-3 py-5 bg-orange-500 text-white rounded-2xl shadow-lg shadow-orange-200 font-bold text-base"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9V6a1 1 0 011-1h3M3 15v3a1 1 0 001 1h3m11-4v3a1 1 0 01-1 1h-3m4-12h-3a1 1 0 00-1 1v3M8 6h.01M8 12h.01M8 18h.01M12 6h.01M12 12h.01M12 18h.01M16 6h.01M16 12h.01M16 18h.01" />
                    </svg>
                    📷 Camera से Scan करें
                  </motion.button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-400 font-medium">या manually type करें</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text" inputMode="numeric"
                      placeholder="Barcode number…"
                      value={form.barcode}
                      onChange={(e) => update('barcode', e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleBarcode(form.barcode)}
                      className="flex-1 px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-300 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 font-mono tracking-widest transition"
                    />
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={() => form.barcode ? handleBarcode(form.barcode) : goTo(1)}
                      disabled={barcodeLoading}
                      className="px-4 py-3.5 bg-gray-800 text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-2"
                    >
                      {barcodeLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '→'}
                    </motion.button>
                  </div>

                  <button onClick={() => goTo(1)} className="text-sm text-gray-400 font-medium text-center py-1">
                    Barcode नहीं है, skip करें →
                  </button>
                </>
              )}

              {/* NAME */}
              {current.id === 'name' && (
                <>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="जैसे: Amul Butter 500g"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && next()}
                    className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl text-base text-gray-800 placeholder:text-gray-300 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition"
                  />
                  <NextBtn onClick={next} disabled={!form.name.trim()} />
                </>
              )}

              {/* CATEGORY */}
              {current.id === 'category' && (
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((c) => (
                    <motion.button key={c.label} whileTap={{ scale: 0.93 }}
                      onClick={() => { update('category', c.label); setTimeout(next, 200) }}
                      className={`flex flex-col items-center gap-1.5 py-3.5 rounded-2xl border-2 transition-all ${
                        form.category === c.label
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-100 bg-white'
                      }`}
                    >
                      <span className="text-2xl">{c.emoji}</span>
                      <span className={`text-[11px] font-semibold ${form.category === c.label ? 'text-orange-600' : 'text-gray-500'}`}>
                        {c.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* UNIT */}
              {current.id === 'unit' && (
                <div className="grid grid-cols-3 gap-2">
                  {UNITS.map((u) => (
                    <motion.button key={u.value} whileTap={{ scale: 0.93 }}
                      onClick={() => { update('unit', u.value); setTimeout(next, 200) }}
                      className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all ${
                        form.unit === u.value
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-100 bg-white'
                      }`}
                    >
                      <span className="text-2xl">{u.emoji}</span>
                      <span className={`text-xs font-bold ${form.unit === u.value ? 'text-orange-600' : 'text-gray-500'}`}>
                        {u.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* PRICE */}
              {current.id === 'price' && (
                <>
                  <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">MRP</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-300">₹</span>
                        <input ref={inputRef} type="number" inputMode="decimal" placeholder="0"
                          value={form.mrp} onChange={(e) => update('mrp', e.target.value)}
                          className="w-full pl-8 pr-4 py-3.5 border border-gray-200 rounded-xl text-xl font-bold text-gray-700 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Selling Price (आपका)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-orange-300">₹</span>
                        <input type="number" inputMode="decimal" placeholder="0"
                          value={form.selling_price} onChange={(e) => update('selling_price', e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && next()}
                          className="w-full pl-8 pr-4 py-3.5 border border-gray-200 rounded-xl text-xl font-bold text-orange-500 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition"
                        />
                      </div>
                    </div>
                    {form.mrp && form.selling_price && parseFloat(form.mrp) > parseFloat(form.selling_price) && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-xs text-green-700 font-semibold">
                        ✅ ₹{(parseFloat(form.mrp) - parseFloat(form.selling_price)).toFixed(0)} discount on MRP
                      </motion.div>
                    )}
                  </div>
                  <NextBtn onClick={next} disabled={!form.mrp || !form.selling_price} />
                </>
              )}

              {/* STOCK */}
              {current.id === 'stock' && (
                <>
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col items-center gap-4">
                    <p className="text-[52px] font-extrabold text-gray-800 tabular-nums leading-none">
                      {parseInt(form.current_stock) || 0}
                    </p>
                    <div className="flex items-center gap-4">
                      <motion.button whileTap={{ scale: 0.88 }}
                        onClick={() => update('current_stock', String(Math.max(0, (parseInt(form.current_stock) || 0) - 1)))}
                        className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-600 text-2xl font-bold flex items-center justify-center"
                      >−</motion.button>
                      <input type="number" inputMode="numeric" value={form.current_stock}
                        onChange={(e) => update('current_stock', e.target.value)}
                        className="w-20 text-center py-2.5 border border-gray-200 rounded-xl text-lg font-bold text-gray-800 focus:ring-2 focus:ring-orange-200"
                      />
                      <motion.button whileTap={{ scale: 0.88 }}
                        onClick={() => update('current_stock', String((parseInt(form.current_stock) || 0) + 1))}
                        className="w-14 h-14 rounded-2xl bg-orange-500 text-white text-2xl font-bold flex items-center justify-center shadow-lg shadow-orange-200"
                      >+</motion.button>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100 w-full justify-center">
                      <span className="text-xs text-gray-400">Low stock alert at</span>
                      <input type="number" inputMode="numeric" value={form.low_stock_alert}
                        onChange={(e) => update('low_stock_alert', e.target.value)}
                        className="w-16 text-center py-1.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-700"
                      />
                      <span className="text-xs text-gray-400">items</span>
                    </div>
                  </div>
                  <NextBtn onClick={next} label="Review करें →" />
                </>
              )}

              {/* CONFIRM */}
              {current.id === 'confirm' && (
                <>
                  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                    {[
                      { k: 'Name',     v: form.name,                             s: 1 },
                      { k: 'Category', v: form.category,                         s: 2 },
                      { k: 'Unit',     v: form.unit,                             s: 3 },
                      { k: 'MRP',      v: `₹${form.mrp}`,                       s: 4 },
                      { k: 'Price',    v: `₹${form.selling_price}`,             s: 4 },
                      { k: 'Stock',    v: `${form.current_stock} ${form.unit}`, s: 5 },
                      ...(form.barcode ? [{ k: 'Barcode', v: form.barcode, s: 0 }] : []),
                    ].map((row, i, arr) => (
                      <div key={row.k} className={`flex items-center px-4 py-3 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider w-20 shrink-0">{row.k}</span>
                        <span className="text-sm font-semibold text-gray-800 flex-1 truncate">{row.v || '—'}</span>
                        <button onClick={() => goTo(row.s)} className="text-xs text-orange-400 font-bold ml-2 shrink-0 hover:text-orange-600">Edit</button>
                      </div>
                    ))}
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-4 bg-orange-500 text-white font-bold text-base rounded-2xl shadow-xl shadow-orange-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting
                      ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Adding…</>
                      : '🎉 Product Add करें'
                    }
                  </motion.button>
                </>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </>
  )
}

function NextBtn({ onClick, disabled, label = 'आगे बढ़ें →' }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className="w-full py-4 bg-orange-500 text-white font-bold text-base rounded-2xl shadow-lg shadow-orange-200 disabled:opacity-40 transition"
    >
      {label}
    </motion.button>
  )
}
