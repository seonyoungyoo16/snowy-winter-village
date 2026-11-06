const PHOTO_DURATION=6,PHOTO_SHUTTER=2.2;
// The aquarium's unused "sled" wire action carries photography; b carries progress.
// Both fields already have bounded validation in the deployed database rules.
const photoWireProgress=time=>clamp(time/PHOTO_DURATION,0,1)*.7;
const photoTimeFromWire=progress=>clamp(progress,0,.7)/.7*PHOTO_DURATION;
function smoothPhoto(value){const t=clamp(value,0,1);return t*t*(3-2*t);}
function ensurePhotoCamera(actor){
 if(actor.photoCamera)return actor.photoCamera;
 const root=new THREE.Group();root.name='visitor-photo-camera';
 box(root,0xf1d8af,0,0,0,.66,.39,.21);
 box(root,0x305d69,0,-.065,.115,.66,.14,.04);
 box(root,0x315565,-.27,.015,.025,.12,.35,.25);
 box(root,0x4b737d,.14,.225,0,.2,.075,.13);
 const lens=mesh(geom.cyl,0x254855,root,0,.015,.2,.145,.19,.145);lens.rotation.x=Math.PI/2;
 const glass=mesh(geom.cyl,mat(0x8ed1cf,true),root,0,.015,.304,.103,.018,.103);glass.rotation.x=Math.PI/2;
 box(root,mat(0xf7eed4,true),.22,.125,.117,.095,.055,.018);
 box(root,0x244b59,0,.015,-.12,.43,.26,.025);
 box(root,mat(0x84c5c4,true),0,.015,-.138,.36,.19,.014);
 sphere(root,mat(0xe9ecc6,true),.015,.02,-.152,.077,.032,.008);
 const tail=mesh(geom.cone,mat(0xe9ecc6,true),root,-.075,.02,-.152,.03,.065,.008);tail.rotation.z=Math.PI/2;
 mergeModel(root);
 const flashMaterial=new THREE.MeshBasicMaterial({color:0xfff5cf,transparent:true,opacity:0,depthWrite:false});
 const flash=mesh(new THREE.OctahedronGeometry(.15),flashMaterial,root,.22,.16,.2,1,1,.3);flash.name='shutter-glint';flash.visible=false;
 root.visible=false;actor.body.add(root);
 actor.photoCamera={root,flash,flashTimer:0,lastTime:null};return actor.photoCamera;
}
function hidePhotoCamera(actor){
 if(!actor.photoCamera)return;
 const photo=actor.photoCamera;photo.root.visible=false;photo.flash.visible=false;photo.flashTimer=0;photo.lastTime=null;actor.arms.forEach(arm=>arm.position.z=0);
}
function releasePhotoCamera(actor){if(actor.photoCamera)actor.photoCamera.flash.material.dispose();}
function animatePhotoPose(actor,time,dt){
 const photo=ensurePhotoCamera(actor),t=clamp(time,0,PHOTO_DURATION);
 const raise=smoothPhoto((t-.05)/.7),lower=smoothPhoto((t-5.2)/.8),review=smoothPhoto((t-2.8)/.65)*(1-lower),hold=raise*(1-lower),aim=hold*(1-review);
 photo.root.visible=true;
 photo.root.position.set(.04,lerp(.83,1.5,hold)-review*.47,lerp(.34,.65,hold)+review*.02);
 photo.root.rotation.set(review*.62,0,-.035*aim);
 actor.arms.forEach(arm=>arm.position.z=.1*hold);
 actor.arms[0].rotation.set(lerp(-.45,-2.25,hold)+review*.9,-.08,.32*hold-.13*(1-hold));
 actor.arms[1].rotation.set(lerp(-.45,-2.25,hold)+review*.9,.08,-.32*hold+.13*(1-hold));
 actor.legs.forEach(leg=>leg.rotation.x=-.1*aim);
 actor.head.rotation.x=.38*review-.1*aim;
 if(photo.lastTime!==null&&t<photo.lastTime-.2){photo.flashTimer=0;photo.lastTime=null;}
 if(photo.lastTime!==null&&photo.lastTime<PHOTO_SHUTTER&&t>=PHOTO_SHUTTER){
  photo.flashTimer=.22;
  if(actor===character){toast('찰칵! 작은 바다를 담았어요');playPhotoShutter();}
 }
 photo.lastTime=t;photo.flashTimer=Math.max(0,photo.flashTimer-dt);
 photo.flash.visible=photo.flashTimer>0;
 photo.flash.material.opacity=(reduced?.35:.85)*clamp(photo.flashTimer/.13,0,1);
 photo.flash.scale.setScalar(.6+photo.flashTimer*2.5);
 return{height:.05*aim,pitch:-.045*aim+.07*review};
}
function remotePhotoTime(peer,dt){
 const target=photoTimeFromWire(peer.data.b);
 if(peer.photoTime==null||target<peer.photoTime-.35)peer.photoTime=target;
 else peer.photoTime=lerp(peer.photoTime,target,1-Math.exp(-dt*18));
 return peer.photoTime;
}
function playPhotoShutter(){
 if(!audioOn||!audio)return;
 try{const ctx=audio.ctx,osc=ctx.createOscillator(),gain=ctx.createGain(),now=ctx.currentTime;osc.type='triangle';osc.frequency.setValueAtTime(900,now);osc.frequency.exponentialRampToValueAtTime(100,now+.055);gain.gain.setValueAtTime(.14,now);gain.gain.exponentialRampToValueAtTime(.001,now+.065);osc.connect(gain);gain.connect(audio.master);osc.start(now);osc.stop(now+.075);osc.onended=()=>{osc.disconnect();gain.disconnect();};}catch{}
}
function startPhoto(){
 if(!entered||mode==='photo'||mode==='celebrate')return;
 mode='photo';path=[];photoTime=0;lastNetworkMovement=false;
 player.rotation.y=Math.atan2(tanks.ocean.x-player.position.x,tanks.ocean.z-player.position.z);
 const photo=ensurePhotoCamera(character);photo.lastTime=0;photo.flashTimer=0;
 cameraYawTarget=-1;uiKey='';updateUI();publishState(true);
}
