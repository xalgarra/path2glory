import type { ReactNode } from 'react'

interface RadioCardProps {
  selected: boolean
  onClick: () => void
  children: ReactNode
  disabled?: boolean
  multiSelect?: boolean
}

export default function RadioCard({
  selected,
  onClick,
  children,
  disabled = false,
  multiSelect = false,
}: RadioCardProps) {
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={selected}
      onClick={disabled ? undefined : onClick}
      onKeyDown={
        disabled
          ? undefined
          : (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick()
            }
      }
      className={[
        'relative flex items-start gap-3 p-4 rounded-xl border transition-colors min-h-[56px]',
        disabled
          ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800'
          : selected
            ? 'bg-sky-950 border-sky-600 cursor-pointer'
            : 'bg-slate-900 border-slate-800 hover:border-slate-600 cursor-pointer',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className={[
          'mt-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center border-2 transition-colors',
          multiSelect ? 'rounded' : 'rounded-full',
          selected ? 'bg-sky-600 border-sky-600' : 'border-slate-600',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {selected && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 12 12"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
