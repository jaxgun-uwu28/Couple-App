import type Phaser from 'phaser';
import type {Appearance,Direction} from '@paw/shared';
import {drawCharacter,faceForPose,layerIds,frameWidth,frameHeight,feetAnchor} from './CharacterArt';
import type {CharacterLayer,CharacterPose} from './CharacterArt';
const layers:CharacterLayer[]=['lower','outfit','upper','accessories'];
export class LayeredCharacter{
 readonly body:Phaser.GameObjects.Container;
 private visual:Phaser.GameObjects.Container;
 private sprites:Phaser.GameObjects.Image[]=[];
 private keys:string[]=[];
 private appearance?:Appearance;
 private signature='';
 private label:Phaser.GameObjects.Text;
 private reaction:Phaser.GameObjects.Text;
 constructor(private scene:Phaser.Scene){
  this.body=scene.add.container();this.body.name=crypto.randomUUID();this.visual=scene.add.container();this.body.add(this.visual);
  this.label=scene.add.text(0,-95,'',{fontFamily:'system-ui',fontSize:'14px',color:'#554451',backgroundColor:'#fff9fa',padding:{x:6,y:3}}).setOrigin(.5);
  this.reaction=scene.add.text(0,-123,'',{fontFamily:'system-ui',fontSize:'28px'}).setOrigin(.5);this.body.add([this.label,this.reaction]);
 }
 setAppearance(a:Appearance){const hash=JSON.stringify(a);if(hash===this.signature)return;this.signature=hash;this.appearance=a;for(const layer of layers)this.setLayer(layer,a.face);}
 private setLayer(layer:CharacterLayer,face:string){
  const a=this.appearance!;const index=layers.indexOf(layer),key=`character-${this.body.name}-${layer}-${layerIds(a,layer,face).join('+')}`;
  if(this.keys[index]===key)return;
  this.sprites[index]?.destroy();if(this.keys[index])this.scene.textures.remove(this.keys[index]);
  const canvas=document.createElement('canvas');canvas.width=frameWidth;canvas.height=frameHeight;drawCharacter(canvas.getContext('2d')!,a,layer,face);
  this.scene.textures.addCanvas(key,canvas);const sprite=this.scene.add.image(0,0,key).setOrigin(.5,feetAnchor/frameHeight);this.visual.addAt(sprite,index);this.sprites[index]=sprite;this.keys[index]=key;
 }
 paint(point:{x:number;y:number},direction:Direction,pose:CharacterPose,name:string,depth:number,alpha:number,names:boolean,reaction='',rise=0,reducedMotion=false){
  this.body.setPosition(point.x,point.y).setDepth(depth).setAlpha(alpha);
  this.setLayer('upper',faceForPose(this.appearance!,pose));
  // PLACEHOLDER: front art in all directions; flip the whole aligned composite.
  const sign=direction==='left'?-1:1,walk=pose.startsWith('walk')?Math.sin(Number(pose.slice(4))/6*Math.PI*2):0;
  const seated=pose==='sit'||pose==='cuddle',sleep=pose==='sleep',dance=pose.startsWith('dance');
  const bounce=reducedMotion?0:Math.abs(walk)*2+(dance?(pose==='dance0'?-3:1):0);
  const tilt=reducedMotion?0:walk*.035+(dance?(pose==='dance0'?-.07:.07):0)+(pose==='hug'?sign*.06:0);
  // PLACEHOLDER: seat compression, horizontal sleeping and consenting hug tilt.
  this.visual.setPosition(sleep?22:0,seated?4:-bounce).setScale(.31*sign*(sleep?.82:1),.31*(sleep?.82:seated?.72:1)).setRotation(sleep?-Math.PI/2:tilt);
  if(this.label.text!==name)this.label.setText(name);this.label.setVisible(names);
  const effect=reaction||(sleep?'💤':'');if(this.reaction.text!==effect)this.reaction.setText(effect);this.reaction.setY(-123-rise).setVisible(!!effect);
 }
 get cacheBytes(){return this.keys.length*frameWidth*frameHeight*4;}
 destroy(){this.body.destroy();this.keys.forEach(key=>this.scene.textures.remove(key));this.keys=[];}
}
