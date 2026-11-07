const assert=require('node:assert/strict'),{loadWorld,kst}=require('./test-harness.cjs');
const DAY=86400e3,load=(world,now,storage)=>loadWorld(world,{now,storage,expose:['villageBag','villageMarket','helpOpen']});
for(const world of['winter','aquarium','library']){
 const t0=kst(2026,11,10,14),w=load(world,t0),{a}=w,B=a.villageBag;
 // The bag button waits for the village; the window opens over everything and closes again.
 B.toggle.hidden=true;B.tick(.1);assert(!B.toggle.hidden,'no bag button');assert(B.open());assert(B.isOpen()&&a.helpOpen());B.close();
 // Pick-up spots for today: only this space's things, none inside walls, the same in another browser.
 const S=B.spots;assert(S.length>=(world==='winter'?18:10),'only '+S.length+' things to find');for(const s of S){assert(B.POOLS[world].includes(s.id));assert(!a.blocked(s.x,s.z,.2),s.id+' inside something');}
 const other=load(world,t0).a.villageBag;other.tick(.1);assert.equal(JSON.stringify(other.spots.map(s=>s.key+s.x.toFixed(3))),JSON.stringify(S.map(s=>s.key+s.x.toFixed(3))),'spots differ between browsers');
 // Walking onto one picks it up into the bag; it stays gone for today, and tomorrow there is a new set.
 const first=S[0],id=first.id;a.player.position.set(first.x,0,first.z);B.tick(.1);assert.equal(B.count(id),1);assert(!B.spots.includes(first));
 const again=load(world,t0,w.storage).a.villageBag;again.tick(.1);assert(!again.spots.some(s=>s.key===first.key),'a picked spot came back the same day');assert.equal(again.count(id),1,'the bag was not remembered');
 const tomorrow=load(world,t0+DAY,w.storage).a.villageBag;tomorrow.tick(.1);assert(tomorrow.spots.length>=S.length-1&&JSON.stringify(tomorrow.spots.map(s=>s.x))!==JSON.stringify(S.map(s=>s.x)),'no new spots tomorrow');
 // Stacks, slots and limits.
 assert.equal(B.add('feather',5),5);assert.equal(B.add('feather',200),B.STACK-5,'a stack should stop at '+B.STACK);assert.equal(B.add('nonsense'),0);
 // Trading three found things for one shell; eating food.
 const shells=()=>a.villageMarket.purse().shells,s0=shells();B.take('pinecone',B.count('pinecone'));B.add('pinecone',3);assert.equal(B.trade('pinecone'),1);assert.equal(B.count('pinecone'),0);assert.equal(shells(),s0+1);B.add('pinecone',2);assert.equal(B.trade('pinecone'),0,'traded without three');
 const berries=B.count('berry');B.add('berry',1);assert(B.eat('berry'));assert.equal(B.count('berry'),berries);assert.equal(B.eat('feather'),false,'ate a feather');
 // Tabs and the window: kept things from the shop and the purse show up; choosing a found item offers the trade.
 a.villageMarket.earn(10,'test');assert(a.villageMarket.buy('kite-sea'));const all=B.entries();assert(all.some(e=>e.id==='shop:kite-sea'&&e.tab==='looks'));assert(all.some(e=>e.id==='keep:shells'));
 B.open();B.setTab('found');assert(B.grid.children.some(c=>(c['attr:aria-label']||'').startsWith('깃털')));B.choose('feather');assert(B.detail.children.some(c=>c.children&&c.children.some(b=>/조개 1개로/.test(b.textContent))),'no trade button');B.close();
 // Damaged storage starts fresh.
 assert.equal(load(world,t0,new Map([['village-bag-v1','{"items":{"feather":"x","moon":3}}']])).a.villageBag.count('feather'),0);
 console.log('PASS: '+world+' bag: '+S.length+' daily things to find (same in every browser), picked up by walking onto them and kept, stacks of '+B.STACK+' in '+B.SLOTS+' slots, three found things for a shell, food to eat, and shop items and shells listed in tabs.');
}
