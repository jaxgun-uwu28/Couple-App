import {Capacitor,registerPlugin} from '@capacitor/core';
const memory=registerPlugin<{read():Promise<{pssKiB:number}>}>('PerformanceMemory');
export async function readProcessMemory():Promise<string>{
 if(!Capacitor.isNativePlatform())return '';
 try{const result=await memory.read();return ` · App process PSS ${(result.pssKiB/1024).toFixed(1)} MiB (excludes isolated WebView renderer)`;}
 catch{return ' · App process PSS unavailable';}
}
