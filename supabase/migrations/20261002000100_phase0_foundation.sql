begin;

create table public.couples (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);
create table public.couple_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  seat smallint not null check (seat in (1, 2)),
  joined_at timestamptz not null default now(),
  unique (couple_id, seat)
);

alter table public.couples enable row level security;
alter table public.couple_members enable row level security;

create function public.is_couple_member(p_couple_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.couple_members m
    where m.couple_id = p_couple_id and m.user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_couple_member(uuid) from public, anon;
grant execute on function public.is_couple_member(uuid) to authenticated;

revoke all on public.couples, public.couple_members from anon, authenticated;
grant select on public.couples, public.couple_members to authenticated;
create policy "Members read their couple" on public.couples
for select to authenticated using (public.is_couple_member(id));
create policy "Members read their pair" on public.couple_members
for select to authenticated using (public.is_couple_member(couple_id));

-- Supabase owns this table and already enables RLS. Policies are supported;
-- ALTER TABLE ... ENABLE ROW LEVEL SECURITY here can fail on hosted projects.
create policy "Couple members receive private probe broadcasts"
on realtime.messages for select to authenticated using (
  extension = 'broadcast' and exists (
    select 1 from public.couple_members m
    where m.user_id = (select auth.uid())
      and (select realtime.topic()) = 'house:' || m.couple_id::text
  )
);
create policy "Couple members send private probe broadcasts"
on realtime.messages for insert to authenticated with check (
  extension = 'broadcast' and exists (
    select 1 from public.couple_members m
    where m.user_id = (select auth.uid())
      and (select realtime.topic()) = 'house:' || m.couple_id::text
  )
);

create function public.health()
returns jsonb language sql stable set search_path = ''
as $$ select '{"status":"ok"}'::jsonb; $$;
revoke all on function public.health() from public;
grant execute on function public.health() to anon, authenticated;

commit;
