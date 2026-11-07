// A small hotbar of things to carry: tap a slot (or press 1–5) to hold it, tap the held slot again to use it.
// The held thing shows in the character's hand; the kite and lantern take the colour chosen in the village shop.
function createVillageHotbar(){
 const WINTER=CURRENT_WORLD==='winter',SHOP=kind=>typeof villageMarket==='object'&&villageMarket&&villageMarket.choice?villageMarket.choice(kind):null;
 const SLOTS=[
  {id:'toss',icon:CURRENT_WORLD==='library'?'✈':'○',name:()=>villageSnowball.KIND.name,use:()=>{if(villageSnowball.armed)villageSnowball.arm();return true;},arms:true},
  ...(WINTER?[{id:'kite',icon:'◇',name:()=>'연',use:()=>villagePlay.toggleKite(),shop:'kite'},{id:'lantern',icon:'✦',name:()=>'풍등',use:()=>villagePlay.lantern(),shop:'lantern'}]:[]),
  {id:'cocoa',icon:'☕',name:()=>'코코아',use:()=>villageTogether.cocoa()},
  {id:'camera',icon:'▣',name:()=>'카메라',use:()=>photoMode.enter()}
 ];
 let held=null,dots=null;const hands=new Map();
 const bar=document.createElement('div');bar.className='village-hotbar';bar.setAttribute('role','toolbar');bar.setAttribute('aria-label','들고 다니는 물건');bar.hidden=true;
 const style=document.createElement('style');style.textContent='.village-hotbar{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 190px);transform:translateX(-50%);z-index:4;display:flex;gap:6px;padding:5px;border-radius:18px;background:rgba(255,247,232,.62);backdrop-filter:blur(8px)}.village-hotbar button{position:relative;width:44px;height:44px;border:0;border-radius:13px;background:rgba(255,247,232,.92);color:#5f5050;font:700 18px/1 "Winter Jua",sans-serif;cursor:pointer;box-shadow:0 2px 8px rgba(40,40,70,.15)}.village-hotbar button[aria-pressed="true"]{background:#8e9d83;color:#fff8e8}.village-hotbar button small{position:absolute;left:4px;top:3px;font-size:9px;opacity:.7}.village-hotbar button i{position:absolute;right:5px;bottom:5px;width:7px;height:7px;border-radius:50%}';(document.head||document.body).append(style);
 const buttons=SLOTS.map((s,i)=>{const b=document.createElement('button'),n=document.createElement('small'),icon=document.createElement('span'),dot=document.createElement('i');n.textContent=String(i+1);icon.textContent=s.icon;b.append(n,icon,dot);b.addEventListener('click',()=>press(i));bar.append(b);return{b,dot};});document.body.append(bar);
 // Hand-held models, made once per kind from a few basic shapes.
 function handFor(id){if(id==='toss')return null;if(hands.has(id))return hands.get(id);const color=id==='kite'?SHOP('kite')||0xe4a28e:id==='lantern'?SHOP('lantern')||0xffd49a:id==='cocoa'?0xc98b6b:0x5f6f73,g=new THREE.Group(),m=new THREE.MeshLambertMaterial({color});
  if(id==='kite'){const k=new THREE.Mesh(new THREE.OctahedronGeometry(.16,0),m);k.scale.set(1,1.3,.2);g.add(k);}else if(id==='lantern'){const l=new THREE.Mesh(new THREE.CylinderGeometry(.09,.11,.2,8),new THREE.MeshBasicMaterial({color}));g.add(l);}
  else if(id==='cocoa'){const c=new THREE.Mesh(new THREE.CylinderGeometry(.07,.06,.13,10),m);g.add(c);}else{const c=new THREE.Mesh(new THREE.BoxGeometry(.2,.13,.09),m);g.add(c);}
  g.name='hotbar-hand-'+id;g.position.set(.32,.95,.18);g.visible=false;player.add(g);hands.set(id,g);return g;}
 function show(){for(const[id,g]of hands)g.visible=id===held;buttons.forEach(({b},i)=>{const s=SLOTS[i];b.setAttribute('aria-pressed',String(s.id===held));b.setAttribute('aria-label',(i+1)+'번 '+s.name()+(s.id===held?' · 들고 있음, 한 번 더 누르면 사용':''));});}
 // First press holds, the next press on the same slot uses it; the throwable is ready to throw as soon as it is held,
 // and a second press puts it away.
 function press(i){const s=SLOTS[i];if(!s||!entered)return null;if(held!==s.id){held=s.id;if(s.arms){if(!villageSnowball.armed)villageSnowball.arm();}else if(villageSnowball.armed)villageSnowball.arm();
   const g=handFor(s.id);if(g&&s.shop){const c=SHOP(s.shop);if(c!==null)g.children[0].material.color.setHex(c);}show();return'hold';}
  const r=s.use();if(s.arms)held=null;show();return r?'use':'tried';}
 show();
 addEventListener('keydown',e=>{if(!entered||e.repeat||e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||!/^[1-5]$/.test(e.key))return;if(typeof helpOpen==='function'&&helpOpen())return;const i=Number(e.key)-1;if(i<SLOTS.length){e.preventDefault();press(i);}});
 return{SLOTS,press,get held(){return held;},hands,bar,
  drop(){held=null;show();},
  tick(){bar.hidden=!entered;if(held==='toss'&&!villageSnowball.armed){held=null;show();}const sig=SLOTS.map(x=>x.shop?SHOP(x.shop):'').join();if(sig!==dots){dots=sig;buttons.forEach(({dot},i)=>{const c=SLOTS[i].shop?SHOP(SLOTS[i].shop):null;dot.style.background=c===null?'transparent':'#'+c.toString(16).padStart(6,'0');});}}};
}
const villageHotbar=createVillageHotbar();
