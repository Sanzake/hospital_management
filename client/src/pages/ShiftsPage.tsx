import { useEffect, useState, useMemo, type FormEvent } from 'react'
import {
  CalendarClock,
  Trash2,
  Edit2,
  AlertCircle,
  Calendar,
  User,
} from 'lucide-react'
import { api } from '../api'
import { Modal } from '../components/Modal'
import { ConfirmModal } from '../components/ConfirmModal'
import { useToast } from '../store/toast'
import type { Shift, User as UserType } from '../types'
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

const empty = { staff_id: '', shift_date: '', start_time: '', end_time: '', notes: '' }

function timeValue(value: string) {
  return value?.slice(0, 5) || ''
}

function calculateShiftHours(start: string, end: string) {
  if (!start || !end) return ''
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const mins = eh * 60 + em - (sh * 60 + sm)
  if (mins <= 0) return ''
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours} hrs`
}

export function ShiftsPage() {
  const [rows, setRows] = useState<Shift[]>([])
  const [staff, setStaff] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [staffFilter, setStaffFilter] = useState<string>('all')

  const [editing, setEditing] = useState<Shift | null>(null)
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState<Shift | null>(null)
  const [form, setForm] = useState(empty)
  const [busy, setBusy] = useState(false)

  const { addToast } = useToast()

  async function load() {
    try {
      const [shifts, users] = await Promise.all([
        api<Shift[]>('/shifts'),
        api<UserType[]>('/staff'),
      ])
      setRows(shifts)
      setStaff(users)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shifts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filteredRows = useMemo(() => {
    return rows.filter((shift) => {
      if (staffFilter === 'all') return true
      return shift.staff_id === staffFilter
    })
  }, [rows, staffFilter])

  function startCreate() {
    setEditing(null)
    const today = new Date().toISOString().split('T')[0]
    setForm({
      staff_id: staff[0]?.id || '',
      shift_date: today,
      start_time: '08:00',
      end_time: '16:00',
      notes: '',
    })
    setOpen(true)
  }

  function startEdit(row: Shift) {
    setEditing(row)
    setForm({
      staff_id: row.staff_id,
      shift_date: row.shift_date,
      start_time: timeValue(row.start_time),
      end_time: timeValue(row.end_time),
      notes: row.notes || '',
    })
    setOpen(true)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (form.start_time >= form.end_time) {
      addToast('End time must be after start time', 'error')
      return
    }
    setBusy(true)
    setError('')
    try {
      const body = { ...form, notes: form.notes || null }
      if (editing) {
        await api(`/shifts/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) })
        addToast('Shift schedule updated', 'success')
      } else {
        await api('/shifts', { method: 'POST', body: JSON.stringify(body) })
        addToast('Shift successfully scheduled', 'success')
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
      await api(`/shifts/${deleting.id}`, { method: 'DELETE' })
      addToast('Shift entry removed', 'info')
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Shifts & Scheduling</h1>
          <p className="mt-1 text-sm text-slate-500">
            Staff duty rosters, department shifts, and working hours
          </p>
        </div>
        <button className={btnPrimary} onClick={startCreate}>
          <CalendarClock className="h-4 w-4" />
          <span>Schedule Shift</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Staff Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="flex items-center gap-2.5">
          <User className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">Filter by Staff Member:</span>
          <select
            className={`${selectClass} mt-0 max-w-xs`}
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
          >
            <option value="all">All Clinical Staff</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name} ({s.role})
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-slate-400">
          Showing {filteredRows.length} scheduled {filteredRows.length === 1 ? 'shift' : 'shifts'}
        </span>
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Staff Member</th>
                <th className={thClass}>Date</th>
                <th className={thClass}>Hours & Duration</th>
                <th className={thClass}>Notes</th>
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
                    <CalendarClock className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-2 text-sm font-semibold text-slate-800">No shifts scheduled</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Add a new shift to assign staff hours
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const hours = calculateShiftHours(row.start_time, row.end_time)
                  const dateObj = new Date(`${row.shift_date}T00:00:00`)
                  const formattedDate = dateObj.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })

                  return (
                    <tr key={row.id} className={trHoverClass}>
                      <td className={tdClass}>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-sm font-bold text-amber-800">
                            {row.users?.full_name ? row.users.full_name[0].toUpperCase() : 'S'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {row.users?.full_name || 'Staff Member'}
                            </p>
                            <p className="text-xs text-slate-400 capitalize">
                              {row.users?.role || 'staff'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={tdClass}>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>
                      <td className={tdClass}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800">
                            {timeValue(row.start_time)} – {timeValue(row.end_time)}
                          </span>
                          {hours && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                              {hours}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={tdClass}>
                        <span className="text-xs text-slate-500">
                          {row.notes || <span className="italic text-slate-300">No notes</span>}
                        </span>
                      </td>
                      <td className={`${tdClass} text-right space-x-1`}>
                        <button
                          type="button"
                          className={btnGhost}
                          onClick={() => startEdit(row)}
                          title="Edit shift"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className={btnDanger}
                          onClick={() => setDeleting(row)}
                          title="Delete shift"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Add / Edit Modal */}
      {open && (
        <Modal
          title={editing ? 'Edit Shift Schedule' : 'Schedule New Shift'}
          onClose={() => setOpen(false)}
          onSubmit={onSubmit}
          submitLabel={editing ? 'Update Shift' : 'Save Shift'}
          busy={busy}
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700">Staff Member</label>
            <select
              className={selectClass}
              value={form.staff_id}
              onChange={(e) => setForm({ ...form, staff_id: e.target.value })}
              required
            >
              <option value="">-- Select staff member --</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.email}) - {s.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Shift Date</label>
            <input
              type="date"
              className={inputClass}
              value={form.shift_date}
              onChange={(e) => setForm({ ...form, shift_date: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Start Time</label>
              <input
                type="time"
                className={inputClass}
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">End Time</label>
              <input
                type="time"
                className={inputClass}
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Department / Notes</label>
            <input
              className={inputClass}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. ICU, Emergency Room, On-call coverage"
            />
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleting)}
        title="Remove Shift Schedule?"
        message={`Are you sure you want to remove this shift for ${deleting?.users?.full_name || 'this staff member'}?`}
        confirmText="Confirm Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleting(null)}
        busy={busy}
      />
    </div>
  )
}
