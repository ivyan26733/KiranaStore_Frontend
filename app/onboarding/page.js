'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Input from '@/components/Input'
import Button from '@/components/Button'
import { useAuthStore } from '@/lib/store'
import { registerShop } from '@/lib/api'

const STEPS = ['basic', 'shop', 'done']

export default function OnboardingPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    shop_name: '',
    shop_city: '',
    language: 'hi',
  })

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.name || !form.phone || !form.shop_name) {
      toast.error('सभी जरूरी field भरें')
      return
    }
    setLoading(true)
    try {
      const res = await registerShop(form)
      setAuth(res.data.shopkeeper, res.data.shop)
      setStep(2) // done screen
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#fffbf5] flex items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180 }}
          className="text-center"
        >
          <div className="text-7xl mb-6">🎉</div>
          <h2 className="text-2xl font-extrabold text-gray-800">Dukaan Ready!</h2>
          <p className="text-gray-500 mt-2 text-sm">आपकी दुकान सेट हो गई। अब बिलिंग शुरू करें!</p>
          <Button className="mt-8" onClick={() => router.replace('/dashboard')}>
            Dashboard खोलें →
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fffbf5] px-6 py-10 flex flex-col max-w-sm mx-auto">
      {/* Header */}
      <div className="mb-8">
        <span className="text-4xl">🏪</span>
        <h1 className="text-2xl font-extrabold text-gray-800 mt-3">अपनी दुकान setup करें</h1>
        <p className="text-gray-400 text-sm mt-1">सिर्फ 2 minutes में ready</p>

        {/* Progress */}
        <div className="flex gap-2 mt-5">
          {[0, 1].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-orange-500' : 'bg-orange-100'}`} />
          ))}
        </div>
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col gap-4 flex-1"
      >
        {step === 0 && (
          <>
            <h2 className="text-lg font-bold text-gray-700">आपके बारे में</h2>
            <Input label="Your Name" labelHi="👤 नाम" placeholder="Ramesh Patel" value={form.name} onChange={(e) => update('name', e.target.value)} />
            <Input label="Mobile Number" labelHi="📱 नंबर" type="tel" placeholder="9876543210" value={form.phone} onChange={(e) => update('phone', e.target.value)} maxLength={10} />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700"><span className="text-orange-500">🌐 </span>भाषा · Language</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-orange-100 bg-white text-sm text-gray-800 focus:ring-2 focus:ring-orange-200"
                value={form.language}
                onChange={(e) => update('language', e.target.value)}
              >
                <option value="hi">हिंदी</option>
                <option value="gu">ગુજરાતી</option>
                <option value="mr">मराठी</option>
                <option value="ta">தமிழ்</option>
                <option value="te">తెలుగు</option>
              </select>
            </div>

            <div className="mt-auto pt-6">
              <Button onClick={() => form.name && form.phone ? setStep(1) : toast.error('नाम और नंबर भरें')}>
                आगे →
              </Button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-lg font-bold text-gray-700">दुकान की जानकारी</h2>
            <Input label="Shop Name" labelHi="🏪 दुकान का नाम" placeholder="Patel Kirana Store" value={form.shop_name} onChange={(e) => update('shop_name', e.target.value)} />
            <Input label="City" labelHi="📍 शहर" placeholder="Surat" value={form.shop_city} onChange={(e) => update('shop_city', e.target.value)} />

            <div className="mt-auto pt-6 flex flex-col gap-3">
              <Button onClick={handleSubmit} loading={loading}>
                दुकान शुरू करें 🎉
              </Button>
              <Button variant="ghost" onClick={() => setStep(0)}>
                ← वापस जाएं
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
