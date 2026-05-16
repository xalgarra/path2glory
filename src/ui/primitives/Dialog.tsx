import { useEffect, useRef } from 'react'
import Button from './Button'

interface DialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export default function Dialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open) {
      if (!el.open) el.showModal()
    } else {
      if (el.open) el.close()
    }
  }, [open])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handleCancel = (e: Event) => {
      e.preventDefault()
      onCancel()
    }
    el.addEventListener('cancel', handleCancel)
    return () => el.removeEventListener('cancel', handleCancel)
  }, [onCancel])

  return (
    <dialog
      ref={ref}
      className="bg-slate-900 text-white rounded-xl p-6 max-w-sm w-full mx-4 border border-slate-700 backdrop:bg-black/60"
    >
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      {description && <p className="text-slate-400 text-sm mb-6">{description}</p>}
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}
