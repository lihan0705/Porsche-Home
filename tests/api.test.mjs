import test from 'node:test';
import assert from 'node:assert/strict';

// Run against a locally built Worker, not production. Dispatch supplies the
// identity headers in production; the local built Worker accepts test fixtures.
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5174';
if (!['127.0.0.1','localhost'].includes(new URL(base).hostname)) throw new Error('API tests are local-only.');
const suffix = Date.now();
const alice = `integration-alice-${suffix}`, bob = `integration-bob-${suffix}`;
const config = {architecture:'courtyard',plants:'olive',time:'sunset',weather:'clear',carColor:'#b9c0ba',wheels:'silver'};
async function api(path,{user,body,method,origin}={}) {
  const headers = {'Content-Type':'application/json'};
  if (user) headers['oai-authenticated-user-id'] = user;
  if (origin) headers.Origin = origin;
  const response = await fetch(base+path,{method:method || (body?'POST':'GET'),headers,body:body?JSON.stringify(body):undefined});
  const text=await response.text();
  try { return {status:response.status,data:JSON.parse(text)}; }
  catch { throw new Error(`HTTP ${response.status}: ${text}`); }
}
test('saved homes, ownership and postcards survive updates',async t=>{
  const body={title:'本地接口测试',ownerName:'测试车主',story:'This is a local test fixture.',config};
  await t.test('anonymous writes require sign-in',async()=>assert.equal((await api('/api/home',{body})).status,401));
  const created=await api('/api/home',{user:alice,body});
  assert.equal(created.status,200); assert.ok(created.data.id); assert.equal(created.data.isOwner,true);
  const id=created.data.id;
  await t.test('visitors can read but do not own the home',async()=>{const result=await api(`/api/home?id=${id}`,{user:bob});assert.equal(result.status,200);assert.equal(result.data.isOwner,false);});
  await t.test('another user cannot overwrite the home',async()=>assert.equal((await api('/api/home',{user:bob,body:{...body,id,title:'Overwrite'}})).status,403));
  await t.test('cross-origin changes are rejected',async()=>assert.equal((await api('/api/home',{user:alice,body:{...body,id},origin:'https://different.example'})).status,403));
  await t.test('invalid scene parameters are rejected',async()=>assert.equal((await api('/api/home',{user:alice,body:{...body,id,config:{...config,carColor:'javascript:bad'}}})).status,400));
  let card;
  await t.test('visitor can send a postcard',async()=>{const result=await api('/api/postcards',{user:bob,body:{homeId:id,name:'来访朋友',message:'下次一起沿山路兜风。',theme:'forest'}});assert.equal(result.status,201);card=result.data.postcard;});
  await t.test('owner updates preserve the home id and postcard',async()=>{const result=await api('/api/home',{user:alice,body:{...body,id,title:'更新后的家',config:{...config,time:'night'}}});assert.equal(result.status,200);assert.equal(result.data.id,id);assert.equal(result.data.postcards[0].id,card.id);const loaded=await api(`/api/home?id=${id}`);assert.equal(loaded.data.config.time,'night');assert.equal(loaded.data.postcards[0].message,'下次一起沿山路兜风。');});
  await t.test('oversized postcard is rejected',async()=>assert.equal((await api('/api/postcards',{user:bob,body:{homeId:id,name:'访客',message:'长'.repeat(301),theme:'forest'}})).status,400));
  await t.test('missing shared home gives 404',async()=>assert.equal((await api(`/api/home?id=${crypto.randomUUID()}`)).status,404));
  await t.test('basic instruction mode is identified honestly',async()=>{const result=await api('/api/design',{body:{prompt:'山间木屋，松林，黄昏，不要下雨',config}});assert.equal(result.status,200);assert.equal(result.data.mode,'basic');assert.equal(result.data.aiReady,false);assert.equal(result.data.config.architecture,'alpine');assert.equal(result.data.config.plants,'pine');assert.equal(result.data.config.weather,'clear');});
});
