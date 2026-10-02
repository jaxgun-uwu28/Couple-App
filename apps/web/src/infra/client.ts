import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { PublicConfig } from './config';
import { sessionStorageAdapter } from './storage';

// React StrictMode may repeat render-time factories. Reuse one SDK client for
// the same configuration object so auth storage has only one active owner.
const clients = new WeakMap<PublicConfig, SupabaseClient>();
export function getClient(config: PublicConfig): SupabaseClient {
  const existing = clients.get(config);
  if (existing) return existing;
  const client = createClient(config.url, config.key, { auth: { ...(sessionStorageAdapter ? { storage: sessionStorageAdapter } : {}) } });
  clients.set(config, client);
  return client;
}
