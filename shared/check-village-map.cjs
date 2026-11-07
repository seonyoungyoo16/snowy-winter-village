const assert=require('node:assert/strict'),{loadWorld,kst}=require('./test-harness.cjs');
const load=(world,storage)=>loadWorld(world,{now:kst(2026,11,10,14),storage,expose:['villageMap','villageDistricts','helpOpen','navigate'].filter(n=>world==='winter'||n!=='villageDistricts')});
for(const world of['winter','aquarium','library']){
 const w=load(world),{a}=w,M=a.villageMap;
 // The minimap waits for the village and then sits in the corner; the full map opens over everything and closes again.
 M.mini.hidden=true;M.tick(.1);assert(!M.mini.hidden,'no minimap after entering');
 assert(M.open());assert(M.isOpen()&&a.helpOpen(),'the map should hold other input');M.close();assert(!M.isOpen());
 // Named places on the map.
 const names=M.LABELS.map(l=>l.name);if(world==='winter'){for(const n of['눈송이 광장','눈숲 오솔길','얼음 호수','등불 시장 거리','전망 언덕','오두막 동네'])assert(names.includes(n),n+' missing from the map');}else assert(names.length>=3,'the '+world+' map has no place names: '+names.join());
 if(world==='winter'){
  const D=a.villageDistricts,F=D.DISTRICTS.find(d=>d.id==='forest');
  // Snow mist: only the start is clear; walking clears more and the map remembers it.
  assert(M.isSeen(0,7)&&!M.isSeen(F.x,F.z),'mist should cover unvisited districts');const before=M.seenCount();
  a.player.position.set(F.x,0,F.z);M.tick(6);assert(M.isSeen(F.x,F.z)&&M.seenCount()>before);assert(load(world,w.storage).a.villageMap.isSeen(F.x,F.z),'the cleared mist was not remembered');
  // Taps: a lit beacon hops there, misty ground refuses, seen ground walks there.
  a.player.position.set(0,0,7);M.tick(.1);D.light('forest');M.open();const v=M.view,b=D.beacons.find(x=>x.id==='forest'),px=v.w/2+(b.x-v.cx)*v.scale,py=v.h/2+(b.z-v.cz)*v.scale;assert.equal(M.tap(px,py),'hop');assert(Math.hypot(a.player.position.x-b.x,a.player.position.z-b.z)<2.2,'did not hop to the beacon');assert(!M.isOpen());
  const L=D.DISTRICTS.find(d=>d.id==='lookout');M.open();const v2=M.view;assert.equal(M.tap(v2.w/2+(L.x-v2.cx)*v2.scale,v2.h/2+(L.z-v2.cz)*v2.scale),'fog');M.close();
  a.player.position.set(0,0,7);M.tick(.1);M.open();const v3=M.view;assert.equal(M.tap(v3.w/2+(3-v3.cx)*v3.scale,v3.h/2+(4-v3.cz)*v3.scale),'walk');
  assert.equal(load(world,new Map([['village-map-fog:winter','xyz']])).a.villageMap.isSeen(F.x,F.z),false,'damaged mist storage');
 }else{
  // No mist indoors: everything is on the map, and a tap walks there.
  assert(M.isSeen(M.EXTENT*.5,0));M.open();const v=M.view;assert.equal(M.tap(v.w/2,v.h/2+40),'walk');
 }
 console.log('PASS: '+world+' map: a minimap after entering, a full map (M or tap) that holds input, named places'+(world==='winter'?', snow mist cleared by walking and remembered, lit beacons to hop to and misty ground refused':', and taps that walk there')+'.');
}
