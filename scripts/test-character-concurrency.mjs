// Disposable local Supabase fixtures: actual parallel PostgreSQL transactions.
import {execFile} from 'node:child_process';import {promisify} from 'node:util';import {randomUUID} from 'node:crypto';
const exec=promisify(execFile),ids=[randomUUID(),randomUUID()],sessions=[randomUUID(),randomUUID()];
const sql=async q=>(await exec('docker',['exec','supabase_db_paw-and-us','psql','-U','postgres','-d','postgres','-At','-v','ON_ERROR_STOP=1','-c',q],{maxBuffer:1024*1024})).stdout.trim();
const asUser=(id,q)=>`begin;set local role authenticated;set local request.jwt.claim.sub='${id}';${q};commit;`;
let couple;
try{
 await sql(`insert into auth.users(id,aud,role,email) values ${ids.map(id=>`('${id}','authenticated','authenticated','character-race-${id}@example.test')`).join(',')}`);
 couple=JSON.parse((await sql(asUser(ids[0],`select public.create_couple('${randomUUID()}')`))).split('\n').find(l=>l.startsWith('{'))).couple_id;
 const invite=await sql(`select invite_code from public.couples where id='${couple}'`);await sql(asUser(ids[1],`select public.join_couple('${invite}','${randomUUID()}')`));
 const outcomes=await Promise.all(ids.map((id,i)=>sql(asUser(id,`select public.character_action('request','hug',null,'${sessions[i]}',1040,736,'${randomUUID()}');select pg_sleep(.5)`))));
 const result=outcomes.map(s=>JSON.parse(s.split('\n').find(l=>l.startsWith('{'))));if(result.filter(r=>r.ok).length!==1||result.filter(r=>r.code==='BUSY').length!==1)throw Error('Opposite Hug requests must have exactly one winner.');
 if(await sql(`select count(*) from public.character_social where couple_id='${couple}'`)!=='1')throw Error('Pair uniqueness lost.');
 const row=JSON.parse(await sql(`select row_to_json(s) from public.character_social s where couple_id='${couple}'`));
 const recipient=ids.indexOf(row.recipient_id);await sql(asUser(row.recipient_id,`select public.character_action('accept',null,'${row.id}','${sessions[recipient]}',1040,760,'${randomUUID()}')`));
 const race=await Promise.all([sql(asUser(row.sender_id,`select public.character_action('renew',null,'${row.id}','${row.sender_session}',1040,736,'${randomUUID()}');select pg_sleep(.5)`)),sql(asUser(row.recipient_id,`select public.character_action('cancel',null,'${row.id}','${sessions[recipient]}',1040,760,'${randomUUID()}');select pg_sleep(.5)`))]);
 if(await sql(`select count(*) from public.character_social where couple_id='${couple}'`)!=='0'||race.length!==2)throw Error('Concurrent cancel/renew must end the pair without resurrection.');
 console.log('Character races: one request winner/one BUSY; cancel wins against renewal without resurrection.');
}finally{
 if(couple)await sql(`begin;update public.couples set status='archived',invite_code=null,invite_expires_at=null where id='${couple}';delete from public.couple_members where couple_id='${couple}';delete from public.processed_actions where couple_id='${couple}';update public.couples set house_id=null where id='${couple}';delete from public.houses where couple_id='${couple}';delete from public.couples where id='${couple}';commit;`);
 await sql(`delete from auth.users where id in (${ids.map(id=>`'${id}'`).join(',')})`);
}
