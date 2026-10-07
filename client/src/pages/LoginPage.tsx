import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Activity, Lock, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useAuth } from '../store/auth'
import { btnPrimary, inputClass } from '../ui'

export function LoginPage() {
  const { token, login } = useAuth()
  const [email, setEmail] = useState('admin@hospital.local')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (token) return <Navigate to="/" replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  function fillCreds(demoEmail: string, demoPass: string) {
    setEmail(demoEmail)
    setPassword(demoPass)
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-black p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white shadow-lg shadow-teal-500/25 mb-4">
              <Activity className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Hospital Manager</h1>
            <p className="mt-1.5 text-sm text-slate-400">
              Clinical Operations & Patient Visitor Hub
            </p>
          </div>

          {/* Quick Demo Fill Buttons for Testing */}
          <div className="mt-6 p-3 rounded-2xl bg-slate-800/60 border border-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 text-center">
              Quick test login:
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fillCreds('admin@hospital.local', 'admin123')}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-teal-600/20 py-1.5 px-2 text-xs font-medium text-teal-300 hover:bg-teal-600/30 transition-colors border border-teal-500/30"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin (seed)
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300">
                Staff Email
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  className={`${inputClass} pl-10 bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-teal-500/20`}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hospital.local"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  className={`${inputClass} pl-10 pr-10 bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-teal-500/20`}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              className={`${btnPrimary} mt-6 w-full py-3 shadow-md shadow-teal-600/30 font-semibold`}
              type="submit"
              disabled={busy}
            >
              {busy ? 'Authenticating...' : 'Sign in to Dashboard'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Protected internal system. All actions are logged and audited.
          </p>
        </div>
      </div>
    </div>
  )
}
