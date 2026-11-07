const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),kst=(m,d,h=12)=>Date.UTC(2026,m-1,d,h-9),source=fs.readFileSync(path.join(__dirname,'village-radio.js'),'utf8');
assert(!/new Audio\(|fetch\(|https?:/.test(source),'the radio must be made of generated tones only');
function load(world,at,saved){
 let serial=0;const t={now:at},nodes=new Map(),store=new Map(saved||[]),oscs=[],ctx2d=new Proxy({measureText:()=>({width:100}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
 function node(id){if(!nodes.has(id))nodes.set(id,{id,hidden:false,disabled:false,value:'',textContent:'',className:'',style:{},dataset:{},children:[],handlers:{},classList:{add(){},remove(){},toggle(){}},addEventListener(k,v){this.handlers[k]=v;},setAttribute(k,v){this[k]=v;},focus(){},append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},getContext:()=>ctx2d});return nodes.get(id);}
 class TestDate extends Date{constructor(...a){super(...(a.length?a:[t.now]));}static now(){return t.now;}}
 // A small stand-in for Web Audio: every node connects, every parameter remembers its last target.
 const param=()=>({value:0,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(v){this.value=v;}});
 const audioNode=extra=>new Proxy(Object.assign({gain:param(),frequency:param(),Q:param(),connect(){},disconnect(){},start(at){this.at=at;},stop(){}},extra),{get:(o,k)=>k in o?o[k]:typeof k==='string'?()=>{}:undefined,set:(o,k,v)=>(o[k]=v,true)});
 class FakeContext{constructor(){this.currentTime=0;this.sampleRate=8000;this.destination=audioNode();}createBuffer(c,n){return{getChannelData:()=>new Float32Array(n)};}createOscillator(){const o=audioNode({type:''});oscs.push(o);return o;}resume(){}suspend(){}}
 for(const k of['createGain','createBiquadFilter','createBufferSource','createDynamicsCompressor','createStereoPanner'])FakeContext.prototype[k]=()=>audioNode();
 const c={console:{log(){},warn(){},error:console.error},performance,Math,Date:TestDate,URL,URLSearchParams,Float32Array,Uint32Array,Uint8Array,Int32Array,Map,Set,Array,Object,Number,JSON,Promise,crypto:crypto.webcrypto,AudioContext:FakeContext,devicePixelRatio:1,innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){},addEventListener(){},document:{hidden:false,body:node('body'),getElementById:node,createElement:()=>node('generated-'+serial++),createTextNode:t=>({textContent:t}),querySelectorAll:()=>[],addEventListener(){}},location:{hash:'#room='+({winter:'',aquarium:'aq_',library:'lb_'}[world])+'0123456789abcdef01234567',pathname:'/snowy-winter-village/',search:'',href:'https://example.com/'},history:{replaceState(){}},localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)}};c.window=c;vm.createContext(c);
 const scripts=[...fs.readFileSync(path.join(root,world,'docs/index.html'),'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);vm.runInContext(scripts[0],c);c.THREE.WebGLRenderer=class{constructor(){this.domElement=node('renderer');}setPixelRatio(){}setSize(){}setClearColor(){}render(){}};
 vm.runInContext(scripts.at(-1).replace(/\}\)\(\);\s*$/,`globalThis.audit={villageRadio,skyWeather,getAudio(){return audio;}};})();`),c);return{a:c.audit,R:c.audit.villageRadio,nodes,store,oscs,t};
}
// Every pitch a channel may play: its scale, the eighth-step octave lift, at day or night height.
const hz=(base,steps)=>new Set(steps.flatMap(s=>[0,12].flatMap(o=>[.5,1].map(l=>Math.round(base*l*Math.pow(2,(s+o)/12)*100)))));
for(const[world,home]of[['winter','snow'],['aquarium','wave'],['library','shelf']]){
 const{a,R,nodes,store,oscs}=load(world,kst(11,7,13));
 assert.equal(R.current().id,home,world+' should tune to its own channel');assert.equal(R.choice,'auto');
 assert([...nodes.values()].some(n=>n.textContent==='라디오 채널'&&n.className==='resident-next'),'no radio choice in the resident dialog');
 // Silent until the existing sound button is turned on.
 // The world's own ambience may use oscillators too, so the radio's notes are read from its own record.
 const notes=R.record(true);R.tick();assert.equal(notes.length,0);nodes.get('sound').handlers.click();const ctx=a.getAudio().ctx,own=oscs.length;R.tick();assert(notes.length>0&&oscs.length===own+notes.length,'no notes after turning sound on');
 const ch=R.current(),allowed=hz(ch.root,ch.scale);assert(notes.every(n=>allowed.has(Math.round(n.freq*100))),'a note left the channel scale');assert(oscs.slice(own).every(o=>o.type===ch.wave));
 // Channel cycle: this space → each channel → off → this space, remembered in this browser.
 assert.equal(R.cycle(),'라디오 · 눈 오는 밤');assert.equal(R.cycle(),'라디오 · 물결');assert.equal(R.cycle(),'라디오 · 책장');assert.equal(R.cycle(),'라디오 끄기');assert.equal(store.get('village-radio'),'off');
 const before=notes.length;ctx.currentTime+=5;R.tick();assert.equal(notes.length,before,'off still plays');assert.equal(R.cycle(),'라디오 · 이 공간 · '+ch.name);
 nodes.get('sound').handlers.click();ctx.currentTime+=5;const muted=notes.length;R.tick();assert.equal(notes.length,muted,'radio plays while sound is off');
 console.log('PASS: '+world+' radio tunes to its own channel, stays silent until the sound button, keeps notes in the channel scale and cycles through channels and off.');
}
{
 // Night radio: slower and an octave lower than the afternoon one, and a saved channel survives a reload.
 const count=at=>{const{a,R,nodes}=load('winter',at,[['village-radio','1']]),notes=R.record(true);a.skyWeather.tick(5);nodes.get('sound').handlers.click();const ctx=a.getAudio().ctx;for(let i=0;i<60;i++){ctx.currentTime+=.5;R.tick();}assert.equal(R.current().id,'wave');return{n:notes.length,f:notes.reduce((s,o)=>s+o.freq,0)/notes.length};};
 const day=count(kst(11,7,13)),night=count(kst(11,7,2));assert(night.n<day.n,'night should be slower');assert(night.f<day.f,'night should be lower');
 console.log('PASS: the radio slows down and drops an octave at night, and a chosen channel is remembered.');
}
