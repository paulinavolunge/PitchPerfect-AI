-- Service-only session documents. No browser table access, including anonymous sessions.
create table public.budget_prospect_sessions (
  id text primary key,
  owner text not null,
  version bigint not null default 0 check (version >= 0),
  document jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.budget_prospect_sessions enable row level security;
revoke all on public.budget_prospect_sessions from public, anon, authenticated;
grant select, insert, update, delete on public.budget_prospect_sessions to service_role;
