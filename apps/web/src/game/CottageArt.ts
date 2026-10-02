import type Phaser from 'phaser';
import { cottageRooms, cottageFurniture, cottageDoors, cottageDecorations, mapObjects } from '@paw/shared';
import type { Actor } from './HouseRuntime';
import type { WorldState } from '@paw/shared';

const colors={rose:0xdc96ae,sky:0x9bbbd0,wood:0xd4b6a0,dark:0x725e6b,cream:0xfff9fa,gold:0xd9b875,green:0x77988a};
export class CottageArt {
 private doors: {object: typeof cottageDoors[number]; art: Phaser.GameObjects.Graphics}[]=[];
 private walls: {object: typeof cottageDoors[number]; art: Phaser.GameObjects.Graphics}[]=[];
 private outline: Phaser.GameObjects.Graphics;
 private toggles: {object: typeof cottageFurniture[number];art:Phaser.GameObjects.Graphics}[]=[];
 constructor(scene: Phaser.Scene,onTap:(id:string)=>void){
  const floor=scene.add.graphics().setDepth(-1000);
  for(const room of cottageRooms){
   const fill=room.name==='bedroom'?0xe7edf3:room.name==='bathroom'?0xf3dce4:room.name==='hall'?0xfff4ed:0xf1e3d0;
   floor.fillStyle(fill).fillRect(room.x,room.y,room.width,room.height);
   floor.lineStyle(1,0xa88881,.12);
   for(let y=room.y;y<room.y+room.height;y+=32){floor.lineBetween(room.x,y,room.x+room.width,y);if(room.name==='bathroom')for(let x=room.x;x<room.x+room.width;x+=32)floor.lineBetween(x,y,x,y+32);else for(let x=room.x+(y/32%2?48:0);x<room.x+room.width;x+=96)floor.lineBetween(x,y,x,y+32);}
  }
  for(const d of cottageDecorations){
   const g=scene.add.graphics().setDepth(d.type==='rug'||d.type==='mat'?-900:d.y+d.height);
   if(d.type==='rug'||d.type==='mat'){g.fillStyle(d.type==='rug'?0xe9d0d9:0x9bbbd0,.7).fillRoundedRect(d.x,d.y,d.width,d.height,22);g.lineStyle(3,colors.cream,.6).strokeRoundedRect(d.x+9,d.y+9,d.width-18,d.height-18,16);}
   else if(d.type==='window'){g.fillStyle(colors.sky).fillRoundedRect(d.x,d.y,d.width+12,d.height,4);g.lineStyle(3,colors.cream).lineBetween(d.x,d.y+d.height/2,d.x+12,d.y+d.height/2);}
   else if(d.type==='plush'){g.fillStyle(colors.rose).fillCircle(d.x+18,d.y+23,18).fillCircle(d.x+6,d.y+7,8).fillCircle(d.x+30,d.y+7,8);g.fillStyle(colors.dark).fillCircle(d.x+12,d.y+22,2).fillCircle(d.x+24,d.y+22,2);}
   else {g.fillStyle(d.type==='cabinet'?colors.wood:colors.gold).fillRoundedRect(d.x,d.y,Math.max(12,d.width),Math.max(12,d.height),4);g.lineStyle(2,colors.dark,.4).strokeRoundedRect(d.x,d.y,Math.max(12,d.width),Math.max(12,d.height),4);}
  }
  for(const b of cottageFurniture){
   const g=scene.add.graphics().setDepth(b.y+b.height);const {x,y,width:w,height:h}=b;
   g.fillStyle(colors.dark,.13).fillRoundedRect(x+5,y+8,w,h,12);
   const fill=b.type==='sofa'?colors.rose:b.type==='bed'||b.type==='shower'?colors.sky:['fridge','sink','toilet','stove','mirror'].includes(b.type)?colors.cream:colors.wood;
   g.fillStyle(fill).fillRoundedRect(x,y,w,h,10);g.lineStyle(2,colors.dark,.4).strokeRoundedRect(x,y,w,h,10);
   const inset=(color:number,xx:number,yy:number,ww:number,hh:number,r=6)=>g.fillStyle(color).fillRoundedRect(xx,yy,ww,hh,r);
   switch(b.type){
    case 'sofa':inset(0xb87994,x,y,w,19);inset(0xefb6c9,x+15,y+27,w/2-20,h-36);inset(colors.sky,x+w/2+5,y+27,w/2-20,h-36);inset(0xc3849f,x,y+18,12,h-18);inset(0xc3849f,x+w-12,y+18,12,h-18);break;
    case 'bed':inset(colors.wood,x-2,y-8,w+4,25);inset(colors.cream,x+9,y+12,w/2-14,35);inset(colors.cream,x+w/2+5,y+12,w/2-14,35);inset(0xaac4d6,x+7,y+57,w-14,h-65);g.lineStyle(3,0xdce5ef).lineBetween(x+8,y+78,x+w-8,y+78);break;
    case 'fridge':g.lineStyle(2,colors.dark,.35).lineBetween(x+4,y+44,x+w-4,y+44);inset(colors.dark,x+w-14,y+54,4,23,2);inset(colors.gold,x+12,y+12,17,18,3);break;
    case 'stove':for(const dx of [w*.28,w*.72])for(const dy of [h*.28,h*.7]){g.fillStyle(colors.dark).fillCircle(x+dx,y+dy,12);g.lineStyle(2,0xc9b8bf).strokeCircle(x+dx,y+dy,7);}break;
    case 'sink':inset(colors.sky,x+12,y+12,w-24,h-20,10);g.lineStyle(5,0x9b95a4).lineBetween(x+w/2,y+7,x+w/2,y+22);g.fillStyle(0xf0f8fc).fillCircle(x+w/2,y+h/2,4);break;
    case 'island':inset(colors.cream,x+5,y+5,w-10,h-10);inset(colors.wood,x+15,y+22,50,48);g.fillStyle(colors.green).fillCircle(x+w-35,y+35,12);break;
    case 'dining':case 'coffee-table':g.lineStyle(2,0x9d7d68,.25).lineBetween(x+8,y+h/2,x+w-8,y+h/2);g.fillStyle(colors.cream).fillCircle(x+w/2,y+h/2,14);g.fillStyle(colors.green).fillCircle(x+w/2,y+h/2-6,7);break;
    case 'arcade':inset(0x6d7a9a,x+5,y+7,w-10,h-14);inset(0xe9d7df,x+10,y+13,w-20,14);inset(0x384959,x+13,y+34,w-26,49);g.fillStyle(colors.sky).fillCircle(x+w/2,y+55,10);inset(colors.rose,x+10,y+89,w-20,24);g.fillStyle(colors.gold).fillCircle(x+22,y+100,4).fillCircle(x+w-22,y+100,4);break;
    case 'tv':inset(0x455261,x+5,y+3,w-10,h-6,4);g.lineStyle(2,colors.sky,.4).lineBetween(x+20,y+8,x+w-22,y+h-6);break;
    case 'wardrobe':g.lineStyle(2,colors.dark,.3).lineBetween(x+w/2,y+6,x+w/2,y+h-6);g.fillStyle(colors.gold).fillCircle(x+w/2-7,y+h/2,3).fillCircle(x+w/2+7,y+h/2,3);break;
    case 'bookshelf':case 'shelf':for(let row=0;row<3;row++){g.lineStyle(3,0x9d7d68).lineBetween(x+4,y+h*(row+1)/3-3,x+w-4,y+h*(row+1)/3-3);for(let col=0;col<4;col++)inset(col%2?colors.rose:colors.sky,x+6+col*(w-12)/4,y+5+row*h/3,(w-16)/4,h/3-11,2);}break;
    case 'lamp':g.fillStyle(colors.gold,.15).fillCircle(x+w/2,y+h/2,40);g.fillStyle(colors.gold).fillCircle(x+w/2,y+h/2,19);g.fillStyle(colors.cream).fillCircle(x+w/2,y+h/2,10);break;
    case 'mirror':inset(colors.sky,x+4,y+5,w-8,h-10,8);g.lineStyle(2,colors.cream).lineBetween(x+8,y+h*.65,x+w-7,y+h*.3);break;
    case 'plant':g.fillStyle(0xb48878).fillEllipse(x+w/2,y+h*.75,w*.7,h*.35);g.fillStyle(colors.green).fillCircle(x+w*.3,y+h*.35,20).fillCircle(x+w*.7,y+h*.3,21).fillCircle(x+w*.5,y+h*.58,18);break;
    case 'shower':inset(0xdfeef2,x+8,y+8,w-16,h-16);g.lineStyle(2,0x85a4b6).strokeRoundedRect(x+15,y+15,w-30,h-30,8);for(let dx=10;dx<w-10;dx+=20)inset(colors.rose,x+dx,y+h-32,12,29,4);g.fillStyle(colors.dark).fillCircle(x+w/2,y+25,7);break;
    case 'toilet':inset(0xe5dbe1,x+8,y+6,w-16,25);g.fillStyle(0xcacbd6).fillEllipse(x+w/2,y+h*.64,w-20,h*.45);g.fillStyle(colors.cream).fillEllipse(x+w/2,y+h*.64,w-30,h*.3);break;
    case 'laundry':case 'trash':g.lineStyle(3,colors.dark,.25).lineBetween(x+7,y+10,x+w-7,y+10);inset(colors.rose,x+10,y+16,w-20,h-26);break;
   }
   if(['fridge','lamp','tv','toilet'].includes(b.type))this.toggles.push({object:b,art:scene.add.graphics().setDepth(b.y+b.height+1)});
   scene.add.zone(x+w/2,y+h/2,w,h).setInteractive().on('pointerdown',()=>onTap(b.name));
  }
  for(const object of mapObjects('Walls')){const art=scene.add.graphics().setDepth(object.y+object.height);art.fillStyle(0xb69da9).fillRect(object.x,object.y,object.width,object.height);art.fillStyle(0xe0cdd5).fillRect(object.x,object.y,object.width,8);this.walls.push({object,art});}
  for(const object of cottageDoors)this.doors.push({object,art:scene.add.graphics().setDepth(object.y+object.height)});
  this.outline=scene.add.graphics().setDepth(5000);
 }
 update(actors: Actor[], target: string|null,state:WorldState|null){
  for(const {object:b,art} of this.toggles){art.clear();const enabled=state?.states.some(s=>s.object_id===b.name&&s.enabled);if(enabled){if(b.type==='lamp')art.fillStyle(colors.gold,.18).fillCircle(b.x+b.width/2,b.y+b.height/2,64);else if(b.type==='tv')art.fillStyle(colors.sky,.9).fillRoundedRect(b.x+8,b.y+5,b.width-16,b.height-10,3);else if(b.type==='fridge')art.fillStyle(0xe9eef2).fillRoundedRect(b.x+8,b.y+8,b.width-16,b.height-16,6).lineStyle(3,colors.dark,.4).lineBetween(b.x+b.width,b.y+10,b.x+b.width+16,b.y+28);else art.fillStyle(colors.sky,.5).fillEllipse(b.x+b.width/2,b.y+b.height*.64,b.width-30,b.height*.3);}}
  for(const {object:d,art} of this.doors){const near=actors.some(a=>a.online&&!a.away&&Math.hypot(a.point.x-(d.x+d.width/2),a.point.y-(d.y+d.height/2))<112);art.clear();art.fillStyle(0xbe9a85);if(near)art.fillRoundedRect(d.x,d.y,Math.min(d.width,8),Math.min(d.height,8),2);else art.fillRoundedRect(d.x+4,d.y+4,d.width-8,d.height-8,4);}
  for(const {object:w,art} of this.walls)art.setAlpha(actors.some(a=>a.point.x>w.x-25&&a.point.x<w.x+w.width+25&&a.point.y>w.y-65&&a.point.y<w.y+w.height+12)?.45:1);
  this.outline.clear();const object=cottageFurniture.find(o=>o.name===target);if(object)this.outline.lineStyle(3,colors.gold,.95).strokeRoundedRect(object.x-4,object.y-4,object.width+8,object.height+8,12);
 }
}
