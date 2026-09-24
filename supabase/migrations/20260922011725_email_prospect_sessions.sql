-- Email is isolated from existing Budget sessions; no browser table access.
create table public.email_prospect_sessions (
  id text primary key,
  owner text not null,
  version bigint not null default 0 check (version >= 0),
  document jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.email_prospect_sessions enable row level security;
revoke all on public.email_prospect_sessions from public, anon, authenticated, service_role;
grant select, insert, update, delete on public.email_prospect_sessions to service_role;
