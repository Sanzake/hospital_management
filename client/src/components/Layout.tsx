import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ShieldCheck,
  CalendarClock,
  Mail,
  LogOut,
  Menu,
  X,
  Activity,
} from 'lucide-react'
import { useAuth } from '../store/auth'
import { ToastContainer } from './ToastContainer'

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAdmin = user?.role === 'admin'

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/patients', label: 'Patients', icon: Users },
    { to: '/visitors', label: 'Visitors', icon: UserCheck },
    ...(isAdmin
      ? [
          { to: '/staff', label: 'Staff Team', icon: ShieldCheck },
          { to: '/shifts', label: 'Shifts & Schedule', icon: CalendarClock },
          { to: '/emails', label: 'Email Logs', icon: Mail },
        ]
      : []),
  ]

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-teal-500/20 text-teal-300 shadow-xs shadow-teal-500/10'
        : 'text-slate-300 hover:bg-white/5 hover:text-white'
    }`

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U'

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <ToastContainer />

      {/* Mobile Header */}
      <div className="fixed top-0 inset-x-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-teal-950 px-4 text-white lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="font-semibold text-white">Hospital</span>
            <span className="text-teal-400 font-light ml-1">Manager</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-slate-300 hover:bg-teal-900"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 border-b border-slate-800/80 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-md shadow-teal-500/20">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold tracking-tight text-white">Hospital</h1>
              <span className="rounded-md bg-teal-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-teal-400">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400">Care & Operations</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3.5 py-5">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Main Menu
          </p>
          <nav className="flex flex-col gap-1">
            {links.map((link) => {
              const Icon = link.icon
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={navLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{link.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* User Card */}
        <div className="border-t border-slate-800/80 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.full_name}</p>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <p className="text-[11px] capitalize text-slate-400">{user?.role} Portal</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-rose-300 transition-colors"
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pt-16 lg:pt-0">
        <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
