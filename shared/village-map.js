// Village map: a round minimap in the top-right corner that follows you, and a full-screen map (tap the minimap or
// press M) that you can drag and zoom. The map is drawn from the space itself — walls, trees, buildings, roads and
// named places — with you, friends, folk, the resident and 여기! pings on top. In the wide winter village the parts
// you have not walked near yet stay under snow mist (remembered in this browser), lit beacons can be tapped to hop
// there, and tapping anywhere else walks you there.
function createVillageMap(){
 const WORLD=CURRENT_WORLD,D=typeof villageDistricts==='object'&&villageDistricts?villageDistricts:null,FOG=Boolean(D),FOG_KEY='village-map-fog:'+WORLD,CELL=4,REVEAL=11;
 const EXTENT={winter:typeof WORLD_LIMIT==='number'?WORLD_LIMIT:26,aquarium:21.5,library:20}[WORLD]||26;
 // Named spots: winter districts and landmarks, or the walk buttons' places elsewhere.
 const LABELS=[];
 if(D)for(const d of D.DISTRICTS)LABELS.push({x:d.x,z:d.id==='plaza'?-4:d.z,name:d.name,big:true,id:d.id});
 if(WORLD==='winter')for(const[name,x,z]of[['모닥불',-5,-1.5],['썰매 언덕',13,-12],['얼음 연못',8.6,10.5],['소원 나무',-1,-10]])LABELS.push({x,z,name});
 else{const NAMES={ocean:'바다 수조',reef:'산호 정원',jelly:'해파리 쉼터',books:'책의 숲',window:'달빛 창가',desk:'책갈피 책상'};if(typeof places==='object'&&places)for(const k in places)LABELS.push({x:places[k].x,z:places[k].z,name:NAMES[k]||k,big:true});}
 // Snow mist: one bit per 4 m cell, revealed around you as you walk.
 const N=Math.ceil(EXTENT*2/CELL)+1,seen=new Uint8Array(N*N);
 if(FOG)try{const raw=localStorage.getItem(FOG_KEY);if(raw&&raw.length===N*N)for(let i=0;i<raw.length;i++)seen[i]=raw.charCodeAt(i)===49?1:0;}catch{}
 let fogDirty=false,fogSave=0;const cellOf=v=>Math.max(0,Math.min(N-1,Math.floor((v+EXTENT)/CELL)));
 function reveal(x,z){if(!FOG)return 0;let n=0;const r=Math.ceil(REVEAL/CELL);const cx=cellOf(x),cz=cellOf(z);for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){const gx=cx+i,gz=cz+j;if(gx<0||gz<0||gx>=N||gz>=N)continue;const wx=-EXTENT+(gx+.5)*CELL,wz=-EXTENT+(gz+.5)*CELL;if(Math.hypot(wx-x,wz-z)<=REVEAL+CELL*.5&&!seen[gz*N+gx]){seen[gz*N+gx]=1;n++;}}if(n)fogDirty=true;return n;}
 const isSeen=(x,z)=>!FOG||seen[cellOf(z)*N+cellOf(x)]===1;
 function saveFog(){if(!FOG||!fogDirty)return;fogDirty=false;try{let s='';for(const v of seen)s+=v?'1':'0';localStorage.setItem(FOG_KEY,s);}catch{}}
 // The still parts are drawn once onto an offscreen canvas at a fixed scale, then copied for every view.
 const PX=WORLD==='winter'?8:14,SIZE=Math.round(EXTENT*2*PX),base=document.createElement('canvas');base.width=SIZE;base.height=SIZE;
 const toB=(x,z)=>[(x+EXTENT)*PX,(z+EXTENT)*PX];
 function drawBase(){const g=base.getContext('2d');if(!g||!g.fillRect)return;g.fillStyle=WORLD==='aquarium'?'#2f5f73':WORLD==='library'?'#7a5a4a':'#e9eef5';g.fillRect(0,0,SIZE,SIZE);
  g.fillStyle=WORLD==='aquarium'?'#cfe7ea':WORLD==='library'?'#e9d9c3':'#f7f8fb';g.beginPath();if(WORLD==='aquarium')g.arc(SIZE/2,SIZE/2,21*PX,0,Math.PI*2);else if(WORLD==='library')g.rect((EXTENT-19.5)*PX,(EXTENT-16.7)*PX,39*PX,33.4*PX);else g.rect(0,0,SIZE,SIZE);g.fill();
  if(D){g.strokeStyle='#d4dceb';g.lineCap='round';g.lineWidth=2.4*PX;for(const[x1,z1,x2,z2]of D.ROADS){g.beginPath();g.moveTo(...toB(x1,z1));g.lineTo(...toB(x2,z2));g.stroke();}
   const lake=D.DISTRICTS.find(d=>d.id==='lake');if(lake){g.fillStyle='#bfe0ea';g.beginPath();g.arc(...toB(lake.x,lake.z),9*PX,0,Math.PI*2);g.fill();}
   g.fillStyle='#dfe9f0';g.fillRect(...toB(11.3,-13),3.4*PX,20*PX);g.fillStyle='#cfe6ee';g.beginPath();g.arc(...toB(8.6,10.8),2.6*PX,0,Math.PI*2);g.fill();}
  for(const c of typeof colliders==='object'&&colliders?colliders:[]){if(!Number.isFinite(c.x)||!Number.isFinite(c.z))continue;const r=c.r||(c.w?Math.max(c.w,c.d||c.w)/2:.4),[x,y]=toB(c.x,c.z);
   if(WORLD==='winter'){g.fillStyle=r>=1.8?'#b08f78':r>=.45&&r<1.4?'#7fa39f':r<.3?'#8c8f9a':'#c2ab95';}else g.fillStyle=WORLD==='aquarium'?'#6aa6b8':'#b08f78';
   g.beginPath();if(r>=1.8||c.w){const w=c.w?c.w*PX:r*1.6*PX,h=c.d?c.d*PX:r*1.6*PX;g.fillRect(x-w/2,y-h/2,w,h);if(WORLD==='winter'){g.fillStyle='#8c6f60';g.fillRect(x-w/2,y-h/2,w,h*.38);}}
   else if(WORLD==='winter'&&r>=.45&&r<1.4){const t=Math.max(3,r*PX*1.5);g.moveTo(x,y-t);g.lineTo(x+t*.8,y+t*.7);g.lineTo(x-t*.8,y+t*.7);g.closePath();}else g.arc(x,y,Math.max(1.5,r*PX),0,Math.PI*2);g.fill();}}
 drawBase();
 // Shared painter for both views: view = {cx, cz, scale (px per metre), w, h}.
 const COLORS={me:'#e4a28e',friend:'#7fa3c9',folk:'#9a8f86',resident:'#8e9d83',ping:'#e2a13c'};
 function paint(g,view,full){const{cx,cz,scale,w,h}=view,sx=x=>w/2+(x-cx)*scale,sy=z=>h/2+(z-cz)*scale,k=scale/PX;
  g.clearRect(0,0,w,h);g.save();g.fillStyle='#c4cee0';g.fillRect(0,0,w,h);g.drawImage(base,(-EXTENT-cx)*scale+w/2,(-EXTENT-cz)*scale+h/2,SIZE*k,SIZE*k);
  if(FOG){g.fillStyle='rgba(196,206,224,.96)';const x0=Math.max(0,cellOf(cx-w/2/scale)),x1=Math.min(N-1,cellOf(cx+w/2/scale)),z0=Math.max(0,cellOf(cz-h/2/scale)),z1=Math.min(N-1,cellOf(cz+h/2/scale));for(let j=z0;j<=z1;j++)for(let i=x0;i<=x1;i++)if(!seen[j*N+i])g.fillRect(Math.floor(sx(-EXTENT+i*CELL)),Math.floor(sy(-EXTENT+j*CELL)),Math.ceil(CELL*scale)+1,Math.ceil(CELL*scale)+1);}
  const dot=(x,z,r,c)=>{g.fillStyle=c;g.beginPath();g.arc(sx(x),sy(z),r,0,Math.PI*2);g.fill();};
  if(D)for(const b of D.beacons){if(!isSeen(b.x,b.z))continue;const lit=D.state.lit.includes(b.id);g.fillStyle=lit?'#f2b84b':'#9aa6b8';g.save();g.translate(sx(b.x),sy(b.z));g.rotate(Math.PI/4);const s=full?7:4;g.fillRect(-s/2,-s/2,s,s);g.restore();}
  if(typeof villageFolk==='object'&&villageFolk)for(const f of villageFolk.visible())dot(f.pos.x,f.pos.z,full?3.5:2.2,COLORS.folk);
  if(typeof residentGuide==='object'&&residentGuide&&residentGuide.here)dot(residentGuide.here.x,residentGuide.here.z,full?4.5:3,COLORS.resident);
  if(typeof villageTogether==='object'&&villageTogether)for(const p of villageTogether.pings)dot(p.x,p.z,full?6:4,COLORS.ping);
  if(typeof remotePlayers==='object'&&remotePlayers)for(const peer of remotePlayers.values()){const r=peer.actor&&peer.actor.root;if(!r)continue;dot(r.position.x,r.position.z,full?5:3.4,COLORS.friend);if(full&&peer.data&&peer.data.n){g.fillStyle='#3e4660';g.font='700 11px "Winter Jua",sans-serif';g.textAlign='center';g.fillText(peer.data.n,sx(r.position.x),sy(r.position.z)-9);}}
  if(full){g.textAlign='center';for(const l of LABELS){if(!isSeen(l.x,l.z))continue;g.font=(l.big?'700 15px':'700 11px')+' "Winter Jua",sans-serif';g.lineWidth=3;g.strokeStyle='rgba(255,255,255,.85)';g.strokeText(l.name,sx(l.x),sy(l.z));g.fillStyle=l.big?'#3e4660':'#6a5f5a';g.fillText(l.name,sx(l.x),sy(l.z));}}
  // You: an arrow pointing where you face.
  const me=player.position,a=player.rotation.y;g.save();g.translate(sx(me.x),sy(me.z));g.rotate(-a+Math.PI);g.fillStyle=COLORS.me;g.strokeStyle='#fff';g.lineWidth=2;const s=full?9:7;g.beginPath();g.moveTo(0,-s);g.lineTo(s*.7,s*.7);g.lineTo(0,s*.35);g.lineTo(-s*.7,s*.7);g.closePath();g.fill();g.stroke();g.restore();g.restore();}
 // Minimap.
 const style=document.createElement('style');style.textContent='.village-minimap{position:fixed;right:16px;top:calc(max(22px,env(safe-area-inset-top)) + 54px);z-index:3;width:132px;height:132px;padding:0;border:3px solid rgba(255,247,232,.92);border-radius:50%;overflow:hidden;background:#e9eef5;box-shadow:0 4px 16px rgba(40,40,70,.22);cursor:pointer}.village-minimap[hidden],.village-map[hidden]{display:none}.village-minimap canvas{width:100%;height:100%;display:block}.village-minimap b{position:absolute;left:50%;bottom:6px;transform:translateX(-50%);white-space:nowrap;max-width:86%;overflow:hidden;text-overflow:ellipsis;font:700 9px "Winter Jua",sans-serif;color:#5f5050;background:rgba(255,247,232,.85);padding:2px 6px;border-radius:999px;pointer-events:none}.sky-weather-badge{top:calc(max(22px,env(safe-area-inset-top)) + 192px)!important;left:auto!important;right:16px!important;transform:none!important}'+
  '.village-map{position:fixed;inset:0;z-index:14;background:#e9eef5;touch-action:none}.village-map canvas{width:100%;height:100%;display:block}.village-map-bar{position:absolute;left:12px;right:12px;top:calc(env(safe-area-inset-top,0px) + 12px);display:flex;align-items:center;justify-content:space-between;gap:8px;pointer-events:none}.village-map-bar h2{margin:0;padding:8px 14px;border-radius:999px;background:rgba(255,247,232,.92);color:#5f5050;font:700 15px "Winter Jua",sans-serif}.village-map-bar div{display:flex;gap:6px;pointer-events:auto}.village-map button{min-width:44px;min-height:44px;border:0;border-radius:14px;background:rgba(255,247,232,.95);color:#5f5050;font:700 18px "Winter Jua",sans-serif;cursor:pointer;box-shadow:0 2px 10px rgba(40,40,70,.15)}.village-map-note{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 16px);transform:translateX(-50%);margin:0;padding:8px 14px;border-radius:999px;background:rgba(53,59,85,.7);color:#fff8ec;font:700 12px "Winter Jua",sans-serif;white-space:nowrap}'+
  '@media(max-width:600px){.village-minimap{width:104px;height:104px;top:calc(max(19px,env(safe-area-inset-top)) + 54px)}.sky-weather-badge{top:calc(max(19px,env(safe-area-inset-top)) + 164px)!important}.district-banner{top:calc(env(safe-area-inset-top,0px) + 196px)!important}.beacon-hop{top:calc(env(safe-area-inset-top,0px) + 240px)!important}.beacon-list{top:calc(env(safe-area-inset-top,0px) + 288px)!important}}';(document.head||document.body).append(style);
 const mini=document.createElement('button');mini.className='village-minimap';mini.setAttribute('aria-label','지도 크게 보기 (M)');mini.title='지도 (M)';mini.hidden=true;const miniCanvas=document.createElement('canvas');miniCanvas.width=264;miniCanvas.height=264;const miniName=document.createElement('b');mini.append(miniCanvas,miniName);document.body.append(mini);
 // Full map.
 const sheet=document.createElement('section');sheet.className='village-map';sheet.hidden=true;sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-label','마을 지도');
 const canvas=document.createElement('canvas'),bar=document.createElement('div'),title=document.createElement('h2'),tools=document.createElement('div'),zoomIn=document.createElement('button'),zoomOut=document.createElement('button'),center=document.createElement('button'),closeButton=document.createElement('button'),note=document.createElement('p');
 bar.className='village-map-bar';title.textContent={winter:'겨울 마을 지도',aquarium:'수족관 지도',library:'도서관 지도'}[WORLD]||'지도';zoomIn.textContent='+';zoomIn.setAttribute('aria-label','확대');zoomOut.textContent='−';zoomOut.setAttribute('aria-label','축소');center.textContent='◎';center.setAttribute('aria-label','내 위치로');closeButton.textContent='×';closeButton.setAttribute('aria-label','지도 닫기 (M)');note.className='village-map-note';note.textContent=D?'밝힌 등불을 누르면 바로 가요 · 다른 곳을 누르면 걸어가요':'가고 싶은 곳을 누르면 걸어가요';
 tools.append(zoomOut,zoomIn,center,closeButton);bar.append(title,tools);sheet.append(canvas,bar,note);document.body.append(sheet);
 let view={cx:0,cz:0,scale:6,w:1,h:1},drag=null,pinch=null,miniIn=0;const pointers=new Map();
 const MIN_SCALE=()=>Math.min(view.w,view.h)/(EXTENT*2.2),MAX_SCALE=28;
 function clampView(){view.scale=Math.max(MIN_SCALE(),Math.min(MAX_SCALE,view.scale));view.cx=Math.max(-EXTENT,Math.min(EXTENT,view.cx));view.cz=Math.max(-EXTENT,Math.min(EXTENT,view.cz));}
 function size(){const r=devicePixelRatio>1?Math.min(2,devicePixelRatio):1;view.w=innerWidth;view.h=innerHeight;canvas.width=Math.round(innerWidth*r);canvas.height=Math.round(innerHeight*r);const g=canvas.getContext('2d');if(g&&g.setTransform)g.setTransform(r,0,0,r,0,0);}
 function draw(){if(sheet.hidden)return;const g=canvas.getContext('2d');if(g&&g.drawImage)paint(g,view,true);}
 function open(){if(!entered||(typeof photoMode==='object'&&photoMode&&photoMode.on))return false;size();view.cx=player.position.x;view.cz=player.position.z;view.scale=Math.max(MIN_SCALE(),Math.min(view.w,view.h)/(WORLD==='winter'?60:34));clampView();sheet.hidden=false;draw();closeButton.focus();return true;}
 function close(){sheet.hidden=true;pointers.clear();drag=null;pinch=null;}
 const toWorld=(px,py)=>({x:view.cx+(px-view.w/2)/view.scale,z:view.cz+(py-view.h/2)/view.scale});
 // A tap: a lit beacon nearby hops there; anywhere seen and walkable walks there.
 function tap(px,py){const p=toWorld(px,py);if(D){const b=D.beacons.find(b=>D.state.lit.includes(b.id)&&Math.hypot(b.x-p.x,b.z-p.z)*view.scale<22);if(b){close();D.travel(b.id);return'hop';}}
  if(!isSeen(p.x,p.z)){toast('아직 가 보지 않은 곳이에요');return'fog';}if(typeof navigate==='function'){close();navigate(p.x,p.z);return'walk';}return null;}
 zoomIn.addEventListener('click',()=>{view.scale*=1.4;clampView();draw();});zoomOut.addEventListener('click',()=>{view.scale/=1.4;clampView();draw();});center.addEventListener('click',()=>{view.cx=player.position.x;view.cz=player.position.z;draw();});closeButton.addEventListener('click',close);
 canvas.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1)drag={x:e.clientX,y:e.clientY,cx:view.cx,cz:view.cz,moved:false};else if(pointers.size===2){const[a,b]=[...pointers.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),scale:view.scale};drag=null;}});
 canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pinch&&pointers.size===2){const[a,b]=[...pointers.values()];view.scale=pinch.scale*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,pinch.d);clampView();draw();}else if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>6)drag.moved=true;view.cx=drag.cx-dx/view.scale;view.cz=drag.cz-dy/view.scale;clampView();draw();}});
 for(const k of['pointerup','pointercancel'])canvas.addEventListener(k,e=>{const was=drag;pointers.delete(e.pointerId);if(k==='pointerup'&&was&&!was.moved&&!pinch)tap(e.clientX,e.clientY);if(pointers.size<2)pinch=null;if(!pointers.size)drag=null;});
 canvas.addEventListener('wheel',e=>{e.preventDefault();view.scale*=e.deltaY<0?1.15:1/1.15;clampView();draw();},{passive:false});
 mini.addEventListener('click',open);
 addEventListener('keydown',e=>{if(e.repeat||e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;if(e.key==='Escape'&&!sheet.hidden){close();return;}if(e.key==='m'||e.key==='M'||e.key==='ㅡ'){if(!sheet.hidden){e.preventDefault();close();}else if(!(typeof helpOpen==='function'&&helpOpen())&&open())e.preventDefault();}});
 addEventListener('resize',()=>{if(!sheet.hidden){size();clampView();draw();}});
 return{EXTENT,LABELS,open,close,tap,isOpen:()=>!sheet.hidden,mini,sheet,reveal,isSeen,toWorld,get view(){return view;},seenCount:()=>seen.reduce((s,v)=>s+v,0),
  tick(dt){mini.hidden=!entered||(typeof photoMode==='object'&&photoMode&&photoMode.on);if(!entered)return;const p=player.position;reveal(p.x,p.z);fogSave-=dt;if(fogSave<=0){fogSave=5;saveFog();}
   if(!sheet.hidden){draw();return;}miniIn-=dt;if(miniIn>0||mini.hidden)return;miniIn=.12;const g=miniCanvas.getContext('2d');if(g&&g.drawImage)paint(g,{cx:p.x,cz:p.z,scale:WORLD==='winter'?4.4:6.5,w:264,h:264},false);
   const here=D&&D.current?D.current.name:'';if(miniName.textContent!==here)miniName.textContent=here;miniName.hidden=!here;}};
}
const villageMap=createVillageMap();
