import { readdir, mkdir, mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve, join, extname } from 'node:path';
import { z } from 'zod';
const arg=(name:string, def?:string)=>{const i=process.argv.indexOf('--'+name);return i<0?def:process.argv[i+1]};
const run=(program:string,args:string[])=>new Promise<void>((ok,fail)=>{const p=spawn(program,args,{stdio:['ignore','inherit','inherit']});p.on('error',fail);p.on('close',c=>c===0?ok():fail(new Error(`${program} failed (${c})`)))});
async function main(){
 const folder=arg('photos');if(!folder)throw Error('--photos is required');const out=resolve(arg('output','analysis.json')!);const ffmpeg=arg('ffmpeg',process.env.FFMPEG_PATH||'ffmpeg')!;
 const files=(await readdir(resolve(folder))).filter(f=>/\.(png|jpe?g|webp|mp4|webm)$/i.test(f)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));if(!files.length)throw Error('No media found');
 await mkdir('.work',{recursive:true});const work=await mkdtemp(resolve('.work','analysis-'));
 const schema={type:'object',additionalProperties:false,properties:{x:{type:'number'},y:{type:'number'},start:{type:'number'}},required:['x','y','start']};await writeFile(join(work,'schema.json'),JSON.stringify(schema));const result=z.object({x:z.number().min(0).max(1),y:z.number().min(0).max(1),start:z.number().min(0)});const focus:Record<string,{x:number,y:number}>={},clips:Record<string,{start:number}>={};
 try {for(const [i,file] of files.entries()) {let img=resolve(folder,file);const isVideo=/\.(mp4|webm)$/i.test(extname(file));if(isVideo){img=join(work,`sheet-${i}.jpg`);await run(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',resolve(folder,file),'-vf','fps=1/5,scale=320:-1,tile=4x3','-frames:v','1',img]);}
 const response=join(work,`response-${i}.json`);const prompt=isVideo?'The image is a contact sheet of a family video, sampled every 5 seconds, left to right, top to bottom. Choose an appealing meaningful scene for a birthday montage, and identify the main subject center in that frame. Return x and y normalized 0..1 relative to that single frame, and start in seconds as a multiple of 5. Avoid selecting a blank tile.':'Find the main person or most important subject for a birthday montage. Return its center as x and y normalized 0..1 relative to the entire image; start must be 0.';
 console.log(`Analyzing ${i+1}/${files.length}: ${file}`);await run('codex',['exec','--ephemeral','--sandbox','read-only','--skip-git-repo-check','--image',img,'--output-schema',join(work,'schema.json'),'-o',response,prompt]);const a=result.parse(JSON.parse(await readFile(response,'utf8')));focus[file]={x:a.x,y:a.y};if(isVideo)clips[file]={start:a.start};}
 await writeFile(out,JSON.stringify({title:'',focus,clips,captions:[]},null,2)+'\n');console.log('Saved:',out);
 }finally{await rm(work,{recursive:true,force:true})}
}
main().catch(e=>{console.error('Analysis error:',e.message, '\nCheck that Codex CLI is installed and signed in, and that FFmpeg can read the media.');process.exitCode=1});
