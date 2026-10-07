export type Role = 'admin' | 'staff'
export type Priority = 'low' | 'medium' | 'high'
export type VisitStatus = 'open' | 'closed'
export type EmailStatus = 'sent' | 'failed'

export type User = {
  id: string
  full_name: string
  email: string
  role: Role
  created_at?: string
}

export type Patient = {
  id: string
  full_name: string
  email: string
  phone: string
  priority: Priority
  notes: string | null
  created_at: string
}

export type Shift = {
  id: string
  staff_id: string
  shift_date: string
  start_time: string
  end_time: string
  notes: string | null
  created_at: string
  users?: Pick<User, 'id' | 'full_name' | 'email' | 'role'>
}

export type Visit = {
  id: string
  patient_id: string
  visitor_name: string
  check_in_at: string
  check_out_at: string | null
  summary: string | null
  status: VisitStatus
  created_at: string
  patients?: Pick<Patient, 'id' | 'full_name' | 'email'>
  email_status?: 'sent' | 'failed'
  email_error?: string | null
}

export type EmailRecord = {
  id: string
  to_email: string
  subject: string
  body: string
  visitor_id: string | null
  sent_at: string
  status: EmailStatus
  visitors?: {
    id: string
    visitor_name: string
    patients?: { full_name: string }
  } | null
}

export type Stats = {
  patients: number
  openVisits: number
  staff?: number
  shifts?: number
  emails?: number
}
