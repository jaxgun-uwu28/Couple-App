import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
await mkdir('packages/shared/src/maps',{recursive:true});
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:32,height:32},deviceScaleFactor:1});
await page.setContent(`<style>body{margin:0}</style>${await readFile('maps/navigation.svg','utf8')}`);
await page.screenshot({path:'maps/navigation.png',omitBackground:true});await browser.close();
