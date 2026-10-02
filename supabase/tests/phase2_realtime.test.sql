begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(6);
insert into auth.users(id,email) values
('61000000-0000-4000-8000-000000000001','rt-a@example.invalid'),
('61000000-0000-4000-8000-000000000002','rt-b@example.invalid'),
('61000000-0000-4000-8000-000000000003','rt-c@example.invalid');
insert into public.couples(id,status) values
('62000000-0000-4000-8000-000000000001','active'),
('62000000-0000-4000-8000-000000000002','pending');
insert into public.couple_members(user_id,couple_id,seat) values
('61000000-0000-4000-8000-000000000001','62000000-0000-4000-8000-000000000001',1),
('61000000-0000-4000-8000-000000000002','62000000-0000-4000-8000-000000000001',2),
('61000000-0000-4000-8000-000000000003','62000000-0000-4000-8000-000000000002',1);
set constraints all immediate;
insert into realtime.messages(topic,extension,event,payload,private) values
('house:62000000-0000-4000-8000-000000000001:cottage-v1','presence','track','{}',true),
('house:62000000-0000-4000-8000-000000000002:cottage-v1','presence','track','{}',true);
set local role authenticated;
set local request.jwt.claims='{"sub":"61000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local realtime.topic='house:62000000-0000-4000-8000-000000000001:cottage-v1';
select is((select count(*)::int from realtime.messages where topic=current_setting('realtime.topic') and extension='presence'),1,'Own private Presence read permitted');
select lives_ok($$insert into realtime.messages(topic,extension,event,payload,private) values(current_setting('realtime.topic'),'presence','track','{}',true)$$,'Own private Presence write permitted');
select lives_ok($$insert into realtime.messages(topic,extension,event,payload,private) values(current_setting('realtime.topic'),'broadcast','PLAYER_MOVED','{}',true)$$,'Own private Broadcast write permitted');
set local realtime.topic='house:62000000-0000-4000-8000-000000000002:cottage-v1';
select is((select count(*)::int from realtime.messages where topic=current_setting('realtime.topic')),0,'Another couple private Presence cannot be read');
select throws_ok($$insert into realtime.messages(topic,extension,event,payload,private) values(current_setting('realtime.topic'),'presence','track','{}',true)$$,'42501',null,'Another couple Presence write denied');
select throws_ok($$insert into realtime.messages(topic,extension,event,payload,private) values(current_setting('realtime.topic'),'broadcast','PLAYER_MOVED','{}',true)$$,'42501',null,'Another couple Broadcast write denied');
select * from finish();
rollback;
