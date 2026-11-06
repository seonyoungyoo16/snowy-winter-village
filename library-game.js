const targetRing=mesh(new THREE.RingGeometry(.24,.3,32),mat(0xf6e2b1,true,.7),scene,0,.045,0);targetRing.rotation.x=-Math.PI/2;targetRing.visible=false;let ringTimer=0;
let entered=false,nickname='책숲 손님',mode='idle',path=[],pendingReadingSeat=null,readingSeat=null,selectedBook=0,memories=[],writingTime=0,waveTime=0,elapsed=0,oldTime=performance.now(),toastTimer,uiKey='',cameraYaw=0,cameraYawTarget=0,camZoom=1;
let stored;try{stored=JSON.parse(localStorage.getItem(KEY)||'null');}catch{}
if(stored&&typeof stored==='object'){nickname=typeof stored.nickname==='string'?stored.nickname.slice(0,12):nickname;chooseCharacter(clamp(Math.trunc(Number(stored.character)||0),0,2));selectedBook=clamp(Math.trunc(Number(stored.book)||0),0,2);memories=normalizedMemories(stored.memories);$('nickname').value=nickname;}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3200);}
function save(){try{localStorage.setItem(KEY,JSON.stringify({version:1,nickname,character:selected,book:selectedBook,memories}));}catch{toast('이 브라우저에서는 책갈피를 저장할 수 없어요');}}
const places={books:{x:-10,z:-4.3,yaw:-.18},window:{x:9.5,z:-7.9,yaw:-.2},desk:{x:9,z:3.25,yaw:0}};
function distance(p){return Math.hypot(player.position.x-p.x,player.position.z-p.z);}
function stopActivity(){if(readingSeat)player.position.set(readingSeat.approach.x,0,readingSeat.approach.z);readingSeat=null;pendingReadingSeat=null;path=[];mode='idle';writingTime=0;hideBookProps(character);character.body.position.y=0;player.position.y=0;uiKey='';publishState(true);}
function navigate(x,z){if(!entered)return;if(mode==='wave')return;if(mode!=='idle'||pendingReadingSeat)stopActivity();path=pathTo(x,z);if(!path.length&&Math.hypot(player.position.x-x,player.position.z-z)>1){toast('조금 더 가까운 바닥을 눌러주세요');return;}const end=path.at(-1)||player.position;targetRing.position.set(end.x,.045,end.z);targetRing.visible=true;ringTimer=1.5;}
function travel(place){const p=places[place];if(!p)return;cameraYawTarget=p.yaw;navigate(p.x,p.z);document.querySelectorAll('[data-place]').forEach(b=>b.classList.toggle('active',b.dataset.place===place));}
// Walking reservations reuse the existing bounded progress field; no database rule changes.
function reservedReadingSeat(data){if(data.m!=='walk')return -1;const index=Math.round((data.b-.6)/.02);return index>=0&&index<readingSeats.length&&Math.abs(data.b-(.6+index*.02))<.004?index:-1;}
function readingSeatAvailable(seat,keepClaim=false){return Array.from(remotePlayers.values()).every(peer=>{
 const d=peer.data;if(Date.now()+serverOffset-d.t>STALE_MS)return true;
 if(Math.hypot(d.x-seat.x,d.z-seat.z)<1)return false;
 return reservedReadingSeat(d)!==seat.index||(keepClaim&&sessionKey.localeCompare(peer.id)<0);
});}
function startReading(){
 if(mode!=='idle')stopActivity();pendingReadingSeat=null;
 const seats=readingSeats.filter(s=>readingSeatAvailable(s)).sort((a,b)=>distance(a.approach)-distance(b.approach));
 for(const seat of seats){const route=pathTo(seat.approach.x,seat.approach.z);if(!route.length&&distance(seat.approach)>.15)continue;pendingReadingSeat=seat;path=route;uiKey='';updateUI();publishState(true);return;}
 path=[];uiKey='';updateUI();toast('지금은 독서 자리가 가득해요');
}
function updateReadingWalk(){
 if(!pendingReadingSeat)return;
 if(!readingSeatAvailable(pendingReadingSeat,true)){startReading();return;}
 if(path.length)return;
 readingSeat=pendingReadingSeat;pendingReadingSeat=null;mode='reading';player.position.set(readingSeat.x,.2,readingSeat.z);player.rotation.y=readingSeat.a;cameraYawTarget=readingSeat.a+1.3;targetRing.visible=false;uiKey='';updateUI();publishState(true);
}
function nextBook(){selectedBook=(selectedBook+1)%BOOKS.length;save();uiKey='';updateUI();publishState(true);}
function startRest(){const seats=windowSeats.filter(s=>Array.from(remotePlayers.values()).every(p=>Math.hypot(p.data.x-s.x,p.data.z-s.z)>.9)).sort((a,b)=>distance(a)-distance(b));if(!seats.length){toast('창가 자리가 잠깐 가득해요');return;}const s=seats[0];mode='rest';path=[];player.position.set(s.x,.08,s.z);player.rotation.y=s.a;cameraYawTarget=-.65;uiKey='';toast('달빛과 책 냄새 사이에서 잠깐 쉬어요');}
function startWriting(){mode='writing';writingTime=0;path=[];player.rotation.y=.25;cameraYawTarget=-.6;uiKey='';updateUI();publishState(true);}
function wave(){if(!entered||mode==='writing'||mode==='wave')return;stopActivity();mode='wave';waveTime=0;path=[];uiKey='';toast('조용히, 반가운 인사를 건네요');}
function action(){if(!entered)return;if(mode==='reading'||mode==='rest'||pendingReadingSeat){stopActivity();updateUI();return;}if(mode==='writing'||mode==='wave')return;if(distance(places.desk)<2)startWriting();else if(distance(places.window)<3.5)startRest();else if(distance(places.books)<3.2||readingSeats.some(s=>distance(s.approach)<1.7))startReading();else travel('books');updateUI();}
function updateUI(){
 const books=distance(places.books)<3.2||readingSeats.some(s=>distance(s.approach)<1.7),windowSeat=distance(places.window)<3.5,desk=distance(places.desk)<2,going=!!pendingReadingSeat,k=[mode,books,windowSeat,desk,selectedBook,going].join('_');if(k===uiKey)return;uiKey=k;
 $('main-action').disabled=mode==='writing'||mode==='wave'||going;$('wave-action').hidden=mode!=='idle'||desk||going;$('memory-action').hidden=mode!=='idle'||!desk||going;$('next-book').hidden=mode!=='reading';$('cancel-action').hidden=mode!=='writing'&&!going;$('reading-card').hidden=mode!=='reading';
 $('book-title').textContent=BOOKS[selectedBook].title;$('book-line').textContent=BOOKS[selectedBook].line;
 $('main-text').textContent=going?'독서 자리로 가는 중…':mode==='reading'?'책 덮고 일어나기':mode==='rest'?'천천히 일어나기':mode==='writing'?'책갈피를 남기는 중…':mode==='wave'?'조용한 인사':desk?'책갈피 남기기':windowSeat?'창가에 앉아 쉬기':books?'탁자에 앉아 읽기':'책 고르러 가기';
 $('hint').textContent=going?'둥근 탁자의 빈 의자로 걸어가요':mode==='reading'?'의자에 앉아 한 페이지씩, 천천히':mode==='rest'?'오늘은 달빛 곁에 잠깐 앉아 있어요':mode==='writing'?'오늘 마음에 닿은 한 페이지를 남겨요':mode==='wave'?'친구에게도 인사하는 모습이 보여요':desk?'지금 고른 책의 책갈피를 남겨볼까요?':windowSeat?'따뜻한 창가 자리가 기다려요':books?'마음에 닿는 작은 이야기를 골라요':'가고 싶은 바닥을 톡 눌러보세요';
}
function animatePose(dt,moving,actor=character,state=mode,phase=elapsed,actionTime=writingTime,bookIndex=selectedBook){
 const arms=actor.arms,legs=actor.legs;let y=moving?Math.sin(phase*9)*.05:Math.sin(phase*1.6)*.012,pitch=0;
 if(state==='reading'||state==='writing'){animateBookPose(actor,state,bookIndex,actionTime,phase);pitch=.06;y=Math.sin(phase*1.5)*.009;}
 else{hideBookProps(actor);if(state==='rest'){y=.12+Math.sin(phase*1.4)*.01;pitch=.025;arms[0].rotation.set(-.25,0,-.12);arms[1].rotation.set(-.25,0,.12);legs.forEach(l=>l.rotation.x=-1.3);actor.head.rotation.x=-.06;}
 else if(state==='wave'){arms[0].rotation.set(-.1,0,-.12);arms[1].rotation.set(-.2,0,2.4+Math.sin(phase*7)*.2);legs.forEach(l=>l.rotation.x=0);}
 else{arms.forEach((a,i)=>a.rotation.set(moving?Math.sin(phase*9+i*Math.PI+Math.PI)*.44:Math.sin(phase*1.7+i)*.025,0,i===0?-.15:.15));legs.forEach((l,i)=>l.rotation.x=moving?Math.sin(phase*9+i*Math.PI)*.55:0);}}
 actor.body.position.y=lerp(actor.body.position.y,y,1-Math.exp(-dt*12));actor.body.rotation.x=lerp(actor.body.rotation.x,pitch,1-Math.exp(-dt*10));actor.head.rotation.z=Math.sin(phase*.8)*.018;
}
function helpOpen(){return !$('help-modal').hidden||!$('invite-modal').hidden||!$('memory-modal').hidden;}
function closeHelp(){$('help-modal').hidden=true;$('help').focus();}
$('help').addEventListener('click',()=>{$('help-modal').hidden=false;keys.clear();$('close-help').focus();});$('close-help').addEventListener('click',closeHelp);$('return-village').addEventListener('click',closeHelp);$('help-modal').addEventListener('click',e=>{if(e.target===$('help-modal'))closeHelp();});
$('memory-action').addEventListener('click',openMemories);$('close-memories').addEventListener('click',closeMemories);$('memory-modal').addEventListener('click',e=>{if(e.target===$('memory-modal'))closeMemories();});
$('entry-form').addEventListener('submit',e=>{e.preventDefault();if(entered)return;nickname=$('nickname').value.trim().replace(/[\u0000-\u001f\u007f]/g,'').slice(0,12)||'책숲 손님';entered=true;$('welcome').hidden=true;for(const id of['controls','status','keyboard'])$(id).hidden=false;$('nickname-label').textContent=nickname;save();updateUI();toast('어서 와요, '+nickname+' 님');renderer.domElement.focus({preventScroll:true});startNetwork();});document.querySelectorAll('[data-character]').forEach(b=>b.addEventListener('click',()=>chooseCharacter(Number(b.dataset.character))));
$('main-action').addEventListener('click',action);$('cancel-action').addEventListener('click',()=>{stopActivity();updateUI();});$('wave-action').addEventListener('click',wave);$('next-book').addEventListener('click',nextBook);document.querySelectorAll('[data-place]').forEach(b=>b.addEventListener('click',()=>travel(b.dataset.place)));
