import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { homes, postcards } from '@/db/schema';
import { DEMO_HOME } from '@/lib/home-config';
import { configSchema, homeSchema } from '@/lib/validation';
import { aiSettings, ApiError, handleError, json, readBody, requireUser, userId } from '@/lib/api';
export const dynamic='force-dynamic';
async function serialize(row:typeof homes.$inferSelect,viewer:string|null){
  const notes=await getDb().select({id:postcards.id,name:postcards.name,message:postcards.message,theme:postcards.theme,createdAt:postcards.createdAt}).from(postcards).where(eq(postcards.homeId,row.id)).orderBy(desc(postcards.createdAt)).limit(60);
  return {id:row.id,title:row.title,ownerName:row.ownerName,story:row.story,config:configSchema.parse(JSON.parse(row.config)),postcards:notes,isOwner:viewer===row.ownerId,updatedAt:row.updatedAt,authenticated:!!viewer,aiReady:!!aiSettings().key};
}
export async function GET(request:Request){try{
  const viewer=userId(request);const id=new URL(request.url).searchParams.get('id');
  if(id&&!/^[0-9a-f-]{36}$/i.test(id))throw new ApiError(400,'拜访链接格式不正确。');
  if(!id&&!viewer)return json({...DEMO_HOME,isOwner:true,authenticated:false,aiReady:!!aiSettings().key});
  const rows=await getDb().select().from(homes).where(id?eq(homes.id,id):eq(homes.ownerId,viewer!)).limit(1);
  if(!rows[0]){if(id)throw new ApiError(404,'这座家还没有开放，或链接已失效。');return json({...DEMO_HOME,authenticated:!!viewer,aiReady:!!aiSettings().key});}
  return json(await serialize(rows[0],viewer));
}catch(e){return handleError(e);}}
export async function POST(request:Request){try{
  const body=await readBody(request,homeSchema);const viewer=requireUser(request);const db=getDb();
  let id=body.id;
  if(id){const rows=await db.select({ownerId:homes.ownerId}).from(homes).where(eq(homes.id,id)).limit(1);if(!rows[0])throw new ApiError(404,'没有找到这座家。');if(rows[0].ownerId!==viewer)throw new ApiError(403,'只有主人可以修改这座家。');}
  else {const own=await db.select({id:homes.id}).from(homes).where(eq(homes.ownerId,viewer)).limit(1);id=own[0]?.id||crypto.randomUUID();}
  const now=Date.now();const values={title:body.title,ownerName:body.ownerName,story:body.story,config:JSON.stringify(body.config),updatedAt:now};
  await db.insert(homes).values({id,ownerId:viewer,createdAt:now,...values}).onConflictDoUpdate({target:homes.ownerId,set:values});
  const row=(await db.select().from(homes).where(eq(homes.ownerId,viewer)).limit(1))[0];
  return json(await serialize(row,viewer));
}catch(e){return handleError(e);}}
