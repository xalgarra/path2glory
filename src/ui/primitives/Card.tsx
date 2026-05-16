import type { ReactNode } from 'react'

interface CardProps {
  onClick?: () => void
  children: ReactNode
  className?: string
}

export default function Card({ onClick, children, className = '' }: CardProps) {
  const interactive = onClick !== undefined
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick()
            }
          : undefined
      }
      className={[
        'bg-slate-900 border border-slate-800 rounded-xl p-4',
        interactive
          ? 'cursor-pointer hover:border-slate-600 hover:bg-slate-800 transition-colors active:scale-[0.99]'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}
