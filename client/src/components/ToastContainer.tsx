import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useToast, type ToastType } from '../store/toast'

const icons: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const styles: Record<ToastType, string> = {
  success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  error: 'bg-rose-50 text-rose-900 border-rose-200',
  info: 'bg-sky-50 text-sky-900 border-sky-200',
}

const iconColors: Record<ToastType, string> = {
  success: 'text-emerald-600',
  error: 'text-rose-600',
  info: 'text-sky-600',
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const Icon = icons[toast.type]
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${styles[toast.type]}`}
          >
            <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconColors[toast.type]}`} />
            <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
