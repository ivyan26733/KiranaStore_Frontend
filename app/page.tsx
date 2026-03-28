'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

export default function Root() {
  const router = useRouter()
  const { isRegistered } = useAuthStore()

  useEffect(() => {
    // In dev mode, always go to dashboard since we bypass auth
    const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
    if (isDev || isRegistered) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [isRegistered, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#fffbf5]">
      <div className="flex flex-col items-center gap-4">
        <span className="text-5xl">🏪</span>
        <p className="text-orange-500 font-bold text-lg">DukaaanOS</p>
        <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    </div>
  )
}
