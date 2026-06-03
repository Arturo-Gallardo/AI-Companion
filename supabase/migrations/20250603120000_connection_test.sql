-- dev-only: verify Tomoji can read/write Supabase. remove before production.
create table if not exists public.connection_test (
  id bigint generated always as identity primary key,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.connection_test enable row level security;

create policy "anon read connection_test"
  on public.connection_test
  for select
  to anon
  using (true);

create policy "anon insert connection_test"
  on public.connection_test
  for insert
  to anon
  with check (true);

insert into public.connection_test (message)
values ('seed row from migration');
