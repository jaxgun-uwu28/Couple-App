import type Phaser from 'phaser';
import type {Appearance,Direction} from '@paw/shared';
import {characterFrame,characterPoses,drawCharacter,atlasColumns,frameHeight,frameWidth,feetAnchor} from './CharacterArt';
import type {CharacterLayer,CharacterPose} from './CharacterArt';
const layers:CharacterLayer[]=['base','pants','shirt','shoes','glasses'];
const keysFor=(a:Appearance,layer:CharacterLayer)=>layer==='base'?[a.body,a.height,a.skin,a.hair,a.hairColor,a.eyes,a.mouth]:layer==='glasses'?[a.body,a.height,a.glasses]:[a.body,a.height,a[layer],a[`${layer}Color` as keyof Appearance]];
export class LayeredCharacter{
 readonly body:Phaser.GameObjects.Container;
 private sprites:Phaser.GameObjects.Sprite[]=[];
 private keys:string[]=[];
 private appearanceKey='';
 private label:Phaser.GameObjects.Text;
 private reaction:Phaser.GameObjects.Text;
 constructor(private scene:Phaser.Scene){this.body=scene.add.container();this.label=scene.add.text(0,-92,'',{fontFamily:'system-ui',fontSize:'14px',color:'#554451',backgroundColor:'#fff9fa',padding:{x:6,y:3}}).setOrigin(.5);this.reaction=scene.add.text(0,-125,'',{fontFamily:'system-ui',fontSize:'28px'}).setOrigin(.5);}
 setAppearance(a:Appearance){
  const hash=JSON.stringify(a);if(this.appearanceKey===hash)return;this.appearanceKey=hash;
  // Only rebuild layers whose selection changed. Clothing edits retain the
  // cached body/face/hair atlas; each actor owns at most one atlas per layer.
  for(const [index,layer] of layers.entries()){
   const key=`character-${this.body.name|| (this.body.name=crypto.randomUUID())}-${layer}-${keysFor(a,layer).join('-')}`;
   if(this.keys[index]===key)continue;
   this.sprites[index]?.destroy();if(this.keys[index])this.scene.textures.remove(this.keys[index]);
   const canvas=document.createElement('canvas');canvas.width=atlasColumns*frameWidth;canvas.height=Math.ceil(characterPoses.length*4/atlasColumns)*frameHeight;
   const ctx=canvas.getContext('2d')!;
   for(const direction of ['down','up','left','right'] as const)for(const pose of characterPoses){const frame=characterFrame(pose,direction);ctx.save();ctx.translate(frame%atlasColumns*frameWidth,Math.floor(frame/atlasColumns)*frameHeight);drawCharacter(ctx,a,layer,pose,direction);ctx.restore();}
   const texture=this.scene.textures.addCanvas(key,canvas)!;
   for(let frame=0;frame<characterPoses.length*4;frame++)texture.add(frame,0,frame%atlasColumns*frameWidth,Math.floor(frame/atlasColumns)*frameHeight,frameWidth,frameHeight);
   const sprite=this.scene.add.sprite(0,0,key,0).setOrigin(.5,feetAnchor/frameHeight);this.body.addAt(sprite,index);this.sprites[index]=sprite;this.keys[index]=key;
  }
  this.body.add(this.label);
  this.body.add(this.reaction);
 }
 paint(point:{x:number;y:number},direction:Direction,pose:CharacterPose,name:string,depth:number,alpha:number,names:boolean,reaction='',rise=0){
  this.body.setPosition(point.x,point.y).setDepth(depth).setAlpha(alpha);
  const frame=characterFrame(pose,direction);for(const sprite of this.sprites)if(sprite.frame.name!==String(frame))sprite.setFrame(frame);
  if(this.label.text!==name)this.label.setText(name);this.label.setVisible(names);
  if(this.reaction.text!==reaction)this.reaction.setText(reaction);this.reaction.setY(-125-rise).setVisible(!!reaction);
 }
 destroy(){this.body.destroy();this.keys.forEach(key=>this.scene.textures.remove(key));this.keys=[];}
}
