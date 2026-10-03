-- Manifest option IDs replace numeric prototype looks without deleting old data.
create table public.character_asset_options(id text primary key,role text not null check(role in ('body','blush','hairBack','hairFront','face','outfit','accessories')));
create table public.character_asset_defaults(id boolean primary key check(id),appearance jsonb not null);
alter table public.character_asset_options enable row level security;
alter table public.character_asset_defaults enable row level security;
revoke all on public.character_asset_options,public.character_asset_defaults from public,anon,authenticated;

alter table public.character_appearances drop constraint valid_character;
alter table public.character_outfits drop constraint valid_outfit;
create or replace function public._valid_appearance(p jsonb) returns boolean language plpgsql stable security definer set search_path='' as $$
declare k text;v text;
begin
 if p is null or jsonb_typeof(p)<>'object' or pg_column_size(p)>2048 or (select count(*) from jsonb_object_keys(p))<>7 then return false;end if;
 foreach k in array array['body','blush','hairBack','hairFront','face','outfit','accessories'] loop
  if not (p ? k) then return false;end if;
  if k='accessories' then
   if jsonb_typeof(p->k)<>'array' then return false;end if;
   if jsonb_array_length(p->k)>5 then return false;end if;
   if exists(select 1 from jsonb_array_elements(p->k) a where jsonb_typeof(a)<>'string') then return false;end if;
   if (select count(*) from jsonb_array_elements_text(p->k))<>(select count(distinct a) from jsonb_array_elements_text(p->k) a) then return false;end if;
   for v in select jsonb_array_elements_text(p->k) loop
    if not exists(select 1 from public.character_asset_options o where o.id=v and o.role=k) then return false;end if;
   end loop;
  elsif k='blush' and p->k='null'::jsonb then continue;
  else
   if jsonb_typeof(p->k)<>'string' then return false;end if;
   if not exists(select 1 from public.character_asset_options o where o.id=p->>k and o.role=k) then return false;end if;
  end if;
 end loop;return true;
end;$$;
-- NOT VALID preserves old numeric prototype rows; all new writes are checked.
alter table public.character_appearances add constraint valid_character check(public._valid_appearance(appearance)) not valid;
alter table public.character_outfits add constraint valid_outfit check(public._valid_appearance(appearance)) not valid;
create or replace function public._default_character(p_seat integer) returns jsonb language sql stable security definer set search_path='' as $$
 select appearance from public.character_asset_defaults where id;
$$;
create or replace function public.get_house_characters() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_couple uuid;v_social jsonb;
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501';end if;
 select m.couple_id into v_couple from public.couple_members m where m.user_id=auth.uid() and public.is_couple_member(m.couple_id);
 if v_couple is null then raise exception 'Membership required' using errcode='42501';end if;
 select jsonb_build_object('id',s.id,'kind',s.kind,'status',s.status,'sender_id',s.sender_id,'recipient_id',s.recipient_id,'sender_session',s.sender_session,'recipient_session',s.recipient_session,'object_id',s.object_id,'sender_x',s.sender_x,'sender_y',s.sender_y,'recipient_x',s.recipient_x,'recipient_y',s.recipient_y,'started_at',s.started_at,'expires_at',s.expires_at) into v_social from public.character_social s where s.couple_id=v_couple and s.expires_at>now();
 return jsonb_build_object('couple_id',v_couple,'server_time',now(),'profiles',(select jsonb_agg(jsonb_build_object('user_id',m.user_id,'configured',a.user_id is not null and public._valid_appearance(a.appearance),'appearance',case when public._valid_appearance(a.appearance) then a.appearance else public._default_character(m.seat) end) order by m.seat) from public.couple_members m left join public.character_appearances a on a.user_id=m.user_id where m.couple_id=v_couple),
 'presets',coalesce((select jsonb_agg(jsonb_build_object('slot',o.slot,'appearance',o.appearance) order by o.slot) from public.character_outfits o where o.user_id=auth.uid() and public._valid_appearance(o.appearance)),'[]'),'social',v_social);
end;$$;
revoke all on function public._valid_appearance(jsonb),public._default_character(integer) from public,anon,authenticated;
