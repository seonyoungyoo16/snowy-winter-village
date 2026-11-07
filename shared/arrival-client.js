// The visitor reports their own confirmed join; the owner's browser is never the notification server.
const ARRIVAL_SERVICE=/* ARRIVAL_SERVICE_CONFIG */,arrivalRequests=new Map();
const CONNECTION_TIMEOUT_MS = 20000;
let connectionAttempt;

function watchVillageConnection(generation, stage = 'connect') {
 if (!ARRIVAL_SERVICE.endpoint || partyId(roomId) !== ARRIVAL_SERVICE.partyId || generation !== networkGeneration) return;
 if (connectionAttempt?.generation === generation) {
  connectionAttempt.stage = stage;
  return;
 }
 clearTimeout(connectionAttempt?.timer);
 const attempt = { generation, stage, reported: false };
 attempt.timer = setTimeout(() => {
  if (connectionAttempt === attempt && !document.hidden) {
   void reportVillageConnectionFailure(generation, attempt.stage, 'TIMEOUT');
  }
 }, CONNECTION_TIMEOUT_MS);
 connectionAttempt = attempt;
}

function finishVillageConnection(generation) {
 if (connectionAttempt?.generation !== generation) return;
 clearTimeout(connectionAttempt.timer);
 connectionAttempt = undefined;
}

function villageConnectionErrorCode(error) {
 const raw = typeof error === 'string' ? error : error?.code;
 const code = typeof raw === 'string' && !raw.startsWith('auth/') ? raw.toUpperCase() : raw;
 if (['PERMISSION_DENIED', 'UNAVAILABLE', 'DISCONNECTED', 'INVALID_TOKEN', 'EXPIRED_TOKEN', 'TOO_BIG', 'TIMEOUT', 'auth/network-request-failed', 'auth/too-many-requests', 'auth/user-token-expired'].includes(code)) return code;
 if (/^permission[ _]denied\b/i.test(error?.message || '')) return 'PERMISSION_DENIED';
 return 'UNKNOWN';
}

async function reportVillageConnectionFailure(generation, stage, error) {
 const user = networkAuth?.currentUser;
 if (!user || roomFull || navigator.onLine === false) return;
 watchVillageConnection(generation, stage);
 if (generation !== networkGeneration || connectionAttempt?.generation !== generation || connectionAttempt.reported) return;
 connectionAttempt.reported = true;
 clearTimeout(connectionAttempt.timer);

 const url = ARRIVAL_SERVICE.endpoint.replace(/\/$/, '') + '/connection-failure';
 const payload = JSON.stringify({
  room: roomId,
  event: crypto.randomUUID().replace(/-/g, ''),
  nickname,
  stage,
  code: villageConnectionErrorCode(error)
 });
 for (let retry = 0; retry < 2; retry++) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
   const idToken = await user.getIdToken();
   const response = await fetch(url, {
    method: 'POST', mode: 'cors', credentials: 'omit', keepalive: true,
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + idToken },
    body: payload, signal: controller.signal
   });
   if (response.status < 500) return;
  } catch {
   // Retry with the same event so a lost response cannot add another failure.
  } finally {
   clearTimeout(timeout);
  }
  if (!retry) await new Promise(resolve => setTimeout(resolve, 1200));
 }
}

function arrivalDevice(){
 const agent=typeof navigator==='undefined'?{}:navigator,ua=agent.userAgent||'';
 if(/Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(ua)||(/Macintosh|MacIntel/.test(ua+' '+(agent.platform||''))&&agent.maxTouchPoints>1)||agent.userAgentData?.mobile===true)return 'mobile';
 if(agent.userAgentData?.mobile===false||/Windows NT|Macintosh|X11|CrOS|Linux/i.test(ua))return 'pc';
 return 'unknown';
}
async function reportOwnArrival(generation){
 if(!ARRIVAL_SERVICE.endpoint||partyId(roomId)!==ARRIVAL_SERVICE.partyId||!networkJoined||!networkAuth?.currentUser||generation!==networkGeneration)return;
 const expectedRoom=roomId,user=networkAuth.currentUser,key='village-phone-arrival-v1:'+ARRIVAL_SERVICE.partyId+':'+user.uid;
 if(arrivalRequests.has(key))return arrivalRequests.get(key);
 try{const sent=Number(sessionStorage.getItem(key));if(Number.isFinite(sent)&&sent>0&&Date.now()-sent<300000)return;}catch{}
 const pending=(async()=>{
  for(let attempt=0;attempt<3;attempt++){
   if(!networkJoined||generation!==networkGeneration||roomId!==expectedRoom)return;
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
   try{
    const idToken=await user.getIdToken(attempt>0),response=await fetch(ARRIVAL_SERVICE.endpoint.replace(/\/$/,'')+'/arrival',{method:'POST',mode:'cors',credentials:'omit',keepalive:true,headers:{'content-type':'application/json','authorization':'Bearer '+idToken},body:JSON.stringify({room:expectedRoom,session:sessionKey,device:arrivalDevice()}),signal:controller.signal});
    if(response.ok){try{sessionStorage.setItem(key,String(Date.now()));}catch{}return;}
    if(response.status===400||response.status===403||response.status===404)return;
   }catch{}finally{clearTimeout(timeout);}
   if(attempt<2)await new Promise(resolve=>setTimeout(resolve,1200*(attempt+1)));
  }
 })();arrivalRequests.set(key,pending);try{await pending;}finally{arrivalRequests.delete(key);}
}
