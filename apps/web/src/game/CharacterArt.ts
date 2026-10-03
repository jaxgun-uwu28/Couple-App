import type {Appearance,Direction} from '@paw/shared';
import {skinTones,characterColors} from '@paw/shared';
export const characterPoses=['idle','walk0','walk1','walk2','walk3','walk4','walk5','sit','sleep','hug','cuddle','wave0','wave1','laugh0','laugh1','cry0','cry1','angry','please','clap0','clap1','dance0','dance1','love','yawn','kiss'] as const;
export type CharacterPose=typeof characterPoses[number];
export type CharacterLayer='base'|'shirt'|'pants'|'shoes'|'glasses';
export const frameWidth=96,frameHeight=128,feetAnchor=102,atlasColumns=8;
export const characterFrame=(pose:CharacterPose,direction:Direction)=>['down','up','left','right'].indexOf(direction)*characterPoses.length+characterPoses.indexOf(pose);
export function drawCharacter(ctx:CanvasRenderingContext2D,a:Appearance,layer:CharacterLayer,pose:CharacterPose='idle',direction:Direction='down'){
 ctx.save();ctx.translate(48,feetAnchor);const height=[.9,1,1.1][a.height]!,wide=[.88,1,1.14][a.body]!;ctx.scale(wide,height);
 const walk=pose.startsWith('walk')?Math.sin(Number(pose.slice(4))/6*Math.PI*2):0;
 const sit=pose==='sit'||pose==='cuddle';const bob=pose==='dance0'?-3:pose==='dance1'?1:Math.abs(walk)*1.2;
 ctx.translate(0,bob);if(pose==='sleep'){ctx.translate(25,-25);ctx.scale(.72,.72);ctx.rotate(-Math.PI/2);}
 const side=direction==='left'?-1:direction==='right'?1:0,back=direction==='up';
 ctx.lineWidth=1.5;ctx.lineJoin='round';ctx.strokeStyle='#725e6b';
 const oval=(x:number,y:number,rx:number,ry:number,fill:string)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();ctx.stroke();};
 const box=(x:number,y:number,w:number,h:number,r:number,fill:string)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();ctx.stroke();};
 const line=(x:number,y:number,xx:number,yy:number,color='#725e6b',width=1.5)=>{ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.stroke();ctx.lineWidth=1.5;ctx.strokeStyle='#725e6b';};
 const skin=skinTones[a.skin]!,hair=characterColors[a.hairColor]!;
 const legs=sit?[-10,10]:[-7,7];
 if(layer==='base'){
  ctx.strokeStyle='transparent';oval(0,1,18,5,'#725e6b25');ctx.strokeStyle='#725e6b';
  if([2,3,4].includes(a.hair))box(-22,-65,44,39,a.hair===2?16:10,hair);
  box(-13,-31,26,25,10,skin);for(let i=0;i<2;i++)box(legs[i]!-5,-10+(sit?2:walk*(i?2:-2)),10,sit?11:15,5,skin);
  const gesture=pose.startsWith('wave')||pose==='love'||pose==='please'||pose==='hug'||pose.startsWith('clap');
  for(const sign of [-1,1]){const yy=gesture&&sign===1?(pose==='wave1'?-52:-40):-17;line(sign*11,-27,sign*(gesture?23:18),yy,skin,9);oval(sign*(gesture?23:18),yy,5,5,skin);}
  oval(side*2,-49,22,23,skin);oval(-22,-47,3,6,skin);oval(22,-47,3,6,skin);
  ctx.fillStyle=hair;ctx.beginPath();ctx.ellipse(0,-55,23,20,0,Math.PI,Math.PI*2);ctx.lineTo(22,-49);ctx.quadraticCurveTo(8,-64,-5,-52);ctx.quadraticCurveTo(-12,-47,-22,-48);ctx.closePath();ctx.fill();ctx.stroke();
  if(a.hair===0)for(const [x,y,r] of [[-15,-66,9],[0,-72,10],[15,-66,9]])oval(x!,y!,r!,r!*.65,hair);
  if(a.hair===1){box(-24,-62,8,28,4,hair);box(16,-62,8,28,4,hair);}
  if(a.hair===2)for(let i=0;i<5;i++)oval(-20+i*10,-68+(i%2)*3,7,7,hair);
  if(a.hair===4)oval(back?0:-20,-57,9,17,hair);
  if(a.hair===5){oval(0,-77,11,9,hair);line(-9,-74,8,-76,'#d9b875',3);}
  if(a.hair===6){ctx.fillStyle=hair;ctx.beginPath();ctx.moveTo(20,-67);ctx.quadraticCurveTo(-5,-65,-15,-41);ctx.quadraticCurveTo(-21,-57,-17,-65);ctx.fill();}
  if(a.hair===7){line(-10,-68,10,-68,hair,5);}
  if(back){oval(0,-51,22,21,hair);ctx.restore();return;}
  const ex=side*7,closed=pose==='sleep'||pose==='yawn'||pose.startsWith('laugh');
  if(closed||a.eyes===4){line(-12+ex,-48,-5+ex,-49);line(5+ex,-49,12+ex,-48);}
  else for(const x of [-8+ex,8+ex]){oval(x,-48,a.eyes===1?3:2.8,a.eyes===2?3.5:4.5,'#342e39');ctx.strokeStyle='transparent';oval(x-1,-50,1,1.5,'#fff9fa');ctx.strokeStyle='#725e6b';if(a.eyes===3)line(x-4,-52,x-1,-53);if(a.eyes===5)line(x-3,-55,x+3,-56);}
  if(pose==='angry'){line(-13+ex,-56,-5+ex,-53);line(5+ex,-53,13+ex,-56);}
  ctx.strokeStyle='transparent';oval(-15,-40,4,2.3,'#dc96ae80');oval(15,-40,4,2.3,'#dc96ae80');ctx.strokeStyle='#725e6b';
  if(pose.startsWith('cry')){line(-8+ex,-42,-9+ex,-34,'#9bbbd0',3);line(8+ex,-42,9+ex,-34,'#9bbbd0',3);}
  if(pose==='yawn'||pose==='kiss'||a.mouth===2)oval(ex,-37,pose==='kiss'?2:3,pose==='yawn'?5:2.5,'#a85d68');
  else{ctx.beginPath();ctx.moveTo(ex-4,-38);ctx.quadraticCurveTo(ex,-34-(a.mouth===1?2:0),ex+4,-38);ctx.stroke();if(a.mouth===3)line(ex-1,-37,ex+1,-37);}
 }
 if(layer==='shirt'){
  const color=characterColors[a.shirtColor]!;box(-14,-31,28,a.shirt===2?27:24,7,color);
  line(-5,-30,0,-27,'#fff9fa',2);line(0,-27,5,-30,'#fff9fa',2);
  if(a.shirt===1){line(-5,-24,-5,-17,'#fff9fa',1);line(5,-24,5,-17,'#fff9fa',1);box(-8,-13,16,4,2,color);}
  if(a.shirt===2)for(let y=-23;y<-8;y+=6)line(-12,y,12,y,'#fff9fa',2);
  for(const sign of [-1,1])box(sign===1?12:-19,-29,7,a.shirt===0?7:13,3,color);
 }
 if(layer==='pants')for(let i=0;i<2;i++)box(legs[i]!-5,-10+(sit?2:walk*(i?2:-2)),10,a.pants===1?7:13,3,characterColors[a.pantsColor]!);
 if(layer==='shoes')for(let i=0;i<2;i++){box(legs[i]!-6,(sit?10:2)+walk*(i?2:-2),12,a.shoes===2?9:6,3,characterColors[a.shoesColor]!);if(a.shoes===1)line(legs[i]!-4,4,legs[i]!+4,4,'#fff9fa',2);}
 if(layer==='glasses'&&a.glasses&&!back){for(const x of [-9+side*7,9+side*7]){ctx.beginPath();if(a.glasses===1)ctx.ellipse(x,-48,7,6,0,0,Math.PI*2);else ctx.roundRect(x-7,-54,14,12,3);ctx.stroke();}line(-2+side*7,-48,2+side*7,-48);}
 ctx.restore();
}
