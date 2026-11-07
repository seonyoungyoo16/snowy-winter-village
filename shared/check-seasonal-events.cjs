const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{loadWorld,kst,root}=require('./test-harness.cjs');
// Calendar by Seoul date, including the New Year boundary and the per-year Chuseok table.
{const{a}=loadWorld('winter',{now:kst(2026,11,7),expose:['seasonalEventsAt']}),at=(...d)=>[...a.seasonalEventsAt(kst(...d))].sort();
 assert.deepEqual(at(2026,11,7),[]);assert.deepEqual(at(2026,12,1),['lights']);assert.deepEqual(at(2026,12,13),['lights','meteor']);assert.deepEqual(at(2026,12,26),['lights']);assert.deepEqual(at(2026,12,27),[]);
 assert.deepEqual(at(2026,12,31,23,59),['newyear']);assert.deepEqual(at(2027,1,1,0,30),['newyear']);assert.deepEqual(at(2027,1,2),[]);assert.deepEqual(at(2027,1,3),['meteor']);assert.deepEqual(at(2026,8,12),['meteor']);
 assert.deepEqual(at(2026,9,25),['harvest-moon']);assert.deepEqual(at(2027,9,25),[]);assert.deepEqual(at(2027,9,15),['harvest-moon']);
 // 2026-11-30 23:30 UTC is already 1 December in Seoul.
 assert.deepEqual([...a.seasonalEventsAt(Date.UTC(2026,10,30,15,30))],['lights']);}
for(const world of['winter','aquarium','library']){
 // No event: nothing extra is shown and residents speak as usual.
 let w=loadWorld(world,{now:kst(2026,11,7),expose:['seasonalEvents','residentGuide']});let s=w.a.seasonalEvents;s.tick(6);assert.equal(s.active.length,0);assert(!w.a.scene.getObjectByName('seasonal-lights').visible);assert.equal(s.residentLine(),'');assert(!w.a.scene.getObjectByName('seasonal-fireworks').visible);
 // Lights festival: garlands on, the badge names the event, the resident mentions it.
 w=loadWorld(world,{now:kst(2026,12,5,15),expose:['seasonalEvents']});s=w.a.seasonalEvents;s.tick(6);assert(w.a.scene.getObjectByName('seasonal-lights').visible);assert(s.residentLine().includes('불빛 축제'));assert.equal(w.node('sky-weather-badge').textContent.includes('✦ 겨울 불빛 축제'),true,'badge does not name the event');s.tick(6);assert.equal((w.node('sky-weather-badge').textContent.match(/✦/g)||[]).length,1,'event suffix repeats');
 // New Year: fireworks only after dark, only where there is sky to see, and they stay in that sky.
 w=loadWorld(world,{now:kst(2026,12,31,22),search:'?sky=night',expose:['seasonalEvents']});s=w.a.seasonalEvents;const fw=w.a.scene.getObjectByName('seasonal-fireworks');for(let i=0;i<40;i++)s.tick(.1);
 if(world==='aquarium')assert(!fw.visible,'fireworks indoors');else{assert(fw.visible);const p=fw.geometry.attributes.position.array,lit=fw.geometry.attributes.color.array;let n=0;for(let i=0;i<p.length/3;i++)if(lit[i*3]+lit[i*3+1]+lit[i*3+2]>0){n++;if(world==='library')assert(Math.abs(p[i*3+2]+17.47)<.01&&p[i*3]>3&&p[i*3]<17,'firework escapes the window');else assert(p[i*3+1]>.5,'firework sinks into the ground');}assert(n>0,'no sparks lit');}
 w=loadWorld(world,{now:kst(2026,12,31,13),search:'?sky=day',expose:['seasonalEvents']});w.a.seasonalEvents.tick(1);assert(!w.a.scene.getObjectByName('seasonal-fireworks').visible,'fireworks in daylight');
 // Meteor nights and the harvest moon follow the same sky rules; ?event= pins an event for previews.
 w=loadWorld(world,{now:kst(2026,11,7,22),search:'?sky=night&event=meteor',expose:['seasonalEvents']});w.a.seasonalEvents.tick(4);assert.equal(w.a.scene.getObjectByName('seasonal-meteors').visible,world!=='aquarium');
 w=loadWorld(world,{now:kst(2026,9,25,22),search:'?sky=night',expose:['seasonalEvents']});w.a.seasonalEvents.tick(6);const moon=w.a.scene.getObjectByName('seasonal-harvest-moon');if(world==='aquarium')assert(!moon);else assert(moon.visible);
 console.log('PASS: '+world+' shows Seoul-date events only while they run: garlands, a named badge and resident lines, and fireworks, meteors and the harvest moon only after dark where there is sky.');
}
for(const[name,dir]of[['winter',''],['aquarium','aquarium'],['library','library']]){const html=fs.readFileSync(path.join(root,'docs',dir,'index.html'),'utf8');assert(html.includes('function createSeasonalEvents(')&&html.includes('seasonalEvents.tick(dt)'),name);}
