import { useEffect, useState, useMemo, type FormEvent } from 'react'
import {
  ShieldCheck,
  UserPlus,
  Mail,
  Edit2,
  Trash2,
  AlertCircle,
  Search,
} from 'lucide-react'
import { api } from '../api'
import { Modal } from '../components/Modal'
import { ConfirmModal } from '../components/ConfirmModal'
import { useAuth } from '../store/auth'
import { useToast } from '../store/toast'
import type { Role, User } from '../types'
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

const empty = { full_name: '', email: '', password: '', role: 'staff' as Role }

export function StaffPage() {
  const { user: currentUser } = useAuth()
  const [rows, setRows] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [editing, setEditing] = useState<User | null>(null)
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState<User | null>(null)
  const [form, setForm] = useState(empty)
  const [busy, setBusy] = useState(false)

  const { addToast } = useToast()

  async function load() {
    try {
      const data = await api<User[]>('/staff')
      setRows(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filteredRows = useMemo(() => {
    return rows.filter((staff) => {
      return (
        search.trim() === '' ||
        staff.full_name.toLowerCase().includes(search.toLowerCase()) ||
        staff.email.toLowerCase().includes(search.toLowerCase())
      )
    })
  }, [rows, search])

  function startCreate() {
    setEditing(null)
    setForm(empty)
    setOpen(true)
  }

  function startEdit(row: User) {
    setEditing(row)
    setForm({ full_name: row.full_name, email: row.email, password: '', role: row.role })
    setOpen(true)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (editing) {
        const body: Record<string, string> = {
          full_name: form.full_name,
          email: form.email,
          role: form.role,
        }
        if (form.password) body.password = form.password
        await api(`/staff/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) })
        addToast(`Staff member "${form.full_name}" updated`, 'success')
      } else {
        await api('/staff', { method: 'POST', body: JSON.stringify(form) })
        addToast(`Staff member "${form.full_name}" added`, 'success')
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
    if (deleting.id === currentUser?.id) {
      addToast('You cannot delete your own account', 'error')
      setDeleting(null)
      return
    }
    setBusy(true)
    try {
      await api(`/staff/${deleting.id}`, { method: 'DELETE' })
      addToast(`Staff account removed`, 'info')
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff & Access Control</h1>
          <p className="mt-1 text-sm text-slate-500">
            System credentials, clinical roles, and account permissions
          </p>
        </div>
        <button className={btnPrimary} onClick={startCreate}>
          <UserPlus className="h-4 w-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            className={`${inputClass} pl-10 mt-0`}
            placeholder="Search staff by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-slate-400">
          Total staff: {filteredRows.length}
        </span>
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Name</th>
                <th className={thClass}>Email / Username</th>
                <th className={thClass}>Role & Access</th>
                <th className={thClass}>Registered</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="p-4">
                      <div className="h-7 w-full bg-slate-100 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <ShieldCheck className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-2 text-sm font-semibold text-slate-800">No staff members found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {search ? 'Try clearing search filters' : 'Add your first staff team member'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isAdmin = row.role === 'admin'
                  const isCurrent = row.id === currentUser?.id

                  return (
                    <tr key={row.id} className={trHoverClass}>
                      <td className={tdClass}>
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                              isAdmin
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-teal-100 text-teal-700'
                            }`}
                          >
                            {row.full_name ? row.full_name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900">{row.full_name}</span>
                              {isCurrent && (
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-500">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={tdClass}>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span>{row.email}</span>
                        </div>
                      </td>
                      <td className={tdClass}>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize border ${
                            isAdmin
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-teal-50 text-teal-700 border-teal-200'
                          }`}
                        >
                          <ShieldCheck className="h-3 w-3" />
                          {row.role}
                        </span>
                      </td>
                      <td className={tdClass}>
                        <span className="text-xs text-slate-500">
                          {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td className={`${tdClass} text-right space-x-1`}>
                        <button
                          type="button"
                          className={btnGhost}
                          onClick={() => startEdit(row)}
                          title="Edit staff details"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        {!isCurrent && (
                          <button
                            type="button"
                            className={btnDanger}
                            onClick={() => setDeleting(row)}
                            title="Delete staff account"
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

      {/* Create / Edit Modal */}
      {open && (
        <Modal
          title={editing ? `Edit: ${editing.full_name}` : 'Add New Staff Member'}
          onClose={() => setOpen(false)}
          onSubmit={onSubmit}
          submitLabel={editing ? 'Save Changes' : 'Create Account'}
          busy={busy}
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700">Full Name</label>
            <input
              className={inputClass}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="e.g. Dr. Sarah Miller"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Email Address</label>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="sarah@hospital.local"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              {editing ? 'New Password (leave empty to keep current)' : 'Account Password'}
            </label>
            <input
              type="password"
              className={inputClass}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={editing ? '••••••••' : 'Minimum 8 characters'}
              required={!editing}
              minLength={editing && !form.password ? undefined : 8}
            />
            <p className="mt-1 text-[11px] text-slate-400">Must be at least 8 characters long.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">System Role</label>
            <select
              className={selectClass}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            >
              <option value="staff">Staff - Visitors & Patient records</option>
              <option value="admin">Admin - Full access (Shifts, Staff & Email logs)</option>
            </select>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleting)}
        title="Remove Staff Account?"
        message={`Are you sure you want to remove account "${deleting?.full_name}" (${deleting?.email})?`}
        confirmText="Confirm Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleting(null)}
        busy={busy}
      />
    </div>
  )
}
