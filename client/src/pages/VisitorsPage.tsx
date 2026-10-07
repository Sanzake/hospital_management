import { useEffect, useState, useMemo, type FormEvent } from 'react'
import {
  UserCheck,
  Search,
  Clock,
  Send,
  Eye,
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle2,
  User,
} from 'lucide-react'
import { api } from '../api'
import { Modal } from '../components/Modal'
import { ConfirmModal } from '../components/ConfirmModal'
import { useAuth } from '../store/auth'
import { useToast } from '../store/toast'
import type { Patient, Visit } from '../types'
import {
  btnDanger,
  btnGhost,
  btnPrimary,
  btnSecondary,
  inputClass,
  selectClass,
  tableClass,
  tdClass,
  thClass,
  trHoverClass,
} from '../ui'

const empty = { patient_id: '', visitor_name: '' }

function formatWhen(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getDuration(checkIn: string, checkOut: string | null) {
  const start = new Date(checkIn).getTime()
  const end = checkOut ? new Date(checkOut).getTime() : Date.now()
  const diffMinutes = Math.floor((end - start) / (1000 * 60))

  if (diffMinutes < 1) return 'Just started'
  if (diffMinutes < 60) return `${diffMinutes}m`
  const hours = Math.floor(diffMinutes / 60)
  const mins = diffMinutes % 60
  return `${hours}h ${mins}m`
}

export function VisitorsPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<Visit[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all')

  const [editing, setEditing] = useState<Visit | null>(null)
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState<Visit | null>(null)
  const [viewingSummary, setViewingSummary] = useState<Visit | null>(null)
  const [deleting, setDeleting] = useState<Visit | null>(null)
  const [summary, setSummary] = useState('')
  const [form, setForm] = useState(empty)
  const [busy, setBusy] = useState(false)

  const { addToast } = useToast()

  async function load() {
    try {
      const [visits, patientRows] = await Promise.all([
        api<Visit[]>('/visitors'),
        api<Patient[]>('/patients'),
      ])
      setRows(visits)
      setPatients(patientRows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load visits')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filteredRows = useMemo(() => {
    return rows.filter((visit) => {
      const pName = visit.patients?.full_name || ''
      const matchSearch =
        search.trim() === '' ||
        visit.visitor_name.toLowerCase().includes(search.toLowerCase()) ||
        pName.toLowerCase().includes(search.toLowerCase())

      const matchStatus = statusFilter === 'all' || visit.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [rows, search, statusFilter])

  function startCreate() {
    setEditing(null)
    setForm({ patient_id: patients[0]?.id || '', visitor_name: '' })
    setOpen(true)
  }

  function startEdit(row: Visit) {
    setEditing(row)
    setForm({ patient_id: row.patient_id, visitor_name: row.visitor_name })
    setOpen(true)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!form.patient_id) {
      addToast('Please select an admitted patient', 'error')
      return
    }
    setBusy(true)
    setError('')
    try {
      if (editing) {
        await api(`/visitors/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) })
        addToast(`Visit for "${form.visitor_name}" updated`, 'success')
      } else {
        await api('/visitors', { method: 'POST', body: JSON.stringify(form) })
        addToast(`Visitor "${form.visitor_name}" checked in successfully`, 'success')
      }
      setOpen(false)
      await load()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed'
      setError(msg)
      addToast(msg, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleCloseVisit(event: FormEvent) {
    event.preventDefault()
    if (!closing) return
    setBusy(true)
    setError('')
    try {
      const closed = await api<Visit>(`/visitors/${closing.id}/close`, {
        method: 'POST',
        body: JSON.stringify({ summary }),
      })
      if (closed.email_status === 'failed') {
        addToast(
          `Visit closed, but email failed: ${closed.email_error || 'Delivery issue'} (see Email Logs)`,
          'error',
        )
      } else {
        addToast(
          `Visit closed! Summary email dispatched to ${closing.patients?.email || 'patient'}`,
          'success',
        )
      }
      setClosing(null)
      setSummary('')
      await load()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Close failed'
      setError(msg)
      addToast(msg, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deleting) return
    setBusy(true)
    try {
      await api(`/visitors/${deleting.id}`, { method: 'DELETE' })
      addToast(`Visit entry deleted`, 'info')
      setDeleting(null)
      await load()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Delete failed'
      setError(msg)
      addToast(msg, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Visitor Tracking</h1>
          <p className="mt-1 text-sm text-slate-500">
            Check in visitors, manage on-site stays, and send clinical visit summaries
          </p>
        </div>
        <button className={btnPrimary} onClick={startCreate}>
          <UserCheck className="h-4 w-4" />
          <span>Check In Visitor</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            className={`${inputClass} pl-10 mt-0`}
            placeholder="Search visitor or patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Visits ({rows.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('open')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              statusFilter === 'open'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
            }`}
          >
            Active Now ({rows.filter((r) => r.status === 'open').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('closed')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              statusFilter === 'closed'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Visitor</th>
                <th className={thClass}>Visiting Patient</th>
                <th className={thClass}>Time & Duration</th>
                <th className={thClass}>Status</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="p-4">
                      <div className="h-7 w-full bg-slate-100 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <UserCheck className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-2 text-sm font-semibold text-slate-800">No visits found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {search ? 'Try clearing the search term' : 'Check in a new visitor to begin tracking'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isOpen = row.status === 'open'
                  const duration = getDuration(row.check_in_at, row.check_out_at)

                  return (
                    <tr key={row.id} className={trHoverClass}>
                      <td className={tdClass}>
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                              isOpen ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{row.visitor_name}</p>
                            <p className="text-xs text-slate-400">Visitor</p>
                          </div>
                        </div>
                      </td>
                      <td className={tdClass}>
                        <div className="text-sm font-medium text-slate-800">
                          {row.patients?.full_name || 'Patient'}
                        </div>
                        {row.patients?.email && (
                          <p className="text-xs text-slate-400">{row.patients.email}</p>
                        )}
                      </td>
                      <td className={tdClass}>
                        <div className="flex flex-col text-xs text-slate-600">
                          <div className="flex items-center gap-1 text-slate-900 font-medium">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span>In: {formatWhen(row.check_in_at)}</span>
                          </div>
                          <span className="text-slate-400 mt-0.5">
                            {isOpen ? `Duration: ${duration} (ongoing)` : `Duration: ${duration}`}
                          </span>
                        </div>
                      </td>
                      <td className={tdClass}>
                        {isOpen ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active on site
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                            <CheckCircle2 className="h-3 w-3 text-slate-400" />
                            Completed
                          </span>
                        )}
                      </td>
                      <td className={`${tdClass} text-right space-x-1.5`}>
                        {isOpen ? (
                          <>
                            <button
                              type="button"
                              className={btnGhost}
                              onClick={() => startEdit(row)}
                              title="Edit visitor details"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              className={btnPrimary}
                              onClick={() => {
                                setClosing(row)
                                setSummary('')
                              }}
                              title="Check out and send summary email"
                            >
                              <Send className="h-3.5 w-3.5" />
                              <span>Close & Email</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className={btnSecondary}
                            onClick={() => setViewingSummary(row)}
                            title="View visit summary report"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                            <span>Summary</span>
                          </button>
                        )}
                        {user?.role === 'admin' && (
                          <button
                            type="button"
                            className={btnDanger}
                            onClick={() => setDeleting(row)}
                            title="Delete visit record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Check In / Edit Modal */}
      {open && (
        <Modal
          title={editing ? 'Edit Visit Details' : 'Check In Visitor'}
          onClose={() => setOpen(false)}
          onSubmit={onSubmit}
          submitLabel={editing ? 'Save Changes' : 'Check In Visitor'}
          busy={busy}
        >
          {patients.length === 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 mb-2">
              No patients registered yet. Please register a patient before logging visitors.
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700">Visiting Patient</label>
            <select
              className={selectClass}
              value={form.patient_id}
              onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
              required
            >
              <option value="">-- Choose admitted patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Visitor Full Name</label>
            <input
              className={inputClass}
              value={form.visitor_name}
              onChange={(e) => setForm({ ...form, visitor_name: e.target.value })}
              placeholder="e.g. Maria Gonzalez"
              required
            />
          </div>
        </Modal>
      )}

      {/* Close Visit & Email Modal */}
      {closing && (
        <Modal
          title={`Check Out: ${closing.visitor_name}`}
          onClose={() => setClosing(null)}
          onSubmit={handleCloseVisit}
          submitLabel="Complete & Send Email"
          busy={busy}
        >
          <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3.5 text-xs text-sky-800">
            <p className="font-semibold">Automated Notification:</p>
            <p className="mt-0.5">
              An email summarizing this visit will automatically be dispatched to{' '}
              <span className="font-semibold underline">
                {closing.patients?.email || 'patient email'}
              </span>
              .
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Clinical Visit Summary / Care Notes
            </label>
            <textarea
              className={inputClass}
              rows={5}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Key notes discussed, patient condition, items delivered, doctor instructions..."
              required
            />
          </div>
        </Modal>
      )}

      {/* View Summary Modal */}
      {viewingSummary && (
        <Modal
          title={`Visit Summary: ${viewingSummary.visitor_name}`}
          onClose={() => setViewingSummary(null)}
        >
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 grid gap-2 text-xs">
              <div>
                <span className="text-slate-400">Patient:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {viewingSummary.patients?.full_name}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Checked in:</span>{' '}
                <span className="text-slate-800">{formatWhen(viewingSummary.check_in_at)}</span>
              </div>
              <div>
                <span className="text-slate-400">Checked out:</span>{' '}
                <span className="text-slate-800">{formatWhen(viewingSummary.check_out_at)}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Summary Content
              </h4>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800 whitespace-pre-wrap font-sans">
                {viewingSummary.summary || 'No summary provided.'}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className={btnSecondary}
                onClick={() => setViewingSummary(null)}
              >
                Close View
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleting)}
        title="Delete Visit Entry?"
        message={`Delete visit for "${deleting?.visitor_name}"?`}
        confirmText="Confirm Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleting(null)}
        busy={busy}
      />
    </div>
  )
}
