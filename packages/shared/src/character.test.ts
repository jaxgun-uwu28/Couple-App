import {expect,it} from 'vitest';
import {appearanceSchema,defaultAppearance,charactersSchema,emoteSchema} from './character';
it('accepts all catalog boundaries and rejects non-catalog or extra appearance state',()=>{
 expect(appearanceSchema.parse(defaultAppearance())).toEqual(defaultAppearance());
 expect(appearanceSchema.safeParse({skin:7,body:2,height:2,hair:7,hairColor:11,eyes:5,mouth:3,glasses:2,shirt:2,shirtColor:11,pants:2,pantsColor:11,shoes:2,shoesColor:11}).success).toBe(true);
 for(const bad of [{skin:8},{hair:-1},{height:1.5},{shirtColor:12},{owns:true},{skin:null}])expect(appearanceSchema.safeParse({...defaultAppearance(),...bad}).success).toBe(false);
});
it('requires complete verified character reads and session-bound reactions',()=>{
 const id='11111111-1111-4111-8111-111111111111';
 expect(charactersSchema.safeParse({couple_id:id,server_time:new Date().toISOString(),profiles:[{user_id:id,configured:true,appearance:defaultAppearance()}],presets:[],social:null}).success).toBe(true);
 expect(charactersSchema.safeParse({couple_id:id,profiles:[]}).success).toBe(false);
 expect(emoteSchema.safeParse({couple_id:id,user_id:id,session_id:id,request_id:id,emote:'wave'}).success).toBe(true);
 expect(emoteSchema.safeParse({couple_id:id,user_id:id,session_id:id,request_id:id,emote:'give_coins'}).success).toBe(false);
});
