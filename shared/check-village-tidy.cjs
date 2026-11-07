const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),IDLE={winter:'가고 싶은 눈밭을 톡 눌러보세요',aquarium:'가고 싶은 바닥을 톡 눌러보세요',library:'가고 싶은 바닥을 톡 눌러보세요'};
function load(world){
 let serial=0;const nodes=new Map(),ctx2d=new Proxy({measureText:()=>({width:100}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
 function node(id){if(!nodes.has(id)){const cls=new Set(),n={id,hidden:false,disabled:false,value:'',textContent:'',className:'',style:{},dataset:{},children:[],handlers:{},classList:{add:k=>cls.add(k),remove:k=>cls.delete(k),contains:k=>cls.has(k),toggle:(k,on)=>{if(on===undefined?!cls.has(k):on)cls.add(k);else cls.delete(k);}},addEventListener(k,v){this.handlers[k]=v;},setAttribute(k,v){this[k]=v;},getAttribute(k){return this[k];},focus(){},remove(){},append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},getContext:()=>ctx2d};nodes.set(id,n);}return nodes.get(id);}
 for(const id of['help-modal','invite-modal','memory-modal','cat-modal','book-picker'])node(id).hidden=true;
 // The bottom column and the world-travel row, with just enough DOM to be rearranged.
 const controls=node('controls'),hint=node('hint'),travel=node('world-travel'),row=node('world-switch-row');hint.textContent=IDLE[world];hint.parentNode=controls;controls.children.push(hint);
 controls.insertBefore=(n,ref)=>{const i=controls.children.indexOf(ref);controls.children.splice(i<0?controls.children.length:i,0,n);};
 travel.children.push(row);travel.querySelector=sel=>sel==='.world-switch-row'?row:null;travel.insertBefore=(n,ref)=>{travel.children.splice(travel.children.indexOf(ref),0,n);};travel.contains=n=>n===travel||travel.children.includes(n);row.querySelector=()=>null;
 const winHandlers={};
 const c={console:{log(){},warn(){},error:console.error},performance,Math,Date,URL,URLSearchParams,Float32Array,Uint32Array,Uint8Array,Int32Array,Map,Set,Array,Object,Number,JSON,Promise,crypto:crypto.webcrypto,devicePixelRatio:1,innerWidth:390,innerHeight:844,matchMedia:()=>({matches:false}),requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){},addEventListener(k,f){(winHandlers[k]=winHandlers[k]||[]).push(f);},document:{hidden:false,body:node('body'),getElementById:node,createElement:()=>node('generated-'+serial++),createTextNode:t=>({textContent:t}),querySelectorAll:()=>[],addEventListener(){}},location:{hash:'#room='+({winter:'',aquarium:'aq_',library:'lb_'}[world])+'0123456789abcdef01234567',pathname:'/snowy-winter-village/',search:'',href:'https://example.com/'},history:{replaceState(){}},localStorage:{getItem:()=>null,setItem(){}}};c.window=c;vm.createContext(c);
 const scripts=[...fs.readFileSync(path.join(root,world,'docs/index.html'),'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);vm.runInContext(scripts[0],c);c.THREE.WebGLRenderer=class{constructor(){this.domElement=node('renderer');}setPixelRatio(){}setSize(){}setClearColor(){}render(){}};
 vm.runInContext(scripts.at(-1).replace(/\}\)\(\);\s*$/,`globalThis.audit={villageTidy,villageHotbar,player,setEntered(){entered=true;}};})();`),c);
 return{a:c.audit,T:c.audit.villageTidy,node,controls,hint,travel,row,winHandlers};
}
const run=(T,s)=>{for(let i=0;i<Math.round(s*10);i++)T.tick(.1);};
for(const world of['winter','aquarium','library']){
 const{a,T,node,controls,hint,travel,row,winHandlers}=load(world);
 // The hotbar sits in the bottom column right above the hint instead of floating over it.
 const bar=a.villageHotbar.bar,i=controls.children.indexOf(bar);assert(i>=0&&controls.children[i+1]===hint,'the hotbar is not just above the hint');assert(bar.classList.contains('in-controls'));
 // Nothing changes before entering; the opening hint stays until the first real walk.
 run(T,1);assert.notEqual(hint.dataset.quiet,'1');a.setEntered();a.player.position.set(0,0,7);run(T,1);assert.equal(hint.dataset.quiet,'0','the hint went quiet before walking');
 a.player.position.set(.8,0,7.5);run(T,.2);assert.equal(hint.dataset.quiet,'0','a small step is not a walk');a.player.position.set(2.5,0,7);run(T,.2);assert(T.walked);assert.equal(hint.dataset.quiet,'1','the opening hint should step aside after walking');
 // Anything new the hint has to say still shows.
 hint.textContent='찌가 움직일 때까지 조용히 기다려요';run(T,.2);assert.equal(hint.dataset.quiet,'0','a new hint was hidden');hint.textContent=IDLE[world];run(T,.2);assert.equal(hint.dataset.quiet,'1');
 // The corner notes fade a few seconds after entering; the same lines are in the help window.
 assert(!node('keyboard').classList.contains('tidy-faded'),'the corner notes faded too early');run(T,T.NOTE_TIME);for(const id of['keyboard','saved-note'])assert(node(id).classList.contains('tidy-faded'),id+' did not fade');
 // Phone: one fold button opens both destinations and closes again after a pick or a tap elsewhere.
 const fold=T.fold();assert(fold&&travel.children.indexOf(fold)===travel.children.indexOf(row)-1,'no fold button before the destinations');assert(!travel.classList.contains('unfolded'));
 fold.handlers.click({stopPropagation(){}});assert(travel.classList.contains('unfolded'));assert.equal(fold['aria-expanded'],'true');row.handlers.click();assert(!travel.classList.contains('unfolded'));
 fold.handlers.click({stopPropagation(){}});for(const f of winHandlers.pointerdown||[])f({target:node('renderer')});assert(!travel.classList.contains('unfolded'),'a tap elsewhere should fold the destinations');
 console.log('PASS: '+world+' tidy screen: the hotbar sits above the hint, the opening hint steps aside after the first walk but new hints still show, the corner notes fade, and one fold button opens the other spaces on a phone.');
}
