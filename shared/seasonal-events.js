// Real-calendar village events by Seoul date: decorations and sky shows appear only while an event is on.
const SEASONAL_EVENTS=[
 {id:'lights',name:'겨울 불빛 축제',ranges:[[12,1,12,26]]},
 {id:'newyear',name:'새해 불꽃놀이',ranges:[[12,31,12,31],[1,1,1,1]]},
 {id:'meteor',name:'유성우의 밤',ranges:[[1,3,1,4],[8,12,8,13],[12,13,12,14]]},
 // Chuseok moves with the lunar calendar, so its dates are listed per year.
 {id:'harvest-moon',name:'한가위 보름달',years:{2026:[9,24,9,26],2027:[9,14,9,16],2028:[10,2,10,4],2029:[9,21,9,23],2030:[9,11,9,13]}}
];
function seoulDate(ms=Date.now()){const d=new Date(ms+9*3600e3);return{year:d.getUTCFullYear(),month:d.getUTCMonth()+1,date:d.getUTCDate(),hour:d.getUTCHours()};}
function seasonalEventsAt(ms=Date.now()){const{year,month,date}=seoulDate(ms),key=month*100+date,inside=([m1,d1,m2,d2])=>key>=m1*100+d1&&key<=m2*100+d2;return SEASONAL_EVENTS.filter(e=>(e.ranges||[]).some(inside)||(e.years&&e.years[year]&&inside(e.years[year]))).map(e=>e.id);}
function createSeasonalEvents(){
 const params=typeof location==='object'&&location.search?new URLSearchParams(location.search):null,forced=params&&params.get('event');
 const LINES={
  lights:{winter:'불빛 축제 기간이라 오두막마다 전구를 달았어요.',aquarium:'불빛 축제라 수조 위에도 작은 전구를 걸었어요.',library:'불빛 축제 동안 책장 위에 전구를 달아 두었어요.'},
  newyear:{winter:'오늘 밤엔 새해 불꽃놀이가 있어요. 하늘을 올려다봐요!',aquarium:'새해 첫날이에요. 올해도 물고기들과 천천히 지내요.',library:'창밖으로 새해 불꽃이 보여요. 새해 첫 책은 뭘로 할까요?'},
  meteor:{winter:'유성우의 밤이에요. 밤하늘을 오래 보면 별똥별이 떨어져요.',aquarium:'바깥엔 유성우가 내린대요. 해파리도 별을 닮았죠.',library:'창가에서 기다리면 별똥별이 지나가요.'},
  'harvest-moon':{winter:'한가위 보름달이 떴어요. 소원 하나 빌어 볼까요?',aquarium:'한가위라 바깥 달이 아주 크대요.',library:'창밖 보름달이 책장까지 밝혀 줘요.'}
 };
 // Where each world can show things: winter has an open sky, the library a window, the aquarium only its walls.
 const LAYOUT={
  winter:{garlands:[[-9,-3.6,-1.2,-3.6,2.8],[1,-6,9,-6,3.1],[-5.5,9.2,5.5,9.2,2.6]],sky:{x:[-12,12],y:[4.5,7.5],z:[-13,-7]},moon:[9,7.5,-15,1.4]},
  aquarium:{garlands:[[-8,-9.5,8,-9.5,4.2],[-12,4,-6,9,3.4]],sky:null,moon:null},
  library:{garlands:[[-15.6,-14.4,-0.4,-14.4,4.6],[4.6,-17.3,15.6,-17.3,6.25]],sky:{x:[5.2,15],y:[2.6,5.8],z:[-17.47,-17.47]},moon:[12.6,5,-17.47,.55]}
 }[CURRENT_WORLD];
 let active=forced&&SEASONAL_EVENTS.some(e=>e.id===forced)?[forced]:seasonalEventsAt(),checkIn=0;
 const has=id=>active.includes(id),night=()=>skyWeather.state.daylight<.3;
 // Garland bulbs: one instanced draw call, warm alternating colours hung in a gentle sag.
 const bulbsPer=14,count=LAYOUT.garlands.length*bulbsPer,bulbs=new THREE.InstancedMesh(new THREE.SphereGeometry(.09,8,6),new THREE.MeshBasicMaterial({color:0xffffff}),count);bulbs.name='seasonal-lights';const m=new THREE.Matrix4(),col=new THREE.Color(),palette=[0xffc36b,0xff8f7a,0x9fe0c8,0xa9c3ff,0xfff0b8];
 LAYOUT.garlands.forEach(([x1,z1,x2,z2,y],g)=>{for(let i=0;i<bulbsPer;i++){const u=i/(bulbsPer-1);m.makeTranslation(x1+(x2-x1)*u,y-Math.sin(u*Math.PI)*.45,z1+(z2-z1)*u);bulbs.setMatrixAt(g*bulbsPer+i,m);bulbs.setColorAt(g*bulbsPer+i,col.set(palette[(g+i)%palette.length]));}});bulbs.instanceMatrix.needsUpdate=true;if(bulbs.instanceColor)bulbs.instanceColor.needsUpdate=true;bulbs.frustumCulled=false;scene.add(bulbs);
 // Fireworks: a small reusable particle pool, additive and fading; only after dark and only where there is sky to see.
 const SPARKS=mobile?90:160,sparkPos=new Float32Array(SPARKS*3),sparkCol=new Float32Array(SPARKS*3),sparkVel=new Float32Array(SPARKS*3),sparkLife=new Float32Array(SPARKS),sparkBase=new Float32Array(SPARKS*3),sparkGeo=new THREE.BufferGeometry();sparkGeo.setAttribute('position',new THREE.BufferAttribute(sparkPos,3));sparkGeo.setAttribute('color',new THREE.BufferAttribute(sparkCol,3));
 const fireworks=new THREE.Points(sparkGeo,new THREE.PointsMaterial({size:CURRENT_WORLD==='winter'?.6:.11,vertexColors:true,transparent:true,depthWrite:false,fog:false}));fireworks.name='seasonal-fireworks';fireworks.frustumCulled=false;scene.add(fireworks);let nextBurst=0,cursor=0;
 // Fireworks need stronger colours than the soft garland bulbs to read against the snow.
 const FIREWORK=[0xff5a5a,0xffc23d,0x4fc8ff,0x9b7bff,0x5fe08a];
 const span=(r,t)=>r[0]+(r[1]-r[0])*t;
 function burst(){if(!LAYOUT.sky)return;const s=LAYOUT.sky,cx=span(s.x,Math.random()),cy=span(s.y,.3+Math.random()*.7),cz=span(s.z,Math.random()),hue=col.set(FIREWORK[Math.floor(Math.random()*FIREWORK.length)]),per=Math.floor(SPARKS/4),speed=CURRENT_WORLD==='winter'?3.2:.9,flat=s.z[0]===s.z[1];for(let k=0;k<per;k++){const i=cursor++%SPARKS,a=Math.random()*Math.PI*2,e=Math.acos(Math.random()*2-1);sparkPos.set([cx,cy,cz],i*3);sparkVel.set([Math.sin(e)*Math.cos(a)*speed,Math.cos(e)*speed,flat?0:Math.sin(e)*Math.sin(a)*speed],i*3);sparkLife[i]=1;sparkBase.set([hue.r,hue.g,hue.b],i*3);}}
 // Meteors: four streaks crossing the same sky region.
 const METEORS=4,meteorPos=new Float32Array(METEORS*6),meteorGeo=new THREE.BufferGeometry();meteorGeo.setAttribute('position',new THREE.BufferAttribute(meteorPos,3));const meteors=new THREE.LineSegments(meteorGeo,new THREE.LineBasicMaterial({color:0xf4f2ff,transparent:true,opacity:.85,fog:false}));meteors.name='seasonal-meteors';meteors.frustumCulled=false;scene.add(meteors);const meteorT=new Float32Array(METEORS).map(()=>Math.random()*3);
 const moonMesh=LAYOUT.moon?new THREE.Mesh(new THREE.SphereGeometry(1,24,16),new THREE.MeshBasicMaterial({color:0xffe2a8,fog:false})):null;if(moonMesh){moonMesh.name='seasonal-harvest-moon';moonMesh.position.set(LAYOUT.moon[0],LAYOUT.moon[1],LAYOUT.moon[2]);moonMesh.scale.setScalar(LAYOUT.moon[3]);if(LAYOUT.sky&&LAYOUT.sky.z[0]===LAYOUT.sky.z[1])moonMesh.scale.z=.01;scene.add(moonMesh);}
 function label(){return active.map(id=>SEASONAL_EVENTS.find(e=>e.id===id).name).join(' · ');}
 function decorate(){bulbs.visible=has('lights');if(moonMesh)moonMesh.visible=has('harvest-moon')&&night();const badge=typeof document==='object'&&document.getElementById?document.getElementById('sky-weather-badge'):null;if(badge&&active.length){const base=badge.textContent.split(' · ✦')[0];badge.textContent=base+' · ✦ '+label();}}
 decorate();
 return{
  get active(){return active.slice();},label,has,
  residentLine(){const id=active[0];return id?LINES[id][CURRENT_WORLD]:'';},
  tick(dt){checkIn-=dt;if(checkIn<=0){checkIn=5;if(!forced)active=seasonalEventsAt();decorate();}
   const showFire=has('newyear')&&night()&&LAYOUT.sky,showMeteor=has('meteor')&&night()&&LAYOUT.sky;fireworks.visible=Boolean(showFire);meteors.visible=Boolean(showMeteor);
   if(showFire){nextBurst-=dt;if(nextBurst<=0){burst();nextBurst=.9+Math.random()*.8;}const g=CURRENT_WORLD==='winter'?1.2:.25;for(let i=0;i<SPARKS;i++){if(sparkLife[i]<=0){sparkCol[i*3]=sparkCol[i*3+1]=sparkCol[i*3+2]=0;sparkPos[i*3+1]=-99;continue;}sparkLife[i]-=dt*.4;const drag=1-Math.min(1,dt*1.5);for(let k=0;k<3;k++){sparkPos[i*3+k]+=sparkVel[i*3+k]*dt;sparkVel[i*3+k]*=drag;}sparkVel[i*3+1]-=g*dt;// Normal blending: keep the spark colour bright and simply retire it when its life ends.
   for(let k=0;k<3;k++)sparkCol[i*3+k]=sparkBase[i*3+k];}sparkGeo.attributes.position.needsUpdate=sparkGeo.attributes.color.needsUpdate=true;}
   if(showMeteor){const s=LAYOUT.sky,len=CURRENT_WORLD==='winter'?3:.6;for(let i=0;i<METEORS;i++){meteorT[i]-=dt;if(meteorT[i]<-1.2)meteorT[i]=1.5+Math.random()*4;const u=Math.max(0,Math.min(1,-meteorT[i]/1.2)),visible=meteorT[i]<0;const x=span(s.x,((i*.37+.2)%1)*.8+u*.3),y=span(s.y,1-u*.7),z=span(s.z,(i*.29)%1);meteorPos.set(visible?[x,y,z,x-len*.8,y+len*.45,z]:[0,-99,0,0,-99,0],i*6);}meteorGeo.attributes.position.needsUpdate=true;}}
 };
}
const seasonalEvents=createSeasonalEvents();
