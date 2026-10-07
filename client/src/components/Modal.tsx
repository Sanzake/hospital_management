import { useEffect, type FormEvent, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { btnPrimary, btnSecondary } from '../ui'

type Props = {
  title: string
  children: ReactNode
  onClose: () => void
  onSubmit?: (event: FormEvent) => void
  submitLabel?: string
  busy?: boolean
  maxWidth?: string
}

export function Modal({
  title,
  children,
  onClose,
  onSubmit,
  submitLabel = 'Save',
  busy,
  maxWidth = 'max-w-lg',
}: Props) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5">
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {onSubmit ? (
          <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {children}
            </div>
            <div className="flex justify-end gap-2.5 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
              <button type="button" className={btnSecondary} onClick={onClose} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className={btnPrimary} disabled={busy}>
                {busy ? 'Saving…' : submitLabel}
              </button>
            </div>
          </form>
        ) : (
          <div className="overflow-y-auto px-6 py-5">{children}</div>
        )}
      </div>
    </div>
  )
}
