const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{loadWorld,kst,root}=require('./test-harness.cjs');
(async()=>{
 // Find a Seoul week whose shared goal is fishing, so winter's real catch hook can be used.
 let start=kst(2026,11,2,10),probe=loadWorld('winter',{now:start,expose:['villageGoals']}).a.villageGoals;while(probe.goalFor(probe.week(start)).key!=='f')start+=7*86400e3;
 const w=loadWorld('winter',{now:start,expose:['villageGoals','villageEvent','villageJournal','villageStore']}),{a}=w,g=a.villageGoals,party='0123456789abcdef01234567';
 // The goal rotates weekly through three kinds, and the photo theme daily through five skies.
 const kinds=new Set([0,1,2].map(i=>g.goalFor(g.week(start)+i).key));assert.deepEqual([...kinds].sort(),['f','p','r']);assert.equal(new Set([0,1,2,3,4].map(i=>g.themeFor(Math.floor((start+9*3600e3)/86400e3)+i).id)).size,5);
 // Local fallback: a catch adds to this visitor's own weekly record.
 a.setNick('눈사람');a.villageEvent('fish');await new Promise(r=>setImmediate(r));let p=g.progress();assert.equal(p.goal.key,'f');assert.equal(p.total,1);assert.deepEqual([...p.names],['눈사람']);
 // Shared records: the total adds everyone's week, names are listed without counts, other weeks are ignored.
 const key='village-store:'+party+':goals',local=JSON.parse(w.storage.get(key));local['w'+g.week()+'-friendAuid0001']={w:g.week(),f:12,p:0,r:0,n:'곰돌이',u:'friendAuid0001',t:1};local['w'+g.week()+'-friendBuid0002']={w:g.week(),f:6,p:3,r:0,n:'가람',u:'friendBuid0002',t:1};local['w'+(g.week()-1)+'-friendAuid0001']={w:g.week()-1,f:99,p:0,r:0,n:'곰돌이',u:'friendAuid0001',t:1};w.storage.set(key,JSON.stringify(local));
 a.villageStore.subscribe('goals',()=>{});await a.villageStore.put('goals','noop-'+Date.now(),{w:-1});p=g.progress();assert.equal(p.total,19,'group total is wrong');assert.deepEqual([...p.names],['가람','곰돌이','눈사람']);assert(!p.done);
 g.open();const text=[...w.nodes.values()].filter(n=>n.className==='creature-count').map(n=>n.textContent).join('|');assert(text.includes('19 / 20'));assert(text.includes('함께한 친구: 가람, 곰돌이, 눈사람'));assert(!/곰돌이\s*\d|12마리|1위|순위/.test(text),'per-person counts or ranks are shown');g.close();
 // Reaching the goal together is celebrated once and written in the journal.
 a.villageEvent('fish');await new Promise(r=>setImmediate(r));assert(g.progress().done);assert(a.villageJournal.done()['goal-done']);
 // Photo theme: only under today's sky, once per day.
 const theme=g.themeFor(Math.floor((w.clock.ms+9*3600e3)/86400e3)),fits={phase:'night',kind:'clear',daylight:0};const sky=[{phase:'day',kind:'clear',daylight:1},{phase:'night',kind:'clear',daylight:0},{phase:'day',kind:'precip',daylight:1},{phase:'dusk',kind:'clear',daylight:.3},{phase:'day',kind:'fog',daylight:1}].find(s=>theme.test(s));const miss=[{phase:'day',kind:'clear',daylight:1},{phase:'night',kind:'precip',daylight:0}].find(s=>!theme.test(s));
 assert.equal(g.photo(miss),false);assert.equal(g.photo(sky),true);assert.equal(g.photo(sky),false,'photo theme counted twice');assert(a.villageJournal.done()['photo-theme']);
 // Rules: one record per visitor per week, keyed by their uid, numbers bounded.
 const rules=['winter','aquarium','library'].map(x=>fs.readFileSync(path.join(root,x,'database.rules.json'),'utf8'));assert(rules.every(r=>r===rules[0]));const goal=JSON.parse(rules[0]).rules.village.$party.goals.$id;assert(goal['.write'].includes('$id.endsWith(auth.uid)'));assert(goal.f['.validate'].includes('<= 500'));assert.equal(goal.$other['.validate'],false);
 for(const world of['aquarium','library']){const x=loadWorld(world,{now:start,expose:['villageGoals']});assert([...x.nodes.values()].some(n=>n.textContent==='함께하는 목표'&&n.className==='resident-next'),world+' has no goal choice');}
 console.log('PASS: contests became weekly shared goals summed across the friend group with names but no per-person counts or ranks, plus a once-a-day ocean photo theme under the shared sky.');
})().catch(e=>{console.error(e);process.exit(1);});
