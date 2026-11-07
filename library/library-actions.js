// Tiny original stories are bundled locally; no text or AI service is called.
const BOOKS=[
 {title:'별빛 산책',color:0x929ab7,pages:[
  '길을 잃은 별 하나가 창가에 내려앉았어요. 나는 불을 조금 낮추고, 별이 쉬어갈 자리를 내주었어요.',
  '별은 하늘로 돌아가는 길을 잊었다고 했어요. 우리는 지도 대신 따뜻한 차를 사이에 두고 잠시 말없이 앉아 있었어요.',
  '밤이 깊어지자 창밖에서 작은 빛들이 하나둘 켜졌어요. 별은 친구들의 불빛을 알아보고, 아주 천천히 몸을 일으켰어요.',
  '나는 창문을 열어주었어요. 별은 고맙다는 말 대신 내 손바닥에 조그만 반짝임 하나를 남기고 하늘로 올라갔어요.',
  '그날부터 길을 잃은 밤이면 잠깐 쉬어가기로 했어요. 돌아갈 곳을 찾는 일은, 나를 기다리는 빛을 알아보는 일이었으니까요. 끝.'
 ]},
 {title:'작은 숲의 편지',color:0x91aa91,pages:[
  '숲은 매일 다른 모양의 편지를 보냈어요. 오늘의 편지는 바람에 접힌 나뭇잎 한 장이었어요.',
  '나뭇잎에는 아무 글자도 없었지만, 코끝에 젖은 흙 냄새가 닿았어요. 나는 장화를 신고 편지가 온 길을 따라 걸었어요.',
  '오래된 나무 아래에 작은 싹이 돋아 있었어요. 어제까지 비어 있던 자리였어요. 나는 그 곁에 앉아 빗방울 하나가 떨어지는 것을 보았어요.',
  '답장을 어떻게 쓸까 한참 생각했어요. 결국 주변의 마른 가지를 치우고, 싹 옆에 작은 돌을 놓아 길을 내주었어요.',
  '다음 날 편지는 새소리였어요. 나는 이제 읽을 수 있었어요. 숲은 늘 말하고 있었고, 나는 조금 천천히 듣는 법을 배운 거예요. 끝.'
 ]},
 {title:'고요한 파도',color:0xc9a18f,pages:[
  '파도는 멀리 가는 법보다 돌아오는 법을 잘 알았어요. 오늘은 나도 서두르지 않고, 제자리에서 반짝여 보기로 했어요.',
  '해변에서 가장 작은 조개를 주웠어요. 귀에 대자 큰 바다 대신 내 숨소리가 들렸어요. 나는 숨을 조금 길게 내쉬었어요.',
  '물결 하나가 발끝까지 왔다가 물러갔어요. 나는 어디까지 가야 하냐고 물었지만, 파도는 발자국을 부드럽게 지워줄 뿐이었어요.',
  '해가 낮아질 때까지 조개와 함께 앉아 있었어요. 아무것도 이루지 않은 줄 알았는데, 어깨가 아침보다 가벼워져 있었어요.',
  '나는 조개를 모래 위에 돌려놓고 집으로 향했어요. 멀리 가지 않은 날에도 마음은 돌아올 수 있었어요. 바다는 내일도 거기 있을 거예요. 끝.'
 ]}
];
const WRITING_DURATION=5.6,STAMP_MOMENT=2.1,READING_TURN_DURATION=.75;
const bookIndexFromWire=value=>clamp(Math.floor((clamp(value,0,.7)+.00001)/.2),0,2);
const readingPageFromWire=value=>clamp(Math.floor((value-bookIndexFromWire(value)*.2+.00001)/.03),0,BOOKS[bookIndexFromWire(value)].pages.length-1);
const readingWireState=(index,page,time,direction)=>index*.2+page*.03+(direction<0?.015:0)+clamp(time/READING_TURN_DURATION,0,1)*.012;
function readingTurnFromWire(value){const fraction=value-bookIndexFromWire(value)*.2-readingPageFromWire(value)*.03,direction=fraction>=.014?-1:1,progress=clamp((fraction-(direction<0?.015:0))/.012,0,1);return{time:(progress>1-1e-5?1:progress)*READING_TURN_DURATION,direction};}
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
function animateBookPose(actor,state,index,time,phase,direction=1){
 const book=setBook(actor,index);book.root.visible=true;
 book.root.position.set(0,state==='writing'?1.03:.94,state==='writing'?.65:.72);book.root.rotation.set(state==='writing'?.1:.16,0,0);book.root.scale.setScalar(state==='writing'?1:.9);
 actor.head.rotation.x=state==='writing'?.24:.21+Math.sin(phase*.6)*.025;
 actor.arms[0].rotation.set(-1.66,0,.3);actor.arms[1].rotation.set(-1.66,0,-.3);actor.legs.forEach(leg=>leg.rotation.x=0);
 if(state==='reading'){
  actor.legs.forEach((leg,i)=>leg.rotation.x=-1.28+Math.sin(phase*1.7+i*.5)*.025);
  actor.arms[0].rotation.x=-1.42;actor.arms[1].rotation.x=-1.42;
  if(actor.heldStamp)actor.heldStamp.root.visible=false;
  const turn=clamp(time/READING_TURN_DURATION,0,1);book.turn.rotation.z=turn>=.995?0:(direction<0?1-turn:turn)*Math.PI;actor.arms[direction<0?0:1].rotation.x+=Math.sin(turn*Math.PI)*.32;
 }else{
  book.turn.rotation.z=0;const stamp=ensureStamp(actor),stroke=Math.exp(-Math.pow((time-STAMP_MOMENT)/.25,2));stamp.root.visible=true;stamp.root.position.set(.28,1.43-stroke*.35,.66);stamp.root.rotation.x=.05;stamp.mark.visible=time+1e-6>=STAMP_MOMENT;actor.arms[1].rotation.x=-2.1+stroke*.48;
 }
}
function remoteWritingTime(peer,dt){const target=writingTimeFromWire(peer.data.b);if(peer.writingTime==null||target<peer.writingTime-.4)peer.writingTime=target;else peer.writingTime=lerp(peer.writingTime,target,1-Math.exp(-dt*16));return peer.writingTime;}
function remoteReadingTurn(peer,dt){const target=readingTurnFromWire(peer.data.b),key=bookIndexFromWire(peer.data.b)+'_'+readingPageFromWire(peer.data.b)+'_'+target.direction;if(peer.readingKey!==key||peer.readingTime==null||target.time<peer.readingTime-.3)peer.readingTime=target.time;else peer.readingTime=lerp(peer.readingTime,target.time,1-Math.exp(-dt*18));peer.readingKey=key;return{time:peer.readingTime,direction:target.direction};}
function normalizedMemories(data){return Array.isArray(data)?data.filter(m=>m&&Number.isInteger(m.book)&&m.book>=0&&m.book<3&&Number.isFinite(m.created)&&m.created>0&&m.created<=Date.now()+1000&&typeof m.name==='string').sort((a,b)=>a.created-b.created).slice(-30).map(m=>({book:m.book,created:m.created,name:m.name.slice(0,12)})):[];}
function finishBookmark(){setTimeout(()=>{if(typeof villageJournal==='object')villageJournal.sync();},0);
 memories.push({book:selectedBook,created:Date.now(),name:nickname});memories=memories.slice(-30);save();drawMemoryBoard();stopActivity();toast('작은 책갈피 한 장을 남겼어요');
}
const memoryCanvas=document.createElement('canvas');memoryCanvas.width=512;memoryCanvas.height=448;const memoryTexture=new THREE.CanvasTexture(memoryCanvas);memoryTexture.colorSpace=THREE.SRGBColorSpace;
const memoryBoard=mesh(new THREE.PlaneGeometry(2.12,1.85),new THREE.MeshBasicMaterial({map:memoryTexture}),world,13.2,1.7,1.37);
function drawMemoryBoard(){const ctx=memoryCanvas.getContext('2d');ctx.fillStyle='#d2c2a2';ctx.fillRect(0,0,512,448);ctx.textAlign='center';ctx.fillStyle='#6c5355';ctx.font='33px "Malgun Gothic",sans-serif';ctx.fillText('작은 책갈피',256,62);const rows=memories.slice(-3).reverse();if(!rows.length){ctx.font='22px "Malgun Gothic",sans-serif';ctx.fillText('오늘의 한 페이지를 남겨요',256,226);}rows.forEach((m,i)=>{ctx.fillStyle=['#a4b19a','#c2a0a4','#aaa7bd'][m.book];ctx.fillRect(38,100+i*104,436,82);ctx.fillStyle='#fff6e1';ctx.font='26px "Malgun Gothic",sans-serif';ctx.fillText(BOOKS[m.book].title,256,136+i*104);ctx.font='18px "Malgun Gothic",sans-serif';ctx.fillText(m.name+'의 책갈피',256,166+i*104);});memoryTexture.needsUpdate=true;}
function openMemories(){
 const list=$('memory-list');list.replaceChildren();$('memory-empty').hidden=memories.length>0;for(const item of memories.slice().reverse()){const row=document.createElement('li'),title=document.createElement('strong'),note=document.createElement('span');title.textContent=BOOKS[item.book].title;note.textContent=new Date(item.created).toLocaleDateString('ko-KR',{month:'long',day:'numeric'})+' · '+item.name;row.append(title,note);list.append(row);}$('memory-modal').hidden=false;keys.clear();$('close-memories').focus();
}
function closeMemories(){$('memory-modal').hidden=true;renderer.domElement.focus({preventScroll:true});}
