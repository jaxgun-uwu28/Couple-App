import { z } from 'zod';

export const directionSchema = z.enum(['down', 'up', 'left', 'right']);
export type Direction = z.infer<typeof directionSchema>;
export const memberSchema = z.object({ user_id: z.uuid(), seat: z.union([z.literal(1), z.literal(2)]), role: z.enum(['partner_a', 'partner_b']), joined_at: z.iso.datetime({ offset: true }), display_name: z.string().min(1).max(24) }).strict();
export const fullSnapshotSchema = z.object({
  kind: z.literal('full'), version: z.number().int().positive(), user_id: z.uuid(), couple_id: z.uuid(),
  status: z.enum(['pending', 'active']), members: z.array(memberSchema).min(1).max(2),
  house: z.object({ id: z.uuid(), map_id: z.literal('phase1-room'), layout_version: z.literal(1) }).strict(),
  invite: z.object({ code: z.string().regex(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/), expires_at: z.iso.datetime({ offset: true }) }).strict().nullable(),
  server_time: z.iso.datetime({ offset: true }),
}).strict().superRefine((value, context) => {
  if (!value.members.some(member => member.user_id === value.user_id) || new Set(value.members.map(member => member.user_id)).size !== value.members.length || new Set(value.members.map(member => member.seat)).size !== value.members.length || value.members.length !== (value.status === 'active' ? 2 : 1) || value.members.some(member => member.role !== (member.seat === 1 ? 'partner_a' : 'partner_b'))) context.addIssue({ code: 'custom', message: 'Invalid membership snapshot.' });
});
export const snapshotSchema = z.union([
  fullSnapshotSchema,
  z.object({ kind: z.literal('unchanged'), version: z.number().int().positive(), user_id: z.uuid(), couple_id: z.uuid(), server_time: z.iso.datetime({ offset: true }) }).strict(),
  z.object({ kind: z.literal('none'), version: z.literal(0), user_id: z.uuid(), server_time: z.iso.datetime({ offset: true }) }).strict(),
]);
export type HouseSnapshot = z.infer<typeof fullSnapshotSchema>;
export type SnapshotResponse = z.infer<typeof snapshotSchema>;
export const actionResultSchema = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true), couple_id: z.uuid() }).strict(),
  z.object({ ok: z.literal(false), code: z.enum(['ALREADY_IN_COUPLE', 'INVALID_INVITE', 'RATE_LIMIT', 'REQUEST_CONFLICT', 'NO_PENDING_COUPLE']) }).strict(),
]);
export const motionSchema = z.object({
  user_id: z.uuid(), couple_id: z.uuid(), session_id: z.uuid(), seq: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  x: z.number().finite(), y: z.number().finite(), vx: z.number().finite(), vy: z.number().finite(),
  direction: directionSchema, animation: z.enum(['idle', 'walk']), room: z.literal('phase1-room'),
  motion_ms: z.number().finite().nonnegative().optional(),
}).strict();
export type Motion = z.infer<typeof motionSchema>;
export const presenceSchema = z.object({ user_id: z.uuid(), session_id: z.uuid(), joined_at: z.iso.datetime({ offset: true }), room: z.literal('phase1-room'), status: z.enum(['online', 'away']), device: z.enum(['web', 'android']), app_version: z.literal('phase1'), motion_clock: z.literal(1).optional() });
export type HousePresence = z.infer<typeof presenceSchema>;
export const syncRequestSchema = z.object({ request_id: z.uuid(), user_id: z.uuid(), session_id: z.uuid() }).strict();
export const syncResponseSchema = z.object({ request_id: z.uuid(), to_session: z.uuid(), player: motionSchema }).strict();
export const motionEvents = ['PLAYER_JOINED', 'PLAYER_LEFT', 'PLAYER_MOVED', 'PLAYER_STOPPED', 'PLAYER_ANIMATION_CHANGED', 'PLAYER_ROOM_CHANGED'] as const;
export type MotionEvent = typeof motionEvents[number];
export type HouseEvent = MotionEvent | 'sync_request' | 'sync_response';
export type HouseEventMap = { [E in MotionEvent]: Motion } & { sync_request: z.infer<typeof syncRequestSchema>; sync_response: z.infer<typeof syncResponseSchema> };

export const WORLD = {
  width: 1400, height: 1000, margin: 44, radius: 15, speed: 170,
  furniture: [
    { x: 220, y: 190, width: 220, height: 108, kind: 'sofa' },
    { x: 650, y: 245, width: 160, height: 110, kind: 'table' },
    { x: 1010, y: 630, width: 230, height: 90, kind: 'cabinet' },
    { x: 210, y: 680, width: 115, height: 100, kind: 'plant' },
  ],
} as const;
export type Point = { x: number; y: number };
export const spawn = (seat: number): Point => ({ x: seat === 1 ? 590 : 780, y: 490 });
export function clampPoint(point: Point): Point {
  return { x: Math.max(WORLD.margin + WORLD.radius, Math.min(WORLD.width - WORLD.margin - WORLD.radius, point.x)), y: Math.max(WORLD.margin + WORLD.radius, Math.min(WORLD.height - WORLD.margin - WORLD.radius, point.y)) };
}
export function collides(point: Point): boolean {
  return WORLD.furniture.some(box => point.x > box.x - WORLD.radius && point.x < box.x + box.width + WORLD.radius && point.y > box.y - WORLD.radius && point.y < box.y + box.height + WORLD.radius);
}
export function movePoint(point: Point, velocity: Point, seconds: number): Point {
  // Substeps stop fast input/latency frames tunnelling through furniture.
  const dt = Math.min(.25, Math.max(0, seconds));
  const steps = Math.max(1, Math.ceil(Math.hypot(velocity.x, velocity.y) * dt / 8));
  let result = { ...point };
  for (let step = 0; step < steps; step++) {
    const nextX = clampPoint({ x: result.x + velocity.x * dt / steps, y: result.y });
    if (!collides(nextX)) result.x = nextX.x;
    const nextY = clampPoint({ x: result.x, y: result.y + velocity.y * dt / steps });
    if (!collides(nextY)) result.y = nextY.y;
  }
  return result;
}
export function velocity(input: Point): Point {
  const length = Math.hypot(input.x, input.y);
  if (!length || !Number.isFinite(length)) return { x: 0, y: 0 };
  const factor = WORLD.speed / Math.max(1, length);
  return { x: input.x * factor, y: input.y * factor };
}
export function facing(vector: Point, previous: Direction): Direction {
  if (!vector.x && !vector.y) return previous;
  return Math.abs(vector.x) > Math.abs(vector.y) ? (vector.x > 0 ? 'right' : 'left') : (vector.y > 0 ? 'down' : 'up');
}

export class MotionBudget {
  private sent: number[] = [];
  private lastCorrection = -Infinity;
  private previous = '';
  private lastMovingSend = -Infinity;
  claim(motion: Pick<Motion, 'vx' | 'vy' | 'direction' | 'animation' | 'room'>, now: number): boolean {
    const signature = JSON.stringify([motion.vx, motion.vy, motion.direction, motion.animation, motion.room]);
    const changed = signature !== this.previous;
    const correction = motion.animation === 'walk' && now - this.lastCorrection >= 1000;
    if (!changed && !correction) return false;
    this.sent = this.sent.filter(time => now - time < 1000);
    const stopping = motion.animation === 'idle';
    // Coalesce analog stick noise and keep the last slot available for release.
    if (this.sent.length >= (stopping ? 10 : 9) || (!stopping && now - this.lastMovingSend < 100)) return false;
    this.sent.push(now); this.previous = signature; this.lastCorrection = now;
    if (!stopping) this.lastMovingSend = now;
    return true;
  }
  reset(motion: Pick<Motion, 'vx' | 'vy' | 'direction' | 'animation' | 'room'>, now: number) {
    this.previous = JSON.stringify([motion.vx, motion.vy, motion.direction, motion.animation, motion.room]); this.lastCorrection = now;
  }
}

export class RemoteMotion {
  private latest: Motion | null = null;
  private receivedAt = 0;
  private rendered: Point;
  private clockOffset: number | null = null;
  private timeline: { at: number; frame: Motion }[] = [];
  private displayed: Motion | null = null;
  constructor(initial: Point) { this.rendered = { ...initial }; }
  accept(frame: Motion, now: number, initialSync = false): boolean {
    if (this.latest && frame.session_id === this.latest.session_id && frame.seq <= this.latest.seq) return false;
    const sameSession = this.latest?.session_id === frame.session_id;
    if (sameSession && frame.motion_ms !== undefined && this.latest?.motion_ms !== undefined && frame.motion_ms < this.latest.motion_ms) return false;
    let point = clampPoint(frame);
    if (collides(point)) point = this.latest ? { x: this.latest.x, y: this.latest.y } : this.rendered;
    if (this.latest && !initialSync && frame.session_id === this.latest.session_id) {
      const delta = { x: point.x - this.latest.x, y: point.y - this.latest.y };
      const interval = frame.motion_ms !== undefined && this.latest.motion_ms !== undefined ? frame.motion_ms - this.latest.motion_ms : now - this.receivedAt;
      const limit = WORLD.speed * Math.min(2, Math.max(0, interval / 1000)) + 48;
      const distance = Math.hypot(delta.x, delta.y);
      if (distance > limit) point = { x: this.latest.x + delta.x * limit / distance, y: this.latest.y + delta.y * limit / distance };
      if (collides(point)) point = { x: this.latest.x, y: this.latest.y };
    }
    let v = velocity({ x: frame.vx / WORLD.speed, y: frame.vy / WORLD.speed });
    if (frame.animation === 'idle') v = { x: 0, y: 0 };
    if (!this.latest) this.rendered = { ...point };
    if (!sameSession) { this.timeline = []; this.clockOffset = null; }
    this.latest = { ...frame, ...point, vx: v.x, vy: v.y }; this.receivedAt = now;
    if (frame.motion_ms === undefined) { this.timeline = []; this.clockOffset = null; }
    else {
      const offset = now - frame.motion_ms;
      this.clockOffset = this.clockOffset === null ? offset : Math.min(this.clockOffset, offset);
      this.timeline.push({ at: frame.motion_ms, frame: this.latest });
      this.timeline = this.timeline.filter(item => item.at >= frame.motion_ms! - 3000).slice(-32);
    }
    return true;
  }
  stop() {
    if (this.latest) this.latest = { ...this.latest, ...this.rendered, vx: 0, vy: 0, animation: 'idle' };
    this.displayed = this.latest; this.timeline = []; this.clockOffset = null;
  }
  sample(now: number, dt: number): Point {
    if (!this.latest) return this.rendered;
    let source = this.latest;
    let age = now - this.receivedAt;
    if (this.clockOffset !== null && this.timeline.length) {
      const playback = now - this.clockOffset - 100;
      let current = this.timeline[0]!;
      for (const item of this.timeline) { if (item.at > playback) break; current = item; }
      source = current.frame; age = playback - current.at;
    }
    this.displayed = source;
    const elapsed = Math.min(1.4, Math.max(0, age / 1000));
    let target: Point = { x: source.x, y: source.y };
    // Collision-aware extrapolation may cover > one quarter second.
    for (let remaining = elapsed; remaining > 0; remaining -= .25) target = movePoint(target, { x: source.vx, y: source.vy }, Math.min(.25, remaining));
    const renderStep = Math.min(.1, Math.max(0, dt));
    const blend = 1 - Math.exp(-renderStep * 12);
    const correction = { x: (target.x - this.rendered.x) * blend, y: (target.y - this.rendered.y) * blend };
    const distance = Math.hypot(correction.x, correction.y);
    const limit = WORLD.speed * 1.4 * renderStep;
    const scale = distance > limit ? limit / distance : 1;
    // Collision substeps apply to corrections too; a delayed packet never snaps.
    this.rendered = movePoint(this.rendered, { x: correction.x * scale / Math.max(.001, renderStep), y: correction.y * scale / Math.max(.001, renderStep) }, renderStep);
    return this.rendered;
  }
  get frame(): Motion | null { return this.latest; }
  get displayFrame(): Motion | null { return this.displayed ?? this.latest; }
}

export function supportsMotionClock(values: Iterable<HousePresence>, localSession: string): boolean {
  let hasPeer = false;
  for (const peer of values) {
    if (peer.session_id === localSession) continue;
    if (peer.motion_clock !== 1) return false;
    hasPeer = true;
  }
  return hasPeer;
}

export function preferredSessions(values: readonly HousePresence[]): Map<string, HousePresence> {
  const result = new Map<string, HousePresence>();
  for (const value of values) {
    const previous = result.get(value.user_id);
    if (!previous || Date.parse(value.joined_at) > Date.parse(previous.joined_at) || (Date.parse(value.joined_at) === Date.parse(previous.joined_at) && value.session_id > previous.session_id)) result.set(value.user_id, value);
  }
  return result;
}
