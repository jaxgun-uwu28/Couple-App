import {characterManifest} from '@paw/shared';
import type {Appearance} from '@paw/shared';
export const characterPoses=['idle','walk0','walk1','walk2','walk3','walk4','walk5','sit','sleep','hug','cuddle','wave0','wave1','laugh0','laugh1','cry0','cry1','angry','please','clap0','clap1','dance0','dance1','love','yawn','kiss'] as const;
export type CharacterPose=typeof characterPoses[number];
export type CharacterLayer='lower'|'outfit'|'upper'|'accessories';
export const frameWidth=200,frameHeight=300,feetAnchor=280;
// Static source layers are unchanged. PLACEHOLDER poses use composite transforms.
const urls=import.meta.glob('../../../../assets/characters/chibi_v1/half/**/*.png',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const images=new Map<string,HTMLImageElement>();
let loading:Promise<void>|undefined;
export function prepareCharacterArt():Promise<void>{
 return loading??=Promise.all(characterManifest.layers.map(layer=>new Promise<void>((resolve,reject)=>{
  const image=new Image();image.onload=()=>{images.set(layer.id,image);resolve();};image.onerror=()=>reject(new Error(`Could not load character layer ${layer.id}`));
  const url=urls[`../../../../assets/characters/chibi_v1/half/${layer.file}`];if(!url){reject(new Error(`Missing character layer ${layer.id}`));return;}image.src=url;
 }))).then(()=>undefined).catch(error=>{loading=undefined;throw error;});
}
export const layerIds=(a:Appearance,layer:CharacterLayer,face=a.face):string[]=>layer==='lower'?[a.hairBack,a.body,...(a.blush?[a.blush]:[])]:layer==='upper'?[a.hairFront,face]:layer==='outfit'?[a.outfit]:a.accessories;
export function drawCharacter(ctx:CanvasRenderingContext2D,a:Appearance,layer:CharacterLayer,face=a.face){
 for(const id of layerIds(a,layer,face)){const image=images.get(id);if(!image)throw new Error(`Character art not loaded: ${id}`);ctx.drawImage(image,0,0,frameWidth,frameHeight);}
}
export function drawPortrait(ctx:CanvasRenderingContext2D,a:Appearance,face=a.face){for(const layer of ['lower','outfit','upper','accessories'] as const)drawCharacter(ctx,a,layer,face);}
export function faceForPose(a:Appearance,pose:CharacterPose):string{
 const key=pose.replace(/[0-9]+$/,'');const set=characterManifest.expression_sets.find(set=>set.face_ids.includes(a.face));return (set?.poses as Record<string,string>|undefined)?.[key]??a.face;
}
export const characterSourceBytes=()=>images.size*frameWidth*frameHeight*4;
