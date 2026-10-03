import { expect, test } from '@playwright/test';
import type { BrowserContext, Page, WebSocketRoute } from '@playwright/test';
import { mkdir,writeFile } from 'node:fs/promises';
import { COTTAGE,cottageInteractions } from '../../packages/shared/src/cottage';
import {defaultAppearance} from '../../packages/shared/src/character';
import {collides} from '../../packages/shared/src/house';
const ids=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222'];
const couple='33333333-3333-4333-8333-333333333333';const house='44444444-4444-4444-8444-444444444444';
type Peer={socket:WebSocketRoute;topic:string;joinRef:string|null;presence?:Record<string,unknown>};
function decode(message:string|Buffer):[string|null,string|null,string,string,Record<string,unknown>] {
  if(typeof message==='string')return JSON.parse(message);
  // supabase-js 2.117 uses v2 binary framing even for JSON Broadcast payloads.
  expect(message[0]).toBe(3);expect(message[6]).toBe(1);
  let offset=7;const fields:string[]=[];
  for(let index=1;index<=5;index++){const length=message[index]!;fields.push(message.subarray(offset,offset+length).toString('utf8'));offset+=length;}
  return[fields[0]!,fields[1]!,fields[2]!,'broadcast',{type:'broadcast',event:fields[3]!,payload:JSON.parse(message.subarray(offset).toString('utf8'))}];
}
function fixture(cottage=false) {
  const peers=new Set<Peer>(); let members=0;let version=1;let invite='ABCD2345';let failSnapshot=false;let signupConfirmation=true;let legacyClock=false;let clockPackets=0;
  const actions=new Map<string,unknown>();let createCount=0;
  const looks=new Map(ids.map((id,i)=>[id,{configured:true,appearance:defaultAppearance(i+1)}]));
  const outfits=new Map<string,Map<number,unknown>>();let social:Record<string,unknown>|null=null;
  const objectStates=new Map<string,boolean>();
  const objectSlots:{object_id:string;slot_id:string;user_id:string;session_id:string;expires_at:string}[]=[];
  const snapshot=(userId:string,since:number,known:string|null)=>{
    if(!members||(userId===ids[1]&&members<2))return{kind:'none',version:0,user_id:userId,server_time:new Date().toISOString()};
    if(since===version&&known===couple)return{kind:'unchanged',version,user_id:userId,couple_id:couple,server_time:new Date().toISOString()};
    return{kind:'full',version,user_id:userId,couple_id:couple,status:members===2?'active':'pending',members:ids.slice(0,members).map((id,index)=>({user_id:id,seat:index+1,role:index===0?'partner_a':'partner_b',display_name:index===0?'Rose':'Sky',joined_at:'2026-10-02T00:00:00Z'})),house:{id:house,map_id:cottage?'cottage-v1':'phase1-room',layout_version:cottage?2:1},invite:members===1?{code:invite,expires_at:'2099-10-09T00:00:00Z'}:null,server_time:new Date().toISOString()};
  };
  const send=(peer:Peer,event:string,payload:unknown,delay=0)=>{setTimeout(()=>{try{peer.socket.send(JSON.stringify([peer.joinRef,null,peer.topic,event,payload]));}catch{/* Closed test page. */}},delay);};
  const presence=()=>{const values=Object.fromEntries([...peers].filter(peer=>peer.presence).map(peer=>[String(peer.presence!.session_id),{metas:[{...peer.presence,phx_ref:peer.presence!.session_id}]}]));for(const peer of peers)send(peer,'presence_state',values);};
  return {
    paired(){members=2;version=2;}, onboarding(){looks.get(ids[0]!)!.configured=false;}, fail(value:boolean){failSnapshot=value;}, confirmation(value:boolean){signupConfirmation=value;}, legacy(){legacyClock=true;}, get clocks(){return clockPackets;}, get creates(){return createCount;},
    async install(context:BrowserContext,index:number){
      const user={id:ids[index]!,aud:'authenticated',role:'authenticated',email:`player${index}@example.test`,user_metadata:{display_name:index===0?'Rose':'Sky'}};
      const encode=(value:unknown)=>Buffer.from(JSON.stringify(value)).toString('base64url');
      const token=`${encode({alg:'HS256',typ:'JWT'})}.${encode({sub:user.id,role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})}.fixture`;
      const session={access_token:token,refresh_token:'fixture-refresh',expires_in:3600,token_type:'bearer',user};
      await context.addInitScript(()=>localStorage.setItem('paw-phase0-public-config',JSON.stringify({url:'https://phase1-test.supabase.co',key:'sb_publishable_public-test-value'})));
      await context.route('https://phase1-test.supabase.co/**',async route=>{
        const path=new URL(route.request().url()).pathname;
        if(path==='/auth/v1/token')await route.fulfill({json:session});
        else if(path==='/auth/v1/signup')await route.fulfill({json:signupConfirmation?{user,session:null}:session});
        else if(path==='/auth/v1/user')await route.fulfill({json:user});
        else if(path==='/auth/v1/logout')await route.fulfill({status:204});
        else if(path.startsWith('/rest/v1/rpc/')){
          const rpc=path.split('/').at(-1);const args=route.request().postDataJSON() as Record<string,unknown>;
          if(rpc==='get_house_snapshot_v2'){if(failSnapshot)await route.abort();else await route.fulfill({json:snapshot(user.id,Number(args.p_since_version),args.p_known_couple_id as string|null)});return;}
          if(rpc==='get_house_world'){await route.fulfill({json:{couple_id:couple,server_time:new Date().toISOString(),states:[...objectStates].map(([object_id,enabled])=>({object_id,enabled})),slots:objectSlots}});return;}
          if(rpc==='get_house_characters'){if(social&&Date.parse(String(social.expires_at))<=Date.now())social=null;await route.fulfill({json:{couple_id:couple,server_time:new Date().toISOString(),profiles:ids.slice(0,members).map(id=>({user_id:id,...looks.get(id)})),presets:[...(outfits.get(user.id)??[])].map(([slot,appearance])=>({slot,appearance})),social}});return;}
          if(rpc==='save_character'){if(args.p_preset===null)looks.set(user.id,{configured:true,appearance:args.p_appearance as ReturnType<typeof defaultAppearance>});else{if(!outfits.has(user.id))outfits.set(user.id,new Map());outfits.get(user.id)!.set(Number(args.p_preset),args.p_appearance);}await route.fulfill({json:{ok:true}});return;}
          if(rpc==='character_action'){
            let result:Record<string,unknown>={ok:true};
            if(args.p_action==='request'){if(social)result={ok:false,code:'BUSY'};else social={id:args.p_idempotency_key,kind:args.p_kind,status:'pending',sender_id:user.id,recipient_id:ids.find(id=>id!==user.id),sender_session:args.p_session_id,recipient_session:null,object_id:args.p_kind==='cuddle'?'sofa':null,sender_x:args.p_x,sender_y:args.p_y,recipient_x:null,recipient_y:null,started_at:null,expires_at:new Date(Date.now()+8000).toISOString()};}
            else if(!social||social.id!==args.p_request_id)result={ok:false,code:'EXPIRED'};
            else if(args.p_action==='accept'){social={...social,status:'active',recipient_session:args.p_session_id,recipient_x:args.p_x,recipient_y:args.p_y,started_at:new Date().toISOString(),expires_at:new Date(Date.now()+90000).toISOString()};}
            else if(args.p_action==='renew')social.expires_at=new Date(Date.now()+90000).toISOString();
            else social=null;
            await route.fulfill({json:result});return;
          }
          if(rpc==='house_interact'){
            const key=String(args.p_idempotency_key);let result=actions.get(key);
            if(!result){const object=cottageInteractions.find(o=>o.id===args.p_object_id);result={ok:true,couple_id:couple};
              if(args.p_action==='cancel'){for(let i=objectSlots.length-1;i>=0;i--)if(objectSlots[i]!.user_id===user.id&&objectSlots[i]!.session_id===args.p_session_id)objectSlots.splice(i,1);}
              else if(!object)result={ok:false,code:'INVALID_OBJECT',couple_id:couple};
              else if(args.p_action==='start'){if(objectSlots.some(s=>s.object_id===object.id&&s.slot_id===args.p_slot_id))result={ok:false,code:'BUSY',couple_id:couple};else objectSlots.push({object_id:object.id,slot_id:String(args.p_slot_id),user_id:user.id,session_id:String(args.p_session_id),expires_at:new Date(Date.now()+90000).toISOString()});}
              else if(args.p_action==='renew'){const slot=objectSlots.find(s=>s.user_id===user.id&&s.session_id===args.p_session_id);if(slot)slot.expires_at=new Date(Date.now()+90000).toISOString();else result={ok:false,code:'NOT_OWNER',couple_id:couple};}
              else if(['fridge','lamp','tv','toilet'].includes(object.type))objectStates.set(object.id,!objectStates.get(object.id));
              else result={ok:false,code:'UNAVAILABLE',couple_id:couple};actions.set(key,result);
            }await route.fulfill({json:result});return;
          }
          const key=String(args.p_idempotency_key);let result=actions.get(key);
          if(!result){
            if(rpc==='create_couple'){if(members)result={ok:false,code:'ALREADY_IN_COUPLE'};else{members=1;createCount++;result={ok:true,couple_id:couple};}}
            else if(rpc==='join_couple'){if(args.p_code!==invite||members!==1)result={ok:false,code:'INVALID_INVITE'};else{members=2;version++;result={ok:true,couple_id:couple};}}
            else if(rpc==='refresh_invite'){invite='WXYZ2345';version++;result={ok:true,couple_id:couple};}
            else if(rpc==='cancel_pending_couple'){members=0;version++;result={ok:true,couple_id:couple};}
            else{await route.abort();return;}
            actions.set(key,result);
          }await route.fulfill({json:result});
        }else await route.abort();
      });
      await context.routeWebSocket('wss://phase1-test.supabase.co/**',socket=>{
        let peer:Peer|undefined;
        socket.onMessage(message=>{
          const [joinRef,ref,topic,event,payload]=decode(message);
          const reply=(response:unknown={})=>socket.send(JSON.stringify([joinRef,ref,topic,'phx_reply',{status:'ok',response}]));
          if(event==='phx_join'){expect(topic).toBe(`realtime:house:${couple}${cottage?':cottage-v1':''}`);peer={socket,topic,joinRef};peers.add(peer);reply();presence();}
          else if(event==='phx_leave'){if(peer)peers.delete(peer);peer=undefined;reply();presence();}
          else if(event==='presence'&&peer){peer.presence={...payload.payload as Record<string,unknown>};if(legacyClock)delete peer.presence.motion_clock;reply();presence();}
          else if(event==='broadcast'&&peer){const value=payload.payload as Record<string,unknown>;if(value?.motion_ms!==undefined)clockPackets++;reply();for(const other of peers)if(other!==peer)send(other,'broadcast',payload,150);}
          else reply();
        });
        socket.onClose(()=>{if(peer)peers.delete(peer);presence();});
      });
    },
  };
}
async function login(page:Page,index:number,path='/'){await page.goto(path);await page.getByLabel('Email',{exact:true}).fill(`player${index}@example.test`);await page.getByLabel('Password',{exact:true}).fill('fixture-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();}
async function coordinate(page:Page,attribute='data-self-x'){return Number(await page.getByTestId('world').getAttribute(attribute));}

async function walkTo(page:Page,x:number,y:number){
 // Route centers keep extra clearance so frame timing cannot clip a corner.
 const start=[Math.floor(await coordinate(page)/32),Math.floor(await coordinate(page,'data-self-y')/32)],goal=[Math.floor(x/32),Math.floor(y/32)];
 const key=(p:number[])=>p.join(',');const queue=[start],parents=new Map<string,string|null>([[key(start),null]]);
 for(let i=0;i<queue.length&&!parents.has(key(goal));i++)for(const n of [[queue[i]![0]!+1,queue[i]![1]!],[queue[i]![0]!-1,queue[i]![1]!],[queue[i]![0]!,queue[i]![1]!+1],[queue[i]![0]!,queue[i]![1]!-1]]){if(n[0]!<0||n[1]!<0||n[0]!>=64||n[1]!>=44||parents.has(key(n))||collides({x:n[0]!*32+16,y:n[1]!*32+16},{...COTTAGE,radius:24}))continue;parents.set(key(n),key(queue[i]!));queue.push(n);}
 expect(parents.has(key(goal))).toBe(true);
 const path:number[][]=[];for(let p:string|null=key(goal);p!==null;p=parents.get(p)??null)path.unshift(p.split(',').map(Number));
 const points=path.filter((p,i)=>i===0||i===path.length-1||(p[0]!-path[i-1]![0]!)!==(path[i+1]![0]!-p[0]!)||(p[1]!-path[i-1]![1]!)!==(path[i+1]![1]!-p[1]!));
 for(const p of points)for(const [attribute,target,negative,positive] of [['data-self-x',p[0]!*32+16,'a','d'],['data-self-y',p[1]!*32+16,'w','s']] as const){
  let current=await coordinate(page,attribute);
  if(Math.abs(target-current)>24){const direction=target>current?positive:negative;await page.keyboard.down(direction);await expect.poll(async()=>{const value=await coordinate(page,attribute);return target>current?value>=target-24:value<=target+24;},{timeout:20000,intervals:[25],message:`Walk ${direction} from ${current} to ${target} (${attribute})`}).toBe(true);await page.keyboard.up(direction);await page.waitForTimeout(120);}
  for(let adjust=0;adjust<24;adjust++){current=await coordinate(page,attribute);if(Math.abs(target-current)<=8)break;const box=(await page.getByRole('button',{name:'Move',exact:true}).boundingBox())!;const offset=box.width*.32*.22*(target>current?1:-1);const cx=box.x+box.width/2,cy=box.y+box.height/2;await page.mouse.move(cx,cy);await page.mouse.down();await page.mouse.move(cx+(attribute==='data-self-x'?offset:0),cy+(attribute==='data-self-y'?offset:0));await page.waitForTimeout(60);await page.mouse.up();await page.waitForTimeout(110);}
  expect(Math.abs(target-await coordinate(page,attribute)),`Align ${attribute} to ${target}`).toBeLessThanOrEqual(8);
 }
}

test('balanced house: desktop/mobile explore, shared slots, furniture actions and idle budget',async({browser})=>{
 test.setTimeout(300000);const app=fixture(true);app.paired();
 const desktop=await browser.newContext({viewport:{width:1280,height:720}}),mobile=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 await app.install(desktop,0);await app.install(mobile,1);const a=await desktop.newPage(),b=await mobile.newPage();await login(a,0);await login(b,1);
 await expect(a.getByText('Connected',{exact:true})).toBeVisible();await expect(b.getByText('Connected',{exact:true})).toBeVisible();await expect(a.getByTestId('world')).toHaveAttribute('data-room','hall');
 await a.getByRole('button',{name:'Map',exact:true}).click();await expect(a.getByRole('img',{name:'House map with player locations'})).toBeVisible();await a.getByRole('button',{name:'Map',exact:true}).click();
 const joystick=b.getByRole('button',{name:'Move',exact:true});const box=(await joystick.boundingBox())!;const before=await coordinate(b,'data-self-y');await b.mouse.move(box.x+box.width/2,box.y+box.height/2);await b.mouse.down();await b.mouse.move(box.x+box.width/2,box.y+10);await expect.poll(()=>coordinate(b,'data-self-y')).toBeLessThan(before-20);await b.mouse.up();
 await walkTo(a,624,992);await expect(a.getByRole('button',{name:'Play',exact:true})).toBeVisible();await a.getByRole('button',{name:'Play',exact:true}).click();await expect(a.getByText('This activity is coming soon.')).toBeVisible();await expect(a.getByText('This activity is coming soon.')).toBeHidden({timeout:5000});
 await Promise.all([walkTo(a,256,1200),walkTo(b,256,1200)]);await Promise.all([a.getByRole('button',{name:'Sit',exact:true}).click(),b.getByRole('button',{name:'Sit',exact:true}).click()]);
 // A racing loser gets authoritative busy feedback, then retries the free seat.
 await Promise.all([a,b].map(async page=>{await expect.poll(async()=>await page.getByRole('button',{name:'Leave',exact:true}).isVisible()||await page.getByText('That spot is busy. Try the other spot.').isVisible()).toBe(true);if(!await page.getByRole('button',{name:'Leave',exact:true}).isVisible())await page.getByRole('button',{name:'Sit',exact:true}).click();}));
 await expect(a.getByRole('button',{name:'Leave',exact:true})).toBeVisible();await expect(b.getByRole('button',{name:'Leave',exact:true})).toBeVisible();
 await a.getByRole('button',{name:'Cuddle',exact:true}).click();await b.getByRole('button',{name:'Accept',exact:true}).click();await expect(a.getByTestId('world')).toHaveAttribute('data-social','active');await expect(b.getByTestId('world')).toHaveAttribute('data-social','active');
 await a.getByRole('button',{name:'Settings',exact:true}).click();await a.getByRole('button',{name:'Reconnect',exact:true}).click();await expect(a.getByText('Connected',{exact:true})).toBeVisible();await expect(a.getByRole('button',{name:'Leave',exact:true})).toBeVisible();
 await expect(a.getByTestId('world')).toHaveAttribute('data-social','none');
 await mkdir('artifacts/phase2',{recursive:true});await a.screenshot({path:'artifacts/phase2/balanced-house-desktop.png'});await b.screenshot({path:'artifacts/phase2/balanced-house-mobile.png'});
 await a.keyboard.press('Escape');await b.getByRole('button',{name:'Leave',exact:true}).click();await expect(a.getByRole('button',{name:'Sit',exact:true})).toBeVisible();
 await walkTo(a,144,256);await expect(a.getByTestId('world')).toHaveAttribute('data-room','kitchen');await a.getByRole('button',{name:'Open',exact:true}).click();
 await walkTo(a,1216,576);await expect(a.getByTestId('world')).toHaveAttribute('data-room','bedroom');await walkTo(a,1248,896);await expect(a.getByTestId('world')).toHaveAttribute('data-room','bathroom');
 const sent=await a.getByTestId('world').getAttribute('data-sent');await a.waitForTimeout(1300);expect(await a.getByTestId('world').getAttribute('data-sent')).toBe(sent);
 await desktop.close();await mobile.close();
});

test('guided mobile creator saves live appearance, mirror starts Body and wardrobe starts Clothes',async({browser})=>{
 test.setTimeout(150000);const app=fixture(true);app.paired();app.onboarding();const phone=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),desktop=await browser.newContext({viewport:{width:1280,height:800}});await app.install(phone,0);await app.install(desktop,1);const a=await phone.newPage(),b=await desktop.newPage();await login(a,0);await login(b,1);
 const editor=a.getByRole('dialog',{name:'Character',exact:true});await expect(editor).toBeVisible();await expect(editor.getByText('1 / 4 · Body')).toBeVisible();expect((await editor.boundingBox())!.width).toBe(844);
 await editor.getByLabel('Skin tone',{exact:true}).selectOption('body.skin3');await expect(editor.getByText('Placeholder: male parts, body types and height variants unavailable.')).toBeVisible();
 const position=await coordinate(a);await a.keyboard.down('d');await a.waitForTimeout(300);await a.keyboard.up('d');expect(await coordinate(a)).toBe(position);
 await editor.getByRole('button',{name:'Next',exact:true}).click();await expect(editor.getByText('2 / 4 · Face/Hair')).toBeVisible();await editor.getByLabel('Hair back',{exact:true}).selectOption('hair_back.twintails.black');await editor.getByLabel('Hair front',{exact:true}).selectOption('hair_front.short.black');await editor.getByRole('button',{name:'Next',exact:true}).click();await editor.getByLabel('Outfit',{exact:true}).selectOption('outfit.coat');await editor.getByRole('button',{name:'Save outfit',exact:true}).click();await expect(editor.getByRole('button',{name:'Wear',exact:true})).toBeEnabled();await editor.getByRole('button',{name:'Next',exact:true}).click();await expect(editor.getByText('4 / 4 · Review')).toBeVisible();await editor.getByRole('button',{name:'Save',exact:true}).click();await expect(editor).toBeHidden();
 await expect.poll(async()=>await b.getByTestId('world').getAttribute('data-partner-look')).toBe(await a.getByTestId('world').getAttribute('data-self-look'));
 await walkTo(a,1744,432);await a.getByRole('button',{name:'Open',exact:true}).click();await expect(editor.getByText('1 / 4 · Body')).toBeVisible();await editor.getByLabel('Skin tone',{exact:true}).selectOption('body.skin1');await editor.getByRole('button',{name:'Cancel',exact:true}).click();expect(JSON.parse((await a.getByTestId('world').getAttribute('data-self-look'))!).body).toBe('body.skin3');
 await walkTo(a,1712,208);await a.getByRole('button',{name:'Change Clothes',exact:true}).click();await expect(editor.getByText('3 / 4 · Clothes')).toBeVisible();await editor.getByRole('button',{name:'Wear',exact:true}).click();await mkdir('artifacts/phase3',{recursive:true});await a.screenshot({path:'artifacts/phase3/guided-editor-mobile.png'});await editor.getByRole('button',{name:'Cancel',exact:true}).click();await phone.close();await desktop.close();
});

test('consent expires, accepts on both clients, cancels by movement and reactions expire',async({browser})=>{
 test.setTimeout(60000);const app=fixture(true);app.paired();const ca=await browser.newContext(),cb=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});await app.install(ca,0);await app.install(cb,1);const a=await ca.newPage(),b=await cb.newPage();await login(a,0);await login(b,1);await expect(a.getByText('Connected',{exact:true})).toBeVisible();await expect(b.getByText('Connected',{exact:true})).toBeVisible();
 await a.getByRole('button',{name:'Hug',exact:true}).click();await expect(b.getByRole('button',{name:'Accept',exact:true})).toBeVisible();await expect(b.getByRole('button',{name:'Accept',exact:true})).toBeHidden({timeout:11000});
 await a.getByRole('button',{name:'Hug',exact:true}).click();await b.getByRole('button',{name:'Ignore',exact:true}).click();await expect(a.getByTestId('world')).toHaveAttribute('data-social','none');
 await a.getByRole('button',{name:'Hug',exact:true}).click();await b.getByRole('button',{name:'Accept',exact:true}).click();await expect(a.getByTestId('world')).toHaveAttribute('data-social','active');await expect(b.getByTestId('world')).toHaveAttribute('data-social','active');await b.keyboard.down('s');await expect(a.getByTestId('world')).toHaveAttribute('data-social','none');await b.keyboard.up('s');
 await a.getByRole('button',{name:'Emote',exact:true}).click();await a.getByRole('group',{name:'Emotes'}).getByRole('button',{name:'Love',exact:true}).click();await expect(b.getByTestId('world')).toHaveAttribute('data-reactions','love');await expect(b.getByTestId('world')).toHaveAttribute('data-reactions','',{timeout:5000});await ca.close();await cb.close();
});

test('phone login in a new session establishes the hall spawn on the partner immediately',async({browser})=>{
 test.setTimeout(90000);
 const app=fixture(true);app.paired();
 const desktop=await browser.newContext({viewport:{width:1280,height:800}}),phone=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
 await app.install(desktop,0);await app.install(phone,1);
 const a=await desktop.newPage(),b=await phone.newPage();await login(a,0);await login(b,1);
 await expect(a.getByText('Connected',{exact:true})).toBeVisible();await expect(b.getByText('Connected',{exact:true})).toBeVisible();
 await walkTo(b,800,1008);await expect(b.getByTestId('world')).toHaveAttribute('data-room','living');
 await expect.poll(()=>coordinate(a,'data-partner-x')).toBeLessThan(850);
 await b.getByRole('button',{name:'Settings',exact:true}).click();await b.getByRole('button',{name:'Sign out',exact:true}).click();
 await expect(b.getByRole('button',{name:'Sign in',exact:true})).toBeVisible();
 await login(b,1);await expect(b.getByText('Connected',{exact:true})).toBeVisible();await expect(b.getByTestId('world')).toHaveAttribute('data-room','hall');
 // Packet delivery is delayed 150ms, but the first valid new-session frame
 // must establish the spawn, never ease across the wall from the old room.
 await expect.poll(async()=>Math.hypot(await coordinate(a,'data-partner-x')-await coordinate(b),await coordinate(a,'data-partner-y')-await coordinate(b,'data-self-y')),{timeout:1500,intervals:[25]}).toBeLessThan(1);
 await a.waitForTimeout(600);expect(await coordinate(a,'data-partner-x')).toBe(await coordinate(b));
 await desktop.close();await phone.close();
});

test('signup confirmation, invalid invite, create/cancel and session persistence',async({browser})=>{
  const app=fixture();const context=await browser.newContext();await app.install(context,0);const page=await context.newPage();await page.goto('/');
  await page.getByRole('button',{name:'Create account',exact:true}).click();await page.getByLabel('Name',{exact:true}).fill('Rose');await page.getByLabel('Email',{exact:true}).fill('player0@example.test');await page.getByLabel('Password',{exact:true}).fill('fixture-password');await page.getByRole('button',{name:'Create account',exact:true}).first().click();
  await expect(page.getByRole('status')).toContainText('Check your email');await page.getByRole('button',{name:'Back to sign in'}).click();await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.getByLabel('Invite code').fill('BADCODE');await page.getByRole('button',{name:'Join',exact:true}).click();await expect(page.getByRole('status')).toContainText('invalid');
  await page.getByRole('button',{name:'Create couple'}).click();await expect(page.getByText('ABCD2345',{exact:true})).toBeVisible();expect(app.creates).toBe(1);
  await page.reload();await expect(page.getByText('ABCD2345',{exact:true})).toBeVisible();await page.getByRole('button',{name:'New invite'}).click();await expect(page.getByText('WXYZ2345',{exact:true})).toBeVisible();
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Cancel invite'}).click();await expect(page.getByRole('button',{name:'Create couple'})).toBeVisible();await context.close();
});

test('two sessions move, collide, stop idle traffic and reconnect at 150ms latency',async({browser})=>{
  test.setTimeout(60000);
  const app=fixture();app.paired();const aContext=await browser.newContext({viewport:{width:1280,height:800}});const bContext=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
  await app.install(aContext,0);await app.install(bContext,1);const a=await aContext.newPage();const b=await bContext.newPage();await login(a,0);await login(b,1);
  await expect(a.getByText('Connected',{exact:true})).toBeVisible();await expect(b.getByText('Connected',{exact:true})).toBeVisible();await expect(a.locator('canvas')).toBeVisible();
  await mkdir('artifacts/phase1',{recursive:true});await a.screenshot({path:'artifacts/phase1/desktop-room.png'});await b.screenshot({path:'artifacts/phase1/mobile-room.png'});
  await expect.poll(()=>coordinate(b,'data-partner-x')).toBeCloseTo(590,0);
  await a.locator('canvas').click();await a.keyboard.down('d');await expect.poll(()=>coordinate(b,'data-partner-x')).toBeGreaterThan(660);await a.keyboard.up('d');
  await expect.poll(async()=>Math.abs(await coordinate(a)-await coordinate(b,'data-partner-x'))).toBeLessThan(12);
  const stick=await b.getByRole('button',{name:'Move',exact:true}).boundingBox();const touch=await bContext.newCDPSession(b);const x=stick!.x+stick!.width/2,y=stick!.y+stick!.height/2;
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+35,y}]});await expect.poll(()=>coordinate(b)).toBeGreaterThan(850);await expect.poll(()=>coordinate(a,'data-partner-x')).toBeGreaterThan(850);await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect.poll(async()=>Math.abs(await coordinate(b)-await coordinate(a,'data-partner-x'))).toBeLessThan(12);
  const sent=await a.getByTestId('world').getAttribute('data-sent');await a.waitForTimeout(1500);expect(await a.getByTestId('world').getAttribute('data-sent')).toBe(sent);
  const stoppedB=await coordinate(b);await a.getByRole('button',{name:'Settings',exact:true}).click();await a.getByRole('button',{name:'Reconnect',exact:true}).click();await expect(a.getByText('Connected',{exact:true})).toBeVisible();await expect.poll(async()=>Math.abs(await coordinate(a,'data-partner-x')-stoppedB)).toBeLessThan(12);
  // Polling a remote avatar can overshoot on a slow runner. Align the local
  // character beneath the table before asserting its lower collision edge.
  await a.locator('canvas').click();
  const alignKey=await coordinate(a)>730?'a':'d';
  await a.keyboard.down(alignKey);
  await expect.poll(async()=>alignKey==='a'?await coordinate(a)<=730:await coordinate(a)>=730,{intervals:[25]}).toBe(true);
  await a.keyboard.up(alignKey);
  expect(await coordinate(a)).toBeGreaterThan(665);expect(await coordinate(a)).toBeLessThan(795);
  await a.keyboard.down('w');await expect.poll(()=>coordinate(a,'data-self-y'),{intervals:[25]}).toBeLessThan(400);await a.waitForTimeout(1200);await a.keyboard.up('w');expect(await coordinate(a,'data-self-y')).toBeGreaterThanOrEqual(370);expect(await coordinate(a,'data-self-y')).toBeLessThan(380);
  expect(app.clocks).toBeGreaterThan(0);
  await aContext.close();await bContext.close();
});

test('legacy Presence keeps motion packets compatible with the existing strict-schema APK',async({browser})=>{
  const app=fixture();app.paired();app.legacy();const ac=await browser.newContext(),bc=await browser.newContext();await app.install(ac,0);await app.install(bc,1);const a=await ac.newPage(),b=await bc.newPage();await login(a,0);await login(b,1);await expect(a.getByText('Connected',{exact:true})).toBeVisible();await expect(b.getByText('Connected',{exact:true})).toBeVisible();
  await a.locator('canvas').click();await a.keyboard.down('d');await expect.poll(()=>coordinate(b,'data-partner-x')).toBeGreaterThan(620);await a.keyboard.up('d');await expect.poll(async()=>Math.abs(await coordinate(a)-await coordinate(b,'data-partner-x'))).toBeLessThan(12);expect(app.clocks).toBe(0);
  await ac.close();await bc.close();
});

test('newest device takes control and logout wipes private IndexedDB cache',async({browser})=>{
  const app=fixture();app.paired();const first=await browser.newContext();const second=await browser.newContext();await app.install(first,0);await app.install(second,0);const a=await first.newPage(),b=await second.newPage();await login(a,0);await expect(a.getByText('Connected',{exact:true})).toBeVisible();await login(b,0);
  await expect(a.getByText('Playing on another device.',{exact:false})).toBeVisible();const before=await coordinate(a);await a.keyboard.down('d');await a.waitForTimeout(250);await a.keyboard.up('d');expect(await coordinate(a)).toBe(before);
  await a.getByRole('button',{name:'Play here'}).click();await expect(b.getByText('Playing on another device.',{exact:false})).toBeVisible();
  await a.getByRole('button',{name:'Settings',exact:true}).click();await a.getByRole('button',{name:'Sign out',exact:true}).click();await expect(a.getByRole('button',{name:'Sign in',exact:true})).toBeVisible();
  const count=await a.evaluate(()=>new Promise<number>((resolve,reject)=>{const request=indexedDB.open('paw-house-cache',1);request.onsuccess=()=>{const db=request.result;const count=db.transaction('snapshots').objectStore('snapshots').count();count.onsuccess=()=>{resolve(count.result);db.close();};count.onerror=()=>reject(count.error);};}));expect(count).toBe(0);
  await first.close();await second.close();
});

test('invite link joins a partner already walking in a pending home',async({browser})=>{
  const app=fixture();const ac=await browser.newContext(),bc=await browser.newContext();await app.install(ac,0);await app.install(bc,1);const a=await ac.newPage(),b=await bc.newPage();
  await login(a,0);await a.getByRole('button',{name:'Create couple'}).click();await a.getByRole('button',{name:'Home',exact:true}).click();await expect(a.getByText('Connected',{exact:true})).toBeVisible();
  await login(b,1,'/?invite=ABCD2345');await expect(b.getByLabel('Invite code')).toHaveValue('ABCD2345');await b.getByRole('button',{name:'Join',exact:true}).click();await expect(b.getByText('Connected',{exact:true})).toBeVisible();
  await expect.poll(()=>coordinate(a,'data-partner-x')).toBe(780);await b.locator('canvas').click();await b.keyboard.down('d');await expect.poll(()=>coordinate(a,'data-partner-x')).toBeGreaterThan(830);await b.keyboard.up('d');
  await ac.close();await bc.close();
});

test('simultaneous movement, both reconnect, background recovery, cached offline read-only',async({browser})=>{
  test.setTimeout(90000); // Includes the SDK's real network-error retry backoff.
  const app=fixture();app.paired();const ac=await browser.newContext(),bc=await browser.newContext();await app.install(ac,0);await app.install(bc,1);const a=await ac.newPage(),b=await bc.newPage();await login(a,0);await login(b,1);await expect(a.getByText('Connected',{exact:true})).toBeVisible();await expect(b.getByText('Connected',{exact:true})).toBeVisible();await expect(a.locator('canvas')).toBeVisible();await expect(b.locator('canvas')).toBeVisible();
  await Promise.all([a.locator('canvas').click(),b.locator('canvas').click()]);await Promise.all([a.keyboard.down('a'),b.keyboard.down('d')]);await expect.poll(()=>coordinate(b,'data-partner-x')).toBeLessThan(540);await expect.poll(()=>coordinate(a,'data-partner-x')).toBeGreaterThan(830);await Promise.all([a.keyboard.up('a'),b.keyboard.up('d')]);
  const reconnect=async(page:Page)=>{await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:'Reconnect',exact:true}).click();};await Promise.all([reconnect(a),reconnect(b)]);await expect(a.getByText('Connected',{exact:true})).toBeVisible();await expect(b.getByText('Connected',{exact:true})).toBeVisible();
  // Simulate a Page Visibility lifecycle transition; movement still uses real keys/canvas.
  await a.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});const sent=await a.getByTestId('world').getAttribute('data-sent');await a.keyboard.down('d');await a.waitForTimeout(400);await a.keyboard.up('d');expect(await a.getByTestId('world').getAttribute('data-sent')).toBe(sent);
  await a.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await a.locator('canvas').click();const before=await coordinate(a);await a.keyboard.down('d');await expect.poll(()=>coordinate(a)).toBeGreaterThan(before+25);await a.keyboard.up('d');
  app.fail(true);await a.reload();await expect(a.getByTestId('world')).toBeVisible();await expect(a.getByText('Your home could not load.',{exact:false})).toBeVisible();const cached=await coordinate(a);await a.locator('canvas').click();await a.keyboard.down('d');await a.waitForTimeout(300);await a.keyboard.up('d');expect(await coordinate(a)).toBe(cached);
  app.fail(false);await reconnect(a);await expect(a.getByText('Connected',{exact:true})).toBeVisible();await ac.close();await bc.close();
});

test('two visible characters report walking FPS and bounded memory over a desktop run',async({browser})=>{
 test.setTimeout(120000);const app=fixture(true);app.paired();const ca=await browser.newContext({viewport:{width:1280,height:800}}),cb=await browser.newContext();await app.install(ca,0);await app.install(cb,1);const a=await ca.newPage(),b=await cb.newPage();await login(a,0);await login(b,1);await expect(a.getByText('Connected',{exact:true})).toBeVisible();await expect(b.getByText('Connected',{exact:true})).toBeVisible();
 const errors:string[]=[];a.on('pageerror',error=>errors.push(error.message));const cdp=await ca.newCDPSession(a);const before=await cdp.send('Runtime.getHeapUsage');const samples:string[]=[];
 await a.bringToFront();await expect(a.locator('.world-canvas canvas')).toBeVisible();
 for(let i=0;i<30;i++){const direction=i%2?'s':'w',start=await coordinate(a,'data-self-y');await a.keyboard.down(direction);await a.waitForTimeout(1000);await a.keyboard.up(direction);expect(Math.abs(await coordinate(a,'data-self-y')-start)).toBeGreaterThan(30);await a.waitForTimeout(100);const reading=await a.locator('.world-canvas').getAttribute('data-performance');if(reading)samples.push(reading);}
 const after=await cdp.send('Runtime.getHeapUsage');expect(samples.length).toBeGreaterThan(5);expect(samples.every(sample=>sample.includes('2 characters in view'))).toBe(true);expect(errors).toEqual([]);
 const renderer=await a.evaluate(()=>{const canvas=document.querySelector('.world-canvas canvas') as HTMLCanvasElement;const gl=canvas.getContext('webgl')??canvas.getContext('webgl2');const extension=gl?.getExtension('WEBGL_debug_renderer_info');return extension?gl?.getParameter(extension.UNMASKED_RENDERER_WEBGL):'Unavailable';});
 await a.getByRole('button',{name:'Settings',exact:true}).click();await expect(a.getByTestId('performance-reading')).toContainText('Character pixels');await mkdir('artifacts/phase3',{recursive:true});await writeFile('artifacts/phase3/web-performance.json',JSON.stringify({conditions:'1280x800, two authenticated fixture clients, two visible PNG-composed characters, 30 seconds alternating movement. Not an Android result.',build:process.env.PERFORMANCE_BUILD?'production':'development',headless:test.info().project.use.headless??true,renderer,samples,heapBefore:before,heapAfter:after,userAgent:await a.evaluate(()=>navigator.userAgent)},null,2));await a.screenshot({path:'artifacts/phase3/two-character-performance.png'});await ca.close();await cb.close();
});
