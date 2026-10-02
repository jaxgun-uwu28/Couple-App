import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { fullSnapshotSchema } from '@paw/shared';
import type { HouseSnapshot } from '@paw/shared';

export const sessionStorageAdapter = Capacitor.isNativePlatform() ? {
  async getItem(key: string) { return (await Preferences.get({ key })).value; },
  async setItem(key: string, value: string) { await Preferences.set({ key, value }); },
  async removeItem(key: string) { await Preferences.remove({ key }); },
} : undefined;

export type Settings = { reducedMotion: boolean; nameTags: boolean; joystickSize: number };
export const defaultSettings: Settings = { reducedMotion: false, nameTags: true, joystickSize: 116 };
export async function readSettings(): Promise<Settings> {
  try {
    const value = Capacitor.isNativePlatform() ? (await Preferences.get({ key: 'paw-settings' })).value : localStorage.getItem('paw-settings');
    if (!value) return { ...defaultSettings, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches };
    const data = JSON.parse(value) as Partial<Settings>;
    return { reducedMotion: data.reducedMotion === true, nameTags: data.nameTags !== false, joystickSize: [96,116,136].includes(data.joystickSize ?? 0) ? data.joystickSize! : 116 };
  } catch { return { ...defaultSettings }; }
}
export async function saveSettings(value: Settings): Promise<void> {
  try {
    const encoded = JSON.stringify(value);
    if (Capacitor.isNativePlatform()) await Preferences.set({ key: 'paw-settings', value: encoded });
    else localStorage.setItem('paw-settings', encoded);
  } catch { /* Settings still work for this session when storage is unavailable. */ }
}

type CacheRow = { key: string; userId: string; schema: 2; snapshot: HouseSnapshot };
export class SnapshotCache {
  private activeUser: string | null = null;
  private epoch = 0;
  private database: Promise<IDBDatabase> | undefined;
  private queue: Promise<unknown> = Promise.resolve();
  private memory: HouseSnapshot | null = null;
  private open(): Promise<IDBDatabase> {
    this.database ??= new Promise((resolve, reject) => {
      const request = indexedDB.open('paw-house-cache', 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        for (const store of Array.from(database.objectStoreNames)) database.deleteObjectStore(store);
        const store = database.createObjectStore('snapshots', { keyPath: 'key' });
        store.createIndex('userId', 'userId');
      };
      request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Cache unavailable.'));
    });
    return this.database;
  }
  private serial<T>(task: () => Promise<T>): Promise<T> {
    const result = this.queue.then(task, task);
    this.queue = result.catch(() => undefined);
    return result;
  }
  activate(userId: string | null): number {
    if (userId !== this.activeUser) {
      this.activeUser = userId; this.epoch++; this.memory = null;
      // Only the current account may leave private cached records on this device.
      void this.serial(async () => {
        try {
          const database = await this.open();
          await new Promise<void>((resolve, reject) => {
            const tx = database.transaction('snapshots', 'readwrite');
            const store = tx.objectStore('snapshots');
            const request = store.openCursor();
            request.onsuccess = () => { const cursor = request.result; if (cursor) { if ((cursor.value as CacheRow).userId !== this.activeUser) cursor.delete(); cursor.continue(); } };
            tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
          });
        } catch { /* Cache is optional, authoritative reads still work. */ }
      });
    }
    return this.epoch;
  }
  async read(userId: string, epoch: number): Promise<HouseSnapshot | null> {
    return this.serial(async () => {
      if (this.activeUser !== userId || epoch !== this.epoch) return null;
      try {
        const database = await this.open();
        const rows = await new Promise<CacheRow[]>((resolve, reject) => {
          const request = database.transaction('snapshots').objectStore('snapshots').index('userId').getAll(userId);
          request.onsuccess = () => resolve(request.result as CacheRow[]); request.onerror = () => reject(request.error);
        });
        const row = rows.find(value => value.schema === 2 && value.key === `${userId}:${value.snapshot.couple_id}:2`);
        const parsed = fullSnapshotSchema.safeParse(row?.snapshot);
        if (this.activeUser === userId && epoch === this.epoch && parsed.success && parsed.data.user_id === userId) { this.memory = parsed.data; return parsed.data; }
      } catch { /* Fall back to this account's in-memory read-through copy. */ }
      return this.activeUser === userId && epoch === this.epoch ? this.memory : null;
    });
  }
  async write(snapshot: HouseSnapshot, epoch: number): Promise<void> {
    await this.serial(async () => {
      if (this.activeUser !== snapshot.user_id || epoch !== this.epoch) return;
      this.memory = snapshot;
      try {
        const database = await this.open();
        if (this.activeUser !== snapshot.user_id || epoch !== this.epoch) return;
        await new Promise<void>((resolve, reject) => {
          const tx = database.transaction('snapshots','readwrite'); const store = tx.objectStore('snapshots');
          store.clear(); store.put({ key: `${snapshot.user_id}:${snapshot.couple_id}:2`, userId: snapshot.user_id, schema: 2, snapshot } satisfies CacheRow);
          tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
        });
      } catch { /* Never stop play or authorize from cache on storage failure. */ }
    });
  }
  async clear(): Promise<void> {
    this.activeUser = null; this.epoch++; this.memory = null;
    await this.serial(async () => {
      try {
        const database = await this.open();
        await new Promise<void>((resolve, reject) => {
          const tx=database.transaction('snapshots','readwrite'); tx.objectStore('snapshots').clear();
          tx.oncomplete=()=>resolve(); tx.onerror=()=>reject(tx.error);
        });
      } catch { /* Optional disposable cache. */ }
    });
  }
}
export const snapshotCache = new SnapshotCache();
