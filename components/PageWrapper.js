'use client'

import { motion } from 'framer-motion'

// Wraps every page with a subtle fade+slide-up entrance
export default function PageWrapper({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
