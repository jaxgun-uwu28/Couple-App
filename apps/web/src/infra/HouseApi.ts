import type { SupabaseClient } from '@supabase/supabase-js';
import { actionResultSchema, snapshotSchema, worldStateSchema, interactionResultSchema, charactersSchema, characterResultSchema, appearanceSchema } from '@paw/shared';
import type { HouseSnapshot, WorldState, CharactersState, Appearance } from '@paw/shared';
import { snapshotCache } from './storage';

const actionMessages = {
  ALREADY_IN_COUPLE: 'You already belong to a couple. Reconnect to open your home.',
  INVALID_INVITE: 'That invite is invalid, expired, or already used. Ask your partner for a new code.',
  RATE_LIMIT: 'Too many invite attempts. Wait ten minutes and try again.',
  REQUEST_CONFLICT: 'That request could not be reused. Try a new action.',
  NO_PENDING_COUPLE: 'There is no pending invite to change. Reconnect to check your home.',
};
export class HouseApi {
  private pending = new Map<string, string>();
  constructor(private client: SupabaseClient, readonly userId: string, private epoch: number) {}
  async action(action: 'create_couple' | 'join_couple' | 'refresh_invite' | 'cancel_pending_couple', code?: string): Promise<void> {
    const normalized = code?.trim().replaceAll('-','').toUpperCase();
    const intent = `${action}:${normalized ?? ''}`;
    const key = this.pending.get(intent) ?? crypto.randomUUID();
    this.pending.set(intent,key);
    const response = await this.client.rpc(action, { p_idempotency_key: key, ...(action === 'join_couple' ? { p_code: normalized } : {}) });
    if (response.error) throw new Error('Could not reach your home. Check the connection and try again.');
    const parsed = actionResultSchema.safeParse(response.data);
    if (!parsed.success) throw new Error('The home response could not be verified. Reconnect to try again.');
    this.pending.delete(intent);
    if (!parsed.data.ok) throw new Error(actionMessages[parsed.data.code]);
  }
  async snapshot(previous: HouseSnapshot | null): Promise<HouseSnapshot | null> {
    const response = await this.client.rpc('get_house_snapshot_v2', { p_since_version: previous?.version ?? 0, p_known_couple_id: previous?.couple_id ?? null });
    if (response.error) throw new Error('Your home could not load. Check your connection and try again.');
    const parsed = snapshotSchema.safeParse(response.data);
    if (!parsed.success || parsed.data.user_id !== this.userId) throw new Error('Your home response could not be verified.');
    if (parsed.data.kind === 'none') { await snapshotCache.clear(); this.epoch = snapshotCache.activate(this.userId); return null; }
    if (parsed.data.kind === 'unchanged') {
      if (!previous || previous.couple_id !== parsed.data.couple_id || previous.version !== parsed.data.version) throw new Error('Reconnect to refresh your home.');
      const current = { ...previous, server_time: parsed.data.server_time };
      await snapshotCache.write(current,this.epoch); return current;
    }
    await snapshotCache.write(parsed.data,this.epoch); return parsed.data;
  }
  async world(coupleId: string): Promise<WorldState> {
    const response=await this.client.rpc('get_house_world');
    const parsed=worldStateSchema.safeParse(response.data);
    if(response.error||!parsed.success||parsed.data.couple_id!==coupleId)throw new Error('House objects could not sync. Reconnect to try again.');
    return parsed.data;
  }
  async interact(action:'start'|'cancel'|'toggle'|'renew',objectId:string|null,slotId:string|null,sessionId:string,point:{x:number;y:number}):Promise<void>{
    const intent=`world:${action}:${objectId}:${slotId}:${sessionId}`;
    // Freeze ALL arguments across a retry, even if the avatar subsequently moved.
    const previous=this.interactions.get(intent);
    const args=previous??{p_action:action,p_object_id:objectId,p_slot_id:slotId,p_session_id:sessionId,p_x:point.x,p_y:point.y,p_idempotency_key:crypto.randomUUID()};
    this.interactions.set(intent,args);
    const response=await this.client.rpc('house_interact',args);
    if(response.error)throw new Error('The action could not connect. Try again.');
    const parsed=interactionResultSchema.safeParse(response.data);if(!parsed.success)throw new Error('The action response could not be verified.');
    this.interactions.delete(intent);
    if(!parsed.data.ok){const messages={BUSY:'That spot is busy. Try the other spot.',OUT_OF_RANGE:'Move closer to interact.',UNAVAILABLE:'This activity is coming soon.',ALREADY_USING:'Leave your current activity first.',NOT_OWNER:'That activity ended. Try again.'};throw new Error(messages[parsed.data.code as keyof typeof messages]??'That action is unavailable. Reconnect to check your home.');}
  }
  private interactions=new Map<string,{p_action:string;p_object_id:string|null;p_slot_id:string|null;p_session_id:string;p_x:number;p_y:number;p_idempotency_key:string}>();
  private characterIntents=new Map<string,Record<string,unknown>>();
  async characters(coupleId:string):Promise<CharactersState>{
    const response=await this.client.rpc('get_house_characters');const parsed=charactersSchema.safeParse(response.data);
    if(response.error||!parsed.success||parsed.data.couple_id!==coupleId)throw new Error('Characters could not sync. Reconnect to try again.');
    return parsed.data;
  }
  private async characterWrite(rpc:string,intent:string,values:Record<string,unknown>){
    const args=this.characterIntents.get(intent)??{...values,p_idempotency_key:crypto.randomUUID()};this.characterIntents.set(intent,args);
    const response=await this.client.rpc(rpc,args);if(response.error)throw new Error('Could not connect. Try again.');
    const parsed=characterResultSchema.safeParse(response.data);if(!parsed.success)throw new Error('The character response could not be verified.');
    this.characterIntents.delete(intent);
    if(!parsed.data.ok){const messages:Record<string,string>={BUSY:'Leave your current activity first.',OUT_OF_RANGE:'Move closer to your partner.',NEED_SEATS:'Both sit on the same sofa or bed first.',EXPIRED:'That request has ended.',NO_PARTNER:'Invite your partner first.',NOT_OWNER:'That activity has ended.',INVALID_APPEARANCE:'Choose an available appearance.'};throw new Error(messages[parsed.data.code??'']??'That action is unavailable. Try again.');}
  }
  async saveCharacter(appearance:Appearance,preset:number|null=null){const validated=appearanceSchema.parse(appearance);await this.characterWrite('save_character',`save:${preset}:${JSON.stringify(validated)}`,{p_appearance:validated,p_preset:preset});}
  async social(action:'request'|'accept'|'ignore'|'cancel'|'renew',kind:'hug'|'cuddle'|null,requestId:string|null,sessionId:string,point:{x:number;y:number}){await this.characterWrite('character_action',`social:${action}:${kind}:${requestId}:${sessionId}`,{p_action:action,p_kind:kind,p_request_id:requestId,p_session_id:sessionId,p_x:point.x,p_y:point.y});}
}
