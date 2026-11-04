import { mkdir, readFile, writeFile, rename, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const models=path.join(root,'public','models');
const model=path.join(models,'porsche-911-carrera-4s.glb');
const source='https://developer.playcanvas.com/assets/porsche-911-carrera-4s.glb';
const expected='421fdabf0da312edb3c22dc0fc915bcc75551ff0db7374a7ebac8af80efc5ea2';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
await mkdir(path.join(models,'draco'),{recursive:true});
let valid=false;
try{valid=hash(await readFile(model))===expected;}catch{}
if(!valid){
  console.log('Downloading attributed Carrera 4S model from the PlayCanvas teaching asset...');
  const response=await fetch(source,{signal:AbortSignal.timeout(90000)});
  if(!response.ok)throw new Error(`Model download failed (${response.status}). See public/models/attribution.txt.`);
  if(Number(response.headers.get('content-length'))>10000000)throw new Error('Unexpected model size.');
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(bytes.length>10000000||hash(bytes)!==expected)throw new Error('Model integrity check failed; upstream asset changed.');
  await writeFile(model+'.download',bytes);await rename(model+'.download',model);
}
for(const name of ['draco_decoder.js','draco_decoder.wasm','draco_wasm_wrapper.js']){
  await copyFile(path.join(root,'node_modules','three','examples','jsm','libs','draco','gltf',name),path.join(models,'draco',name));
}
console.log('3D assets ready; model SHA-256 verified.');
