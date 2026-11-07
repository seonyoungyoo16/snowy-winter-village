const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),kst=(y,m,d,h=12)=>Date.UTC(y,m-1,d,h-9);
for(const world of['winter','aquarium','library']){
 let serial=0,time=kst(2026,11,7);const nodes=new Map(),store=new Map(),ctx2d=new Proxy({measureText:()=>({width:100}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
 function node(id){if(!nodes.has(id))nodes.set(id,{id,hidden:false,disabled:false,value:'',textContent:'',className:'',style:{},dataset:{},children:[],handlers:{},classList:{add(){},remove(){},toggle(){}},addEventListener(k,v){this.handlers[k]=v;},setAttribute(k,v){this[k]=v;},focus(){},append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},getContext:()=>ctx2d});return nodes.get(id);}
 class TestDate extends Date{constructor(...a){super(...(a.length?a:[time]));}static now(){return time;}}
 const c={console:{log(){},warn(){},error:console.error},performance,Math,Date:TestDate,URL,URLSearchParams,Float32Array,Uint32Array,Uint8Array,Int32Array,Map,Set,Array,Object,Number,JSON,Promise,crypto:crypto.webcrypto,devicePixelRatio:1,innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){},addEventListener(){},document:{hidden:false,body:node('body'),getElementById:node,createElement:()=>node('generated-'+serial++),createTextNode:t=>({textContent:t}),querySelectorAll:()=>[],addEventListener(){}},location:{hash:'#room='+({winter:'',aquarium:'aq_',library:'lb_'}[world])+'0123456789abcdef01234567',pathname:'/snowy-winter-village/',search:'',href:'https://example.com/'},history:{replaceState(){}},localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)}};c.window=c;vm.createContext(c);
 const scripts=[...fs.readFileSync(path.join(root,world,'docs/index.html'),'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);vm.runInContext(scripts[0],c);c.THREE.WebGLRenderer=class{constructor(){this.domElement=node('renderer');}setPixelRatio(){}setSize(){}setClearColor(){}render(){}};
 vm.runInContext(scripts.at(-1).replace(/\}\)\(\);\s*$/,`globalThis.audit={residentGifts,residentGuide,creatureBook,avatarLife};})();`),c);
 const a=c.audit,G=a.residentGifts,p=G.profile,ids=new Set(a.creatureBook.ENTRIES.map(e=>e.id).concat('cocoa'));
 // Every taste names a real creature card or the cocoa, and the birthday is a real date.
for(const id of[...p.likes,...p.dislikes])assert(ids.has(id),world+" unknown taste "+id);assert(p.born[0]>=1&&p.born[0]<=12&&p.born[1]>=1&&p.born[1]<=31);
 assert([...nodes.values()].some(n=>n.textContent==='선물 주기'&&n.className==='resident-next'),'no gift choice in the resident dialog');
 // Choices: cocoa always, plus picture cards of creatures this visitor has met.
 assert.equal(JSON.stringify(G.choices().map(g=>g.id)),'["cocoa"]');a.creatureBook.record(p.likes.find(x=>x!=='cocoa'));a.creatureBook.record(p.dislikes[0]);assert.equal(G.choices().length,3);
 // One gift per Seoul day, with word-only replies by taste; the next day opens again.
 const liked=p.likes.find(x=>x!=='cocoa');assert.equal(G.reaction(liked),'love');assert.equal(G.reaction(p.dislikes[0]),'meh');
 assert.equal(G.give('not-a-gift'),null);assert.equal(G.give(liked),'love');assert.equal(G.give('cocoa'),null,'second gift on the same day');assert.equal(G.given().id,liked);
 time+=86400e3;assert.equal(G.given(),null);assert.equal(G.give(p.dislikes[0]),'meh');
 // Birthday: the special reply, a party hat for that day only, and the resident still within 14 draw calls with the face rig.
 time=kst(2026,p.born[0],p.born[1],10);G.tick();a.avatarLife.tick(.016);assert(G.isBirthday());assert(G.hat&&G.hat.visible,world+' no birthday hat');assert.equal(G.give('cocoa'),'birthday');
 let meshes=0;a.residentGuide.actor.root.traverse(o=>{if(o.isMesh||o.isPoints)meshes++;});a.residentGuide.station.traverse(o=>{if(o.isMesh||o.isPoints)meshes++;});assert(meshes<=14,world+' resident draw calls '+meshes);
 time+=86400e3;G.tick();assert(!G.isBirthday()&&!G.hat.visible,'hat outlives the birthday');
 G.open();assert(G.isOpen());G.close();
 console.log('PASS: '+world+' resident has a birthday and tastes over real cards, takes one gift per Seoul day with word-only replies, and wears a party hat only on the birthday within 14 draw calls.');
}
