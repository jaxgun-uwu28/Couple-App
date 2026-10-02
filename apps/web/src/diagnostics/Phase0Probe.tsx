import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Capacitor } from '@capacitor/core';
import { getClient } from '../infra/client';
import { PingWindow } from '@paw/shared';
import type { ConnectionState, SpikePing } from '@paw/shared';
import { Canvas } from '../Canvas';
import { initialConfig, publicConfigSchema } from '../infra/config';
import type { PublicConfig } from '../infra/config';
import { SupabaseTransport } from '../infra/SupabaseTransport';

export function Phase0Probe() {
  const [config, setConfig] = useState<PublicConfig | null>(initialConfig);
  const [configError, setConfigError] = useState('');
  const configure = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = publicConfigSchema.safeParse({ url: data.get('url'), key: data.get('key') });
    if (!parsed.success) { setConfigError(parsed.error.issues[0]?.message ?? 'Check the project settings.'); return; }
    try { localStorage.setItem('paw-phase0-public-config', JSON.stringify(parsed.data)); } catch { /* Storage is optional. */ }
    setConfigError(''); setConfig(parsed.data);
  };
  return <main className="probe-root">
    <header><h1>Paw &amp; Us</h1><p>Phase 0 · Infrastructure test</p></header>
    <Canvas />
    <p className="note">This is the test canvas. The approved house and gameplay will be built in later phases.</p>
    {config ? <Probe config={config} onReset={() => {
      try { localStorage.removeItem('paw-phase0-public-config'); } catch { /* Optional storage. */ }
      setConfig(null);
    }} /> : <section aria-labelledby="setup-title">
      <h2 id="setup-title">Connect the free project</h2>
      <p>Use the public Supabase URL and anon or publishable key. Never enter a secret key.</p>
      <form onSubmit={configure}>
        <label>Project URL<input name="url" type="url" required placeholder="https://your-project.supabase.co" /></label>
        <label>Public key<input name="key" required autoComplete="off" /></label>
        <button>Save project</button>
      </form>
      {configError && <p role="alert">{configError}</p>}
    </section>}
  </main>;
}

function Probe({ config, onReset }: { config: PublicConfig; onReset: () => void }) {
  const client = useMemo(() => getClient(config), [config]);
  const transport = useMemo(() => new SupabaseTransport(client), [client]);
  const window = useRef(new PingWindow());
  const [state, setState] = useState<ConnectionState>('offline');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Sign in with an administrator-provisioned Phase 0 test account.');
  const [pings, setPings] = useState<SpikePing[]>([]);
  const [sent, setSent] = useState(0);
  useEffect(() => {
    client.auth.startAutoRefresh();
    const stopState = transport.onState(next => {
      setState(next);
      if (next === 'connecting') setMessage('Connecting to your private couple channel…');
      else if (next === 'connected') setMessage('Connected to your private couple channel. Open this build on the other device and send a ping.');
      else if (next === 'error') setMessage('Connection interrupted. Reconnect if it does not recover.');
    });
    const stopPing = transport.onEvent('spike_ping', payload => {
      const ping = window.current.accept(payload);
      if (ping) setPings(previous => [ping, ...previous].slice(0, 20));
    });
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' && session) void client.realtime.setAuth(session.access_token).catch(() => setMessage('Session refresh failed. Reconnect.'));
      if (event === 'SIGNED_OUT') void transport.disconnect();
    });
    return () => { stopState(); stopPing(); subscription.unsubscribe(); void transport.disconnect(); client.auth.stopAutoRefresh(); };
  }, [client, transport]);
  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    try { await task(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Something went wrong. Try again.'); }
    finally { setBusy(false); }
  };
  const connect = async () => {
    await transport.connect();
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('Sign in again.');
    const { data, error } = await client.from('couple_members').select('couple_id').eq('user_id', user.id).maybeSingle();
    if (error) throw new Error('Membership could not load. Check the migration.');
    if (!data) throw new Error('No couple membership. An administrator must provision the test pair.');
    await transport.join(String(data.couple_id));
    setMessage('Connected to your private couple channel. Open this build on the other device and send a ping.');
  };
  const signIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email'));
    const password = String(data.get('password'));
    event.currentTarget.reset();
    void run(async () => {
      await transport.disconnect(); setPings([]); setSent(0); window.current = new PingWindow();
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw new Error('Sign in failed. Check the test account email and password.');
      await connect();
    });
  };
  return <section aria-labelledby="ping-title">
    <h2 id="ping-title">Private Realtime ping</h2>
    <p role="status">Connection: {state}</p>
    <form onSubmit={signIn}>
      <label>Test account email<input name="email" type="email" autoComplete="username" required /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
      <button disabled={busy}>Sign in and connect</button>
    </form>
    <div className="actions">
      <button disabled={busy || state !== 'connected'} onClick={() => void run(async () => {
        if (document.hidden) throw new Error('Return to the app before sending.');
        if (!window.current.claimSend(performance.now())) throw new Error('Wait a second before sending again.');
        const { data: { user } } = await client.auth.getUser();
        if (!user) throw new Error('Sign in again.');
        await transport.broadcast('spike_ping', {
          id: crypto.randomUUID(), sender_id: user.id,
          device: Capacitor.isNativePlatform() ? 'android' : 'web', sent_at: new Date().toISOString(),
        });
        setSent(previous => previous + 1); setMessage('Ping sent. Check the other device for receipt.');
      })}>Send ping</button>
      <button disabled={busy} onClick={() => void run(connect)}>Reconnect</button>
      <button disabled={busy} onClick={() => void run(async () => { await transport.disconnect(); setMessage('Disconnected. Reconnect to send again.'); })}>Disconnect</button>
      <button disabled={busy} onClick={() => void run(async () => {
        await transport.disconnect();
        const { error } = await client.auth.signOut({ scope: 'local' });
        if (error) throw new Error('Sign out failed. Try Clear setup again.');
        setPings([]); setSent(0); onReset();
      })}>Clear setup</button>
    </div>
    <p role="status">{message}</p>
    <p>Sent: {sent} · Received: {pings.length} (last 20)</p>
    {pings.length === 0 ? <p>No pings received yet.</p> : <ul aria-label="Received pings">{pings.map(ping => <li key={ping.id}>From {ping.device} · {ping.sent_at} · {ping.id}</li>)}</ul>}
    <p className="note">Manual pings only. No gameplay messages while idle. Receipt on both real devices is still required to complete Phase 0.</p>
  </section>;
}
