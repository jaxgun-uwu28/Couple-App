// Isolated real-renderer regression harness; never imported by the application.
import Phaser from 'phaser';
import { CottageArt } from './CottageArt';
export async function renderComparison(){
 const results:{baked:boolean;graphics:number;textures:number}[]=[];
 for(const baked of [false,true])await new Promise<void>(resolve=>{
  const parent=document.createElement('div');parent.style.display='inline-block';document.body.append(parent);
  class Preview extends Phaser.Scene{
   create(){
    const art=new CottageArt(this,()=>undefined,baked);
    art.update([],null,null);
    this.cameras.main.setZoom(.25).centerOn(1024,704);
    results.push({baked,graphics:this.children.list.filter(o=>o instanceof Phaser.GameObjects.Graphics).length,textures:this.children.list.filter(o=>o instanceof Phaser.GameObjects.RenderTexture).length});
    this.game.events.once('postrender',()=>resolve());
   }
  }
  new Phaser.Game({type:Phaser.WEBGL,parent,width:512,height:352,backgroundColor:'#f8f0f2',scene:Preview,audio:{noAudio:true}});
 });
 return results;
}
