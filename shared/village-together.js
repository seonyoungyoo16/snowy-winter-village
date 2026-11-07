// Small things to do side by side: a '여기!' ping friends see for ten seconds, a big object two friends carry between
// them (one alone pushes it slowly) and a warm cocoa handed to the nearest friend. Friends learn about each through free
// idle/walk b values: ping .05–.25 (0–20 m ahead along the facing), carrying .30, cocoa .33. b is claimed only when it is 0.
function createVillageTogether(){
 const PING={wire:.05,max:20,show:10,hold:1.5,gap:4},CARRY_B=.30,COCOA_B=.33,COCOA={reach:3,hold:1.5,gap:5},
  BIG={winter:{name:'큰 눈덩이',x:3,z:4,r:.75,color:0xf4f8ff},aquarium:{name:'커다란 물놀이 공',x:2,z:4,r:.6,color:0x9fd3e3},library:{name:'책 수레',x:2,z:4,r:.6,color:0xb08a68}}[CURRENT_WORLD],
  SOLO=.8,PAIR=4,GRAB=2.2,KEY='village-carry:'+CURRENT_WORLD;
 let clock=0,pingUntil=-9,pingStep=0,lastPing=-9,cocoaUntil=-9,lastCocoa=-9,carrying=false;
 const pings=[],q=(b,v)=>Math.abs(b-v)<.003;
 function decode(m,b){if((m!=='idle'&&m!=='walk')||!Number.isFinite(b))return null;if(q(b,CARRY_B))return{carry:true};if(q(b,COCOA_B))return{cocoa:true};const k=Math.round((b-PING.wire)/.01);return k>=0&&k<=PING.max&&q(b,PING.wire+k*.01)?{ping:k}:null;}
 const style=document.createElement('style');style.textContent='.ping-tag{position:fixed;z-index:6;transform:translate(-50%,-100%);padding:5px 10px;border-radius:14px;background:rgba(255,247,232,.94);color:#8f5a54;font:700 13px "Winter Jua",sans-serif;box-shadow:0 2px 10px rgba(40,40,70,.2);pointer-events:none;white-space:nowrap}.ping-tag.edge{transform:translate(-50%,-50%)}';(document.head||document.body).append(style);
 // A ping: a pulsing ring and a small cone on the spot, a name tag above it, and an arrow at the screen edge when it is off screen.
 const ringGeo=new THREE.RingGeometry(.45,.6,24),coneGeo=new THREE.ConeGeometry(.16,.4,10);
 function addPing(x,z,name){while(pings.length>=4)dropPing(pings[0]);const y=typeof groundHeight==='function'?groundHeight(x,z):0,g=new THREE.Group(),mat=new THREE.MeshBasicMaterial({color:0xf0a6a0,transparent:true,opacity:.85,side:THREE.DoubleSide}),ring=new THREE.Mesh(ringGeo,mat),cone=new THREE.Mesh(coneGeo,mat);
  ring.rotation.x=-Math.PI/2;ring.position.y=.04;cone.rotation.x=Math.PI;cone.position.y=1.1;g.add(ring,cone);g.position.set(x,y,z);g.name='village-ping';scene.add(g);
  const tag=document.createElement('div');tag.className='ping-tag';tag.textContent=name+' · 여기!';document.body.append(tag);const p={g,ring,cone,tag,x,z,t:0,name};pings.push(p);return p;}
 function dropPing(p){scene.remove(p.g);p.tag.remove&&p.tag.remove();pings.splice(pings.indexOf(p),1);}
 function groundAt(sx,sy){const r=renderer.domElement.getBoundingClientRect?renderer.domElement.getBoundingClientRect():{left:0,top:0,width:innerWidth,height:innerHeight},ray=new THREE.Raycaster(),hit=new THREE.Vector3();ray.setFromCamera(new THREE.Vector2((sx-r.left)/r.width*2-1,-((sy-r.top)/r.height)*2+1),camera);return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-player.position.y),hit)?{x:hit.x,z:hit.z}:null;}
 // Ping a spot (or where I stand): I turn toward it, it shows here at once and reaches friends along my facing.
 function ping(x=player.position.x,z=player.position.z){if(!entered)return false;if(clock-lastPing<PING.gap){toast('조금 뒤에 다시 알려요');return false;}const dx=x-player.position.x,dz=z-player.position.z,d=Math.min(PING.max,Math.hypot(dx,dz));
  if(d>.5)player.rotation.y=Math.atan2(dx,dz);const yaw=player.rotation.y,k=Math.round(d),px=player.position.x+Math.sin(yaw)*(d>.5?d:0),pz=player.position.z+Math.cos(yaw)*(d>.5?d:0);
  lastPing=clock;pingUntil=clock+PING.hold;pingStep=d>.5?k:0;addPing(px,pz,'나');toast('여기! 친구에게 알렸어요');return{d:pingStep,x:px,z:pz};}
 // The big object: two carriers hold it between them; one alone pushes it slowly in front; it never passes walls.
 const big=(()=>{const g=new THREE.Group(),mat=new THREE.MeshLambertMaterial({color:BIG.color});if(CURRENT_WORLD==='library'){const box=new THREE.Mesh(new THREE.BoxGeometry(1,.6,.7),mat);box.position.y=.55;const books=new THREE.Mesh(new THREE.BoxGeometry(.8,.25,.5),new THREE.MeshLambertMaterial({color:0x8e9d83}));books.position.y=.98;g.add(box,books);}
  else{const s=new THREE.Mesh(new THREE.SphereGeometry(BIG.r,18,14),mat);s.position.y=BIG.r;g.add(s);}g.name='carry-object';scene.add(g);return g;})();
 function loadSpot(){try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&Number.isFinite(s.x)&&Number.isFinite(s.z)&&Math.abs(s.x)<=24&&Math.abs(s.z)<=24&&!blocked(s.x,s.z,BIG.r*.8))return s;}catch{}return{x:BIG.x,z:BIG.z};}
 const spot=loadSpot();big.position.set(spot.x,0,spot.z);let saveIn=0;
 function saveSpot(){saveIn=2;try{localStorage.setItem(KEY,JSON.stringify({x:big.position.x,z:big.position.z}));}catch{}}
 const near=(p,d)=>Math.hypot(p.x-big.position.x,p.z-big.position.z)<d;
 function grab(){if(!entered)return false;if(!carrying&&!near(player.position,GRAB)){toast(BIG.name+' 가까이 가서 잡아요');return false;}carrying=!carrying;if(!carrying)saveSpot();toast(carrying?BIG.name+'을(를) 잡았어요. 친구가 반대쪽을 잡으면 가벼워져요':BIG.name+'을(를) 내려놓았어요');if(carrying&&typeof villageJournal==='object'&&villageJournal&&villageJournal.note)villageJournal.note('first-carry');return carrying;}
 function carriers(){const out=[];if(carrying)out.push({x:player.position.x,z:player.position.z,yaw:player.rotation.y});for(const peer of remotePlayers.values()){const s=decode(peer.data.m,peer.data.b),r=peer.actor.root.position;if(s&&s.carry&&near(r,GRAB+1.3))out.push({x:r.x,z:r.z,yaw:peer.actor.root.rotation.y});}return out;}
 function moveBig(dt){const list=carriers();if(!list.length)return list.length;let tx,tz,speed;if(list.length>=2){tx=(list[0].x+list[1].x)/2;tz=(list[0].z+list[1].z)/2;speed=PAIR;}else{const c=list[0];tx=c.x+Math.sin(c.yaw)*(BIG.r+.55);tz=c.z+Math.cos(c.yaw)*(BIG.r+.55);speed=SOLO;}
  const dx=tx-big.position.x,dz=tz-big.position.z,d=Math.hypot(dx,dz);if(d<.01)return list.length;const step=Math.min(d,speed*dt),nx=big.position.x+dx/d*step,nz=big.position.z+dz/d*step;
  if(Math.abs(nx)<=24&&Math.abs(nz)<=24&&!blocked(nx,nz,BIG.r*.8)){big.position.x=nx;big.position.z=nz;if(CURRENT_WORLD!=='library')big.children[0].rotation.x+=step/BIG.r;big.rotation.y=Math.atan2(dx,dz);saveIn-=dt;if(saveIn<=0)saveSpot();}
  // Walking far away lets go gently, without losing anything.
  if(carrying&&!near(player.position,5)){carrying=false;saveSpot();toast(BIG.name+'을(를) 잠시 내려놓았어요');}return list.length;}
 // Cocoa: handed to the nearest friend within reach; on their screen it warms them with a heart.
 function nearestPeer(from,reach){let best=null,bd=reach;for(const peer of remotePlayers.values()){const r=peer.actor.root.position,d=Math.hypot(r.x-from.x,r.z-from.z);if(d<=bd){bd=d;best=peer;}}return best;}
 function cocoa(){if(!entered)return false;const peer=nearestPeer(player.position,COCOA.reach);if(!peer){toast('가까이 있는 친구에게 건넬 수 있어요');return false;}if(clock-lastCocoa<COCOA.gap)return false;lastCocoa=clock;cocoaUntil=clock+COCOA.hold;
  player.rotation.y=Math.atan2(peer.actor.root.position.x-player.position.x,peer.actor.root.position.z-player.position.z);toast(peer.data.n+' 님에게 따뜻한 코코아를 건넸어요');return peer;}
 if(typeof radialMenu==='object'&&radialMenu){radialMenu.addItem({icon:'◎',label:'여기!',run(at){const spot=at&&at.held?groundAt(at.x,at.y):null;spot?ping(spot.x,spot.z):ping();}});
  radialMenu.addItem({icon:'⇆',label:()=>carrying?BIG.name+' 놓기':BIG.name+' 잡기',when:()=>carrying||near(player.position,GRAB),run:grab});
  radialMenu.addItem({icon:'☕',label:'코코아 건네기',when:()=>Boolean(nearestPeer(player.position,COCOA.reach)),run:cocoa});}
 return{PING,BIG,CARRY_B,COCOA_B,decode,ping,grab,cocoa,carriers,groundAt,pings,big,get carrying(){return carrying;},
  wire(body){if((body.m!=='idle'&&body.m!=='walk')||body.b!==0)return body;if(clock<pingUntil)return{...body,b:Math.round((PING.wire+pingStep*.01)*1000)/1000};if(clock<cocoaUntil)return{...body,b:COCOA_B};if(carrying)return{...body,b:CARRY_B};return body;},
  // A friend's ping or cocoa happens once per signal; carrying is read every frame from their state.
  peer(peer){const data=peer.data,s=decode(data.m,data.b);if(!s||s.carry){peer.togetherSent=false;return;}if(peer.togetherSent)return;peer.togetherSent=true;
   if(s.ping!==undefined){const x=data.x+Math.sin(data.a)*s.ping,z=data.z+Math.cos(data.a)*s.ping;addPing(x,z,data.n||'친구');toast((data.n||'친구')+' 님: 여기 와 봐요!');}
   else if(s.cocoa){const me=player.position,d=Math.hypot(me.x-data.x,me.z-data.z);let closest=true;for(const other of remotePlayers.values())if(other!==peer&&Math.hypot(other.actor.root.position.x-data.x,other.actor.root.position.z-data.z)<d)closest=false;
    if(d<=COCOA.reach+.3&&closest){if(typeof villagePlay==='object'&&villagePlay)villagePlay.say(0);toast((data.n||'친구')+' 님이 건넨 코코아, 손끝까지 따뜻해요');}}},
  tick(dt){clock+=dt;moveBig(dt);const w=innerWidth,h=innerHeight,v=new THREE.Vector3();for(const p of[...pings]){p.t+=dt;if(p.t>PING.show){dropPing(p);continue;}const s=1+Math.sin(p.t*5)*.12;p.ring.scale.set(s,s,s);p.cone.position.y=1.1+Math.sin(p.t*4)*.1;
    v.set(p.x,p.g.position.y+1.5,p.z).project(camera);const behind=v.z>1,off=behind||Math.abs(v.x)>.92||Math.abs(v.y)>.92;let sx=(v.x+1)/2*w,sy=(1-v.y)/2*h;
    if(off){const ax=behind?-v.x:v.x,ay=behind?-v.y:v.y,k=.88/Math.max(Math.abs(ax),Math.abs(ay),1e-6);sx=(ax*k+1)/2*w;sy=(1-ay*k)/2*h;p.tag.className='ping-tag edge';p.tag.textContent=(Math.abs(ax)>Math.abs(ay)?(ax>0?'→ ':'← '):(ay>0?'↑ ':'↓ '))+p.name+' · 여기!';}else{p.tag.className='ping-tag';p.tag.textContent=p.name+' · 여기!';}
    p.tag.style.left=Math.round(sx)+'px';p.tag.style.top=Math.round(sy)+'px';}}
 };
}
const villageTogether=createVillageTogether();
