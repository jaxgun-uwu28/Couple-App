import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { HouseApi } from './HouseApi';
import {defaultAppearance} from '@paw/shared';
const user='11111111-1111-4111-8111-111111111111';const couple='22222222-2222-4222-8222-222222222222';
describe('pairing action replay',()=>{
  it('keeps the same idempotency key across a lost response and normalizes invite codes',async()=>{
    const rpc=vi.fn().mockResolvedValueOnce({error:{message:'Network lost'}}).mockResolvedValueOnce({data:{ok:true,couple_id:couple}});
    const api=new HouseApi({rpc} as unknown as SupabaseClient,user,1);
    await expect(api.action('join_couple',' abcd-2345 ')).rejects.toThrow('connection');await api.action('join_couple','ABCD2345');
    expect(rpc.mock.calls[0]![1]).toEqual(rpc.mock.calls[1]![1]);expect(rpc.mock.calls[1]![1].p_code).toBe('ABCD2345');
  });
  it('starts a fresh intent after an authoritative rejection',async()=>{
    const rpc=vi.fn().mockResolvedValue({data:{ok:false,code:'INVALID_INVITE'}});const api=new HouseApi({rpc} as unknown as SupabaseClient,user,1);
    await expect(api.action('join_couple','ABCD2345')).rejects.toThrow('invalid');await expect(api.action('join_couple','ABCD2345')).rejects.toThrow('invalid');
    expect(rpc.mock.calls[0]![1].p_idempotency_key).not.toBe(rpc.mock.calls[1]![1].p_idempotency_key);
  });
  it('rejects unverified and cross-account snapshots',async()=>{
    const rpc=vi.fn().mockResolvedValue({data:{kind:'none',version:0,user_id:couple,server_time:new Date().toISOString()}});const api=new HouseApi({rpc} as unknown as SupabaseClient,user,1);
    await expect(api.snapshot(null)).rejects.toThrow('verified');
    rpc.mockResolvedValue({data:{kind:'unchanged',version:1,user_id:user,couple_id:couple,server_time:new Date().toISOString()}});await expect(api.snapshot(null)).rejects.toThrow('refresh');
  });
});
it('replays a lost appearance response with the same validated action and no user ID argument',async()=>{
 const rpc=vi.fn().mockResolvedValueOnce({error:{message:'lost'}}).mockResolvedValueOnce({data:{ok:true}}),api=new HouseApi({rpc} as unknown as SupabaseClient,user,1);
 await expect(api.saveCharacter(defaultAppearance())).rejects.toThrow('connect');await api.saveCharacter(defaultAppearance());
 expect(rpc.mock.calls[0]).toEqual(rpc.mock.calls[1]);expect(rpc.mock.calls[1]![1]).not.toHaveProperty('user_id');
});
it('freezes consent position and session across a response-loss retry',async()=>{
 const rpc=vi.fn().mockResolvedValueOnce({error:{message:'lost'}}).mockResolvedValueOnce({data:{ok:true}}),api=new HouseApi({rpc} as unknown as SupabaseClient,user,1);
 await expect(api.social('request','hug',null,user,{x:100,y:100})).rejects.toThrow('connect');await api.social('request','hug',null,user,{x:300,y:300});
 expect(rpc.mock.calls[0]).toEqual(rpc.mock.calls[1]);expect(rpc.mock.calls[1]![1].p_x).toBe(100);
});
