const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),kst=(m,d,h=12)=>Date.UTC(2026,m-1,d,h-9),source=fs.readFileSync(path.join(__dirname,'village-companions.js'),'utf8');
assert(!/villageStore|stateBody|wire\(/.test(source),'companions must stay in this browser until the shared rules have a field for them');
function load(world,store=new Map()){
 let serial=0;const t={now:kst(11,7,13)},nodes=new Map(),ctx2d=new Proxy({measureText:()=>({width:100}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
 function node(id){if(!nodes.has(id))nodes.set(id,{id,hidden:false,disabled:false,value:'',textContent:'',className:'',style:{},dataset:{},children:[],handlers:{},classList:{add(){},remove(){},toggle(){}},addEventListener(k,v){this.handlers[k]=v;},setAttribute(k,v){this[k]=v;},focus(){},append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},getContext:()=>ctx2d});return nodes.get(id);}
 class TestDate extends Date{constructor(...a){super(...(a.length?a:[t.now]));}static now(){return t.now;}}
 const c={console:{log(){},warn(){},error:console.error},performance,Math,Date:TestDate,URL,URLSearchParams,Float32Array,Uint32Array,Uint8Array,Int32Array,Map,Set,Array,Object,Number,JSON,Promise,crypto:crypto.webcrypto,devicePixelRatio:1,innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){},addEventListener(){},document:{hidden:false,body:node('body'),getElementById:node,createElement:()=>node('generated-'+serial++),createTextNode:t=>({textContent:t}),querySelectorAll:()=>[],addEventListener(){}},location:{hash:'#room='+({winter:'',aquarium:'aq_',library:'lb_'}[world])+'0123456789abcdef01234567',pathname:'/snowy-winter-village/',search:'',href:'https://example.com/'},history:{replaceState(){}},localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)}};c.window=c;vm.createContext(c);
 const scripts=[...fs.readFileSync(path.join(root,world,'docs/index.html'),'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);vm.runInContext(scripts[0],c);c.THREE.WebGLRenderer=class{constructor(){this.domElement=node('renderer');}setPixelRatio(){}setSize(){}setClearColor(){}render(){}};
 vm.runInContext(scripts.at(-1).replace(/\}\)\(\);\s*$/,`globalThis.audit={villageCompanions,player,scene,setEntered(){entered=true;}};})();`),c);return{a:c.audit,C:c.audit.villageCompanions,nodes,store,t};
}
const named=(scene,prefix)=>scene.children.filter(o=>o.name&&o.name.startsWith(prefix));
for(const world of['winter','aquarium','library']){
 const{a,C,nodes,store,t}=load(world),P=a.player;
 assert([...nodes.values()].some(n=>n.textContent==='동반 친구'&&n.className==='resident-next'),'no companion choice in the resident dialog');
 assert.equal(C.KINDS.length,4);assert.equal(C.state.owned.length,0);
 // One egg a Seoul day from the resident.
 assert(C.canTakeEgg());assert(C.takeEgg());assert(!C.takeEgg(),'two eggs at once');C.tick(0);assert.equal(named(a.scene,'companion-egg').length,1);
 // Nothing warms before entering the village; away from the warm spot it takes the full ten minutes.
 C.tick(100);assert.equal(C.state.egg.p,0);a.setEntered();P.position.set(C.WARM.x+30,P.position.y,C.WARM.z);C.tick(300);assert(Math.abs(C.state.egg.p-.5)<1e-9,'cold egg should be halfway after five minutes');
 // Near the warm spot it warms three times as fast and hatches.
 P.position.set(C.WARM.x+1,P.position.y,C.WARM.z);assert(C.warmNow());C.tick(99);assert(C.state.egg,'hatched too early');C.tick(2);assert.equal(C.state.egg,null);
 const first=C.state.out;assert.equal(C.state.owned.length,1);assert.equal(first,C.state.owned[0]);assert.equal(named(a.scene,'companion-egg').length,0);assert.equal(named(a.scene,'companion-').length,1);
 let meshes=0;C.pet.traverse(o=>{if(o.isMesh)meshes++;});assert(meshes<=8,'companion uses '+meshes+' draw calls');
 // It eases behind the visitor and snaps after a long jump.
 P.rotation.y=0;P.position.set(C.WARM.x+3,P.position.y,C.WARM.z+3);for(let i=0;i<120;i++)C.tick(1/30);const d=Math.hypot(C.pet.position.x-P.position.x,C.pet.position.z-P.position.z);assert(d>.7&&d<1.5,'companion is '+d+' m away');assert(C.pet.position.z<P.position.z,'companion should walk behind');
 P.position.x+=40;C.tick(1/30);assert(Math.hypot(C.pet.position.x-P.position.x,C.pet.position.z-P.position.z)<1.5,'companion lost after a jump');
 // Same day: no new egg. Each new day brings a friend not met yet, until all four are home.
 assert(!C.canTakeEgg());for(let day=1;day<4;day++){t.now+=86400e3;assert(C.takeEgg());C.tick(700);}
 assert.equal(new Set(C.state.owned).size,4);t.now+=86400e3;assert(!C.canTakeEgg(),'eggs after all four friends');
 // Choosing who walks along, or nobody; the radial menu cycles the same way.
 assert(C.setOut(first));assert.equal(C.pet.userData.kind.id,first);assert(C.setOut(null));C.tick(1/30);assert.equal(C.pet,null);assert(!C.setOut('not-a-kind'));
 assert.equal(C.cycle(),C.state.owned[0]);assert.equal(C.cycle(),C.state.owned[1]);
 C.open();assert(C.isOpen());C.close();
 // The friends come back after a reload; damaged storage starts fresh.
 const again=load(world,store).C;assert.equal(again.state.owned.length,4);assert.equal(again.state.out,C.state.out);
 const broken=load(world,new Map([['village-companions','{"owned":["puff","dragon","puff"],"egg":{"p":9},"out":"dragon"}']])).C;assert.equal(JSON.stringify(broken.state.owned),'["puff"]');assert.equal(broken.state.egg.p,1);assert.equal(broken.state.out,null);
 assert.equal(load(world,new Map([['village-companions','not json']])).C.state.owned.length,0);
 console.log('PASS: '+world+' companions: one egg a day, ten cold minutes or a third of that by the '+C.WARM.name+', four new friends in turn, following behind, choosing who walks along and keeping them after a reload.');
}
