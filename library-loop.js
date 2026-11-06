const dustCount=reduced?30:(mobile?65:110),dustArray=new Float32Array(dustCount*3),dustSeed=[];for(let i=0;i<dustCount;i++)dustSeed.push({x:(rand()-.5)*31,y:.8+rand()*5,z:(rand()-.5)*25});const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(dustArray,3));const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xf4dfae,size:.035,transparent:true,opacity:.38,depthWrite:false}));scene.add(dust);
function tick(now){requestAnimationFrame(tick);if(document.hidden){oldTime=now;return;}const dt=Math.min((now-oldTime)/1000,.05);oldTime=now;elapsed+=dt;let moving=false;
 if(entered&&!helpOpen()){
  if(mode==='writing'){writingTime+=dt;if(writingTime>=WRITING_DURATION)finishBookmark();}
  else if(mode==='wave'){waveTime+=dt;if(waveTime>2.3){mode='idle';uiKey='';}}
  else if(mode==='idle'){
   let vx=0,vz=0;const speed=3.5;if(keys.has('w')||keys.has('arrowup'))vz--;if(keys.has('s')||keys.has('arrowdown'))vz++;if(keys.has('a')||keys.has('arrowleft'))vx--;if(keys.has('d')||keys.has('arrowright'))vx++;
   if(vx||vz){path=[];const v=new THREE.Vector3(vx,0,vz).normalize().applyAxisAngle(new THREE.Vector3(0,1,0),cameraYaw),nx=player.position.x+v.x*speed*dt,nz=player.position.z+v.z*speed*dt;if(!blocked(nx,nz)){player.position.x=nx;player.position.z=nz;moving=true;}else{if(!blocked(nx,player.position.z)){player.position.x=nx;moving=true;}if(!blocked(player.position.x,nz)){player.position.z=nz;moving=true;}}if(moving){const desired=Math.atan2(v.x,v.z);player.rotation.y+=Math.atan2(Math.sin(desired-player.rotation.y),Math.cos(desired-player.rotation.y))*(1-Math.exp(-dt*12));}}
   else if(path.length){const p=path[0],dx=p.x-player.position.x,dz=p.z-player.position.z,d=Math.hypot(dx,dz),step=Math.min(speed*dt,d);if(d<.07)path.shift();else{player.position.x+=dx/d*step;player.position.z+=dz/d*step;const desired=Math.atan2(dx,dz);player.rotation.y+=Math.atan2(Math.sin(desired-player.rotation.y),Math.cos(desired-player.rotation.y))*(1-Math.exp(-dt*13));moving=true;}}
  }
 }
 networkTick(dt,moving);animatePose(dt,moving);playerShadow.position.set(player.position.x,.035,player.position.z);
 for(let i=0;i<dustCount;i++){const s=dustSeed[i];dustArray[i*3]=s.x+Math.sin(elapsed*.12+i)*.3;dustArray[i*3+1]=s.y+Math.sin(elapsed*.2+i*2)*.12;dustArray[i*3+2]=s.z+Math.cos(elapsed*.1+i)*.2;}dustGeo.attributes.position.needsUpdate=true;
 if(ringTimer>0){ringTimer-=dt;targetRing.scale.setScalar(1+Math.sin(elapsed*4)*.08);targetRing.material.opacity=clamp(ringTimer,0,.7);if(ringTimer<=0)targetRing.visible=false;}
 updateCamera(dt);if(frameCount++%5===0){label('label-books',-12,4.5,-7.3);label('label-window',10,3.2,-11);label('label-desk',9,2.8,1);if(entered)updateUI();}renderer.render(scene,camera);
}
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('error').hidden=false;$('error-text').textContent='도서관이 잠깐 쉬고 있어요. 페이지를 다시 열어주세요.';});
addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('memory-modal').hidden)closeMemories();});
/* MULTIPLAYER_CODE */
drawMemoryBoard();updateCamera(.016);renderer.render(scene,camera);$('enter').disabled=false;$('enter').textContent='책숲으로 들어가기 →';requestAnimationFrame(tick);resumeWorldTravel();
})();
