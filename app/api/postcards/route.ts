import { and, count, eq, gte } from 'drizzle-orm';
import { getDb } from '@/db';
import { homes, postcards } from '@/db/schema';
import { postcardSchema } from '@/lib/validation';
import { ApiError, handleError, json, readBody, userId } from '@/lib/api';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{
  const body=await readBody(request,postcardSchema);const db=getDb();
  const home=(await db.select({id:homes.id}).from(homes).where(eq(homes.id,body.homeId)).limit(1))[0];
  if(!home)throw new ApiError(404,'请先保存这座家，再留下明信片。');
  let author=userId(request);
  if(!author){const fingerprint=(request.headers.get('cf-connecting-ip')||'anonymous')+'|'+(request.headers.get('user-agent')||'');const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(fingerprint));author='guest:'+Array.from(new Uint8Array(digest)).map(n=>n.toString(16).padStart(2,'0')).join('');}
  const now=Date.now();const recent=(await db.select({n:count()}).from(postcards).where(and(eq(postcards.authorId,author),gte(postcards.createdAt,now-60000))))[0]?.n||0;
  if(recent>=3)throw new ApiError(429,'明信片已寄出，请稍等一分钟再写。');
  const total=(await db.select({n:count()}).from(postcards).where(eq(postcards.homeId,body.homeId)))[0]?.n||0;
  if(total>=500)throw new ApiError(409,'这座家的信箱已满。');
  const card={id:crypto.randomUUID(),homeId:body.homeId,authorId:author,name:body.name,message:body.message,theme:body.theme,createdAt:now};
  await db.insert(postcards).values(card);
  return json({postcard:{id:card.id,name:card.name,message:card.message,theme:card.theme,createdAt:now}},201);
}catch(e){return handleError(e);}}
