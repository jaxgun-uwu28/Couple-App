import {readFile,writeFile} from 'node:fs/promises';
const map=JSON.parse(await readFile('packages/shared/src/maps/cottage-v1.json','utf8'));
const props=o=>Object.fromEntries((o.properties??[]).map(p=>[p.name,p.value]));
const slots=map.layers.find(l=>l.name==='Slots').objects;
const values=map.layers.find(l=>l.name==='Interactions').objects.map(o=>{
 const p=props(o),action=['Sit','Sleep'].includes(p.label)?'slot':['fridge','lamp','tv','toilet'].includes(o.type)?'toggle':'future';
 const anchors=slots.filter(s=>props(s).object_id===o.name).map(s=>({id:props(s).slot_id,x:s.x,y:s.y,facing:props(s).facing}));
 return `('${o.name}','${o.type}',${o.x+o.width/2},${o.y+o.height/2},${p.interact_radius},'${action}','${JSON.stringify(anchors)}'::jsonb)`;
});
const file='supabase/migrations/20261003000100_phase2_house_world.sql';
const sql=await readFile(file,'utf8');await writeFile(file,sql.replace(/-- BEGIN MAP CATALOG[\s\S]*?-- END MAP CATALOG/,`-- BEGIN MAP CATALOG\ninsert into public.house_object_catalog(id,kind,x,y,radius,action,slots) values\n${values.join(',\n')};\n-- END MAP CATALOG`));
console.log(`Exported ${values.length} authoritative interaction definitions.`);
