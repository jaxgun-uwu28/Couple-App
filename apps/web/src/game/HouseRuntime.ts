import { Capacitor } from '@capacitor/core';
import { MotionBudget, RemoteMotion, clampPoint, facing, movePoint, preferredSessions, spawn, velocity } from '@paw/shared';
import type { ConnectionState, HousePresence, HouseSnapshot, Motion, MotionEvent, Point } from '@paw/shared';
import type { HouseMessage, HouseRealtimeTransport } from '../infra/HouseTransport';
import type { HouseApi } from '../infra/HouseApi';
import { watchForeground } from '../infra/lifecycle';

export type Actor = { id: string; name: string; seat: number; point: Point; direction: Motion['direction']; animation: Motion['animation']; online: boolean; away: boolean; local: boolean; lastSeen: number };
export type RuntimeView = { connection: ConnectionState; ready: boolean; message: string; takenOver: boolean; active: boolean; sent: number; received: number; actors: Actor[] };
type Remote = { motion: RemoteMotion; point: Point; offlineSince: number | null; online: boolean; away: boolean; lastSeen: number };

export class HouseRuntime {
  private snapshotValue: HouseSnapshot;
  private local: Motion;
  private joinedAt: string;
  private timestampVerified = false;
  private remotes = new Map<string,Remote>();
  private sessions = new Map<string,HousePresence>();
  private listeners = new Set<(view:RuntimeView)=>void>();
  private cleanup: (()=>void)[] = [];
  private budget = new MotionBudget();
  private active = !document.hidden;
  private ready = false;
  private disposed = false;
  private generation = 0;
  private connection: ConnectionState = 'offline';
  private feedback = '';
  private takeover = false;
  private recovery: Promise<void> | null = null;
  private syncing = false;
  private lastSyncResponse = new Map<string,number>();
  private requests = new Set<string>();
  private sent = 0;
  private received = 0;
  private lastNotify = 0;
  private announced = false;
  private queuedRecovery = false;
  private lastUnknownRefresh = -Infinity;
  constructor(private transport:HouseRealtimeTransport,private api:Pick<HouseApi,'snapshot'>,snapshot:HouseSnapshot,private onSnapshot:(snapshot:HouseSnapshot|null)=>void) {
    this.snapshotValue=snapshot;
    const member=snapshot.members.find(item=>item.user_id===snapshot.user_id)!;
    this.local={user_id:member.user_id,couple_id:snapshot.couple_id,session_id:crypto.randomUUID(),seq:0,...spawn(member.seat),vx:0,vy:0,direction:'down',animation:'idle',room:'phase1-room'};
    this.joinedAt=new Date(snapshot.server_time).toISOString();
    this.budget.reset(this.local,performance.now());
    this.prepareRemotes();
  }
  private prepareRemotes() {
    for(const member of this.snapshotValue.members) if(!this.remotes.has(member.user_id))this.remotes.set(member.user_id,{motion:new RemoteMotion(spawn(member.seat)),point:spawn(member.seat),offlineSince:performance.now(),online:false,away:false,lastSeen:Date.now()});
    for(const id of this.remotes.keys())if(!this.snapshotValue.members.some(member=>member.user_id===id))this.remotes.delete(id);
  }
  private currentPresence(): HousePresence {
    return {user_id:this.local.user_id,session_id:this.local.session_id,joined_at:this.joinedAt,room:'phase1-room',status:this.active&&!this.takeover?'online':'away',device:Capacitor.isNativePlatform()?'android':'web',app_version:'phase1'};
  }
  private notify(){if(!this.disposed)this.listeners.forEach(listener=>listener(this.view()));}
  onView(listener:(view:RuntimeView)=>void){this.listeners.add(listener);listener(this.view());return()=>{this.listeners.delete(listener);};}
  view(): RuntimeView {
    const now=performance.now();
    const actors:Actor[]=[];
    for(const member of this.snapshotValue.members){
      const self=member.user_id===this.local.user_id;
      const remote=this.remotes.get(member.user_id)!;
      if(!self && remote.offlineSince!==null && now-remote.offlineSince>30000)continue;
      const frame=self&&!this.takeover?this.local:remote.motion.frame;
      actors.push({id:member.user_id,name:self?'You':member.display_name,seat:member.seat,point:self&&!this.takeover?{x:this.local.x,y:this.local.y}:remote.point,direction:frame?.direction??'down',animation:frame?.animation??'idle',online:self&&!this.takeover?this.ready&&this.connection==='connected':remote.online,away:self?(!this.active||this.takeover):remote.away,local:self,lastSeen:self&&this.active?Date.now():remote.lastSeen});
    }
    return {connection:this.connection,ready:this.ready,message:this.feedback,takenOver:this.takeover,active:this.active,sent:this.sent,received:this.received,actors};
  }
  async start(){
    this.cleanup.push(this.transport.onState(state=>{
      this.connection=state;
      if(state!=='connected'){this.generation++;this.ready=false;this.stopMotion();this.feedback=state==='error'?'Connection interrupted. Reconnecting…':'';}
      this.notify();
      if(state==='connected'){if(this.recovery)this.queuedRecovery=true;void this.recover();}
    }),this.transport.onMessage(message=>this.receive(message)),this.transport.onPresence(values=>this.applyPresence(values)),watchForeground(active=>{
      if(this.active===active)return;this.active=active;this.generation++;this.stopMotion();this.queuedRecovery=active;
      if(!active){this.ready=false;void this.transport.track(this.currentPresence()).catch(()=>undefined);}
      else if(this.connection==='connected')void this.recover();
      else void this.reconnect();
      this.notify();
    }));
    try{await this.transport.connect();if(this.disposed)return;await this.transport.join(this.snapshotValue.couple_id);await this.recover();}
    catch(error){if(!this.disposed){this.feedback=error instanceof Error?error.message:'Could not connect. Try again.';this.notify();}}
  }
  private async recover():Promise<void>{
    if(this.recovery)return this.recovery;
    if(this.disposed||this.connection!=='connected')return;
    const generation=this.generation;
    this.recovery=(async()=>{
      this.ready=false;
      try{
        const next=await this.api.snapshot(this.snapshotValue);
        if(this.disposed||generation!==this.generation)return;
        if(!next||next.couple_id!==this.snapshotValue.couple_id){this.onSnapshot(next);return;}
        this.snapshotValue=next;this.prepareRemotes();this.onSnapshot(next);
        // Stamp a new device session once from a fresh RPC, never from cache.
        if(!this.timestampVerified){this.joinedAt=new Date(next.server_time).toISOString();this.timestampVerified=true;this.takeover=false;}
        await this.transport.track(this.currentPresence());
        if(this.disposed||generation!==this.generation)return;
        this.applyPresence(this.transport.presence());
        this.stopMotion();this.budget.reset(this.local,performance.now());
        if(this.active&&!this.takeover){
          if(!this.announced){await this.sendMotion('PLAYER_JOINED');this.announced=true;}
          await this.requestSync();
          this.ready=true;
        }
        this.feedback='';this.notify();
      }catch(error){if(!this.disposed&&generation===this.generation){this.feedback=error instanceof Error?error.message:'Your home could not sync. Reconnect.';this.notify();}}
    })().finally(()=>{this.recovery=null;if(this.queuedRecovery&&!this.disposed&&this.connection==='connected'){this.queuedRecovery=false;void this.recover();}});
    return this.recovery;
  }
  async reconnect(){if(this.disposed)return;this.generation++;this.announced=false;if(this.recovery)this.queuedRecovery=true;try{await this.transport.connect();if(this.disposed)return;await this.transport.join(this.snapshotValue.couple_id);await this.recover();}catch(error){if(!this.disposed){this.feedback=error instanceof Error?error.message:'Could not reconnect.';this.notify();}}}
  async takeControl(){
    const next=await this.api.snapshot(this.snapshotValue);
    if(!next||this.disposed)return;
    const observed=this.remotes.get(this.local.user_id)?.point??this.local;
    this.local={...this.local,...clampPoint(observed),session_id:crypto.randomUUID(),seq:0,vx:0,vy:0,animation:'idle'};
    this.joinedAt=new Date(next.server_time).toISOString();this.timestampVerified=true;this.takeover=false;this.announced=false;
    await this.reconnect();
  }
  private async requestSync(){
    const request_id=crypto.randomUUID();this.requests.add(request_id);
    if(this.requests.size>8)this.requests.delete(this.requests.values().next().value!);
    await this.send({event:'sync_request',payload:{request_id,user_id:this.local.user_id,session_id:this.local.session_id}});
  }
  private applyPresence(values:HousePresence[]){
    if(this.disposed)return;
    const allowed=new Set(this.snapshotValue.members.map(member=>member.user_id));
    if(values.some(value=>!allowed.has(value.user_id))&&!this.syncing&&performance.now()-this.lastUnknownRefresh>2000){
      this.lastUnknownRefresh=performance.now();
      if(this.recovery)this.queuedRecovery=true;
      else{this.syncing=true;void this.recover().finally(()=>{this.syncing=false;});}
    }
    const previous=this.sessions;this.sessions=preferredSessions(values.filter(value=>allowed.has(value.user_id)));
    const now=performance.now();
    for(const [id,remote] of this.remotes){
      const session=this.sessions.get(id);
      if(session){remote.online=session.status==='online';remote.away=session.status==='away';remote.offlineSince=null;if(remote.away)remote.motion.stop();}
      else{remote.online=false;remote.away=false;if(remote.offlineSince===null)remote.offlineSince=now;remote.motion.stop();}
    }
    const own=this.sessions.get(this.local.user_id);
    if(own&&own.session_id!==this.local.session_id && (Date.parse(own.joined_at)>Date.parse(this.joinedAt)||(own.joined_at===this.joinedAt&&own.session_id>this.local.session_id))){this.takeover=true;this.ready=false;this.stopMotion();}
    const changed=Array.from(this.sessions).some(([id,value])=>previous.get(id)?.session_id!==value.session_id);
    if(changed&&this.active&&this.connection==='connected'&&!this.recovery&&!this.takeover)void this.requestSync().catch(()=>undefined);
    this.notify();
  }
  private receive(message:HouseMessage){
    if(this.disposed)return;
    if(message.event==='sync_request'){
      const request=message.payload;
      if(!this.snapshotValue.members.some(member=>member.user_id===request.user_id)||request.session_id===this.local.session_id||!this.active||this.takeover)return;
      const now=performance.now();if(now-(this.lastSyncResponse.get(request.user_id)??-Infinity)<1000)return;
      this.lastSyncResponse.set(request.user_id,now);
      void this.send({event:'sync_response',payload:{request_id:request.request_id,to_session:request.session_id,player:this.packet()}}).catch(()=>undefined);
      return;
    }
    let frame:Motion;let initial=false;
    if(message.event==='sync_response'){
      if(message.payload.to_session!==this.local.session_id||!this.requests.has(message.payload.request_id))return;
      frame=message.payload.player;initial=true;
    }else frame=message.payload;
    if(frame.couple_id!==this.snapshotValue.couple_id||frame.session_id===this.local.session_id||!this.snapshotValue.members.some(member=>member.user_id===frame.user_id))return;
    const session=this.sessions.get(frame.user_id);
    if(!session||session.session_id!==frame.session_id)return;
    if(frame.user_id===this.local.user_id&&!this.takeover)return;
    const remote=this.remotes.get(frame.user_id)!;
    if(remote.motion.accept(frame,performance.now(),initial)){
      this.received++;remote.lastSeen=Date.now();
      if(message.event==='PLAYER_LEFT'){remote.motion.stop();remote.online=false;remote.offlineSince=performance.now();}
      this.notify();
    }
  }
  private packet():Motion{return {...this.local,seq:++this.local.seq};}
  private async send(message:HouseMessage){if(this.disposed)return;await this.transport.send(message);this.sent++;}
  private sendMotion(event:MotionEvent){return this.send({event,payload:this.packet()});}
  private stopMotion(){this.local={...this.local,vx:0,vy:0,animation:'idle'};}
  tick(input:Point,dt:number,now:number){
    if(this.disposed)return;
    for(const remote of this.remotes.values())remote.point=remote.motion.sample(now,dt);
    if(this.ready&&this.active&&!this.takeover&&this.connection==='connected'){
      const previous={...this.local};const v=velocity(input);const point=movePoint(this.local,v,dt);
      const moving=Math.hypot(point.x-this.local.x,point.y-this.local.y)>.01;
      this.local={...this.local,...point,vx:moving?v.x:0,vy:moving?v.y:0,direction:facing(v,this.local.direction),animation:moving?'walk':'idle'};
      if(this.budget.claim(this.local,now)){
        const event:MotionEvent=this.local.animation==='idle'?'PLAYER_STOPPED':previous.animation!==this.local.animation?'PLAYER_ANIMATION_CHANGED':'PLAYER_MOVED';
        void this.sendMotion(event).catch(error=>{if(!this.disposed){this.ready=false;this.feedback=error instanceof Error?error.message:'Connection interrupted.';this.notify();}});
      }
    }
    if(now-this.lastNotify>=100){this.lastNotify=now;this.notify();}
  }
  async dispose(){
    if(this.disposed)return;
    const leave=this.ready&&this.active&&!this.takeover&&this.connection==='connected'?this.packet():null;
    this.disposed=true;this.generation++;this.ready=false;this.cleanup.splice(0).forEach(stop=>stop());this.listeners.clear();
    if(leave)void this.transport.send({event:'PLAYER_LEFT',payload:leave}).catch(()=>undefined);
    await this.transport.disconnect();
  }
}
