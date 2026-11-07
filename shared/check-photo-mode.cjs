const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.join(__dirname,'..');
assert(!/fetch\(|XMLHttpRequest|villageStore/.test(fs.readFileSync(path.join(__dirname,'photo-mode.js'),'utf8')),'pictures must stay in this browser');
for(const world of['winter','aquarium','library']){
 let serial=0,full=false;const nodes=new Map(),store=new Map(),ctx2d=new Proxy({measureText:()=>({width:100}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
 function node(id){if(!nodes.has(id))nodes.set(id,{id,hidden:false,disabled:false,value:'',textContent:'',className:'',style:{},dataset:{},children:[],handlers:{},width:1280,height:720,classList:{add(){},remove(){},toggle(){}},addEventListener(k,v){this.handlers[k]=v;},setAttribute(k,v){this[k]=v;},focus(){},append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},getContext:()=>ctx2d,toDataURL:()=>'data:image/jpeg;base64,'+id});return nodes.get(id);}
 const body=node('body'),classes=new Set();body.classList={add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle(){}};
 const c={console:{log(){},warn(){},error:console.error},performance,Math,Date,URL,URLSearchParams,Float32Array,Uint32Array,Uint8Array,Int32Array,Map,Set,Array,Object,Number,JSON,Promise,crypto:crypto.webcrypto,devicePixelRatio:1,innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){},addEventListener(){},document:{hidden:false,body,getElementById:node,createElement:t=>node('generated-'+t+'-'+serial++),createTextNode:t=>({textContent:t}),querySelectorAll:()=>[],addEventListener(){}},location:{hash:'#room='+({winter:'',aquarium:'aq_',library:'lb_'}[world])+'0123456789abcdef01234567',pathname:'/snowy-winter-village/',search:'',href:'https://example.com/'},history:{replaceState(){}},localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>{if(full&&k==='village-album')throw new Error('quota');store.set(k,v);}}};c.window=c;vm.createContext(c);
 const scripts=[...fs.readFileSync(path.join(root,world,'docs/index.html'),'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);vm.runInContext(scripts[0],c);let renders=0;c.THREE.WebGLRenderer=class{constructor(){this.domElement=node('renderer');}setPixelRatio(){}setSize(){}setClearColor(){}render(){renders++;}};
 vm.runInContext(scripts.at(-1).replace(/\}\)\(\);\s*$/,`globalThis.audit={photoMode,camera,setEntered(){entered=true;}};})();`),c);
 const{photoMode:P,camera}=c.audit;
 // The camera button floats on the page; in photo mode a body class hides it with every other panel.
 assert(!body.children.some(n=>n.className==='photo-toggle'),'photo mode opens from the hotbar camera, not its own button');
 assert.equal(P.enter(),false,'photo mode before entering the village');assert.equal(P.shoot(),null);
 c.audit.setEntered();const fov=camera.fov;
 assert.equal(P.enter(),true);assert(P.on);assert(classes.has('photo-mode'),'panels stay on screen in photo mode');
 // Zoom is a gentle field-of-view change, kept between 20 and 60 degrees.
 for(let i=0;i<20;i++)P.zoom(-1);assert.equal(camera.fov,P.FOV.min);for(let i=0;i<20;i++)P.zoom(1);assert.equal(camera.fov,P.FOV.max);
 const r0=renders,shot=P.shoot();assert(shot.startsWith('data:image/'),'no picture');assert.equal(renders,r0+1,'the frame is not rendered right before reading it');
 assert.equal(P.album().length,1);assert.equal(P.album()[0].w,world);
 // Only the newest 24 pictures stay.
 for(let i=0;i<30;i++)P.shoot();assert.equal(P.album().length,P.MAX);
 P.exit();assert(!P.on);assert(!classes.has('photo-mode'),'panels do not come back');assert.equal(camera.fov,fov,'zoom leaks out of photo mode');
 P.openAlbum();assert(P.isOpen());P.closeAlbum();assert(!P.isOpen());
 // A full browser storage says so instead of pretending, and keeps what was there.
 full=true;P.enter();assert.equal(P.shoot(),null);P.exit();assert.equal(P.album().length,P.MAX);full=false;
 // Broken entries in storage are ignored.
 store.set('village-album',JSON.stringify([{src:'javascript:alert(1)'},{src:'data:image/jpeg;base64,x',t:1,w:world},null]));assert.equal(P.album().length,1);
 console.log('PASS: '+world+' photo mode waits for the village, hides the panels, zooms within limits, renders before capturing, keeps the newest 24 pictures and restores the view.');
}
