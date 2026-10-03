import { describe,it,expect } from 'vitest';
import { COTTAGE,cottageSpawn,cottageInteractions,cottageDoors,nearestInteraction,roomAt } from './cottage';
import { collides,movePoint,velocity,RemoteMotion } from './house';
import type {Motion} from './house';
describe('approved cottage geometry',()=>{
 it('spawns in the clear hall and moves normalized at the house speed',()=>{const a=cottageSpawn(1);expect(roomAt(a)).toBe('hall');expect(collides(a,COTTAGE)).toBe(false);const diagonal=velocity({x:1,y:1},COTTAGE);expect(Math.hypot(diagonal.x,diagonal.y)).toBeCloseTo(132);expect(movePoint(a,velocity({x:1,y:0},COTTAGE),.1,COTTAGE).x).toBeCloseTo(a.x+13.2);});
 it('prevents tunnelling through walls and furniture while doors connect rooms',()=>{expect(movePoint({x:31*32,y:8*32},{x:-120,y:0},.25,COTTAGE).x).toBeGreaterThanOrEqual(30*32+12);const door=cottageDoors[2]!;let point={x:31*32,y:door.y+48};for(let i=0;i<30;i++)point=movePoint(point,{x:-120,y:0},.1,COTTAGE);expect(roomAt(point)).toBe('living');expect(collides(point,COTTAGE)).toBe(false);});
 it('finds contextual targets, preserves nearby stability and rejects distant positions',()=>{for(const target of cottageInteractions)expect(nearestInteraction(target.point)?.id).toBe(target.id);expect(nearestInteraction(cottageSpawn(1))).toBeNull();});
 it('keeps remote motion smooth in production geometry beyond old room bounds',()=>{const start={x:32*32,y:35*32};const remote=new RemoteMotion(start,COTTAGE);const frame:Motion={user_id:'11111111-1111-4111-8111-111111111111',couple_id:'22222222-2222-4222-8222-222222222222',session_id:'33333333-3333-4333-8333-333333333333',seq:1,...start,vx:0,vy:-120,direction:'up',animation:'walk',room:'hall',motion_ms:0};expect(remote.accept(frame,0)).toBe(true);for(let t=0;t<1000;t+=16)remote.sample(t,.016);expect(remote.sample(1000,.016).y).toBeLessThan(start.y-60);expect(remote.frame?.room).toBe('hall');});
});
