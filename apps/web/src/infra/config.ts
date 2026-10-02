import { z } from 'zod';

function isPublicKey(key: string): boolean {
  if (key.startsWith('sb_publishable_') && key.length > 25) return true;
  try {
    const segment = key.split('.')[1];
    if (!segment) return false;
    const role: unknown = JSON.parse(atob(segment.replace(/-/g, '+').replace(/_/g, '/'))).role;
    return role === 'anon';
  } catch { return false; }
}
export const publicConfigSchema = z.object({
  url: z.url().refine(value => new URL(value).protocol === 'https:', 'Use an HTTPS project URL'),
  key: z.string().refine(isPublicKey, 'Use only the public anon or publishable key'),
}).strict();
export type PublicConfig = z.infer<typeof publicConfigSchema>;
export function initialConfig(): PublicConfig | null {
  const env = publicConfigSchema.safeParse({ url: import.meta.env.VITE_SUPABASE_URL, key: import.meta.env.VITE_SUPABASE_ANON_KEY });
  if (env.success) return env.data;
  try {
    const saved = publicConfigSchema.safeParse(JSON.parse(localStorage.getItem('paw-phase0-public-config') ?? 'null'));
    return saved.success ? saved.data : null;
  } catch { return null; }
}
