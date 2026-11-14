const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let serial=0;const nodes=new Map(),ctx2d=new Proxy({measureText:()=>({width:100}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
function node(id){if(!nodes.has(id))nodes.set(id,{id,hidden:false,disabled:false,value:'',textContent:'',style:{},dataset:{},children:[],handlers:{},classList:{add(){},remove(){},toggle(){}},addEventListener(k,v){this.handlers[k]=v;},setAttribute(){},focus(){},append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},getContext:()=>ctx2d});return nodes.get(id);}
const store=new Map(),c={console:{log(){},warn(){},error:console.error},performance,Math,Date,URL,URLSearchParams,Float32Array,Uint32Array,Uint8Array,Int32Array,Map,Set,Array,Object,Number,JSON,Promise,crypto:crypto.webcrypto,devicePixelRatio:1,innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){},addEventListener(){},document:{hidden:false,body:node('body'),getElementById:node,createElement:()=>node('generated-'+serial++),querySelectorAll:()=>[],addEventListener(){}},location:{hash:'#room=0123456789abcdef01234567',pathname:'/snowy-winter-village/',search:'',href:'https://example.com/'},history:{replaceState(){}},localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)}};c.window=c;vm.createContext(c);
const scripts=[...fs.readFileSync(__dirname+'/docs/index.html','utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);vm.runInContext(scripts[0],c);c.THREE.WebGLRenderer=class{constructor(){this.domElement=node('renderer');}setPixelRatio(){}setSize(){}setClearColor(){}render(){}};
vm.runInContext(scripts.at(-1).replace(/\}\)\(\);\s*$/,`globalThis.audit={creatureBook,iceFishing,action,navigate,player,character,scene,blocked,colliders,pathTo,remotePlayers,stateBody,updateUI,getMode(){return mode;},setEntered(){entered=true;},setNetwork(){networkAuth={currentUser:{uid:'test-user'}};}};})();`),c);
const a=c.audit,f=a.iceFishing,T=c.THREE;a.setEntered();a.setNetwork();for(const id of['help-modal','invite-modal'])node(id).hidden=true;

// The two side-by-side stools face separate blocked holes with a clear route from the plaza.
assert(a.scene.getObjectByName('ice-fishing-pond'));assert.equal(f.SEATS.length,2);
for(const s of f.SEATS){assert(a.blocked(s.hole.x,s.hole.z),'the hole is walkable');assert(!a.blocked(s.x,s.z,.3),'seat overlaps furniture');assert.equal(Math.atan2(s.hole.x-s.x,s.hole.z-s.z),s.yaw);}
assert.equal(f.SEATS[0].z,f.SEATS[1].z);
assert(a.pathTo(f.APPROACH.x,f.APPROACH.z).length,'no route from the entrance to the pond');

// Every creature can appear under some shared sky, and night-only creatures stay at night.
const skies=[];for(const phase of['dawn','day','dusk','night'])for(const kind of['clear','cloudy','precip','heavy','fog'])skies.push({phase,kind,daylight:{dawn:.4,day:1,dusk:.3,night:0}[phase]});
for(const fish of f.FISH)assert(skies.some(s=>fish.when(s)),fish.id+' never appears');
for(const s of skies){const ids=new Set();for(let i=0;i<40;i++)ids.add(f.pick(s,()=>i/40).id);assert(ids.has('smelt'));if(ids.has('star-smelt'))assert(s.phase==='night'&&s.kind==='clear');}

// The real button flow: sit, wait, bite, reel, hold, release — and a missed bite only means waiting again.
a.player.position.set(f.SEATS[0].x,0,f.APPROACH.z);a.updateUI();assert.equal(node('main-text').textContent,'얼음낚시 하기');
a.action();assert.equal(a.getMode(),'fish');assert.equal(f.stage,'wait');assert.equal(a.player.rotation.y,f.seat.yaw);assert.equal(node('main-text').textContent,'낚시 그만하기');assert(node('travel').hidden);
let body=a.stateBody();assert.equal(body.m,'warm','fishing must use an existing rule-approved mode');assert.equal(body.b,.51);
assert.equal(f.tick(20),'bite');a.updateUI();assert.equal(node('main-text').textContent,'지금 당겨요!');assert.equal(a.stateBody().b,.56);
assert.equal(f.tick(5),'missed');assert.equal(f.stage,'wait');assert.equal(a.getMode(),'fish');
f.tick(20);a.action();assert.equal(f.stage,'hold');const caught=f.caught,book=a.creatureBook.entries();assert(f.FISH.some(x=>x.id===caught.id));assert(caught.cm>=caught.size[0]&&caught.cm<=caught.size[1]);assert.equal(book[caught.id].count,1,'the catch is recorded in the creature book');assert.equal(book[caught.id].best,caught.cm);assert.equal(a.stateBody().b,.61);a.updateUI();assert(node('main-action').disabled);
assert.equal(f.tick(5),'released');assert.equal(f.stage,'wait');
a.action();assert.equal(a.getMode(),'idle','pressing while waiting puts the rod away');assert.equal(f.stage,null);
a.action();assert.equal(a.getMode(),'fish');a.navigate(0,7);assert.equal(a.getMode(),'idle','tapping elsewhere stands up');

// Friends: the wire shape is decoded, ordinary hand warming stays hand warming, and seats fill up.
assert.equal(f.fromWire('warm',.55),'bite');assert.equal(f.fromWire('warm',.6),'hold');assert.equal(f.fromWire('warm',0),null);assert.equal(f.fromWire('rolling',.55),null);
const approaching={...f.APPROACH,m:'warm',b:.51};
assert.equal(f.remoteSeat(approaching),f.SEATS[0],'the first chair is claimed before the avatar reaches it');
assert.equal(f.remoteSeat({...f.SEATS[0],m:'warm',b:.5}),f.SEATS[0],'legacy fishing messages still resolve');
assert(f.start(f.SEATS[0],[approaching]));assert.equal(f.seat,f.SEATS[1]);assert.equal(f.wire(),.52);f.stop();
assert(f.start(f.SEATS[0],[]));assert.equal(f.makeRoom(f.SEATS[0],[approaching]),f.SEATS[1]);f.stop();
const peers=f.SEATS.map(s=>({x:s.x,z:s.z}));assert.equal(f.start(f.APPROACH,peers),false,'a full pond allows no extra angler');f.stop();
const actor={root:new T.Group(),body:new T.Group(),arms:[new T.Group(),new T.Group()],legs:[new T.Group(),new T.Group()]};actor.root.add(actor.body);f.show(actor,'bite',1);const before=a.scene.children.length;f.drop(actor);assert.equal(a.scene.children.length,before-2,'a leaving friend leaves the float behind');

console.log('PASS: winter ice fishing has a safe pond, sky-dependent original creatures, a no-fail cast/bite/reel/release loop on the real buttons, and friend sharing through the existing warm mode.');
