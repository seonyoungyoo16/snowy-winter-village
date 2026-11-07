// Small signs of life on every face: blinking, emote expressions, sleepy residents, winter breath and the odd glance.
// Heads are merged meshes, so a thin face rig (eyelids, ^^ arcs and a small mouth) is laid over each one the first time it is seen.
function createAvatarLife(){
 const VISITOR={eyeX:.125,eyeY:.015,eyeZ:.43,skin:0xffedcf,eye:CURRENT_WORLD==='winter'?0x454354:0x354854,mouthY:-.13,mouthZ:.43};
 const RESIDENT={eyeX:.125,eyeY:.015,eyeZ:.41,skin:0xf5e6cb,eye:0x423d40,mouthY:-.13,mouthZ:.41};
 // Emote index (village-play order) → face: 좋아요·웃음·반가워·박수 smile, 졸려요 sleepy, 놀랐어요 surprised.
 const EMOTE_FACE=['happy','happy','happy','sleepy','surprised','happy'],EMOTE_TIME=1.8,now=()=>performance.now()/1000;
 const rigs=new WeakMap();
 function merged(parts,color,name){const geos=[];for(const p of parts){const g=p.geo.clone();g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...p.pos),new THREE.Quaternion().setFromEuler(new THREE.Euler(...(p.rot||[0,0,0]))),new THREE.Vector3(...p.scale)));geos.push(g.index?g.toNonIndexed():g);}
  const count=geos.reduce((n,g)=>n+g.attributes.position.count,0),pos=new Float32Array(count*3),nor=new Float32Array(count*3);let o=0;for(const g of geos){pos.set(g.attributes.position.array,o);nor.set(g.attributes.normal.array,o);o+=g.attributes.position.array.length;g.dispose();}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.BufferAttribute(nor,3));const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color}));m.name=name;m.visible=false;return m;}
 const ball=new THREE.SphereGeometry(1,10,8),arc=new THREE.TorusGeometry(1,.28,4,10,Math.PI),ring=new THREE.TorusGeometry(1,.3,4,12);
 // Three meshes per face at most: both lids, both arcs and the mouth.
 function rig(head,f){let r=rigs.get(head);if(r)return r;
  const lids=merged([-1,1].map(s=>({geo:ball,pos:[s*f.eyeX,f.eyeY+.012,f.eyeZ+.004],scale:[.046,.052,.02]})),f.skin,'face-lids');
  const arcs=merged([-1,1].map(s=>({geo:arc,pos:[s*f.eyeX,f.eyeY-.012,f.eyeZ+.012],scale:[.032,.032,.02]})),f.eye,'face-happy-eyes');
  const mouth=merged([{geo:ring,pos:[0,f.mouthY,f.mouthZ+.006],scale:[.03,.034,.02]}],0x8f6d68,'face-mouth');
  head.add(lids,arcs,mouth);r={lids,arcs,mouth,nextBlink:now()+1+Math.random()*4,blinkAt:-9,glanceY:0,nextGlance:now()+3+Math.random()*4,glanceUntil:0,breathAt:now()+Math.random()*3};rigs.set(head,r);return r;}
 // Expression wins over blinking; a blink is a quick 0.14 s close.
 function face(r,expr,t){if(t>=r.nextBlink){r.blinkAt=t;r.nextBlink=t+3+Math.random()*3;}const blink=t-r.blinkAt<.14;
  r.arcs.visible=expr==='happy';r.mouth.visible=expr==='surprised'||expr==='talk';if(expr==='talk')r.mouth.scale.set(1,.6+Math.abs(Math.sin(t*9))*.5,1);else r.mouth.scale.set(1,1,1);
  if(expr==='happy'||expr==='asleep'){r.lids.visible=true;r.lids.scale.y=1;r.lids.position.y=0;}else if(expr==='sleepy'){r.lids.visible=true;r.lids.scale.y=.55;r.lids.position.y=.018;}else if(expr==='surprised'){r.lids.visible=false;}else{r.lids.visible=blink;r.lids.scale.y=1;r.lids.position.y=0;}
  return blink;}
 // Glances: now and then a calm visitor turns its head toward someone nearby, never tracking for long.
 function glance(r,actor,others,calm,t,dt){const root=actor.root;if(calm&&t>=r.nextGlance){r.nextGlance=t+4+Math.random()*5;let best=null,bestD=6;for(const o of others){if(o===root)continue;const d=root.position.distanceTo(o.position);if(d<bestD){bestD=d;best=o;}}if(best){const dx=best.position.x-root.position.x,dz=best.position.z-root.position.z,rel=Math.atan2(Math.sin(Math.atan2(dx,dz)-root.rotation.y),Math.cos(Math.atan2(dx,dz)-root.rotation.y));r.glanceTarget=Math.max(-.6,Math.min(.6,rel));r.glanceUntil=t+1.2+Math.random()*.8;}}
  const target=calm&&t<r.glanceUntil?r.glanceTarget:0;if(Math.abs(target)<1e-4&&Math.abs(r.glanceY)<1e-3){if(r.glanceY!==0){r.glanceY=0;actor.head.rotation.y=0;}return;}r.glanceY+=(target-r.glanceY)*Math.min(1,dt*5);actor.head.rotation.y=r.glanceY;}
 // Winter breath: soft puffs on cold nights or in snow and fog; one small pool of sprites for the whole village.
 const puffs=[];let puffTexture=null;
 function cold(){if(CURRENT_WORLD!=='winter'||typeof skyWeather!=='object'||!skyWeather)return false;const s=skyWeather.state;return s.daylight<.35||s.kind==='heavy'||s.kind==='precip'||s.kind==='fog';}
 function puff(head){if(!puffTexture){const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),grad=g.createRadialGradient(16,16,0,16,16,15);grad.addColorStop(0,'rgba(255,255,255,.9)');grad.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=grad;g.fillRect(0,0,32,32);puffTexture=new THREE.CanvasTexture(c);}
  let p=puffs.find(q=>!q.sprite.visible);if(!p){if(puffs.length>=16)return;p={sprite:new THREE.Sprite(new THREE.SpriteMaterial({map:puffTexture,transparent:true,depthWrite:false,opacity:0})),age:0};p.sprite.name='breath-puff';scene.add(p.sprite);puffs.push(p);}
  head.updateWorldMatrix(true,false);p.origin=new THREE.Vector3(0,-.1,.5).applyMatrix4(head.matrixWorld);p.drift=new THREE.Vector3(0,.25,.35).applyQuaternion(head.getWorldQuaternion(new THREE.Quaternion()));p.age=0;p.sprite.visible=true;}
 function puffsTick(dt){for(const p of puffs){if(!p.sprite.visible)continue;p.age+=dt;const u=p.age/1.3;if(u>=1){p.sprite.visible=false;continue;}p.sprite.position.copy(p.origin).addScaledVector(p.drift,u);p.sprite.scale.setScalar(.12+u*.35);p.sprite.material.opacity=.55*(1-u);}}
 function actors(){const list=[];if(typeof character==='object'&&character&&character.head)list.push({actor:character,f:VISITOR,expr:localExpr(),calm:typeof mode==='undefined'||mode==='idle'});
  if(typeof remotePlayers==='object')for(const peer of remotePlayers.values())if(peer.actor&&peer.actor.head)list.push({actor:peer.actor,f:VISITOR,expr:peer.emoteAt!==undefined&&now()-peer.emoteAt<EMOTE_TIME?EMOTE_FACE[peer.emoteShown]||null:null,calm:!peer.data||peer.data.m==='idle'||peer.data.m==='walk'});
  if(typeof residentGuide==='object'&&residentGuide&&residentGuide.actor){const s=residentGuide.slot;list.push({actor:residentGuide.actor,f:RESIDENT,expr:s&&s.mood==='sleep'&&!residentGuide.isOpen()?'asleep':residentGuide.isOpen()?'talk':null,calm:false,resident:true});}
  return list;}
 function localExpr(){if(typeof villagePlay!=='object'||!villagePlay||!villagePlay.activeEmote)return null;const i=villagePlay.activeEmote();return i===null?null:EMOTE_FACE[i]||null;}
 return{
  EMOTE_FACE,rig,
  tick(dt){const t=now(),list=actors(),roots=list.map(x=>x.actor.root);const breathe=cold();
   for(const x of list){const r=rig(x.actor.head,x.f);face(r,x.expr,t);if(!x.resident)glance(r,x.actor,roots,x.calm,t,dt);if(breathe&&t>=r.breathAt){r.breathAt=t+3+Math.random()*2;puff(x.actor.head);}}
   puffsTick(dt);},
  get puffs(){return puffs;}
 };
}
const avatarLife=createAvatarLife();
