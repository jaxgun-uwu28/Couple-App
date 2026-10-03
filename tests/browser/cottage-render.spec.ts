import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
test('phone caching preserves the house and replaces static vector render work',async({page})=>{
 await page.goto('/');
 const results=await page.evaluate(async()=>{
  // Vite serves this isolated test module; no production telemetry/debug globals.
  document.body.replaceChildren();
  const harness=await import('/src/game/CottageArt.browser.ts' as string);
  return await harness.renderComparison() as {baked:boolean;graphics:number;textures:number}[];
 });
 expect(results[1]!.textures).toBeGreaterThan(20);
 expect(results[0]!.graphics-results[1]!.graphics).toBe(results[1]!.textures);
 await mkdir('artifacts/phase2',{recursive:true});
 await page.screenshot({path:'artifacts/phase2/phone-cache-comparison.png',fullPage:true});
});
