const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let serial=0;const nodes=new Map(),store=new Map(),ctx2d=new Proxy({measureText:()=>({width:100}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
function node(id){if(!nodes.has(id))nodes.set(id,{id,hidden:false,disabled:false,value:'',textContent:'',className:'',style:{},dataset:{},children:[],handlers:{},classList:{add(){},remove(){},toggle(){}},addEventListener(k,v){this.handlers[k]=v;},setAttribute(){},focus(){},append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},getContext:()=>ctx2d});return nodes.get(id);}
const writes=[],remote={},c={console:{log(){},warn(){},error:console.error},performance,Math,Date,URL,URLSearchParams,Float32Array,Uint32Array,Uint8Array,Int32Array,Map,Set,Array,Object,Number,JSON,Promise,crypto:crypto.webcrypto,devicePixelRatio:1,innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){},addEventListener(){},document:{hidden:false,body:node('body'),head:node('head'),getElementById:node,createElement:()=>node('generated-'+serial++),querySelectorAll:()=>[],addEventListener(){}},location:{hash:'#room=aq_0123456789abcdef01234567',pathname:'/snowy-winter-village/aquarium/',search:'',href:'https://example.com/'},history:{replaceState(){}},localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)}};c.window=c;vm.createContext(c);
const scripts=[...fs.readFileSync(__dirname+'/docs/index.html','utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);vm.runInContext(scripts[0],c);c.THREE.WebGLRenderer=class{constructor(){this.domElement=node('renderer');}setPixelRatio(){}setSize(){}setClearColor(){}render(){}};
vm.runInContext(scripts.at(-1).replace(/\}\)\(\);\s*$/,`globalThis.audit={objectParticle,exhibit,villageStore,creatureBook,residentGuide,scene,blocked,pathTo,places,player,setEntered(){entered=true;},setNetwork(db,uid){networkDB=db;networkAuth={currentUser:{uid}};}};})();`),c);
const a=c.audit,x=a.exhibit,T=c.THREE;a.setEntered();for(const id of['help-modal','invite-modal'])node(id).hidden=true;

// A real tank that blocks walking, reachable from the entrance without cutting off any existing activity.
assert(a.scene.getObjectByName('exhibit-tank'));assert(a.blocked(x.TANK.x,x.TANK.z));assert(!a.blocked(x.VIEW.x,x.VIEW.z,.3));
a.player.position.set(0,0,7);assert(a.pathTo(x.VIEW.x,x.VIEW.z).length,'no route to the exhibit');for(const p of Object.values(a.places))assert(a.pathTo(p.x,p.z).length||Math.hypot(p.x,p.z-7)<1,'exhibit blocks an activity');
for(const p of a.creatureBook.ENTRIES)assert(x.LOOKS[p.id],p.id+' has no exhibit look');
// Harry offers the donation sheet in conversation.
assert([...nodes.values()].some(n=>n.textContent==='전시 수조에 기증하기'&&n.className==='resident-next'),'no donation choice in the resident dialog');

(async()=>{
 // Before the rules are deployed: only met creatures, once each, kept in this browser.
 assert.equal(a.villageStore.mode,'pending');assert.equal(await x.donate('smelt'),null,'donated a creature never met');
 a.creatureBook.record('smelt',{cm:12});assert.equal(c.audit.objectParticle('바다거북'),'바다거북을');assert.equal(c.audit.objectParticle('빙어'),'빙어를');assert.equal(await x.donate('smelt'),'local');assert.equal(x.exhibits.smelt.c,'smelt');assert(x.swimmers.has('smelt'));assert.equal(await x.donate('smelt'),null,'duplicate donation');
 const saved=JSON.parse(store.get('village-store:0123456789abcdef01234567:exhibits'));assert.equal(saved.smelt.c,'smelt','local fallback not stored for the friend group');
 for(let t=0;t<30;t+=.7){x.tick(t);for(const g of x.swimmers.values())assert(Math.hypot(g.position.x,g.position.z)<x.TANK.r-.1&&g.position.y>.5&&g.position.y<2.4,'swimmer leaves the glass');}
 x.open();assert(x.isOpen());x.close();assert(!x.isOpen());

 // With deployed rules: subscribe to village/{party}/exhibits, show a friend's donation, and write our own with our uid.
 let listener=null;c.WinterFirebase={ref:(db,path)=>({path}),onValue:(ref,ok)=>{assert.equal(ref.path,'village/0123456789abcdef01234567/exhibits');listener=ok;},set:async(ref,value)=>{writes.push([ref.path,value]);}};
 a.setNetwork({},'friend-uid');a.villageStore.list('exhibits');assert(listener,'store never subscribed');
 listener({val:()=>({turtle:{c:'turtle',n:'바다 친구',u:'other',t:1}})});assert.equal(a.villageStore.mode,'shared');assert(x.swimmers.has('turtle'),'friend donation not shown');
 a.creatureBook.record('clownfish');assert.equal(await x.donate('clownfish'),'shared');assert.deepEqual(writes[0][0],'village/0123456789abcdef01234567/exhibits/clownfish');assert.equal(writes[0][1].u,'friend-uid');assert.equal(writes[0][1].c,'clownfish');
 // A refused write (rules not deployed) quietly falls back to this browser.
 c.WinterFirebase.set=async()=>{throw new Error('PERMISSION_DENIED');};a.creatureBook.record('seahorse');assert.equal(await x.donate('seahorse'),'local');assert.equal(a.villageStore.mode,'local');

 // The same village rules ship in every world: add-only exhibits with a fixed shape and the author's uid.
 const rules=['winter','aquarium','library'].map(w=>fs.readFileSync(__dirname+'/../'+w+'/database.rules.json','utf8'));assert(rules.every(r=>r===rules[0]),'rules differ between worlds');
 const village=JSON.parse(rules[0]).rules.village.$party,item=village.exhibits.$id;assert(village['.read'].includes('auth != null'));assert(item['.write'].includes('!data.exists()'));assert.equal(item.$other['.validate'],false);assert(item.u['.validate'].includes('auth.uid'));assert(!village['.write'],'the whole party node must not be writable');
 console.log('PASS: the aquarium exhibit tank takes one donation per met creature through Harry, swims inside the glass, shares through village/{party}/exhibits with add-only rules, and falls back to this browser until the rules are deployed.');
})().catch(e=>{console.error(e);process.exit(1);});
