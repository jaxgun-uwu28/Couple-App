import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { HouseApi } from './HouseApi';
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
