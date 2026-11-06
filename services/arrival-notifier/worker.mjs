const QUIET_MS=5*60*1000;
const json=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function body(request){const text=await request.text();if(text.length>8192)throw new Error('payload');return JSON.parse(text);}
async function telegram(env,fetchImpl,method,payload){
 const result=await fetchImpl('https://api.telegram.org/bot'+env.TELEGRAM_BOT_TOKEN+'/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(8000)});
 let data;try{data=await result.json();}catch{throw new Error('telegram');}if(!result.ok||!data.ok)throw new Error('telegram');return data.result;
}
const ready=env=>Boolean(env.DB&&env.TELEGRAM_BOT_TOKEN&&env.WEBHOOK_SECRET);
function roomDetails(room,env){
 if(room===env.PARTY_ID)return{name:'겨울 마을',path:''};
 if(room==='aq_'+env.PARTY_ID)return{name:'물결 수족관',path:'aquarium/'};
 if(room==='lb_'+env.PARTY_ID)return{name:'책숲 도서관',path:'library/'};
 return null;
}
async function bindTelegram(request,env,fetchImpl,now){
 if(!ready(env)||request.headers.get('x-telegram-bot-api-secret-token')!==env.WEBHOOK_SECRET)return json({error:'not_found'},404);
 const update=await body(request),message=update.message,chat=message?.chat;
 if(chat?.type!=='private'||!Number.isSafeInteger(chat.id)||message.text!=='/start '+env.SETUP_NONCE||now>Number(env.SETUP_EXPIRES))return json({ok:true});
 const inserted=await env.DB.prepare("INSERT OR IGNORE INTO settings(key,value) VALUES('telegram_chat',?)").bind(String(chat.id)).run();
 const recipient=await env.DB.prepare("SELECT value FROM settings WHERE key='telegram_chat'").first('value');
 if(recipient!==String(chat.id))return json({ok:true});
 const welcomed=await env.DB.prepare("SELECT value FROM settings WHERE key='telegram_welcomed'").first('value');
 if(!welcomed){await telegram(env,fetchImpl,'sendMessage',{chat_id:recipient,text:'작은 마을 알림이 연결됐어요 🌿\n친구가 들어오면 이 대화로 알려드릴게요. PC와 게임 탭을 꺼두어도 받을 수 있어요.'});await env.DB.prepare("INSERT OR REPLACE INTO settings(key,value) VALUES('telegram_welcomed','yes')").run();}
 return json({ok:true,connected:inserted.meta?.changes===1});
}
async function arrival(request,env,fetchImpl,now,sleep){
 if(!ready(env))return json({error:'not_ready'},503);
 const chat=await env.DB.prepare("SELECT value FROM settings WHERE key='telegram_chat'").first('value');if(!chat)return json({error:'not_ready'},503);
 const input=await body(request),place=roomDetails(input.room,env);
 if(!place||!/^[a-f0-9]{24}$/.test(input.session||'')||Object.keys(input).some(k=>!['room','session'].includes(k)))return json({error:'invalid_visit'},400);
 const auth=request.headers.get('authorization')||'',match=/^Bearer ([A-Za-z0-9_.-]{20,8192})$/.exec(auth);if(!match)return json({error:'sign_in_required'},401);
 const idToken=match[1];
 const lookup=await fetchImpl('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+encodeURIComponent(env.PROJECT_API_KEY),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({idToken}),signal:AbortSignal.timeout(8000)});
 if(!lookup.ok)return json({error:'sign_in_required'},lookup.status>=500?503:401);
 const identity=await lookup.json(),uid=identity.users?.[0]?.localId;if(typeof uid!=='string'||!uid)return json({error:'sign_in_required'},401);
 const presenceURL=new URL('/rooms/'+input.room+'/players/'+input.session+'.json',env.DATABASE_URL);presenceURL.searchParams.set('auth',idToken);
 const result=await fetchImpl(presenceURL,{signal:AbortSignal.timeout(8000)});if(!result.ok)return json({error:'visit_not_confirmed'},403);
 const visitor=await result.json();
 if(!visitor||visitor.u!==uid||visitor.v!==1||typeof visitor.n!=='string'||!visitor.n.trim()||visitor.n.length>12||!Number.isFinite(visitor.t)||now-visitor.t>45000||visitor.t>now+10000)return json({error:'visit_not_confirmed'},403);
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(env.PARTY_ID+':'+uid)),visitorKey=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join(''),lease=crypto.randomUUID();
 const claim=await env.DB.prepare('INSERT INTO arrival_locks(visitor_key,acquired_at,lease) VALUES(?,?,?) ON CONFLICT(visitor_key) DO UPDATE SET acquired_at=excluded.acquired_at,lease=excluded.lease WHERE arrival_locks.acquired_at<? RETURNING lease').bind(visitorKey,now,lease,now-QUIET_MS).first();
 if(!claim)return json({status:'already_received'},202);
 try{
  const slot=await env.DB.prepare('INSERT INTO send_budget(id,last_at) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET last_at=MAX(send_budget.last_at+1100,excluded.last_at) RETURNING last_at').bind(now).first();
  if(slot.last_at-now>5000){await env.DB.prepare('DELETE FROM arrival_locks WHERE visitor_key=? AND lease=?').bind(visitorKey,lease).run();return json({error:'try_later'},429,{'retry-after':'5'});}
  if(slot.last_at>now)await sleep(slot.last_at-now);
  const name=visitor.n.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,12),url=new URL(place.path,env.SITE_BASE);url.hash='room='+input.room;
  const koreaTime=new Date(now+9*60*60*1000).toISOString().slice(0,16).replace('T',' ')+' KST';
  await telegram(env,fetchImpl,'sendMessage',{chat_id:chat,text:'마을에 손님이 왔어요 🌿\n'+name+' 님 · '+place.name+'\n'+koreaTime,reply_markup:{inline_keyboard:[[{text:'같이 만나러 가기',url:url.href}]]}});
  await env.DB.prepare('DELETE FROM arrival_locks WHERE acquired_at<?').bind(now-86400000).run();return json({status:'sent'});
 }catch{await env.DB.prepare('DELETE FROM arrival_locks WHERE visitor_key=? AND lease=?').bind(visitorKey,lease).run();return json({error:'delivery_retry'},502);}
}
export async function handleRequest(request,env,dependencies={}){
 const fetchImpl=dependencies.fetch||fetch,now=(dependencies.now||Date.now)(),sleep=dependencies.sleep||pause,path=new URL(request.url).pathname,origin=request.headers.get('origin'),cors=origin===env.SITE_ORIGIN?{'access-control-allow-origin':origin,'vary':'Origin'}:{};
 try{
  if(path==='/health'&&request.method==='GET'){const connected=ready(env)&&Boolean(await env.DB.prepare("SELECT value FROM settings WHERE key='telegram_chat'").first('value'));return json({ready:connected});}
  if(path==='/telegram'&&request.method==='POST')return await bindTelegram(request,env,fetchImpl,now);
  if(path!=='/arrival')return json({error:'not_found'},404);
  if(origin!==env.SITE_ORIGIN)return json({error:'origin_not_allowed'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...cors,'access-control-allow-methods':'POST','access-control-allow-headers':'authorization,content-type','access-control-max-age':'600'}});
  if(request.method!=='POST')return json({error:'method_not_allowed'},405,cors);
  const response=await arrival(request,env,fetchImpl,now,sleep);for(const[key,value]of Object.entries(cors))response.headers.set(key,value);return response;
 }catch{return json({error:'request_failed'},503,cors);}
}
export default{fetch:handleRequest};
