// Ice fishing at a small frozen pond: cast, wait quietly, reel when the float dips. A fish that slips away just comes back later.
function createIceFishing(){
 const fishingX=2.75,POND={x:fishingX+.12,z:2.65,width:3.4,depth:2.42},APPROACH={x:fishingX,z:POND.z+2.05};
 const SEATS=[-.95,.95].map((offset,index)=>({index,x:fishingX+offset,z:POND.z+1.1,yaw:Math.PI,
  hole:{x:fishingX+offset,z:POND.z-.28}}));
 // Original pond creatures; which ones appear depends on the shared Seoul-time sky and weather.
 const FISH=[
  {id:'smelt',name:'빙어',size:[9,14],weight:5,when:()=>true},
  {id:'minnow',name:'버들치',size:[6,10],weight:3,when:s=>s.daylight>.5},
  {id:'trout',name:'송어',size:[25,45],weight:3,when:s=>s.phase==='day'||s.phase==='dawn'},
  {id:'cherry-salmon',name:'산천어',size:[20,35],weight:2,when:s=>s.kind!=='clear'},
  {id:'lenok',name:'열목어',size:[30,60],weight:1.2,when:s=>s.phase==='dawn'||s.kind==='fog'},
  {id:'bullhead',name:'동자개',size:[15,25],weight:2,when:s=>s.phase==='night'||s.phase==='dusk'},
  {id:'snow-loach',name:'눈꽃 미꾸리',size:[8,15],weight:1.5,when:s=>s.kind==='heavy'||s.kind==='precip'},
  {id:'star-smelt',name:'별빛 빙어',size:[10,16],weight:.8,when:s=>s.phase==='night'&&s.kind==='clear'}
 ];
 const WAIT=[3.5,9],BITE=2.4,HOLD=2.6,STAGES=['wait','bite','hold'];
 const pond=new THREE.Group();pond.name='ice-fishing-pond';scene.add(pond);
 // Follow the shallow rise toward the sled hill so the ice edge stays above the snow.
 function iceSurface(inner, rings, rise) {
  const positions=[],indices=[],sides=48;
  for(let band=0;band<=rings;band++)for(let i=0;i<=sides;i++){
   const radius=inner+(1-inner)*band/rings,angle=i*Math.PI*2/sides;
   const x=POND.x+Math.cos(angle)*radius*POND.width,z=POND.z+Math.sin(angle)*radius*POND.depth;
   positions.push(x,groundHeight(x,z)+rise,z);
   if(band<rings&&i<sides){const a=band*(sides+1)+i,b=a+sides+1;indices.push(a,a+1,b+1,a,b+1,b);}
  }
  const surface=new THREE.BufferGeometry();surface.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));surface.setIndex(indices);surface.computeVertexNormals();return surface;
 }
 mesh(iceSurface(0,16,.057),0xa9cfe2,pond).name='widened-ice';
 mesh(iceSurface(.92,4,.083),0xe4f1f7,pond);
 const crackMaterial=new THREE.LineBasicMaterial({color:0xe4f1f7,transparent:true,opacity:.65});
 for(const crack of [[[.56,2.2],[.96,2.47],[1.42,2.6]],[[3.88,.88],[4.16,1.2],[4.94,1.38]],[[4.87,2.92],[5.54,3.17],[5.89,3.01]],[[2.61,4.2],[2.92,4.49],[3.73,4.58]]]){
  const points=crack.map(([x,z])=>new THREE.Vector3(x,groundHeight(x,z)+.07,z));pond.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),crackMaterial));
 }
 for(const s of SEATS){
  const water=mesh(geom.disc,0x2b4558,pond,s.hole.x,groundHeight(s.hole.x,s.hole.z)+.075,s.hole.z,.44,.36,1);water.rotation.x=-Math.PI/2;
  const stool=mesh(geom.cyl,0x9b7c67,pond,s.x,groundHeight(s.x,s.z)+.17,s.z,.28,.34,.28);stool.name='ice-fishing-stool';
  block(s.hole.x,s.hole.z,.42);
 }
 // Each fishing actor gets a rod on the body, a float in the hole and a line between them.
 const rigs=new Map(),fishColor=0xb9c8d2;
 function rig(actor){
  let r=rigs.get(actor);if(r)return r;
  const rod=new THREE.Group();rod.name='ice-fishing-rod';rod.position.set(.43,.86,.29);rod.rotation.set(.85,0,-.24);actor.body.add(rod);mesh(geom.cyl,0x5d4a3d,rod,0,.72,0,.034,1.45,.034);mesh(geom.cyl,0xd2c3a5,rod,0,.08,0,.045,.18,.045);const tip=new THREE.Object3D();tip.position.y=1.44;rod.add(tip);
  const bob=new THREE.Group();sphere(bob,0xe8685a,0,.05,0,.075);sphere(bob,0xfaf4ea,0,-.005,0,.068);scene.add(bob);
  const lineGeo=new THREE.BufferGeometry();lineGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));const line=new THREE.Line(lineGeo,new THREE.LineBasicMaterial({color:0xf4efe6,transparent:true,opacity:.75}));line.frustumCulled=false;scene.add(line);
  const catchFish=new THREE.Group();catchFish.name='ice-fishing-catch';sphere(catchFish,fishColor,0,0,0,.07,.07,.2);const tail=mesh(geom.cone,fishColor,catchFish,0,0,-.24,.07,.13,.025);tail.rotation.x=-Math.PI/2;catchFish.position.set(0,-.48,.14);catchFish.rotation.x=Math.PI/2;actor.arms[1].add(catchFish);
  r={rod,tip,bob,line,catchFish,tipWorld:new THREE.Vector3()};rigs.set(actor,r);return r;
 }
 function show(actor,stage,t,seat){
  const r=rig(actor),on=STAGES.includes(stage);r.rod.visible=r.bob.visible=r.line.visible=on;r.catchFish.visible=stage==='hold';if(!on)return;
  const s=seat||nearestSeat(actor.root.position),dip=stage==='bite'?.05+Math.abs(Math.sin(t*9))*.05:Math.sin(t*2.2)*.012;
  r.bob.position.set(s.hole.x,groundHeight(s.hole.x,s.hole.z)+.108-dip,s.hole.z);r.rod.rotation.x=stage==='hold'?.35:.85+(stage==='bite'?Math.sin(t*14)*.05:0);
  actor.root.updateWorldMatrix(true,true);r.tip.getWorldPosition(r.tipWorld);const p=r.line.geometry.attributes.position.array;p.set([r.tipWorld.x,r.tipWorld.y,r.tipWorld.z,r.bob.position.x,r.bob.position.y+.05,r.bob.position.z]);r.line.geometry.attributes.position.needsUpdate=true;
 }
 // Seated pose: like warming hands, but both hands forward on the rod; the catch is held up in one hand.
 function pose(actor,stage,t){const a=actor.arms;if(stage==='hold'){a[0].rotation.set(-.9,0,-.25);a[1].rotation.set(-2.5,0,.15);}else{const tug=stage==='bite'?Math.sin(t*12)*.08:Math.sin(t*1.4)*.02;a[0].rotation.set(-1.05+tug,0,-.32);a[1].rotation.set(-1.05+tug,0,.32);}actor.legs.forEach(l=>l.rotation.x=-1.23);}
 const distance=(s,p)=>Math.hypot(s.x-p.x,s.z-p.z);
 function nearestSeat(p,seats=SEATS){return seats.reduce((best,s)=>!best||distance(s,p)<distance(best,p)?s:best,null);}
 // Keep the existing 'warm' mode and stage bands. The hundredths identify seats for updated clients.
 const STAGE_CODES=[50,55,60];
 function fromWire(m,b){return m==='warm'&&b>=.45?STAGES[Math.max(0,Math.min(2,Math.round((b-.5)/.05)))]:null;}
 function remoteSeat(p){
  const index=STAGES.indexOf(fromWire(p.m,p.b));
  if(index<0)return null;
  const claimed=SEATS[Math.round(p.b*100)-STAGE_CODES[index]-1];
  const nearest=nearestSeat(p);
  return claimed||(distance(nearest,p)<1.15?nearest:null);
 }
 function freeSeat(from,peers){return nearestSeat(from,SEATS.filter(s=>!peers.some(p=>remoteSeat(p)===s||distance(s,p)<.8)));}
 function pick(sky,roll=Math.random){const pool=FISH.filter(f=>f.when(sky)),total=pool.reduce((n,f)=>n+f.weight,0);let r=roll()*total;for(const f of pool){r-=f.weight;if(r<=0)return f;}return pool[pool.length-1];}
 let stage=null,timer=0,seat=null,caught=null;
 const api={
  POND,APPROACH,SEATS,FISH,remoteSeat,
  near(p){return distance(POND,p)<2.8;},
  get stage(){return stage;},get seat(){return seat;},get caught(){return caught;},
  start(from,peers){seat=freeSeat(from,peers);if(!seat)return false;stage='wait';timer=WAIT[0]+Math.random()*(WAIT[1]-WAIT[0]);caught=null;return true;},
  makeRoom(from,peers){seat=freeSeat(from,peers);return seat;},
  stop(){stage=null;seat=null;caught=null;},
  // Returns the caught fish when the float has dipped; otherwise null so the caller can put the rod away.
  press(sky){if(stage!=='bite')return null;const f=pick(sky),size=Math.round(f.size[0]+Math.random()*(f.size[1]-f.size[0]));caught={...f,cm:size};stage='hold';timer=HOLD;return caught;},
  tick(dt){if(!stage)return null;timer-=dt;if(timer>0)return null;if(stage==='wait'){stage='bite';timer=BITE;return'bite';}if(stage==='bite'){stage='wait';timer=WAIT[0]+Math.random()*(WAIT[1]-WAIT[0]);return'missed';}stage='wait';timer=WAIT[0]+Math.random()*(WAIT[1]-WAIT[0]);caught=null;return'released';},
  wire(){return (STAGE_CODES[Math.max(0,STAGES.indexOf(stage))]+(seat?seat.index+1:0))/100;},
  fromWire,
  // Friends who leave take their float and line with them.
  drop(actor){const r=rigs.get(actor);if(!r)return;scene.remove(r.bob,r.line);r.line.geometry.dispose();r.line.material.dispose();rigs.delete(actor);},
  show,pose,pick
 };
 return api;
}
const iceFishing=createIceFishing();
