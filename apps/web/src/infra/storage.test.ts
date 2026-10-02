import { expect, it } from 'vitest';
import type { HouseSnapshot } from '@paw/shared';
import { SnapshotCache } from './storage';
const user='11111111-1111-4111-8111-111111111111';const other='22222222-2222-4222-8222-222222222222';
const value:HouseSnapshot={kind:'full',version:1,user_id:user,couple_id:other,status:'pending',members:[{user_id:user,seat:1,role:'partner_a',display_name:'Rose',joined_at:'2026-10-02T00:00:00Z'}],house:{id:'33333333-3333-4333-8333-333333333333',map_id:'phase1-room',layout_version:1},invite:null,server_time:'2026-10-02T00:00:00Z'};
it('falls back when IndexedDB is unavailable while preserving account boundaries',async()=>{
  const cache=new SnapshotCache();const epoch=cache.activate(user);await cache.write(value,epoch);expect(await cache.read(user,epoch)).toEqual(value);
  const next=cache.activate(other);expect(await cache.read(user,epoch)).toBeNull();await cache.write(value,epoch);expect(await cache.read(other,next)).toBeNull();
});
it('blocks a late response from restoring private data after logout',async()=>{
  const cache=new SnapshotCache();const epoch=cache.activate(user);const pending=cache.write(value,epoch);await cache.clear();await pending;await cache.write(value,epoch);
  expect(await cache.read(user,cache.activate(user))).toBeNull();
});
