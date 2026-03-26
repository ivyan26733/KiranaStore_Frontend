'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

/**
 * Reusable sticky app header.
 * Props:
 *   title      – main heading (English)
 *   titleHi    – Hindi subtitle (optional)
 *   back       – show back chevron  (boolean)
 *   right      – right slot (ReactNode)
 */
export default function AppHeader({ title, titleHi, back = false, right }) {
  const router = useRouter()

  return (
    <div className="sticky top-0 z-40 bg-[#fffbf5]/90 backdrop-blur-md border-b border-orange-100/60">
      <div className="max-w-[480px] mx-auto px-4 h-14 flex items-center gap-3">
        {back && (
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => router.back()}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:bg-orange-50 shrink-0 -ml-1"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-bold text-gray-900 leading-tight truncate">{title}</h1>
          {titleHi && <p className="text-[11px] text-gray-400 leading-tight">{titleHi}</p>}
        </div>

        {right && <div className="shrink-0">{right}</div>}
      </div>
    </div>
  )
}
