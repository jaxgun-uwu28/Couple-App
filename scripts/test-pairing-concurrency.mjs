// Local Supabase CI database only. No hosted keys, accounts or network calls.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
const exec = promisify(execFile);
const ids = Array.from({length:3},()=>randomUUID());
const sql = async query => (await exec('docker',['exec','supabase_db_paw-and-us','psql','-U','postgres','-d','postgres','-At','-v','ON_ERROR_STOP=1','-c',query],{maxBuffer:1024*1024})).stdout.trim();
const asUser = (id,query) => `begin; set local role authenticated; set local request.jwt.claim.sub = '${id}'; ${query}; commit;`;
let couple;
try {
  await sql(`insert into auth.users(id,aud,role,email) values ${ids.map((id,index)=>`('${id}','authenticated','authenticated','race-${id}-${index}@example.test')`).join(',')};`);
  const created = await sql(asUser(ids[0],`select public.create_couple('${randomUUID()}')`));
  const result = JSON.parse(created.split('\n').find(line=>line.startsWith('{')));
  if(!result.ok)throw new Error('Fixture creation failed.');couple=result.couple_id;
  const code = await sql(`select invite_code from public.couples where id='${couple}'`);
  const results = await Promise.all(ids.slice(1).map(id=>sql(asUser(id,`select public.join_couple('${code}','${randomUUID()}'); select pg_sleep(0.5)`))));
  const outcomes = results.map(value=>JSON.parse(value.split('\n').find(line=>line.startsWith('{'))));
  if(outcomes.filter(value=>value.ok).length!==1||outcomes.filter(value=>value.code==='INVALID_INVITE').length!==1)throw new Error('Concurrent joins did not produce one winner and one refusal.');
  if(await sql(`select count(*) from public.couple_members where couple_id='${couple}'`)!=='2')throw new Error('Active membership count changed.');
  console.log('Concurrent invite join: one winner, one INVALID_INVITE, exactly two members.');
} finally {
  // Archive first so deferred membership constraints still hold at commit.
  if(couple)await sql(`begin; update public.couples set status='archived',invite_code=null,invite_expires_at=null where id='${couple}'; delete from public.couple_members where couple_id='${couple}'; delete from public.processed_actions where couple_id='${couple}'; update public.couples set house_id=null where id='${couple}'; delete from public.houses where couple_id='${couple}'; delete from public.couples where id='${couple}'; commit;`);
  await sql(`delete from auth.users where id in (${ids.map(id=>`'${id}'`).join(',')})`);
}
