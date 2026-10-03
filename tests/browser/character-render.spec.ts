import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
test('all character frames fit their grid and outfit edits retain the cached base',async({page})=>{
 test.setTimeout(90000);await page.goto('/');const results=await page.evaluate(async()=>{document.body.replaceChildren();const harness=await import('/src/game/CharacterArt.browser.ts' as string);return harness.reviewCharacters() as Promise<{clipped:string[];cache:{baseStable:boolean;clothesChanged:boolean;bounded:boolean}}>;});
 expect(results.clipped.slice(0,20)).toEqual([]);expect(results.cache).toEqual({baseStable:true,clothesChanged:true,bounded:true});await mkdir('artifacts/phase3',{recursive:true});await page.screenshot({path:'artifacts/phase3/character-four-directions.png',fullPage:true});
});
