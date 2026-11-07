// Loads a built world page in a VM with stub DOM, controllable clocks and storage, and exposes chosen inner names as `audit`.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.join(__dirname,'..');
function loadWorld(world,{search='',now=null,expose=[],extra='',storage=new Map()}={}){
 let serial=0,perf=1000;const nodes=new Map(),ctx2d=new Proxy({measureText:()=>({width:100}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
 function node(id){if(!nodes.has(id))nodes.set(id,{id,hidden:false,disabled:false,value:'',textContent:'',className:'',style:{},dataset:{},children:[],handlers:{},classList:{add(){},remove(){},toggle(){}},addEventListener(k,v){this.handlers[k]=v;},setAttribute(k,v){this['attr:'+k]=v;},focus(){},append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},getContext:()=>ctx2d});return nodes.get(id);}
 const clock={ms:now===null?Date.now():now};class TestDate extends Date{constructor(...a){super(...(a.length?a:[clock.ms]));}static now(){return clock.ms;}}
 const c={console:{log(){},warn(){},error:console.error},performance:{now:()=>perf*1000},Math,Date:TestDate,URL,URLSearchParams,Float32Array,Uint32Array,Uint8Array,Int32Array,Map,Set,Array,Object,Number,JSON,Promise,crypto:crypto.webcrypto,devicePixelRatio:1,innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){},addEventListener(){},document:{hidden:false,body:node('body'),getElementById:node,createElement:()=>node('generated-'+serial++),createTextNode:t=>({textContent:t}),querySelectorAll:()=>[],addEventListener(){}},location:{hash:'#room='+({winter:'',aquarium:'aq_',library:'lb_'}[world])+'0123456789abcdef01234567',pathname:'/snowy-winter-village/',search,href:'https://example.com/'},history:{replaceState(){}},localStorage:{getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,v)}};c.window=c;vm.createContext(c);
 const scripts=[...fs.readFileSync(path.join(root,world,'docs/index.html'),'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);vm.runInContext(scripts[0],c);c.THREE.WebGLRenderer=class{constructor(){this.domElement=node('renderer');}setPixelRatio(){}setSize(){}setClearColor(){}render(){}};
 vm.runInContext(scripts.at(-1).replace(/\}\)\(\);\s*$/,`globalThis.audit={${expose.join(',')},player,scene,blocked,pathTo,places:typeof places==="undefined"?{snow:{x:0,z:7},fire:{x:-5,z:1.3},sled:{x:13,z:-12}}:places,setEntered(){entered=true;},setMode(m){mode=m;},getMode(){return mode;},setNick(n){nickname=n;}${extra}};})();`),c);
 const a=c.audit;a.setEntered();for(const id of['help-modal','invite-modal','memory-modal','cat-modal','book-picker'])node(id).hidden=true;
 return{a,c,T:c.THREE,nodes,node,storage,clock,advance(s){perf+=s;clock.ms+=s*1000;}};
}
// KST wall time → epoch ms.
const kst=(y,m,d,h=12,min=0)=>Date.UTC(y,m-1,d,h-9,min);
module.exports={loadWorld,kst,root};
