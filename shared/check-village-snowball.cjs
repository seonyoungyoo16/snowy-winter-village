const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),rules=fs.readFileSync(path.join(root,'winter/database.rules.json'),'utf8');
function load(world){
 let serial=0;const nodes=new Map(),store=new Map(),toasts=[],ctx2d=new Proxy({measureText:()=>({width:100}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
 function node(id){if(!nodes.has(id))nodes.set(id,{id,hidden:false,disabled:false,value:'',textContent:'',className:'',style:{},dataset:{},children:[],handlers:{},classList:{add(){},remove(){},toggle(){}},addEventListener(k,v){this.handlers[k]=v;},setAttribute(k,v){this[k]=v;},getAttribute(k){return this[k];},focus(){},append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},getContext:()=>ctx2d});return nodes.get(id);}
 const c={console:{log(){},warn(){},error:console.error},performance,Math,Date,URL,URLSearchParams,Float32Array,Uint32Array,Uint8Array,Int32Array,Map,Set,Array,Object,Number,JSON,Promise,crypto:crypto.webcrypto,devicePixelRatio:1,innerWidth:390,innerHeight:844,matchMedia:()=>({matches:false}),requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){},addEventListener(){},document:{hidden:false,body:node('body'),getElementById:node,createElement:()=>node('generated-'+serial++),createTextNode:t=>({textContent:t}),querySelectorAll:()=>[],addEventListener(){}},location:{hash:'#room='+({winter:'',aquarium:'aq_',library:'lb_'}[world])+'0123456789abcdef01234567',pathname:'/snowy-winter-village/',search:'',href:'https://example.com/'},history:{replaceState(){}},localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)}};c.window=c;vm.createContext(c);
 const scripts=[...fs.readFileSync(path.join(root,world,'docs/index.html'),'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);vm.runInContext(scripts[0],c);c.THREE.WebGLRenderer=class{constructor(){this.domElement=node('renderer');}setPixelRatio(){}setSize(){}setClearColor(){}render(){}};
 vm.runInContext(scripts.at(-1).replace(/\}\)\(\);\s*$/,`globalThis.audit={villageSnowball,villagePlay,radialMenu,player,scene,remotePlayers,THREE,setEntered(){entered=true;},wireBody(){return villageSnowball.wire(villagePlay.wire({m:'idle',b:0}));}};})();`),c);
 return{a:c.audit,S:c.audit.villageSnowball,toast:()=>nodes.has('toast')?nodes.get('toast').textContent:''};
}
const fakePeer=(a,id,name,x,z,extra={})=>{const root=new a.THREE.Group();root.position.set(x,0,z);const peer={actor:{root},data:{n:name,m:'idle',b:0,x,y:0,z,a:0,...extra}};a.remotePlayers.set(id,peer);return peer;};
const names={winter:'눈덩이',aquarium:'비눗방울',library:'종이비행기'};
// The band must stay inside what the existing rules accept for b, and clear of kite (.41), lantern (.45) and the library's seats (.6+).
assert(/"b": \{\s*".validate": "newData.isNumber\(\) && newData.val\(\) >= 0 && newData.val\(\) <= 0.7"/.test(rules),'the player b rule changed; recheck the throw band');
for(const world of['winter','aquarium','library']){
 const{a,S,toast}=load(world),P=a.player;assert.equal(S.KIND.name,names[world]);assert(S.KIND.verb.startsWith(names[world]));assert(!a.radialMenu.items().some(i=>i.label===S.KIND.verb),'the throwable belongs to the hotbar, not the ring');
 for(let d=S.MIN;d<=S.MAX;d++){const b=S.wireOf(d);assert(b>=.47&&b<=.54,'band leaves .47–.54: '+b);assert.equal(S.decode('walk',b),d);}
 assert.equal(S.decode('idle',.41),null);assert.equal(S.decode('idle',.45),null);assert.equal(S.decode('celebrate',.5),null);assert.equal(S.decode('walk',.6),null);assert.equal(S.decode('idle',0),null);
 // Pick up only inside the village and when free; tap throws once, then it must be picked up again.
 assert.equal(S.arm(),false);a.setEntered();P.position.set(0,0,0);P.rotation.y=0;assert.equal(S.throwAt(0,5),null,'throw without picking up');assert(S.arm());assert(S.hand.visible);
 const t=S.throwAt(0,6.2);assert.equal(t.dist,6.2);assert.equal(t.peer,null);assert(!S.armed&&!S.hand.visible);assert.equal(S.flights.length,1);
 // Friends see it for a moment through the band, then the signal ends.
 assert.equal(a.wireBody().b,S.wireOf(6));S.tick(1.3);assert.equal(a.wireBody().b,0,'the throw signal should end');
 for(let i=0;i<40;i++)S.tick(1/30);assert.equal(S.flights.length,0);assert(S.splashes.length===0||S.splashes.length===8);
 // Too soon after the last throw: nothing; distance is kept between 3 and 10 m.
 S.arm();assert(S.throwAt(0,30));S.tick(.2);S.arm();assert.equal(S.throwAt(0,4),null,'throws closer than 1.5 s apart');S.tick(2);for(let i=0;i<60;i++)S.tick(1/30);
 assert(S.throwAt(0,4),'a refused throw should keep it in hand');S.tick(2);S.arm();const far=S.throwAt(30,0);assert.equal(far.dist,10);assert(Math.abs(P.rotation.y-Math.PI/2)<1e-9,'the thrower should face the throw');for(let i=0;i<60;i++)S.tick(1/30);S.tick(2);
 // Soft aim: a friend near the chosen spot, or nearly in line within reach, becomes the target; one far off the line does not.
 const near=fakePeer(a,'p1','토끼',1.5,7);S.arm();let r=S.throwAt(0,7);assert.equal(r.peer,near,'friend near the spot');for(let i=0;i<60;i++)S.tick(1/30);assert(toast().includes('토끼'),'no splash note for the friend');S.tick(2);
 a.remotePlayers.clear();const line=fakePeer(a,'p2','곰',.6,8);S.arm();r=S.throwAt(0,3.5);assert.equal(r.peer,line,'friend nearly in line');for(let i=0;i<60;i++)S.tick(1/30);S.tick(2);
 a.remotePlayers.clear();fakePeer(a,'p3','여우',8,0);S.arm();r=S.throwAt(0,5);assert.equal(r.peer,null,'a friend far off the line was aimed at');for(let i=0;i<60;i++)S.tick(1/30);S.tick(2);a.remotePlayers.clear();
 // A friend's throw lands where their signal says; if it reaches me I laugh with the shared smile emote.
 P.position.set(0,0,5);const thrower=fakePeer(a,'p4','다람',0,0,{m:'walk',b:S.wireOf(5),a:0});S.peer(thrower);S.peer(thrower);assert.equal(S.flights.length,1,'one signal should throw once');
 for(let i=0;i<60;i++)S.tick(1/30);assert(toast().includes('다람')&&toast().includes('하하'),'no laugh note when hit: '+toast());assert.equal(a.villagePlay.activeEmote(),1,'no laugh emote when hit');
 thrower.data.b=0;S.peer(thrower);thrower.data.b=S.wireOf(9);S.peer(thrower);assert.equal(S.flights.length,1,'a new signal should throw again');
 console.log('PASS: '+world+' '+names[world]+' toss waits for the village, throws once per pick-up toward the tap, softly aims at a nearby friend, tells friends through b .47–.54 for a moment, keeps 1.5 s between throws and makes a hit friend laugh.');
}
