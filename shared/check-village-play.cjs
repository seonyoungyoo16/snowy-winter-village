const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const rules=JSON.parse(fs.readFileSync(path.join(root,'winter/database.rules.json'),'utf8')).rules.rooms.$room.players.$session;
for(const m of['celebrate','idle','walk'])assert(rules.m['.validate'].includes("'"+m+"'"),m+' is not an allowed mode');assert(rules.b['.validate'].includes('<= 0.7'));
function load(world,search){
 let serial=0,clock=1000;const nodes=new Map(),store=new Map(),toasts=[],ctx2d=new Proxy({measureText:()=>({width:100}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
 function node(id){if(!nodes.has(id))nodes.set(id,{id,hidden:false,disabled:false,value:'',textContent:'',className:'',style:{},dataset:{},children:[],handlers:{},classList:{add(){},remove(){},toggle(){}},addEventListener(k,v){this.handlers[k]=v;},setAttribute(k,v){this[k]=v;},focus(){},append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},getContext:()=>ctx2d});return nodes.get(id);}
 const c={console:{log(){},warn(){},error:console.error},performance:{now:()=>clock*1000},Math,Date,URL,URLSearchParams,Float32Array,Uint32Array,Uint8Array,Int32Array,Map,Set,Array,Object,Number,JSON,Promise,crypto:crypto.webcrypto,devicePixelRatio:1,innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){},addEventListener(){},document:{hidden:false,body:node('body'),getElementById:node,createElement:()=>node('generated-'+serial++),createTextNode:t=>({textContent:t}),querySelectorAll:()=>[],addEventListener(){}},location:{hash:'#room='+({winter:'',aquarium:'aq_',library:'lb_'}[world])+'0123456789abcdef01234567',pathname:'/snowy-winter-village/',search,href:'https://example.com/'},history:{replaceState(){}},localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)}};c.window=c;vm.createContext(c);
 const scripts=[...fs.readFileSync(path.join(root,world,'docs/index.html'),'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);vm.runInContext(scripts[0],c);c.THREE.WebGLRenderer=class{constructor(){this.domElement=node('renderer');}setPixelRatio(){}setSize(){}setClearColor(){}render(){}};
 vm.runInContext(scripts.at(-1).replace(/\}\)\(\);\s*$/,`globalThis.audit={villagePlay,player,scene,setEntered(){entered=true;},setMode(m){mode=m;},getMode(){return mode;}};})();`),c);
 const a=c.audit;a.setEntered();return{a,p:a.villagePlay,T:c.THREE,nodes,advance(s){clock+=s;}};
}
const idle={m:'idle',b:0,x:1},walking={m:'walk',b:0},busy={m:'warm',b:.5};
for(const world of['winter','aquarium','library']){
 const{a,p,T,nodes,advance}=load(world,'?sky=day&weather=clear');
 // Emotes: only from an idle visitor, at most once per 2.5 s, encoded in a band no other activity uses.
 assert.deepEqual(p.wire(idle),idle);assert.equal(p.say(1),true);assert.deepEqual({...p.wire(idle)},{m:'celebrate',b:.15,x:1});assert.deepEqual({...p.wire(walking)},{m:'celebrate',b:.15});assert.deepEqual(p.wire(busy),busy,'an activity was rewritten');
 assert.equal(p.say(2),false,'emotes are not rate limited');advance(1.9);assert.deepEqual(p.wire(idle),idle,'the emote never ends');advance(1);assert.equal(p.say(5),true);assert.equal(p.wire(idle).b,.35);
 a.setMode('warm');advance(3);assert.equal(p.say(0),false,'emote interrupts an activity');a.setMode('idle');
 for(let i=0;i<p.EMOTES.length;i++)assert.equal(p.fromWire('celebrate',Math.round((.1+i*.05)*1000)/1000).emote,i);
 for(const b of[0,.55,.6,.65,.695,.7])assert.equal(p.fromWire('celebrate',b),null,'cat or wave state read as an emote');assert.equal(p.fromWire('idle',0),null);assert.equal(p.fromWire('warm',.5),null);
 // A friend's bubble pops once per change, fades, and can pop again after they stop.
 const friend={actor:{root:new T.Group()},data:{m:'celebrate',b:.2}};p.peer(friend,.016);const bubble=friend.actor.root.getObjectByName('emote-bubble');assert(bubble.visible);const first=friend.emoteAt;advance(.5);p.peer(friend,.016);assert.equal(friend.emoteAt,first,'held emote restarts');advance(2);p.peer(friend,.016);assert(!bubble.visible,'bubble never fades');
 friend.data={m:'idle',b:0};p.peer(friend,.016);friend.data={m:'celebrate',b:.2};p.peer(friend,.016);assert(bubble.visible,'repeat emote never shows');
 p.tick(.016);assert(a.player.getObjectByName('emote-bubble'),'own bubble missing');
 if(world!=='winter'){assert.equal(p.toggleKite(),false);assert.equal(p.lantern(),false);assert.equal(p.fromWire('idle',.41)&&world==='winter',false);console.log('PASS: '+world+' emotes go out only from idle visitors, stay clear of the cat and wave bands, rate-limit, and pop once on friends.');continue;}
 // Winter by day: the kite flies downwind on the shared wind and lands when the visitor starts an activity.
 assert.equal(p.toggleKite(),true);assert.equal(p.wire(idle).b,.41);p.tick(.016);const kite=a.scene.getObjectByName('village-kite');assert(kite&&kite.visible);assert(kite.position.y>a.player.position.y+6.5,'kite is not up in the sky');
 a.setMode('fish');p.tick(.016);assert.equal(p.kiteOn,false,'kite keeps flying during an activity');a.setMode('idle');assert.equal(p.lantern(),false,'lanterns by day');
 const kiter={actor:{root:new T.Group()},data:{m:'walk',b:.41}};p.peer(kiter,.016);assert.equal(a.scene.children.filter(o=>o.name==='village-kite'&&o.visible).length,1,"friend's kite missing");kiter.data={m:'idle',b:0};p.peer(kiter,.016);p.drop(kiter);
 console.log('PASS: winter emotes and the daytime kite follow the shared wind, stop for activities and reach friends through rule-approved fields.');
}
{
 // Winter at night: one lantern per release, rising and fading within half a minute; a friend's release spawns exactly one.
 const{a,p,T,advance}=load('winter','?sky=night&weather=clear');assert.equal(p.toggleKite(),false,'kite at night');
 assert.equal(p.lantern(),true);assert.equal(p.lanterns.length,1);assert.equal(p.wire(idle).b,.45);assert.equal(p.lantern(),false,'lanterns spam');const startY=p.lanterns[0].mesh.position.y;
 for(let i=0;i<10;i++)p.tick(1);assert(p.lanterns[0].mesh.position.y>startY+4,'lantern does not rise');advance(3);assert.deepEqual(p.wire(idle),idle);for(let i=0;i<25;i++)p.tick(1);assert.equal(p.lanterns.length,0,'lantern never fades');
 const friend={actor:{root:new T.Group()},data:{m:'idle',b:.45}};for(let i=0;i<5;i++)p.peer(friend,.1);assert.equal(p.lanterns.length,1,'friend lantern repeats');
 console.log('PASS: winter night lanterns rise, fade and are shared once per release.');
}
