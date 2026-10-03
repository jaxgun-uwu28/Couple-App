import {expect,it} from 'vitest';
import {appearanceSchema,defaultAppearance,characterOptions,charactersSchema,emoteSchema} from './character';
it('validates manifest IDs, roles, null blush and unique accessories',()=>{
 const a=defaultAppearance();expect(appearanceSchema.parse(a)).toEqual(a);
 for(const role of ['body','hairBack','hairFront','face','outfit'] as const)for(const layer of characterOptions(role))expect(appearanceSchema.safeParse({...a,[role]:layer.id}).success).toBe(true);
 expect(appearanceSchema.safeParse({...a,blush:null,accessories:[]}).success).toBe(true);
 for(const bad of [{body:'body.missing'},{face:a.outfit},{body:1},{height:1},{accessories:[a.accessories[0],a.accessories[0]]},{hairBack:'hair_front.bob.black'}])expect(appearanceSchema.safeParse({...a,...bad}).success).toBe(false);
});
it('requires verified reads and session-bound reactions',()=>{
 const id='11111111-1111-4111-8111-111111111111';
 expect(charactersSchema.safeParse({couple_id:id,server_time:new Date().toISOString(),profiles:[{user_id:id,configured:true,appearance:defaultAppearance()}],presets:[],social:null}).success).toBe(true);
 expect(charactersSchema.safeParse({couple_id:id,profiles:[]}).success).toBe(false);
 expect(emoteSchema.safeParse({couple_id:id,user_id:id,session_id:id,request_id:id,emote:'wave'}).success).toBe(true);
 expect(emoteSchema.safeParse({couple_id:id,user_id:id,session_id:id,request_id:id,emote:'unlimited'}).success).toBe(false);
});
