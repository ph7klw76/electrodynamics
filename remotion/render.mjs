import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';import {openBrowser,selectComposition,renderMedia,renderStill} from '@remotion/renderer';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.dirname(here),original=path.join(root,'outputs');
const out=path.resolve(root,process.env.ELECTRODYNAMICS_RENDER_DIR||'outputs/animated');
await fs.mkdir(out,{recursive:true});
const mode=process.argv[2]||'sample';const events=JSON.parse(await fs.readFile(path.join(root,'course/publication_events.json'),'utf8'));
if(events.status!=='MEASURED')throw new Error('Synthesize narration and synchronize measured timing before rendering delivery media.');
if(mode==='full'&&JSON.parse(await fs.readFile(path.join(here,'production-eligibility.json'),'utf8')).eligible!==true)throw new Error('Confirm producer eligibility under the installed Remotion license.');
const master=path.join(original,'Electrodynamics_Narration.wav'),assets=path.join(out,'render-cache','assets',mode);
await fs.mkdir(path.join(assets,'media'),{recursive:true});
await fs.copyFile(master,path.join(assets,'media','narration.wav'));
const python=process.env.PYTHON||'python';const ffmpeg=process.env.FFMPEG_BINARY||spawnSync(python,['-c','import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())'],{encoding:'utf8'}).stdout.trim();
if(!ffmpeg)throw new Error('Activate the production Python environment or set PYTHON / FFMPEG_BINARY.');
const serveUrl=await bundle({entryPoint:path.join(here,'src/index.ts'),publicDir:assets,outDir:path.join(out,'render-cache','bundle',mode)});
const executable=process.env.REMOTION_BROWSER_EXECUTABLE||(process.platform==='win32'?path.join(os.homedir(),'AppData/Local/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-win64/chrome-headless-shell.exe'):null);
const browser=await openBrowser('chrome',{browserExecutable:executable,logLevel:'warn'});
try{
 const inputProps={showCaptions:false};const composition=await selectComposition({serveUrl,id:'Electrodynamics',inputProps,puppeteerInstance:browser});
 const common={serveUrl,composition,inputProps,puppeteerInstance:browser,codec:'h264',crf:18,x264Preset:'veryfast',pixelFormat:'yuv420p',colorSpace:'bt709',imageFormat:'jpeg',jpegQuality:95,concurrency:Number(process.env.REMOTION_CONCURRENCY||4),timeoutInMilliseconds:90000,logLevel:'warn',muted:true};
 const progress=label=>{let time=0;return p=>{if(Date.now()-time>15000||p.progress===1){time=Date.now();console.log(JSON.stringify({label,progress:Math.round(p.progress*100),rendered:p.renderedFrames,encoded:p.encodedFrames}));}};};
 if(mode==='stills'){
  const indices=[0,1,2,3,4,5,7,8,9,11,12,13,15,16,17,19,20,21,23,24,25,27];
  const frames=Object.fromEntries(indices.map(i=>[i,events.scenes[i].start_frame+Math.floor(events.scenes[i].duration_frames*.68)]));
  for(const i of indices){await renderStill({serveUrl,composition,inputProps,puppeteerInstance:browser,frame:frames[i],imageFormat:'png',output:path.join(out,`proof-scene-${i}.png`)});}
  await fs.writeFile(path.join(out,'proof-frames.json'),JSON.stringify(frames,null,2)+'\n');
  await renderStill({serveUrl,composition,inputProps:{showCaptions:true},puppeteerInstance:browser,frame:events.scenes[9].start_frame+90,imageFormat:'png',output:path.join(out,'caption-proof.png')});
  const thumbnail=await selectComposition({serveUrl,id:'ElectrodynamicsThumbnail',puppeteerInstance:browser});await renderStill({serveUrl,composition:thumbnail,puppeteerInstance:browser,frame:0,imageFormat:'png',output:path.join(out,'Electrodynamics_Thumbnail.png')});console.log('Proof frames and thumbnail complete.');
 }else if(mode==='sample'){
  const from=events.scenes[5].start_frame+16*events.fps,to=from+1799;const video=path.join(out,'sample-video.mp4'),final=path.join(out,'Electrodynamics_Sample.mp4');
  await renderMedia({...common,frameRange:[from,to],outputLocation:video,onProgress:progress('sample')});
  const r=spawnSync(ffmpeg,['-v','error','-y','-i',video,'-ss',String(from/events.fps),'-i',master,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-t','60','-movflags','+faststart',final],{stdio:'inherit'});if(r.status!==0)throw Error('Sample mux failed');await fs.unlink(video);
  await fs.writeFile(path.join(out,'sample-render.json'),JSON.stringify({file:path.basename(final),start_frame:from,frames:1800,audio_source_offset_seconds:from/events.fps},null,2));console.log('SAMPLE '+final);
 }else if(mode==='full'){
  const h=crypto.createHash('sha256');
  for(const file of (await fs.readdir(path.join(here,'src'),{recursive:true})).sort())if(/\.(tsx?|json|css)$/.test(file))h.update(await fs.readFile(path.join(here,'src',file)));
  for(const file of [master,path.join(here,'pnpm-lock.yaml'),fileURLToPath(import.meta.url)])h.update(await fs.readFile(file));
  const key=h.digest('hex').slice(0,16),cache=path.join(out,'render-cache');await fs.mkdir(cache,{recursive:true});const chunks=[];
  for(let i=0;i<events.chapters.length;i++){
   const from=events.chapters[i].start_frame,to=(events.chapters[i+1]?.start_frame??events.duration_frames)-1,file=path.join(cache,`chapter-${i+1}-${key}.mp4`);
   if(!await fs.stat(file).catch(()=>null)){console.log(`CHAPTER ${i+1}: ${from}..${to}`);await renderMedia({...common,frameRange:[from,to],outputLocation:file+'.partial.mp4',onProgress:progress(`chapter-${i+1}`)});await fs.rename(file+'.partial.mp4',file);}else console.log('CACHE '+path.basename(file));chunks.push(file);
  }
  const concat=path.join(cache,'concat.txt');await fs.writeFile(concat,chunks.map(file=>`file '${file.replaceAll('\\','/')}'`).join('\n'));
  const final=path.join(out,'Electrodynamics_Lecture.mp4');const r=spawnSync(ffmpeg,['-v','warning','-y','-f','concat','-safe','0','-i',concat,'-i',master,'-i',path.join(root,'narration/lecture.srt'),'-f','ffmetadata','-i',path.join(original,'chapters.ffmetadata'),'-map','0:v:0','-map','1:a:0','-map','2:0','-map_metadata','3','-map_chapters','3','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-c:s','mov_text','-metadata:s:s:0','language=eng','-metadata','title=Electrodynamics: Animated Field Lab','-t',String(events.duration_seconds),'-movflags','+faststart',final],{stdio:'inherit'});if(r.status!==0)throw Error('Final mux failed');console.log('FINAL '+final);
 }else throw new Error('Use sample, stills or full.');
}finally{await browser.close({silent:true});}
