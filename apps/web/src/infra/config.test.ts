import { expect, it } from 'vitest';
import { publicConfigSchema } from './config';
it('rejects private keys and insecure URLs before creating a client', () => {
  expect(publicConfigSchema.safeParse({ url: 'https://test.supabase.co', key: 'sb_secret_never-ship-this' }).success).toBe(false);
  expect(publicConfigSchema.safeParse({ url: 'http://test.supabase.co', key: 'sb_publishable_public-test-value' }).success).toBe(false);
  expect(publicConfigSchema.safeParse({ url: 'https://test.supabase.co', key: 'sb_publishable_public-test-value' }).success).toBe(true);
  const jwt = (role: string) => `header.${btoa(JSON.stringify({ role }))}.signature`;
  expect(publicConfigSchema.safeParse({ url: 'https://test.supabase.co', key: jwt('service_role') }).success).toBe(false);
  expect(publicConfigSchema.safeParse({ url: 'https://test.supabase.co', key: jwt('anon') }).success).toBe(true);
});
