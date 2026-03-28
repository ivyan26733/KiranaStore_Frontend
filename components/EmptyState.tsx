import { ReactNode } from 'react'

interface EmptyStateProps {
  emoji?: string
  title: string
  subtitle?: string
  action?: ReactNode
}

export default function EmptyState({ emoji = '📦', title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <span className="text-6xl mb-4">{emoji}</span>
      <h3 className="text-lg font-bold text-gray-700">{title}</h3>
      {subtitle && <p className="text-sm text-gray-400 mt-1 max-w-xs">{subtitle}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
