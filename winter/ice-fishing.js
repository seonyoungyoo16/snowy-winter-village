// Ice fishing at a small frozen pond: cast, wait quietly, reel when the float dips. A fish that slips away just comes back later.
function createIceFishing(){
 const HOLE={x:8.6,z:6.9},SEATS=[{x:8.6,z:8.25,yaw:Math.PI},{x:7.25,z:6.9,yaw:Math.PI/2},{x:9.95,z:6.9,yaw:-Math.PI/2}];
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
 const floor=groundHeight(HOLE.x,HOLE.z),pond=new THREE.Group();pond.name='ice-fishing-pond';scene.add(pond);
 const ice=mesh(geom.disc,0xa9cfe2,pond,HOLE.x,floor+.03,HOLE.z,2.05,1.75,1);ice.rotation.x=-Math.PI/2;
 const rim=mesh(new THREE.RingGeometry(.9,1,40),0xe4f1f7,pond,HOLE.x,floor+.035,HOLE.z,2.05,1.75,1);rim.rotation.x=-Math.PI/2;
 const water=mesh(geom.disc,0x2b4558,pond,HOLE.x,floor+.04,HOLE.z,.44,.44,1);water.rotation.x=-Math.PI/2;
 for(const s of SEATS){const stool=mesh(geom.cyl,0x9b7c67,pond,s.x,floor+.17,s.z,.2,.34,.2);stool.name='ice-fishing-stool';}
 block(HOLE.x,HOLE.z,.42);
 const sign=new THREE.Group();sign.position.set(HOLE.x+1.9,groundHeight(HOLE.x+1.9,HOLE.z-1.4),HOLE.z-1.4);box(sign,0x7f6857,0,.55,0,.07,1.1,.07);box(sign,0xe8dcc4,0,1.05,0,.62,.3,.05);scene.add(sign);block(sign.position.x,sign.position.z,.2);
 // Each fishing actor gets a rod on the body, a float in the hole and a line between them.
 const rigs=new Map(),fishColor=0xb9c8d2;
 function rig(actor){
  let r=rigs.get(actor);if(r)return r;
  const rod=new THREE.Group();rod.name='ice-fishing-rod';rod.position.set(.24,.86,.3);rod.rotation.x=1.05;actor.body.add(rod);mesh(geom.cyl,0x5d4a3d,rod,0,.72,0,.024,1.45,.024);mesh(geom.cyl,0xd2c3a5,rod,0,.08,0,.035,.18,.035);const tip=new THREE.Object3D();tip.position.y=1.44;rod.add(tip);
  const bob=new THREE.Group();sphere(bob,0xe8685a,0,.05,0,.075);sphere(bob,0xfaf4ea,0,-.005,0,.068);scene.add(bob);
  const lineGeo=new THREE.BufferGeometry();lineGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));const line=new THREE.Line(lineGeo,new THREE.LineBasicMaterial({color:0xf4efe6,transparent:true,opacity:.75}));line.frustumCulled=false;scene.add(line);
  const catchFish=new THREE.Group();sphere(catchFish,fishColor,0,0,0,.07,.07,.2);const tail=mesh(geom.cone,fishColor,catchFish,0,0,-.24,.07,.13,.025);tail.rotation.x=-Math.PI/2;catchFish.position.set(0,-.48,.14);catchFish.rotation.x=Math.PI/2;actor.arms[1].add(catchFish);
  r={rod,tip,bob,line,catchFish,tipWorld:new THREE.Vector3()};rigs.set(actor,r);return r;
 }
 function show(actor,stage,t,seat){
  const r=rig(actor),on=STAGES.includes(stage);r.rod.visible=r.bob.visible=r.line.visible=on;r.catchFish.visible=stage==='hold';if(!on)return;
  const s=seat||nearestSeat(actor.root.position),dip=stage==='bite'?.05+Math.abs(Math.sin(t*9))*.05:Math.sin(t*2.2)*.012;
  r.bob.position.set(HOLE.x+(s.x-HOLE.x)*.08,floor+.06-dip,HOLE.z+(s.z-HOLE.z)*.08);r.rod.rotation.x=stage==='hold'?.35:1.05+(stage==='bite'?Math.sin(t*14)*.05:0);
  actor.root.updateWorldMatrix(true,true);r.tip.getWorldPosition(r.tipWorld);const p=r.line.geometry.attributes.position.array;p.set([r.tipWorld.x,r.tipWorld.y,r.tipWorld.z,r.bob.position.x,r.bob.position.y+.05,r.bob.position.z]);r.line.geometry.attributes.position.needsUpdate=true;
 }
 // Seated pose: like warming hands, but both hands forward on the rod; the catch is held up in one hand.
 function pose(actor,stage,t){const a=actor.arms;if(stage==='hold'){a[0].rotation.set(-.9,0,-.25);a[1].rotation.set(-2.5,0,.15);}else{const tug=stage==='bite'?Math.sin(t*12)*.08:Math.sin(t*1.4)*.02;a[0].rotation.set(-1.05+tug,0,-.32);a[1].rotation.set(-1.05+tug,0,.32);}actor.legs.forEach(l=>l.rotation.x=-1.23);}
 function nearestSeat(p){return SEATS.reduce((best,s)=>Math.hypot(s.x-p.x,s.z-p.z)<Math.hypot(best.x-p.x,best.z-p.z)?s:best,SEATS[0]);}
 function freeSeat(from,peers){const open=SEATS.filter(s=>!peers.some(p=>Math.hypot(p.x-s.x,p.z-s.z)<.8));return open.length?open.reduce((best,s)=>Math.hypot(s.x-from.x,s.z-from.z)<Math.hypot(best.x-from.x,best.z-from.z)?s:best,open[0]):null;}
 function pick(sky,roll=Math.random){const pool=FISH.filter(f=>f.when(sky)),total=pool.reduce((n,f)=>n+f.weight,0);let r=roll()*total;for(const f of pool){r-=f.weight;if(r<=0)return f;}return pool[pool.length-1];}
 let stage=null,timer=0,seat=null,caught=null;
 const api={
  HOLE,SEATS,FISH,
  near(p){return Math.hypot(p.x-HOLE.x,p.z-HOLE.z)<2.8;},
  get stage(){return stage;},get seat(){return seat;},get caught(){return caught;},
  start(from,peers){seat=freeSeat(from,peers);if(!seat)return false;stage='wait';timer=WAIT[0]+Math.random()*(WAIT[1]-WAIT[0]);caught=null;return true;},
  stop(){stage=null;seat=null;caught=null;},
  // Returns the caught fish when the float has dipped; otherwise null so the caller can put the rod away.
  press(sky){if(stage!=='bite')return null;const f=pick(sky),size=Math.round(f.size[0]+Math.random()*(f.size[1]-f.size[0]));caught={...f,cm:size};stage='hold';timer=HOLD;return caught;},
  tick(dt){if(!stage)return null;timer-=dt;if(timer>0)return null;if(stage==='wait'){stage='bite';timer=BITE;return'bite';}if(stage==='bite'){stage='wait';timer=WAIT[0]+Math.random()*(WAIT[1]-WAIT[0]);return'missed';}stage='wait';timer=WAIT[0]+Math.random()*(WAIT[1]-WAIT[0]);caught=null;return'released';},
  // Shared through the existing 'warm' mode: b .5 waiting, .55 bite, .6 holding a catch.
  wire(){return .5+Math.max(0,STAGES.indexOf(stage))*.05;},
  fromWire(m,b){return m==='warm'&&b>=.45?STAGES[Math.max(0,Math.min(2,Math.round((b-.5)/.05)))]:null;},
  // Friends who leave take their float and line with them.
  drop(actor){const r=rigs.get(actor);if(!r)return;scene.remove(r.bob,r.line);r.line.geometry.dispose();r.line.material.dispose();rigs.delete(actor);},
  show,pose,pick
 };
 return api;
}
const iceFishing=createIceFishing();
