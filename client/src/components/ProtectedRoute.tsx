import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../store/auth'

export function ProtectedRoute() {
  const { token, loading } = useAuth()
  if (loading) {
    return <div className="grid min-h-screen place-items-center text-slate-500">Loading…</div>
  }
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}

export function AdminRoute() {
  const { user, loading } = useAuth()
  if (loading) {
    return <div className="grid min-h-screen place-items-center text-slate-500">Loading…</div>
  }
  if (user?.role !== 'admin') return <Navigate to="/" replace />
  return <Outlet />
}
