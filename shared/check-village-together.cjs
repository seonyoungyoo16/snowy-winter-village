const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.join(__dirname,'..');
function load(world,store=new Map()){
 let serial=0;const nodes=new Map(),ctx2d=new Proxy({measureText:()=>({width:100}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
 function node(id){if(!nodes.has(id))nodes.set(id,{id,hidden:false,disabled:false,value:'',textContent:'',className:'',style:{},dataset:{},children:[],handlers:{},classList:{add(){},remove(){},toggle(){}},addEventListener(k,v){this.handlers[k]=v;},setAttribute(k,v){this[k]=v;},getAttribute(k){return this[k];},focus(){},remove(){},append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},getContext:()=>ctx2d});return nodes.get(id);}
 for(const id of['help-modal','invite-modal','memory-modal','cat-modal','book-picker'])node(id).hidden=true;
 const c={console:{log(){},warn(){},error:console.error},performance,Math,Date,URL,URLSearchParams,Float32Array,Uint32Array,Uint8Array,Int32Array,Map,Set,Array,Object,Number,JSON,Promise,crypto:crypto.webcrypto,devicePixelRatio:1,innerWidth:390,innerHeight:844,matchMedia:()=>({matches:false}),requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){},addEventListener(){},document:{hidden:false,body:node('body'),getElementById:node,createElement:()=>node('generated-'+serial++),createTextNode:t=>({textContent:t}),querySelectorAll:()=>[],addEventListener(){}},location:{hash:'#room='+({winter:'',aquarium:'aq_',library:'lb_'}[world])+'0123456789abcdef01234567',pathname:'/snowy-winter-village/',search:'',href:'https://example.com/'},history:{replaceState(){}},localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)}};c.window=c;vm.createContext(c);
 const scripts=[...fs.readFileSync(path.join(root,world,'docs/index.html'),'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);vm.runInContext(scripts[0],c);c.THREE.WebGLRenderer=class{constructor(){this.domElement=node('renderer');}setPixelRatio(){}setSize(){}setClearColor(){}render(){}};
 vm.runInContext(scripts.at(-1).replace(/\}\)\(\);\s*$/,`globalThis.audit={villageTogether,villageSnowball,villagePlay,radialMenu,player,scene,remotePlayers,blocked,THREE,setEntered(){entered=true;},wireBody(b=0){return villageTogether.wire(villageSnowball.wire(villagePlay.wire({m:'idle',b})));}};})();`),c);
 return{a:c.audit,T:c.audit.villageTogether,store,toast:()=>nodes.has('toast')?nodes.get('toast').textContent:''};
}
const fakePeer=(a,id,name,x,z,extra={})=>{const root=new a.THREE.Group();root.position.set(x,0,z);root.rotation.y=extra.a||0;const peer={actor:{root},data:{n:name,m:'idle',b:0,x,y:0,z,a:0,...extra}};a.remotePlayers.set(id,peer);return peer;};
const run=(T,s)=>{for(let i=0;i<Math.round(s*30);i++)T.tick(1/30);};
for(const world of['winter','aquarium','library']){
 const{a,T,store,toast}=load(world),P=a.player,labels=()=>a.radialMenu.items().map(i=>i.label);
 // The bands sit in free idle/walk values: ping .05–.25, carry .30, cocoa .33; none collide with kite, lantern, throws or library seats.
 for(let k=0;k<=20;k++)assert.equal(T.decode('walk',.05+k*.01).ping,k);assert(T.decode('idle',.30).carry);assert(T.decode('idle',.33).cocoa);
 for(const b of[0,.41,.45,.47,.54,.6,.67])assert.equal(T.decode('walk',b),null,'band overlaps '+b);assert.equal(T.decode('celebrate',.1),null);assert.equal(T.decode('warm',.3),null);
 assert(labels().includes('여기!'));assert(!labels().includes('코코아 건네기'),'cocoa is handed over from the hotbar, not the ring');
 // Ping: needs the village; I face the spot, friends get the distance for 1.5 s, and pings are 4 s apart.
 assert.equal(T.ping(),false);a.setEntered();P.position.set(0,0,0);P.rotation.y=0;const p=T.ping(6,8);assert.equal(p.d,10);assert(Math.abs(P.rotation.y-Math.atan2(6,8))<1e-9);assert.equal(T.pings.length,1);
 assert.equal(a.wireBody().b,.15);assert.equal(T.ping(1,1),false,'pings closer than 4 s apart');run(T,1.6);assert.equal(a.wireBody().b,0,'the ping signal should end');
 run(T,9);assert.equal(T.pings.length,0,'a ping should fade after ten seconds');run(T,3);const far=T.ping(0,40);assert.equal(far.d,20,'distance should stop at 20 m');run(T,11);
 assert.equal(a.wireBody(.62).b,.62,'a library seat signal was overwritten');
 // A friend's ping lands where their facing and distance say, once per signal, with an arrow tag when it is off screen.
 const pinger=fakePeer(a,'p1','토끼',2,2,{m:'walk',b:.05+5*.01,a:Math.PI/2});T.peer(pinger);T.peer(pinger);assert.equal(T.pings.length,1,'one signal should ping once');
 const fp=T.pings[0];assert(Math.abs(fp.x-7)<1e-9&&Math.abs(fp.z-2)<1e-9,'friend ping at '+fp.x+','+fp.z);assert(toast().includes('토끼'));run(T,.1);assert(fp.tag.textContent.includes('토끼 · 여기!'));
 pinger.data.b=0;T.peer(pinger);a.remotePlayers.clear();run(T,11);
 // The big object: grab it only nearby; alone it creeps forward at most 0.8 m/s, and never through a wall.
 const B=T.big,start={x:B.position.x,z:B.position.z};assert.equal(T.grab(),false,'grabbed from far away');P.position.set(start.x,0,start.z-1.6);P.rotation.y=0;assert(labels().some(l=>l.endsWith('잡기')));assert(T.grab());assert(T.carrying);
 assert.equal(a.wireBody().b,T.CARRY_B);run(T,1);const solo=Math.hypot(B.position.x-start.x,B.position.z-start.z);assert(solo>.2&&solo<=.81,'solo push moved '+solo);
 // With a friend carrying on the other side it sits between both of us and keeps up.
 const friend=fakePeer(a,'p2','곰',start.x,start.z+1.6,{m:'walk',b:T.CARRY_B,a:Math.PI});assert.equal(T.carriers().length,2);
 P.position.z+=1;friend.actor.root.position.z+=1;run(T,1);assert(Math.abs(B.position.z-(P.position.z+friend.actor.root.position.z)/2)<.05,'pair carry should sit between the two');
 assert(!a.blocked(B.position.x,B.position.z,T.BIG.r*.8));
 // Walking far away puts it down gently; the spot is remembered in this browser.
 a.remotePlayers.clear();P.position.x+=8;run(T,.1);assert(!T.carrying,'still carrying from 8 m away');run(T,2.5);const kept=JSON.parse(store.get('village-carry:'+world));assert(Math.abs(kept.x-B.position.x)<.01&&Math.abs(kept.z-B.position.z)<.01);
 assert(Math.abs(load(world,store).T.big.position.z-B.position.z)<.01,'the spot was not restored');assert.equal(load(world,new Map([['village-carry:'+world,'{"x":99,"z":0}']])).T.big.position.x,T.BIG.x,'an outside spot was restored');
 // Cocoa: only with a friend within 3 m, 5 s apart; the receiver warms up with a heart only if they are the nearest friend.
 P.position.set(0,0,0);assert.equal(T.cocoa(),false);const pal=fakePeer(a,'p3','여우',0,2.5);assert(!labels().includes('코코아 건네기'));assert.equal(T.cocoa(),pal);assert.equal(a.wireBody().b,T.COCOA_B);assert.equal(T.cocoa(),false,'cocoa closer than 5 s apart');run(T,1.6);assert.equal(a.wireBody().b,0);
 a.remotePlayers.clear();P.position.set(0,0,2);const giver=fakePeer(a,'p4','다람',0,0,{m:'idle',b:T.COCOA_B});fakePeer(a,'p5','먼 친구',0,6);T.peer(giver);assert.equal(a.villagePlay.activeEmote(),0,'no heart for the received cocoa');assert(toast().includes('다람'));
 a.remotePlayers.clear();run(T,3);P.position.set(0,0,2);const giver2=fakePeer(a,'p6','곰',0,0,{m:'idle',b:T.COCOA_B});fakePeer(a,'p7','더 가까운 친구',0,.5);T.peer(giver2);assert(!toast().includes('곰 님이 건넨'),'cocoa went to someone who was not the nearest');
 console.log('PASS: '+world+' together: pings reach friends through b .05–.25 and fade after ten seconds, the '+T.BIG.name+' creeps alone and sits between two carriers without passing walls, and cocoa warms only the nearest friend.');
}
