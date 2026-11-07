const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{loadWorld,kst}=require('./test-harness.cjs');
const source=fs.readFileSync(path.join(__dirname,'village-journal.js'),'utf8');assert(!/점수|순위|leaderboard/i.test(source),'the journal must not keep points or ranks');
const shared=new Map();
(async()=>{
for(const world of['winter','aquarium','library']){
 const w=loadWorld(world,{now:kst(2026,11,7,10),storage:shared,expose:['villageJournal','villageEvent','villageNotes','villagePlay','villageMarket','creatureBook','helpOpen']}),{a}=w,j=a.villageJournal;
 assert([...w.nodes.values()].some(n=>n.textContent==='마을 일기'&&n.className==='resident-next'),'no journal choice in the resident dialog');
 // Arriving writes the visit page; the journal follows the visitor between worlds on the same origin.
 assert(j.done()['visit-'+world]);if(world!=='winter')assert(j.done()['visit-winter'],'pages from another world are lost');
 if(world==='winter'){
  // Activities write their first-time page once.
  a.villageEvent('snowman');const first=j.done()['did-snowman'];assert(first);w.advance(60);a.villageEvent('snowman');assert.equal(j.done()['did-snowman'],first,'a first time is rewritten');
  await a.villageNotes.sendLetter('*','안녕');assert(j.done()['first-letter']);a.villagePlay.say(0);assert(j.done()['first-emote']);a.villageMarket.earn(10);a.villageMarket.buy('kite-sun');assert(j.done()['first-purchase']);
  // Derived pages: five creatures, then the whole pond.
  for(const id of['smelt','minnow','trout','cherry-salmon'])a.creatureBook.record(id);assert(!j.done()['creatures-5']);a.creatureBook.record('lenok');assert(j.done()['creatures-5']);assert(!j.done()['pond-all']);
  for(const id of['bullhead','snow-loach','star-smelt'])a.creatureBook.record(id);assert(j.done()['pond-all']);assert(!j.done()['book-full']);
 }
 if(world==='library'){
  // The library's own completion record becomes journal pages.
  assert(!j.done()['stamp-first']);shared.set('little-lantern-library-v1',JSON.stringify({version:1,completedBooks:[0,2],memories:[{book:0,created:1,name:'책 손님'}]}));assert(j.done()['stamp-first']);assert(!j.done()['stamp-all']);
  shared.set('little-lantern-library-v1',JSON.stringify({version:1,completedBooks:[0,1,2],memories:[{book:0,created:1,name:'책 손님'}]}));assert(j.done()['stamp-all']);
 }
 j.open();assert(j.isOpen());assert(a.helpOpen());j.close();
 console.log('PASS: '+world+' journal dates first times once, follows the visitor across worlds, reads the creature book and library stamps, and keeps no points.');
}
})().catch(e=>{console.error(e);process.exit(1);});
