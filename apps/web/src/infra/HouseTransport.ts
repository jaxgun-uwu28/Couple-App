import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { coupleIdSchema, motionEvents, motionSchema, presenceSchema, syncRequestSchema, syncResponseSchema, objectChangedSchema } from '@paw/shared';
import type { ConnectionState, HouseEventMap, HousePresence, MotionEvent } from '@paw/shared';

export type HouseMessage = { event: MotionEvent; payload: HouseEventMap[MotionEvent] } |
  { event: 'sync_request'; payload: HouseEventMap['sync_request'] } | { event: 'sync_response'; payload: HouseEventMap['sync_response'] } | {event:'object_changed';payload:HouseEventMap['object_changed']};
export interface HouseRealtimeTransport {
  connect(): Promise<void>; join(coupleId: string): Promise<void>; send(message: HouseMessage): Promise<void>;
  track(value: HousePresence): Promise<void>; presence(): HousePresence[];
  onState(listener: (state: ConnectionState) => void): () => void;
  onMessage(listener: (message: HouseMessage) => void): () => void;
  onPresence(listener: (values: HousePresence[]) => void): () => void;
  disconnect(): Promise<void>;
}
const channelCleanup = new WeakMap<SupabaseClient,Promise<void>>();
export class HouseTransport implements HouseRealtimeTransport {
  private channel: RealtimeChannel | undefined;
  private state: ConnectionState = 'offline';
  private states = new Set<(state: ConnectionState) => void>();
  private messages = new Set<(message: HouseMessage) => void>();
  private presences = new Set<(values: HousePresence[]) => void>();
  private cancel: (() => void) | undefined;
  private generation = 0;
  constructor(private client: SupabaseClient, private mapId: 'phase1-room' | 'cottage-v1' = 'phase1-room') {}
  private setState(value: ConnectionState) { this.state=value; this.states.forEach(listener=>listener(value)); }
  async connect() {
    const { data,error }=await this.client.auth.getSession();
    if (error || !data.session) throw new Error('Sign in before entering your home.');
    await this.client.realtime.setAuth(data.session.access_token);
  }
  async join(coupleId: string) {
    coupleIdSchema.parse(coupleId);
    const generation=++this.generation;
    await this.release();
    if(generation!==this.generation)throw new Error('Connection cancelled.');
    this.setState('connecting');
    const channel=this.client.channel(`house:${coupleId}${this.mapId==='cottage-v1'?':cottage-v1':''}`,{config:{private:true,broadcast:{ack:true,self:false}}});
    this.channel=channel;
    channel.on('broadcast',{event:'object_changed'},({payload}:{payload:unknown})=>{const parsed=objectChangedSchema.safeParse(payload);if(this.channel===channel&&parsed.success)this.messages.forEach(listener=>listener({event:'object_changed',payload:parsed.data}));});
    for (const event of motionEvents) channel.on('broadcast',{event},({payload}: {payload:unknown})=>{
      if (this.channel!==channel) return;
      const parsed=motionSchema.safeParse(payload); if(parsed.success) this.messages.forEach(listener=>listener({event,payload:parsed.data}));
    });
    channel.on('broadcast',{event:'sync_request'},({payload}: {payload:unknown})=>{
      const parsed=syncRequestSchema.safeParse(payload); if(this.channel===channel && parsed.success) this.messages.forEach(listener=>listener({event:'sync_request',payload:parsed.data}));
    });
    channel.on('broadcast',{event:'sync_response'},({payload}: {payload:unknown})=>{
      const parsed=syncResponseSchema.safeParse(payload); if(this.channel===channel && parsed.success) this.messages.forEach(listener=>listener({event:'sync_response',payload:parsed.data}));
    });
    channel.on('presence',{event:'sync'},()=>{ if(this.channel===channel) this.presences.forEach(listener=>listener(this.presence())); });
    await new Promise<void>((resolve,reject)=>{
      const finish=(error?:Error)=>{clearTimeout(timer);this.cancel=undefined;if(error)reject(error);else resolve();};
      const timer=setTimeout(()=>{this.setState('error');finish(new Error('Your connection timed out. Reconnect to try again.'));},15000);
      this.cancel=()=>finish(new Error('Connection cancelled.'));
      channel.subscribe(status=>{
        if(this.channel!==channel)return;
        if(status==='SUBSCRIBED'){this.setState('connected');finish();}
        else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){this.setState('error');finish(new Error('Could not enter your private home. Reconnect to try again.'));}
        else if(status==='CLOSED'){this.setState('offline');finish(new Error('Connection closed.'));}
      });
    });
  }
  async send(message: HouseMessage) {
    if(!this.channel||this.state!=='connected')throw new Error('Reconnect to play together.');
    if(message.event==='object_changed')objectChangedSchema.parse(message.payload);
    else if(message.event==='sync_request')syncRequestSchema.parse(message.payload);
    else if(message.event==='sync_response')syncResponseSchema.parse(message.payload);
    else motionSchema.parse(message.payload);
    const result=await this.channel.send({type:'broadcast',event:message.event,payload:message.payload});
    if(result!=='ok')throw new Error('Connection interrupted. Reconnect to try again.');
  }
  async track(value: HousePresence) {
    if(!this.channel||this.state!=='connected')return;
    presenceSchema.parse(value);
    const result=await this.channel.track(value); if(result!=='ok')throw new Error('Online status could not sync. Reconnect.');
  }
  presence(): HousePresence[] {
    const values=Object.values(this.channel?.presenceState()??{}).flat();
    return values.flatMap(value=>{const parsed=presenceSchema.safeParse(value);return parsed.success?[parsed.data]:[];});
  }
  onState(listener:(state:ConnectionState)=>void){this.states.add(listener);listener(this.state);return()=>{this.states.delete(listener);};}
  onMessage(listener:(message:HouseMessage)=>void){this.messages.add(listener);return()=>{this.messages.delete(listener);};}
  onPresence(listener:(values:HousePresence[])=>void){this.presences.add(listener);return()=>{this.presences.delete(listener);};}
  private async release(){
    this.cancel?.();const channel=this.channel;this.channel=undefined;this.setState('offline');
    const previous=channelCleanup.get(this.client)??Promise.resolve();
    if(channel){const task=previous.catch(()=>undefined).then(async()=>{await this.client.removeChannel(channel);});channelCleanup.set(this.client,task);await task;}
    else await previous.catch(()=>undefined);
  }
  async disconnect(){this.generation++;await this.release();}
}
