create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  priority text not null check (priority in ('low', 'medium', 'high')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references users (id) on delete cascade,
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists visitors (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients (id) on delete cascade,
  visitor_name text not null,
  check_in_at timestamptz not null default now(),
  check_out_at timestamptz,
  summary text,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists emails (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  subject text not null,
  body text not null,
  visitor_id uuid references visitors (id) on delete set null,
  sent_at timestamptz not null default now(),
  status text not null check (status in ('sent', 'failed'))
);

alter table users enable row level security;
alter table patients enable row level security;
alter table shifts enable row level security;
alter table visitors enable row level security;
alter table emails enable row level security;

-- Performance indexes for foreign keys and frequent queries
create index if not exists idx_patients_priority on patients(priority);
create index if not exists idx_patients_created_at on patients(created_at desc);
create index if not exists idx_shifts_staff on shifts(staff_id);
create index if not exists idx_shifts_date on shifts(shift_date desc);
create index if not exists idx_visitors_patient on visitors(patient_id);
create index if not exists idx_visitors_status on visitors(status);
create index if not exists idx_visitors_created_at on visitors(created_at desc);
create index if not exists idx_emails_visitor on emails(visitor_id);
create index if not exists idx_emails_sent_at on emails(sent_at desc);

