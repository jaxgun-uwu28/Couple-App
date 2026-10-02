import { describe, expect, it } from 'vitest';
import { MotionBudget, RemoteMotion, WORLD, collides, motionSchema, movePoint, preferredSessions, velocity } from './house';
import type { HousePresence, Motion } from './house';
const frame: Motion = { user_id:'11111111-1111-4111-8111-111111111111',couple_id:'22222222-2222-4222-8222-222222222222',session_id:'33333333-3333-4333-8333-333333333333',seq:1,x:590,y:490,vx:0,vy:0,direction:'down',animation:'idle',room:'phase1-room' };
describe('collision and movement', () => {
  it('normalizes diagonal movement and rejects nonfinite input', () => {
    expect(Math.hypot(...Object.values(velocity({x:1,y:1})))).toBeCloseTo(WORLD.speed);
    expect(velocity({x:Infinity,y:1})).toEqual({x:0,y:0});
  });
  it('clamps bounds and substeps furniture rather than tunnelling', () => {
    expect(movePoint({x:60,y:60},{x:-170,y:-170},.1)).toEqual({x:59,y:59});
    const point=movePoint({x:640,y:390},{x:0,y:-170},3);
    expect(point.y).toBeGreaterThanOrEqual(370);expect(collides(point)).toBe(false);
  });
  it('slides along a wall with the other axis still available', () => {
    const point=movePoint({x:640,y:380},{x:170,y:-170},.1);
    expect(point.x).toBeGreaterThan(640);expect(collides(point)).toBe(false);
  });
});
describe('free-tier motion budget', () => {
  it('sends nothing while idle, one change then moving corrections and one stop', () => {
    const budget=new MotionBudget();budget.reset(frame,0);
    for(let time=0;time<60000;time+=16)expect(budget.claim(frame,time)).toBe(false);
    const moving={...frame,vx:170,animation:'walk' as const};
    expect(budget.claim(moving,60000)).toBe(true);expect(budget.claim(moving,60999)).toBe(false);expect(budget.claim(moving,61000)).toBe(true);
    expect(budget.claim(frame,61100)).toBe(true);expect(budget.claim(frame,62000)).toBe(false);
  });
  it('caps rapid input changes at ten in every rolling second', () => {
    const budget=new MotionBudget();budget.reset(frame,0);let sent=0;
    for(let n=0;n<100;n++)if(budget.claim({...frame,vx:n+1,animation:'walk'},n*9))sent++;
    expect(sent).toBe(10);expect(budget.claim({...frame,vx:1,animation:'walk'},1001)).toBe(true);
  });
});
describe('remote motion at 150ms latency', () => {
  it('rejects duplicates/out-of-order, accepts a new session sequence', () => {
    const remote=new RemoteMotion(frame);expect(remote.accept(frame,0)).toBe(true);
    expect(remote.accept(frame,150)).toBe(false);expect(remote.accept({...frame,seq:0},160)).toBe(false);
    expect(remote.accept({...frame,session_id:'44444444-4444-4444-8444-444444444444',seq:0},170)).toBe(true);
  });
  it('bounds velocity/teleport and stops extrapolation on idle', () => {
    const remote=new RemoteMotion(frame);remote.accept(frame,0);
    remote.accept({...frame,seq:2,x:99999,vx:99999,animation:'walk'},150);
    expect(remote.frame!.x).toBeLessThanOrEqual(590+170*.15+48);expect(remote.frame!.vx).toBe(170);
    const point=remote.sample(300,.016);expect(point.x).toBeGreaterThan(590);
    remote.accept({...frame,seq:3,x:point.x},350);remote.sample(500,.1);const stopped=remote.sample(10000,.1);expect(stopped.x).toBeCloseTo(point.x,1);
  });
  it('smoothly extrapolates delayed corrections without furniture penetration', () => {
    const remote=new RemoteMotion(frame);remote.accept({...frame,vx:170,animation:'walk'},150);
    let last=590;
    for(let time=166;time<1150;time+=16){const point=remote.sample(time,.016);expect(point.x-last).toBeLessThan(4);expect(collides(point)).toBe(false);last=point.x;}
    expect(last).toBeGreaterThan(740);
    const wall=new RemoteMotion({x:700,y:380});wall.accept({...frame,x:700,y:380,vy:-9999,animation:'walk'},0);
    for(let time=16;time<2000;time+=16)expect(collides(wall.sample(time,.016))).toBe(false);
  });
  it('rejects malformed packets', () => {
    expect(motionSchema.safeParse({...frame,x:NaN}).success).toBe(false);expect(motionSchema.safeParse({...frame,seq:-1}).success).toBe(false);expect(motionSchema.safeParse({...frame,extra:'unknown'}).success).toBe(false);
  });
});
it('selects newest device by absolute server time with deterministic ties', () => {
  const base:HousePresence={user_id:frame.user_id,session_id:frame.session_id,joined_at:'2026-10-02T10:00:00+08:00',room:'phase1-room',status:'online',device:'web',app_version:'phase1'};
  const newer={...base,session_id:'55555555-5555-4555-8555-555555555555',joined_at:'2026-10-02T02:00:01Z'};
  expect(preferredSessions([newer,base]).get(frame.user_id)).toEqual(newer);
  expect(preferredSessions([{...base,joined_at:newer.joined_at},newer]).get(frame.user_id)).toEqual(newer);
});
