begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(42);

insert into auth.users(id,email,raw_user_meta_data) values
('11000000-0000-4000-8000-000000000001','phase1-a@example.invalid','{"display_name":"Rose"}'),
('11000000-0000-4000-8000-000000000002','phase1-b@example.invalid','{"display_name":"Sky"}'),
('11000000-0000-4000-8000-000000000003','phase1-c@example.invalid','{}'),
('11000000-0000-4000-8000-000000000004','phase1-d@example.invalid','{}');
select is((select display_name from public.profiles where id='11000000-0000-4000-8000-000000000001'),'Rose','Profile trigger reads bounded name');
select is((select count(*)::int from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity),0,'Every app table has RLS');
create temporary table test_results(label text primary key, value jsonb);
grant all on test_results to authenticated;

set local role authenticated;
set local request.jwt.claims='{"sub":"11000000-0000-4000-8000-000000000001","role":"authenticated"}';
select is((public.get_house_snapshot()->>'kind'),'none','Unpaired snapshot has no house');
select throws_ok($$insert into public.profiles(id) values('11000000-0000-4000-8000-000000000004')$$,'42501',null,'No direct profile write');
select throws_ok($$select public._new_invite_code()$$,'42501',null,'No internal invite helper execute');
insert into test_results values('create',public.create_couple('12000000-0000-4000-8000-000000000001'));
select is((select value->>'ok' from test_results where label='create'),'true','Create couple succeeds');
select is(public.create_couple('12000000-0000-4000-8000-000000000001'),(select value from test_results where label='create'),'Duplicate create returns identical result');
select is((public.create_couple('12000000-0000-4000-8000-000000000002')->>'code'),'ALREADY_IN_COUPLE','Cannot create a second couple');
insert into test_results values('initial',public.get_house_snapshot());
select is((select value->>'status' from test_results where label='initial'),'pending','One member means pending');
select is((select jsonb_array_length(value->'members') from test_results where label='initial'),1,'Snapshot has one member');
select ok((select value->'invite'->>'code' ~ '^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$' from test_results where label='initial'),'Invite code shape');
select ok((select (value->'invite'->>'expires_at')::timestamptz=now()+interval '7 days' from test_results where label='initial'),'Invite expires in seven days');
select is((public.get_house_snapshot(1,(select (value->>'couple_id')::uuid from test_results where label='initial'))->>'kind'),'unchanged','Unchanged version returns delta marker');
select is((public.get_house_snapshot(999,(select (value->>'couple_id')::uuid from test_results where label='initial'))->>'kind'),'full','Future client version cannot suppress server snapshot');
select throws_ok($$select public.get_house_snapshot(-1)$$,'22023',null,'Reject negative version');
select is((public.join_couple('BADCODE','12000000-0000-4000-8000-000000000001')->>'code'),'REQUEST_CONFLICT','Same request key cannot change action');
select throws_ok($$insert into public.houses(couple_id) values(gen_random_uuid())$$,'42501',null,'No direct house write');
select is((select count(*)::int from public.houses),1,'Only own house is visible');

set local request.jwt.claims='{"sub":"11000000-0000-4000-8000-000000000003","role":"authenticated"}';
select is((select count(*)::int from public.couples),0,'Outsider cannot read couple');
select is((select count(*)::int from public.profiles),1,'Outsider only reads own profile');
select is((public.create_couple('12000000-0000-4000-8000-000000000001')->>'code'),'REQUEST_CONFLICT','Another user cannot replay caller request key');
select is((public.join_couple('INVALID','13000000-0000-4000-8000-000000000001')->>'code'),'INVALID_INVITE','Invalid code rejected');
select is((public.join_couple('INVALID','13000000-0000-4000-8000-000000000001')->>'code'),'INVALID_INVITE','Duplicate failed action remains idempotent');
reset role;
select is((select attempts from public.invite_attempts where user_id='11000000-0000-4000-8000-000000000003'),1,'Duplicate invalid action does not spend another attempt');
update public.couples set invite_expires_at=now()-interval '1 second' where id=(select (value->>'couple_id')::uuid from test_results where label='create');
set local role authenticated;
select is((public.join_couple((select value->'invite'->>'code' from test_results where label='initial'),'13000000-0000-4000-8000-000000000002')->>'code'),'INVALID_INVITE','Expired invite rejected');
select is((public.refresh_invite('13000000-0000-4000-8000-000000000003')->>'code'),'NO_PENDING_COUPLE','Outsider cannot refresh invite');

set local request.jwt.claims='{"sub":"11000000-0000-4000-8000-000000000001","role":"authenticated"}';
insert into test_results values('refresh',public.refresh_invite('14000000-0000-4000-8000-000000000001'));
insert into test_results values('refreshed',public.get_house_snapshot());
select is((select value->>'ok' from test_results where label='refresh'),'true','Owner refreshes pending invite');
select ok((select value->'invite'->>'code' from test_results where label='refreshed')<>(select value->'invite'->>'code' from test_results where label='initial'),'Refresh rotates code');

set local request.jwt.claims='{"sub":"11000000-0000-4000-8000-000000000002","role":"authenticated"}';
insert into test_results values('join',public.join_couple((select value->'invite'->>'code' from test_results where label='refreshed'),'15000000-0000-4000-8000-000000000001'));
select is((select value->>'ok' from test_results where label='join'),'true','Second member joins');
select is(public.join_couple((select value->'invite'->>'code' from test_results where label='refreshed'),'15000000-0000-4000-8000-000000000001'),(select value from test_results where label='join'),'Duplicate successful join returns same result');
select is((public.get_house_snapshot()->>'status'),'active','Two members activate couple');
select is(jsonb_array_length(public.get_house_snapshot()->'members'),2,'Shared snapshot has exactly two members');
select is((public.get_house_snapshot()->'invite'),'null'::jsonb,'Consumed invite not exposed');
select is((select count(*)::int from public.profiles),2,'Partner profile visible, outsiders hidden');
select is((public.cancel_pending_couple('15000000-0000-4000-8000-000000000002')->>'code'),'NO_PENDING_COUPLE','Cannot cancel an active couple');

set local request.jwt.claims='{"sub":"11000000-0000-4000-8000-000000000003","role":"authenticated"}';
select is((public.join_couple((select value->'invite'->>'code' from test_results where label='refreshed'),'16000000-0000-4000-8000-000000000001')->>'code'),'INVALID_INVITE','Consumed invite cannot admit third member');
do $$ begin for i in 1..10 loop perform public.join_couple('INVALID',gen_random_uuid()); end loop; end $$;
select is((public.join_couple('INVALID','16000000-0000-4000-8000-000000000002')->>'code'),'RATE_LIMIT','Bad invite attempts are server-throttled');
insert into test_results values('solo',public.create_couple('16000000-0000-4000-8000-000000000003'));
select is((public.cancel_pending_couple('16000000-0000-4000-8000-000000000004')->>'ok'),'true','Creator can cancel pending couple');
select is((public.get_house_snapshot()->>'kind'),'none','Cancelled membership clears snapshot');
select is((public.cancel_pending_couple('16000000-0000-4000-8000-000000000004')->>'ok'),'true','Cancel duplicate remains idempotent');

set local role anon;
set local request.jwt.claims='{"role":"anon"}';
select throws_ok($$select public.create_couple(gen_random_uuid())$$,'42501',null,'Anonymous cannot create couple');
select throws_ok($$select public.get_house_snapshot()$$,'42501',null,'Anonymous cannot read snapshot');
select * from finish();
rollback;
