'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Input from '@/components/Input'
import Button from '@/components/Button'
import { useAuthStore } from '@/lib/store'
import { getMe } from '@/lib/api'

// In dev mode this page just sets a uid and moves on
export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleDevLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!phone || phone.length < 10) {
      toast.error('सही नंबर डालें (10 digits)')
      return
    }
    setLoading(true)
    try {
      // In dev mode, check if shopkeeper exists
      const res = await getMe()
      setAuth(res.data.shopkeeper, res.data.shop)
      toast.success('Welcome back! 👋')
      router.replace('/dashboard')
    } catch {
      // Not registered yet — go to onboarding
      router.replace('/onboarding')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fffbf5] flex flex-col items-center justify-center px-6">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-orange-100 to-transparent rounded-b-[60px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center shadow-xl shadow-orange-200 mb-4"
          >
            <span className="text-4xl">🏪</span>
          </motion.div>
          <h1 className="text-3xl font-extrabold text-gray-800">DukaaanOS</h1>
          <p className="text-gray-500 text-sm mt-1">अपनी दुकान, डिजिटल करें</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-card p-6 border border-orange-50">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Login करें</h2>
          <p className="text-sm text-gray-400 mb-6">अपना मोबाइल नंबर डालें</p>

          <form onSubmit={handleDevLogin} className="flex flex-col gap-4">
            <Input
              label="Mobile Number"
              labelHi="📱"
              type="tel"
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={10}
            />

            <Button type="submit" loading={loading}>
              आगे बढ़ें →
            </Button>
          </form>

          <p className="text-center text-xs text-gray-300 mt-4">
            OTP via Firebase · Dev mode active
          </p>
        </div>

        {/* Trust badges */}
        <div className="flex justify-center gap-6 mt-8 text-xs text-gray-400">
          <span>✅ Free forever</span>
          <span>✅ Hindi support</span>
          <span>✅ Offline ready</span>
        </div>
      </motion.div>
    </div>
  )
}
