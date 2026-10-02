import { useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { WORLD, COTTAGE, nearestInteraction, roomAt, roomLabel, cottageRooms, cottageFurniture, cottageInteractions } from '@paw/shared';
import type { HouseSnapshot, Point } from '@paw/shared';
import { HouseTransport } from '../infra/HouseTransport';
import type { HouseApi } from '../infra/HouseApi';
import { defaultSettings, readSettings, saveSettings } from '../infra/storage';
import type { Settings } from '../infra/storage';
import { HouseRuntime } from './HouseRuntime';
import { CottageArt } from './CottageArt';
import type { Actor, RuntimeView } from './HouseRuntime';

type Props = { client: SupabaseClient; api: HouseApi; snapshot: HouseSnapshot; onSnapshot: (value: HouseSnapshot | null) => void; onBack: () => void; onLogout: () => Promise<void> };
export default function World({ client, api, snapshot, onSnapshot, onBack, onLogout }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const input = useRef<Point>({ x: 0, y: 0 });
  const runtime = useRef<HouseRuntime | null>(null);
  const initial = useRef(snapshot);
  const snapshotCallback = useRef(onSnapshot); snapshotCallback.current = onSnapshot;
  const [view, setView] = useState<RuntimeView | null>(null);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const settingsRef = useRef(settings); settingsRef.current = settings;
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLElement>(null);
  const [rotateAcknowledged, setRotateAcknowledged] = useState(false);
  const openRef = useRef(open); openRef.current = open;
  const [hint, setHint] = useState('');
  const [minimap, setMinimap] = useState(false);
  const [roomToast,setRoomToast]=useState('');
  const roomTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const targetRef=useRef<string|undefined>(undefined);
  const interactRef=useRef<()=>void>(()=>undefined);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showInteractionHint = (message='Nothing to interact with here yet.') => {
    if (hintTimer.current !== null) clearTimeout(hintTimer.current);
    setHint(message);
    hintTimer.current = setTimeout(() => {
      setHint(current => current === message ? '' : current);
      hintTimer.current = null;
    }, 3000);
  };
  useEffect(() => () => { if (hintTimer.current !== null) clearTimeout(hintTimer.current);if(roomTimer.current!==null)clearTimeout(roomTimer.current); }, []);
  const [arrow, setArrow] = useState<{ angle: number; name: string } | null>(null);
  const [knob, setKnob] = useState<Point>({ x: 0, y: 0 });
  useEffect(() => { void readSettings().then(setSettings); }, []);
  useEffect(() => { if(open)dialog.current?.focus(); }, [open]);
  useEffect(() => {
    let cancelled = false; let game: import('phaser').Game | undefined;
    const controller = new HouseRuntime(new HouseTransport(client,initial.current.house.map_id), api, initial.current, value => snapshotCallback.current(value));
    runtime.current = controller;
    const stopView = controller.onView(setView);
    void controller.start();
    void import('phaser').then(({ default: Phaser }) => {
      if (cancelled || !host.current) return;
      class HouseScene extends Phaser.Scene {
        private cottageArt: CottageArt | null = null;
        private drawings = new Map<string, { body: import('phaser').GameObjects.Container; art: import('phaser').GameObjects.Graphics; label: import('phaser').GameObjects.Text }>();
        private keys!: Record<string, import('phaser').Input.Keyboard.Key>;
        private lastArrow = 0;
        create() {
          const geometry=controller.geometry;
          if(controller.cottage)this.cottageArt=new CottageArt(this,id=>{if(openRef.current)return;if(targetRef.current===id)interactRef.current();else showInteractionHint('Move closer to interact.');});
          else {
          const floor = this.add.graphics();
          floor.fillStyle(0xe3ccd0).fillRoundedRect(20, 20, WORLD.width - 40, WORLD.height - 40, 36);
          floor.fillStyle(0xfff5ef).fillRoundedRect(44, 44, WORLD.width - 88, WORLD.height - 88, 22);
          floor.lineStyle(1, 0xe6d8d2, .6);
          for (let x = 65; x < WORLD.width - 44; x += 80) floor.lineBetween(x, 44, x, WORLD.height - 44);
          for (let y = 44; y < WORLD.height - 44; y += 120) floor.lineBetween(44, y, WORLD.width - 44, y);
          floor.fillStyle(0xe9dfe5, .55).fillEllipse(685, 525, 560, 260);
          for (const box of WORLD.furniture) {
            const art = this.add.graphics().setDepth(box.y + box.height);
            art.fillStyle(0x8d7480, .12).fillRoundedRect(box.x + 5, box.y + 8, box.width, box.height, 16);
            art.fillStyle(box.kind === 'sofa' ? 0xdc96ae : box.kind === 'plant' ? 0x9bbba5 : 0xd4b7a6).fillRoundedRect(box.x, box.y, box.width, box.height, 16);
            art.lineStyle(3, 0x9f8790, .35).strokeRoundedRect(box.x, box.y, box.width, box.height, 16);
            if (box.kind === 'sofa') { art.fillStyle(0xefb9c8).fillRoundedRect(box.x + 24, box.y + 30, 78, 57, 12).fillRoundedRect(box.x + 116, box.y + 30, 78, 57, 12); }
            if (box.kind === 'plant') art.fillStyle(0x668875).fillCircle(box.x + 35, box.y + 30, 25).fillCircle(box.x + 70, box.y + 28, 27).fillCircle(box.x + 56, box.y + 57, 28);
          }
          }
          this.cameras.main.setBounds(0, 0, geometry.width, geometry.height);
          const self=controller.view().actors.find(actor=>actor.local);
          if(self)this.cameras.main.centerOn(self.point.x,self.point.y);
          if (this.input.keyboard) this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,ESC') as typeof this.keys;
          this.game.events.on(Phaser.Core.Events.BLUR, this.clearInput, this);
          this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off(Phaser.Core.Events.BLUR, this.clearInput, this));
        }
        private clearInput() { input.current = { x: 0, y: 0 }; this.input.keyboard?.resetKeys(); }
        private paint(actor: Actor, time: number, pose?:string) {
          let drawing = this.drawings.get(actor.id);
          if (!drawing) {
            const art = this.add.graphics(); const label = this.add.text(0, -70, actor.name, { fontFamily: 'system-ui', fontSize: '15px', color: '#554451', backgroundColor: '#fff9fa', padding: { x: 8, y: 4 } }).setOrigin(.5);
            const body = this.add.container(actor.point.x, actor.point.y, [art, label]);
            drawing = { body, art, label }; this.drawings.set(actor.id, drawing);
          }
          const { body, art, label } = drawing;
          art.setRotation(pose==='Sleep'?-Math.PI/2:0).setScale(pose==='Sit'?.9:1);
          const bob = actor.animation === 'walk' && !settingsRef.current.reducedMotion ? Math.sin(time / 90) * 2 : 0;
          body.setPosition(actor.point.x, actor.point.y).setDepth(actor.point.y).setAlpha(actor.online ? 1 : .45);
          label.setText(actor.name + (actor.away ? ' · Away' : !actor.online ? ' · Offline' : '')).setVisible(settingsRef.current.nameTags);
          art.clear(); art.fillStyle(0x61475c, .14).fillEllipse(0, 0, 34, 13);
          art.fillStyle(actor.seat === 1 ? 0xdc96ae : 0x9bbbd0).fillRoundedRect(-13, -29 + bob, 26, 29, 10);
          art.fillStyle(0x66515c).fillRoundedRect(-12, -5 + bob, 10, 9, 4).fillRoundedRect(2, -5 - bob, 10, 9, 4);
          art.fillStyle(0xf1d2bc).fillCircle(0, -45 + bob, 20);
          art.fillStyle(actor.seat === 1 ? 0x69515c : 0x85654f).fillRoundedRect(-20, -64 + bob, 40, 17, 10);
          if (actor.direction !== 'up') {
            const offset = actor.direction === 'left' ? -5 : actor.direction === 'right' ? 5 : 0;
            art.fillStyle(0x493d47).fillCircle(-7 + offset, -44 + bob, 2).fillCircle(7 + offset, -44 + bob, 2);
            art.lineStyle(1.5, 0xb67d7c).lineBetween(-3 + offset, -35 + bob, 3 + offset, -35 + bob);
          }
        }
        update(time: number, delta: number) {
          const blocked = openRef.current || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName ?? '');
          const down = (key: string) => !blocked && this.keys?.[key]?.isDown ? 1 : 0;
          const keyboard = { x: down('D') + down('RIGHT') - down('A') - down('LEFT'), y: down('S') + down('DOWN') - down('W') - down('UP') };
          controller.tick(blocked ? { x: 0, y: 0 } : keyboard.x || keyboard.y ? keyboard : input.current, this.game.loop.rawDelta / 1000, performance.now());
          if (!blocked && ((this.keys?.E && Phaser.Input.Keyboard.JustDown(this.keys.E))||(this.keys?.SPACE&&Phaser.Input.Keyboard.JustDown(this.keys.SPACE))))interactRef.current();
          if(!blocked&&this.keys?.ESC&&Phaser.Input.Keyboard.JustDown(this.keys.ESC))void controller.cancelInteraction().catch(error=>showInteractionHint(error.message));
          const current = controller.view(); const ids = new Set(current.actors.map(actor => actor.id));
          for (const [id, drawing] of this.drawings) if (!ids.has(id)) { drawing.body.destroy(); this.drawings.delete(id); }
          const actors=current.actors.map(actor=>{const occupied=current.world?.slots.find(slot=>slot.user_id===actor.id);const anchor=occupied&&cottageInteractions.find(o=>o.id===occupied.object_id)?.slots.find(s=>s.id===occupied.slot_id);return anchor?{...actor,point:{x:anchor.x,y:anchor.y},direction:anchor.facing as Actor['direction'],animation:'idle' as const}:actor;});
          for (const actor of actors){const occupied=current.world?.slots.find(s=>s.user_id===actor.id);this.paint(actor,time,occupied?cottageInteractions.find(o=>o.id===occupied.object_id)?.label:undefined);}
          this.cottageArt?.update(actors,targetRef.current??null,current.world);
          const self = actors.find(actor => actor.local);
          if (self) { const camera = this.cameras.main; const blend = settingsRef.current.reducedMotion ? 1 : 1 - Math.exp(-delta / 1000 * 8); camera.scrollX += (self.point.x - camera.width / 2 - camera.scrollX) * blend; camera.scrollY += (self.point.y - camera.height / 2 - camera.scrollY) * blend; }
          if (time - this.lastArrow > 200) {
            this.lastArrow = time; const partner = actors.find(actor => !actor.local); const camera = this.cameras.main;
            const visible = partner && partner.point.x > camera.scrollX + 45 && partner.point.x < camera.scrollX + camera.width - 45 && partner.point.y > camera.scrollY + 65 && partner.point.y < camera.scrollY + camera.height - 45;
            setArrow(partner && self && !visible ? { angle: Math.atan2(partner.point.y - self.point.y, partner.point.x - self.point.x) * 180 / Math.PI, name: partner.name } : null);
          }
        }
      }
      game = new Phaser.Game({ type: Phaser.AUTO, parent: host.current, backgroundColor: '#f8f0f2', width: host.current.clientWidth, height: host.current.clientHeight, scale: { mode: Phaser.Scale.RESIZE }, scene: HouseScene, audio: { noAudio: true }, input: { keyboard: { capture: [] }, touch: { capture: false } } });
    }).catch(() => { if (!cancelled) setHint('The room could not load. Go back and try again.'); });
    return () => { cancelled = true; input.current = { x: 0, y: 0 }; stopView(); game?.destroy(true); runtime.current = null; void controller.dispose(); };
  }, [client, api]);
  const updateSettings = (value: Settings) => { setSettings(value); void saveSettings(value); };
  const self = view?.actors.find(actor => actor.local); const partner = view?.actors.find(actor => !actor.local);
  const cottage=snapshot.house.map_id==='cottage-v1';
  const target=cottage&&self?nearestInteraction(self.point,targetRef.current):null;
  targetRef.current=target?.id;
  const occupied=view?.world?.slots.find(slot=>slot.user_id===snapshot.user_id&&slot.session_id===view.sessionId);
  interactRef.current=()=>{if(occupied)void runtime.current?.cancelInteraction().catch(error=>showInteractionHint(error.message));else if(target)void runtime.current?.interact(target).catch(error=>showInteractionHint(error.message));else showInteractionHint();};
  const room=cottage&&self?roomAt(self.point):'';
  useEffect(()=>{if(!room)return;setRoomToast(roomLabel(room));if(roomTimer.current!==null)clearTimeout(roomTimer.current);roomTimer.current=setTimeout(()=>setRoomToast(''),2200);},[room]);
  const resetStick = () => { input.current = { x: 0, y: 0 }; setKnob({ x: 0, y: 0 }); };
  return <main className={`world ${cottage?'cottage-world':''}`} data-testid="world" data-room={room} data-self-x={self?.point.x.toFixed(1)} data-self-y={self?.point.y.toFixed(1)} data-partner-x={partner?.point.x.toFixed(1)} data-partner-y={partner?.point.y.toFixed(1)} data-sent={view?.sent} data-received={view?.received} data-taken-over={view?.takenOver}>
    <div className="world-canvas" ref={host} aria-label={cottage?'Shared five-room home':'Shared home movement room'} role="img" />
    <button className="settings-icon" aria-label="Settings" onClick={() => { resetStick(); setOpen(true); }}>⚙</button>
    {cottage&&<button className="minimap-icon" aria-label="Map" aria-expanded={minimap} onClick={()=>setMinimap(!minimap)}>⌑</button>}
    {roomToast&&<div className="room-toast" role="status">{roomToast}</div>}
    {cottage&&minimap&&<svg className="minimap" role="img" aria-label="House map with player locations" viewBox={`0 0 ${COTTAGE.width} ${COTTAGE.height}`}>
      {cottageRooms.map(r=><g key={r.name}><rect x={r.x} y={r.y} width={r.width} height={r.height} fill={r.name==='hall'?'#fff9fa':'#eedfe5'} stroke="#b69da9" strokeWidth="10"/><text x={r.x+r.width/2} y={r.y+r.height/2} textAnchor="middle" fontSize={r.name==='hall'?26:64} fill="#342e39">{roomLabel(r.name)}</text></g>)}
      {cottageFurniture.map(f=><rect key={f.name} x={f.x} y={f.y} width={f.width} height={f.height} rx="8" fill="#9bbbd0" opacity=".6"/>)}
      {view?.actors.filter(a=>a.online).map(a=><circle key={a.id} cx={a.point.x} cy={a.point.y} r="28" fill={a.local?'#dc96ae':'#416c60'} stroke="#fff" strokeWidth="8"/>)}
    </svg>}
    <span className={`connection ${view?.ready ? 'connected' : view?.connection}`} role="status">{view?.ready || view?.takenOver ? 'Connected' : view?.message ? 'Offline' : 'Reconnecting…'}</span>
    {arrow && <div className="partner-cue"><span style={{ transform: `rotate(${arrow.angle}deg)` }}>➜</span>{arrow.name}</div>}
    <div className="joystick" style={{ width: settings.joystickSize, height: settings.joystickSize }} role="button" tabIndex={0} aria-label="Move" onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={event => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return; const box = event.currentTarget.getBoundingClientRect(); const radius = box.width * .32;
      let x = (event.clientX - box.left - box.width / 2) / radius; let y = (event.clientY - box.top - box.height / 2) / radius; const length = Math.hypot(x, y); if (length > 1) { x /= length; y /= length; }
      input.current = length < .15 ? { x: 0, y: 0 } : { x, y }; setKnob({ x: x * radius, y: y * radius });
    }} onPointerUp={resetStick} onPointerCancel={resetStick} onLostPointerCapture={resetStick} onBlur={resetStick}><span style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} /></div>
    <button className="interact" disabled={view?.interacting||(cottage&&!view?.ready)} onClick={()=>interactRef.current()}>{occupied?'Leave':target?.label??'Interact'}</button>
    <div className="world-message" role="status">{view?.takenOver ? <>Playing on another device. <button onClick={() => void runtime.current?.takeControl().catch(error => setHint(error.message))}>Play here</button></> : view?.message || hint}</div>
    {view?.connection === 'error' && <button className="reconnect" onClick={() => void runtime.current?.reconnect()}>Reconnect</button>}
    {!rotateAcknowledged && <div className="rotate-hint">Turn your phone sideways for more room.<button onClick={() => setRotateAcknowledged(true)}>Ready</button></div>}
    {open && <div className="modal-backdrop"><section ref={dialog} tabIndex={-1} className="settings-dialog" role="dialog" aria-modal="true" aria-label="Settings" onKeyDown={event=>{
      if(event.key==='Escape'){setOpen(false);return;}
      if(event.key!=='Tab')return;
      const controls=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button,input,select'));
      const first=controls[0],last=controls.at(-1);
      if(event.shiftKey&&(document.activeElement===first||document.activeElement===event.currentTarget)){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }}><h2>Settings</h2><label><input type="checkbox" checked={settings.nameTags} onChange={event => updateSettings({ ...settings, nameTags: event.target.checked })} /> Names</label><label><input type="checkbox" checked={settings.reducedMotion} onChange={event => updateSettings({ ...settings, reducedMotion: event.target.checked })} /> Reduced motion</label><label>Control size<select value={settings.joystickSize} onChange={event => updateSettings({ ...settings, joystickSize: Number(event.target.value) })}><option value={96}>Small</option><option value={116}>Medium</option><option value={136}>Large</option></select></label><div className="actions"><button onClick={() => setOpen(false)}>Back</button><button onClick={onBack}>{snapshot.status === 'pending' ? 'Invite partner' : 'Home'}</button><button onClick={() => { setOpen(false); void runtime.current?.reconnect(); }}>Reconnect</button><button onClick={() => void onLogout()}>Sign out</button></div></section></div>}
  </main>;
}
