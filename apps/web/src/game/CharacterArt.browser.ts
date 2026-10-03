// Real browser review of unchanged PNG composition and bounded two-actor caches.
import Phaser from 'phaser';
import {defaultAppearance,characterOptions} from '@paw/shared';
import {drawPortrait,prepareCharacterArt,frameWidth,frameHeight,characterSourceBytes} from './CharacterArt';
import {LayeredCharacter} from './LayeredCharacter';
export async function reviewCharacters(){
 await prepareCharacterArt();const clipped:string[]=[];
 const sheet=document.createElement('canvas');sheet.width=1000;sheet.height=600;document.body.append(sheet);const out=sheet.getContext('2d')!;
 for(const [i,layer] of characterOptions('outfit').entries()){
  const canvas=document.createElement('canvas');canvas.width=frameWidth;canvas.height=frameHeight;const ctx=canvas.getContext('2d')!;drawPortrait(ctx,{...defaultAppearance(),outfit:layer.id});
  const data=ctx.getImageData(0,0,frameWidth,frameHeight).data;
  for(let x=0;x<frameWidth;x++)if(data[x*4+3]||data[((frameHeight-1)*frameWidth+x)*4+3]){clipped.push(layer.id+':vertical');break;}
  for(let y=0;y<frameHeight;y++)if(data[y*frameWidth*4+3]||data[(y*frameWidth+frameWidth-1)*4+3]){clipped.push(layer.id+':horizontal');break;}
  out.drawImage(canvas,(i%5)*200,Math.floor(i/5)*300);
 }
 const cache=await new Promise<{baseStable:boolean;clothesChanged:boolean;bounded:boolean}>(resolve=>{
  class Preview extends Phaser.Scene{create(){
   const actor=new LayeredCharacter(this),peer=new LayeredCharacter(this),a=defaultAppearance();actor.setAppearance(a);peer.setAppearance(a);
   const before=this.textures.getTextureKeys().filter(k=>k.startsWith('character-'));
   actor.setAppearance({...a,outfit:characterOptions('outfit')[0]!.id});
   const after=this.textures.getTextureKeys().filter(k=>k.startsWith('character-'));
   const baseStable=before.filter(k=>k.includes('-lower-')||k.includes('-upper-')).every(k=>after.includes(k));
   const clothesChanged=before.filter(k=>k.includes('-outfit-')).some(k=>!after.includes(k));
   for(const direction of ['left','right','up','down'] as const)for(const pose of ['walk1','sit','sleep','hug','cuddle','wave0','dance1','idle'] as const)actor.paint({x:50,y:90},direction,pose,'Test',90,1,true);
   const bounded=this.textures.getTextureKeys().filter(k=>k.startsWith('character-')).length===8&&actor.cacheBytes+peer.cacheBytes===1920000;
   actor.destroy();peer.destroy();const clean=!this.textures.getTextureKeys().some(k=>k.startsWith('character-'));
   this.game.events.once('postrender',()=>{this.game.destroy(true);resolve({baseStable,clothesChanged,bounded:bounded&&clean});});
  }}
  new Phaser.Game({type:Phaser.WEBGL,width:200,height:150,scene:Preview,audio:{noAudio:true}});
 });
 return {clipped,cache,sourceBytes:characterSourceBytes()};
}
