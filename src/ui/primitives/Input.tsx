import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, id, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <input
        id={id}
        className={[
          'min-h-[44px] px-3 py-2 rounded-lg bg-slate-800 border text-white',
          'placeholder:text-slate-500 focus:outline-none focus:ring-2',
          error
            ? 'border-red-600 focus:ring-red-500'
            : 'border-slate-700 focus:ring-sky-500',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
