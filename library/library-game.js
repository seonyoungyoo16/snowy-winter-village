const targetRing=mesh(new THREE.RingGeometry(.24,.3,32),mat(0xf6e2b1,true,.7),scene,0,.045,0);targetRing.rotation.x=-Math.PI/2;targetRing.visible=false;let ringTimer=0;
let entered=false,nickname='책숲 손님',mode='idle',path=[],pendingBookShelf=false,pendingReadingSeat=null,pendingCatAction=null,catActionType=0,catActionTime=0,catWakeStarted=0,readingSeat=null,restSeat=null,selectedBook=0,readingPages=[0,0,0],completedBooks=new Set(),finishedPromptBook=null,readingTurnTime=READING_TURN_DURATION,readingTurnDirection=1,memories=[],writingTime=0,waveTime=0,elapsed=0,oldTime=performance.now(),toastTimer,uiKey='',cameraYaw=0,cameraYawTarget=0,camZoom=1;
let stored;try{stored=JSON.parse(localStorage.getItem(KEY)||'null');}catch{}
if(stored&&typeof stored==='object'){nickname=typeof stored.nickname==='string'?stored.nickname.slice(0,12):nickname;chooseCharacter(clamp(Math.trunc(Number(stored.character)||0),0,2));selectedBook=clamp(Math.trunc(Number(stored.book)||0),0,2);memories=normalizedMemories(stored.memories);$('nickname').value=nickname;}
if(stored&&typeof stored==='object'){if(Array.isArray(stored.readingPages))readingPages=BOOKS.map((b,i)=>clamp(Math.trunc(Number(stored.readingPages[i])||0),0,b.pages.length-1));if(Array.isArray(stored.completedBooks))completedBooks=new Set(stored.completedBooks.filter(i=>Number.isInteger(i)&&i>=0&&i<BOOKS.length));}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3200);}
function save(){try{localStorage.setItem(KEY,JSON.stringify({version:1,nickname,character:selected,book:selectedBook,readingPages,completedBooks:[...completedBooks],memories}));}catch{toast('이 브라우저에서는 책갈피를 저장할 수 없어요');}}
const places={books:{x:-10,z:-6.1,yaw:-.18},window:{x:11.4,z:-13,yaw:0},desk:{x:9,z:3.25,yaw:0}};
function distance(p){return Math.hypot(player.position.x-p.x,player.position.z-p.z);}
function stopActivity(){const seat=readingSeat||restSeat;if(seat)player.position.set(seat.approach.x,0,seat.approach.z);readingSeat=null;restSeat=null;finishedPromptBook=null;pendingBookShelf=false;$('book-picker').hidden=true;pendingReadingSeat=null;pendingCatAction=null;catActionTime=0;hideCatProps(character);path=[];mode='idle';writingTime=0;hideBookProps(character);character.body.position.y=0;player.position.y=0;uiKey='';publishState(true);}
function navigate(x,z){if(!entered)return;if(mode==='wave')return;if(mode!=='idle'||pendingBookShelf||pendingReadingSeat||pendingCatAction)stopActivity();path=pathTo(x,z);if(!path.length&&Math.hypot(player.position.x-x,player.position.z-z)>1){toast('조금 더 가까운 바닥을 눌러주세요');return;}const end=path.at(-1)||player.position;targetRing.position.set(end.x,.045,end.z);targetRing.visible=true;ringTimer=1.5;}
function travel(place){const p=places[place];if(!p)return;if(place==='books'){startReading();return;}cameraYawTarget=p.yaw;navigate(p.x,p.z);document.querySelectorAll('[data-place]').forEach(b=>b.classList.toggle('active',b.dataset.place===place));}
function startReading(){villageEvent('read');
 if(!entered)return;stopActivity();pendingBookShelf=true;cameraYawTarget=places.books.yaw;path=pathTo(places.books.x,places.books.z);
 if(!path.length&&distance(places.books)>.35){pendingBookShelf=false;toast('책장 앞쪽 바닥을 눌러 다가가 주세요');}
 updateBookShelfWalk();uiKey='';updateUI();publishState(true);
}
function updateBookShelfWalk(){
 if(!pendingBookShelf)return;if(distance(places.books)>.35){if(!path.length){pendingBookShelf=false;uiKey='';toast('책장에 조금 더 가까이 다가가 주세요');}return;}
 pendingBookShelf=false;path=[];player.rotation.y=Math.PI;targetRing.visible=false;
 document.querySelectorAll('[data-book-choice]').forEach(button=>{const index=Number(button.dataset.bookChoice);button.setAttribute('aria-label',BOOKS[index].title+' 고르기');button.querySelector('small').textContent=readingPages[index]===0?BOOKS[index].pages.length+'쪽':(readingPages[index]+1)+'쪽부터 이어 읽기';});
 $('book-picker').hidden=false;keys.clear();$('close-book-picker').focus();uiKey='';updateUI();publishState(true);
}
function closeBookPicker(){$('book-picker').hidden=true;renderer.domElement.focus({preventScroll:true});}
$('close-book-picker').addEventListener('click',closeBookPicker);$('book-picker').addEventListener('click',e=>{if(e.target===$('book-picker'))closeBookPicker();});document.querySelectorAll('[data-book-choice]').forEach(button=>button.addEventListener('click',()=>chooseBook(Number(button.dataset.bookChoice))));
addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('book-picker').hidden)closeBookPicker();});
function chooseBook(index){
 if(!entered||mode!=='idle'||$('book-picker').hidden||distance(places.books)>.65||!Number.isInteger(index)||index<0||index>=BOOKS.length)return;
 selectedBook=index;finishedPromptBook=null;readingTurnTime=READING_TURN_DURATION;readingTurnDirection=1;closeBookPicker();save();walkToReadingSeat();
}
// Walking reservations reuse the existing bounded progress field; no database rule changes.
function reservedReadingSeat(data){if(data.m!=='walk')return -1;const index=Math.round((data.b-.6)/.02);return index>=0&&index<readingSeats.length&&Math.abs(data.b-(.6+index*.02))<.004?index:-1;}
function readingSeatAvailable(seat,keepClaim=false){return Array.from(remotePlayers.values()).every(peer=>{
 const d=peer.data;if(Date.now()+serverOffset-d.t>STALE_MS)return true;
 if(Math.hypot(d.x-seat.x,d.z-seat.z)<1)return false;
 return reservedReadingSeat(d)!==seat.index||(keepClaim&&sessionKey.localeCompare(peer.id)<0);
});}
function walkToReadingSeat(){
 if(mode!=='idle')stopActivity();pendingReadingSeat=null;
 const seats=readingSeats.filter(s=>readingSeatAvailable(s)).sort((a,b)=>distance(a.approach)-distance(b.approach));
 for(const seat of seats){const route=pathTo(seat.approach.x,seat.approach.z);if(!route.length&&distance(seat.approach)>.15)continue;pendingReadingSeat=seat;path=route;uiKey='';updateUI();publishState(true);return;}
 path=[];uiKey='';updateUI();toast('지금은 독서 자리가 가득해요');
}
function updateReadingWalk(){
 if(!pendingReadingSeat)return;
 if(!readingSeatAvailable(pendingReadingSeat,true)){walkToReadingSeat();return;}
 if(path.length)return;
 readingSeat=pendingReadingSeat;pendingReadingSeat=null;mode='reading';readingTurnTime=READING_TURN_DURATION;player.position.set(readingSeat.x,.2,readingSeat.z);player.rotation.y=readingSeat.a;cameraYawTarget=readingSeat.a+1.3;targetRing.visible=false;uiKey='';updateUI();publishState(true);
}
function nextBook(){if(mode==='reading')startReading();}
function turnReadingPage(direction){
 if(mode!=='reading'||readingTurnTime<READING_TURN_DURATION)return;
 const page=readingPages[selectedBook],last=BOOKS[selectedBook].pages.length-1;
 if(direction>0&&page===last&&!completedBooks.has(selectedBook)){completedBooks.add(selectedBook);finishedPromptBook=selectedBook;save();uiKey='';updateUI();return;}
 const next=direction>0&&page===last?0:clamp(page+direction,0,last);if(next===page)return;
 readingPages[selectedBook]=next;finishedPromptBook=null;readingTurnTime=0;readingTurnDirection=direction;save();uiKey='';updateUI();publishState(true);
}
function dismissFinishedPrompt(){finishedPromptBook=null;uiKey='';updateUI();}
function goStamp(){if(mode!=='reading'||finishedPromptBook!==selectedBook)return;stopActivity();travel('desk');updateUI();}
function startRest(){const seats=windowSeats.filter(s=>Array.from(remotePlayers.values()).every(p=>Math.hypot(p.data.x-s.x,p.data.z-s.z)>.9)).sort((a,b)=>distance(a)-distance(b));if(!seats.length){toast('창가 자리가 잠깐 가득해요');return;}const s=seats[0];restSeat=s;mode='rest';creatureBook.observeWindow(skyWeather.state);villageEvent('window');path=[];player.position.set(s.x,.23,s.z);player.rotation.y=s.a;cameraYawTarget=-.12;uiKey='';updateUI();publishState(true);}
function startWriting(){mode='writing';writingTime=0;path=[];player.rotation.y=.25;cameraYawTarget=-.6;uiKey='';updateUI();publishState(true);}
function wave(){if(!entered||mode==='writing'||mode==='wave')return;stopActivity();mode='wave';waveTime=0;path=[];uiKey='';toast('조용히, 반가운 인사를 건네요');}
function action(){if(!entered)return;if(mode==='reading'||mode==='rest'||pendingBookShelf||pendingReadingSeat||pendingCatAction){stopActivity();updateUI();return;}if(mode==='writing'||mode==='wave'||mode==='cat'||mode==='catWake')return;if(distance(places.desk)<2)startWriting();else if(distance(places.window)<3.5)startRest();else startReading();updateUI();}
function updateUI(){
 const books=distance(places.books)<.65,windowSeat=distance(places.window)<3.5,desk=distance(places.desk)<2,going=pendingBookShelf||!!pendingReadingSeat||!!pendingCatAction,page=readingPages[selectedBook],turning=readingTurnTime<READING_TURN_DURATION,prompt=finishedPromptBook===selectedBook,k=[mode,books,windowSeat,desk,selectedBook,going,pendingBookShelf,catActionType,page,turning,prompt,completedBooks.has(selectedBook)].join('_');if(k===uiKey)return;uiKey=k;
 $('main-action').disabled=mode==='writing'||mode==='wave'||mode==='cat'||mode==='catWake'||going;$('wave-action').hidden=mode!=='idle'||desk||going;$('memory-action').hidden=mode!=='idle'||!desk||going;$('next-book').hidden=mode!=='reading';$('cancel-action').hidden=mode!=='writing'&&mode!=='cat'&&!going;$('reading-card').hidden=mode!=='reading';
 $('travel').hidden=mode==='reading';$('hint').hidden=mode==='reading';$('book-title').textContent=BOOKS[selectedBook].title;$('book-line').textContent=BOOKS[selectedBook].pages[page];$('book-page').textContent=(page+1)+' / '+BOOKS[selectedBook].pages.length+'쪽';$('page-prev').disabled=page===0||turning;$('page-next').disabled=turning;const nextText=page===BOOKS[selectedBook].pages.length-1?(completedBooks.has(selectedBook)?'처음부터 읽기':'다 읽었어요'):'다음 쪽';$('page-next').textContent=nextText;$('page-next').setAttribute('aria-label',nextText);$('finished-prompt').hidden=!prompt;$('book-line').hidden=prompt;$('book-pagination').hidden=prompt;
 $('main-text').textContent=pendingBookShelf?'책장으로 가는 중…':pendingCatAction?'귤이 만나러 가는 중…':going?'독서 자리로 가는 중…':mode==='catWake'?'귤이가 진정할 때까지 기다려요':mode==='cat'?CAT_ACTIONS[catActionType].status+'…':mode==='reading'?'그만 읽고 일어나기':mode==='rest'?'천천히 일어나기':mode==='writing'?'책갈피를 남기는 중…':mode==='wave'?'조용한 인사':desk?'책갈피 남기기':windowSeat?'창가에 앉아 쉬기':books?'책 고르기':'책 고르러 가기';
 $('hint').textContent=pendingBookShelf?'책장 앞에서 읽고 싶은 책을 골라요':pendingCatAction?'귤이에게 천천히 다가가요':going?'둥근 탁자의 빈 의자로 걸어가요':mode==='catWake'?'쉿, 지금은 혼자 쉬고 싶대요':mode==='cat'?'친구에게도 귤이와 노는 모습이 보여요':mode==='reading'?'의자에 앉아 한 페이지씩, 천천히':mode==='rest'?'오늘은 달빛 곁에 잠깐 앉아 있어요':mode==='writing'?'오늘 마음에 닿은 한 페이지를 남겨요':mode==='wave'?'친구에게도 인사하는 모습이 보여요':desk?'지금 고른 책의 책갈피를 남겨볼까요?':windowSeat?'따뜻한 창가 자리가 기다려요':books?'마음에 닿는 작은 이야기를 골라요':'가고 싶은 바닥을 톡 눌러보세요';
}
function animatePose(dt,moving,actor=character,state=mode,phase=elapsed,actionTime=mode==='cat'?catActionTime:mode==='reading'?readingTurnTime:writingTime,bookIndex=selectedBook,turnDirection=readingTurnDirection,catType=catActionType){
 const arms=actor.arms,legs=actor.legs;let y=moving?Math.sin(phase*9)*.05:Math.sin(phase*1.6)*.012,pitch=0;
 if(state!=='cat')hideCatProps(actor);
 if(state==='cat'){animateCatVisitor(actor,catType,actionTime,phase);const ready=catType!==0||Math.abs(Math.atan2(Math.sin(residentCat.root.rotation.y-actor.root.rotation.y-Math.PI/2),Math.cos(residentCat.root.rotation.y-actor.root.rotation.y-Math.PI/2)))<.12;pitch=ready?CAT_ACTIONS[catType].pitch:0;y=(ready?CAT_ACTIONS[catType].crouch:0)+Math.sin(phase*1.5)*.008;}
 else if(state==='catWake'){hideBookProps(actor);pitch=-.10;arms[0].rotation.set(-.65,0,-.35);arms[1].rotation.set(-.65,0,.35);legs.forEach(l=>l.rotation.x=0);actor.head.rotation.x=-.1;}
 else if(state==='reading'||state==='writing'){animateBookPose(actor,state,bookIndex,actionTime,phase,turnDirection);pitch=.06;y=Math.sin(phase*1.5)*.009;}
 else{hideBookProps(actor);if(state==='rest'){y=.12+Math.sin(phase*1.4)*.01;pitch=.025;arms[0].rotation.set(-.25,0,-.12);arms[1].rotation.set(-.25,0,.12);legs.forEach(l=>l.rotation.x=-1.3);actor.head.rotation.x=-.06;}
 else if(state==='wave'){arms[0].rotation.set(-.1,0,-.12);arms[1].rotation.set(-.2,0,2.4+Math.sin(phase*7)*.2);legs.forEach(l=>l.rotation.x=0);}
 else{arms.forEach((a,i)=>a.rotation.set(moving?Math.sin(phase*9+i*Math.PI+Math.PI)*.44:Math.sin(phase*1.7+i)*.025,0,i===0?-.15:.15));legs.forEach((l,i)=>l.rotation.x=moving?Math.sin(phase*9+i*Math.PI)*.55:0);}}
 actor.body.position.y=lerp(actor.body.position.y,y,1-Math.exp(-dt*12));actor.body.rotation.x=lerp(actor.body.rotation.x,pitch,1-Math.exp(-dt*10));actor.head.rotation.z=Math.sin(phase*.8)*.018;
 if(state==='cat'){actor.legs.forEach(leg=>leg.position.y=.47-actor.body.position.y);fitCatVisitorHand(actor,catType,actionTime);}
}
function helpOpen(){return !$('help-modal').hidden||!$('invite-modal').hidden||!$('memory-modal').hidden||!$('cat-modal').hidden||!$('book-picker').hidden||residentGuide.isOpen()||creatureBook.isOpen()||villageNotes.isOpen()||villageLooks.isOpen()||residentGifts.isOpen()||villageNewspaper.isOpen()||villageMarket.isOpen()||villageJournal.isOpen()||villageGoals.isOpen();}
function closeHelp(){$('help-modal').hidden=true;$('help').focus();}
$('help').addEventListener('click',()=>{$('help-modal').hidden=false;keys.clear();$('close-help').focus();});$('close-help').addEventListener('click',closeHelp);$('return-village').addEventListener('click',closeHelp);$('help-modal').addEventListener('click',e=>{if(e.target===$('help-modal'))closeHelp();});
$('memory-action').addEventListener('click',openMemories);$('close-memories').addEventListener('click',closeMemories);$('memory-modal').addEventListener('click',e=>{if(e.target===$('memory-modal'))closeMemories();});
$('entry-form').addEventListener('submit',e=>{e.preventDefault();if(entered)return;nickname=$('nickname').value.trim().replace(/[\u0000-\u001f\u007f]/g,'').slice(0,12)||'책숲 손님';entered=true;$('welcome').hidden=true;for(const id of['controls','status','keyboard'])$(id).hidden=false;$('nickname-label').textContent=nickname;save();updateUI();toast('어서 와요, '+nickname+' 님');renderer.domElement.focus({preventScroll:true});startNetwork();});document.querySelectorAll('[data-character]').forEach(b=>b.addEventListener('click',()=>chooseCharacter(Number(b.dataset.character))));
$('main-action').addEventListener('click',action);$('cancel-action').addEventListener('click',()=>{stopActivity();updateUI();});$('wave-action').addEventListener('click',wave);$('next-book').addEventListener('click',nextBook);document.querySelectorAll('[data-place]').forEach(b=>b.addEventListener('click',()=>travel(b.dataset.place)));
$('page-prev').addEventListener('click',()=>turnReadingPage(-1));$('page-next').addEventListener('click',()=>turnReadingPage(1));$('stamp-invite').addEventListener('click',goStamp);$('keep-reading').addEventListener('click',dismissFinishedPrompt);
