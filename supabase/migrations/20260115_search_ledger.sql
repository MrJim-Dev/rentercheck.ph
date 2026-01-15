-- Create table for tracking search access (deduplication)
create table if not exists public.search_access_logs (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    parameter_type text not null, -- 'NAME', 'PHONE', 'EMAIL', 'FACEBOOK'
    parameter_value text not null, -- Normalized value
    expires_at timestamp with time zone not null,
    created_at timestamp with time zone not null default now(),

    constraint search_access_logs_pkey primary key (id)
);

-- Indexes for fast lookup
create index if not exists search_access_logs_lookup_idx 
    on public.search_access_logs (user_id, parameter_type, parameter_value);

-- RLS
alter table public.search_access_logs enable row level security;

create policy "Users can view their own search logs"
    on public.search_access_logs for select
    using (auth.uid() = user_id);

create policy "Users can insert their own search logs"
    on public.search_access_logs for insert
    with check (auth.uid() = user_id);
