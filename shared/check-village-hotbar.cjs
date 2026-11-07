const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),kst=(m,d,h=12)=>Date.UTC(2026,m-1,d,h-9);
function load(world,at,store=new Map()){
 let serial=0;const nodes=new Map(),keys=[],ctx2d=new Proxy({measureText:()=>({width:100}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
 function node(id){if(!nodes.has(id))nodes.set(id,{id,hidden:false,disabled:false,value:'',textContent:'',className:'',style:{},dataset:{},children:[],handlers:{},classList:{add(){},remove(){},toggle(){}},addEventListener(k,v){this.handlers[k]=v;},setAttribute(k,v){this[k]=v;},getAttribute(k){return this[k];},focus(){},remove(){},append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},getContext:()=>ctx2d});return nodes.get(id);}
 for(const id of['help-modal','invite-modal','memory-modal','cat-modal','book-picker'])node(id).hidden=true;
 class TestDate extends Date{constructor(...a){super(...(a.length?a:[at]));}static now(){return at;}}
 const c={console:{log(){},warn(){},error:console.error},performance,Math,Date:TestDate,URL,URLSearchParams,Float32Array,Uint32Array,Uint8Array,Int32Array,Map,Set,Array,Object,Number,JSON,Promise,crypto:crypto.webcrypto,devicePixelRatio:1,innerWidth:390,innerHeight:844,matchMedia:()=>({matches:false}),requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){},addEventListener(k,f){if(k==='keydown')keys.push(f);},document:{hidden:false,body:node('body'),getElementById:node,createElement:()=>node('generated-'+serial++),createTextNode:t=>({textContent:t}),querySelectorAll:()=>[],addEventListener(){}},location:{hash:'#room='+({winter:'',aquarium:'aq_',library:'lb_'}[world])+'0123456789abcdef01234567',pathname:'/snowy-winter-village/',search:'',href:'https://example.com/'},history:{replaceState(){}},localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)}};c.window=c;vm.createContext(c);
 const scripts=[...fs.readFileSync(path.join(root,world,'docs/index.html'),'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);vm.runInContext(scripts[0],c);c.THREE.WebGLRenderer=class{constructor(){this.domElement=node('renderer');}setPixelRatio(){}setSize(){}setClearColor(){}render(){}};
 vm.runInContext(scripts.at(-1).replace(/\}\)\(\);\s*$/,`globalThis.audit={villageHotbar,villageSnowball,villagePlay,photoMode,villageMarket,player,setEntered(){entered=true;}};})();`),c);
 const key=k=>{const e={key:k,repeat:false,target:{tagName:'CANVAS'},prevented:false,preventDefault(){this.prevented=true;}};for(const f of keys)f(e);return e.prevented;};return{a:c.audit,H:c.audit.villageHotbar,key,store};
}
for(const world of['winter','aquarium','library']){
 const{a,H,key}=load(world,kst(11,7,13)),ids=H.SLOTS.map(s=>s.id).join();
 // Three to five slots: the throwable, (winter) kite and lantern, cocoa and the camera.
 assert.equal(ids,world==='winter'?'toss,kite,lantern,cocoa,camera':'toss,cocoa,camera');assert(H.SLOTS.length>=3&&H.SLOTS.length<=5);
 H.tick();assert(H.bar.hidden,'hotbar before entering the village');assert.equal(H.press(0),null);a.setEntered();H.tick();assert(!H.bar.hidden);
 // The throwable is ready as soon as it is held, a second press puts it away, and another slot also puts it away.
 assert.equal(H.press(0),'hold');assert(a.villageSnowball.armed);assert.equal(H.press(0),'use');assert(!a.villageSnowball.armed);assert.equal(H.held,null);
 H.press(0);const cam=H.SLOTS.findIndex(s=>s.id==='camera');assert.equal(H.press(cam),'hold');assert(!a.villageSnowball.armed,'holding the camera left the throwable armed');
 // The held thing shows in the hand, and only that one.
 assert(H.hands.get('camera').visible);const cocoa=H.SLOTS.findIndex(s=>s.id==='cocoa');H.press(cocoa);assert(H.hands.get('cocoa').visible&&!H.hands.get('camera').visible);
 // Number keys pick slots too; a key past the last slot does nothing.
 assert(key(String(cam+1)));assert.equal(H.held,'camera');assert.equal(key('5'),world==='winter');
 // Using the camera opens photo mode.
 H.press(cam);assert.equal(H.held,'camera');assert(H.press(cam));assert(a.photoMode.on);a.photoMode.exit();
 console.log('PASS: '+world+' hotbar shows '+H.SLOTS.length+' slots after entering, holds then uses, shows only the held thing in hand, arms and puts away the throwable and answers number keys.');
}
{
 // The kite takes the colour bought in the village shop.
 const store=new Map(),{a,H}=load('winter',kst(11,7,13),store);a.setEntered();const M=a.villageMarket;M.earn(10,'test');assert(M.buy('kite-sea'));if(M.choice('kite')!==0x6fb6c9)M.use('kite-sea');
 const kite=H.SLOTS.findIndex(s=>s.id==='kite');H.press(kite);assert.equal(H.hands.get('kite').children[0].material.color.getHex(),0x6fb6c9,'kite colour does not follow the shop');
 assert(H.press(kite)!==null);assert(a.villagePlay.kiteOn,'using the kite slot should fly the kite by day');
 console.log('PASS: the winter kite slot uses the colour chosen in the village shop and flies the kite.');
}
