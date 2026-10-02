import { z } from 'zod';

export const coupleIdSchema = z.uuid();
export const spikePingSchema = z.object({
  id: z.uuid(),
  sender_id: z.uuid(),
  device: z.enum(['web', 'android']),
  sent_at: z.iso.datetime(),
}).strict();
export type SpikePing = z.infer<typeof spikePingSchema>;
export type ConnectionState = 'offline' | 'connecting' | 'connected' | 'error';
export interface RealtimeTransport {
  connect(): Promise<void>;
  join(coupleId: string): Promise<void>;
  broadcast(event: 'spike_ping', payload: SpikePing): Promise<void>;
  onEvent(event: 'spike_ping', listener: (payload: SpikePing) => void): () => void;
  onState(listener: (state: ConnectionState) => void): () => void;
  presence(): Readonly<Record<string, unknown>>;
  disconnect(): Promise<void>;
}
export interface BackendApi {
  health(): Promise<{ status: 'ok' }>;
  isCoupleMember(coupleId: string): Promise<boolean>;
}

// An ephemeral probe: never queued offline or used to authorize persistent state.
export class PingWindow {
  private readonly seen = new Set<string>();
  private lastSent = Number.NEGATIVE_INFINITY;
  constructor(private readonly capacity = 128) {}
  accept(payload: unknown): SpikePing | null {
    const parsed = spikePingSchema.safeParse(payload);
    if (!parsed.success || this.seen.has(parsed.data.id)) return null;
    this.seen.add(parsed.data.id);
    if (this.seen.size > this.capacity) {
      const oldest = this.seen.values().next().value;
      if (oldest) this.seen.delete(oldest);
    }
    return parsed.data;
  }
  claimSend(now: number): boolean {
    if (now - this.lastSent < 1000) return false;
    this.lastSent = now;
    return true;
  }
}
