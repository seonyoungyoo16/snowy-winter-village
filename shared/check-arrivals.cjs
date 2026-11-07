const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const source=fs.readFileSync(__dirname+'/arrival-client.js','utf8'),PARTY='0946f302b9cf8449c6970809';
function fixture(config={endpoint:'https://notify.example.test',partyId:PARTY}){
 const requests=[],storage=new Map();let tokens=0,now=1000000,response=200;
 const c={Date:{now:()=>now},Map,JSON,Number,Promise,AbortController,navigator:{userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'},fetch:async(url,options)=>{requests.push({url,options});return{ok:response>=200&&response<300,status:response};},setTimeout:(fn,ms)=>{if(ms<10000)queueMicrotask(fn);return 0;},clearTimeout(){},sessionStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},networkJoined:true,networkGeneration:1,roomId:PARTY,sessionKey:'0123456789abcdef01234567',partyId:id=>id.replace(/^(aq_|lb_)/,''),networkAuth:{currentUser:{uid:'visitor-one',getIdToken:async()=>{tokens++;return'private-user-id-token';}}}};
 vm.createContext(c);vm.runInContext(source.replace('/* ARRIVAL_SERVICE_CONFIG */',JSON.stringify(config))+';globalThis.report=reportOwnArrival;',c);
 const timers = new Map();
 let timerId = 0;
 const schedule = c.setTimeout;
 Object.assign(c, {
  crypto, document: { hidden: false }, roomFull: false, nickname: '귤이 친구',
  setTimeout(fn, ms) {
   if (ms < 10000) return schedule(fn, ms);
   timers.set(++timerId, { fn, ms });
   return timerId;
  },
  clearTimeout(id) { timers.delete(id); }
 });
 return{c,requests,timers,tokens:()=>tokens,setTime:v=>now=v,setResponse:v=>response=v};
}
(async()=>{
 const disabled=fixture({endpoint:'',partyId:PARTY});await disabled.c.report(1);assert.equal(disabled.requests.length,0);assert.equal(disabled.tokens(),0);
 const f=fixture();await Promise.all([f.c.report(1),f.c.report(1)]);assert.equal(f.requests.length,1);const req=f.requests[0];assert.equal(req.url,'https://notify.example.test/arrival');assert.equal(req.options.credentials,'omit');assert.equal(req.options.keepalive,true);assert.equal(req.options.headers.authorization,'Bearer private-user-id-token');assert.deepEqual(Object.keys(JSON.parse(req.options.body)).sort(),['room','session']);assert(!req.options.body.includes('private-user-id-token'));
 f.c.roomId='aq_'+PARTY;await f.c.report(1);assert.equal(f.requests.length,2);assert.equal(JSON.parse(f.requests[1].options.body).room,'aq_'+PARTY);
 await f.c.report(1);assert.equal(f.requests.length,2);f.setTime(1300001);await f.c.report(1);assert.equal(f.requests.length,3);
 f.c.roomId='lb_untracked-room';await f.c.report(1);assert.equal(f.requests.length,3);f.c.roomId=PARTY;f.c.networkJoined=false;await f.c.report(1);assert.equal(f.requests.length,3);
 const failed=fixture();failed.setResponse(503);await failed.c.report(1);assert.equal(failed.requests.length,3);failed.setResponse(200);await failed.c.report(1);assert.equal(failed.requests.length,4);
 console.log('PASS: visit reporting counts different spaces, deduplicates a space, retries, and only sends room and session.');
 const text=fs.readFileSync(__dirname+'/../winter/multiplayer.js','utf8'),start=text.indexOf('async function registerPresence('),end=text.indexOf('\nasync function startNetwork',start),events=[];let confirm;
 const c={Date,Promise,networkGeneration:1,networkConnected:true,roomFull:false,networkJoined:false,networkDB:{},selfRef:'self',arrivalTracker:{seed(){}},roomId:PARTY,sessionKey:'0123456789abcdef01234567',serverOffset:0,joinedAt:0,mode:'idle',path:[],player:{position:{x:0,z:7}},MAX_VISITORS:4,STALE_MS:45000,validState:()=>true,updateNetworkStatus(){},reconcileRoom(){},toast(){},console,watchVillageConnection(){},finishVillageConnection(){},reportOwnArrival:()=>events.push('notified'),publishState:()=>new Promise(resolve=>{confirm=resolve;events.push('write-started');}),window:{WinterFirebase:{ref:(_,path)=>path,get:async()=>({val:()=>null}),onDisconnect:()=>({remove:async()=>events.push('cleanup-reserved')})}}};vm.createContext(c);vm.runInContext(text.slice(start,end),c);await c.registerPresence(1);assert.deepEqual(events,['cleanup-reserved','write-started']);confirm();await Promise.resolve();await Promise.resolve();assert.deepEqual(events,['cleanup-reserved','write-started','notified']);
 console.log('PASS: the actual presence admission flow waits for its Firebase write to finish before reporting an arrival.');

 const probe = fixture();
 probe.c.watchVillageConnection(1);
 probe.c.finishVillageConnection(1);
 assert.equal(probe.timers.size, 0, 'a successful connection cancels the timeout');
 probe.c.watchVillageConnection(1);
 probe.c.watchVillageConnection(1, 'register');
 const timeout = [...probe.timers.values()].find(timer => timer.ms === 20000);
 assert(timeout);
 timeout.fn();
 await probe.c.reportVillageConnectionFailure(1);
 assert.equal(probe.requests.length, 1, 'a timeout and a later callback report only one incident');
 assert.match(probe.requests[0].url, /\/connection-failure$/);
 const timeoutReport = JSON.parse(probe.requests[0].options.body);
 assert.deepEqual(Object.keys(timeoutReport).sort(), ['code', 'event', 'nickname', 'room', 'stage']);
 assert.equal(timeoutReport.nickname, '귤이 친구');
 assert.equal(timeoutReport.stage, 'register');
 assert.equal(timeoutReport.code, 'TIMEOUT');
 probe.c.networkGeneration++;
 probe.c.roomFull = true;
 await probe.c.reportVillageConnectionFailure(2);
 probe.c.roomFull = false;
 probe.c.navigator.onLine = false;
 await probe.c.reportVillageConnectionFailure(2);
 probe.c.navigator.onLine = true;
 await probe.c.reportVillageConnectionFailure(1);
 assert.equal(probe.requests.length, 1, 'full rooms, offline devices and superseded attempts are excluded');

 const retry = fixture();
 retry.setResponse(502);
 await retry.c.reportVillageConnectionFailure(1, 'sync', { code: 'permission_denied', message: 'Private error detail' });
 assert.equal(retry.requests.length, 2);
 assert.equal(retry.requests[0].options.body, retry.requests[1].options.body);
 const rejectedReport = JSON.parse(retry.requests[0].options.body);
 assert.equal(rejectedReport.stage, 'sync');
 assert.equal(rejectedReport.code, 'PERMISSION_DENIED');
 assert(!retry.requests[0].options.body.includes('Private error detail'));
 console.log('PASS: connection reporting cancels successful attempts, coalesces timeout and callback errors, and preserves the event ID on retry.');
})().catch(error=>{console.error(error);process.exitCode=1;});
