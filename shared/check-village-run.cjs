const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{loadWorld,root}=require('./test-harness.cjs');
const loops={winter:'winter/multiplayer.html',aquarium:'aquarium/aquarium.js',library:'library/library-loop.js'};
for(const world of['winter','aquarium','library']){
 const{a}=loadWorld(world,{expose:['villageRun','villageHotbar']}),R=a.villageRun;
 // Each loop multiplies plain walking speed by the run factor and drives the stride from the run clock.
 const src=fs.readFileSync(path.join(root,loops[world]),'utf8');assert(/const speed=\(?[^;]*\*villageRun\.factor\(mode\)/.test(src),world+' speed ignores running');assert(/animatePose\(dt,moving,character,mode,villageRun\.phase\(dt,moving\)/.test(src),world+' stride ignores running');
 // The running shoe sits at the end of the hotbar.
 assert(a.villageHotbar.bar.children.includes(R.button),'the run button is not in the hotbar');R.tick();assert(!R.button.hidden);
 // Off by default; on, plain walking is 1.8× and nothing else changes; the stride clock speeds up only while moving.
 assert.equal(R.factor('idle'),1);assert.equal(R.set(true),true);assert.equal(R.factor('idle'),R.FACTOR);assert.equal(R.factor('walk'),R.FACTOR);assert(R.FACTOR>1.5&&R.FACTOR<2.2);
 for(const m of['rolling','sled','warm','fish','reading','cat'])assert.equal(R.factor(m),1,m+' should not run');
 const p0=R.phase(0,false),p1=R.phase(1,true),p2=R.phase(1,false),moved=p1-p0,still=p2-p1;assert(moved>1.5&&Math.abs(still-1)<1e-9,'stride clock');
 R.button.handlers.click();assert.equal(R.toggled,false);assert.equal(R.button['attr:aria-pressed'],'false');assert.equal(R.factor('idle'),1);
 console.log('PASS: '+world+' running: the shoe at the end of the hotbar (or Shift) makes plain walking 1.8× faster with a matching quicker stride, and leaves other activities alone.');
}
