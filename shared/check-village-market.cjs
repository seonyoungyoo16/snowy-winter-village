const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{loadWorld,kst,root}=require('./test-harness.cjs');
const source=fs.readFileSync(path.join(__dirname,'village-market.js'),'utf8');
assert(!/villageStore|WinterFirebase|avatar\(|palettes/.test(source),'the market must stay in this browser and never touch avatars');
for(const world of['winter','aquarium','library']){
 const w=loadWorld(world,{now:kst(2026,11,7,10),expose:['villageMarket','villageNotes','creatureBook','villageEvent','helpOpen']}),{a}=w,m=a.villageMarket,day=86400;
 assert(![...w.nodes.values()].some(n=>n.textContent==='마을 가게'&&n.className==='resident-next'),'retired shop was offered in resident dialogue');
 // Earning: small activities only, at most fifteen shells per Seoul day.
 assert.equal(m.purse().shells,0);assert.equal(a.creatureBook.record('smelt'),true);assert.equal(m.purse().shells,0,'first meetings no longer give shells');a.creatureBook.record('smelt');assert.equal(m.purse().shells,0,'repeat meetings no longer give shells');
 const req=a.villageNotes.todaysRequests()[0][0];a.villageEvent(req);assert.equal(m.purse().shells,0,"daily requests no longer give shells");
 assert.equal(m.earn(20),15);assert.equal(m.purse().shells,15);assert.equal(m.earn(1),0,'daily cap ignored');w.advance(day);assert.equal(m.earn(1),1,'cap does not reset the next day');
 // Shop: buy, use, sell back for half; nothing is bought twice or on credit.
 assert.equal(m.buy('kite-sun'),true);assert.equal(m.purse().shells,11);assert.equal(m.choice('kite'),0xf2c14e);assert.equal(m.buy('kite-sun'),false);
 m.use('kite-sun');assert.equal(m.choice('kite'),null);m.use('kite-sun');assert.equal(m.sell('kite-sun'),true);assert.equal(m.purse().shells,13);assert.equal(m.choice('kite'),null);assert(!m.owns('kite-sun'));
 for(const id of['paper-4','kite-sea','kite-plum'])m.buy(id);assert.equal(m.purse().shells,0);assert.equal(m.buy('lantern-sky'),false,'bought on credit');
 // Bought letter paper is accepted by the letter flow and the rules.
 a.villageNotes.sendLetter('*','별빛으로 인사',4);const sent=Object.values(JSON.parse(w.storage.get('village-store:0123456789abcdef01234567:letters')));assert.equal(sent.at(-1).s,4,'bought paper is not kept on the letter');
 // Piggy bank: one shell a day while ten or more are saved, never for days below ten.
 m.earn(12);assert.equal(m.deposit(10),10);w.advance(day);assert.equal(m.purse().bank,11);w.advance(2*day);assert.equal(m.purse().bank,13);m.withdraw(5);w.advance(day);assert.equal(m.purse().bank,8,'interest below ten');m.deposit(2);w.advance(day);assert.equal(m.purse().bank,11);
 // The shop pauses world taps while open; broken storage starts fresh.
 m.open();assert(m.isOpen());m.close();w.storage.set('village-purse','{oops');assert.equal(m.purse().shells,0);
 console.log('PASS: '+world+' normal play grants no currency and legacy purchases, balances and letter paper remain compatible.');
}
const rules=JSON.parse(fs.readFileSync(path.join(root,'winter/database.rules.json'),'utf8')).rules.village.$party.letters.$id.s['.validate'];assert(rules.includes('<= 4'),'letter paper rule does not allow bought paper');
for(const w of['aquarium','library'])assert.equal(fs.readFileSync(path.join(root,w,'database.rules.json'),'utf8'),fs.readFileSync(path.join(root,'winter/database.rules.json'),'utf8'));
