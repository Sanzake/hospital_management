import { AlertTriangle } from 'lucide-react'
import { btnDanger, btnSecondary } from '../ui'

type Props = {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  busy = false,
}: Props) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600 shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2.5">
          <button type="button" className={btnSecondary} onClick={onCancel} disabled={busy}>
            {cancelText}
          </button>
          <button type="button" className={btnDanger} onClick={onConfirm} disabled={busy}>
            {busy ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
