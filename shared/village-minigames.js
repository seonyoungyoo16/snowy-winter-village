// One small table game per space, played beside friends: picture-book pairs in the library, cabin dice in winter and
// a fish-spotting arcade in the aquarium. Only the current round's result is shown; nothing is saved or ranked.
function createVillageMinigames(){
 const BOOKS=[['☾','달 그림책'],['✿','꽃 그림책'],['♪','노래 그림책'],['☀','해님 그림책'],['❄','눈 그림책'],['✉','편지 그림책']],
  FACES=['❄','☃','★','♥','☾','✿'],ARCADE={cells:9,round:20,every:.9,stay:1.2},
  GAME={library:{title:'그림책 짝 맞추기',hint:'두 장씩 뒤집어 같은 그림책을 찾아요. 친구와 번갈아 뒤집어도 좋아요.'},winter:{title:'오두막 주사위',hint:'세 번까지 굴려 그림 카드와 같은 그림을 모아요. 마음에 드는 주사위는 눌러서 남겨요.'},aquarium:{title:'물고기 찾기 오락기',hint:'20초 동안 고개를 내미는 물고기를 눌러 인사해요.'}}[CURRENT_WORLD];
 const shuffle=(list,rng)=>{const a=list.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 // Picture-book pairs: a mismatched pair stays face up until the next tap, so no timer is needed.
 const memory={cards:[],open:[],found:new Set(),turns:0,
  deal(rng=Math.random){this.cards=shuffle(BOOKS.flatMap((b,i)=>[i,i]),rng);this.open=[];this.found=new Set();this.turns=0;},
  flip(i){if(i<0||i>=this.cards.length||this.found.has(i))return null;if(this.open.length===2)this.open=[];if(this.open.includes(i))return null;this.open.push(i);
   if(this.open.length<2)return'first';this.turns++;const[a,b]=this.open;if(this.cards[a]===this.cards[b]){this.found.add(a);this.found.add(b);this.open=[];return this.done()?'done':'pair';}return'miss';},
  done(){return this.cards.length>0&&this.found.size===this.cards.length;}};
 // Cabin dice: three picture dice, up to three rolls, matching a picture card in any order.
 const dice={target:[],faces:[0,0,0],kept:[false,false,false],rolls:0,
  deal(rng=Math.random){this.target=[0,1,2].map(()=>Math.floor(rng()*FACES.length));this.faces=[0,0,0];this.kept=[false,false,false];this.rolls=0;},
  roll(rng=Math.random){if(this.rolls>=3||this.done())return false;this.faces=this.faces.map((f,i)=>this.kept[i]&&this.rolls?f:Math.floor(rng()*FACES.length));this.rolls++;return true;},
  hold(i){if(!this.rolls||this.rolls>=3||this.done())return false;this.kept[i]=!this.kept[i];return true;},
  done(){const want=this.target.slice().sort().join(),have=this.faces.slice().sort().join();return this.rolls>0&&want===have;},
  over(){return this.done()||this.rolls>=3;}};
 // Fish arcade: a fish peeks out of one of nine holes every 0.9 s and stays 1.2 s; a tap says hello.
 const arcade={time:0,left:0,fish:new Map(),seen:0,next:0,running:false,
  start(){this.time=0;this.left=ARCADE.round;this.fish=new Map();this.seen=0;this.next=.3;this.running=true;},
  step(dt,rng=Math.random){if(!this.running)return;this.time+=dt;this.left=Math.max(0,ARCADE.round-this.time);for(const[c,t]of this.fish)if(this.time-t>ARCADE.stay)this.fish.delete(c);
   while(this.next<=this.time&&this.time<ARCADE.round){const free=[...Array(ARCADE.cells).keys()].filter(c=>!this.fish.has(c));if(free.length)this.fish.set(free[Math.floor(rng()*free.length)],this.next);this.next+=ARCADE.every;}
   if(this.time>=ARCADE.round){this.running=false;this.fish.clear();}},
  tap(c){if(!this.running||!this.fish.has(c))return false;this.fish.delete(c);this.seen++;return true;}};
 const sheet=document.createElement('section');sheet.className='creature-book village-minigame';sheet.hidden=true;const card=document.createElement('div');card.className='creature-book-card';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');const closeButton=document.createElement('button');closeButton.className='creature-book-close';closeButton.textContent='×';closeButton.setAttribute('aria-label','놀이 닫기');const body=document.createElement('div');card.append(closeButton,body);sheet.append(card);document.body.append(sheet);
 const style=document.createElement('style');style.textContent='.village-minigame .mini-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}.village-minigame .mini-grid.three{grid-template-columns:repeat(3,1fr)}.village-minigame .mini-grid button{min-height:56px;border:0;border-radius:14px;background:#efe3cf;color:#5f5050;font:700 24px/1 "Winter Jua",sans-serif;cursor:pointer}.village-minigame .mini-grid button.up{background:#fff8e8;box-shadow:inset 0 0 0 2px #c9b48f}.village-minigame .mini-grid button.kept{background:#dfe8d6;box-shadow:inset 0 0 0 2px #8e9d83}.village-minigame .mini-grid button:disabled{opacity:.75;cursor:default}';(document.head||document.body).append(style);
 function close(){sheet.hidden=true;arcade.running=false;}closeButton.addEventListener('click',close);sheet.addEventListener('click',e=>{if(e.target===sheet)close();});addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden)close();});
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const btn=(text,label,fn,cls)=>{const b=el('button',cls,text);b.setAttribute('aria-label',label);b.addEventListener('click',()=>{fn();render();});return b;};
 let status=null;const sig=()=>[arcade.running,[...arcade.fish.keys()].join('-'),Math.ceil(arcade.left),arcade.seen].join('|');
 function view(){if(CURRENT_WORLD==='library'){const grid=el('div','mini-grid');grid.replaceChildren(...memory.cards.map((v,i)=>{const up=memory.found.has(i)||memory.open.includes(i),b=btn(up?BOOKS[v][0]:'?',up?BOOKS[v][1]:(i+1)+'번 카드',()=>{memory.flip(i);},up?'up':'');b.disabled=memory.found.has(i);return b;}));
   return[grid,el('p','creature-count',memory.done()?memory.turns+'번 만에 모든 짝을 찾았어요!':'뒤집은 횟수 '+memory.turns+'번'),btn('새로 섞기','카드 새로 섞기',()=>memory.deal(),'resident-next')];}
  if(CURRENT_WORLD==='winter'){const want=el('p','creature-count','그림 카드: '+dice.target.map(i=>FACES[i]).join(' ')),grid=el('div','mini-grid three');grid.replaceChildren(...dice.faces.map((f,i)=>{const b=btn(dice.rolls?FACES[f]:'·',(i+1)+'번 주사위'+(dice.kept[i]?' 남김':''),()=>dice.hold(i),dice.kept[i]?'kept':'');b.disabled=!dice.rolls||dice.over();return b;}));
   const msg=dice.done()?'그림이 모두 모였어요!':dice.over()?'이번 판은 여기까지. 다음 판에 또 해요.':dice.rolls?'남은 굴리기 '+(3-dice.rolls)+'번':'주사위를 굴려 볼까요?',again=dice.over();
   return[want,grid,el('p','creature-count',msg),again?btn('새 그림 카드','새 판 시작',()=>dice.deal(),'resident-next'):btn('굴리기','주사위 굴리기',()=>dice.roll(),'resident-next')];}
  const grid=el('div','mini-grid three');grid.replaceChildren(...[...Array(ARCADE.cells).keys()].map(c=>{const fish=arcade.fish.has(c);return btn(fish?'><>':'○',fish?'물고기에게 인사하기':'빈 구멍',()=>arcade.tap(c),fish?'up':'');}));
  const msg=arcade.running?'남은 시간 '+Math.ceil(arcade.left)+'초 · '+arcade.seen+'마리와 인사했어요':arcade.time?'이번 판에 '+arcade.seen+'마리와 인사했어요!':'시작을 누르면 물고기가 고개를 내밀어요';
  return[grid,el('p','creature-count',msg),arcade.running?el('span'):btn(arcade.time?'한 번 더':'시작','오락기 시작',()=>arcade.start(),'resident-next')];}
 function render(){const title=el('h2','',GAME.title),hint=el('p','creature-count',GAME.hint);status=sig();body.replaceChildren(title,hint,...view());}
 function open(){if(CURRENT_WORLD==='library'&&!memory.cards.length)memory.deal();if(CURRENT_WORLD==='winter'&&!dice.target.length)dice.deal();render();sheet.hidden=false;closeButton.focus();if(typeof villageJournal==='object'&&villageJournal&&villageJournal.note)villageJournal.note('first-minigame');}
 if(residentGuide.addAction)residentGuide.addAction('함께 놀기',()=>{residentGuide.close();open();});
 if(typeof radialMenu==='object'&&radialMenu)radialMenu.addItem({icon:'⚄',label:'놀이',run:open});
 return{GAME,BOOKS,FACES,ARCADE,memory,dice,arcade,open,close,isOpen:()=>!sheet.hidden,
  // The arcade redraws only when what it shows changes.
  tick(dt){if(!arcade.running)return;arcade.step(dt);if(!sheet.hidden&&status!==sig())render();}};
}
const villageMinigames=createVillageMinigames();
