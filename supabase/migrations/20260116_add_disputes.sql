-- Drop previous version to ensure clean slate (and add new columns)
drop table if exists public.incident_disputes cascade;

-- Create incident_disputes table
create table if not exists public.incident_disputes (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.incident_reports(id) on delete cascade not null,
  disputer_id uuid references public.users(id) not null,
  category text not null,
  reason text not null,
  status text not null default 'OPEN' check (status in ('OPEN', 'APPROVED', 'REJECTED')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create dispute_evidence table (matches report_evidence pattern)
create table if not exists public.dispute_evidence (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid references public.incident_disputes(id) on delete cascade not null,
  file_name text not null,
  file_size bigint not null,
  mime_type text not null,
  storage_path text not null,
  storage_bucket text not null default 'evidence',
  uploaded_by uuid references public.users(id) not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.incident_disputes enable row level security;

-- Policies
create policy "Users can view their own disputes"
  on public.incident_disputes for select
  using (auth.uid() = disputer_id);

create policy "Users can create disputes"
  on public.incident_disputes for insert
  with check (auth.uid() = disputer_id);

-- Allow users to update their own disputes (for evidence upload)
create policy "Users can update their own disputes"
  on public.incident_disputes for update
  using (auth.uid() = disputer_id);

-- Admin policy: Allow admins to view all disputes
create policy "Admins can view all disputes"
  on public.incident_disputes for select
  using (
    exists (
      select 1 from public.admin_users
      where id = auth.uid()
      and is_active = true
    )
  );

-- Enable RLS for dispute_evidence
alter table public.dispute_evidence enable row level security;

-- Dispute evidence policies
create policy "Users can view evidence for their disputes"
  on public.dispute_evidence for select
  using (
    exists (
      select 1 from public.incident_disputes
      where id = dispute_evidence.dispute_id
      and disputer_id = auth.uid()
    )
  );

create policy "Users can upload evidence to their disputes"
  on public.dispute_evidence for insert
  with check (
    exists (
      select 1 from public.incident_disputes
      where id = dispute_evidence.dispute_id
      and disputer_id = auth.uid()
    )
  );

create policy "Admins can view all dispute evidence"
  on public.dispute_evidence for select
  using (
    exists (
      select 1 from public.admin_users
      where id = auth.uid()
      and is_active = true
    )
  );

-- Actions:
-- When a dispute is created, we might want to update the report status?
-- The prompt said "not i want admin to track who reported this dispute... and specially we want the admin to maybe approve it (means remove)".
-- So we won't auto-hide the report yet, just create the dispute.

-- Indexes
create index idx_incident_disputes_report_id on public.incident_disputes(report_id);
create index idx_incident_disputes_disputer_id on public.incident_disputes(disputer_id);
create index idx_incident_disputes_status on public.incident_disputes(status);
create index idx_dispute_evidence_dispute_id on public.dispute_evidence(dispute_id);
