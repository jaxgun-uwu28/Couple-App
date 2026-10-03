-- Additive character/consent authority. Legacy house and motion contracts stay intact.
create table public.character_appearances(user_id uuid primary key references auth.users(id) on delete cascade,appearance jsonb not null,updated_at timestamptz not null default now());
create table public.character_outfits(user_id uuid references auth.users(id) on delete cascade,slot integer check(slot between 0 and 4),appearance jsonb not null,primary key(user_id,slot));
create table public.character_social(
 couple_id uuid primary key references public.couples(id) on delete cascade,id uuid not null unique,kind text not null check(kind in ('hug','cuddle')),status text not null check(status in ('pending','active')),
 sender_id uuid not null references auth.users(id) on delete cascade,recipient_id uuid not null references auth.users(id) on delete cascade,
 sender_session uuid not null,recipient_session uuid,object_id text references public.house_object_catalog(id),
 sender_x double precision not null,sender_y double precision not null,recipient_x double precision,recipient_y double precision,
 started_at timestamptz,expires_at timestamptz not null,sender_until timestamptz,recipient_until timestamptz,check(sender_id<>recipient_id)
);
alter table public.character_appearances enable row level security;
alter table public.character_outfits enable row level security;
alter table public.character_social enable row level security;
revoke all on public.character_appearances,public.character_outfits,public.character_social from public,anon,authenticated;
grant select on public.character_appearances,public.character_outfits,public.character_social to authenticated;
create policy character_read on public.character_appearances for select to authenticated using(user_id=(select auth.uid()) or exists(select 1 from public.couple_members m where m.user_id=character_appearances.user_id and public.is_couple_member(m.couple_id)));
create policy outfit_read on public.character_outfits for select to authenticated using(user_id=(select auth.uid()));
create policy social_read on public.character_social for select to authenticated using(public.is_couple_member(couple_id));

create function public._valid_appearance(p jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare k text;n integer;v_max integer;
begin
 if p is null or jsonb_typeof(p)<>'object' or (select count(*) from jsonb_object_keys(p))<>14 then return false;end if;
 foreach k in array array['skin','body','height','hair','hairColor','eyes','mouth','glasses','shirt','shirtColor','pants','pantsColor','shoes','shoesColor'] loop
  if jsonb_typeof(p->k)<>'number' or p->>k is null or (p->>k)!~'^[0-9]{1,2}$' then return false;end if;
  n:=(p->>k)::integer;v_max:=case when k='skin' or k='hair' then 7 when k='eyes' then 5 when k='mouth' then 3 when k like '%Color' then 11 else 2 end;
  if n>v_max then return false;end if;
 end loop;return true;
end;$$;
alter table public.character_appearances add constraint valid_character check(public._valid_appearance(appearance));
alter table public.character_outfits add constraint valid_outfit check(public._valid_appearance(appearance));
create function public._default_character(p_seat integer) returns jsonb language sql immutable set search_path='' as $$
 select jsonb_build_object('skin',1,'body',1,'height',1,'hair',case when p_seat=1 then 5 else 0 end,'hairColor',9,'eyes',0,'mouth',0,'glasses',0,'shirt',1,'shirtColor',case when p_seat=1 then 0 else 1 end,'pants',0,'pantsColor',case when p_seat=1 then 6 else 9 end,'shoes',0,'shoesColor',6);
$$;
create function public.get_house_characters() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_couple uuid;v_social jsonb;
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501';end if;
 select m.couple_id into v_couple from public.couple_members m where m.user_id=auth.uid() and public.is_couple_member(m.couple_id);
 if v_couple is null then raise exception 'Membership required' using errcode='42501';end if;
 select jsonb_build_object('id',s.id,'kind',s.kind,'status',s.status,'sender_id',s.sender_id,'recipient_id',s.recipient_id,'sender_session',s.sender_session,'recipient_session',s.recipient_session,'object_id',s.object_id,'sender_x',s.sender_x,'sender_y',s.sender_y,'recipient_x',s.recipient_x,'recipient_y',s.recipient_y,'started_at',s.started_at,'expires_at',s.expires_at) into v_social from public.character_social s where s.couple_id=v_couple and s.expires_at>now();
 return jsonb_build_object('couple_id',v_couple,'server_time',now(),'profiles',(select jsonb_agg(jsonb_build_object('user_id',m.user_id,'configured',a.user_id is not null,'appearance',coalesce(a.appearance,public._default_character(m.seat))) order by m.seat) from public.couple_members m left join public.character_appearances a on a.user_id=m.user_id where m.couple_id=v_couple),
 'presets',coalesce((select jsonb_agg(jsonb_build_object('slot',o.slot,'appearance',o.appearance) order by o.slot) from public.character_outfits o where o.user_id=auth.uid()),'[]'),'social',v_social);
end;$$;
create function public.save_character(p_appearance jsonb,p_preset integer,p_idempotency_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_args jsonb;v_previous jsonb;v_result jsonb;
begin
 v_args:=jsonb_build_object('appearance',p_appearance,'preset',p_preset);v_previous:=public._action_begin(p_idempotency_key,'save_character',v_args);if v_previous is not null then return v_previous;end if;
 if not public._valid_appearance(p_appearance) or (p_preset is not null and p_preset not between 0 and 4) then v_result:=jsonb_build_object('ok',false,'code','INVALID_APPEARANCE');
 else
  if p_preset is null then insert into public.character_appearances(user_id,appearance) values(auth.uid(),p_appearance) on conflict(user_id) do update set appearance=excluded.appearance,updated_at=now();
  else insert into public.character_outfits(user_id,slot,appearance) values(auth.uid(),p_preset,p_appearance) on conflict(user_id,slot) do update set appearance=excluded.appearance;end if;
  v_result:=jsonb_build_object('ok',true);
 end if;return public._action_finish(p_idempotency_key,'save_character',v_args,v_result);
end;$$;

create function public.character_action(p_action text,p_kind text,p_request_id uuid,p_session_id uuid,p_x double precision,p_y double precision,p_idempotency_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_args jsonb;v_previous jsonb;v_couple uuid;v_peer uuid;v_row public.character_social;v_slot public.house_object_slots;v_peer_slot public.house_object_slots;v_code text;v_result jsonb;
begin
 v_args:=jsonb_build_object('action',p_action,'kind',p_kind,'request',p_request_id,'session',p_session_id,'x',p_x,'y',p_y);
 v_previous:=public._action_begin(p_idempotency_key,'character_action',v_args);if v_previous is not null then return v_previous;end if;
 select m.couple_id into v_couple from public.couple_members m join public.couples c on c.id=m.couple_id where m.user_id=auth.uid() and c.status='active';
 if v_couple is null then return public._action_finish(p_idempotency_key,'character_action',v_args,jsonb_build_object('ok',false,'code','NO_PARTNER'));end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('world:'||v_couple::text,3));
 select m.user_id into v_peer from public.couple_members m where m.couple_id=v_couple and m.user_id<>auth.uid();
 delete from public.character_social where couple_id=v_couple and expires_at<=now();
 select * into v_row from public.character_social where couple_id=v_couple;
 if p_session_id is null or p_action is null or p_action not in ('request','accept','ignore','cancel','renew') then v_code:='INVALID_ACTION';
 elsif p_action='request' then
  if v_row.id is not null then v_code:='BUSY';
  elsif p_kind is null or p_kind not in ('hug','cuddle') then v_code:='INVALID_ACTION';
  elsif p_x is null or p_y is null or not(p_x between 12 and 2036 and p_y between 12 and 1396) then v_code:='OUT_OF_RANGE';
  else
   select * into v_slot from public.house_object_slots where couple_id=v_couple and user_id=auth.uid() and expires_at>now();
   select * into v_peer_slot from public.house_object_slots where couple_id=v_couple and user_id=v_peer and expires_at>now();
   if p_kind='hug' and (v_slot.user_id is not null or v_peer_slot.user_id is not null) then v_code:='BUSY';
   elsif p_kind='cuddle' and (v_slot.session_id is distinct from p_session_id or v_slot.object_id is null or v_slot.object_id not in ('sofa','bed') or v_peer_slot.object_id is distinct from v_slot.object_id or v_peer_slot.slot_id=v_slot.slot_id) then v_code:='NEED_SEATS';
   else insert into public.character_social(couple_id,id,kind,status,sender_id,recipient_id,sender_session,object_id,sender_x,sender_y,expires_at) values(v_couple,p_idempotency_key,p_kind,'pending',auth.uid(),v_peer,p_session_id,case when p_kind='cuddle' then v_slot.object_id else null end,p_x,p_y,now()+interval '8 seconds');end if;
  end if;
 elsif v_row.id is null or v_row.id is distinct from p_request_id then v_code:='EXPIRED';
 elsif p_action='accept' then
  if v_row.recipient_id<>auth.uid() or v_row.status<>'pending' then v_code:='NOT_OWNER';
  elsif p_x is null or p_y is null or not(p_x between 12 and 2036 and p_y between 12 and 1396) then v_code:='OUT_OF_RANGE';
  else
   select * into v_slot from public.house_object_slots where couple_id=v_couple and user_id=auth.uid() and expires_at>now();
   select * into v_peer_slot from public.house_object_slots where couple_id=v_couple and user_id=v_row.sender_id and expires_at>now();
   if v_row.kind='hug' and (v_slot.user_id is not null or v_peer_slot.user_id is not null) then v_code:='BUSY';
   elsif v_row.kind='hug' and sqrt(power(p_x-v_row.sender_x,2)+power(p_y-v_row.sender_y,2))>64 then v_code:='OUT_OF_RANGE';
   elsif v_row.kind='cuddle' and (v_slot.session_id is distinct from p_session_id or v_peer_slot.session_id is distinct from v_row.sender_session or v_slot.object_id is distinct from v_row.object_id or v_peer_slot.object_id is distinct from v_row.object_id or v_slot.slot_id=v_peer_slot.slot_id) then v_code:='NEED_SEATS';
   else update public.character_social set status='active',recipient_session=p_session_id,recipient_x=p_x,recipient_y=p_y,started_at=now(),sender_until=now()+interval '90 seconds',recipient_until=now()+interval '90 seconds',expires_at=now()+interval '90 seconds' where couple_id=v_couple;end if;
  end if;
 elsif p_action='ignore' then
  if auth.uid()<>v_row.recipient_id or v_row.status<>'pending' then v_code:='NOT_OWNER';else delete from public.character_social where couple_id=v_couple;end if;
 elsif (auth.uid()=v_row.sender_id and p_session_id=v_row.sender_session) or (auth.uid()=v_row.recipient_id and p_session_id=v_row.recipient_session) then
  if p_action='cancel' then delete from public.character_social where couple_id=v_couple;
  elsif p_action='renew' and v_row.status='active' then
   if v_row.kind='cuddle' and (select count(*) from public.house_object_slots s where s.couple_id=v_couple and s.object_id=v_row.object_id and s.expires_at>now() and ((s.user_id=v_row.sender_id and s.session_id=v_row.sender_session) or (s.user_id=v_row.recipient_id and s.session_id=v_row.recipient_session)))<>2 then delete from public.character_social where couple_id=v_couple;v_code:='NEED_SEATS';
   else update public.character_social set sender_until=case when sender_id=auth.uid() then now()+interval '90 seconds' else sender_until end,recipient_until=case when recipient_id=auth.uid() then now()+interval '90 seconds' else recipient_until end where couple_id=v_couple;update public.character_social set expires_at=least(sender_until,recipient_until) where couple_id=v_couple;end if;
  else v_code:='INVALID_ACTION';end if;
 else v_code:='NOT_OWNER';end if;
 v_result:=case when v_code is null then jsonb_build_object('ok',true) else jsonb_build_object('ok',false,'code',v_code) end;
 return public._action_finish(p_idempotency_key,'character_action',v_args,v_result);
end;$$;
revoke all on function public._valid_appearance(jsonb),public._default_character(integer),public.get_house_characters(),public.save_character(jsonb,integer,uuid),public.character_action(text,text,uuid,uuid,double precision,double precision,uuid) from public,anon,authenticated;
grant execute on function public.get_house_characters(),public.save_character(jsonb,integer,uuid),public.character_action(text,text,uuid,uuid,double precision,double precision,uuid) to authenticated;

-- Preserve the established interaction contract while serializing paired actions
-- and seats under the same advisory lock. Leaving a seat ends its cuddle.
create or replace function public.house_interact(p_action text,p_object_id text,p_slot_id text,p_session_id uuid,p_x double precision,p_y double precision,p_idempotency_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_couple uuid;v_catalog public.house_object_catalog;v_args jsonb;v_previous jsonb;v_result jsonb;v_code text;
begin
 v_args:=jsonb_build_object('action',p_action,'object',p_object_id,'slot',p_slot_id,'session',p_session_id,'x',p_x,'y',p_y);
 v_previous:=public._action_begin(p_idempotency_key,'house_interact',v_args);if v_previous is not null then return v_previous;end if;
 select m.couple_id into v_couple from public.couple_members m join public.couples c on c.id=m.couple_id where m.user_id=auth.uid() and c.status in ('pending','active');
 if v_couple is null then return public._action_finish(p_idempotency_key,'house_interact',v_args,jsonb_build_object('ok',false,'code','NO_HOUSE'));end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('world:'||v_couple::text,3));
 delete from public.house_object_slots where couple_id=v_couple and expires_at<=now();
 if p_session_id is null or p_action is null or p_action not in ('start','cancel','toggle','renew') then v_code:='INVALID_ACTION';
 elsif p_action in ('start','toggle') and exists(select 1 from public.character_social where couple_id=v_couple and status='active' and expires_at>now()) then v_code:='ALREADY_USING';
 elsif p_action='cancel' then
  delete from public.character_social where couple_id=v_couple and ((sender_id=auth.uid() and sender_session=p_session_id) or (recipient_id=auth.uid() and recipient_session=p_session_id));
  delete from public.house_object_slots where couple_id=v_couple and user_id=auth.uid() and session_id=p_session_id;
 else
  select * into v_catalog from public.house_object_catalog where id=p_object_id;
  if not found then v_code:='INVALID_OBJECT';
  elsif p_action in ('start','toggle') and (p_x is null or p_y is null or not(p_x between 0 and 2048 and p_y between 0 and 1408) or sqrt(power(p_x-v_catalog.x,2)+power(p_y-v_catalog.y,2))>v_catalog.radius) then v_code:='OUT_OF_RANGE';
  elsif v_catalog.action='future' then v_code:='UNAVAILABLE';
  elsif p_action='toggle' and v_catalog.action='toggle' then
   insert into public.house_object_states(couple_id,object_id,enabled) values(v_couple,p_object_id,true) on conflict(couple_id,object_id) do update set enabled=not public.house_object_states.enabled;
  elsif p_action='renew' and v_catalog.action='slot' then
   update public.house_object_slots set expires_at=now()+interval '90 seconds' where couple_id=v_couple and object_id=p_object_id and slot_id=p_slot_id and user_id=auth.uid() and session_id=p_session_id;
   if not found then v_code:='NOT_OWNER';end if;
  elsif p_action='start' and v_catalog.action='slot' then
   if not exists(select 1 from jsonb_array_elements(v_catalog.slots) s where s->>'id'=p_slot_id) then v_code:='INVALID_SLOT';
   elsif exists(select 1 from public.house_object_slots where couple_id=v_couple and object_id=p_object_id and slot_id=p_slot_id) then v_code:='BUSY';
   elsif exists(select 1 from public.house_object_slots where couple_id=v_couple and user_id=auth.uid()) then v_code:='ALREADY_USING';
   else insert into public.house_object_slots(couple_id,object_id,slot_id,user_id,session_id,expires_at) values(v_couple,p_object_id,p_slot_id,auth.uid(),p_session_id,now()+interval '90 seconds');end if;
  else v_code:='INVALID_ACTION';end if;
 end if;
 v_result:=case when v_code is null then jsonb_build_object('ok',true,'couple_id',v_couple) else jsonb_build_object('ok',false,'code',v_code,'couple_id',v_couple) end;
 return public._action_finish(p_idempotency_key,'house_interact',v_args,v_result);
end;$$;
