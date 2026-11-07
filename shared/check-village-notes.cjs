const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(__dirname,'village-notes.js'),'utf8');
assert(!source.includes('innerHTML'),'friend text must never be inserted as HTML');
(async()=>{
for(const world of['winter','aquarium','library']){
 let serial=0;const nodes=new Map(),store=new Map(),toasts=[],ctx2d=new Proxy({measureText:()=>({width:100}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
 function node(id){if(!nodes.has(id))nodes.set(id,{id,hidden:false,disabled:false,value:'',textContent:'',className:'',style:{},dataset:{},children:[],handlers:{},classList:{add(){},remove(){},toggle(){}},addEventListener(k,v){this.handlers[k]=v;},setAttribute(){},focus(){},append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},getContext:()=>ctx2d});return nodes.get(id);}
 const c={console:{log(){},warn(){},error:console.error},performance,Math,Date,URL,URLSearchParams,Float32Array,Uint32Array,Uint8Array,Int32Array,Map,Set,Array,Object,Number,JSON,Promise,crypto:crypto.webcrypto,devicePixelRatio:1,innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){},addEventListener(){},document:{hidden:false,body:node('body'),getElementById:node,createElement:()=>node('generated-'+serial++),createTextNode:t=>({textContent:t}),querySelectorAll:()=>[],addEventListener(){}},location:{hash:'#room='+({winter:'',aquarium:'aq_',library:'lb_'}[world])+'0123456789abcdef01234567',pathname:'/snowy-winter-village/',search:'',href:'https://example.com/'},history:{replaceState(){}},localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)}};c.window=c;vm.createContext(c);
 const scripts=[...fs.readFileSync(path.join(root,world,'docs/index.html'),'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);vm.runInContext(scripts[0],c);c.THREE.WebGLRenderer=class{constructor(){this.domElement=node('renderer');}setPixelRatio(){}setSize(){}setClearColor(){}render(){}};
 vm.runInContext(scripts.at(-1).replace(/\}\)\(\);\s*$/,`globalThis.audit={villageNotes,villageStore,villageEvent,player,scene,blocked,pathTo,places:typeof places==="undefined"?{snow:{x:0,z:7},fire:{x:-5,z:1.3},sled:{x:13,z:-12}}:places,setEntered(){entered=true;},setNick(n){nickname=n;},helpOpen};})();`),c);
 const a=c.audit,n=a.villageNotes,T=c.THREE,L=n.LAYOUT;a.setEntered();a.setNick('눈사람');for(const id of['help-modal','invite-modal','memory-modal','cat-modal','book-picker'])node(id).hidden=true;

 // Props stand on free ground near the entrance, block walking and keep every activity reachable.
 for(const name of['village-mailbox','village-board','village-sign-0','village-sign-1'])assert(a.scene.getObjectByName(name),world+' missing '+name);
 for(const spot of[L.mailbox,L.board,...L.signs]){assert(a.blocked(spot.x,spot.z),world+' prop is walkable');a.player.position.set(0,0,7);assert(a.pathTo(spot.x+.9,spot.z+.9).length||Math.hypot(spot.x+.9,spot.z+.9-7)<1.2,world+' prop unreachable');}
 a.player.position.set(0,0,7);for(const p of Object.values(a.places))assert(a.pathTo(p.x,p.z).length||Math.hypot(p.x,p.z-7)<1,world+' props block an activity');

 // Taps: far away only hints (and the world walks there); close up opens the right sheet and pauses world taps.
 const down=s=>new T.Raycaster(new T.Vector3(s.x,1,s.z+3),new T.Vector3(0,0,-1));
 a.player.position.set(L.mailbox.x+8,0,L.mailbox.z);assert.equal(a.villageNotes.pick(down(L.mailbox)),false);
 a.player.position.set(L.mailbox.x+1.2,0,L.mailbox.z+1.2);assert.equal(n.pick(down(L.mailbox)),true);assert.equal(n.openKind,'mailbox');assert(a.helpOpen(),'world taps continue under the open sheet');n.close();assert(!n.isOpen());

 // Text is single-line, trimmed, control-free and length-limited before storage.
 assert.equal(n.clean('  안녕\n\t친구  ',80),'안녕 친구');assert.equal(n.clean('가'.repeat(200),80).length,80);assert.equal(n.clean('\u0007',80),'');

 // #7 Letters: to everyone or a friend, never to bystanders; own letters are never unread; reading clears the flag.
 assert.equal(await n.sendLetter('*','<b>모두</b> 안녕!'+' 하'.repeat(60),1),'local');let box=n.inbox();assert.equal(box.length,1);assert(box[0].b.length<=80);assert(box[0].b.startsWith('<b>모두</b> 안녕!'),'stored text changed');assert.equal(n.unread().length,0);
 assert.equal(await n.sendLetter('*',''),null);
 const lettersKey='village-store:0123456789abcdef01234567:letters',letters=JSON.parse(store.get(lettersKey));letters.f1={f:'곰돌이',to:'눈사람',b:'놀러 와!',s:0,u:'x',t:Date.now()};letters.f2={f:'곰돌이',to:'다른 친구',b:'비밀',s:0,u:'x',t:Date.now()};letters.old={f:'곰돌이',to:'*',b:'옛날 편지',s:0,u:'x',t:Date.now()-20*86400e3};store.set(lettersKey,JSON.stringify(letters));
 await a.villageStore.put('letters','tick'+world.length,{f:'눈사람',to:'*',b:'다시',s:0,u:'',t:Date.now()});box=n.inbox();assert(box.some(l=>l.id==='f1'));assert(!box.some(l=>l.id==='f2'),'a letter to someone else is visible');assert(!box.some(l=>l.id==='old'),'two-week-old letters still show');
 assert.equal(n.unread().length,1);n.openMailbox();assert.equal(n.unread().length,0,'opening the mailbox does not mark letters read');n.close();

 // #8 Board: two of the resident's three requests per Seoul day, thanked once; memos are short and expire after a week.
 const today=n.todaysRequests();assert.equal(today.length,2);assert.notDeepEqual(n.todaysRequests(1).map(r=>r[0]),n.todaysRequests(2).map(r=>r[0]));
 const missing=L.requests.find(r=>!today.includes(r));assert.equal(a.villageEvent(missing[0]),false);assert.equal(a.villageEvent(today[0][0]),true);assert.equal(a.villageEvent(today[0][0]),false,'thanked twice');
 assert.equal(await n.postMemo('  같이 낚시해요  '),'local');n.openBoard();assert.equal(n.openKind,'board');n.close();
 const memoKey='village-store:0123456789abcdef01234567:board',memos=JSON.parse(store.get(memoKey));assert.equal(Object.values(memos)[0].b,'같이 낚시해요');assert.equal(Object.values(memos)[0].w,world);

 // #9 Signs: rewriteable by anyone in the group, limited to 24 characters, painted on the 3D sign.
 assert.equal(await n.writeSign(0,'여기는 '+'아주 '.repeat(20)),'local');assert.equal(await n.writeSign(0,'반가워요'),'local');const signs=JSON.parse(store.get('village-store:0123456789abcdef01234567:signs'));assert.equal(signs[world+'-0'].b,'반가워요');assert(!signs[world+'-1']);
 n.openSign(1);assert.equal(n.openKind,'sign');n.close();
 console.log('PASS: '+world+' mailbox, board and signs stand clear of every route, open only up close, keep friend text clean and short, scope letters to their readers, thank daily requests once and fall back to this browser.');
}
// The rules: letters and memos are created once and only their author may remove them; signs are fixed slots.
const rules=['winter','aquarium','library'].map(w=>fs.readFileSync(path.join(root,w,'database.rules.json'),'utf8'));assert(rules.every(r=>r===rules[0]));
const v=JSON.parse(rules[0]).rules.village.$party;for(const k of['letters','board']){assert(v[k].$id['.write'].includes("!data.exists() && newData.exists()"));assert(v[k].$id['.write'].includes("data.child('u').val() === auth.uid"));assert.equal(v[k].$id.$other['.validate'],false);}
assert(v.letters.$id.b['.validate'].includes('<= 80'));assert(v.board.$id.b['.validate'].includes('<= 40'));assert(v.signs.$id.b['.validate'].includes('<= 24'));assert(v.signs.$id['.write'].includes('(winter|aquarium|library)-[01]'));
console.log('PASS: village letters, board and sign rules are identical in every world, length-limited, author-owned and add-only where friends cannot overwrite each other.');
})().catch(e=>{console.error(e);process.exit(1);});
