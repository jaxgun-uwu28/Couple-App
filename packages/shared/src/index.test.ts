import { describe, expect, it } from 'vitest';
import { PingWindow, spikePingSchema } from './index';

const ping = {
  id: '11111111-1111-4111-8111-111111111111',
  sender_id: '22222222-2222-4222-8222-222222222222',
  device: 'web' as const,
  sent_at: '2026-10-02T00:00:00.000Z',
};
describe('private ephemeral ping boundary', () => {
  it('accepts web and Android messages', () => {
    expect(spikePingSchema.parse(ping).device).toBe('web');
    expect(spikePingSchema.parse({ ...ping, device: 'android' }).device).toBe('android');
  });
  it.each([null, {}, { ...ping, id: 'wrong' }, { ...ping, sent_at: 'yesterday' },
    { ...ping, device: 'server' }, { ...ping, reward: 100 }])('rejects invalid payload %#', payload => {
    expect(new PingWindow().accept(payload)).toBeNull();
  });
  it('deduplicates across reconnect and keeps partner simultaneous sends', () => {
    const window = new PingWindow();
    expect(window.accept(ping)).toEqual(ping);
    expect(window.accept(ping)).toBeNull();
    expect(window.accept({ ...ping, id: '33333333-3333-4333-8333-333333333333' })).not.toBeNull();
  });
  it('bounds retained IDs', () => {
    const window = new PingWindow(1);
    window.accept(ping);
    window.accept({ ...ping, id: '33333333-3333-4333-8333-333333333333' });
    expect(window.accept(ping)).not.toBeNull();
  });
  it('permits manual sends at most once per second', () => {
    const window = new PingWindow();
    expect(window.claimSend(0)).toBe(true);
    expect(window.claimSend(999)).toBe(false);
    expect(window.claimSend(1000)).toBe(true);
  });
});
