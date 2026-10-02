import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

// Review diagrams only. These are not playable maps or production assets.
const variants = [
  { key: 'A', title: 'Balanced cottage', w: 64, h: 44, hall: 4, door: 3, note: 'Recommended · clear paths and a cozy room scale' },
  { key: 'B', title: 'Compact cottage', w: 56, h: 40, hall: 3, door: 2, note: 'Shorter walks · tighter furniture clearances' },
  { key: 'C', title: 'Spacious cottage', w: 72, h: 48, hall: 5, door: 4, note: 'More passing space · longer walks between objects' },
];
const scale = 6.8;
const colors = { wall: '#9f8790', wood: '#e6cbb5', rose: '#dc96ae', sky: '#9bbbd0', green: '#9bbba5' };
const rect = (x,y,w,h,color,label='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx=".6" fill="${color}" stroke="#806c77" stroke-width=".15"/>${label ? `<text x="${x+w/2}" y="${y+h/2+.5}" text-anchor="middle" font-size="1.65">${label}</text>` : ''}`;
const circle = (x,y,r,color) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" stroke="#806c77" stroke-width=".15"/>`;
function map(v) {
  const middle = Math.floor(v.h/2), hallLeft = (v.w-v.hall)/2, roomRight = hallLeft-1, right = hallLeft+v.hall+1;
  let body = rect(0,0,v.w,v.h,'#fff5ef');
  body += rect(1,1,roomRight-1,middle-1,'#f1dfcc') + rect(right,1,v.w-right-1,middle-1,'#e4e9f2');
  body += rect(1,middle+1,roomRight-1,v.h-middle-2,'#f1dfcc') + rect(right,middle+1,v.w-right-1,v.h-middle-2,'#f1d9e0');
  body += `<path d="M${v.w/2},${v.h-3} V4 M${v.w/2},10 H${roomRight-4} M${v.w/2},10 H${right+4} M${v.w/2},${middle+7} H${roomRight-4} M${v.w/2},${middle+7} H${right+4}" stroke="#fff9fa" stroke-width="1.2" stroke-dasharray="1.4 1.4" fill="none"/>`;
  // Same furniture footprints in all three options, using tile units.
  body += rect(3,3,3,4,colors.rose,'Fridge') + rect(8,3,3,3,colors.wood,'Stove') + rect(13,3,3,3,colors.sky,'Sink');
  body += rect(17,3,5,2,colors.wood,'Counter') + rect(8,10,7,4,colors.wood,'Island');
  body += circle(11.5,8.4,.5,colors.rose) + circle(11.5,15.6,.5,colors.sky);
  body += rect(19,10,4,5,colors.wood,'Dining') + rect(3,13,1.5,2,colors.wall);
  body += rect(4,middle+2,8,1.4,colors.wall,'TV') + rect(5,middle+7,6,2.5,colors.wood,'Table');
  body += rect(4,middle+11,8,3,colors.rose,'Sofa') + rect(18,middle+4,3,3.5,colors.sky,'Play');
  body += circle(18.7,middle+9,.6,colors.rose) + circle(20.3,middle+9,.6,colors.sky);
  body += rect(21,middle+13,2,3.5,colors.wood) + circle(3,middle+16,.85,colors.green);
  body += rect(right+9,6,7,7,colors.sky,'Bed') + rect(right+20,3,2,7,colors.wood);
  body += rect(right+2,3,4,1.5,colors.wood) + circle(right+6,8,.8,'#d9b875');
  body += rect(right+21,12,1,3,colors.sky) + circle(right+10,7,.55,colors.rose);
  body += rect(right+16,middle+3,6,6,colors.rose,'Shower') + rect(right+11,middle+4,2,3,'#fff9fa');
  body += rect(right+3,middle+4,4,2.5,colors.wood,'Sink') + rect(right+16,middle+13,2,2,colors.wood);
  body += `<path d="M.5,.5 H${v.w-.5} V${v.h-.5} H.5 Z M${roomRight+.5},.5 V${v.h-.5} M${right-.5},.5 V${v.h-.5} M.5,${middle+.5} H${roomRight+.5} M${right-.5},${middle+.5} H${v.w-.5}" fill="none" stroke="${colors.wall}" stroke-width="1"/>`;
  for (const x of [roomRight,right-1]) for (const y of [9,middle+6]) body += `<rect x="${x}" y="${y}" width="1" height="${v.door}" fill="#fff5ef"/>`;
  for (const x of [11,right+12]) body += `<rect x="${x}" y="${middle}" width="${v.door}" height="1" fill="#fff5ef"/>`;
  body += circle(v.w/2-.65,middle+3,.42,colors.rose) + circle(v.w/2+.65,middle+3,.42,colors.sky);
  for (const [label,x,y] of [['Kitchen',roomRight/2,middle-2],['Bedroom',(right+v.w)/2,middle-2],['Living Room',roomRight/2,v.h-3],['Bathroom',(right+v.w)/2,v.h-3]]) body += `<text x="${x}" y="${y}" text-anchor="middle" font-size="2.1" font-weight="600">${label}</text>`;
  body += `<text x="${v.w/2}" y="${v.h-6}" text-anchor="middle" font-size="1.8" transform="rotate(-90 ${v.w/2} ${v.h-6})">Hall / Entry</text>`;
  return body;
}
const cards = variants.map((v,index) => {
  const mapX = (570-v.w*scale)/2;
  return `<g transform="translate(${24+index*584},120)"><rect width="570" height="675" rx="22" fill="#fff9fa" stroke="${index===0?colors.rose:'#decfd6'}" stroke-width="${index===0?3:1}"/>
  <text x="26" y="43" font-size="25" font-weight="700">${v.key} · ${v.title}</text>
  <text x="26" y="75" font-size="17">${v.w} × ${v.h} tiles · ${v.w*32} × ${v.h*32} px</text>
  <text x="26" y="106" font-size="17">Hall ${v.hall*32}px · door openings ${v.door*32}px</text>
  <g transform="translate(${mapX},155) scale(${scale})">${map(v)}</g>
  <text x="26" y="531" font-size="16" font-weight="600">${v.note}</text>
  <text x="26" y="564" font-size="16">Same approved rooms, palette and furniture.</text>
  <text x="26" y="595" font-size="16">Arcade stays inside the living room.</text>
  <text x="26" y="626" font-size="16">Rose / sky dots: two players, shown to scale.</text></g>`;
});
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="850" viewBox="0 0 1800 850"><style>text{font-family:Segoe UI,Arial,sans-serif;fill:#342e39}</style><rect width="1800" height="850" fill="#f8f0f2"/><text x="32" y="48" font-size="30" font-weight="700">Paw &amp; Us · Phase 2 tile-spacing review</text><text x="32" y="84" font-size="19">One continuous central-hall home · same drawing scale · schematic geometry, not finished game art</text>${cards.join('')}<text x="32" y="830" font-size="16">All options retain 32px tiles, at least two-tile doorways, opposing kitchen slots, local follow camera and separate landscape HUD controls.</text></svg>`;
const svgPath = new URL('./phase-2-layout-options.svg',import.meta.url);
const pngPath = new URL('./phase-2-layout-options.png',import.meta.url);
await writeFile(svgPath,svg);
const browser = await chromium.launch();
try { const page=await browser.newPage({viewport:{width:1800,height:850},deviceScaleFactor:1});await page.setContent(`<style>body{margin:0}</style>${svg}`);await page.screenshot({path:fileURLToPath(pngPath)}); } finally { await browser.close(); }
