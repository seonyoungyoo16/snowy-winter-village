// Shared by all three standalone worlds; each keeps separate coordinates and actions.
const WORLD_CONFIG=/* WORLD_CONFIG */;
const CURRENT_WORLD=WORLD_CONFIG.current,OTHER_WORLD=CURRENT_WORLD==='winter'?'aquarium':'winter',EXTRA_WORLD=CURRENT_WORLD==='library'?'aquarium':'library';
const WORLD_NAMES={winter:'겨울 마을',aquarium:'수족관',library:'도서관'},WORLD_DIRECTIONS={winter:'겨울 마을로',aquarium:'수족관으로',library:'도서관으로'},WORLD_ICONS={winter:'❄',aquarium:'◌',library:'▤'},TRAVEL_KEY='little-worlds-travel-v1';
const incomingWorldTravel=new URLSearchParams(location.hash.slice(1)).get('travel')==='1';
const worldPresence={};for(const world of[OTHER_WORLD,EXTRA_WORLD])worldPresence[world]={members:new Map(),arrivals:createArrivalTracker(),ready:false};
const otherWorldMembers=worldPresence[OTHER_WORLD].members;
let travelLeaving=false;
function partyId(value){return /^(aq_|lb_)/.test(value)?value.slice(3):value;}
function worldRoomId(party,world){return(world==='aquarium'?'aq_':world==='library'?'lb_':'')+party;}
function readRoom(){const raw=new URLSearchParams(location.hash.slice(1)).get('room')||'',party=partyId(raw);return worldRoomId(/^[a-f0-9]{24}$/.test(party)?party:token(),CURRENT_WORLD);}
function otherWorldRoom(){return worldRoomId(partyId(roomId),OTHER_WORLD);}
function worldURL(world){
 const hosted=/^https?:$/.test(location.protocol)&&/^\/(snowy-winter-village|little-blue-aquarium|little-lantern-library)(\/|$)/.test(location.pathname);
 const paths={winter:WORLD_CONFIG.winterPath,aquarium:WORLD_CONFIG.aquariumPath,library:WORLD_CONFIG.libraryPath||'/little-lantern-library/'};
 const url=new URL(paths[world],hosted?location.origin:WORLD_CONFIG.publicOrigin);url.hash='room='+worldRoomId(partyId(roomId),world)+'&travel=1';return url.href;
}
function activeOtherWorldMembers(world=OTHER_WORLD){
 const now=Date.now()+serverOffset,uid=networkAuth?.currentUser?.uid;
 return Array.from(worldPresence[world].members.entries()).filter(([,d])=>validState(d)&&now-d.t<STALE_MS&&d.u!==uid);
}
function updateWorldTravelUI(){
 $('world-travel').hidden=!entered;
 for(const[world,prefix,statusId]of[[OTHER_WORLD,'switch-world','other-world-status'],[EXTRA_WORLD,'switch-extra-world','extra-world-status']]){
  const visitors=activeOtherWorldMembers(world),names=visitors.slice(0,2).map(([,d])=>d.n).join(' · ');
  $(prefix).disabled=travelLeaving;$(prefix+'-text').textContent=travelLeaving?'건너가는 중…':visitors.length?WORLD_DIRECTIONS[world]+' 따라가기':WORLD_NAMES[world]+' 가기';$(prefix+'-icon').textContent=WORLD_ICONS[world];
  $(statusId).hidden=!visitors.length||travelLeaving;$(statusId).textContent=visitors.length?WORLD_NAMES[world]+' · '+names+(visitors.length>2?' 외 '+(visitors.length-2)+'명':'')+' 님이 있어요':'';
 }
}
function resetWorldTravel(){for(const p of Object.values(worldPresence)){p.members.clear();p.arrivals.reset();p.ready=false;}updateWorldTravelUI();}
function subscribeWorld(F,generation,world){
 const presence=worldPresence[world];
 return F.onValue(F.ref(networkDB,'rooms/'+worldRoomId(partyId(roomId),world)+'/players'),snapshot=>{
  if(generation!==networkGeneration)return;
  presence.members.clear();for(const[id,data]of Object.entries(snapshot.val()||{}))if(validState(data))presence.members.set(id,data);
  const visitors=activeOtherWorldMembers(world);if(!presence.ready){presence.arrivals.seed(visitors);presence.ready=true;}else for(const item of presence.arrivals.observe(visitors))toast(item.data.n+' 님이 '+WORLD_NAMES[world]+'에 있어요. 이동 버튼으로 따라가요');updateWorldTravelUI();
 },()=>{if(generation===networkGeneration){presence.members.clear();presence.ready=false;presence.arrivals.reset();updateWorldTravelUI();}});
}
function subscribeOtherWorld(F,generation){return subscribeWorld(F,generation,OTHER_WORLD);}
function subscribeAdditionalWorld(F,generation){return subscribeWorld(F,generation,EXTRA_WORLD);}
async function travelToWorld(world){
 if(!entered||travelLeaving||world===CURRENT_WORLD||!Object.hasOwn(WORLD_NAMES,world))return;
 const destination=worldURL(world);
 try{sessionStorage.setItem(TRAVEL_KEY,JSON.stringify({to:world,party:partyId(roomId),until:Date.now()+120000,profile:{nickname,character:selected}}));}catch{}
 save();travelLeaving=true;keys.clear();updateWorldTravelUI();networkJoined=false;++networkGeneration;for(const stop of networkStops)stop();networkStops=[];
 if(selfRef){try{await Promise.race([window.WinterFirebase.remove(selfRef),new Promise(resolve=>setTimeout(resolve,1500))]);}catch{}}
 location.replace(destination);
}
function travelToOtherWorld(){return travelToWorld(OTHER_WORLD);}
function resumeWorldTravel(){
 if(!incomingWorldTravel)return;
 let pending;try{pending=JSON.parse(sessionStorage.getItem(TRAVEL_KEY)||'null');sessionStorage.removeItem(TRAVEL_KEY);}catch{return;}
 const profile=pending?.profile;
 if(!pending||pending.to!==CURRENT_WORLD||pending.party!==partyId(roomId)||!Number.isFinite(pending.until)||pending.until<Date.now()||pending.until>Date.now()+120000||!profile||typeof profile.nickname!=='string'||!Number.isInteger(profile.character)||profile.character<0||profile.character>2)return;
 const name=profile.nickname.trim().replace(/[\u0000-\u001f\u007f]/g,'').slice(0,12);if(!name)return;chooseCharacter(profile.character);$('nickname').value=name;$('entry-form').requestSubmit();
}
function setupWorldTravel(){
 $('switch-world').addEventListener('click',travelToOtherWorld);$('switch-extra-world').addEventListener('click',()=>travelToWorld(EXTRA_WORLD));updateWorldTravelUI();setInterval(()=>{if(entered&&!travelLeaving)updateWorldTravelUI();},5000);
}
