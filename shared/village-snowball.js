// A no-score snowball toss: pick up a snowball (a bubble in the aquarium, a paper plane in the library), tap where it
// should land and it arcs there, gently bending toward a nearby friend. A hit only splashes and makes the friend laugh.
// Friends see the throw through the existing idle/walk band b = .47–.54 (landing 3–10 m ahead along the thrower's facing).
function createVillageSnowball(){
 const KIND={winter:{name:'눈덩이',verb:'눈덩이 던지기',pick:'눈덩이를 뭉쳤어요. 던질 곳을 눌러요',color:0xf8fbff,opacity:1},aquarium:{name:'비눗방울',verb:'비눗방울 날리기',pick:'비눗방울을 불었어요. 날릴 곳을 눌러요',color:0xbfe6f2,opacity:.55},library:{name:'종이비행기',verb:'종이비행기 날리기',pick:'종이비행기를 접었어요. 날릴 곳을 눌러요',color:0xfff4dc,opacity:1}}[CURRENT_WORLD],
  MIN=3,MAX=10,WIRE=.47,HOLD=1.2,GAP=1.5,HIT=1.3,ASSIST={near:2.5,angle:.26};
 let armed=false,lastThrow=-9,sendUntil=-9,sendStep=0,clock=0,press=null;
 const flights=[],splashes=[];
 const geo=CURRENT_WORLD==='library'?new THREE.ConeGeometry(.12,.34,3):new THREE.SphereGeometry(CURRENT_WORLD==='aquarium'?.16:.12,10,8),
  mat=new THREE.MeshLambertMaterial({color:KIND.color,transparent:KIND.opacity<1,opacity:KIND.opacity}),
  bitGeo=new THREE.SphereGeometry(.05,6,5),bitMat=new THREE.MeshLambertMaterial({color:KIND.color,transparent:true,opacity:.9});
 const hand=new THREE.Mesh(geo,mat);hand.name='snowball-hand';hand.visible=false;hand.position.set(.32,.95,.18);player.add(hand);
 const ground=(x,z)=>typeof groundHeight==='function'?groundHeight(x,z):player.position.y;
 const steps=MAX-MIN,wireOf=d=>Math.round((WIRE+Math.round(Math.max(MIN,Math.min(MAX,d))-MIN)*.01)*1000)/1000;
 function decode(m,b){if((m!=='idle'&&m!=='walk')||!Number.isFinite(b))return null;const k=Math.round((b-WIRE)/.01);return k>=0&&k<=steps&&Math.abs(b-(WIRE+k*.01))<.003?MIN+k:null;}
 function arm(){if(!entered||(typeof mode!=='undefined'&&mode!=='idle')){toast('하던 일을 마치고 놀아 볼까요?');return false;}armed=!armed;hand.visible=armed;if(armed)toast(KIND.pick);return armed;}
 // Soft aim: a friend close to the chosen spot, or nearly in line and within reach, becomes the target.
 function aim(x,z){const me=player.position,dir=Math.atan2(x-me.x,z-me.z);let best=null,score=Infinity;
  for(const peer of remotePlayers.values()){const p=peer.actor.root.position,near=Math.hypot(p.x-x,p.z-z),reach=Math.hypot(p.x-me.x,p.z-me.z),off=Math.abs(Math.atan2(Math.sin(Math.atan2(p.x-me.x,p.z-me.z)-dir),Math.cos(Math.atan2(p.x-me.x,p.z-me.z)-dir)));
   const s=near<ASSIST.near?near:(off<ASSIST.angle&&reach<=MAX+.5?ASSIST.near+off:Infinity);if(s<score){score=s;best=peer;}}
  return best?{x:best.actor.root.position.x,z:best.actor.root.position.z,peer:best}:{x,z,peer:null};}
 function launch(from,yaw,dist,owner){const x=from.x+Math.sin(yaw)*dist,z=from.z+Math.cos(yaw)*dist,m=new THREE.Mesh(geo,mat);m.name='snowball-flight';m.position.set(from.x,from.y+1,from.z);scene.add(m);
  const f={m,sx:from.x,sy:from.y+1,sz:from.z,x,z,t:0,d:.35+dist*.06*(CURRENT_WORLD==='aquarium'?1.6:1),h:dist*.18+(CURRENT_WORLD==='aquarium'?.8:0),yaw,owner};flights.push(f);return f;}
 // Throws from here: face the target, fly there, and tell friends for a moment through the wire band.
 function throwAt(x,z){if(!armed||clock-lastThrow<GAP)return null;const t=aim(x,z),me=player.position,dist=Math.max(MIN,Math.min(MAX,Math.hypot(t.x-me.x,t.z-me.z)));if(dist<.5)return null;
  const yaw=Math.atan2(t.x-me.x,t.z-me.z);player.rotation.y=yaw;armed=false;hand.visible=false;lastThrow=clock;sendUntil=clock+HOLD;sendStep=Math.round(dist)-MIN;
  const f=launch(me,yaw,dist,null);f.target=t.peer;if(typeof villageJournal==='object'&&villageJournal&&villageJournal.note)villageJournal.note('first-snowball');return{dist,yaw,peer:t.peer};}
 function splash(x,y,z){for(let i=0;i<8;i++){const m=new THREE.Mesh(bitGeo,bitMat);m.position.set(x,y+.5,z);const a=i/8*Math.PI*2;m.userData.v={x:Math.cos(a)*1.6,y:2.2+(i%3)*.4,z:Math.sin(a)*1.6};scene.add(m);splashes.push({m,t:0});}}
 function land(f){scene.remove(f.m);const y=ground(f.x,f.z);splash(f.x,y,f.z);
  if(f.target)toast('퍽! '+f.target.data.n+' 님에게 '+KIND.name+'이(가) 닿았어요');
  // A friend's throw that lands near me makes me laugh with the shared smile emote.
  if(f.owner&&Math.hypot(player.position.x-f.x,player.position.z-f.z)<HIT){if(typeof villagePlay==='object'&&villagePlay)villagePlay.say(1);toast(f.owner+' 님의 '+KIND.name+'에 맞았어요! 하하');}}
 // A tap on the scene while holding one throws instead of walking; the press is kept from the world's own handlers.
 const onCanvas=e=>e.target===renderer.domElement;
 addEventListener('pointerdown',e=>{if(armed&&onCanvas(e)){press={x:e.clientX,y:e.clientY,id:e.pointerId};e.stopImmediatePropagation();}},true);
 addEventListener('pointermove',e=>{if(press&&e.pointerId===press.id)e.stopImmediatePropagation();},true);
 addEventListener('pointerup',e=>{if(!press||e.pointerId!==press.id)return;const p=press;press=null;e.stopImmediatePropagation();if(Math.hypot(e.clientX-p.x,e.clientY-p.y)>12)return;
  const r=renderer.domElement.getBoundingClientRect(),ray=new THREE.Raycaster(),hit=new THREE.Vector3();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1),camera);
  if(ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-player.position.y),hit))throwAt(hit.x,hit.z);},true);
 addEventListener('keydown',e=>{if(e.key==='Escape'&&armed){armed=false;hand.visible=false;}});
 if(typeof radialMenu==='object'&&radialMenu)radialMenu.addItem({icon:CURRENT_WORLD==='library'?'✈':'○',label:KIND.verb,run:arm});
 return{KIND,MIN,MAX,WIRE,arm,aim,throwAt,decode,wireOf,get armed(){return armed;},flights,splashes,hand,
  wire(body){if((body.m!=='idle'&&body.m!=='walk')||clock>=sendUntil)return body;if(Math.abs(body.b-.41)<.005||Math.abs(body.b-.45)<.005)return body;return{...body,b:Math.round((WIRE+sendStep*.01)*1000)/1000};},
  // A friend's throw appears once per signal, from where they stand along the way they face.
  peer(peer){const data=peer.data,d=decode(data.m,data.b);if(d===null){peer.snowSent=false;return;}if(peer.snowSent)return;peer.snowSent=true;launch({x:data.x,y:data.y,z:data.z},data.a,d,data.n||'친구');},
  tick(dt){clock+=dt;for(let i=flights.length-1;i>=0;i--){const f=flights[i];f.t+=dt;const k=Math.min(1,f.t/f.d);f.m.position.set(f.sx+(f.x-f.sx)*k,f.sy+(ground(f.x,f.z)+.2-f.sy)*k+Math.sin(k*Math.PI)*f.h,f.sz+(f.z-f.sz)*k);f.m.rotation.y=f.yaw;if(k>=1){flights.splice(i,1);land(f);}}
   for(let i=splashes.length-1;i>=0;i--){const s=splashes[i],v=s.m.userData.v;s.t+=dt;v.y-=6*dt;s.m.position.x+=v.x*dt;s.m.position.y+=v.y*dt;s.m.position.z+=v.z*dt;if(s.t>.6){scene.remove(s.m);splashes.splice(i,1);}}}
 };
}
const villageSnowball=createVillageSnowball();
