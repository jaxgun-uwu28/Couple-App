begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(17);

insert into auth.users (id, email) values
('11111111-1111-4111-8111-111111111111', 'phase0-a@example.invalid'),
('22222222-2222-4222-8222-222222222222', 'phase0-b@example.invalid'),
('33333333-3333-4333-8333-333333333333', 'phase0-c@example.invalid'),
('44444444-4444-4444-8444-444444444444', 'phase0-d@example.invalid');
insert into public.couples(id) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
insert into public.couple_members(user_id, couple_id, seat) values
('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 1),
('22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 2),
('33333333-3333-4333-8333-333333333333', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 1);

select is((select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity), 0, 'All public tables have RLS');
select ok((select relrowsecurity from pg_class where oid = 'realtime.messages'::regclass), 'Realtime messages has RLS');
select throws_ok($$insert into public.couple_members values ('44444444-4444-4444-8444-444444444444', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 3, now())$$,
  '23514', null, 'No third seat');
select throws_ok($$insert into public.couple_members values ('11111111-1111-4111-8111-111111111111', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 2, now())$$,
  '23505', null, 'A user cannot join two couples');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select ok(public.is_couple_member('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 'Own membership');
select ok(not public.is_couple_member('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 'Other couple denied');
select is((select count(*)::int from public.couples), 1, 'Only own couple visible');
select is((select count(*)::int from public.couple_members), 2, 'Only own pair visible');
select is((select count(*)::int from public.couples where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 0, 'Changing ID cannot expose another couple');
select throws_ok($$insert into public.couples default values$$, '42501', null, 'No client couple insert');
select throws_ok($$insert into public.couple_members values ('44444444-4444-4444-8444-444444444444', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 2, now())$$,
  '42501', null, 'No client membership insert');
select throws_ok($$update public.couple_members set seat = 2$$, '42501', null, 'No client membership update');
select throws_ok($$delete from public.couples$$, '42501', null, 'No client couple delete');
select is(public.health(), '{"status":"ok"}'::jsonb, 'Authenticated health has no private data');

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select is(public.health(), '{"status":"ok"}'::jsonb, 'Anonymous health has no private data');
select throws_ok($$select * from public.couples$$, '42501', null, 'Anonymous cannot read couples');
select throws_ok($$select public.is_couple_member('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')$$,
  '42501', null, 'Anonymous cannot call membership helper');
select * from finish();
rollback;
