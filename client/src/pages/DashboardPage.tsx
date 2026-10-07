import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  UserCheck,
  ShieldCheck,
  CalendarClock,
  Mail,
  ArrowRight,
  UserPlus,
  Clock,
  Sparkles,
} from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../store/auth'
import type { Stats } from '../types'

export function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api<Stats>('/auth/stats')
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const cards = [
    {
      label: 'Total Patients',
      value: stats?.patients,
      to: '/patients',
      icon: Users,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      desc: 'Active medical records',
    },
    {
      label: 'Open Visits',
      value: stats?.openVisits,
      to: '/visitors',
      icon: UserCheck,
      color: 'from-sky-500 to-blue-600',
      textColor: 'text-sky-700',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-100',
      desc: 'Visitors currently on-site',
      highlight: (stats?.openVisits || 0) > 0,
    },
  ]

  if (user?.role === 'admin') {
    cards.push(
      {
        label: 'Clinical Staff',
        value: stats?.staff,
        to: '/staff',
        icon: ShieldCheck,
        color: 'from-violet-500 to-indigo-600',
        textColor: 'text-violet-700',
        bgColor: 'bg-violet-50',
        borderColor: 'border-violet-100',
        desc: 'Registered team members',
      },
      {
        label: 'Scheduled Shifts',
        value: stats?.shifts,
        to: '/shifts',
        icon: CalendarClock,
        color: 'from-amber-500 to-orange-600',
        textColor: 'text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-100',
        desc: 'Work roster entries',
      },
      {
        label: 'Summary Emails',
        value: stats?.emails,
        to: '/emails',
        icon: Mail,
        color: 'from-rose-500 to-pink-600',
        textColor: 'text-rose-700',
        bgColor: 'bg-rose-50',
        borderColor: 'border-rose-100',
        desc: 'Sent visit summaries',
      },
    )
  }

  const [currentDate] = useState(() =>
    new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  )

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="h-4 w-4" />
              <span>{currentDate}</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
              Hello, {user?.full_name}
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Welcome back to your hospital management station. Track active visitors, manage patient care, and monitor department schedules in real time.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/visitors"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-400 transition-colors"
            >
              <UserCheck className="h-4 w-4" />
              <span>Check-in Visitor</span>
            </Link>
            <Link
              to="/patients"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Patient</span>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Department Overview</h2>
          <span className="text-xs text-slate-500">Live indicators</span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-36 rounded-2xl border border-slate-200 bg-white p-5 animate-pulse"
                />
              ))
            : cards.map((card) => {
                const Icon = card.icon
                return (
                  <Link
                    key={card.label}
                    to={card.to}
                    className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:shadow-md hover:border-teal-500/40 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr ${card.color} text-white shadow-md shadow-teal-500/10`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      {card.highlight && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          Live Now
                        </span>
                      )}
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {card.label}
                      </p>
                      <div className="flex items-baseline justify-between mt-1">
                        <p className="text-3xl font-extrabold tracking-tight text-slate-900">
                          {card.value ?? 0}
                        </p>
                        <span className="text-xs font-medium text-teal-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          Manage <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{card.desc}</p>
                    </div>
                  </Link>
                )
              })}
        </div>
      </div>

      {/* Operational Quick Guide */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-teal-600" />
          <span>Workflow Automation & Reminders</span>
        </h3>
        <div className="grid gap-4 md:grid-cols-3 text-sm text-slate-600">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="font-semibold text-slate-900 block mb-1">1. Visitor Check-in</span>
            Log visiting relatives and assign them to active admitted patients.
          </div>
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="font-semibold text-slate-900 block mb-1">2. Complete Visit</span>
            Summarize doctor remarks or updates upon check-out.
          </div>
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="font-semibold text-slate-900 block mb-1">3. Automated Email</span>
            System instantly emails formatted visit details to patient or family contact.
          </div>
        </div>
      </div>
    </div>
  )
}
