const QUIET_MS=5*60*1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const VISIT_RETENTION_MS = 7 * DAY_MS;
const FAILURE_WINDOW_MS = 5 * 60 * 1000;
const FAILURE_THRESHOLD = 5;
const FAILURE_ALERT_COOLDOWN_MS = 15 * 60 * 1000;
const FAILURE_STAGES = {
 connect: '연결 대기', register: '입장 등록', presence: '접속 상태 저장',
 sync: '친구 동기화', setup: '연결 초기화', unknown: '단계 미확인'
};
const FAILURE_CAUSES = {
 PERMISSION_DENIED: '접근 권한 거부', UNAVAILABLE: '서비스 응답 불가',
 DISCONNECTED: '연결 끊김', INVALID_TOKEN: '인증 토큰 거부',
 EXPIRED_TOKEN: '인증 토큰 만료', TOO_BIG: '데이터 크기 제한 초과',
 'auth/network-request-failed': '인증 서버에 연결하지 못함',
 'auth/too-many-requests': '인증 요청 제한에 걸림',
 'auth/user-token-expired': '인증 토큰 만료',
 TIMEOUT: '20초 내 연결 미완료', UNKNOWN: '원인 미확인'
};
const json=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const messageEmoji = /[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Modifier}\u200d\ufe0e\ufe0f\u20e3\u{e0020}-\u{e007f}]/gu;
async function body(request){const text=await request.text();if(text.length>8192)throw new Error('payload');return JSON.parse(text);}
async function telegram(env,fetchImpl,method,payload){
 const result=await fetchImpl('https://api.telegram.org/bot'+env.TELEGRAM_BOT_TOKEN+'/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(8000)});
 let data;try{data=await result.json();}catch{throw new Error('telegram');}if(!result.ok||!data.ok)throw new Error('telegram');return data.result;
}
async function waitForTelegramSlot(env, now, sleep) {
 const slot = await env.DB.prepare('INSERT INTO send_budget(id,last_at) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET last_at=MAX(send_budget.last_at+1100,excluded.last_at) RETURNING last_at').bind(now).first();
 if (slot.last_at - now > 5000) return false;
 if (slot.last_at > now) await sleep(slot.last_at - now);
 return true;
}
async function authenticateVisitor(request, env, fetchImpl) {
 const authorization = request.headers.get('authorization') || '';
 const match = /^Bearer ([A-Za-z0-9_.-]{20,8192})$/.exec(authorization);
 if (!match) return { status: 401 };
 const idToken = match[1];
 const lookup = await fetchImpl('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(env.PROJECT_API_KEY), {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ idToken }), signal: AbortSignal.timeout(8000)
 });
 if (!lookup.ok) return { status: lookup.status >= 500 ? 503 : 401 };
 const identity = await lookup.json();
 const uid = identity.users?.[0]?.localId;
 return typeof uid === 'string' && uid ? { uid, idToken } : { status: 401 };
}
async function hashKey(value) {
 const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
 return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
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
 if(!welcomed){await telegram(env,fetchImpl,'sendMessage',{chat_id:recipient,text:'🌿 작은 마을 알림이 연결됐어요\n매일 오전 9시(한국 시간)에 전날 방문 요약을 보내드려요. 반복 접속 오류는 바로 알려드려요.'});await env.DB.prepare("INSERT OR REPLACE INTO settings(key,value) VALUES('telegram_welcomed','yes')").run();}
 return json({ok:true,connected:inserted.meta?.changes===1});
}
async function arrival(request,env,fetchImpl,now){
 if(!ready(env))return json({error:'not_ready'},503);
 const input=await body(request);
 if(!roomDetails(input?.room,env)||typeof input.session!=='string'||!/^[a-f0-9]{24}$/.test(input.session)||Object.keys(input).some(k=>!['room','session','device'].includes(k))||(input.device!==undefined&&!['mobile','pc','unknown'].includes(input.device)))return json({error:'invalid_visit'},400);
 const {uid,idToken,status}=await authenticateVisitor(request,env,fetchImpl);
 if(status)return json({error:'sign_in_required'},status);
 const presenceURL=new URL('/rooms/'+input.room+'/players/'+input.session+'.json',env.DATABASE_URL);presenceURL.searchParams.set('auth',idToken);
 const result=await fetchImpl(presenceURL,{signal:AbortSignal.timeout(8000)});if(!result.ok)return json({error:'visit_not_confirmed'},403);
 const visitor=await result.json();
 if(!visitor||visitor.u!==uid||visitor.v!==1||typeof visitor.n!=='string'||!visitor.n.trim()||visitor.n.length>12||!Number.isFinite(visitor.t)||now-visitor.t>45000||visitor.t>now+10000)return json({error:'visit_not_confirmed'},403);
 const room = input.room;
 const visitorKey = await hashKey(env.PARTY_ID + ':' + uid);
 const sessionKey = await hashKey(uid + ':' + input.session);
 const [event] = await env.DB.batch([
  env.DB.prepare(`
   INSERT OR IGNORE INTO visit_events(room,session_key,visitor_key,visited_at)
   SELECT ?,?,?,? WHERE NOT EXISTS (
    SELECT 1 FROM visit_events WHERE room=? AND visitor_key=? AND visited_at>?
   )
  `).bind(room,sessionKey,visitorKey,now,room,visitorKey,now-QUIET_MS),
  env.DB.prepare(`
   INSERT INTO visitor_history(visitor_key,first_seen) VALUES(?,?)
   ON CONFLICT(visitor_key) DO UPDATE SET first_seen=excluded.first_seen
   WHERE visitor_history.first_seen>excluded.first_seen
  `).bind(visitorKey,now)
 ]);
 return event.meta.changes ? json({status:'recorded'}) : json({status:'already_received'},202);
}

export async function handleScheduled(controller, env, dependencies = {}) {
 if (!ready(env)) return;
 const fetchImpl = dependencies.fetch || fetch;
 const now = (dependencies.now || Date.now)();
 const sleep = dependencies.sleep || pause;
 const end = Math.floor((controller.scheduledTime + KST_OFFSET_MS) / DAY_MS) * DAY_MS - KST_OFFSET_MS;
 const start = end - DAY_MS;
 const startedAt = Number(await env.DB.prepare("SELECT value FROM settings WHERE key='visit_summary_started_at'").first('value'));
 if (!startedAt || startedAt >= end) return;
 const chat = await env.DB.prepare("SELECT value FROM settings WHERE key='telegram_chat'").first('value');
 if (!chat) return;

 const day = new Date(start + KST_OFFSET_MS).toISOString().slice(0,10);
 const key = 'visit_digest:' + day;
 const lease = crypto.randomUUID();
 const claim = await env.DB.prepare('INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)').bind(key,lease).run();
 if (!claim.meta.changes) return;
 try {
  const counts = await env.DB.prepare(`
   SELECT COUNT(*) AS visits, COUNT(DISTINCT v.visitor_key) AS visitors,
    COUNT(DISTINCT CASE WHEN h.first_seen>=? AND h.first_seen<? THEN v.visitor_key END) AS first_visitors,
    COALESCE(SUM(v.room=?),0) AS winter,
    COALESCE(SUM(v.room=?),0) AS aquarium,
    COALESCE(SUM(v.room=?),0) AS library
   FROM visit_events v JOIN visitor_history h ON h.visitor_key=v.visitor_key
   WHERE v.visited_at>=? AND v.visited_at<?
  `).bind(start,end,env.PARTY_ID,'aq_'+env.PARTY_ID,'lb_'+env.PARTY_ID,start,end).first();
  const lines = [
   '📋 하루 방문 요약', day + ' (한국 시간)',
   `방문자 ${counts.visitors}명 · 첫 방문 ${counts.first_visitors}명 · 재방문 ${counts.visitors-counts.first_visitors}명`,
   `공간 입장 합계 ${counts.visits}회`,
   `겨울 마을 ${counts.winter}회 · 물결 수족관 ${counts.aquarium}회 · 책숲 도서관 ${counts.library}회`
  ];
  if (startedAt > start) lines.push('집계 시작 ' + new Date(startedAt + KST_OFFSET_MS).toISOString().slice(11,16));
  await env.DB.prepare('DELETE FROM visit_events WHERE visited_at<?').bind(end-VISIT_RETENTION_MS).run();
  if (!await waitForTelegramSlot(env, now, sleep)) throw new Error('telegram_busy');
  await telegram(env, fetchImpl, 'sendMessage', {chat_id:chat,text:lines.join('\n')});
 } catch (error) {
  await env.DB.prepare('DELETE FROM settings WHERE key=? AND value=?').bind(key,lease).run();
  throw error;
 }
}
async function connectionFailure(request, env, fetchImpl, now, sleep) {
 if (!ready(env)) return json({ error: 'not_ready' }, 503);
 const input = await body(request);
 const place = roomDetails(input?.room, env);
 if (!place || typeof input.event !== 'string' || !/^[a-f0-9]{32}$/.test(input.event) ||
     Object.keys(input).some(key => !['room', 'event', 'nickname', 'stage', 'code'].includes(key))) {
  return json({ error: 'invalid_failure' }, 400);
 }
 const { uid, status } = await authenticateVisitor(request, env, fetchImpl);
 if (status) return json({ error: 'sign_in_required' }, status);

 const room = input.room;
 const nickname = typeof input.nickname === 'string'
  ? input.nickname.replace(/[\u0000-\u001f\u007f-\u009f\u2028-\u202e\u2066-\u2069]/g, '').trim().slice(0, 12) || null
  : null;
 const stage = typeof input.stage === 'string' && Object.hasOwn(FAILURE_STAGES, input.stage) ? input.stage : 'unknown';
 const code = typeof input.code === 'string' && Object.hasOwn(FAILURE_CAUSES, input.code) ? input.code : 'UNKNOWN';
 const eventKey = await hashKey(room + ':' + uid + ':' + input.event);
 await env.DB.prepare(`
  INSERT OR IGNORE INTO connection_failures(room,event_key,occurred_at,nickname,stage,code)
  VALUES(?,?,?,?,?,?)
 `).bind(room,eventKey,now,nickname,stage,code).run();
 await env.DB.prepare('DELETE FROM connection_failures WHERE room=? AND occurred_at<?').bind(room,now-86400000).run();
 const { results: details } = await env.DB.prepare(`
  SELECT nickname, stage, code, COUNT(*) AS count, SUM(COUNT(*)) OVER () AS total
  FROM connection_failures WHERE room=? AND occurred_at>?
  GROUP BY nickname, stage, code
  ORDER BY count DESC, MAX(occurred_at) DESC, nickname, stage, code
  LIMIT 12
 `).bind(room,now-FAILURE_WINDOW_MS).all();
 const failures = details[0]?.total ?? 0;
 if (failures < FAILURE_THRESHOLD) return json({ status: 'recorded' }, 202);

 const chat = await env.DB.prepare("SELECT value FROM settings WHERE key='telegram_chat'").first('value');
 if (!chat) return json({ status: 'recorded' }, 202);
 const claim = await env.DB.prepare(`
  INSERT INTO connection_alerts(room,acquired_at,lease) VALUES(?,?,?)
  ON CONFLICT(room) DO UPDATE SET acquired_at=excluded.acquired_at, lease=excluded.lease
  WHERE connection_alerts.acquired_at<=? RETURNING lease
 `).bind(room, now, eventKey, now - FAILURE_ALERT_COOLDOWN_MS).first();
 if (!claim) return json({ status: 'recorded' }, 202);

 try {
  if (!await waitForTelegramSlot(env, now, sleep)) throw new Error('telegram_busy');
  const url = new URL(place.path, env.SITE_BASE);
  url.hash = 'room=' + room;
  const lines = details.map(({ nickname, stage, code, count }) => {
   const cause = FAILURE_CAUSES[code];
   const label = code === 'UNKNOWN' || code === 'TIMEOUT' ? cause : `${cause} (${code})`;
   const name = nickname?.replace(messageEmoji, '').trim() || '닉네임 미확인';
   return `• ${name} · ${FAILURE_STAGES[stage]} · ${label} · ${count}회`;
  });
  const remaining = failures - details.reduce((sum, row) => sum + row.count, 0);
  if (remaining > 0) lines.push(`• 그 외 ${remaining}회`);
  await telegram(env, fetchImpl, 'sendMessage', {
   chat_id: chat,
   text: `🚨 반복 접속 오류\n${place.name}\n최근 5분 동안 연결 실패 ${failures}회\n\n${lines.join('\n')}`,
   link_preview_options: { is_disabled: true },
   reply_markup: { inline_keyboard: [[{ text: '해당 공간 열기', url: url.href }]] }
  });
  return json({ status: 'alert_sent' });
 } catch {
  await env.DB.prepare('DELETE FROM connection_alerts WHERE room=? AND lease=?').bind(room,eventKey).run();
  return json({ error: 'delivery_retry' }, 502);
 }
}
export async function handleRequest(request,env,dependencies={}){
 const fetchImpl=dependencies.fetch||fetch,now=(dependencies.now||Date.now)(),sleep=dependencies.sleep||pause,path=new URL(request.url).pathname,origin=request.headers.get('origin'),cors=origin===env.SITE_ORIGIN?{'access-control-allow-origin':origin,'vary':'Origin'}:{};
 try{
  if(path==='/health'&&request.method==='GET'){const connected=ready(env)&&Boolean(await env.DB.prepare("SELECT value FROM settings WHERE key='telegram_chat'").first('value'));return json({ready:connected});}
  if(path==='/telegram'&&request.method==='POST')return await bindTelegram(request,env,fetchImpl,now);
  if(path!=='/arrival'&&path!=='/connection-failure')return json({error:'not_found'},404);
  if(origin!==env.SITE_ORIGIN)return json({error:'origin_not_allowed'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...cors,'access-control-allow-methods':'POST','access-control-allow-headers':'authorization,content-type','access-control-max-age':'600'}});
  if(request.method!=='POST')return json({error:'method_not_allowed'},405,cors);
  const handler=path==='/arrival'?arrival:connectionFailure;
  const response=await handler(request,env,fetchImpl,now,sleep);for(const[key,value]of Object.entries(cors))response.headers.set(key,value);return response;
 }catch{return json({error:'request_failed'},503,cors);}
}
export default{fetch:handleRequest,scheduled:handleScheduled};
