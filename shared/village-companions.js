// Eggs and small companions: the resident hands over one egg a Seoul day, it hatches after about ten minutes of play
// (three times faster near this space's warm spot) and the new friend trots behind you. Leaving it alone costs nothing.
// Companions stay in this browser; friends do not see them because the shared rules have no field for them.
function createVillageCompanions(){
 const KINDS=[
  {id:'puff',name:'눈송이 병아리',body:0xf7e6b5,accent:0xf0b46a},
  {id:'drift',name:'둥실 해파리',body:0xcbbbe8,accent:0xf4e3a3,floats:true},
  {id:'moth',name:'책갈피 나방',body:0xe8d6b0,accent:0x8a9b7a,floats:true},
  {id:'pine',name:'솔방울 고슴도치',body:0x9a7353,accent:0xe9dcc4}
 ],WARM={winter:{x:-5,z:1.3,name:'모닥불'},aquarium:{x:12.5,z:2.5,name:'해파리 쉼터'},library:{x:6.2,z:-13.5,name:'창가 햇볕'}}[CURRENT_WORLD],
  KEY='village-companions',HATCH=600,WARM_RANGE=4,WARM_RATE=3;
 const seoulDay=(ms=Date.now())=>Math.floor((ms+9*3600e3)/86400e3),kind=id=>KINDS.find(k=>k.id===id);
 function load(){try{const s=JSON.parse(localStorage.getItem(KEY)||'null')||{},owned=Array.isArray(s.owned)?[...new Set(s.owned.filter(kind))]:[],p=s.egg&&Number.isFinite(s.egg.p)?Math.max(0,Math.min(1,s.egg.p)):null;
  return{owned,egg:p===null?null:{p},eggDay:Number.isFinite(s.eggDay)?s.eggDay:null,out:owned.includes(s.out)?s.out:null};}catch{return{owned:[],egg:null,eggDay:null,out:null};}}
 let state=load(),saveIn=0,clock=0,calmFor=0,joy=0,lx=null,lz=null;
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
 const note=id=>{if(typeof villageJournal==='object'&&villageJournal&&villageJournal.note)villageJournal.note(id);};
 function canTakeEgg(){return!state.egg&&state.eggDay!==seoulDay()&&state.owned.length<KINDS.length;}
 function takeEgg(){if(!canTakeEgg())return false;state.egg={p:0};state.eggDay=seoulDay();save();note('first-egg');toast(residentGuide.role.name+': 따뜻한 곳 곁에 있으면 더 빨리 깨어날 거예요.');return true;}
 function warmNow(){return Math.hypot(player.position.x-WARM.x,player.position.z-WARM.z)<WARM_RANGE;}
 // A new egg always brings a friend not met yet, chosen by the day so it does not depend on luck.
 function nextKind(){const left=KINDS.filter(k=>!state.owned.includes(k.id));return left[seoulDay()%left.length];}
 function hatch(){const k=nextKind();state.owned.push(k.id);state.out=k.id;state.egg=null;save();note('first-hatch');toast('알이 깨어났어요! '+k.name+'이(가) 뒤를 따라와요');return k.id;}
 function setOut(id){if(id!==null&&!state.owned.includes(id))return false;state.out=id;save();syncMeshes();return true;}
 // Small figures made from a few basic shapes; each one is a single group following the visitor.
 const M=c=>new THREE.MeshLambertMaterial({color:c}),eye=new THREE.MeshBasicMaterial({color:0x3d3438});
 function build(k){const g=new THREE.Group();g.name='companion-'+k.id;const add=(geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);g.add(m);return m;};
  if(k.id==='puff'){add(new THREE.SphereGeometry(.2,12,10),M(k.body),0,.2,0);add(new THREE.ConeGeometry(.05,.1,6),M(k.accent),0,.22,.21).rotation.x=Math.PI/2;}
  else if(k.id==='drift'){add(new THREE.SphereGeometry(.18,12,8,0,Math.PI*2,0,Math.PI/2),M(k.body),0,.1,0);for(const x of[-.08,0,.08])add(new THREE.CylinderGeometry(.012,.012,.2,4),M(k.accent),x,0,0);}
  else if(k.id==='moth'){add(new THREE.CapsuleGeometry?new THREE.CapsuleGeometry(.05,.14,4,8):new THREE.SphereGeometry(.07,8,6),M(k.accent),0,.1,0).rotation.x=Math.PI/2;for(const s of[-1,1]){const w=add(new THREE.CircleGeometry(.15,10),M(k.body),s*.13,.12,0);w.rotation.x=-Math.PI/2;w.material.side=THREE.DoubleSide;w.userData.wing=s;}}
  else{add(new THREE.SphereGeometry(.2,10,8),M(k.body),0,.18,0).scale.set(1,.8,1.15);add(new THREE.SphereGeometry(.09,8,6),M(k.accent),0,.16,.2);}
  for(const s of[-1,1])add(new THREE.SphereGeometry(.025,6,5),eye,s*.07,k.id==='drift'?.16:.26,k.id==='moth'?.08:.17);
  g.scale.setScalar(1.3);g.userData.kind=k;scene.add(g);return g;}
 function eggMesh(){const m=new THREE.Mesh(new THREE.SphereGeometry(.13,12,10),M(0xf3ead8));m.scale.y=1.3;m.name='companion-egg';scene.add(m);return m;}
 let pet=null,egg=null;
 const ground=(x,z)=>typeof groundHeight==='function'?groundHeight(x,z):player.position.y;
 function follow(obj,dt,floats,back){const yaw=player.rotation.y,tx=player.position.x-Math.sin(yaw)*back+Math.cos(yaw)*.45,tz=player.position.z-Math.cos(yaw)*back-Math.sin(yaw)*.45,dx=tx-obj.position.x,dz=tz-obj.position.z,far=Math.hypot(dx,dz);
  // Snap after a jump across the map (travel, reset); otherwise ease along behind.
  if(far>12){obj.position.x=tx;obj.position.z=tz;}else{const k=1-Math.exp(-dt*3);obj.position.x+=dx*k;obj.position.z+=dz*k;}
  const moving=far>.25;if(moving)obj.rotation.y=Math.atan2(dx,dz);else if(calmFor>6)obj.rotation.y=Math.atan2(player.position.x-obj.position.x,player.position.z-obj.position.z);
  const hop=floats?.45+Math.sin(clock*2)*.08:(moving?Math.abs(Math.sin(clock*10))*.1:0)+(joy>0?Math.abs(Math.sin(joy*9))*.25:0);obj.position.y=ground(obj.position.x,obj.position.z)+hop;return moving;}
 function syncMeshes(){const want=state.out&&kind(state.out);if(pet&&(!want||pet.userData.kind.id!==want.id)){scene.remove(pet);pet=null;}if(want&&!pet){pet=build(want);pet.position.copy(player.position);}
  if(state.egg&&!egg){egg=eggMesh();egg.position.copy(player.position);}if(!state.egg&&egg){scene.remove(egg);egg=null;}}
 const sheet=document.createElement('section');sheet.className='creature-book village-companions';sheet.hidden=true;const card=document.createElement('div');card.className='creature-book-card';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');const closeButton=document.createElement('button');closeButton.className='creature-book-close';closeButton.textContent='×';closeButton.setAttribute('aria-label','동반 친구 창 닫기');const body=document.createElement('div');card.append(closeButton,body);sheet.append(card);document.body.append(sheet);
 function close(){sheet.hidden=true;}closeButton.addEventListener('click',close);sheet.addEventListener('click',e=>{if(e.target===sheet)close();});addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden)close();});
 const button=(text,fn,disabled)=>{const b=document.createElement('button');b.className='resident-next';b.textContent=text;b.disabled=Boolean(disabled);b.addEventListener('click',()=>{fn();render();});return b;};
 function render(){const title=document.createElement('h2'),note=document.createElement('p'),list=document.createElement('ul');title.textContent='동반 친구';note.className='creature-count';
  note.textContent=state.egg?'품고 있는 알 '+Math.floor(state.egg.p*100)+'% · '+WARM.name+' 곁에 있으면 세 배 빨리 따뜻해져요':state.owned.length>=KINDS.length?'네 친구를 모두 만났어요':canTakeEgg()?residentGuide.role.name+'에게 오늘의 알을 받을 수 있어요':'내일 또 알을 받을 수 있어요';
  const rows=[];if(!state.egg&&state.owned.length<KINDS.length){const li=document.createElement('li');li.append(button('알 받기',takeEgg,!canTakeEgg()));rows.push(li);}
  for(const k of KINDS){const li=document.createElement('li'),h=document.createElement('small');if(!state.owned.includes(k.id)){li.className='unseen';h.textContent='아직 만나지 않은 친구';li.append(h);}else{li.className='seen';h.textContent=k.name;li.append(h,state.out===k.id?button('쉬게 하기',()=>setOut(null)):button('함께 걷기',()=>setOut(k.id)));}rows.push(li);}
  list.replaceChildren(...rows);body.replaceChildren(title,note,list);}
 function open(){render();sheet.hidden=false;closeButton.focus();}
 if(residentGuide.addAction)residentGuide.addAction('동반 친구',()=>{residentGuide.close();open();});
 return{KINDS,WARM,HATCH,WARM_RATE,get state(){return state;},canTakeEgg,takeEgg,warmNow,setOut,open,close,isOpen:()=>!sheet.hidden,get pet(){return pet;},get egg(){return egg;},
  // Cycles who walks along, for the radial menu: nobody → each friend met → nobody.
  cycle(){const list=[null,...state.owned],next=list[(list.indexOf(state.out)+1)%list.length];setOut(next);toast(next?kind(next).name+'와(과) 함께 걸어요':'동반 친구가 쉬러 갔어요');return next;},
  tick(dt){clock+=dt;syncMeshes();if(!entered)return;const moving=lx!==null&&Math.hypot(player.position.x-lx,player.position.z-lz)>.001;lx=player.position.x;lz=player.position.z;calmFor=moving?0:calmFor+dt;
   // An emote makes the companion hop for joy.
   if(typeof villagePlay==='object'&&villagePlay&&villagePlay.activeEmote&&villagePlay.activeEmote()!==null)joy=Math.max(joy,.01);if(joy>0){joy+=dt;if(joy>1.2)joy=0;}
   if(state.egg){const warm=warmNow();state.egg.p=Math.min(1,state.egg.p+dt*(warm?WARM_RATE:1)/HATCH);saveIn-=dt;if(state.egg.p>=1)hatch();else if(saveIn<=0){saveIn=5;save();}}
   syncMeshes();if(pet){const k=pet.userData.kind;follow(pet,dt,k.floats,1);if(k.id==='moth')for(const w of pet.children)if(w.userData.wing)w.rotation.z=w.userData.wing*Math.sin(clock*12)*.6;}
   if(egg){follow(egg,dt,false,pet?1.6:1);egg.rotation.z=Math.sin(clock*(warmNow()?9:3))*.15;}}
 };
}
const villageCompanions=createVillageCompanions();
