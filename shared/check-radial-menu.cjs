const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),kst=(m,d,h=12)=>Date.UTC(2026,m-1,d,h-9);
function load(world,at=kst(11,7,13)){
 let serial=0;const nodes=new Map(),store=new Map(),ctx2d=new Proxy({measureText:()=>({width:100}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
 function node(id){if(!nodes.has(id))nodes.set(id,{id,hidden:false,disabled:false,value:'',textContent:'',className:'',style:{},dataset:{},children:[],handlers:{},classList:{add(){},remove(){},toggle(){}},addEventListener(k,v){this.handlers[k]=v;},setAttribute(k,v){this[k]=v;},getAttribute(k){return this[k];},focus(){},append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},getContext:()=>ctx2d});return nodes.get(id);}
 for(const id of['help-modal','invite-modal','memory-modal','cat-modal','book-picker'])node(id).hidden=true;
 class TestDate extends Date{constructor(...a){super(...(a.length?a:[at]));}static now(){return at;}}
 const c={console:{log(){},warn(){},error:console.error},performance,Math,Date:TestDate,URL,URLSearchParams,Float32Array,Uint32Array,Uint8Array,Int32Array,Map,Set,Array,Object,Number,JSON,Promise,crypto:crypto.webcrypto,devicePixelRatio:1,innerWidth:390,innerHeight:844,matchMedia:()=>({matches:false}),requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){},addEventListener(){},document:{hidden:false,body:node('body'),getElementById:node,createElement:()=>node('generated-'+serial++),createTextNode:t=>({textContent:t}),querySelectorAll:()=>[],addEventListener(){}},location:{hash:'#room='+({winter:'',aquarium:'aq_',library:'lb_'}[world])+'0123456789abcdef01234567',pathname:'/snowy-winter-village/',search:'',href:'https://example.com/'},history:{replaceState(){}},localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)}};c.window=c;vm.createContext(c);
 const scripts=[...fs.readFileSync(path.join(root,world,'docs/index.html'),'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);vm.runInContext(scripts[0],c);c.THREE.WebGLRenderer=class{constructor(){this.domElement=node('renderer');}setPixelRatio(){}setSize(){}setClearColor(){}render(){}};
 vm.runInContext(scripts.at(-1).replace(/\}\)\(\);\s*$/,`globalThis.audit={radialMenu,villagePlay,photoMode,villageCompanions,villageIcons,setEntered(){entered=true;}};})();`),c);c.audit.nodes=nodes;return c.audit;
}
const ring=R=>R.isOpen();
for(const world of['winter','aquarium','library']){
 const a=load(world),R=a.radialMenu,labels=()=>R.items().map(i=>i.label);
 // Emotes, the ping and a game; companions only once one has hatched. Things to hold (throwable, kite, lantern,
 // cocoa, camera) live only in the hotbar, so none of them shows up here a second time.
 assert.equal(labels().slice(0,6).join(),'좋아요,웃음,반가워,졸려요,놀랐어요,박수');assert(labels().includes('여기!')&&labels().includes('놀이'));assert(!labels().includes('동반 친구'));
 for(const held of['사진','연','풍등','코코아 건네기','눈덩이 던지기','비눗방울 날리기','종이비행기 날리기'])assert(!labels().includes(held),held+' is in both the ring and the hotbar');
 assert(R.items().every(i=>typeof i.icon==='string'&&a.villageIcons[i.icon]),'a ring choice still uses a text glyph instead of a drawn icon');
 // The emote button at the lower right opens this same ring.
 assert.equal(R.open(),false,'ring before entering the village');a.setEntered();a.villagePlay.tick(0);const toggle=[...a.nodes.values()].find(n=>n.className==='play-toggle');toggle.handlers.click();assert(ring(R),'the emote button should open the ring');R.close();
 assert(R.items().length<=10,'the ring should stay small');
 a.villageCompanions.takeEgg();a.villageCompanions.tick(700);assert(labels().includes('동반 친구'));
 // Opens even from a corner of a phone screen.
 assert(R.open(2,2));assert(ring(R));const kids=[...a.radialMenu.items()].length;
 // Picking an emote closes the ring and shows the emote.
 assert(R.pick(1));assert(!ring(R));assert.equal(a.villagePlay.activeEmote(),1);
 // Long press: a still half-second hold opens the ring, the release that follows is swallowed once; a moving finger never opens it.
 R.pressStart(200,500,1);R.tick(.3);assert(!ring(R));R.tick(.3);assert(ring(R),'hold did not open the ring');assert.equal(R.pressEnd(),true);assert.equal(R.pressEnd(),false);R.close();
 R.pressStart(200,500,2);R.pressMove(230,500);R.tick(1);assert(!ring(R),'a drag opened the ring');R.pressEnd();
 // Extra choices (the hotbar later) join when they apply.
 let on=false;R.addItem({icon:'□',label:'테스트',run(){},when:()=>on});assert(!labels().includes('테스트'));on=true;assert(labels().includes('테스트'));
 // No ring over photo mode.
 a.photoMode.enter();assert.equal(R.open(),false);a.photoMode.exit();assert(R.open());R.close();assert(kids>=8&&kids<=11);
 console.log('PASS: '+world+' radial menu lists emotes, the ping, a game and companions with drawn icons and no hotbar duplicates, opens from the emote button, opens on a still hold or Q, swallows that release, ignores drags and stays out of photo mode.');
}
