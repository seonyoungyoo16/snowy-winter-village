const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),kst=(m,d,h=12)=>Date.UTC(2026,m-1,d,h-9),H=3600e3;
function load(world,t,store=new Map()){
 let serial=0;const nodes=new Map(),ctx2d=new Proxy({measureText:()=>({width:100}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
 function node(id){if(!nodes.has(id))nodes.set(id,{id,hidden:false,disabled:false,value:'',textContent:'',className:'',style:{},dataset:{},children:[],handlers:{},classList:{add(){},remove(){},toggle(){}},addEventListener(k,v){this.handlers[k]=v;},setAttribute(k,v){this[k]=v;},getAttribute(k){return this[k];},focus(){},remove(){},append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},getContext:()=>ctx2d});return nodes.get(id);}
 class TestDate extends Date{constructor(...a){super(...(a.length?a:[t.now]));}static now(){return t.now;}}
 const c={console:{log(){},warn(){},error:console.error},performance,Math,Date:TestDate,URL,URLSearchParams,Float32Array,Uint32Array,Uint8Array,Int32Array,Map,Set,Array,Object,Number,JSON,Promise,crypto:crypto.webcrypto,devicePixelRatio:1,innerWidth:390,innerHeight:844,matchMedia:()=>({matches:false}),requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){},addEventListener(){},document:{hidden:false,body:node('body'),getElementById:node,createElement:()=>node('generated-'+serial++),createTextNode:t=>({textContent:t}),querySelectorAll:()=>[],addEventListener(){}},location:{hash:'#room='+({winter:'',aquarium:'aq_',library:'lb_'}[world])+'0123456789abcdef01234567',pathname:'/snowy-winter-village/',search:'',href:'https://example.com/'},history:{replaceState(){}},localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)}};c.window=c;vm.createContext(c);
 const scripts=[...fs.readFileSync(path.join(root,world,'docs/index.html'),'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);vm.runInContext(scripts[0],c);c.THREE.WebGLRenderer=class{constructor(){this.domElement=node('renderer');}setPixelRatio(){}setSize(){}setClearColor(){}render(){}};
 vm.runInContext(scripts.at(-1).replace(/\}\)\(\);\s*$/,`globalThis.audit={villageExpedition,villageCompanions,villageMarket,creatureBook,residentGuide,setEntered(){entered=true;}};})();`),c);return{a:c.audit,X:c.audit.villageExpedition,nodes,store};
}
for(const world of['winter','aquarium','library']){
 const t={now:kst(11,7,10)},{a,X,nodes,store}=load(world,t);
 assert([...nodes.values()].some(n=>n.textContent==='원정 보내기'&&n.className==='resident-next'),'no expedition choice in the resident dialog');
 assert.equal(X.PLACES.length,3);assert.equal(X.HOURS.join(),'1,3,6');
 for(const p of X.PLACES)for(const id of p.pool)assert(a.creatureBook.ENTRIES.some(e=>e.id===id),'unknown souvenir '+id);
 // Without a companion the resident's paper crane goes; nothing to choose wrongly, unknown places and lengths are refused.
 assert.equal(X.traveler().id,'crane');assert.equal(X.send('moon',1),false);assert.equal(X.send('forest',2),false);
 assert(X.send('forest',3));assert.equal(X.send('shore',1),false,'two trips at once');assert.equal(X.left(),3*H);
 // Time passes while the page is closed: a reload two hours later still waits, five hours later it is home.
 t.now+=2*H;let again=load(world,t,store).X;assert.equal(again.check(),null);assert.equal(again.left(),H);
 t.now+=3*H;const shellsBefore=load(world,t,new Map()).a.villageMarket.purse().shells;const reload=load(world,t,store);const card=reload.X.check();assert(card,'the trip did not come home');
 assert(card.text.includes(reload.a.residentGuide.role.name+'의 종이학'));assert(X.PLACES[0].pool.includes(card.souvenir));assert(reload.a.creatureBook.entries()[card.souvenir],'the souvenir picture is not in the creature book');
 assert.equal(card.shells,0);assert.equal(reload.a.villageMarket.purse().shells,shellsBefore,'retired rewards changed the shell balance');assert.equal(reload.X.state.trip,null);assert.equal(reload.X.state.cards.length,1);
 // Souvenirs prefer pictures not in the book yet.
 const R=reload.X;for(let i=0;i<4;i++){R.send('forest',1);t.now+=H+1;R.check();}const forest=R.state.cards.map(c=>c.souvenir).filter(id=>X.PLACES[0].pool.includes(id));assert.equal(new Set(forest).size,4,'forest souvenirs repeated before all four were met');
 // A companion walking along goes instead, is away while travelling and walks along again when home.
 const C=reload.a.villageCompanions;reload.a.setEntered();C.takeEgg();C.tick(700);const pet=C.state.out;assert(pet);assert.equal(R.traveler().id,pet);
 assert(R.send('archive',6));assert.equal(C.state.out,null,'the companion stayed while away');assert(R.away(pet));assert.equal(C.setOut(pet),false,'an away companion was chosen to walk along');
 t.now+=6*H;const home=R.check();assert(home.text.includes(C.KINDS.find(k=>k.id===pet).name));assert.equal(C.state.out,pet,'the companion did not come back to walk along');assert(!R.away(pet));
 // Only the last six cards stay; damaged storage starts fresh.
 for(let i=0;i<6;i++){R.send('shore',1);t.now+=H;R.check();}assert.equal(R.state.cards.length,6);
 assert.equal(load(world,t,new Map([['village-expedition','{"trip":{"place":"moon","hours":2,"start":"x"},"cards":[null,{"text":"좋은 여행"}]}']])).X.state.trip,null);
 console.log('PASS: '+world+' expeditions: three places for 1, 3 or 6 hours, time passing while closed, a story card with a new creature picture, the companion away and back, and six cards kept.');
}
