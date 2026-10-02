import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseTransport } from './SupabaseTransport';

function fixture() {
  let status: ((status: 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'CLOSED') => void) | undefined;
  let receive: ((data: { payload: unknown }) => void) | undefined;
  const channel = {
    on: vi.fn((_type: string, _filter: unknown, listener: (data: { payload: unknown }) => void) => { receive = listener; return channel; }),
    subscribe: vi.fn((listener: typeof status) => { status = listener; return channel; }),
    send: vi.fn().mockResolvedValue('ok'),
    presenceState: vi.fn(() => ({})),
  };
  const client = {
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'test-token' } }, error: null }) },
    realtime: { setAuth: vi.fn().mockResolvedValue(undefined) },
    channel: vi.fn(() => channel), removeChannel: vi.fn().mockResolvedValue('ok'),
  };
  return {
    client, channel, transport: new SupabaseTransport(client as unknown as SupabaseClient),
    status: (value: Parameters<NonNullable<typeof status>>[0]) => status?.(value),
    receive: (payload: unknown) => receive?.({ payload }),
  };
}
const couple = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ping = { id: '11111111-1111-4111-8111-111111111111', sender_id: '22222222-2222-4222-8222-222222222222', device: 'web' as const, sent_at: '2026-10-02T00:00:00.000Z' };
describe('Supabase private channel boundary', () => {
  it('authenticates, joins privately, recovers status and rejects malformed incoming data', async () => {
    const f = fixture();
    const listener = vi.fn(); const states = vi.fn();
    f.transport.onEvent('spike_ping', listener); f.transport.onState(states);
    await f.transport.connect();
    const joined = f.transport.join(couple);
    await vi.waitFor(() => expect(f.channel.subscribe).toHaveBeenCalled());
    f.status('SUBSCRIBED'); await joined;
    expect(f.client.realtime.setAuth).toHaveBeenCalledWith('test-token');
    expect(f.client.channel).toHaveBeenCalledWith(`house:${couple}`, { config: { private: true, broadcast: { ack: true, self: false } } });
    f.receive({ ...ping, reward: 100 }); f.receive(ping);
    expect(listener).toHaveBeenCalledExactlyOnceWith(ping);
    f.status('CHANNEL_ERROR');
    await expect(f.transport.broadcast('spike_ping', ping)).rejects.toThrow('Reconnect');
    f.status('SUBSCRIBED');
    await f.transport.broadcast('spike_ping', ping);
    expect(states).toHaveBeenLastCalledWith('connected');
    await f.transport.disconnect();
    await expect(f.transport.broadcast('spike_ping', ping)).rejects.toThrow('Reconnect');
  });
  it('handles join rejection and a lost acknowledgement', async () => {
    const f = fixture();
    const joined = f.transport.join(couple);
    const failed = expect(joined).rejects.toThrow('Could not join');
    await vi.waitFor(() => expect(f.channel.subscribe).toHaveBeenCalled());
    f.status('CHANNEL_ERROR'); await failed;
    f.status('SUBSCRIBED'); f.channel.send.mockResolvedValue('timed out');
    await expect(f.transport.broadcast('spike_ping', ping)).rejects.toThrow('not acknowledged');
    await f.transport.disconnect();
  });
  it('cancels pending joins without leaving a timeout that affects the next connection', async () => {
    const f = fixture();
    const joined = f.transport.join(couple);
    const cancelled = expect(joined).rejects.toThrow('cancelled');
    await vi.waitFor(() => expect(f.channel.subscribe).toHaveBeenCalled());
    await f.transport.disconnect(); await cancelled;
  });
  it('rejects invalid couple IDs before touching Realtime', async () => {
    const f = fixture();
    await expect(f.transport.join('other-house')).rejects.toThrow();
    expect(f.client.channel).not.toHaveBeenCalled();
  });
});
