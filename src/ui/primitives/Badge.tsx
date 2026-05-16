import type { ReactNode } from 'react'

type BadgeVariant = 'slate' | 'sky' | 'amber' | 'red' | 'green'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  slate: 'bg-slate-800 text-slate-300 border-slate-700',
  sky: 'bg-sky-950 text-sky-300 border-sky-800',
  amber: 'bg-amber-950 text-amber-300 border-amber-800',
  red: 'bg-red-950 text-red-300 border-red-800',
  green: 'bg-green-950 text-green-300 border-green-800',
}

export default function Badge({ children, variant = 'slate' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${variantClasses[variant]}`}
    >
      {children}
    </span>
  )
}
