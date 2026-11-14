const assert=require('node:assert/strict'),{loadWorld,kst}=require('./test-harness.cjs');
const load=(world,now,storage)=>loadWorld(world,{now,storage,expose:['villageBag','villageMarket','helpOpen']});
for(const world of['winter','aquarium','library']){
 const t0=kst(2026,11,10,14),stored=new Map([['village-bag-v1','{"items":{"berry":2,"feather":1}}']]);
 const w=load(world,t0,stored),{a}=w,B=a.villageBag;
 // The record is openable, but visiting and walking no longer generate or award items.
 B.tick();assert(B.open());assert(B.isOpen()&&a.helpOpen());B.close();
 assert.equal(B.count('berry'),2);
 assert.equal(B.count('feather'),1);
 for(const now of [t0,t0+86400e3]){
  w.clock.ms=now;
  for(const [x,z] of [[0,7],[6.4,5.6],[-9,-5]]){
   a.player.position.set(x,0,z);B.tick(.1);
   assert.equal(a.scene.getObjectByName('bag-pickups'),undefined);
   assert.equal(stored.get('village-bag-v1'),'{"items":{"berry":2,"feather":1}}');
  }
 }
 assert.equal(load(world,t0,stored).a.villageBag.count('berry'),2,'the old bag was not remembered');
 B.take('feather');
 // Stacks, slots and limits.
 assert.equal(B.add('feather',5),5);assert.equal(B.add('feather',200),B.STACK-5,'a stack should stop at '+B.STACK);assert.equal(B.add('nonsense'),0);
 // Trading three found things for one shell; eating food.
 const shells=()=>a.villageMarket.purse().shells,s0=shells();B.take('pinecone',B.count('pinecone'));B.add('pinecone',3);assert.equal(B.trade('pinecone'),1);assert.equal(B.count('pinecone'),0);assert.equal(shells(),s0+1);B.add('pinecone',2);assert.equal(B.trade('pinecone'),0,'traded without three');
 const berries=B.count('berry');B.add('berry',1);assert(B.eat('berry'));assert.equal(B.count('berry'),berries);assert.equal(B.eat('feather'),false,'ate a feather');
 // Tabs and the window: kept things from the shop and the purse show up; the retired trade is absent.
 a.villageMarket.earn(10,'test');assert(a.villageMarket.buy('kite-sea'));const all=B.entries();assert(all.some(e=>e.id==='shop:kite-sea'&&e.tab==='looks'));assert(all.some(e=>e.id==='keep:shells'));
 B.open();B.setTab('found');assert(B.grid.children.some(c=>(c['attr:aria-label']||'').startsWith('깃털')));B.choose('feather');assert(!B.detail.children.some(c=>c.children&&c.children.some(b=>/조개 1개로/.test(b.textContent))),'the retired trade button is still shown');B.close();
 // Damaged storage starts fresh.
 assert.equal(load(world,t0,new Map([['village-bag-v1','{"items":{"feather":"x","moon":3}}']])).a.villageBag.count('feather'),0);
 console.log('PASS: '+world+' bag keeps legacy items, does not spawn new pickups and still lists the original records.');
}
