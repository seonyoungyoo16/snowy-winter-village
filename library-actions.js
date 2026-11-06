// Tiny original stories are bundled locally; no text or AI service is called.
const BOOKS=[
 {title:'별빛 산책',color:0x929ab7,line:'길을 잃은 별 하나가 창가에 내려앉았어요. 나는 불을 조금 낮추고, 별이 쉬어갈 자리를 내주었어요.'},
 {title:'작은 숲의 편지',color:0x91aa91,line:'숲은 매일 다른 모양의 편지를 보냈어요. 오늘의 편지는 바람에 접힌 나뭇잎 한 장이었어요.'},
 {title:'고요한 파도',color:0xc9a18f,line:'파도는 멀리 가는 법보다 돌아오는 법을 잘 알았어요. 오늘은 나도 서두르지 않고, 제자리에서 반짝였어요.'}
];
const WRITING_DURATION=5.6,STAMP_MOMENT=2.1;
const bookIndexFromWire=value=>clamp(Math.floor((clamp(value,0,.7)+.00001)/.2),0,2);
const writingWireProgress=(index,time)=>index*.2+clamp(time/WRITING_DURATION,0,1)*.19;
const writingTimeFromWire=value=>clamp((value-bookIndexFromWire(value)*.2)/.19,0,1)*WRITING_DURATION;
function ensureBook(actor){
 if(actor.heldBook)return actor.heldBook;
 const root=new THREE.Group();root.name='open-story-book';const covers=[];
 for(const side of[-1,1]){const cover=box(root,BOOKS[0].color,side*.255,-.035,0,.51,.035,.63);cover.rotation.z=side*.06;covers.push(cover);const page=box(root,0xf3e4c5,side*.25,.015,0,.48,.065,.58);page.rotation.z=side*.06;for(let i=0;i<4;i++)box(root,0xd2c4aa,side*.25,.054,-.15+i*.09,.29,.006,.008);}
 const spine=box(root,BOOKS[0].color,0,-.035,0,.05,.06,.64);covers.push(spine);
 const turn=new THREE.Group();turn.position.y=.07;root.add(turn);box(turn,0xf7ebd1,.24,0,0,.47,.01,.57);
 root.visible=false;actor.body.add(root);actor.heldBook={root,covers,turn,index:-1};return actor.heldBook;
}
function setBook(actor,index){const book=ensureBook(actor);if(book.index!==index){book.index=index;book.covers.forEach(cover=>cover.material=mat(BOOKS[index].color));}return book;}
function ensureStamp(actor){
 if(actor.heldStamp)return actor.heldStamp;
 const root=new THREE.Group();root.name='little-bookmark-stamp';mesh(geom.cyl,0x7b5e4f,root,0,0,0,.14,.08,.14);mesh(geom.cyl,0xc3a17c,root,0,.15,0,.07,.25,.07);sphere(root,0xb48b6e,0,.28,0,.11,.08,.11);mergeModel(root);
 const mark=box(ensureBook(actor).root,mat(0xe9c987,true),-.22,.085,.08,.09,.012,.4);mark.visible=false;root.visible=false;actor.body.add(root);actor.heldStamp={root,mark};return actor.heldStamp;
}
function hideBookProps(actor){if(actor.heldBook)actor.heldBook.root.visible=false;if(actor.heldStamp)actor.heldStamp.root.visible=false;actor.head.rotation.x=0;}
function animateBookPose(actor,state,index,time,phase){
 const book=setBook(actor,index);book.root.visible=true;
 book.root.position.set(0,state==='writing'?1.03:.94,state==='writing'?.65:.72);book.root.rotation.set(state==='writing'?.1:.16,0,0);book.root.scale.setScalar(state==='writing'?1:.9);
 actor.head.rotation.x=state==='writing'?.24:.21+Math.sin(phase*.6)*.025;
 actor.arms[0].rotation.set(-1.66,0,.3);actor.arms[1].rotation.set(-1.66,0,-.3);actor.legs.forEach(leg=>leg.rotation.x=0);
 if(state==='reading'){
  actor.arms[0].rotation.x=-1.42;actor.arms[1].rotation.x=-1.42;
  if(actor.heldStamp)actor.heldStamp.root.visible=false;
  const turn=clamp((phase%7-5.3)/1.15,0,1);book.turn.rotation.z=turn*Math.PI;actor.arms[1].rotation.x+=Math.sin(turn*Math.PI)*.32;
 }else{
  book.turn.rotation.z=0;const stamp=ensureStamp(actor),stroke=Math.exp(-Math.pow((time-STAMP_MOMENT)/.25,2));stamp.root.visible=true;stamp.root.position.set(.28,1.43-stroke*.35,.66);stamp.root.rotation.x=.05;stamp.mark.visible=time+1e-6>=STAMP_MOMENT;actor.arms[1].rotation.x=-2.1+stroke*.48;
 }
}
function remoteWritingTime(peer,dt){const target=writingTimeFromWire(peer.data.b);if(peer.writingTime==null||target<peer.writingTime-.4)peer.writingTime=target;else peer.writingTime=lerp(peer.writingTime,target,1-Math.exp(-dt*16));return peer.writingTime;}
function normalizedMemories(data){return Array.isArray(data)?data.filter(m=>m&&Number.isInteger(m.book)&&m.book>=0&&m.book<3&&Number.isFinite(m.created)&&m.created>0&&m.created<=Date.now()+1000&&typeof m.name==='string').sort((a,b)=>a.created-b.created).slice(-30).map(m=>({book:m.book,created:m.created,name:m.name.slice(0,12)})):[];}
function finishBookmark(){
 memories.push({book:selectedBook,created:Date.now(),name:nickname});memories=memories.slice(-30);save();drawMemoryBoard();stopActivity();toast('작은 책갈피 한 장을 남겼어요');
}
const memoryCanvas=document.createElement('canvas');memoryCanvas.width=512;memoryCanvas.height=448;const memoryTexture=new THREE.CanvasTexture(memoryCanvas);memoryTexture.colorSpace=THREE.SRGBColorSpace;
const memoryBoard=mesh(new THREE.PlaneGeometry(2.12,1.85),new THREE.MeshBasicMaterial({map:memoryTexture}),world,13.2,1.7,1.37);
function drawMemoryBoard(){const ctx=memoryCanvas.getContext('2d');ctx.fillStyle='#d2c2a2';ctx.fillRect(0,0,512,448);ctx.textAlign='center';ctx.fillStyle='#6c5355';ctx.font='33px "Malgun Gothic",sans-serif';ctx.fillText('작은 책갈피',256,62);const rows=memories.slice(-3).reverse();if(!rows.length){ctx.font='22px "Malgun Gothic",sans-serif';ctx.fillText('오늘의 한 페이지를 남겨요',256,226);}rows.forEach((m,i)=>{ctx.fillStyle=['#a4b19a','#c2a0a4','#aaa7bd'][m.book];ctx.fillRect(38,100+i*104,436,82);ctx.fillStyle='#fff6e1';ctx.font='26px "Malgun Gothic",sans-serif';ctx.fillText(BOOKS[m.book].title,256,136+i*104);ctx.font='18px "Malgun Gothic",sans-serif';ctx.fillText(m.name+'의 책갈피',256,166+i*104);});memoryTexture.needsUpdate=true;}
function openMemories(){
 const list=$('memory-list');list.replaceChildren();$('memory-empty').hidden=memories.length>0;for(const item of memories.slice().reverse()){const row=document.createElement('li'),title=document.createElement('strong'),note=document.createElement('span');title.textContent=BOOKS[item.book].title;note.textContent=new Date(item.created).toLocaleDateString('ko-KR',{month:'long',day:'numeric'})+' · '+item.name;row.append(title,note);list.append(row);}$('memory-modal').hidden=false;keys.clear();$('close-memories').focus();
}
function closeMemories(){$('memory-modal').hidden=true;renderer.domElement.focus({preventScroll:true});}
