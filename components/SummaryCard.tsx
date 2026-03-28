'use client'

import { motion } from 'framer-motion'

interface SummaryCardProps {
  label: string
  labelHi: string
  value: string | number
  icon: string
  color?: 'orange' | 'green' | 'yellow' | 'blue'
  delay?: number
}

export default function SummaryCard({ label, labelHi, value, icon, color = 'orange', delay = 0 }: SummaryCardProps) {
  const colorMap: Record<string, string> = {
    orange: 'bg-orange-50 border-orange-100 text-orange-600',
    green:  'bg-green-50  border-green-100  text-green-600',
    yellow: 'bg-yellow-50 border-yellow-100 text-yellow-600',
    blue:   'bg-blue-50   border-blue-100   text-blue-600',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.28 }}
      className={`rounded-2xl border p-4 ${colorMap[color]}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs font-medium text-gray-500 mt-1">{labelHi} · {label}</p>
    </motion.div>
  )
}
