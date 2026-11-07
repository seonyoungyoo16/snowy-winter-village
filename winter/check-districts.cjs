const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{loadWorld,kst}=require('../shared/test-harness.cjs');
const src=fs.readFileSync(path.join(__dirname,'districts.js'),'utf8'),mp=fs.readFileSync(path.join(__dirname,'multiplayer.js'),'utf8');
const load=storage=>loadWorld('winter',{now:kst(2026,11,7,13),expose:['villageDistricts','colliders','WORLD_LIMIT','toast'],storage});
{
 const w=load(),{a}=w,D=a.villageDistricts,L=a.WORLD_LIMIT;
 // Six named places inside the walkable ground, the plaza in the middle and five districts around it.
 assert.equal(D.DISTRICTS.length,6);assert.equal(D.DISTRICTS[0].id,'plaza');assert(L>=50,'the village did not grow');
 for(const d of D.DISTRICTS){assert(Math.abs(d.x)+d.r<=L+2&&Math.abs(d.z)+d.r<=L+2,d.id+' runs past the edge');assert.equal(D.districtAt(d.x,d.z).id,d.id,d.id+' centre is not '+d.id);}
 // Room positions travel at half scale so the whole village fits the deployed ±26 m rule.
 assert(/WIRE_SCALE=2/.test(mp)&&/x:roundState\(player\.position\.x\/WIRE_SCALE\)/.test(mp)&&/fromWire\(data\)/.test(mp));assert(L/2<=26,'the far edge does not fit the room rule');
 // Every beacon is reachable on foot from the start, and even the longest walk is planned quickly.
 for(const b of D.beacons){assert(!a.blocked(b.x+1.6,b.z,.4)||!a.blocked(b.x-1.6,b.z,.4)||!a.blocked(b.x,b.z+1.6,.4),b.id+' beacon is walled in');
  a.player.position.set(0,0,7);const t0=Date.now(),p=a.pathTo(b.x,b.z+1.7);assert(p.length>3,'no path to the '+b.id+' beacon');assert(Date.now()-t0<1500,'path to '+b.id+' took too long');const end=p.at(-1);assert(Math.hypot(end.x-b.x,end.z-b.z)<3.5,'path to '+b.id+' stops short');}
 // Scenery for each district exists and the roads keep trees off them.
 const inside=id=>{const d=D.DISTRICTS.find(x=>x.id===id);return a.colliders.filter(c=>Math.hypot(c.x-d.x,c.z-d.z)<d.r).length;};assert(inside('market')>=7,'market stalls missing');assert(inside('lake')>=2,'lake huts missing');assert(inside('cottages')>=5,'cottages missing');assert(inside('forest')>=20,'the forest is thin');assert(inside('lookout')>=2,'lookout props missing');
 for(const[x1,z1,x2,z2]of D.ROADS)for(let t=.15;t<.9;t+=.15){const x=x1+(x2-x1)*t,z=z1+(z2-z1)*t;assert(!a.colliders.some(c=>c.r>.4&&Math.hypot(x-c.x,z-c.z)<c.r*.6),'a tree stands on the road near '+x.toFixed(1)+','+z.toFixed(1));}
 // Walking into a district names it once as new, then as the current place; the plaza is quiet at the start.
 a.villageDistricts.tick(.1);assert(D.banner.hidden,'the start should not announce the plaza');assert.equal(JSON.stringify(D.state.seen),'["plaza"]');
 const F=D.DISTRICTS.find(d=>d.id==='forest');a.player.position.set(F.x+5,0,F.z);D.tick(.1);assert(!D.banner.hidden);assert(D.banner.children.map(n=>n.textContent).join(' ').includes('새로운 곳'));assert(D.state.seen.includes('forest'));
 D.tick(3);assert(D.banner.hidden,'the banner should fade');a.player.position.set(0,0,7);D.tick(.1);a.player.position.set(F.x+5,0,F.z);D.tick(.1);assert(D.banner.children.map(n=>n.textContent).join(' ').includes('지금 있는 곳'));
 // Beacons light when touched; you can only hop to lit ones, and the hop button shows beside a lit beacon once there are two.
 assert.equal(D.travel('forest'),false,'travelled to an unlit beacon');const fb=D.beacons.find(b=>b.id==='forest');a.player.position.set(fb.x+1,0,fb.z);D.tick(.1);assert(D.state.lit.includes('forest'));assert(D.hop.hidden,'one lit beacon has nowhere to go');
 const pb=D.beacons.find(b=>b.id==='plaza');a.player.position.set(pb.x+1,0,pb.z);D.tick(.1);assert(D.state.lit.includes('plaza'));assert(!D.hop.hidden);D.openList();assert.equal(D.list.children.length,1);assert.equal(D.list.children[0].textContent,'눈숲 오솔길');
 D.list.children[0].handlers.click();assert(Math.hypot(a.player.position.x-fb.x,a.player.position.z-fb.z)<2.2,'hop did not arrive at the forest');assert(!a.blocked(a.player.position.x,a.player.position.z,.2),'arrived inside something');
 assert(D.beacons.find(b=>b.id==='forest').crystal.material.color.getHex()!==D.beacons.find(b=>b.id==='lake').crystal.material.color.getHex(),'lit and unlit beacons look the same');
 // Progress stays in this browser; damaged storage starts fresh.
 const again=load(w.storage).a.villageDistricts;assert(again.state.lit.includes('forest')&&again.state.seen.includes('forest'));
 assert.equal(JSON.stringify(load(new Map([['village-districts-v1','{"seen":["moon",3],"lit":"x"}']])).a.villageDistricts.state),'{"seen":[],"lit":[]}');
 assert(!/avatar\(|palettes/.test(src),'districts must not touch avatars');
 console.log('PASS: winter village spans six districts within ±'+L+' m (sent at half scale for the ±26 m room rule), every beacon is reachable quickly, roads stay clear, entering a district names it, and lit beacons let you hop between them and are remembered.');
}
