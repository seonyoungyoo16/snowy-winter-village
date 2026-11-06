import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {handleRequest} from './worker.mjs';
const PARTY='0946f302b9cf8449c6970809',SESSION='0123456789abcdef01234567',TOKEN='valid.visitor_token.signature',NOW=1804266000000;
function database(){
 const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
 return{prepare(sql){return{bind(...args){return statement(sql,args);},...statement(sql,[])};}};
 function statement(sql,args){return{async first(column){const row=db.prepare(sql).get(...args);return row?(column?row[column]:row):null;},async run(){const result=db.prepare(sql).run(...args);return{meta:{changes:Number(result.changes)}};}};}
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
 return{env,state,messages,sleeps,dependencies,arrival:async(room=PARTY,overrides={})=>handleRequest(new Request('https://notify.test/arrival',{method:'POST',headers:{origin:env.SITE_ORIGIN,authorization:'Bearer '+TOKEN,'content-type':'application/json',...overrides.headers},body:JSON.stringify({room,session:SESSION,...overrides.body})}),env,dependencies),webhook:async(update,secret=env.WEBHOOK_SECRET)=>handleRequest(new Request('https://notify.test/telegram',{method:'POST',headers:{'content-type':'application/json','x-telegram-bot-api-secret-token':secret},body:JSON.stringify(update)}),env,dependencies)};
}
test('a confirmed Firebase visitor notifies the private phone chat with the correct world link',async()=>{
 const f=await fixture();const response=await f.arrival('lb_'+PARTY);assert.equal(response.status,200);assert.equal(response.headers.get('access-control-allow-origin'),f.env.SITE_ORIGIN);assert.equal(f.messages.length,1);const message=f.messages[0];assert.equal(message.chat_id,'12345');assert(message.text.includes('방문 곰'));assert(message.text.includes('책숲 도서관'));assert.equal(message.parse_mode,undefined);assert.equal(message.reply_markup.inline_keyboard[0][0].url,f.env.SITE_BASE+'library/#room=lb_'+PARTY);assert(!message.text.includes(TOKEN));
});
test('world travel, reconnect and simultaneous reports send only one notification per visitor within the quiet period',async()=>{
 const f=await fixture();const responses=await Promise.all([f.arrival(),f.arrival('aq_'+PARTY),f.arrival('lb_'+PARTY)]);assert.deepEqual(responses.map(r=>r.status).sort(),[200,202,202]);assert.equal(f.messages.length,1);f.state.now+=300001;f.state.record.t=f.state.now;assert.equal((await f.arrival()).status,200);assert.equal(f.messages.length,2);
});
test('different real visitors each notify, while Telegram sends reserve separate rate slots',async()=>{
 const f=await fixture();assert.equal((await f.arrival()).status,200);f.state.uid='visitor-two';f.state.record.u='visitor-two';f.state.record.n='방문 토끼';assert.equal((await f.arrival()).status,200);assert.equal(f.messages.length,2);assert.deepEqual(f.sleeps,[1100]);
});
test('unconfirmed, stale and mismatched users cannot spoof arrivals',async()=>{
 for(const record of[null,{v:1,u:'someone-else',n:'가짜',t:NOW},{v:1,u:'visitor-one',n:'오래된 손님',t:NOW-46000},{v:1,u:'visitor-one',n:'미래',t:NOW+11000}]){const f=await fixture();f.state.record=record;assert.equal((await f.arrival()).status,403);assert.equal(f.messages.length,0);}
 const f=await fixture();assert.equal((await f.arrival(PARTY,{headers:{authorization:'Bearer invalid.token.signature'}})).status,401);assert.equal((await f.arrival('another-room')).status,400);assert.equal((await f.arrival(PARTY,{body:{nickname:'spoof'}})).status,400);assert.equal((await f.arrival(PARTY,{headers:{origin:'https://other-site.test'}})).status,403);assert.equal(f.messages.length,0);
});
test('delivery failure can retry and never exposes credentials in its response',async()=>{
 const f=await fixture();f.state.failTelegram=true;let response=await f.arrival();assert.equal(response.status,502);const text=await response.text();assert(!text.includes(TOKEN));assert(!text.includes(f.env.TELEGRAM_BOT_TOKEN));f.state.failTelegram=false;response=await f.arrival();assert.equal(response.status,200);
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
