import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cottageInteractions } from '@paw/shared';
import type { HouseSnapshot, HousePresence, ConnectionState, WorldState } from '@paw/shared';
import type { HouseMessage, HouseRealtimeTransport } from '../infra/HouseTransport';
import { HouseRuntime } from './HouseRuntime';
vi.mock('../infra/lifecycle',()=>({watchForeground:()=>()=>undefined}));
const ids=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222'];
const couple='33333333-3333-4333-8333-333333333333';
const sofa=cottageInteractions.find(o=>o.id==='sofa')!;
const flush=async()=>{await vi.advanceTimersByTimeAsync(600);};
function pair(){
 let slots:WorldState['slots']=[];
 let dropHints=false,failRenew=false;
 let holdRenew:(()=>void)|undefined;
 const presences:HousePresence[]=[];
 const messages:((m:HouseMessage)=>void)[]=[];
 const presenceListeners:((p:HousePresence[])=>void)[]=[];
 const world=vi.fn(async()=>({couple_id:couple,server_time:new Date().toISOString(),states:[],slots:structuredClone(slots.filter(s=>Date.parse(s.expires_at)>Date.now()))}));
 const runtimes=ids.map((id,index)=>{
  let state:(s:ConnectionState)=>void=()=>undefined;
  const transport:HouseRealtimeTransport={
   connect:async()=>undefined,join:async()=>{state('connected');},disconnect:async()=>undefined,
   track:async p=>{presences[index]=p;presenceListeners.forEach(fn=>fn(presences));},presence:()=>presences,
   onState:fn=>{state=fn;return()=>undefined;},onMessage:fn=>{messages[index]=fn;return()=>undefined;},onPresence:fn=>{presenceListeners[index]=fn;return()=>undefined;},
   send:async m=>{if(dropHints&&m.event==='object_changed')return;messages.forEach((fn,i)=>{if(i!==index)fn(m);});},
  };
  const snapshot={kind:'full',version:2,user_id:id,couple_id:couple,status:'active',members:ids.map((user_id,i)=>({user_id,seat:i+1,role:i===0?'partner_a':'partner_b',display_name:'Partner',joined_at:new Date().toISOString()})),house:{id:'44444444-4444-4444-8444-444444444444',map_id:'cottage-v1',layout_version:2},invite:null,server_time:new Date().toISOString()} as HouseSnapshot;
  const api={snapshot:async()=>({...snapshot,server_time:new Date().toISOString()}),world,interact:async(action:string,object:string|null,slot:string|null,session:string)=>{
   if(action==='start')slots.push({object_id:object!,slot_id:slot!,user_id:id,session_id:session,expires_at:new Date(Date.now()+90000).toISOString()});
   if(action==='renew'){if(holdRenew)await new Promise<void>(resolve=>{holdRenew=resolve;});if(failRenew){slots=[];throw new Error('NOT_OWNER');}slots.forEach(s=>{if(s.user_id===id)s.expires_at=new Date(Date.now()+90000).toISOString();});}
   if(action==='cancel')slots=slots.filter(s=>s.user_id!==id||s.session_id!==session);
  }};
  return new HouseRuntime(transport,api,snapshot,()=>undefined);
 });
 return{runtimes,world,drop:()=>{dropHints=true;},fail:()=>{failRenew=true;},hold:()=>{holdRenew=()=>undefined;},release:()=>holdRenew?.()};
}
beforeEach(()=>{vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-03T00:00:00Z'));vi.stubGlobal('document',{hidden:false});});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
it('keeps the partner seated past the original lease across multiple renewals',async()=>{
 const p=pair(),[a,b]=p.runtimes;await a!.start();await b!.start();await flush();await a!.interact(sofa);await flush();
 for(let i=1;i<=4;i++){vi.setSystemTime(Date.now()+30000);a!.tick({x:0,y:0},.016,i*31000);await flush();expect(b!.view().world?.slots).toHaveLength(1);}
 expect(Date.parse(b!.view().world!.slots[0]!.expires_at)).toBeGreaterThan(Date.now());
});
it('recovers a renewed seat when its invalidation was lost, without empty-world polling',async()=>{
 const p=pair(),[a,b]=p.runtimes;await a!.start();await b!.start();await flush();await a!.interact(sofa);await flush();p.drop();
 for(let i=1;i<=3;i++){vi.setSystemTime(Date.now()+30000);a!.tick({x:0,y:0},.016,i*31000);await flush();}
 b!.tick({x:0,y:0},.016,100000);await flush();expect(b!.view().world?.slots).toHaveLength(1);
 await a!.cancelInteraction();vi.setSystemTime(Date.now()+90000);b!.tick({x:0,y:0},.016,200000);await flush();expect(b!.view().world?.slots).toHaveLength(0);
 const reads=p.world.mock.calls.length;for(let i=0;i<100;i++)b!.tick({x:0,y:0},.016,200000+i*16);await flush();expect(p.world.mock.calls.length).toBe(reads);
});
it('reconciles a rejected renewal instead of retaining a local phantom seat',async()=>{
 const p=pair(),a=p.runtimes[0]!;await a.start();await a.interact(sofa);p.fail();vi.setSystemTime(Date.now()+30000);a.tick({x:0,y:0},.016,31000);await flush();expect(a.view().world?.slots).toHaveLength(0);
});
it('serializes Leave after an in-flight renewal',async()=>{
 const p=pair(),a=p.runtimes[0]!;await a.start();await a.interact(sofa);p.hold();vi.setSystemTime(Date.now()+30000);a.tick({x:0,y:0},.016,31000);const leave=a.cancelInteraction();p.release();await leave;expect(a.view().world?.slots).toHaveLength(0);
});
