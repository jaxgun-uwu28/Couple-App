// Disposable local Supabase CI fixtures only, real concurrent PostgreSQL sessions.
import {execFile} from 'node:child_process';import {promisify} from 'node:util';import {randomUUID} from 'node:crypto';
const exec=promisify(execFile),ids=[randomUUID(),randomUUID()],sessions=[randomUUID(),randomUUID()];
const sql=async q=>(await exec('docker',['exec','supabase_db_paw-and-us','psql','-U','postgres','-d','postgres','-At','-v','ON_ERROR_STOP=1','-c',q],{maxBuffer:1024*1024})).stdout.trim();
const asUser=(id,q)=>`begin;set local role authenticated;set local request.jwt.claim.sub='${id}';${q};commit;`;
let couple;
try{
 await sql(`insert into auth.users(id,aud,role,email) values ${ids.map(id=>`('${id}','authenticated','authenticated','world-race-${id}@example.test')`).join(',')}`);
 const created=JSON.parse((await sql(asUser(ids[0],`select public.create_couple('${randomUUID()}')`))).split('\n').find(l=>l.startsWith('{')));couple=created.couple_id;
 const invite=await sql(`select invite_code from public.couples where id='${couple}'`);
 await sql(asUser(ids[1],`select public.join_couple('${invite}','${randomUUID()}')`));
 const results=await Promise.all(ids.map((id,i)=>sql(asUser(id,`select public.house_interact('start','sofa','0','${sessions[i]}',256,1200,'${randomUUID()}');select pg_sleep(.5)`))));
 const outcomes=results.map(s=>JSON.parse(s.split('\n').find(l=>l.startsWith('{'))));
 if(outcomes.filter(r=>r.ok).length!==1||outcomes.filter(r=>r.code==='BUSY').length!==1)throw new Error('Slot race must yield exactly one winner and one BUSY.');
 if(await sql(`select count(*) from public.house_object_slots where couple_id='${couple}'`)!=='1')throw new Error('Slot uniqueness lost.');
 const toggles=await Promise.all(ids.map((id,i)=>sql(asUser(id,`select public.house_interact('toggle','fridge',null,'${sessions[i]}',144,256,'${randomUUID()}');select pg_sleep(.5)`))));
 if(!toggles.every(s=>JSON.parse(s.split('\n').find(l=>l.startsWith('{'))).ok)||await sql(`select enabled from public.house_object_states where couple_id='${couple}' and object_id='fridge'`)!=='f')throw new Error('Concurrent toggles must serialize without a lost update.');
 console.log('Concurrent world actions: one slot winner/one BUSY; two toggles serialize to original state.');
}finally{
 if(couple)await sql(`begin;update public.couples set status='archived',invite_code=null,invite_expires_at=null where id='${couple}';delete from public.couple_members where couple_id='${couple}';delete from public.processed_actions where couple_id='${couple}';update public.couples set house_id=null where id='${couple}';delete from public.houses where couple_id='${couple}';delete from public.couples where id='${couple}';commit;`);
 await sql(`delete from auth.users where id in (${ids.map(id=>`'${id}'`).join(',')})`);
}
