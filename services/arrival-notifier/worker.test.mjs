import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {handleRequest} from './worker.mjs';
const PARTY='0946f302b9cf8449c6970809',SESSION='0123456789abcdef01234567',TOKEN='valid.visitor_token.signature',NOW=1804266000000;
function database(){
 const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
 return{exec(sql){db.exec(sql);},prepare(sql){return{bind(...args){return statement(sql,args);},...statement(sql,[])};}};
 function statement(sql,args){return{async first(column){const row=db.prepare(sql).get(...args);return row?(column?row[column]:row):null;},async all(){return{results:db.prepare(sql).all(...args)};},async run(){const result=db.prepare(sql).run(...args);return{meta:{changes:Number(result.changes)}};}};}
}
async function fixture(connected=true){
 const env={DB:database(),TELEGRAM_BOT_TOKEN:'private-bot-token',WEBHOOK_SECRET:'private-webhook-key',SETUP_NONCE:'one-time-setup',SETUP_EXPIRES:String(NOW+600000),SITE_ORIGIN:'https://seonyoungyoo16.github.io',SITE_BASE:'https://seonyoungyoo16.github.io/snowy-winter-village/',PARTY_ID:PARTY,PROJECT_API_KEY:'project-test-key',DATABASE_URL:'https://project-test.firebasedatabase.app'},messages=[],sleeps=[];
 if(connected)await env.DB.prepare("INSERT INTO settings(key,value) VALUES('telegram_chat','12345')").run();
 const state={now:NOW,uid:'visitor-one',record:{v:1,u:'visitor-one',n:'방문 곰',t:NOW},failTelegram:false};
 const dependencies={now:()=>state.now,sleep:async ms=>sleeps.push(ms),fetch:async(url,options={})=>{
  const target=new URL(url);
  if(target.hostname==='identitytoolkit.googleapis.com'){assert.equal(target.searchParams.get('key'),env.PROJECT_API_KEY);const token=JSON.parse(options.body).idToken;return Response.json(token===TOKEN?{users:[{localId:state.uid}]}:{error:'invalid'},{status:token===TOKEN?200:401});}
  if(target.hostname==='project-test.firebasedatabase.app'){assert.equal(target.searchParams.get('auth'),TOKEN);assert(target.pathname.endsWith('/players/'+SESSION+'.json'));return Response.json(state.record);}
  if(target.hostname==='api.telegram.org'){assert(target.pathname.startsWith('/bot'+env.TELEGRAM_BOT_TOKEN+'/'));const payload=JSON.parse(options.body);messages.push(payload);return Response.json(state.failTelegram?{ok:false}:{ok:true,result:{message_id:messages.length}},{status:state.failTelegram?500:200});}
  throw Error('Unexpected external request');
 }};
 const failure = (room, event, headers = {}, details = {}) => handleRequest(new Request('https://notify.test/connection-failure', {
  method: 'POST', headers: { origin: env.SITE_ORIGIN, authorization: 'Bearer ' + TOKEN, ...headers },
  body: JSON.stringify({ room, event: event.toString(16).padStart(32, '0'), ...details })
 }), env, dependencies);
 return{env,state,messages,sleeps,dependencies,failure,arrival:async(room=PARTY,overrides={})=>{const request=new Request('https://notify.test/arrival',{method:'POST',headers:{origin:env.SITE_ORIGIN,authorization:'Bearer '+TOKEN,'content-type':'application/json',...overrides.headers},body:JSON.stringify({room,session:SESSION,...overrides.body})});if(overrides.cf)Object.defineProperty(request,'cf',{value:overrides.cf});return handleRequest(request,env,dependencies);},webhook:async(update,secret=env.WEBHOOK_SECRET)=>handleRequest(new Request('https://notify.test/telegram',{method:'POST',headers:{'content-type':'application/json','x-telegram-bot-api-secret-token':secret},body:JSON.stringify(update)}),env,dependencies)};
}
test('five authenticated failures in a rolling window alert for the affected world only', async () => {
 const f = await fixture();
 const room = 'lb_' + PARTY;
 f.state.now = Math.floor(NOW / 300000) * 300000 + 299000;
 const permission = { nickname: '귤이 친구', stage: 'sync', code: 'PERMISSION_DENIED' };
 const timeout = { nickname: '별\n이', stage: 'register', code: 'TIMEOUT' };
 for (let event = 1; event <= 4; event++) {
  assert.equal((await f.failure(room, event, {}, event <= 2 ? permission : timeout)).status, 202);
 }
 assert.equal((await f.failure(room, 4)).status, 202);
 assert.equal((await f.failure(PARTY, 5)).status, 202);
 assert.equal((await f.failure(room, 5, { authorization: 'Bearer invalid.token.signature' })).status, 401);
 assert.equal((await f.failure(room, 5, { origin: 'https://other.test' })).status, 403);
 assert.equal((await f.failure('untracked-room', 5)).status, 400);
 assert.equal(f.messages.length, 0);

 f.state.now += 1500;
 const response = await f.failure(room, 5);
 assert.equal(response.status, 200);
 assert.equal(response.headers.get('access-control-allow-origin'), f.env.SITE_ORIGIN);
 assert.match(f.messages[0].text, /책숲 도서관\n최근 5분 동안 연결 실패 5회/);
 assert.match(f.messages[0].text, /귤이 친구 · 친구 동기화 · 접근 권한 거부 \(PERMISSION_DENIED\) · 2회/);
 assert.match(f.messages[0].text, /별이 · 입장 등록 · 20초 내 연결 미완료 · 2회/);
 assert.match(f.messages[0].text, /닉네임 미확인 · 단계 미확인 · 원인 미확인 · 1회/);
 assert.equal(f.messages[0].reply_markup.inline_keyboard[0][0].url, f.env.SITE_BASE + 'library/#room=' + room);
 assert.equal((await f.failure(room, 6)).status, 202);
 assert.equal(f.messages.length, 1);
});
test('expired failures do not count and concurrent reports only claim one alert', async () => {
 const f = await fixture();
 const room = 'aq_' + PARTY;
 for (let event = 1; event <= 4; event++) await f.failure(room, event);
 f.state.now += 300001;
 for (let event = 5; event <= 8; event++) assert.equal((await f.failure(room, event)).status, 202);
 assert.equal(f.messages.length, 0);
 const responses = await Promise.all([9, 10, 11].map(event => f.failure(room, event)));
 assert.deepEqual(responses.map(r => r.status).sort(), [200, 202, 202]);
 assert.equal(f.messages.length, 1);
 assert.match(f.messages[0].text, /물결 수족관\n최근 5분 동안 연결 실패 [5-7]회/);
 f.state.now += 15 * 60 * 1000;
 for (let event = 12; event <= 16; event++) await f.failure(room, event);
 assert.equal(f.messages.length, 2);
 assert.match(f.messages[1].text, /연결 실패 5회/);
});
test('retrying a failed Telegram delivery does not count the report twice', async () => {
 const f = await fixture();
 for (let event = 1; event <= 4; event++) await f.failure(PARTY, event);
 f.state.failTelegram = true;
 assert.equal((await f.failure(PARTY, 5, {}, {nickname:'밤이', stage:'presence', code:'token=private-error-detail'})).status, 502);
 f.state.failTelegram = false;
 assert.equal((await f.failure(PARTY, 5)).status, 200);
 assert.match(f.messages.at(-1).text, /겨울 마을\n최근 5분 동안 연결 실패 5회/);
 assert.match(f.messages.at(-1).text, /밤이 · 접속 상태 저장 · 원인 미확인 · 1회/);
 assert(!f.messages.at(-1).text.includes('private-error-detail'));
});
test('a confirmed Firebase visitor notifies the private phone chat with the correct world link',async()=>{
 const f=await fixture();const response=await f.arrival('lb_'+PARTY,{body:{device:'mobile'},cf:{country:'KR',region:'Seoul',regionCode:'11',city:'Seoul',latitude:'37.5',longitude:'127.0'}});assert.equal(response.status,200);assert.equal(response.headers.get('access-control-allow-origin'),f.env.SITE_ORIGIN);assert.equal(f.messages.length,1);const message=f.messages[0];assert.equal(message.chat_id,'12345');assert(message.text.includes('방문 곰'));assert(message.text.includes('책숲 도서관'));assert(message.text.includes('🌱 첫 방문 · 📱 모바일'));assert(message.text.includes('📍 대한민국 · 서울 (IP 추정)'));assert(!message.text.includes('37.5'));assert.equal(message.parse_mode,undefined);assert.equal(message.reply_markup.inline_keyboard[0][0].url,f.env.SITE_BASE+'library/#room=lb_'+PARTY);assert(!message.text.includes(TOKEN));
});
test('world travel, reconnect and simultaneous reports send only one notification per visitor within the quiet period',async()=>{
 const f=await fixture();const responses=await Promise.all([f.arrival(),f.arrival('aq_'+PARTY),f.arrival('lb_'+PARTY)]);assert.deepEqual(responses.map(r=>r.status).sort(),[200,202,202]);assert.equal(f.messages.length,1);assert(f.messages[0].text.includes('첫 방문'));f.state.now+=300001;f.state.record.t=f.state.now;assert.equal((await f.arrival()).status,200);assert.equal(f.messages.length,2);assert(f.messages[1].text.includes('재방문'));
});
test('different real visitors each notify, while Telegram sends reserve separate rate slots',async()=>{
 const f=await fixture();assert.equal((await f.arrival()).status,200);f.state.uid='visitor-two';f.state.record.u='visitor-two';f.state.record.n='방문 토끼';assert.equal((await f.arrival()).status,200);assert.equal(f.messages.length,2);assert(f.messages.every(m=>m.text.includes('첫 방문')));assert.deepEqual(f.sleeps,[1100]);
});
test('unconfirmed, stale and mismatched users cannot spoof arrivals',async()=>{
 for(const record of[null,{v:1,u:'someone-else',n:'가짜',t:NOW},{v:1,u:'visitor-one',n:'오래된 손님',t:NOW-46000},{v:1,u:'visitor-one',n:'미래',t:NOW+11000}]){const f=await fixture();f.state.record=record;assert.equal((await f.arrival()).status,403);assert.equal(f.messages.length,0);}
 const f=await fixture();assert.equal((await f.arrival(PARTY,{headers:{authorization:'Bearer invalid.token.signature'}})).status,401);assert.equal((await f.arrival('another-room')).status,400);assert.equal((await f.arrival(PARTY,{body:{nickname:'spoof'}})).status,400);assert.equal((await f.arrival(PARTY,{headers:{origin:'https://other-site.test'}})).status,403);assert.equal(f.messages.length,0);
});
test('delivery failure can retry and never exposes credentials in its response',async()=>{
 const f=await fixture();f.state.failTelegram=true;let response=await f.arrival();assert.equal(response.status,502);const text=await response.text();assert(!text.includes(TOKEN));assert(!text.includes(f.env.TELEGRAM_BOT_TOKEN));assert.equal(await f.env.DB.prepare('SELECT COUNT(*) AS count FROM visitor_history').first('count'),0);f.state.failTelegram=false;response=await f.arrival();assert.equal(response.status,200);assert(f.messages.at(-1).text.includes('첫 방문'));
});
test('return visits survive quiet-period cleanup, world changes and nickname changes',async()=>{
 const f=await fixture();await f.arrival();const first=await f.env.DB.prepare('SELECT first_seen FROM visitor_history').first('first_seen');
 f.state.now+=2*86400000;f.state.record.t=f.state.now;f.state.record.n='새 닉네임';
 await f.env.DB.prepare('DELETE FROM arrival_locks').run();assert.equal((await f.arrival('aq_'+PARTY)).status,200);
 assert(f.messages.at(-1).text.includes('새 닉네임'));assert(f.messages.at(-1).text.includes('재방문'));assert.equal(await f.env.DB.prepare('SELECT first_seen FROM visitor_history').first('first_seen'),first);
});
test('existing recent visitors are backfilled once without resetting earlier first-seen records',async()=>{
 const f=await fixture();await f.env.DB.prepare('INSERT INTO arrival_locks(visitor_key,acquired_at,lease) VALUES(?,?,?)').bind('existing',NOW-600000,'previous').run();
 const schema=readFileSync(new URL('./schema.sql',import.meta.url),'utf8');f.env.DB.exec(schema);assert.equal(await f.env.DB.prepare('SELECT first_seen FROM visitor_history WHERE visitor_key=?').bind('existing').first('first_seen'),NOW-600000);
 await f.env.DB.prepare('UPDATE arrival_locks SET acquired_at=? WHERE visitor_key=?').bind(NOW,'existing').run();f.env.DB.exec(schema);assert.equal(await f.env.DB.prepare('SELECT first_seen FROM visitor_history WHERE visitor_key=?').bind('existing').first('first_seen'),NOW-600000);
});
test('device hints support tablets and old clients still use request headers',async()=>{
 for(const [metadata,expected]of[
  [{body:{device:'mobile'},headers:{'user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)'}},'📱 모바일'],
  [{body:{device:'pc'}},'🖥️ PC'],
  [{headers:{'sec-ch-ua-mobile':'?1'}},'📱 모바일'],
  [{headers:{'sec-ch-ua-mobile':'?0','user-agent':'Mozilla/5.0 (Linux; Android 13; Tablet)'}},'📱 모바일'],
  [{headers:{'user-agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'}},'📱 모바일'],
  [{headers:{'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}},'🖥️ PC'],
  [{},'기기 확인 불가']
 ]){const f=await fixture();assert.equal((await f.arrival(PARTY,metadata)).status,200);assert(f.messages[0].text.includes(expected));}
 const f=await fixture();assert.equal((await f.arrival(PARTY,{body:{device:'exact-phone-model'}})).status,400);
});
test('regions use trusted coarse Cloudflare metadata and handle missing data without guessing',async()=>{
 for(const[cf,expected]of[[{country:'KR',regionCode:'41',region:'Gyeonggi-do',city:'Suwon'},'대한민국 · 경기 (IP 추정)'],[{country:'US',region:'California',city:'San Jose'},'미국 · California (IP 추정)'],[{country:'JP'},'일본 (IP 추정)'],[{country:'XX',region:'Unknown'},'지역 확인 불가'],[{country:'T1'},'지역 확인 불가'],[undefined,'지역 확인 불가']]){
  const f=await fixture();assert.equal((await f.arrival(PARTY,{cf,headers:{'cf-ipcountry':'KR','x-region':'Seoul','cf-connecting-ip':'192.0.2.99'}})).status,200);const text=f.messages[0].text;assert(text.includes('📍 '+expected));assert(!text.includes('192.0.2.99'));assert(!text.includes('Suwon'));assert(!text.includes('San Jose'));
 }
 const f=await fixture();assert.equal((await f.arrival(PARTY,{body:{region:'Seoul'}})).status,400);
});
test('the Telegram setup binds only a private chat with the exact, unexpired one-time nonce',async()=>{
 const f=await fixture(false);assert.equal((await f.arrival()).status,503);const message={message:{chat:{id:12345,type:'private'},text:'/start '+f.env.SETUP_NONCE}};
 assert.equal((await f.webhook(message,'wrong-secret')).status,404);await f.webhook({message:{...message.message,text:'/start wrong'}});await f.webhook({message:{...message.message,chat:{id:12345,type:'group'}}});assert.equal(f.messages.length,0);
 assert.equal((await f.webhook(message)).status,200);assert.equal(f.messages.length,1);assert(f.messages[0].text.includes('연결됐어요'));await f.webhook(message);assert.equal(f.messages.length,1);await f.webhook({message:{...message.message,chat:{id:54321,type:'private'}}});assert.equal(f.messages.length,1);assert.equal((await f.arrival()).status,200);assert.equal(f.messages.at(-1).chat_id,'12345');
 const health=await handleRequest(new Request('https://notify.test/health'),f.env,f.dependencies);const data=await health.json();assert.deepEqual(data,{ready:true});assert(!JSON.stringify(data).includes('12345'));
 const expired=await fixture(false);expired.state.now=NOW+700000;await expired.webhook(message);assert.equal(expired.messages.length,0);
});
test('CORS preflight allows only the game origin and expected headers',async()=>{
 const f=await fixture();const response=await handleRequest(new Request('https://notify.test/arrival',{method:'OPTIONS',headers:{origin:f.env.SITE_ORIGIN}}),f.env,f.dependencies);assert.equal(response.status,204);assert.equal(response.headers.get('access-control-allow-headers'),'authorization,content-type');
});
