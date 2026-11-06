// Shared by both standalone worlds. Each world keeps its own coordinates and actions.
const WORLD_CONFIG = /* WORLD_CONFIG */;
const CURRENT_WORLD=WORLD_CONFIG.current,OTHER_WORLD=CURRENT_WORLD==='winter'?'aquarium':'winter';
const WORLD_NAMES={winter:'겨울 마을',aquarium:'수족관'},TRAVEL_KEY='little-worlds-travel-v1';
const incomingWorldTravel=new URLSearchParams(location.hash.slice(1)).get('travel')==='1';
const otherWorldMembers=new Map(),otherWorldArrivals=createArrivalTracker();
let otherWorldReady=false,travelLeaving=false;
function partyId(value){return value.startsWith('aq_')?value.slice(3):value;}
function worldRoomId(party,world){return world==='aquarium'?'aq_'+party:party;}
function readRoom(){
 const raw=new URLSearchParams(location.hash.slice(1)).get('room')||'',party=partyId(raw);
 return worldRoomId(/^[a-f0-9]{24}$/.test(party)?party:token(),CURRENT_WORLD);
}
function otherWorldRoom(){return worldRoomId(partyId(roomId),OTHER_WORLD);}
function worldURL(world){
 const hosted=/^https?:$/.test(location.protocol)&&/^\/(snowy-winter-village|little-blue-aquarium)(\/|$)/.test(location.pathname);
 const url=new URL(world==='winter'?WORLD_CONFIG.winterPath:WORLD_CONFIG.aquariumPath,hosted?location.origin:WORLD_CONFIG.publicOrigin);
 url.hash='room='+worldRoomId(partyId(roomId),world)+'&travel=1';return url.href;
}
function activeOtherWorldMembers(){
 const now=Date.now()+serverOffset,uid=networkAuth?.currentUser?.uid;
 return Array.from(otherWorldMembers.entries()).filter(([,d])=>validState(d)&&now-d.t<STALE_MS&&d.u!==uid);
}
function updateWorldTravelUI(){
 const visitors=activeOtherWorldMembers(),names=visitors.slice(0,2).map(([,d])=>d.n).join(' · ');
 $('world-travel').hidden=!entered;
 $('switch-world').disabled=travelLeaving;
 $('switch-world-text').textContent=travelLeaving?'건너가는 중…':visitors.length?(OTHER_WORLD==='winter'?'겨울 마을로':'수족관으로')+' 따라가기':WORLD_NAMES[OTHER_WORLD]+' 가기';
 $('switch-world-icon').textContent=OTHER_WORLD==='winter'?'❄':'◌';
 $('other-world-status').hidden=!visitors.length||travelLeaving;
 $('other-world-status').textContent=visitors.length?names+(visitors.length>2?' 외 '+(visitors.length-2)+'명':'')+' 님이 있어요':'';
}
function resetWorldTravel(){otherWorldMembers.clear();otherWorldArrivals.reset();otherWorldReady=false;updateWorldTravelUI();}
function subscribeOtherWorld(F,generation){
 return F.onValue(F.ref(networkDB,'rooms/'+otherWorldRoom()+'/players'),snapshot=>{
  if(generation!==networkGeneration)return;
  otherWorldMembers.clear();for(const[id,data]of Object.entries(snapshot.val()||{}))if(validState(data))otherWorldMembers.set(id,data);
  const visitors=activeOtherWorldMembers();
  if(!otherWorldReady){otherWorldArrivals.seed(visitors);otherWorldReady=true;}
  else for(const item of otherWorldArrivals.observe(visitors))toast(item.data.n+' 님이 '+WORLD_NAMES[OTHER_WORLD]+'에 있어요. 이동 버튼으로 따라가요');
  updateWorldTravelUI();
 },()=>{if(generation===networkGeneration)resetWorldTravel();});
}
async function travelToOtherWorld(){
 if(!entered||travelLeaving)return;
 const destination=worldURL(OTHER_WORLD);
 try{sessionStorage.setItem(TRAVEL_KEY,JSON.stringify({to:OTHER_WORLD,party:partyId(roomId),until:Date.now()+120000,profile:{nickname,character:selected}}));}catch{}
 save();travelLeaving=true;keys.clear();updateWorldTravelUI();
 // Stop heartbeats before removing presence; a failed cleanup still has onDisconnect.
 networkJoined=false;++networkGeneration;for(const stop of networkStops)stop();networkStops=[];
 if(selfRef){try{await Promise.race([window.WinterFirebase.remove(selfRef),new Promise(resolve=>setTimeout(resolve,1500))]);}catch{}}
 location.replace(destination);
}
function resumeWorldTravel(){
 if(!incomingWorldTravel)return;
 let pending;try{pending=JSON.parse(sessionStorage.getItem(TRAVEL_KEY)||'null');sessionStorage.removeItem(TRAVEL_KEY);}catch{return;}
 const profile=pending?.profile;
 if(!pending||pending.to!==CURRENT_WORLD||pending.party!==partyId(roomId)||!Number.isFinite(pending.until)||pending.until<Date.now()||pending.until>Date.now()+120000||!profile||typeof profile.nickname!=='string'||!Number.isInteger(profile.character)||profile.character<0||profile.character>2)return;
 const name=profile.nickname.trim().replace(/[\u0000-\u001f\u007f]/g,'').slice(0,12);if(!name)return;
 chooseCharacter(profile.character);$('nickname').value=name;$('entry-form').requestSubmit();
}
function setupWorldTravel(){
 $('switch-world').addEventListener('click',travelToOtherWorld);updateWorldTravelUI();
 setInterval(()=>{if(entered&&!travelLeaving)updateWorldTravelUI();},5000);
}
