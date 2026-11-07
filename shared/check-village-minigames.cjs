const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(__dirname,'village-minigames.js'),'utf8');
assert(!/localStorage|villageStore|innerHTML/.test(source),'minigames keep no scores and never write HTML');
function load(world){
 let serial=0;const nodes=new Map(),store=new Map(),ctx2d=new Proxy({measureText:()=>({width:100}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
 function node(id){if(!nodes.has(id))nodes.set(id,{id,hidden:false,disabled:false,value:'',textContent:'',className:'',style:{},dataset:{},children:[],handlers:{},classList:{add(){},remove(){},toggle(){}},addEventListener(k,v){this.handlers[k]=v;},setAttribute(k,v){this[k]=v;},getAttribute(k){return this[k];},focus(){},append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},getContext:()=>ctx2d});return nodes.get(id);}
 const c={console:{log(){},warn(){},error:console.error},performance,Math,Date,URL,URLSearchParams,Float32Array,Uint32Array,Uint8Array,Int32Array,Map,Set,Array,Object,Number,JSON,Promise,crypto:crypto.webcrypto,devicePixelRatio:1,innerWidth:390,innerHeight:844,matchMedia:()=>({matches:false}),requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){},addEventListener(){},document:{hidden:false,body:node('body'),getElementById:node,createElement:()=>node('generated-'+serial++),createTextNode:t=>({textContent:t}),querySelectorAll:()=>[],addEventListener(){}},location:{hash:'#room='+({winter:'',aquarium:'aq_',library:'lb_'}[world])+'0123456789abcdef01234567',pathname:'/snowy-winter-village/',search:'',href:'https://example.com/'},history:{replaceState(){}},localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)}};c.window=c;vm.createContext(c);
 const scripts=[...fs.readFileSync(path.join(root,world,'docs/index.html'),'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);vm.runInContext(scripts[0],c);c.THREE.WebGLRenderer=class{constructor(){this.domElement=node('renderer');}setPixelRatio(){}setSize(){}setClearColor(){}render(){}};
 vm.runInContext(scripts.at(-1).replace(/\}\)\(\);\s*$/,`globalThis.audit={villageMinigames,radialMenu};})();`),c);return{G:c.audit.villageMinigames,R:c.audit.radialMenu,nodes};
}
// A fixed sequence stands in for chance.
const seq=list=>{let i=0;return()=>list[i++%list.length];};
const titles={library:'그림책 짝 맞추기',winter:'오두막 주사위',aquarium:'물고기 찾기 오락기'};
for(const world of['winter','aquarium','library']){
 const{G,R,nodes}=load(world);assert.equal(G.GAME.title,titles[world]);
 assert([...nodes.values()].some(n=>n.textContent==='함께 놀기'&&n.className==='resident-next'),'no play choice in the resident dialog');assert(R.items().some(i=>i.label==='놀이'),'no play choice in the radial menu');
 G.open();assert(G.isOpen());G.close();assert(!G.isOpen());
}
{
 // Picture-book pairs: twelve cards, six pairs; a mismatch stays up until the next tap; every turn counts, nothing else.
 const M=load('library').G.memory;M.deal(seq([.5,.1,.9,.3,.7,.2,.6,.4,.8,0,.55]));assert.equal(M.cards.length,12);for(let i=0;i<6;i++)assert.equal(M.cards.filter(v=>v===i).length,2);
 const pairOf=i=>M.cards.findIndex((v,j)=>j!==i&&v===M.cards[i]),other=i=>M.cards.findIndex(v=>v!==M.cards[i]);
 assert.equal(M.flip(0),'first');assert.equal(M.flip(0),null,'the same card twice');assert.equal(M.flip(other(0)),'miss');assert.equal(M.open.length,2);
 assert.equal(M.flip(0),'first','a new tap should turn the mismatch back');assert.equal(M.open.length,1);assert.equal(M.flip(pairOf(0)),'pair');assert.equal(M.flip(0),null,'found cards stay found');
 for(let i=0;i<12;i++)if(!M.found.has(i)){M.flip(i);const r=M.flip(pairOf(i));if(M.done())assert.equal(r,'done');}assert(M.done());assert.equal(M.turns,7);
 console.log('PASS: library picture-book pairs deal six pairs, keep a mismatch up until the next tap, count only this round\'s turns and finish.');
}
{
 // Cabin dice: up to three rolls, kept dice stay, the picture card matches in any order.
 const D=load('winter').G.dice;D.deal(seq([0,.2,.4]));assert.equal(D.target.join(),'0,1,2');assert.equal(D.hold(0),false,'holding before rolling');
 D.roll(seq([.4,.9,0]));assert.equal(D.faces.join(),'2,5,0');assert(!D.done());assert(D.hold(0));assert(D.hold(2));
 D.roll(seq([.2]));assert.equal(D.faces.join(),'2,1,0','kept dice changed');assert(D.done(),'the card matches in any order');assert.equal(D.roll(),false,'rolling after finishing');
 D.deal(seq([0,0,0]));for(let i=0;i<3;i++)assert(D.roll(seq([.9])));assert.equal(D.roll(),false,'a fourth roll');assert(D.over()&&!D.done());
 console.log('PASS: winter cabin dice roll up to three times, keep held dice, match the picture card in any order and end kindly.');
}
{
 // Fish arcade: twenty seconds, a fish every 0.9 s that stays 1.2 s, a tap says hello; empty holes do nothing.
 const A=load('aquarium').G.arcade;A.start();A.step(.31,()=>0);assert.equal(A.fish.size,1);const hole=[...A.fish.keys()][0];assert.equal(A.tap((hole+1)%9),false);assert(A.tap(hole));assert.equal(A.seen,1);assert.equal(A.tap(hole),false);
 A.step(1,()=>0);A.step(1.5,()=>0);assert(A.fish.size<=2,'old fish should duck back');for(let i=0;i<40;i++){A.step(.5,()=>.5);for(const c of[...A.fish.keys()])A.tap(c);}
 assert(!A.running,'the round should end after twenty seconds');assert.equal(A.fish.size,0);assert(A.seen>=20&&A.seen<=23,'saw '+A.seen);assert.equal(A.tap(0),false);
 console.log('PASS: aquarium fish arcade runs twenty seconds, shows a fish every 0.9 s for 1.2 s, counts hellos for this round only and stops.');
}
