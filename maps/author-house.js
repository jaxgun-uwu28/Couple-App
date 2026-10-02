// Run INSIDE official Tiled: tiled --evaluate maps/author-house.js <repo-root>
// Geometry A approved 2026-10-03. No application integration precedes this source.
var root = tiled.scriptArguments[0];
if (!root) throw new Error('Pass repository root');
var map = new TileMap(); map.width=64; map.height=44; map.tileWidth=32; map.tileHeight=32;
map.orientation=TileMap.Orthogonal; map.renderOrder=TileMap.RightDown;
map.layerDataFormat=TileMap.CSV;
map.setProperties({map_id:'cottage-v1',layout_version:2,approved_spacing:'A',hall_clear_tiles:4,door_clear_tiles:3});
var groups={};
['Rooms','Walls','Doors','Furniture','Decorations','Interactions','Slots','Spawns','Collision'].forEach(function(name){var layer=new ObjectGroup(name);map.addLayer(layer);groups[name]=layer;});
function object(layer,id,type,x,y,w,h,props){var o=new MapObject(id);o.className=type;o.x=x*32;o.y=y*32;o.width=w*32;o.height=h*32;o.setProperties(props||{});groups[layer].addObject(o);return o;}
function wall(id,x,y,w,h){object('Walls',id,'wall',x,y,w,h);object('Collision',id,'wall',x,y,w,h);}
var rooms=[['kitchen','Kitchen',1,1,28,21],['bedroom','Bedroom',35,1,28,21],['living','Living Room',1,23,28,20],['bathroom','Bathroom',35,23,28,20],['hall','Hall',30,1,4,42]];
rooms.forEach(function(r){object('Rooms',r[0],'room',r[2],r[3],r[4],r[5],{label:r[1]});});
wall('north',0,0,64,1);wall('south',0,43,64,1);wall('west',0,1,1,42);wall('east',63,1,1,42);
[29,34].forEach(function(x){wall('hall-'+x+'-a',x,1,1,8);wall('hall-'+x+'-b',x,12,1,17);wall('hall-'+x+'-c',x,32,1,11);});
wall('left-middle-a',1,22,10,1);wall('left-middle-b',14,22,15,1);wall('right-middle-a',35,22,12,1);wall('right-middle-b',50,22,13,1);
[[29,9,1,3],[34,9,1,3],[29,29,1,3],[34,29,1,3],[11,22,3,1],[47,22,3,1]].forEach(function(d,i){object('Doors','door-'+i,'door',d[0],d[1],d[2],d[3],{clear_tiles:3,proximity_px:112});});
function item(id,type,room,x,y,w,h,verb,ax,ay,slots,mode){
 object('Furniture',id,type,x,y,w,h,{room_id:room,interaction:verb||'',mode:mode||'solo',slots:slots?slots.length:0});
 object('Collision',id,type,x,y,w,h);
 if(verb){object('Interactions',id,type,ax-.25,ay-.25,.5,.5,{room_id:room,label:verb,object_id:id,interact_radius:80,mode:mode||'solo'});}
 (slots||[]).forEach(function(s,i){object('Slots',id+'-'+i,'slot',s[0],s[1],0,0,{object_id:id,slot_id:String(i),facing:s[2],approach_x:ax*32,approach_y:ay*32});});
}
item('fridge','fridge','kitchen',3,3,3,4,'Open',4.5,8);
item('stove','stove','kitchen',8,3,3,3,'Cook',9.5,7);
item('kitchen-sink','sink','kitchen',13,3,3,3,'Clean',14.5,7);
item('counter','counter','kitchen',18,3,5,2);
item('island','island','kitchen',8,10,7,4,'Cook',11.5,15,[[11.5,9,'down'],[11.5,15,'up']],'either');
item('dining','dining','kitchen',19,10,4,5,'Sit',21,16,[[18,12,'right'],[24,12,'left']],'either');
item('trash','trash','kitchen',3,17,1.5,2,'Clean',5.5,18);
item('sofa','sofa','living',4,33,8,3,'Sit',8,37.5,[[6,35,'down'],[10,35,'down']],'either');
item('tv','tv','living',4,24,8,1,'Open',8,26);
item('coffee-table','coffee-table','living',5,29,6,3);
item('arcade','arcade','living',18,26,3,4,'Play',19.5,31);
item('arcade-stool-a','stool','living',18,33,1.5,1.5);
item('arcade-stool-b','stool','living',21,33,1.5,1.5);
item('living-shelf','shelf','living',23,36,2,4);
item('plant','plant','living',3,39,2,2);
item('bed','bed','bedroom',44,6,7,7,'Sleep',47.5,14.5,[[46,10,'down'],[49,10,'down']],'either');
item('wardrobe','wardrobe','bedroom',55,3,2,7,'Change Clothes',53.5,6.5);
item('bookshelf','bookshelf','bedroom',37,3,4,1.5);
item('bedroom-lamp','lamp','bedroom',40,6,1.5,1.5,'Open',40.5,8.5);
item('bedroom-mirror','mirror','bedroom',56,12,1,3,'Open',54.5,13.5);
item('bath-sink','sink','bathroom',37,25,4,2,'Clean',39,28);
item('toilet','toilet','bathroom',45,25,2,3,'Open',46,29);
item('shower','shower','bathroom',50,25,6,6,'Clean',53,32.5);
item('laundry','laundry','bathroom',50,35,2,2,'Clean',51,38);
[['kitchen','cabinet',24,3,3,2],['living','window',2,27,0.25,5],['living','poster',18,24,3,.25],['living','rug',3,28,10,10],['bedroom','photo',38,1.25,2,.5],['bedroom','plush',51,15,1.5,1.5],['bathroom','mirror',37,24,4,.5],['bathroom','mat',49,31.5,8,2]].forEach(function(d,i){object('Decorations',d[0]+'-decor-'+i,d[1],d[2],d[3],d[4],d[5],{room_id:d[0]});});
var spawnPoints=[['kitchen',25,18],['bedroom',38,18],['living',26.5,39],['bathroom',38,39],['hall',31,39]];
spawnPoints.forEach(function(s){object('Spawns',s[0]+'-player','player-spawn',s[1],s[2],0,0,{room_id:s[0]});object('Spawns',s[0]+'-pet','pet-spawn',s[1]+1,s[2],0,0,{room_id:s[0]});});
object('Spawns','partner-a','player-spawn',31,35,0,0,{seat:1,room_id:'hall'});object('Spawns','partner-b','player-spawn',33,35,0,0,{seat:2,room_id:'hall'});
// Paint navigation tiles from actual collision footprints. Doors are automatic.
var tiles=new Tileset('navigation');tiles.tileWidth=32;tiles.tileHeight=32;tiles.imageFileName=root+'/maps/navigation.png';map.addTileset(tiles);
var nav=new TileLayer('Navigation');nav.width=64;nav.height=44;nav.visible=false;map.addLayer(nav);var edit=nav.edit();
for(var y=0;y<44;y++)for(var x=0;x<64;x++){var px=x*32+16,py=y*32+16;var blocked=groups.Collision.objects.some(function(b){return px>b.x-12&&px<b.x+b.width+12&&py>b.y-12&&py<b.y+b.height+12;});if(!blocked)edit.setTile(x,y,tiles.tile(0));}edit.apply();
var source=root+'/maps/cottage-v1.tmx',output=root+'/packages/shared/src/maps/cottage-v1.json';
tiled.mapFormat('tmx').write(map,source);tiled.mapFormat('json').write(map,output);
tiled.log('Authored '+source+' and '+output+' in Tiled '+tiled.version);
