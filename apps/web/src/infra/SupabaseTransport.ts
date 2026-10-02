import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { coupleIdSchema, spikePingSchema } from '@paw/shared';
import type { ConnectionState, RealtimeTransport, SpikePing } from '@paw/shared';

export class SupabaseTransport implements RealtimeTransport {
  private channel: RealtimeChannel | undefined;
  private readonly events = new Set<(payload: SpikePing) => void>();
  private readonly states = new Set<(state: ConnectionState) => void>();
  private state: ConnectionState = 'offline';
  private cancelJoin: (() => void) | undefined;
  constructor(private readonly client: SupabaseClient) {}
  private setState(state: ConnectionState) {
    this.state = state;
    this.states.forEach(listener => listener(state));
  }
  async connect() {
    const { data, error } = await this.client.auth.getSession();
    if (error || !data.session) throw new Error('Sign in before connecting.');
    await this.client.realtime.setAuth(data.session.access_token);
  }
  async join(coupleId: string) {
    coupleIdSchema.parse(coupleId);
    await this.disconnect();
    this.setState('connecting');
    const channel = this.client.channel(`house:${coupleId}`, { config: { private: true, broadcast: { ack: true, self: false } } });
    this.channel = channel;
    channel.on('broadcast', { event: 'spike_ping' }, ({ payload }: { payload: unknown }) => {
      const parsed = spikePingSchema.safeParse(payload);
      if (parsed.success) this.events.forEach(listener => listener(parsed.data));
    });
    await new Promise<void>((resolve, reject) => {
      const finish = (error?: Error) => {
        clearTimeout(timer); this.cancelJoin = undefined;
        if (error) reject(error); else resolve();
      };
      const timer = setTimeout(() => { this.setState('error'); finish(new Error('Connection timed out. Try again.')); }, 15_000);
      this.cancelJoin = () => finish(new Error('Connection cancelled.'));
      channel.subscribe(status => {
        if (this.channel !== channel) return;
        if (status === 'SUBSCRIBED') { this.setState('connected'); finish(); }
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.setState('error'); finish(new Error('Could not join. Check membership and Realtime authorization.'));
        } else if (status === 'CLOSED') { this.setState('offline'); finish(new Error('Connection closed.')); }
      });
    });
  }
  async broadcast(event: 'spike_ping', payload: SpikePing) {
    spikePingSchema.parse(payload);
    if (!this.channel || this.state !== 'connected') throw new Error('Reconnect before sending.');
    const result = await this.channel.send({ type: 'broadcast', event, payload });
    if (result !== 'ok') throw new Error('Ping was not acknowledged. Reconnect and try again.');
  }
  onEvent(_event: 'spike_ping', listener: (payload: SpikePing) => void) {
    this.events.add(listener);
    return () => { this.events.delete(listener); };
  }
  onState(listener: (state: ConnectionState) => void) {
    this.states.add(listener); listener(this.state);
    return () => { this.states.delete(listener); };
  }
  presence(): Readonly<Record<string, unknown>> { return this.channel?.presenceState() ?? {}; }
  async disconnect() {
    this.cancelJoin?.();
    const channel = this.channel;
    this.channel = undefined;
    if (channel) await this.client.removeChannel(channel);
    this.setState('offline');
  }
}
