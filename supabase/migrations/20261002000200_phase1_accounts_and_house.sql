begin;
create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Partner' check (length(btrim(display_name)) between 1 and 24),
  timezone text not null default 'UTC' check (length(timezone) between 1 and 64),
  locale text not null default 'en',
  avatar_config jsonb not null default '{"placeholder":true}'::jsonb,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
create policy "Own or partner profiles" on public.profiles for select to authenticated using (
  id = (select auth.uid()) or exists (
    select 1 from public.couple_members peer
    where peer.user_id = profiles.id and public.is_couple_member(peer.couple_id)
  )
);
create function public._create_auth_profile() returns trigger language plpgsql security definer set search_path = '' as $$
declare v_name text; v_timezone text;
begin
  v_name := coalesce(nullif(btrim(left(new.raw_user_meta_data->>'display_name',24)),''),'Partner');
  v_timezone := coalesce(new.raw_user_meta_data->>'timezone','UTC');
  if not exists(select 1 from pg_catalog.pg_timezone_names where name=v_timezone) then v_timezone := 'UTC'; end if;
  insert into public.profiles(id,display_name,timezone) values(new.id,v_name,v_timezone);
  return new;
end; $$;
revoke all on function public._create_auth_profile() from public, anon, authenticated;
create trigger create_auth_profile after insert on auth.users for each row execute function public._create_auth_profile();
insert into public.profiles(id) select id from auth.users on conflict do nothing;

alter table public.couples
  add column status text not null default 'pending' check(status in ('pending','active','archived')),
  add column created_by uuid references auth.users(id) on delete set null,
  add column invite_code text,
  add column invite_expires_at timestamptz,
  add column house_id uuid,
  add column snapshot_version bigint not null default 1 check(snapshot_version > 0),
  add column updated_at timestamptz not null default now();
create unique index couples_invite_code_key on public.couples(invite_code) where invite_code is not null;
alter table public.couples add constraint valid_invite_pair check (
  (invite_code is null and invite_expires_at is null) or
  (status='pending' and invite_code ~ '^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$' and invite_expires_at is not null)
);
alter table public.couple_members add column role text generated always as
  (case seat when 1 then 'partner_a' else 'partner_b' end) stored;
create index couple_members_couple_id_idx on public.couple_members(couple_id);

create table public.houses (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null unique references public.couples(id) on delete cascade,
  tier text not null default 'apartment' check(tier in ('apartment','house','dream')),
  map_id text not null default 'phase1-room',
  layout_version integer not null default 1 check(layout_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.houses enable row level security;
revoke all on public.houses from anon, authenticated;
grant select on public.houses to authenticated;
create policy "Members read their house" on public.houses for select to authenticated using(public.is_couple_member(couple_id));
insert into public.houses(couple_id) select id from public.couples;
update public.couples c set house_id=h.id,
  created_by=(select m.user_id from public.couple_members m where m.couple_id=c.id order by m.seat limit 1),
  status=case (select count(*) from public.couple_members m where m.couple_id=c.id) when 2 then 'active' when 1 then 'pending' else 'archived' end
from public.houses h where h.couple_id=c.id;
alter table public.couples add constraint couples_house_fk foreign key(house_id) references public.houses(id);

create table public.processed_actions (
  idempotency_key uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  couple_id uuid references public.couples(id) on delete set null,
  action text not null,
  args_hash text not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);
create index processed_actions_user_created_idx on public.processed_actions(user_id,created_at);
alter table public.processed_actions enable row level security;
revoke all on public.processed_actions from anon,authenticated;
create table public.invite_attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null default now(),
  attempts integer not null default 0 check(attempts between 0 and 13)
);
alter table public.invite_attempts enable row level security;
revoke all on public.invite_attempts from anon,authenticated;

create or replace function public.is_couple_member(p_couple_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.couple_members m join public.couples c on c.id=m.couple_id
    where m.couple_id=p_couple_id and m.user_id=(select auth.uid()) and c.status in ('pending','active'));
$$;

create function public._check_couple_count() returns trigger language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_ids uuid[]; v_status text; v_count integer;
begin
  if tg_table_name='couples' then v_ids := array[coalesce(new.id,old.id)];
  elsif tg_op='UPDATE' then v_ids := array[old.couple_id,new.couple_id];
  else v_ids := array[coalesce(new.couple_id,old.couple_id)]; end if;
  foreach v_id in array v_ids loop
    select status into v_status from public.couples where id=v_id;
    if not found then continue; end if;
    select count(*) into v_count from public.couple_members where couple_id=v_id;
    if (v_status='active' and v_count<>2) or (v_status='pending' and v_count<>1) or (v_status='archived' and v_count<>0) then
      raise exception 'Couple status and membership count disagree' using errcode='23514';
    end if;
  end loop;
  return null;
end; $$;
revoke all on function public._check_couple_count() from public,anon,authenticated;
create constraint trigger couple_count_constraint after insert or update on public.couples
  deferrable initially deferred for each row execute function public._check_couple_count();
create constraint trigger member_count_constraint after insert or update or delete on public.couple_members
  deferrable initially deferred for each row execute function public._check_couple_count();

create function public._action_begin(p_key uuid,p_action text,p_args jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_previous public.processed_actions;
begin
  if v_user is null then raise exception 'Sign in required' using errcode='42501'; end if;
  if p_key is null then raise exception 'Request key required' using errcode='22023'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text,1));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_key::text,2));
  delete from public.processed_actions where user_id=v_user and created_at < now()-interval '7 days';
  select * into v_previous from public.processed_actions where idempotency_key=p_key;
  if found then
    if v_previous.user_id<>v_user or v_previous.action<>p_action or
      v_previous.args_hash<>pg_catalog.encode(extensions.digest(p_args::text,'sha256'),'hex') then
      return jsonb_build_object('ok',false,'code','REQUEST_CONFLICT');
    end if;
    return v_previous.result;
  end if;
  return null;
end; $$;
create function public._action_finish(p_key uuid,p_action text,p_args jsonb,p_result jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  -- Do not let repeated rate-limit failures fill the action ledger.
  if p_result->>'code'='RATE_LIMIT' then return p_result; end if;
  insert into public.processed_actions(idempotency_key,user_id,couple_id,action,args_hash,result)
  values(p_key,auth.uid(),(p_result->>'couple_id')::uuid,p_action,
    pg_catalog.encode(extensions.digest(p_args::text,'sha256'),'hex'),p_result);
  return p_result;
end; $$;
revoke all on function public._action_begin(uuid,text,jsonb),public._action_finish(uuid,text,jsonb,jsonb) from public,anon,authenticated;

create function public._new_invite_code() returns text language plpgsql volatile security definer set search_path = '' as $$
declare v_bytes bytea; v_code text; v_i integer;
begin
  loop
    v_bytes := extensions.gen_random_bytes(8); v_code := '';
    for v_i in 0..7 loop v_code := v_code || substr('23456789ABCDEFGHJKLMNPQRSTUVWXYZ',1+(get_byte(v_bytes,v_i)%32),1); end loop;
    if not exists(select 1 from public.couples where invite_code=v_code) then return v_code; end if;
  end loop;
end; $$;
revoke all on function public._new_invite_code() from public,anon,authenticated;

create function public.create_couple(p_idempotency_key uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_previous jsonb; v_id uuid := gen_random_uuid(); v_house uuid; v_code text; v_existing uuid;
begin
  v_previous := public._action_begin(p_idempotency_key,'create_couple','{}'::jsonb);
  if v_previous is not null then return v_previous; end if;
  select couple_id into v_existing from public.couple_members where user_id=auth.uid();
  if found then return public._action_finish(p_idempotency_key,'create_couple','{}',jsonb_build_object('ok',false,'code','ALREADY_IN_COUPLE')); end if;
  loop
    v_code := public._new_invite_code();
    begin
      insert into public.couples(id,created_by,invite_code,invite_expires_at)
      values(v_id,auth.uid(),v_code,now()+interval '7 days');
      exit;
    exception when unique_violation then
      if exists(select 1 from public.couples where id=v_id) then raise; end if;
    end;
  end loop;
  insert into public.couple_members(user_id,couple_id,seat) values(auth.uid(),v_id,1);
  insert into public.houses(couple_id) values(v_id) returning id into v_house;
  update public.couples set house_id=v_house where id=v_id;
  return public._action_finish(p_idempotency_key,'create_couple','{}',jsonb_build_object('ok',true,'couple_id',v_id));
end; $$;

create function public.join_couple(p_code text,p_idempotency_key uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_code text := upper(replace(btrim(coalesce(p_code,'')),'-','')); v_args jsonb;
  v_previous jsonb; v_pair public.couples; v_attempts integer;
begin
  v_args := jsonb_build_object('code',v_code);
  v_previous := public._action_begin(p_idempotency_key,'join_couple',v_args);
  if v_previous is not null then return v_previous; end if;
  if exists(select 1 from public.couple_members where user_id=auth.uid()) then
    return public._action_finish(p_idempotency_key,'join_couple',v_args,jsonb_build_object('ok',false,'code','ALREADY_IN_COUPLE'));
  end if;
  insert into public.invite_attempts(user_id,attempts) values(auth.uid(),1)
  on conflict(user_id) do update set
    window_start=case when invite_attempts.window_start<now()-interval '10 minutes' then now() else invite_attempts.window_start end,
    attempts=case when invite_attempts.window_start<now()-interval '10 minutes' then 1 else least(invite_attempts.attempts+1,13) end
  returning attempts into v_attempts;
  if v_attempts>12 then return jsonb_build_object('ok',false,'code','RATE_LIMIT'); end if;
  -- Return errors instead of raising so failed-attempt throttles commit.
  if v_code !~ '^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$' then
    return public._action_finish(p_idempotency_key,'join_couple',v_args,jsonb_build_object('ok',false,'code','INVALID_INVITE'));
  end if;
  select * into v_pair from public.couples where invite_code=v_code for update;
  if not found or v_pair.status<>'pending' or v_pair.invite_expires_at<=now() then
    return public._action_finish(p_idempotency_key,'join_couple',v_args,jsonb_build_object('ok',false,'code','INVALID_INVITE'));
  end if;
  if (select count(*) from public.couple_members where couple_id=v_pair.id)<>1 then
    return public._action_finish(p_idempotency_key,'join_couple',v_args,jsonb_build_object('ok',false,'code','INVALID_INVITE'));
  end if;
  insert into public.couple_members(user_id,couple_id,seat) values(auth.uid(),v_pair.id,2);
  update public.couples set status='active',invite_code=null,invite_expires_at=null,
    snapshot_version=snapshot_version+1,updated_at=now() where id=v_pair.id;
  return public._action_finish(p_idempotency_key,'join_couple',v_args,jsonb_build_object('ok',true,'couple_id',v_pair.id));
end; $$;

create function public.refresh_invite(p_idempotency_key uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_previous jsonb; v_pair public.couples; v_code text;
begin
  v_previous := public._action_begin(p_idempotency_key,'refresh_invite','{}');
  if v_previous is not null then return v_previous; end if;
  select c.* into v_pair from public.couples c join public.couple_members m on m.couple_id=c.id
    where m.user_id=auth.uid() for update of c;
  if not found or v_pair.status<>'pending' or v_pair.created_by is distinct from auth.uid() then
    return public._action_finish(p_idempotency_key,'refresh_invite','{}',jsonb_build_object('ok',false,'code','NO_PENDING_COUPLE'));
  end if;
  loop
    v_code := public._new_invite_code();
    begin
      update public.couples set invite_code=v_code,invite_expires_at=now()+interval '7 days',
        snapshot_version=snapshot_version+1,updated_at=now() where id=v_pair.id;
      exit;
    exception when unique_violation then null; end;
  end loop;
  return public._action_finish(p_idempotency_key,'refresh_invite','{}',jsonb_build_object('ok',true,'couple_id',v_pair.id));
end; $$;

create function public.cancel_pending_couple(p_idempotency_key uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_previous jsonb; v_pair public.couples;
begin
  v_previous := public._action_begin(p_idempotency_key,'cancel_pending_couple','{}');
  if v_previous is not null then return v_previous; end if;
  select c.* into v_pair from public.couples c join public.couple_members m on m.couple_id=c.id
    where m.user_id=auth.uid() for update of c;
  if not found or v_pair.status<>'pending' or v_pair.created_by is distinct from auth.uid() then
    return public._action_finish(p_idempotency_key,'cancel_pending_couple','{}',jsonb_build_object('ok',false,'code','NO_PENDING_COUPLE'));
  end if;
  delete from public.couple_members where couple_id=v_pair.id;
  update public.couples set status='archived',invite_code=null,invite_expires_at=null,
    snapshot_version=snapshot_version+1,updated_at=now() where id=v_pair.id;
  return public._action_finish(p_idempotency_key,'cancel_pending_couple','{}',jsonb_build_object('ok',true,'couple_id',v_pair.id));
end; $$;

create function public.get_house_snapshot(p_since_version bigint default 0,p_known_couple_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_pair public.couples; v_house public.houses; v_members jsonb;
begin
  if v_user is null then raise exception 'Sign in required' using errcode='42501'; end if;
  if p_since_version is null or p_since_version<0 then raise exception 'Invalid snapshot version' using errcode='22023'; end if;
  select c.* into v_pair from public.couples c join public.couple_members m on m.couple_id=c.id
    where m.user_id=v_user and c.status in ('pending','active');
  if not found then return jsonb_build_object('kind','none','version',0,'user_id',v_user,'server_time',now()); end if;
  if p_known_couple_id=v_pair.id and p_since_version=v_pair.snapshot_version then
    return jsonb_build_object('kind','unchanged','version',v_pair.snapshot_version,'user_id',v_user,'couple_id',v_pair.id,'server_time',now());
  end if;
  select * into v_house from public.houses where couple_id=v_pair.id;
  if not found then raise exception 'House missing; check migration' using errcode='P0001'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('user_id',m.user_id,'seat',m.seat,'role',m.role,
    'joined_at',m.joined_at,'display_name',p.display_name) order by m.seat),'[]'::jsonb)
    into v_members from public.couple_members m join public.profiles p on p.id=m.user_id where m.couple_id=v_pair.id;
  return jsonb_build_object('kind','full','version',v_pair.snapshot_version,'user_id',v_user,'couple_id',v_pair.id,'server_time',now(),
    'status',v_pair.status,'members',v_members,'house',jsonb_build_object('id',v_house.id,'map_id',v_house.map_id,'layout_version',v_house.layout_version),
    'invite',case when v_pair.status='pending' and v_pair.created_by=v_user and v_pair.invite_code is not null
      then jsonb_build_object('code',v_pair.invite_code,'expires_at',v_pair.invite_expires_at) else null end);
end; $$;
revoke all on function public.create_couple(uuid),public.join_couple(text,uuid),public.refresh_invite(uuid),
  public.cancel_pending_couple(uuid),public.get_house_snapshot(bigint,uuid) from public,anon;
grant execute on function public.create_couple(uuid),public.join_couple(text,uuid),public.refresh_invite(uuid),
  public.cancel_pending_couple(uuid),public.get_house_snapshot(bigint,uuid) to authenticated;

alter policy "Couple members receive private probe broadcasts" on realtime.messages using (
  extension in ('broadcast','presence') and exists(select 1 from public.couple_members m
    where m.user_id=(select auth.uid()) and (select realtime.topic())='house:'||m.couple_id::text
      and public.is_couple_member(m.couple_id))
);
alter policy "Couple members send private probe broadcasts" on realtime.messages with check (
  extension in ('broadcast','presence') and exists(select 1 from public.couple_members m
    where m.user_id=(select auth.uid()) and (select realtime.topic())='house:'||m.couple_id::text
      and public.is_couple_member(m.couple_id))
);
commit;
