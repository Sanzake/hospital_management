import { useEffect, useState, useMemo } from 'react'
import {
  Mail,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { api } from '../api'
import { Modal } from '../components/Modal'
import type { EmailRecord } from '../types'
import {
  btnSecondary,
  inputClass,
  tableClass,
  tdClass,
  thClass,
  trHoverClass,
} from '../ui'

export function EmailsPage() {
  const [rows, setRows] = useState<EmailRecord[]>([])
  const [selected, setSelected] = useState<EmailRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'failed'>('all')

  useEffect(() => {
    api<EmailRecord[]>('/emails')
      .then((data) => {
        setRows(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const filteredRows = useMemo(() => {
    return rows.filter((item) => {
      const pName = item.visitors?.patients?.full_name || ''
      const vName = item.visitors?.visitor_name || ''
      const matchSearch =
        search.trim() === '' ||
        item.to_email.toLowerCase().includes(search.toLowerCase()) ||
        item.subject.toLowerCase().includes(search.toLowerCase()) ||
        pName.toLowerCase().includes(search.toLowerCase()) ||
        vName.toLowerCase().includes(search.toLowerCase())

      const matchStatus = statusFilter === 'all' || item.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [rows, search, statusFilter])

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Email Audit Logs</h1>
          <p className="mt-1 text-sm text-slate-500">
            System visit summaries sent to patients and family members
          </p>
        </div>
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
            placeholder="Search by recipient email or subject..."
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
            All Logs ({rows.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('sent')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              statusFilter === 'sent'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Sent ({rows.filter((r) => r.status === 'sent').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('failed')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              statusFilter === 'failed'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Failed ({rows.filter((r) => r.status === 'failed').length})
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Recipient</th>
                <th className={thClass}>Subject</th>
                <th className={thClass}>Delivery Status</th>
                <th className={thClass}>Dispatched At</th>
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
                    <Mail className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-2 text-sm font-semibold text-slate-800">No emails logged</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Closing a visitor stay will record sent email logs here
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isSent = row.status === 'sent'

                  return (
                    <tr key={row.id} className={trHoverClass}>
                      <td className={tdClass}>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-900">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span>{row.to_email}</span>
                        </div>
                        {row.visitors?.patients?.full_name && (
                          <div className="text-[11px] text-slate-500 mt-1 pl-5.5">
                            For <span className="font-semibold text-slate-700">{row.visitors.patients.full_name}</span>
                            {row.visitors.visitor_name && (
                              <span className="text-slate-400"> (Visitor: {row.visitors.visitor_name})</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className={tdClass}>
                        <span className="text-sm font-medium text-slate-800">{row.subject}</span>
                      </td>
                      <td className={tdClass}>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
                            isSent
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {isSent ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-rose-600" />
                          )}
                          {row.status}
                        </span>
                      </td>
                      <td className={tdClass}>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>{new Date(row.sent_at).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className={`${tdClass} text-right`}>
                        <button
                          type="button"
                          className={btnSecondary}
                          onClick={() => setSelected(row)}
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          <span>View Content</span>
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

      {/* Email Preview Modal */}
      {selected && (
        <Modal
          title="Email Message Details"
          onClose={() => setSelected(null)}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Recipient:</span>
                <span className="font-semibold text-slate-900">{selected.to_email}</span>
              </div>
              {selected.visitors?.patients?.full_name && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Associated Patient:</span>
                  <span className="font-semibold text-slate-900">{selected.visitors.patients.full_name}</span>
                </div>
              )}
              {selected.visitors?.visitor_name && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Visitor:</span>
                  <span className="font-semibold text-slate-900">{selected.visitors.visitor_name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Subject:</span>
                <span className="font-semibold text-slate-900">{selected.subject}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sent timestamp:</span>
                <span className="text-slate-700">{new Date(selected.sent_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status:</span>
                <span
                  className={`font-semibold capitalize ${
                    selected.status === 'sent' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {selected.status}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Message Body
              </h4>
              <div className="rounded-xl border border-slate-200 bg-white p-4 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                {selected.body}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                className={btnSecondary}
                onClick={() => setSelected(null)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
