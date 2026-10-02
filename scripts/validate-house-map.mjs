import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const map=JSON.parse(await readFile('packages/shared/src/maps/cottage-v1.json','utf8'));
const properties=o=>Object.fromEntries((o.properties??[]).map(p=>[p.name,p.value]));
const objects=name=>map.layers.find(l=>l.name===name)?.objects??[];
assert.equal(map.width,64);assert.equal(map.height,44);assert.equal(map.tilewidth,32);assert.equal(map.tileheight,32);
assert.equal(properties(map).hall_clear_tiles,4);
const collision=objects('Collision');
const clear=(x,y)=>x>=12&&y>=12&&x<=2036&&y<=1396&&!collision.some(b=>x>b.x-12&&x<b.x+b.width+12&&y>b.y-12&&y<b.y+b.height+12);
const navigation=map.layers.find(l=>l.name==='Navigation');
assert.equal(navigation.data.length,64*44);
const cell=(x,y)=>`${Math.floor(x/32)},${Math.floor(y/32)}`;
const start=objects('Spawns').find(o=>o.name==='partner-a');
const reached=new Set([cell(start.x,start.y)]),queue=[cell(start.x,start.y)];
for(let i=0;i<queue.length;i++){
 const [x,y]=queue[i].split(',').map(Number);
 for(const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){
  const key=`${nx},${ny}`;
  if(nx<0||ny<0||nx>=64||ny>=44||reached.has(key)||!clear(nx*32+16,ny*32+16))continue;
  reached.add(key);queue.push(key);
 }
}
for(let y=0;y<44;y++)for(let x=0;x<64;x++)assert.equal(navigation.data[y*64+x]>0,clear(x*32+16,y*32+16),`navigation ${x},${y}`);
for(const o of objects('Spawns')){assert(clear(o.x,o.y),`blocked spawn ${o.name}`);assert(reached.has(cell(o.x,o.y)),`unreachable spawn ${o.name}`);}
for(const o of objects('Interactions')){
 const x=o.x+o.width/2,y=o.y+o.height/2;
 assert(clear(x,y),`blocked approach ${o.name}`);assert(reached.has(cell(x,y)),`unreachable interaction ${o.name}`);
 assert(objects('Furniture').some(f=>f.name===properties(o).object_id),`missing object ${o.name}`);
}
for(const o of objects('Slots')){
 const p=properties(o),f=objects('Furniture').find(f=>f.name===p.object_id);
 assert(f,`unknown slot parent ${o.name}`);
 assert(!collision.some(b=>b.name!==f.name&&o.x>b.x-12&&o.x<b.x+b.width+12&&o.y>b.y-12&&o.y<b.y+b.height+12),`slot hits other furniture ${o.name}`);
 assert(clear(p.approach_x,p.approach_y),`blocked slot approach ${o.name}`);
}
for(const o of objects('Doors')){
 assert.equal(Math.max(o.width,o.height),96,`door width ${o.name}`);
 assert.equal(Math.min(o.width,o.height),32);
 assert(!collision.some(b=>o.x<b.x+b.width&&o.x+o.width>b.x&&o.y<b.y+b.height&&o.y+o.height>b.y),`door intersects wall ${o.name}`);
 const x=o.x+o.width/2,y=o.y+o.height/2;
 assert(reached.has(cell(x,y)),`unreachable door ${o.name}`);
}
const required={living:['sofa','tv','coffee-table','arcade','plant','shelf'],kitchen:['fridge','stove','sink','counter','island','dining','trash'],bedroom:['bed','wardrobe','mirror','bookshelf','lamp'],bathroom:['shower','toilet','sink','laundry']};
for(const [room,types] of Object.entries(required))for(const type of types)assert(objects('Furniture').some(o=>properties(o).room_id===room&&o.type===type),`missing ${room} ${type}`);
assert.equal(objects('Rooms').length,5);
for(const layer of map.layers)if(layer.objects){const names=layer.objects.map(o=>o.name);assert.equal(new Set(names).size,names.length,`duplicate name in ${layer.name}`);for(const o of layer.objects)assert(o.x>=0&&o.y>=0&&o.x+o.width<=2048&&o.y+o.height<=1408,`bounds ${o.name}`);}
console.log(`Map validated: 5 rooms, ${objects('Doors').length} three-tile doors, ${objects('Interactions').length} reachable interactions, ${objects('Slots').length} slots, ${objects('Spawns').length} spawns, ${reached.size} connected navigation cells.`);
