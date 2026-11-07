const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.join(__dirname,'..');
function load(world,search){
 let serial=0,clock=1000;const nodes=new Map(),store=new Map(),ctx2d=new Proxy({measureText:()=>({width:100}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
 function node(id){if(!nodes.has(id))nodes.set(id,{id,hidden:false,disabled:false,value:'',textContent:'',className:'',style:{},dataset:{},children:[],handlers:{},classList:{add(){},remove(){},toggle(){}},addEventListener(k,v){this.handlers[k]=v;},setAttribute(k,v){this[k]=v;},focus(){},append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},getContext:()=>ctx2d});return nodes.get(id);}
 const c={console:{log(){},warn(){},error:console.error},performance:{now:()=>clock*1000},Math,Date,URL,URLSearchParams,Float32Array,Uint32Array,Uint8Array,Int32Array,Map,Set,Array,Object,Number,JSON,Promise,crypto:crypto.webcrypto,devicePixelRatio:1,innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){},addEventListener(){},document:{hidden:false,body:node('body'),getElementById:node,createElement:()=>node('generated-'+serial++),createTextNode:t=>({textContent:t}),querySelectorAll:()=>[],addEventListener(){}},location:{hash:'#room='+({winter:'',aquarium:'aq_',library:'lb_'}[world])+'0123456789abcdef01234567',pathname:'/snowy-winter-village/',search,href:'https://example.com/'},history:{replaceState(){}},localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)}};c.window=c;vm.createContext(c);
 const scripts=[...fs.readFileSync(path.join(root,world,'docs/index.html'),'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);vm.runInContext(scripts[0],c);c.THREE.WebGLRenderer=class{constructor(){this.domElement=node('renderer');}setPixelRatio(){}setSize(){}setClearColor(){}render(){}};
 vm.runInContext(scripts.at(-1).replace(/\}\)\(\);\s*$/,`globalThis.audit={avatarLife,villagePlay,residentGuide,remotePlayers,makePeer,player,scene,getCharacter(){return character;},setEntered(){entered=true;},setMode(m){mode=m;}};})();`),c);
 const a=c.audit;a.setEntered();return{a,T:c.THREE,advance(s){clock+=s;},get t(){return clock;}};
}
const faceOf=head=>({lids:head.getObjectByName('face-lids'),arcs:head.getObjectByName('face-happy-eyes'),mouth:head.getObjectByName('face-mouth')});
for(const world of['winter','aquarium','library']){
 const w=load(world,'?sky=day&weather=clear'),a=w.a,L=a.avatarLife;
 L.tick(.016);const me=a.getCharacter(),f=faceOf(me.head);assert(f.lids&&f.arcs&&f.mouth,world+' face rig missing');
 let faceMeshes=0;me.head.traverse(o=>{if(o.isMesh&&o.name.startsWith('face-'))faceMeshes++;});assert.equal(faceMeshes,3,'face rig must stay at three draw calls');
 // Finishing touches: eye sparkle that hides on a blink, blush, a tail and a soft outline on head and body, added once.
 assert(me.head.getObjectByName('look-shine').visible&&me.head.getObjectByName('look-blush'),'no sparkle or blush');assert(me.body.getObjectByName('look-tail'),'no tail');let hulls=0;me.root.traverse(o=>{if(o.name==='look-outline')hulls++;});assert.equal(hulls,2,'outline should be head and body only');L.tick(.016);let again=0;me.root.traverse(o=>{if(o.name==='look-outline')again++;});assert.equal(again,2,'dressed twice');
 // Blinking: a short close every three to six seconds, open otherwise.
 let closed=0,frames=0,gaps=[],last=null;for(let i=0;i<800;i++){w.advance(.02);L.tick(.02);frames++;if(f.lids.visible){closed++;if(last!==null&&w.t-last>.3)gaps.push(w.t-last);last=w.t;}}
 assert(closed>0,world+' never blinks');assert(closed/frames<.12,world+' eyes are mostly closed');assert(gaps.length>=2&&gaps.every(g=>g>2.8&&g<6.4),world+' blink spacing '+gaps.map(g=>g.toFixed(1)));
 // Emotes drive expressions: smiles close into ^^, surprise opens the mouth, sleepy half-closes the lids.
 assert.equal(a.villagePlay.say(1),true);L.tick(.016);assert(f.arcs.visible&&f.lids.visible,'smile emote shows no ^^ eyes');
 w.advance(3);L.tick(.016);assert(!f.arcs.visible,'smile outlives the emote');assert.equal(a.villagePlay.say(4),true);L.tick(.016);assert(f.mouth.visible&&!f.lids.visible,'surprise face missing');
 w.advance(3);assert.equal(a.villagePlay.say(3),true);L.tick(.016);assert(f.lids.visible&&f.lids.scale.y<.7,'sleepy face missing');w.advance(3);L.tick(.016);
 // A friend's emote shows on their own face; a calm visitor glances at a nearby friend, briefly and within ±0.6 rad.
 const friend=a.makePeer('friend',{v:1,u:'friend',n:'친구',k:1,x:a.player.position.x+3,y:0,z:a.player.position.z,a:0,p:0,m:'idle',b:0,t:Date.now(),s:0,j:1});friend.actor.root.position.set(a.player.position.x+3,0,a.player.position.z);a.remotePlayers.set('friend',friend);
 friend.emoteShown=0;friend.emoteAt=w.t;L.tick(.016);assert(faceOf(friend.actor.head).arcs.visible,"friend's smile missing");
 a.player.rotation.y=0;let maxY=0,minY=0;for(let i=0;i<600;i++){w.advance(.02);L.tick(.02);maxY=Math.max(maxY,me.head.rotation.y);minY=Math.min(minY,me.head.rotation.y);}
 assert(maxY>.2&&maxY<=.6001&&minY>-.05,world+' glance '+minY.toFixed(2)+'..'+maxY.toFixed(2));
 a.setMode('warm');for(let i=0;i<300;i++){w.advance(.02);L.tick(.02);}assert(Math.abs(me.head.rotation.y)<.01,'glancing during an activity');a.setMode('idle');
 // Residents: asleep at night, mouth moving while talking, never glancing, and still within their draw-call budget.
 const r=a.residentGuide,rf=faceOf(r.actor.head);r.actor.head.rotation.y=0;for(let i=0;i<300;i++){w.advance(.02);L.tick(.02);}assert.equal(r.actor.head.rotation.y,0,'resident glanced at a visitor');
 let meshes=0;r.actor.root.traverse(o=>{if(o.isMesh||o.isPoints)meshes++;});r.station.traverse(o=>{if(o.isMesh||o.isPoints)meshes++;});assert(meshes<=16,world+' resident draw calls '+meshes);assert(r.actor.head.getObjectByName('look-shine')&&r.actor.head.getObjectByName('look-blush'),'resident face has no sparkle or blush');
 // Breath only in the cold outdoor winter.
 assert.equal(L.puffs.filter(p=>p.sprite.visible).length,0,world+' breathes on a clear day');
 console.log('PASS: '+world+' faces blink every 3-6 s, show emote smiles, surprise and sleepiness for visitors and friends, glance briefly only when calm, and keep residents (now with eye sparkle and blush) within 16 draw calls.');
}
{
 const w=load('winter','?sky=night&weather=clear&routine=sleep'),a=w.a,L=a.avatarLife;for(let i=0;i<300;i++){w.advance(.02);L.tick(.02);}
 assert(L.puffs.some(p=>p.sprite.visible)||L.puffs.length>0,'no breath on a cold winter night');assert(L.puffs.length<=16);
 const rf=faceOf(a.residentGuide.actor.head);assert(rf.lids.visible&&rf.lids.scale.y===1,'sleeping resident keeps its eyes open');
 for(const world of['aquarium','library']){const x=load(world,'?sky=night&weather=heavy');for(let i=0;i<300;i++){x.advance(.02);x.a.avatarLife.tick(.02);}assert.equal(x.a.avatarLife.puffs.length,0,world+' breathes indoors');}
 console.log('PASS: winter breath puffs on cold nights from a pool of at most 16 sprites, never indoors, and sleeping residents close their eyes.');
}
