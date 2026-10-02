import { expect, test } from '@playwright/test';
import type { BrowserContext, Page, WebSocketRoute } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
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
function fixture() {
  const peers=new Set<Peer>(); let members=0;let version=1;let invite='ABCD2345';let failSnapshot=false;let signupConfirmation=true;
  const actions=new Map<string,unknown>();let createCount=0;
  const snapshot=(userId:string,since:number,known:string|null)=>{
    if(!members||(userId===ids[1]&&members<2))return{kind:'none',version:0,user_id:userId,server_time:new Date().toISOString()};
    if(since===version&&known===couple)return{kind:'unchanged',version,user_id:userId,couple_id:couple,server_time:new Date().toISOString()};
    return{kind:'full',version,user_id:userId,couple_id:couple,status:members===2?'active':'pending',members:ids.slice(0,members).map((id,index)=>({user_id:id,seat:index+1,role:index===0?'partner_a':'partner_b',display_name:index===0?'Rose':'Sky',joined_at:'2026-10-02T00:00:00Z'})),house:{id:house,map_id:'phase1-room',layout_version:1},invite:members===1?{code:invite,expires_at:'2099-10-09T00:00:00Z'}:null,server_time:new Date().toISOString()};
  };
  const send=(peer:Peer,event:string,payload:unknown,delay=0)=>{setTimeout(()=>{try{peer.socket.send(JSON.stringify([peer.joinRef,null,peer.topic,event,payload]));}catch{/* Closed test page. */}},delay);};
  const presence=()=>{const values=Object.fromEntries([...peers].filter(peer=>peer.presence).map(peer=>[String(peer.presence!.session_id),{metas:[{...peer.presence,phx_ref:peer.presence!.session_id}]}]));for(const peer of peers)send(peer,'presence_state',values);};
  return {
    paired(){members=2;version=2;}, fail(value:boolean){failSnapshot=value;}, confirmation(value:boolean){signupConfirmation=value;}, get creates(){return createCount;},
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
          if(rpc==='get_house_snapshot'){if(failSnapshot)await route.abort();else await route.fulfill({json:snapshot(user.id,Number(args.p_since_version),args.p_known_couple_id as string|null)});return;}
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
          if(event==='phx_join'){expect(topic).toBe(`realtime:house:${couple}`);peer={socket,topic,joinRef};peers.add(peer);reply();presence();}
          else if(event==='phx_leave'){if(peer)peers.delete(peer);peer=undefined;reply();presence();}
          else if(event==='presence'&&peer){peer.presence=payload.payload as Record<string,unknown>;reply();presence();}
          else if(event==='broadcast'&&peer){reply();for(const other of peers)if(other!==peer)send(other,'broadcast',payload,150);}
          else reply();
        });
        socket.onClose(()=>{if(peer)peers.delete(peer);presence();});
      });
    },
  };
}
async function login(page:Page,index:number,path='/'){await page.goto(path);await page.getByLabel('Email',{exact:true}).fill(`player${index}@example.test`);await page.getByLabel('Password',{exact:true}).fill('fixture-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();}
async function coordinate(page:Page,attribute='data-self-x'){return Number(await page.getByTestId('world').getAttribute(attribute));}

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
  await a.keyboard.down('w');await expect.poll(()=>coordinate(a,'data-self-y')).toBeLessThan(400);await a.waitForTimeout(1200);await a.keyboard.up('w');expect(await coordinate(a,'data-self-y')).toBeGreaterThanOrEqual(370);
  await aContext.close();await bContext.close();
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
