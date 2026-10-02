import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

export function watchForeground(listener: (active: boolean) => void): () => void {
  let stopped = false; let nativeActive = true; let previous: boolean | undefined;
  const update = () => { const next = !document.hidden && nativeActive; if (!stopped && next !== previous) { previous=next; listener(next); } };
  document.addEventListener('visibilitychange',update); update();
  const handle = Capacitor.isNativePlatform() ? App.addListener('appStateChange', state => { nativeActive=state.isActive; update(); }) : null;
  if(Capacitor.isNativePlatform())void App.getState().then(state=>{nativeActive=state.isActive;update();}).catch(()=>undefined);
  return () => { stopped=true; document.removeEventListener('visibilitychange',update); void handle?.then(value => value.remove()); };
}
export function readInvite(url: string): string {
  try { return new URL(url).searchParams.get('invite')?.replaceAll('-','').toUpperCase().slice(0,8) ?? ''; } catch { return ''; }
}
export const publicWebUrl = 'https://couple-app-web-two.vercel.app/';
