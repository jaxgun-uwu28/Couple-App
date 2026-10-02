import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import type { HouseSnapshot } from '@paw/shared';
import { initialConfig, publicConfigSchema } from './infra/config';
import type { PublicConfig } from './infra/config';
import { getClient } from './infra/client';
import { HouseApi } from './infra/HouseApi';
import { snapshotCache } from './infra/storage';
import { publicWebUrl, readInvite } from './infra/lifecycle';
const World = lazy(() => import('./game/World'));
const Probe = lazy(() => import('./diagnostics/Phase0Probe').then(module => ({ default: module.Phase0Probe })));

export function App() {
  const [config, setConfig] = useState(initialConfig);
  if (new URLSearchParams(location.search).has('probe')) return <Suspense fallback={<p>Loading…</p>}><Probe /></Suspense>;
  return config ? <ConnectedApp config={config} /> : <Setup onReady={setConfig} />;
}
function Setup({ onReady }: { onReady: (config: PublicConfig) => void }) {
  const [error, setError] = useState('');
  return <main className="account-page"><section className="account-card"><h1>Paw & Us</h1><p>Connect your home.</p><form onSubmit={event => {
    event.preventDefault(); const values = new FormData(event.currentTarget);
    const parsed = publicConfigSchema.safeParse({ url: values.get('url'), key: values.get('key') });
    if (!parsed.success) { setError('Use your HTTPS Supabase URL and public publishable key.'); return; }
    try { localStorage.setItem('paw-phase0-public-config', JSON.stringify(parsed.data)); } catch { /* Session only. */ }
    onReady(parsed.data);
  }}><label>Project URL<input name="url" type="url" required /></label><label>Public API key<input name="key" required /></label><button>Connect</button></form><p role="alert">{error}</p></section></main>;
}
function ConnectedApp({ config }: { config: PublicConfig }) {
  const client = useMemo(() => getClient(config), [config]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const { data } = client.auth.onAuthStateChange((_event, value) => { if (!cancelled) { if(!value)void snapshotCache.clear();setSession(value); setLoading(false); } });
    void client.auth.getSession().then(({ data, error }) => { if (!cancelled) { setSession(error ? null : data.session); setLoading(false); } });
    return () => { cancelled = true; data.subscription.unsubscribe(); };
  }, [client]);
  if (loading) return <main className="account-page"><p role="status">Opening your home…</p></main>;
  return session ? <Home key={session.user.id} client={client} userId={session.user.id} /> : <Auth client={client} />;
}
function Auth({ client }: { client: SupabaseClient }) {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  return <main className="account-page"><section className="account-card"><span className="brand-paw" aria-hidden="true">♡</span><h1>Paw & Us</h1><p>A little home for the two of you.</p><h2>{register ? 'Create account' : 'Welcome home'}</h2><form onSubmit={async event => {
    event.preventDefault(); if (busy) return; const values = new FormData(event.currentTarget); setBusy(true); setMessage('');
    try {
      const email = String(values.get('email')).trim(); const password = String(values.get('password'));
      const response = register ? await client.auth.signUp({ email, password, options: { data: { display_name: String(values.get('name')).trim() }, emailRedirectTo: `${publicWebUrl}/` } }) : await client.auth.signInWithPassword({ email, password });
      if (response.error) throw response.error;
      if (register && !response.data.session) setMessage('Check your email to confirm your account, then sign in.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not sign in. Try again.'); }
    finally { setBusy(false); }
  }}>{register && <label>Name<input name="name" maxLength={24} required autoComplete="nickname" /></label>}<label>Email<input name="email" type="email" required autoComplete="email" /></label><label>Password<input name="password" type="password" required minLength={6} autoComplete={register ? 'new-password' : 'current-password'} /></label><button disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}</button></form><p role="status">{message}</p><button className="quiet" disabled={busy} onClick={() => { setRegister(!register); setMessage(''); }}>{register ? 'Back to sign in' : 'Create account'}</button></section></main>;
}
function Home({ client, userId }: { client: SupabaseClient; userId: string }) {
  const api = useMemo(() => new HouseApi(client, userId, snapshotCache.activate(userId)), [client, userId]);
  const [snapshot, setSnapshot] = useState<HouseSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState(() => readInvite(location.href));
  const refresh = useCallback(async () => { const next = await api.snapshot(null); setSnapshot(next); setVerified(true); return next; }, [api]);
  useEffect(() => {
    let cancelled = false;
    const epoch = snapshotCache.activate(userId);
    void (async () => {
      const cached = await snapshotCache.read(userId, epoch);
      if (!cancelled && cached) {setSnapshot(cached);setPlaying(true);}
      try { const next = await api.snapshot(cached); if (!cancelled) { setSnapshot(next); setVerified(true); setPlaying(next?.status === 'active'); } }
      catch (error) { if (!cancelled) setError(error instanceof Error ? error.message : 'Could not load your home.'); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [api, userId]);
  useEffect(() => {
    if (playing || !verified || snapshot?.status !== 'pending') return;
    const timer = setInterval(() => { if (!document.hidden) void refresh().catch(() => undefined); }, 8000);
    return () => clearInterval(timer);
  }, [playing, verified, snapshot?.status, refresh]);
  const logout = async () => { setPlaying(false); setSnapshot(null); setVerified(false); await snapshotCache.clear(); const { error } = await client.auth.signOut(); if (error) setError('Could not sign out. Reconnect and try again.'); };
  const action = async (name: Parameters<HouseApi['action']>[0]) => {
    if (busy || !verified) return; setBusy(true); setError('');
    try { await api.action(name, code); await refresh(); if (name === 'join_couple') { history.replaceState(null, '', location.pathname); setPlaying(true); } }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not update your home.'); }
    finally { setBusy(false); }
  };
  if (playing && snapshot) return <Suspense fallback={<main className="account-page"><p>Opening Home…</p></main>}><World client={client} api={api} snapshot={snapshot} onSnapshot={value=>{setSnapshot(value);setVerified(true);}} onBack={() => setPlaying(false)} onLogout={logout} /></Suspense>;
  return <main className="account-page"><section className="account-card"><h1>Paw & Us</h1><p>Your home starts with the two of you.</p>{loading ? <p role="status">Opening your home…</p> : !verified ? <><p>Your saved home is read-only until it reconnects.</p><button onClick={() => { setBusy(true); void refresh().catch(error => setError(error.message)).finally(() => setBusy(false)); }} disabled={busy}>Reconnect</button></> : !snapshot ? <><h2>Make a home together</h2><button disabled={busy} onClick={() => void action('create_couple')}>Create couple</button><p>Have an invite from your partner?</p><form onSubmit={event => { event.preventDefault(); void action('join_couple'); }}><label>Invite code<input value={code} onChange={event => setCode(event.target.value.toUpperCase())} maxLength={12} autoComplete="off" required /></label><button disabled={busy}>Join</button></form></> : <><h2>{snapshot.status === 'active' ? 'Your home is ready' : 'Invite your partner'}</h2>{snapshot.invite && <><p className="invite-code">{snapshot.invite.code}</p><p>Use once before {new Date(snapshot.invite.expires_at).toLocaleDateString()}.</p><button onClick={() => { void navigator.clipboard?.writeText(`${publicWebUrl}/?invite=${snapshot.invite!.code}`).then(() => setError('Invite link copied.')).catch(() => setError('Copy the invite code above.')); }}>Copy invite link</button></>}{snapshot.status === 'pending' && <button className="quiet" disabled={busy} onClick={() => void action('refresh_invite')}>New invite</button>}<button disabled={busy} onClick={() => setPlaying(true)}>Home</button>{snapshot.status === 'pending' && <button className="quiet" disabled={busy} onClick={() => { if (confirm('Cancel this home and its unused invite?')) void action('cancel_pending_couple'); }}>Cancel invite</button>}</>}<p role="status">{error}</p><button className="quiet" onClick={() => void logout()}>Sign out</button></section></main>;
}
