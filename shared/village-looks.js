// Looks: coat and scarf colours plus one accessory on top of the three animals, three saved sets and a mirror by the entrance.
// avatar() runs before this file, so the hooks below are hoisted functions that fall back to the plain palette until LOOK_STATE exists.
var LOOK_STATE=null;
const LOOK_COATS=[null,0xa5c8b9,0xd5b59b,0xb8a7cd,0xe7b7b0,0x9fb4cf,0xe2d6a8],LOOK_SCARVES=[null,0xe4a28e,0x97b5c5,0xe4c68d,0xb7d3a8,0xd9a6c4,0xf2efe6];
const LOOK_ACCESSORIES=['none','beanie','earmuffs','flower','glasses'],LOOK_LABELS={none:'없음',beanie:'털모자',earmuffs:'귀마개',flower:'꽃',glasses:'안경'};
function lookPalette(kind,look){const base=palettes[kind];if(!look)return base;const c=LOOK_COATS[look.c],s=LOOK_SCARVES[look.s];return{...base,...(c?{coat:c}:{}),...(s?{scarf:s}:{})};}
function myLook(){return LOOK_STATE?LOOK_STATE.mine():undefined;}
function peerLook(uid){return LOOK_STATE?LOOK_STATE.of(uid):undefined;}
function peerLookSig(uid){return LOOK_STATE?LOOK_STATE.sig(uid):'';}
// One merged mesh per accessory, coloured to match the scarf (glasses stay dark).
function lookDress(head,look,p){
 if(!look||look.a==='none'||!LOOK_ACCESSORIES.includes(look.a))return null;
 const parts=[],ball=new THREE.SphereGeometry(1,12,8),torus=new THREE.TorusGeometry(1,.18,6,18),half=new THREE.TorusGeometry(1,.12,5,16,Math.PI),cone=new THREE.ConeGeometry(1,1,6);
 const add=(geo,pos,scale,rot=[0,0,0])=>parts.push({geo,pos,scale,rot});
 if(look.a==='beanie'){add(ball,[0,.2,-.02],[.45,.3,.42]);add(torus,[0,.12,-.02],[.43,.43,.5],[Math.PI/2,0,0]);add(ball,[0,.52,-.04],[.09,.09,.09]);}
 if(look.a==='earmuffs'){for(const s of[-1,1])add(ball,[s*.42,.02,0],[.1,.12,.1]);add(half,[0,.02,0],[.42,.46,.5]);}
 if(look.a==='flower'){for(let i=0;i<5;i++){const a=i*Math.PI*2/5;add(ball,[.24+Math.cos(a)*.045,.32+Math.sin(a)*.045,.2],[.04,.04,.02]);}add(ball,[.24,.32,.21],[.025,.025,.02]);}
 if(look.a==='glasses'){for(const s of[-1,1])add(torus,[s*.125,.015,.44],[.075,.075,.08]);add(cone,[0,.03,.445],[.012,.08,.012],[0,0,Math.PI/2]);}
 const geos=parts.map(q=>{const g=q.geo.clone().applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...q.pos),new THREE.Quaternion().setFromEuler(new THREE.Euler(...q.rot)),new THREE.Vector3(...q.scale)));return g.index?g.toNonIndexed():g;});
 const count=geos.reduce((n,g)=>n+g.attributes.position.count,0),pos=new Float32Array(count*3),nor=new Float32Array(count*3);let o=0;for(const g of geos){pos.set(g.attributes.position.array,o);nor.set(g.attributes.normal.array,o);o+=g.attributes.position.array.length;g.dispose();}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.BufferAttribute(nor,3));
 const color=look.a==='glasses'?0x4d4552:look.a==='flower'?0xf2c1cf:p.scarf,mesh=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color}));mesh.name='look-accessory-'+look.a;head.add(mesh);return mesh;
}
function createVillageLooks(){
 const KEY='village-look',SETS='village-look-sets',MIRROR=CURRENT_WORLD==='winter'?{x:-13.2,z:8.6}:{x:-6.5,z:10},REACH=3.4,DEFAULT={c:0,s:0,a:'none'};
 const valid=l=>Boolean(l)&&Number.isInteger(l.c)&&l.c>=0&&l.c<LOOK_COATS.length&&Number.isInteger(l.s)&&l.s>=0&&l.s<LOOK_SCARVES.length&&LOOK_ACCESSORIES.includes(l.a);
 const clean=l=>valid(l)?{c:l.c,s:l.s,a:l.a}:{...DEFAULT};
 function read(key,fallback){try{const v=JSON.parse(localStorage.getItem(key)||'null');return v===null?fallback:v;}catch{return fallback;}}
 function write(key,v){try{localStorage.setItem(key,JSON.stringify(v));}catch{}}
 let mine=clean(read(KEY,DEFAULT)),looks={};
 // Friends' looks live in village/{party}/looks/{uid}; until those rules are deployed only this browser sees its own look.
 villageStore.subscribe('looks',v=>{looks=v||{};});
 function of(uid){return uid&&looks[uid]?clean(looks[uid]):{...DEFAULT};}
 function sig(uid){const l=of(uid);return l.c+'.'+l.s+'.'+l.a;}
 async function wear(look){mine=clean(look);write(KEY,mine);if(typeof chooseCharacter==='function')chooseCharacter(selected);const uid=villageStore.uid();if(!uid)return'local';return villageStore.put('looks',uid,{...mine,u:uid,t:Date.now()});}
 function sets(){const s=read(SETS,[]);return Array.isArray(s)?[0,1,2].map(i=>valid(s[i])?clean(s[i]):null):[null,null,null];}
 function saveSet(i){const s=sets();s[i]={...mine};write(SETS,s);return s[i];}
 async function loadSet(i){const s=sets()[i];if(!s)return null;await wear(s);return s;}
 // The mirror: a framed glass by the entrance; tap it up close to change looks.
 const frame=new THREE.Group();frame.name='village-mirror';const floor=typeof groundHeight==='function'?groundHeight(MIRROR.x,MIRROR.z):0;frame.position.set(MIRROR.x,floor,MIRROR.z);frame.rotation.y=Math.PI*.15;
 box(frame,0x9b7c67,0,1.1,0,.95,2.2,.12);const glass=new THREE.Mesh(new THREE.PlaneGeometry(.75,1.8),new THREE.MeshBasicMaterial({color:0xcfe0ea}));glass.position.set(0,1.15,.065);frame.add(glass);box(frame,0x7f6857,0,.06,0,1.1,.12,.5);scene.add(frame);block(MIRROR.x,MIRROR.z,.5);
 const hit=new THREE.Mesh(new THREE.BoxGeometry(1.1,2.3,.6),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));hit.position.y=1.1;frame.add(hit);
 const sheet=document.createElement('section');sheet.className='creature-book village-looks';sheet.hidden=true;const card=document.createElement('div');card.className='creature-book-card';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');const closeButton=document.createElement('button');closeButton.className='creature-book-close';closeButton.textContent='×';closeButton.setAttribute('aria-label','거울 닫기');const body=document.createElement('div');card.append(closeButton,body);sheet.append(card);document.body.append(sheet);
 const style=document.createElement('style');style.textContent='.village-looks .swatches{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 10px}.village-looks .swatches button{width:40px;height:40px;border-radius:50%;border:3px solid transparent;cursor:pointer}.village-looks .swatches button[aria-pressed=true]{border-color:#6a5050}.village-looks .chips{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 10px}.village-looks .chips button{min-height:40px;padding:0 12px;border-radius:12px;border:0;background:#f1e5d2;color:#5f5050;font:inherit;cursor:pointer}.village-looks .chips button[aria-pressed=true]{background:#d9b98d}';(document.head||document.body).append(style);
 function close(){sheet.hidden=true;}closeButton.addEventListener('click',close);sheet.addEventListener('click',e=>{if(e.target===sheet)close();});addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden)close();});
 const hex=c=>'#'+c.toString(16).padStart(6,'0');
 function render(){const p=palettes[selected],row=(label,list,key,base)=>{const h=document.createElement('h3');h.textContent=label;const wrap=document.createElement('div');wrap.className='swatches';list.forEach((c,i)=>{const b=document.createElement('button');b.style.background=hex(c||base);b.setAttribute('aria-label',label+' '+(i?i+'번':'기본'));b.setAttribute('aria-pressed',String(mine[key]===i));b.addEventListener('click',async()=>{await wear({...mine,[key]:i});render();});wrap.append(b);});return[h,wrap];};
  const acc=document.createElement('div');acc.className='chips';for(const a of LOOK_ACCESSORIES){const b=document.createElement('button');b.textContent=LOOK_LABELS[a];b.setAttribute('aria-pressed',String(mine.a===a));b.addEventListener('click',async()=>{await wear({...mine,a});render();});acc.append(b);}
  const setRow=document.createElement('div');setRow.className='chips';sets().forEach((s,i)=>{const save=document.createElement('button');save.textContent=(i+1)+'번에 저장';save.addEventListener('click',()=>{saveSet(i);render();});const load=document.createElement('button');load.textContent=(i+1)+'번 입기';load.disabled=!s;load.addEventListener('click',async()=>{await loadSet(i);render();});setRow.append(save,load);});
  const accTitle=document.createElement('h3');accTitle.textContent='장식';const setTitle=document.createElement('h3');setTitle.textContent='옷장';const title=document.createElement('h2');title.textContent='거울';const note=document.createElement('p');note.className='creature-count';note.textContent=villageStore.mode==='shared'?'친구들 화면에도 바뀐 모습이 보여요.':'지금은 내 화면에서만 바뀐 모습이 보여요.';
  body.replaceChildren(title,note,...row('옷 색',LOOK_COATS,'c',p.coat),...row('목도리 색',LOOK_SCARVES,'s',p.scarf),accTitle,acc,setTitle,setRow);}
 function open(){if(!entered)return;render();sheet.hidden=false;closeButton.focus();}
 function pick(ray){frame.updateWorldMatrix(true,true);if(!ray.intersectObject(hit,false)[0])return false;if(!entered)return true;if(Math.hypot(player.position.x-MIRROR.x,player.position.z-MIRROR.z)>REACH){toast('거울 가까이 가 볼까요?');return false;}open();return true;}
 return{MIRROR,DEFAULT,mine:()=>({...mine}),of,sig,wear,sets,saveSet,loadSet,open,close,pick,isOpen:()=>!sheet.hidden,valid};
}
LOOK_STATE=createVillageLooks();
const villageLooks=LOOK_STATE;
// Rebuild this visitor once so a saved look shows from the first frame.
if(typeof chooseCharacter==='function')chooseCharacter(selected);
