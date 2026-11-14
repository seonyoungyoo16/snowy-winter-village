const assert=require('node:assert/strict'),{loadWorld,kst}=require('./test-harness.cjs');
const DAY=86400e3,load=(world,now,storage)=>loadWorld(world,{now,storage,expose:['villageFolk','villageMarket','helpOpen','camera']});
for(const world of['winter','aquarium','library']){
 const t0=kst(2026,11,10,14),w=load(world,t0),{a}=w,V=a.villageFolk,F=V.FOLK;
 // Plenty of folk, each different: unique names, mixed animals and coats, several temperaments.
 assert(F.length>=(world==='winter'?14:8),world+' has only '+F.length+' folk');assert.equal(new Set(F.map(f=>f.name)).size,F.length,'two folk share a name');
 assert(new Set(F.map(f=>f.kind)).size>=2&&new Set(F.map(f=>f.look.c)).size>=3&&new Set(F.map(f=>f.type)).size>=3,'the folk look too alike');
 for(const f of F)for(const s of f.stops)assert(!a.blocked(s.x,s.z,.3),f.name+' stops inside something at '+s.x.toFixed(1)+','+s.z.toFixed(1));
 if(world==='winter')assert(new Set(F.map(f=>f.home)).size>=5,'winter folk do not spread over the districts');
 // Everyone's place follows Seoul time alone, so another browser sees the same thing.
 const other=load(world,t0).a.villageFolk;for(const f of F){const p=V.placeAt(f,t0,false),q=other.placeAt(other.FOLK.find(g=>g.id===f.id),t0,false);assert(Math.abs(p.x-q.x)<1e-9&&Math.abs(p.z-q.z)<1e-9,'folk disagree between browsers');}
 // They walk between stops and rest at them.
 const f0=F[0];let walkAt=null;for(let s=0;s<f0.cycle*1000;s+=1000)if(V.placeAt(f0,t0+s,false).walking&&V.placeAt(f0,t0+s+5000,false).walking){walkAt=t0+s;break;}assert(walkAt,'never walks');const p1=V.placeAt(f0,walkAt+2000,false),p2=V.placeAt(f0,walkAt+4000,false);assert(Math.hypot(p1.x-p2.x,p1.z-p2.z)>.5,'a walker does not move');
 assert(F.some(f=>!V.placeAt(f,t0,false).walking),'nobody rests');
 // Only a few nearby folk get a body at once; the rest stay hidden until you come close.
 V.tick(.1);assert(V.visible().length<=5,'too many folk drawn');for(const f of V.visible())assert(!a.blocked(f.pos.x,f.pos.z,0),f.name+' stands inside something');
 // Fewer folk at night.
 const night=F.filter(f=>V.placeAt(f,kst(2026,11,10,2),false).out).length;assert(night<F.length&&night<F.filter(f=>V.placeAt(f,t0,false).out).length,'nobody goes home at night');
 // Talking: walk up, the nearest one shows a name bubble, a reply a day brings you closer, and friendship is remembered.
 const target=V.visible()[0]||F[0];a.player.position.set(target.pos.x+1.2,0,target.pos.z);a.camera.position.set(target.pos.x+1.2,7,target.pos.z+9);a.camera.lookAt(target.pos.x,0,target.pos.z);a.camera.updateMatrixWorld(true);V.tick(.1);assert(V.near,'no one to talk to nearby');assert(!V.bubble.hidden,'no name bubble');assert(V.bubble.textContent.includes(V.near.name));
 const id=V.near.id;assert(V.open(id));assert(V.isOpen()&&a.helpOpen(),'the chat should hold other input');assert(V.reply(0));assert.equal(V.bondOf(id).f,1);V.close();V.open(id);V.reply(1);assert.equal(V.bondOf(id).f,1,'two steps in one day');V.close();
 const shells=()=>a.villageMarket.purse().shells,before=shells();for(let d=1;d<=3;d++){w.clock.ms=t0+d*DAY;V.open(id);V.reply(2);V.close();}assert(V.bondOf(id).f>=3);assert.equal(shells(),before,'the retired reward should not give shells');
 assert.equal(load(world,t0+4*DAY,w.storage).a.villageFolk.bondOf(id).f,V.bondOf(id).f,'friendship was not remembered');
 assert.equal(load(world,t0,new Map([['village-folk-v1','[1,2]']])).a.villageFolk.bondOf(id).f,0,'damaged storage');
 // The merchant comes to the winter market every third day and at weekends, with a regular conversation.
 if(world==='winter'){const M=V.merchant;assert(M);const days=[0,1,2,3,4,5,6].map(d=>V.placeAt(M,kst(2026,11,9,14)+d*DAY,false).out);assert(days.some(Boolean)&&!days.every(Boolean),'the merchant should come and go');
  const visit=[0,1,2,3,4,5,6].map(d=>kst(2026,11,9,14)+d*DAY).find(ms=>V.placeAt(M,ms,false).out);w.clock.ms=visit;V.open('merchant');V.reply(0);assert(!a.villageMarket.isOpen(),'the retired shop opened from the merchant');V.close();}
 else assert.equal(V.merchant,null);
 console.log('PASS: '+world+' has '+F.length+' different folk walking Seoul-time loops the same in every browser, at most five drawn nearby, fewer at night, a name bubble to chat, a daily step of friendship'+(world==='winter'?', and a merchant on market days.':'.'));
}
