import map from './maps/cottage-v1.json' with { type: 'json' };
import type { Point } from './house';

export type MapObject = { name: string; type: string; x: number; y: number; width: number; height: number; properties?: { name: string; value: unknown }[] };
export const mapObjects = (name: string): MapObject[] => (map.layers.find(layer => layer.name === name)?.objects ?? []) as MapObject[];
export const mapProperties = (object: MapObject): Record<string, unknown> => Object.fromEntries((object.properties ?? []).map(property => [property.name, property.value]));
export const COTTAGE = { width: map.width * 32, height: map.height * 32, margin: 0, radius: 12, speed: 132, furniture: mapObjects('Collision').map(o => ({ ...o, kind: o.type })) };
export const cottageRooms = mapObjects('Rooms');
export const cottageFurniture = mapObjects('Furniture');
export const cottageDoors = mapObjects('Doors');
export const cottageDecorations = mapObjects('Decorations');
export const cottageInteractions = mapObjects('Interactions').map(o => {
 const p = mapProperties(o);
 return { id: o.name, type: o.type, room: String(p.room_id), point: { x: o.x + o.width / 2, y: o.y + o.height / 2 }, radius: Number(p.interact_radius), label: String(p.label), mode: String(p.mode), slots: mapObjects('Slots').filter(s => mapProperties(s).object_id === o.name).map(s => ({ id: String(mapProperties(s).slot_id), x: s.x, y: s.y, facing: String(mapProperties(s).facing) })) };
});
export type CottageInteraction = typeof cottageInteractions[number];
export const cottageSpawn = (seat: number): Point => { const point = mapObjects('Spawns').find(o => o.name === (seat === 1 ? 'partner-a' : 'partner-b'))!; return { x: point.x, y: point.y }; };
export const roomAt = (point: Point): string => cottageRooms.find(room => point.x >= room.x && point.x <= room.x + room.width && point.y >= room.y && point.y <= room.y + room.height)?.name ?? 'hall';
export const roomLabel = (id: string): string => String(mapProperties(cottageRooms.find(room => room.name === id) ?? cottageRooms[4]!).label);
export function nearestInteraction(point: Point, previous?: string): CottageInteraction | null {
 const candidates = cottageInteractions.filter(item => Math.hypot(item.point.x - point.x, item.point.y - point.y) <= item.radius).sort((a,b) => Math.hypot(a.point.x - point.x,a.point.y - point.y) - Math.hypot(b.point.x - point.x,b.point.y - point.y));
 const stable = candidates.find(item => item.id === previous);
 if(stable && candidates[0] && Math.hypot(stable.point.x-point.x,stable.point.y-point.y) <= Math.hypot(candidates[0].point.x-point.x,candidates[0].point.y-point.y)+12) return stable;
 return candidates[0] ?? null;
}
