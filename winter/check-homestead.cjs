const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{loadWorld,kst,root}=require('../shared/test-harness.cjs');
assert(!/avatar\(|palettes/.test(fs.readFileSync(path.join(__dirname,'homestead.js'),'utf8')),'the homestead must not touch avatars');
(async()=>{
 const w=loadWorld('winter',{now:kst(2026,11,7,10),expose:['homestead','villageJournal','villageMarket','helpOpen']}),{a,T}=w,h=a.homestead,D=86400;
 // Places: beds and the pen block walking, the yard stays walkable, and every activity and each new place stays reachable.
 for(const name of['homestead-bed-0','homestead-bed-1','homestead-bed-2','homestead-pen','homestead-yard-mat'])assert(a.scene.getObjectByName(name),name);
 assert(a.blocked(h.GARDEN.x,h.GARDEN.z));assert(a.blocked(h.PEN.x,h.PEN.z));assert(!a.blocked(h.YARD.x,h.YARD.z),'the yard blocks walking');
 a.player.position.set(0,0,7);for(const p of[...Object.values(a.places),{x:h.GARDEN.x,z:h.GARDEN.z+1.6},{x:h.PEN.x+2.2,z:h.PEN.z},{x:h.YARD.x,z:h.YARD.z}])assert(a.pathTo(p.x,p.z).length||Math.hypot(p.x,p.z-7)<1,'unreachable '+JSON.stringify(p));
 // #16 Garden: one stage per Seoul day of watering, no withering, a bloom to pick, then the bed is free again.
 assert.equal(await h.plant(0,'cactus'),null);assert.equal(await h.plant(0,'pansy'),'local');assert.equal(await h.plant(0,'snowdrop'),null,'planted over a crop');
 assert.equal(await h.water(0),'local');assert.equal(h.garden['plot-0'].k,1);assert.equal(await h.water(0),null,'watered twice in a day');
 w.advance(D);await h.water(0);w.advance(3*D);await h.water(0);assert.equal(h.garden['plot-0'].k,h.BLOOM,'a skipped day withers the crop');assert.equal(await h.water(0),null);
 const shells=a.villageMarket.purse().shells;assert.equal(await h.harvest(0),'local');assert.equal(h.garden['plot-0'].c,'none');assert(a.villageJournal.done()['first-bloom']);assert.equal(a.villageMarket.purse().shells,shells+1);assert.equal(await h.harvest(0),null);
 // #17 Rabbits: three kinds of care once a day each, a shell for a full day, and the rabbits stay inside the fence.
 assert(h.care('feed'));assert(!h.care('feed'),'fed twice in a day');assert(h.care('pet'));const before=a.villageMarket.purse().shells;assert(h.care('brush'));assert.equal(a.villageMarket.purse().shells,before+1);assert(a.villageJournal.done()['first-rabbit']);w.advance(D);assert(h.care('feed'),'care does not reset the next day');
 for(let t=0;t<40;t+=.37){h.tick(t);for(const{r}of h.rabbits)assert(Math.hypot(r.position.x,r.position.z)<h.PEN.r-.3,'a rabbit escapes');}
 // #18 Yard: any friend places, swaps or clears a decoration in one of nine cells.
 assert.equal(await h.place(4,'snowman'),'local');assert.equal(h.yard.children.length,1);assert.equal(h.yard.children[0].name,'decor-snowman');assert(Math.abs(h.yard.children[0].position.x-h.YARD.x)<1e-9);
 await h.place(4,'bench');assert.equal(h.yard.children[0].name,'decor-bench');await h.place(0,'lantern');assert.equal(h.yard.children.length,2);await h.place(4,'none');assert.equal(h.yard.children.length,1);assert.equal(await h.place(9,'pot'),null);assert.equal(await h.place(1,'castle'),null);assert(a.villageJournal.done()['first-decor']);
 // Taps: far away only hints; close up opens the sheet and pauses world taps.
 const ray=(x,z)=>new T.Raycaster(new T.Vector3(x,5,z),new T.Vector3(0,-1,0));a.player.position.set(0,0,7);assert.equal(h.pick(ray(h.GARDEN.x-1.2,h.GARDEN.z)),false);
 a.player.position.set(h.GARDEN.x,0,h.GARDEN.z+1.6);assert.equal(h.pick(ray(h.GARDEN.x-1.2,h.GARDEN.z)),true);assert(h.isOpen()&&a.helpOpen());h.close();
 a.player.position.set(h.PEN.x+2.2,0,h.PEN.z);assert(h.pick(ray(h.PEN.x,h.PEN.z)));h.close();a.player.position.set(h.YARD.x,0,h.YARD.z+2);assert(h.pick(ray(h.YARD.x,h.YARD.z)));h.close();
 // Rules: fixed group slots with known crops and decorations, identical in every world.
 const rules=['winter','aquarium','library'].map(x=>fs.readFileSync(path.join(root,x,'database.rules.json'),'utf8'));assert(rules.every(r=>r===rules[0]));const v=JSON.parse(rules[0]).rules.village.$party;assert(v.garden.$id['.write'].includes('plot-[0-2]'));assert(v.yard.$id['.write'].includes('cell-[0-8]'));assert(v.garden.$id.k['.validate'].includes('<= 3'));assert.equal(v.yard.$id.$other['.validate'],false);
 console.log('PASS: the winter homestead grows group-tended flowers by daily watering without withering, keeps daily rabbit care in the fence, and lets friends arrange a nine-cell yard, all reachable and rule-shaped.');
})().catch(e=>{console.error(e);process.exit(1);});
