// The wider village: the plaza plus five named districts (a forest trail, a frozen lake, a lantern market street, a
// lookout hill and a cottage lane), joined by trodden snow roads. Each district has a lantern beacon; touching one
// lights it, and lit beacons let you hop between them. Everything static is built here, before the world is baked,
// so the whole village still draws in a handful of batches.
function districtLayout(){return{
 districts:[
  {id:'plaza',name:'눈송이 광장',x:0,z:2,r:21,beacon:{x:5.6,z:.4}},
  {id:'forest',name:'눈숲 오솔길',x:-37,z:2,r:12,beacon:{x:-31,z:4.5}},
  {id:'lake',name:'얼음 호수',x:2,z:-38,r:12,beacon:{x:-6.5,z:-31}},
  {id:'market',name:'등불 시장 거리',x:37,z:6,r:11,beacon:{x:29,z:9}},
  {id:'lookout',name:'전망 언덕',x:36,z:-36,r:10,beacon:{x:31,z:-31}},
  {id:'cottages',name:'오두막 동네',x:0,z:37,r:12,beacon:{x:3,z:28}}],
 // Road centre lines as [x1,z1,x2,z2]; walking is free everywhere, the roads just show the way and keep trees off it.
 roads:[[-18,7,-29,3],[1,-17,1,-28],[17,9,29,7],[37,-2,36,-28],[1,19,1,29],[-31,-6,-9,-31],[11,-38,27,-36]]};}
function nearDistrictRoad(x,z,pad){const L=districtLayout();for(const[x1,z1,x2,z2]of L.roads){const dx=x2-x1,dz=z2-z1,t=Math.max(0,Math.min(1,((x-x1)*dx+(z-z1)*dz)/(dx*dx+dz*dz)));if(Math.hypot(x-(x1+dx*t),z-(z1+dz*t))<pad)return true;}
 for(const d of L.districts)if(d.id!=='plaza'&&Math.hypot(x-d.x,z-d.z)<d.r+1)return true;return false;}
const villageDistricts=(()=>{
 const{districts:DISTRICTS,roads:ROADS}=districtLayout(),KEY='village-districts-v1',TOUCH=2.6;
 const byId=id=>DISTRICTS.find(d=>d.id===id);
 // Trodden snow: short flat strips that follow the ground, slightly bluer than fresh snow.
 for(const[x1,z1,x2,z2]of ROADS){const len=Math.hypot(x2-x1,z2-z1),steps=Math.ceil(len/1.1),a=Math.atan2(x2-x1,z2-z1);for(let i=0;i<=steps;i++){const t=i/steps,x=x1+(x2-x1)*t,z=z1+(z2-z1)*t,y=groundHeight(x,z);const strip=box(world,i%2?0xdfe6ef:0xdbe3ee,x,y+.025,z,2.3,.03,1.25);strip.rotation.y=a;}}
 // A loose wild forest between districts and a deep wall of pines at the edge of the village.
 const free=(x,z,pad=2.6)=>Math.abs(x)<WORLD_LIMIT-1&&Math.abs(z)<WORLD_LIMIT-1&&!nearDistrictRoad(x,z,pad)&&Math.hypot(x,z-2)>24&&!colliders.some(c=>(x-c.x)**2+(z-c.z)**2<(c.r+1.4)**2);
 for(let i=0,placed=0;i<400&&placed<70;i++){const a=rand()*TAU,r=25+rand()*24,x=Math.cos(a)*r,z=Math.sin(a)*r;if(!free(x,z))continue;pine(x,z,.75+rand()*.7);placed++;}
 for(let i=0;i<120;i++){const a=i/120*TAU+rand()*.03,r=WORLD_LIMIT+1+rand()*9,x=Math.cos(a)*r,z=Math.sin(a)*r;pine(x,z,.9+rand()*.8);if(colliders.length&&colliders[colliders.length-1].x===x)colliders.pop();}
 const stall=(x,z,rot,colors)=>{const p=new THREE.Group();p.position.set(x,groundHeight(x,z),z);p.rotation.y=rot;world.add(p);box(p,0x9b7c67,0,.5,0,2.2,1,1);box(p,0xc9ae8f,0,1.02,0,2.3,.06,1.08);for(const sx of[-1,1])for(const sz of[-.45,.45])box(p,0x7e6a5f,sx*1.05,1.2,sz,.09,2.4,.09);for(let k=0;k<5;k++){const s=box(p,colors[k%2],-.88+k*.44,2.45,.05,.44,.07,1.4);s.rotation.x=-.18;}for(let k=0;k<4;k++)sphere(p,colors[2+(k%2)],-.7+k*.46,1.17,.05,.15);block(x,z,1.35);shadow(world,x,z,1.5,.1);};
 // Plaza: a beacon only; the rest of the plaza stays as it was.
 // Forest trail: a winding trail through dense pines, a frozen creek with a little bridge, shrubs and stumps.
 const F=byId('forest');
 const trail=t=>({x:F.x+12-t*24,z:F.z+Math.sin(t*TAU)*2.4});for(let i=0;i<=22;i++){const a=trail(i/22),b=trail(Math.min(1,(i+1)/22)),y=groundHeight(a.x,a.z);const s=box(world,0xdde4ee,a.x,y+.026,a.z,1.4,.03,1.3);s.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);}
 for(let i=0,placed=0;i<300&&placed<34;i++){const a=rand()*TAU,r=3+rand()*9,x=F.x+Math.cos(a)*r,z=F.z+Math.sin(a)*r,trailZ=F.z+Math.sin((F.x+12-x)/24*TAU)*2.4;if(Math.abs(z-trailZ)<2.2||Math.abs(x-(F.x-3))<1.6||colliders.some(c=>(x-c.x)**2+(z-c.z)**2<(c.r+1)**2))continue;pine(x,z,.7+rand()*.6);placed++;}
 const creek=box(world,0xbfdbe6,F.x-3,groundHeight(F.x-3,F.z)+.03,F.z,1.5,.03,24);creek.name='forest-creek';
 {const bx=F.x-3,bz=F.z,by=groundHeight(bx,bz);for(let k=0;k<7;k++)box(world,k%2?0xa2836b:0x957760,bx-1.2+k*.4,by+.18,bz,.36,.08,2.1);for(const sz of[-1,1]){box(world,0x7e6a5f,bx,by+.5,bz+sz*1,2.7,.06,.08);for(const sx of[-1,1])box(world,0x7e6a5f,bx+sx*1.25,by+.3,bz+sz*1,.08,.6,.08);}}
 for(const[dx,dz]of[[5,-3.5],[-8,4],[2,5.5],[-6,-4.5]]){const x=F.x+dx,z=F.z+dz,y=groundHeight(x,z);sphere(world,0x87a594,x,y+.35,z,.55,.42,.5);block(x,z,.5);}
 for(const[dx,dz]of[[7,3.6],[-10,-2.6]]){const x=F.x+dx,z=F.z+dz,y=groundHeight(x,z);mesh(geom.cyl,0x8b6f5a,world,x,y+.25,z,.42,.5,.42);mesh(geom.cyl,0xf1f2f0,world,x,y+.53,z,.44,.07,.44);block(x,z,.45);}
 {const p=new THREE.Group();p.position.set(F.x+4,groundHeight(F.x+4,F.z+3.2),F.z+3.2);world.add(p);box(p,0x9a7b65,0,.46,0,1.8,.15,.44);for(const sx of[-.65,.65])box(p,0x7e6a5f,sx,.22,0,.12,.44,.32);}
 // Frozen lake: a wide sheet of ice with a snowy rim, skating loops, a dock and two little ice-fishing huts.
 const K=byId('lake');
 {const y=groundHeight(K.x,K.z);const ice=mesh(geom.disc,0xbfe0ea,world,K.x,y+.03,K.z,9);ice.rotation.x=-Math.PI/2;ice.name='lake-ice';const shine=mesh(geom.disc,mat(0xe8f6fb,true,.35),world,K.x-2,y+.035,K.z-2,4.2);shine.rotation.x=-Math.PI/2;
  const rim=mesh(new THREE.TorusGeometry(9.2,.45,6,48),0xf3f5f6,world,K.x,y+.05,K.z);rim.rotation.x=-Math.PI/2;rim.scale.z=.35;
  for(const[r,ox,oz]of[[3.2,-2,1],[2.1,2.6,-1.5],[1.4,-1,-3.4]]){const loop=mesh(new THREE.TorusGeometry(r,.035,4,40),mat(0xffffff,true,.55),world,K.x+ox,y+.045,K.z+oz);loop.rotation.x=-Math.PI/2;}
  for(let k=0;k<7;k++)box(world,k%2?0xa2836b:0x957760,K.x+6.5+k*.01,y+.2,K.z+6.2-k*.42,1.6,.08,.36);for(const sz of[0,2.6])for(const sx of[-.75,.75])box(world,0x7e6a5f,K.x+6.5+sx,y+.1,K.z+3.6+sz,.1,.6,.1);
  for(const[ox,oz,c]of[[-5,-4,0xd98c7a],[4,-5.5,0x8fb3c9]]){const x=K.x+ox,z=K.z+oz,hy=y;box(world,c,x,hy+.75,z,1.6,1.5,1.4);const roof=mesh(geom.cone,0xf1f2f4,world,x,hy+1.85,z,1.25,.8,1.25);roof.rotation.y=Math.PI/4;box(world,0x6e5b59,x,hy+.55,z+.71,.5,1.05,.04);block(x,z,1.05);}
  for(const[ox,oz,rot]of[[-9.6,3,Math.PI/2],[1,10.4,0]]){const p=new THREE.Group();const x=K.x+ox,z=K.z+oz;p.position.set(x,groundHeight(x,z),z);p.rotation.y=rot;world.add(p);box(p,0x9a7b65,0,.46,0,1.8,.15,.44);for(const sx of[-.65,.65])box(p,0x7e6a5f,sx,.22,0,.12,.44,.32);}}
 // Lantern market street: two rows of striped stalls, a frozen fountain and strings of warm lanterns overhead.
 const M=byId('market'),STRIPES=[[0xe4a28e,0xf6eee3,0xd9a14f,0xb5d0a4],[0x97b5c5,0xf6eee3,0xe6c27a,0xd9555f],[0xb8a7cd,0xf6eee3,0x9fc7b0,0xe4a28e]];
 for(let k=0;k<3;k++){stall(M.x-5+k*5,M.z-4.4,0,STRIPES[k]);stall(M.x-5+k*5,M.z+4.4,Math.PI,STRIPES[(k+1)%3]);}
 {const y=groundHeight(M.x,M.z);mesh(geom.cyl,0xb0afb8,world,M.x,y+.3,M.z,1.35,.6,1.35);mesh(geom.cyl,0xd6eef4,world,M.x,y+.62,M.z,1.15,.06,1.15);mesh(geom.cyl,0xc9e6ef,world,M.x,y+1.1,M.z,.22,1.1,.22);sphere(world,mat(0xe9f7fb,true),M.x,y+1.75,M.z,.32);block(M.x,M.z,1.4);
  for(const side of[-1,1]){const posts=[-8,8].map(dx=>({x:M.x+dx,z:M.z+side*2.2}));for(const p of posts){const py=groundHeight(p.x,p.z);mesh(geom.cyl,0x677079,world,p.x,py+1.5,p.z,.06,3,.06);block(p.x,p.z,.2);}
   for(let k=0;k<=16;k++){const t=k/16,x=M.x-8+16*t,z=M.z+side*2.2,yy=groundHeight(x,z)+2.9-Math.sin(t*Math.PI)*.55;sphere(world,mat([0xffd49a,0xffb8a0,0xfff0b8][k%3],true),x,yy,z,.12);}}}
 for(const[dx,dz]of[[-8,-1],[8.4,1.2],[-7.6,2]]){const x=M.x+dx,z=M.z+dz,y=groundHeight(x,z);box(world,0x9b7c67,x,y+.3,z,.6,.6,.6);mesh(geom.cyl,0x8b6f5a,world,x+.75,y+.35,z,.3,.7,.3);block(x+.35,z,.75);}
 // Lookout hill: a low wooden railing around the top, a telescope towards the mountains, a bench and a flag.
 const O=byId('lookout');
 {const y=groundHeight(O.x,O.z);for(let k=0;k<14;k++){const a=k/14*TAU;if(k===10||k===11)continue;const x=O.x+Math.cos(a)*4.2,z=O.z+Math.sin(a)*4.2,py=groundHeight(x,z);mesh(geom.cyl,0x8b6f5a,world,x,py+.45,z,.07,.9,.07);const nx=O.x+Math.cos(a+TAU/14)*4.2,nz=O.z+Math.sin(a+TAU/14)*4.2;if(k===9)continue;const rail=box(world,0xa2836b,(x+nx)/2,(py+groundHeight(nx,nz))/2+.82,(z+nz)/2,.08,.08,Math.hypot(nx-x,nz-z));rail.rotation.y=Math.atan2(nx-x,nz-z);}
  const tx=O.x+1.6,tz=O.z-1.6,ty=groundHeight(tx,tz);for(let k=0;k<3;k++){const leg=mesh(geom.cyl,0x5f6668,world,tx+Math.cos(k*2.1)*.25,ty+.5,tz+Math.sin(k*2.1)*.25,.035,1,.035);leg.rotation.z=Math.cos(k*2.1)*.25;leg.rotation.x=-Math.sin(k*2.1)*.25;}const scope=mesh(geom.cyl,0xc9a86a,world,tx,ty+1.08,tz,.11,.9,.11);scope.rotation.z=1.2;scope.rotation.y=-.7;block(tx,tz,.5);
  mesh(geom.cyl,0x9b8775,world,O.x-1.8,y+1.6,O.z-1.4,.05,3.2,.05);const flag=box(world,0xe4a28e,O.x-1.4,groundHeight(O.x-1.8,O.z-1.4)+2.85,O.z-1.4,.8,.5,.03);flag.rotation.y=.3;block(O.x-1.8,O.z-1.4,.25);
  const p=new THREE.Group();p.position.set(O.x-.6,groundHeight(O.x-.6,O.z+2),O.z+2);p.rotation.y=Math.PI;world.add(p);box(p,0x9a7b65,0,.46,0,1.8,.15,.44);for(const sx of[-.65,.65])box(p,0x7e6a5f,sx,.22,0,.12,.44,.32);}
 // Cottage lane: a ring of small cabins with picket fences, a snowy well and a lamp at the turn.
 const C=byId('cottages');
 for(const[dx,dz,s,rot]of[[-8,-1,.78,.5],[8,-1.5,.82,-.45],[-9,8,.72,.85],[9,8,.75,-.9],[0,10.5,.8,Math.PI]])cabin(C.x+dx,C.z+dz,s,rot);
 for(const side of[-1,1])for(let k=0;k<7;k++){const x=C.x+side*4.2,z=C.z-2+k*1.3,y=groundHeight(x,z);box(world,0xece6dc,x,y+.38,z,.09,.76,.09);if(k<6)box(world,0xe1d9cc,x,y+.52,z+.65,.05,.08,1.3);}
 {const x=C.x+1.8,z=C.z+3.4,y=groundHeight(x,z);mesh(geom.cyl,0xa4a5b0,world,x,y+.4,z,.75,.8,.75);mesh(geom.cyl,0x5b6f7c,world,x,y+.81,z,.6,.02,.6);for(const sx of[-.6,.6])box(world,0x7e6a5f,x+sx,y+1.25,z,.08,1.1,.08);const roof=mesh(geom.cone,0xa98a70,world,x,y+2.05,z,1,.6,1);roof.rotation.y=Math.PI/4;block(x,z,.85);}
 lamp(C.x-3,C.z+4);lamp(M.x-9.5,M.z+6.5);lamp(K.x+8.5,K.z+9);lamp(F.x+10,F.z-2.6);
 // Beacons: a stone foot, a post and a crystal that starts cool and glows warm once touched.
 const beacons=DISTRICTS.map(d=>{const{x,z}=d.beacon,y=groundHeight(x,z);mesh(geom.cyl,0xa4a5b0,world,x,y+.18,z,.42,.36,.42);mesh(geom.cyl,0x677079,world,x,y+.95,z,.07,1.5,.07);block(x,z,.45);
  const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.26,0),new THREE.MeshBasicMaterial({color:0x9aa6b8}));crystal.position.set(x,y+1.95,z);crystal.scale.y=1.4;crystal.name='beacon-'+d.id;scene.add(crystal);
  const glow=mesh(geom.disc,mat(0xffd98a,true,.18),scene,x,y+.04,z,1.3);glow.rotation.x=-Math.PI/2;glow.visible=false;return{id:d.id,x,z,crystal,glow};});
 // Progress (districts visited, beacons lit) stays in this browser.
 let state=(()=>{try{const s=JSON.parse(localStorage.getItem(KEY)||'null')||{};const ok=a=>Array.isArray(a)?a.filter(id=>byId(id)):[];return{seen:ok(s.seen),lit:ok(s.lit)};}catch{return{seen:[],lit:[]};}})();
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
 function paint(){for(const b of beacons){const on=state.lit.includes(b.id);b.crystal.material.color.setHex(on?0xffd98a:0x9aa6b8);b.glow.visible=on;}}paint();
 const banner=document.createElement('div');banner.className='district-banner';banner.setAttribute('role','status');banner.setAttribute('aria-live','polite');banner.hidden=true;document.body.append(banner);
 const style=document.createElement('style');style.textContent='.district-banner{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 132px);transform:translateX(-50%);z-index:5;padding:9px 20px 10px;border-radius:999px;background:rgba(53,59,85,.62);backdrop-filter:blur(10px);color:#fff8ec;font:700 15px/1.2 "Winter Jua",sans-serif;letter-spacing:.5px;text-align:center;pointer-events:none;animation:district-in .5s ease-out}.district-banner small{display:block;font-size:10px;opacity:.75;letter-spacing:2px;margin-bottom:3px}@keyframes district-in{from{opacity:0;transform:translate(-50%,-8px)}}@media(prefers-reduced-motion:reduce){.district-banner{animation:none}}';(document.head||document.body).append(style);
 let current=null,bannerLeft=0;
 // The district you stand in: the nearest centre whose radius you are inside (the plaza last, since it is the widest).
 function districtAt(x,z){let best=null,bd=Infinity;for(const d of DISTRICTS){const dist=Math.hypot(x-d.x,z-d.z);if(dist<d.r&&dist/d.r<bd){best=d;bd=dist/d.r;}}return best;}
 function show(d,first){const s=document.createElement('small'),n=document.createElement('span');s.textContent=first?'새로운 곳':'지금 있는 곳';n.textContent=d.name;banner.replaceChildren(s,n);banner.hidden=false;bannerLeft=2.6;}
 function light(id){if(state.lit.includes(id))return false;state.lit.push(id);save();paint();toast(byId(id).name+' 등불을 밝혔어요 · 밝힌 등불끼리 오갈 수 있어요');if(typeof villageJournal==='object'&&villageJournal&&villageJournal.note)villageJournal.note('first-beacon');return true;}
 // Hop to a lit beacon: you arrive just beside it, facing the district.
 function travel(id){const b=beacons.find(x=>x.id===id),d=byId(id);if(!b||!state.lit.includes(id)||!entered)return false;const a=Math.atan2(d.x-b.x,d.z-b.z),x=b.x+Math.sin(a)*1.6,z=b.z+Math.cos(a)*1.6;player.position.set(x,groundHeight(x,z),z);player.rotation.y=a;if(typeof path!=='undefined'&&Array.isArray(path))path.length=0;if(typeof publishState==='function')publishState(true);toast(d.name+'(으)로 왔어요');return true;}
 const hop=document.createElement('button');hop.className='beacon-hop';hop.textContent='등불로 이동';hop.hidden=true;const list=document.createElement('div');list.className='beacon-list';list.hidden=true;list.setAttribute('role','menu');list.setAttribute('aria-label','밝힌 등불로 이동');document.body.append(hop,list);
 style.textContent+='.beacon-hop{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 178px);transform:translateX(-50%);z-index:5;min-height:40px;padding:8px 16px;border:0;border-radius:999px;background:#f1dfbf;color:#6a5350;font:700 13px "Winter Jua",sans-serif;box-shadow:0 3px 12px rgba(40,40,70,.2);cursor:pointer}.beacon-hop[hidden],.beacon-list[hidden]{display:none}.beacon-list{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 226px);transform:translateX(-50%);z-index:6;display:grid;gap:6px;padding:10px;border-radius:18px;background:#fff3e3;box-shadow:0 6px 22px rgba(40,40,70,.25);min-width:200px}.beacon-list button{min-height:42px;border:0;border-radius:12px;background:#efe1cb;color:#6a5350;font:700 13px "Winter Jua",sans-serif;cursor:pointer}';
 function openList(){const here=current&&current.id;list.replaceChildren(...state.lit.filter(id=>id!==here).map(id=>{const b=document.createElement('button');b.setAttribute('role','menuitem');b.textContent=byId(id).name;b.addEventListener('click',()=>{list.hidden=true;travel(id);});return b;}));list.hidden=!list.children.length;}
 hop.addEventListener('click',()=>{if(list.hidden)openList();else list.hidden=true;});
 return{DISTRICTS,ROADS,beacons,districtAt,travel,light,hop,list,openList,get state(){return state;},get current(){return current;},banner,
  litBeacons:()=>DISTRICTS.filter(d=>state.lit.includes(d.id)),
  tick(dt){if(bannerLeft>0){bannerLeft-=dt;if(bannerLeft<=0)banner.hidden=true;}const t=performance.now()/1000;for(const b of beacons){b.crystal.rotation.y=t*.8;b.crystal.position.y=groundHeight(b.x,b.z)+1.95+Math.sin(t*1.6+b.x)*.06;}
   if(!entered)return;const p=player.position,d=districtAt(p.x,p.z);
   if(d&&d!==current){const first=!state.seen.includes(d.id);if(first){state.seen.push(d.id);save();}if(current)show(d,first);}if(d)current=d;
   let at=null;for(const b of beacons)if(Math.hypot(p.x-b.x,p.z-b.z)<TOUCH){light(b.id);at=b;}hop.hidden=!(at&&state.lit.length>1);if(hop.hidden)list.hidden=true;}};
})();
