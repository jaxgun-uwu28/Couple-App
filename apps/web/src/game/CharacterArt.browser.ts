// Real Canvas/Phaser asset review and cache regression; not imported by the app.
import Phaser from 'phaser';
import {defaultAppearance} from '@paw/shared';
import {characterPoses,drawCharacter,frameWidth,frameHeight} from './CharacterArt';
import {LayeredCharacter} from './LayeredCharacter';
export async function reviewCharacters(){
 const layers=['base','pants','shirt','shoes','glasses'] as const;const clipped:string[]=[];
 const sheet=document.createElement('canvas');sheet.width=8*frameWidth;sheet.height=4*frameHeight;document.body.append(sheet);const out=sheet.getContext('2d')!;
 for(let hair=0;hair<8;hair++)for(let body=0;body<3;body++)for(let height=0;height<3;height++)for(const direction of ['down','up','left','right'] as const)for(const pose of characterPoses){
  const canvas=document.createElement('canvas');canvas.width=frameWidth;canvas.height=frameHeight;const ctx=canvas.getContext('2d')!;const a={...defaultAppearance(),skin:hair,hair,body,height,glasses:2};
  for(const layer of layers)drawCharacter(ctx,a,layer,pose,direction);
  const data=ctx.getImageData(0,0,frameWidth,frameHeight).data;
  for(let x=0;x<frameWidth;x++)if(data[x*4+3]||data[((frameHeight-1)*frameWidth+x)*4+3]){clipped.push(`${hair}/${body}/${height}/${direction}/${pose}:vertical`);break;}
  for(let y=0;y<frameHeight;y++)if(data[(y*frameWidth)*4+3]||data[(y*frameWidth+frameWidth-1)*4+3]){clipped.push(`${hair}/${body}/${height}/${direction}/${pose}:horizontal`);break;}
  if(body===1&&height===1&&pose==='idle')out.drawImage(canvas,hair*frameWidth,['down','up','left','right'].indexOf(direction)*frameHeight);
 }
 const cache=await new Promise<{baseStable:boolean;clothesChanged:boolean;bounded:boolean}>(resolve=>{
  class Preview extends Phaser.Scene{create(){const actor=new LayeredCharacter(this),a=defaultAppearance();actor.setAppearance(a);const before=this.textures.getTextureKeys().filter(k=>k.startsWith('character-'));actor.setAppearance({...a,shirtColor:2});const after=this.textures.getTextureKeys().filter(k=>k.startsWith('character-'));const baseStable=before.find(k=>k.includes('-base-'))===after.find(k=>k.includes('-base-'));const clothesChanged=before.find(k=>k.includes('-shirt-'))!==after.find(k=>k.includes('-shirt-'));actor.destroy();const bounded=after.length===5&&!this.textures.getTextureKeys().some(k=>k.startsWith('character-'));this.game.events.once('postrender',()=>{this.game.destroy(true);resolve({baseStable,clothesChanged,bounded});});}}
  new Phaser.Game({type:Phaser.WEBGL,width:1,height:1,scene:Preview,audio:{noAudio:true}});
 });
 return {clipped,cache};
}
