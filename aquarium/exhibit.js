// A friend-group exhibit tank: creatures met anywhere in the village can be donated through Harry, and each one swims here with its donor's name.
// 을/를 by whether the last syllable has a final consonant.
function objectParticle(name){const code=name.charCodeAt(name.length-1)-0xac00;return name+(code>=0&&code<11172&&code%28?'을':'를');}
function createExhibit(){
 const TANK={x:12.8,z:-7.6,r:1.25},VIEW={x:12.6,z:-5.4};
 const LOOKS={smelt:[0xc9d8e0,'fish',.7],minnow:[0xb7a88a,'fish',.6],trout:[0xa98f7c,'fish',1.1],'cherry-salmon':[0xc49a8c,'fish',1],lenok:[0x9b8f86,'fish',1.2],bullhead:[0x8f7f62,'fish',.9],'snow-loach':[0xe9eef2,'eel',.8],'star-smelt':[0xd9e4ff,'fish',.75],
  clownfish:[0xe99a5c,'fish',.7],filefish:[0xe6cf73,'fish',.8],seahorse:[0xe0b47c,'horse',.8],sardine:[0xb8c7cf,'fish',.6],turtle:[0x7f9c7c,'turtle',1.3],'moon-jelly':[0xe7ecf5,'jelly',.9],'lantern-jelly':[0xffd8a8,'jelly',.8],
  sparrow:[0xa48a6c,'bird',.7],'moon-moth':[0xd8d2bd,'moth',.7],'rain-snail':[0xb59a83,'snail',.6]};
 const tank=new THREE.Group();tank.name='exhibit-tank';tank.position.set(TANK.x,0,TANK.z);scene.add(tank);
 mesh(geom.cyl,0x5f6f7a,tank,0,.22,0,TANK.r+.1,.44,TANK.r+.1);mesh(geom.cyl,0xd9c9a2,tank,0,.47,0,TANK.r,.06,TANK.r);
 const water=new THREE.Mesh(geom.cyl,new THREE.MeshLambertMaterial({color:0x8fd3e0,transparent:true,opacity:.32,depthWrite:false}));water.position.y=1.45;water.scale.set(TANK.r,1.9,TANK.r);tank.add(water);
 mesh(new THREE.TorusGeometry(1,.035,6,40),0xd8e9ea,tank,0,2.42,0,TANK.r,TANK.r,1).rotation.x=Math.PI/2;block(TANK.x,TANK.z,TANK.r+.12);
 const sign=nameSprite('함께 꾸민 전시 수조');sign.position.set(0,3.05,0);tank.add(sign);
 const swimmers=new Map();
 function model(id){const[color,kind,s]=LOOKS[id]||[0xcccccc,'fish',.8],g=new THREE.Group();g.name='exhibit-'+id;
  if(kind==='jelly'){const m=new THREE.Mesh(geom.ball,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.7}));m.scale.set(.16,.12,.16);g.add(m);for(let i=0;i<3;i++)mesh(geom.cyl,color,g,(i-1)*.05,-.13,0,.008,.16,.008);}
  else if(kind==='turtle'){sphere(g,color,0,0,0,.22,.08,.17);sphere(g,0x9fb89a,0,0,.2,.06);}
  else if(kind==='horse'){sphere(g,color,0,0,0,.05,.13,.05);sphere(g,color,0,.13,.04,.05,.045,.07);}
  else if(kind==='eel'){sphere(g,color,0,0,0,.035,.035,.22);}
  else if(kind==='bird'||kind==='moth'){sphere(g,color,0,0,0,.07,.06,.09);for(const x of[-1,1]){const w=sphere(g,color,x*.09,.02,0,.08,.012,.06);w.rotation.z=x*.3;}}
  else if(kind==='snail'){sphere(g,color,0,.04,0,.07);sphere(g,0xd8c4a8,0,-.02,.05,.03,.025,.09);}
  else{sphere(g,color,0,0,0,.06,.06,.16);const t=mesh(geom.cone,color,g,0,0,-.19,.06,.1,.02);t.rotation.x=-Math.PI/2;}
  g.scale.setScalar(s);return g;}
 let exhibits={};
 function rebuild(next){exhibits=next||{};for(const[id,g]of swimmers)if(!exhibits[id]){tank.remove(g);swimmers.delete(id);}let i=0;for(const id of Object.keys(exhibits).sort()){if(!LOOKS[id])continue;if(!swimmers.has(id)){const g=model(id);g.userData.seed=i*1.7+.4;tank.add(g);swimmers.set(id,g);}i++;}sign.visible=true;}
 villageStore.subscribe('exhibits',rebuild);
 // Calm loops inside the glass; jellies drift up and down instead.
 function tick(t){let i=0;for(const[id,g]of swimmers){const seed=g.userData.seed,kind=(LOOKS[id]||[])[1],r=.35+((i*.37)%.6),a=t*(.25+(i%3)*.06)+seed;i++;if(kind==='jelly'){g.position.set(Math.cos(seed)*r,1.3+Math.sin(t*.5+seed)*.5,Math.sin(seed)*r);continue;}if(kind==='turtle'||kind==='snail'||kind==='horse'){g.position.set(Math.cos(a*.5)*r,kind==='horse'?1.2+Math.sin(t+seed)*.1:.62,Math.sin(a*.5)*r);g.rotation.y=-a*.5;continue;}g.position.set(Math.cos(a)*r,.9+((seed*3)%1)*1.1+Math.sin(t*.8+seed)*.08,Math.sin(a)*r);g.rotation.y=-a+Math.PI;}}
 // Donation sheet: everything this visitor has met and the group has not yet shown.
 const dialog=document.createElement('section');dialog.className='creature-book exhibit-donate';dialog.hidden=true;dialog.setAttribute('aria-label','전시 수조에 기증하기');
 const card=document.createElement('div');card.className='creature-book-card';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');
 const title=document.createElement('h2');title.textContent='전시 수조에 기증하기';const note=document.createElement('p');note.className='creature-count';const list=document.createElement('ul');const shown=document.createElement('ul');const shownTitle=document.createElement('h3');shownTitle.textContent='전시 중';
 const closeButton=document.createElement('button');closeButton.className='creature-book-close';closeButton.textContent='×';closeButton.setAttribute('aria-label','기증 창 닫기');card.append(closeButton,title,note,list,shownTitle,shown);dialog.append(card);document.body.append(dialog);
 function close(){dialog.hidden=true;}closeButton.addEventListener('click',close);dialog.addEventListener('click',e=>{if(e.target===dialog)close();});addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialog.hidden)close();});
 function render(){const met=creatureBook.entries(),pages=creatureBook.ENTRIES,ready=pages.filter(p=>met[p.id]&&!exhibits[p.id]);note.textContent=villageStore.mode==='shared'?'기증하면 친구들 화면의 수조에도 함께 헤엄쳐요.':'지금은 이 브라우저의 수조에만 보여요. 공유 저장이 켜지면 친구와 함께 봐요.';
  list.replaceChildren(...(ready.length?ready.map(p=>{const item=document.createElement('li'),b=document.createElement('button');b.className='resident-next';b.textContent=p.name+' 기증하기';b.addEventListener('click',()=>donate(p.id));item.append(b);return item;}):[Object.assign(document.createElement('li'),{className:'unseen',textContent:'도감에서 만난 생물 중 기증할 수 있는 친구가 아직 없어요.'})]));
  shown.replaceChildren(...Object.values(exhibits).sort((a,b)=>a.t-b.t).map(e=>Object.assign(document.createElement('li'),{className:'seen',textContent:(pages.find(p=>p.id===e.c)||{name:e.c}).name+' · '+e.n+' 님'})));}
 async function donate(id){if(exhibits[id]||!creatureBook.entries()[id])return null;const page=creatureBook.ENTRIES.find(p=>p.id===id),result=await villageStore.put('exhibits',id,{c:id,n:nickname,u:villageStore.uid(),t:Date.now()});if(typeof villageJournal==='object')villageJournal.note('first-donation');toast(objectParticle(page.name)+' 전시 수조에 기증했어요'+(result==='shared'?'':' · 이 브라우저에만 보여요'));render();return result;}
 function open(){if(!entered)return;render();dialog.hidden=false;closeButton.focus();}
 if(residentGuide.addAction)residentGuide.addAction('전시 수조에 기증하기',()=>{residentGuide.close();open();});
 return{TANK,VIEW,LOOKS,tick,open,close,donate,isOpen:()=>!dialog.hidden,swimmers,get exhibits(){return exhibits;}};
}
const exhibit=createExhibit();
