import { useEffect, useState, useMemo, type FormEvent } from 'react'
import {
  Search,
  UserPlus,
  Phone,
  Mail,
  Edit2,
  Trash2,
  AlertCircle,
  FileText,
  Users,
} from 'lucide-react'
import { api } from '../api'
import { Modal } from '../components/Modal'
import { ConfirmModal } from '../components/ConfirmModal'
import { useToast } from '../store/toast'
import type { Patient, Priority } from '../types'
import {
  btnDanger,
  btnGhost,
  btnPrimary,
  inputClass,
  selectClass,
  tableClass,
  tdClass,
  thClass,
  trHoverClass,
} from '../ui'

const empty = { full_name: '', email: '', phone: '', priority: 'medium' as Priority, notes: '' }

const priorityBadges: Record<Priority, { label: string; class: string; dot: string }> = {
  high: { label: 'High Priority', class: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  medium: { label: 'Medium', class: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  low: { label: 'Low', class: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
}

export function PatientsPage() {
  const [rows, setRows] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  const [editing, setEditing] = useState<Patient | null>(null)
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState<Patient | null>(null)
  const [form, setForm] = useState(empty)
  const [busy, setBusy] = useState(false)

  const { addToast } = useToast()

  async function load() {
    try {
      const data = await api<Patient[]>('/patients')
      setRows(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filteredRows = useMemo(() => {
    return rows.filter((patient) => {
      const matchSearch =
        search.trim() === '' ||
        patient.full_name.toLowerCase().includes(search.toLowerCase()) ||
        patient.email.toLowerCase().includes(search.toLowerCase()) ||
        patient.phone.toLowerCase().includes(search.toLowerCase())

      const matchPriority = filterPriority === 'all' || patient.priority === filterPriority
      return matchSearch && matchPriority
    })
  }, [rows, search, filterPriority])

  function startCreate() {
    setEditing(null)
    setForm(empty)
    setOpen(true)
  }

  function startEdit(row: Patient) {
    setEditing(row)
    setForm({
      full_name: row.full_name,
      email: row.email,
      phone: row.phone,
      priority: row.priority,
      notes: row.notes || '',
    })
    setOpen(true)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const body = { ...form, notes: form.notes || null }
      if (editing) {
        await api(`/patients/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) })
        addToast(`Patient "${form.full_name}" updated successfully`, 'success')
      } else {
        await api('/patients', { method: 'POST', body: JSON.stringify(body) })
        addToast(`Patient "${form.full_name}" registered successfully`, 'success')
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

  async function handleConfirmDelete() {
    if (!deleting) return
    setBusy(true)
    try {
      await api(`/patients/${deleting.id}`, { method: 'DELETE' })
      addToast(`Patient "${deleting.full_name}" deleted`, 'info')
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
      {/* Top Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patients Directory</h1>
          <p className="mt-1 text-sm text-slate-500">
            Registered patients, admission details, and contact profiles
          </p>
        </div>
        <button className={btnPrimary} onClick={startCreate}>
          <UserPlus className="h-4 w-4" />
          <span>Register Patient</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            className={`${inputClass} pl-10 mt-0`}
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Priority Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'high', 'medium', 'low'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setFilterPriority(p)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                filterPriority === p
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p === 'all' ? 'All Priorities' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Patient</th>
                <th className={thClass}>Contact Info</th>
                <th className={thClass}>Priority</th>
                <th className={thClass}>Clinical Notes</th>
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
                    <Users className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-2 text-sm font-semibold text-slate-800">No patients found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {search ? 'Try adjusting your search criteria' : 'Register a patient to get started'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const badge = priorityBadges[row.priority]
                  const initial = row.full_name ? row.full_name[0].toUpperCase() : 'P'
                  return (
                    <tr key={row.id} className={trHoverClass}>
                      <td className={tdClass}>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-sm font-bold text-teal-800">
                            {initial}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{row.full_name}</p>
                            <p className="text-xs text-slate-400">
                              Registered {new Date(row.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={tdClass}>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            <a href={`mailto:${row.email}`} className="hover:text-teal-600 hover:underline">
                              {row.email}
                            </a>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span>{row.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className={tdClass}>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.class}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </td>
                      <td className={tdClass}>
                        {row.notes ? (
                          <div className="flex items-start gap-1.5 text-xs text-slate-600 max-w-xs">
                            <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-400" />
                            <span className="truncate">{row.notes}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 italic">No notes</span>
                        )}
                      </td>
                      <td className={`${tdClass} text-right space-x-1`}>
                        <button
                          type="button"
                          className={btnGhost}
                          onClick={() => startEdit(row)}
                          title="Edit patient"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className={btnDanger}
                          onClick={() => setDeleting(row)}
                          title="Delete patient"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {open && (
        <Modal
          title={editing ? `Edit Patient: ${editing.full_name}` : 'Register New Patient'}
          onClose={() => setOpen(false)}
          onSubmit={onSubmit}
          submitLabel={editing ? 'Save Changes' : 'Register Patient'}
          busy={busy}
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700">Full Legal Name</label>
            <input
              className={inputClass}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="e.g. John Doe"
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="patient@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Phone Number</label>
              <input
                className={inputClass}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 555-0199"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Clinical Priority</label>
            <select
              className={selectClass}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
            >
              <option value="low">Low - Routine monitoring</option>
              <option value="medium">Medium - Standard clinical attention</option>
              <option value="high">High - Urgent / Intensive attention</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Medical Notes / Directives</label>
            <textarea
              className={inputClass}
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Allergies, physician in charge, dietary requirements..."
            />
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleting)}
        title="Delete Patient Record?"
        message={`Are you sure you want to delete patient "${deleting?.full_name}"? All associated visitor history will also be removed.`}
        confirmText="Confirm Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleting(null)}
        busy={busy}
      />
    </div>
  )
}
