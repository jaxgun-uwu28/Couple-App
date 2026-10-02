-- Additive Phase 2 world. Old account RPC/channel retain Phase 1 geometry.
create table public.house_object_catalog (
 id text primary key, kind text not null, x double precision not null, y double precision not null,
 radius integer not null check(radius between 1 and 128), action text not null check(action in ('slot','toggle','future')), slots jsonb not null default '[]'
);
alter table public.house_object_catalog enable row level security;
revoke all on public.house_object_catalog from public,anon,authenticated;
grant select on public.house_object_catalog to authenticated;
create policy catalog_read on public.house_object_catalog for select to authenticated using(true);
create table public.house_object_states (
 couple_id uuid not null references public.couples(id) on delete cascade,
 object_id text not null references public.house_object_catalog(id), enabled boolean not null default false,
 primary key(couple_id,object_id)
);
create table public.house_object_slots (
 couple_id uuid not null references public.couples(id) on delete cascade,
 object_id text not null references public.house_object_catalog(id), slot_id text not null,
 user_id uuid not null references auth.users(id) on delete cascade, session_id uuid not null,
 expires_at timestamptz not null, primary key(couple_id,object_id,slot_id), unique(couple_id,user_id)
);
alter table public.house_object_states enable row level security;
alter table public.house_object_slots enable row level security;
revoke all on public.house_object_states,public.house_object_slots from public,anon,authenticated;
grant select on public.house_object_states,public.house_object_slots to authenticated;
create policy object_state_read on public.house_object_states for select to authenticated using(public.is_couple_member(couple_id));
create policy object_slot_read on public.house_object_slots for select to authenticated using(public.is_couple_member(couple_id));
revoke insert,update,delete on public.house_object_catalog,public.house_object_states,public.house_object_slots from anon,authenticated;

-- Catalog values generated from the validated Tiled export by scripts/export-house-catalog.mjs.
-- BEGIN MAP CATALOG
insert into public.house_object_catalog(id,kind,x,y,radius,action,slots) values
('fridge','fridge',144,256,80,'toggle','[]'::jsonb),
('stove','stove',304,224,80,'future','[]'::jsonb),
('kitchen-sink','sink',464,224,80,'future','[]'::jsonb),
('island','island',368,480,80,'future','[{"id":"0","x":368,"y":288,"facing":"down"},{"id":"1","x":368,"y":480,"facing":"up"}]'::jsonb),
('dining','dining',672,512,80,'slot','[{"id":"0","x":576,"y":384,"facing":"right"},{"id":"1","x":768,"y":384,"facing":"left"}]'::jsonb),
('trash','trash',176,576,80,'future','[]'::jsonb),
('sofa','sofa',256,1200,80,'slot','[{"id":"0","x":192,"y":1120,"facing":"down"},{"id":"1","x":320,"y":1120,"facing":"down"}]'::jsonb),
('tv','tv',256,832,80,'toggle','[]'::jsonb),
('arcade','arcade',624,992,80,'future','[]'::jsonb),
('bed','bed',1520,464,80,'slot','[{"id":"0","x":1472,"y":320,"facing":"down"},{"id":"1","x":1568,"y":320,"facing":"down"}]'::jsonb),
('wardrobe','wardrobe',1712,208,80,'future','[]'::jsonb),
('bedroom-lamp','lamp',1296,272,80,'toggle','[]'::jsonb),
('bedroom-mirror','mirror',1744,432,80,'future','[]'::jsonb),
('bath-sink','sink',1248,896,80,'future','[]'::jsonb),
('toilet','toilet',1472,928,80,'toggle','[]'::jsonb),
('shower','shower',1696,1040,80,'future','[]'::jsonb),
('laundry','laundry',1632,1216,80,'future','[]'::jsonb);
-- END MAP CATALOG

create function public.get_house_snapshot_v2(p_since_version bigint default 0,p_known_couple_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_result jsonb;
begin
 if p_since_version is null or p_since_version<0 then raise exception 'Invalid snapshot version' using errcode='22023'; end if;
 -- Always include the map on V2 reads; prevents an old cache hiding an upgrade.
 v_result:=public.get_house_snapshot(0,p_known_couple_id);
 if v_result->>'kind'='full' then v_result:=jsonb_set(v_result,'{house,map_id}','"cottage-v1"');v_result:=jsonb_set(v_result,'{house,layout_version}','2');end if;
 return v_result;
end;$$;
create function public.get_house_world()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_couple uuid;
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501';end if;
 select m.couple_id into v_couple from public.couple_members m join public.couples c on c.id=m.couple_id where m.user_id=auth.uid() and c.status in ('pending','active');
 if v_couple is null then raise exception 'Membership required' using errcode='42501';end if;
 return jsonb_build_object('couple_id',v_couple,'server_time',now(),'states',coalesce((select jsonb_agg(jsonb_build_object('object_id',s.object_id,'enabled',s.enabled) order by s.object_id) from public.house_object_states s where s.couple_id=v_couple),'[]'),
 'slots',coalesce((select jsonb_agg(jsonb_build_object('object_id',s.object_id,'slot_id',s.slot_id,'user_id',s.user_id,'session_id',s.session_id,'expires_at',s.expires_at) order by s.object_id,s.slot_id) from public.house_object_slots s where s.couple_id=v_couple and s.expires_at>now()),'[]'));
end;$$;

create function public.house_interact(p_action text,p_object_id text,p_slot_id text,p_session_id uuid,p_x double precision,p_y double precision,p_idempotency_key uuid)
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
 elsif p_action='cancel' then
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
revoke all on function public.get_house_snapshot_v2(bigint,uuid),public.get_house_world(),public.house_interact(text,text,text,uuid,double precision,double precision,uuid) from public,anon;
grant execute on function public.get_house_snapshot_v2(bigint,uuid),public.get_house_world(),public.house_interact(text,text,text,uuid,double precision,double precision,uuid) to authenticated;

-- Exact map-version suffix; keep existing private Phase 0/1 authorization intact.
create policy cottage_broadcast_read on realtime.messages for select to authenticated using(extension='broadcast' and exists(select 1 from public.couple_members m where m.user_id=(select auth.uid()) and (select realtime.topic())='house:'||m.couple_id::text||':cottage-v1'));
create policy cottage_broadcast_write on realtime.messages for insert to authenticated with check(extension='broadcast' and exists(select 1 from public.couple_members m where m.user_id=(select auth.uid()) and (select realtime.topic())='house:'||m.couple_id::text||':cottage-v1'));
create policy cottage_presence_read on realtime.messages for select to authenticated using(extension='presence' and exists(select 1 from public.couple_members m where m.user_id=(select auth.uid()) and (select realtime.topic())='house:'||m.couple_id::text||':cottage-v1'));
create policy cottage_presence_write on realtime.messages for insert to authenticated with check(extension='presence' and exists(select 1 from public.couple_members m where m.user_id=(select auth.uid()) and (select realtime.topic())='house:'||m.couple_id::text||':cottage-v1'));
