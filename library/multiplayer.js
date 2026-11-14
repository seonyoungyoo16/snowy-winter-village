// Only virtual visitor state leaves this browser; lb_ keeps this world's coordinates separate.
function createArrivalTracker(now=()=>Date.now(),quietMs=30000){
 const members=new Map(),departures=new Map(),announced=new Map();let ready=false;
 return{
  pause(){ready=false;},
  seed(entries){members.clear();for(const[id,data]of entries)members.set(id,data.u);ready=true;},
  reset(){members.clear();departures.clear();announced.clear();ready=false;},
  observe(entries){
   if(!ready)return[];
   const time=now(),present=new Map(entries.map(([id,data])=>[id,data.u])),arrivals=[];
   for(const[id,owner]of members)if(!present.has(id))departures.set(owner,time);
   for(const[id,data]of entries){
    if(members.has(id))continue;
    const sameOwner=Array.from(members.values()).includes(data.u)||arrivals.some(item=>item.data.u===data.u);
    const returned=departures.has(data.u)&&time-departures.get(data.u)<quietMs;
    const repeated=announced.has(data.u)&&time-announced.get(data.u)<quietMs;
    if(!sameOwner&&!returned&&!repeated){arrivals.push({id,data});announced.set(data.u,time);}
   }
   members.clear();for(const[id,owner]of present)members.set(id,owner);return arrivals;
  }
 };
}
/* WORLD_TRAVEL_CODE */
const firebaseConfig = /* FIREBASE_CONFIG */;
const MAX_VISITORS = 4, STALE_MS = 45000;
const remotePlayers = new Map(), roomMembers = new Map();
const activityNames={idle:'책숲 구경 중',walk:'산책 중',rolling:'책 읽는 중',warm:'창가에서 쉬는 중',sled:'책갈피 남기는 중',celebrate:'인사하는 중'};
function token(){const bytes=new Uint8Array(12);crypto.getRandomValues(bytes);return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
function libraryRoom(){return 'lb_'+token();}
const villageInvitation=!incomingWorldTravel&&/^(?:aq_|lb_)?[a-f0-9]{24}$/.test(new URLSearchParams(location.hash.slice(1)).get("room")||"");
let roomId=readRoom(),sessionKey=token(),networkDB=null,networkAuth=null,selfRef=null,disconnectJob=null;
let networkStarting=false,networkConnected=false,networkJoined=false,roomFull=false,networkGeneration=0,serverOffset=0;
let lastNetworkSend=0,lastNetworkBody='',lastNetworkMovement=false,networkSequence=0,joinedAt=0,networkStops=[];
const arrivalTracker=createArrivalTracker(),DESKTOP_ALERT_KEY='little-lantern-library-desktop-alerts-v1',DESKTOP_DEDUPE_KEY='little-lantern-library-last-desktop-alert-v1';
let desktopAlertsEnabled=false,desktopUnsupported=false;
try{desktopAlertsEnabled=localStorage.getItem(DESKTOP_ALERT_KEY)==='on';}catch{}
history.replaceState(null,'',location.pathname+location.search+'#room='+roomId);
function inviteURL(){return location.href.split('#')[0]+'#room='+roomId;}
function roundState(v){return Math.round(v*1000)/1000;}
function desktopPermission(){try{return window.isSecureContext&&typeof window.Notification==='function'?window.Notification.permission:'unsupported';}catch{return'unsupported';}}
function refreshDesktopAlerts(){
 const permission=desktopUnsupported?'unsupported':desktopPermission(),enabled=desktopAlertsEnabled&&permission==='granted',button=$('desktop-alerts');
 button.disabled=permission==='unsupported';button.setAttribute('aria-pressed',String(enabled));
 $('desktop-alerts-text').textContent=permission==='unsupported'?'이 브라우저는 데스크톱 알림을 지원하지 않아요':permission==='denied'?'데스크톱 알림이 차단되어 있어요':enabled?'데스크톱 알림 끄기':'데스크톱 알림 켜기';
 $('desktop-alerts-note').textContent=permission==='unsupported'?'게임 안에서는 친구 입장을 알려드려요. 데스크톱 Chrome에서도 열 수 있어요.':permission==='denied'?'주소창의 사이트 설정에서 알림을 허용할 수 있어요. 게임 안 알림은 계속 보여요.':'게임 탭을 열어두면 다른 창을 보는 동안에도 알려줘요.';
}
function storeDesktopPreference(enabled){desktopAlertsEnabled=enabled;try{localStorage.setItem(DESKTOP_ALERT_KEY,enabled?'on':'off');}catch{}refreshDesktopAlerts();}
function showDesktopAlert(title,body,tag){
 if(!desktopAlertsEnabled||desktopPermission()!=='granted')return false;
 try{const notice=new window.Notification(title,{body,tag,silent:true});notice.onclick=()=>{window.focus();notice.close();};setTimeout(()=>notice.close(),12000);return true;}
 catch{desktopUnsupported=true;storeDesktopPreference(false);return false;}
}
function announceArrival(id,data){
 const name=data.n;toast(name+' 님이 도서관에 왔어요 ✧');
 if(!desktopAlertsEnabled||desktopPermission()!=='granted')return;
 const key=roomId+':'+id,time=Date.now();
 try{const previous=JSON.parse(localStorage.getItem(DESKTOP_DEDUPE_KEY)||'null');if(previous&&previous.key===key&&time-previous.time<30000)return;localStorage.setItem(DESKTOP_DEDUPE_KEY,JSON.stringify({key,time}));}catch{}
 showDesktopAlert('책숲 도서관',name+' 님이 도서관에 왔어요. 같이 산책해요!', 'library-arrival-'+roomId+'-'+data.u);
}
async function toggleDesktopAlerts(){
 const permission=desktopPermission();
 if(permission==='unsupported'||desktopUnsupported){refreshDesktopAlerts();return;}
 if(desktopAlertsEnabled&&permission==='granted'){storeDesktopPreference(false);toast('데스크톱 알림을 껐어요');return;}
 if(permission==='denied'){refreshDesktopAlerts();toast('주소창의 사이트 설정에서 알림을 허용해 주세요');return;}
 try{
  const result=permission==='granted'?'granted':await window.Notification.requestPermission();
  storeDesktopPreference(result==='granted');
  if(result==='granted'){
   const shown=showDesktopAlert('책숲 도서관 알림을 켰어요','같은 도서관에 친구가 들어오면 알려드릴게요.','library-alerts-enabled');
   toast(shown?'친구 입장 알림을 켰어요':'게임 안에서는 친구 입장을 알려드려요');
  }else toast(result==='denied'?'게임 안에서는 친구 입장을 알려드려요':'알림 허용을 선택하면 데스크톱에서도 알려드려요');
 }catch{storeDesktopPreference(false);toast('게임 안에서는 친구 입장을 알려드려요');}
}
function updateNetworkStatus(message){
 const count=networkJoined?remotePlayers.size+1:1;
 $('village-state').textContent=message||(networkJoined?(count>1?count+'명이 함께':'친구를 기다려요'):roomFull?'도서관이 가득해요':'혼자 산책 중');
 $('connection-state').textContent=networkJoined?'연결됨':networkStarting?'연결 중':'연결 대기';
 $('status').dataset.connected=String(networkJoined);
 const members=Array.from(remotePlayers.values()).map(p=>p.data.n+' · '+visitorActivity(p.data));
 const roster=[nickname+' · 나',...members].join(' / ');
 if($('online-players').textContent!==roster)$('online-players').textContent=roster;
 $('friend-roster').textContent=roster;
 $('new-room').hidden=!roomFull;
 if(typeof villageShell!=='undefined')villageShell.connectionChanged();
 updateWorldTravelUI();
}
function visitorActivity(data){return isCatWake(data)?'잠든 귤이를 깨운 중':isCatInteraction(data)?CAT_ACTIONS[catActionKind(data.b)].status:activityNames[data.m];}
function validState(data){return data&&data.v===1&&typeof data.u==='string'&&typeof data.n==='string'&&data.n.length>0&&data.n.length<=12&&Number.isInteger(data.k)&&data.k>=0&&data.k<=2&&['x','y','z','a','p','b','t','j','s'].every(k=>Number.isFinite(data[k]))&&Math.abs(data.x)<=26&&Math.abs(data.z)<=26&&data.y>=-1&&data.y<=10&&Math.abs(data.a)<=3.142&&Math.abs(data.p)<=1.6&&data.b>=0&&data.b<=.7&&Object.hasOwn(activityNames,data.m);}
function disposeActor(root){root.traverse(o=>{if(!o.isMesh)return;if(!Object.values(geom).includes(o.geometry))o.geometry.dispose();});scene.remove(root);}
function removePeer(id){const peer=remotePlayers.get(id);if(!peer)return;villagePlay.drop(peer);disposeActor(peer.actor.root);scene.remove(peer.shadow);peer.label.material.map.dispose();peer.label.material.dispose();remotePlayers.delete(id);}
function clearPeers(){for(const id of Array.from(remotePlayers.keys()))removePeer(id);}
function makePeer(id,data){
 const actor=avatar(data.k,peerLook(data.u));actor.lookSig=peerLookSig(data.u);actor.root.position.set(data.x,data.y,data.z);actor.root.rotation.set(data.p,data.a,0);scene.add(actor.root);
 const label=nameSprite(data.n);label.scale.set(2.15,.403,1);label.position.y=2.8;actor.root.add(label);
 const peer={id,actor,label,shadow:shadow(scene,data.x,data.z,.58,.18),data,phase:0,celebration:0,feedBeat:-1,target:new THREE.Vector3(data.x,data.y,data.z)};
 remotePlayers.set(id,peer);return peer;
}
function reconcileRoom(){
 if(!networkConnected||!networkJoined||roomFull)return;
 const now=Date.now()+serverOffset;
 const active=Array.from(roomMembers.entries()).filter(([,d])=>validState(d)&&now-d.t<STALE_MS).sort((a,b)=>a[1].j-b[1].j||a[0].localeCompare(b[0]));
 const selfIndex=active.findIndex(([id])=>id===sessionKey);
 if(selfIndex>=MAX_VISITORS){roomFull=true;networkJoined=false;arrivalTracker.pause();if(selfRef)window.WinterFirebase.remove(selfRef).catch(()=>{});clearPeers();updateNetworkStatus('도서관이 가득해요');toast('이 도서관에는 네 명까지 함께할 수 있어요');return;}
 const visible=active.filter(([id])=>id!==sessionKey).slice(0,MAX_VISITORS-1),ids=new Set(visible.map(([id])=>id));
 for(const id of remotePlayers.keys())if(!ids.has(id))removePeer(id);
 for(const[id,data]of visible){let peer=remotePlayers.get(id);if(peer&&(peer.actor.kind!==data.k||peer.actor.lookSig!==peerLookSig(data.u))){removePeer(id);peer=null;}if(!peer)peer=makePeer(id,data);if(peer.data.m!==data.m){peer.celebration=0;peer.feedBeat=-1;}if(peer.data.n!==data.n){peer.actor.root.remove(peer.label);peer.label.material.map.dispose();peer.label.material.dispose();peer.label=nameSprite(data.n);peer.label.scale.set(2.15,.403,1);peer.label.position.y=2.8;peer.actor.root.add(peer.label);}peer.data=data;peer.target.set(data.x,data.y,data.z);}
 for(const arrival of arrivalTracker.observe(visible))announceArrival(arrival.id,arrival.data);
 updateNetworkStatus();
}
function stateBody(){
 const walking=lastNetworkMovement&&!document.hidden;
 return{v:1,u:networkAuth.currentUser.uid,n:nickname,k:selected,x:roundState(player.position.x),y:roundState(player.position.y),z:roundState(player.position.z),a:roundState(Math.atan2(Math.sin(player.rotation.y),Math.cos(player.rotation.y))),p:roundState(player.rotation.x),m:mode==='idle'&&(walking||pendingBookShelf||pendingReadingSeat||pendingCatAction)?'walk':({cat:'celebrate',catWake:'celebrate',reading:'rolling',rest:'warm',writing:'sled',wave:'celebrate'}[mode]||'idle'),b:mode==='catWake'?roundState(catWakeWire(catActionTime)):mode==='cat'?roundState(catActionWire(catActionType,catActionTime)):pendingCatAction&&pendingCatAction.kind!==null?roundState(.67+pendingCatAction.kind*.01):pendingReadingSeat?roundState(.6+pendingReadingSeat.index*.02):mode==='writing'?roundState(writingWireProgress(selectedBook,writingTime)):mode==='reading'?roundState(readingWireState(selectedBook,readingPages[selectedBook],readingTurnTime,readingTurnDirection)):0,j:joinedAt};
}
function publishState(force=false){
 if(!networkJoined||!networkConnected||!selfRef||!networkAuth?.currentUser)return;
 const now=performance.now();if(!force&&now-lastNetworkSend<200)return;
 const body=villageTogether.wire(villageSnowball.wire(villagePlay.wire(stateBody()))),signature=JSON.stringify(body);if(!force&&signature===lastNetworkBody&&now-lastNetworkSend<6000)return;
 lastNetworkBody=signature;lastNetworkSend=now;
 const generation = networkGeneration;
 return window.WinterFirebase.set(selfRef,{...body,s:++networkSequence,t:window.WinterFirebase.serverTimestamp()}).catch(error=>{
  if(generation!==networkGeneration)return;
  void reportVillageConnectionFailure(generation,'presence',error);
  networkJoined=false;clearPeers();updateNetworkStatus('접속을 확인해 주세요');console.warn('책숲 도서관 연결:',error.code||'network');toast('친구 연결을 잠시 쉬고 있어요. 초대 버튼에서 다시 연결해요');
 });
}
async function registerPresence(generation){
 if(generation!==networkGeneration||!networkConnected||roomFull)return;
 watchVillageConnection(generation,'register');
 const F=window.WinterFirebase,players=F.ref(networkDB,'rooms/'+roomId+'/players');
 try{
  const current=await F.get(players);if(generation!==networkGeneration)return;
  const active=Object.entries(current.val()||{}).filter(([id,d])=>id!==sessionKey&&validState(d)&&Date.now()+serverOffset-d.t<STALE_MS);
  if(active.length>=MAX_VISITORS){roomFull=true;networkJoined=false;finishVillageConnection(generation);updateNetworkStatus('도서관이 가득해요');toast('이 도서관에는 네 명까지 함께할 수 있어요');return;}
  if(!joinedAt)joinedAt=Date.now()+serverOffset;
  if(mode==='idle'&&!path.length&&Math.hypot(player.position.x,player.position.z-7)<2&&active.some(([,d])=>Math.hypot(d.x-player.position.x,d.z-player.position.z)<1)){
   const spawn=[[-1.5,7],[1.5,7],[0,5.2],[0,8.8]].find(([x,z])=>active.every(([,d])=>Math.hypot(d.x-x,d.z-z)>1));if(spawn)player.position.set(spawn[0],0,spawn[1]);
  }
  disconnectJob=F.onDisconnect(selfRef);await disconnectJob.remove();if(generation!==networkGeneration)return;
  arrivalTracker.seed(active);networkJoined=true;watchVillageConnection(generation,'presence');
  const saved=publishState(true);reconcileRoom();
  if(saved?.then)saved.then(()=>{
   if(generation!==networkGeneration||!networkJoined)return;
   finishVillageConnection(generation);
   return reportOwnArrival(generation);
  }).catch(()=>{});
 }catch(error){if(generation!==networkGeneration)return;void reportVillageConnectionFailure(generation,'register',error);networkJoined=false;updateNetworkStatus('친구 연결 대기');console.warn('책숲 도서관 입장:',error.code||'network');toast('친구 연결을 준비하지 못했어요. 잠시 후 초대 버튼을 눌러주세요');}
}
async function startNetwork(){
 if(!entered||networkStarting||networkJoined||roomFull)return;
 networkStarting=true;arrivalTracker.pause();const generation=++networkGeneration;updateNetworkStatus('친구와 연결 중…');
 try{
  const F=window.WinterFirebase;if(!F)throw new Error('sdk-not-ready');
  if(!networkAuth){const app=F.initializeApp(firebaseConfig);networkAuth=F.getAuth(app);await F.setPersistence(networkAuth,F.browserLocalPersistence);networkDB=F.getDatabase(app);}
  if(!networkAuth.currentUser)await F.signInAnonymously(networkAuth);
  if(generation!==networkGeneration)return;
  watchVillageConnection(generation);
  for(const stop of networkStops)stop();networkStops=[];roomMembers.clear();resetWorldTravel();
  selfRef=F.ref(networkDB,'rooms/'+roomId+'/players/'+sessionKey);
  const players=F.ref(networkDB,'rooms/'+roomId+'/players');
  const change=snapshot=>{if(generation!==networkGeneration)return;const data=snapshot.val();if(validState(data)){roomMembers.set(snapshot.key,data);if(snapshot.key!==sessionKey&&isCatWake(data))rememberCatWake(data);}else roomMembers.delete(snapshot.key);reconcileRoom();};
  const failed=error=>{if(generation!==networkGeneration)return;void reportVillageConnectionFailure(generation,'sync',error);networkJoined=false;clearPeers();updateNetworkStatus('친구 연결 대기');console.warn('책숲 도서관 동기화:',error.code||'network');};
  networkStops.push(subscribeOtherWorld(F,generation),subscribeAdditionalWorld(F,generation));
  networkStops.push(F.onChildAdded(players,change,failed),F.onChildChanged(players,change,failed),F.onChildRemoved(players,snapshot=>{roomMembers.delete(snapshot.key);reconcileRoom();},failed));
  networkStops.push(F.onValue(F.ref(networkDB,'.info/serverTimeOffset'),snapshot=>{serverOffset=Number(snapshot.val())||0;}));
  networkStops.push(F.onValue(F.ref(networkDB,'.info/connected'),snapshot=>{if(generation!==networkGeneration)return;networkConnected=snapshot.val()===true;if(networkConnected)registerPresence(generation);else{networkJoined=false;watchVillageConnection(generation);arrivalTracker.pause();clearPeers();resetWorldTravel();updateNetworkStatus('다시 연결 중…');}}));
 }catch(error){if(generation!==networkGeneration)return;void reportVillageConnectionFailure(generation,'setup',error);updateNetworkStatus('혼자 산책 중');console.warn('책숲 도서관 연결 준비:',error.code||error.message);toast('인터넷 연결을 확인해 주세요. 혼자 산책은 계속할 수 있어요');}
 finally{networkStarting=false;}
}
async function newRoom(){
 finishVillageConnection(networkGeneration);
 arrivalTracker.reset();resetWorldTravel();
 ++networkGeneration;for(const stop of networkStops)stop();networkStops=[];if(selfRef)await window.WinterFirebase.remove(selfRef).catch(()=>{});if(disconnectJob)await disconnectJob.cancel().catch(()=>{});
 roomMembers.clear();clearPeers();networkJoined=false;networkConnected=false;networkStarting=false;roomFull=false;selfRef=null;joinedAt=0;roomId=libraryRoom();history.replaceState(null,'',location.pathname+location.search+'#room='+roomId);$('invite-link').value=inviteURL();await startNetwork();toast('새 도서관의 초대 주소를 만들었어요');
}
function updatePeers(dt){
 for(const peer of remotePlayers.values()){
  const data=peer.data;if(Date.now()+serverOffset-data.t>STALE_MS){removePeer(peer.id);updateNetworkStatus();continue;}
  const root=peer.actor.root,distance=root.position.distanceTo(peer.target),blend=1-Math.exp(-dt*12);if(distance>6)root.position.copy(peer.target);else root.position.lerp(peer.target,blend);
  root.rotation.y+=Math.atan2(Math.sin(data.a-root.rotation.y),Math.cos(data.a-root.rotation.y))*blend;root.rotation.x=lerp(root.rotation.x,data.p,blend);villagePlay.peer(peer,dt);villageSnowball.peer(peer);villageTogether.peer(peer);
  peer.phase+=dt;const reading=data.m==='rolling',writing=data.m==='sled',moving=data.m==='walk';if(!writing)peer.writingTime=null;
  const waking=isCatWake(data),catAction=isCatInteraction(data),catData=catAction?catActionFromWire(data.b):null;const turn=reading?remoteReadingTurn(peer,dt):{time:READING_TURN_DURATION,direction:1};if(!reading){peer.readingKey=null;peer.readingTime=null;}
  animatePose(dt,moving,peer.actor,waking?'catWake':catAction?'cat':reading?'reading':writing?'writing':data.m==='warm'?'rest':data.m==='celebrate'?'wave':'idle',peer.phase,waking?catWakeTime(data.b):catAction?catData.time:writing?remoteWritingTime(peer,dt):turn.time,bookIndexFromWire(data.b),turn.direction,catAction?catData.kind:0);
  peer.shadow.position.set(root.position.x,.03,root.position.z);
 }
}
function networkTick(dt,moving){lastNetworkMovement=moving;updatePeers(dt);publishState();}
$('invite').addEventListener('click',()=>{if(!entered){toast('도서관에 들어온 뒤 친구를 초대해요');return;}$('invite-link').value=inviteURL();$('invite-modal').hidden=false;$('copy-invite').focus();if(!networkJoined&&!roomFull)startNetwork();});
function closeInvite(){$('invite-modal').hidden=true;$('invite').focus();}
$('close-invite').addEventListener('click',closeInvite);$('invite-modal').addEventListener('click',e=>{if(e.target===$('invite-modal'))closeInvite();});
$('copy-invite').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(inviteURL());toast('초대 주소를 복사했어요. 친구에게 보내주세요');$('copy-invite').textContent='복사했어요 ✓';setTimeout(()=>$('copy-invite').textContent='초대 링크 복사',2000);}catch{$('invite-link').focus();$('invite-link').select();toast('주소를 길게 눌러 복사해 주세요');}});
$('new-room').addEventListener('click',newRoom);
$('desktop-alerts').addEventListener('click',toggleDesktopAlerts);
addEventListener('focus',refreshDesktopAlerts);
document.addEventListener('visibilitychange',refreshDesktopAlerts);
addEventListener('storage',event=>{if(event.key===DESKTOP_ALERT_KEY){desktopAlertsEnabled=event.newValue==='on';refreshDesktopAlerts();}});
refreshDesktopAlerts();
addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('invite-modal').hidden)closeInvite();});
addEventListener('online',()=>{if(entered&&!networkJoined&&!roomFull)startNetwork();});
addEventListener('pagehide',()=>{finishVillageConnection(networkGeneration);if(selfRef)window.WinterFirebase.remove(selfRef).catch(()=>{});});
setInterval(()=>{publishState();if(networkJoined)reconcileRoom();},5000);

/* RESIDENT_CODE */
/* SKY_WEATHER_CODE */
/* CREATURE_BOOK_CODE */
/* VILLAGE_STORE_CODE */
/* VILLAGE_NOTES_CODE */
/* VILLAGE_PLAY_CODE */
/* SEASONAL_EVENTS_CODE */
/* VILLAGE_MARKET_CODE */
/* VILLAGE_JOURNAL_CODE */
/* AVATAR_LIFE_CODE */
/* VILLAGE_LOOKS_CODE */
/* RESIDENT_GIFTS_CODE */
/* VILLAGE_NEWSPAPER_CODE */
/* VILLAGE_RADIO_CODE */
/* PHOTO_MODE_CODE */
/* COMPANIONS_CODE */
/* RADIAL_MENU_CODE */
/* MINIGAMES_CODE */
/* SNOWBALL_CODE */
/* TOGETHER_CODE */
/* HOTBAR_CODE */
/* TIDY_CODE */
/* RUN_CODE */
/* EXPEDITION_CODE */
/* FOLK_CODE */
/* MAP_CODE */
/* BAG_CODE */
/* ARRIVAL_CLIENT_CODE */
/* VILLAGE_SHELL_CODE */
setupWorldTravel();
