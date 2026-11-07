// Residents' birthdays and tastes, and one small gift a Seoul day: a warm cocoa or a picture card of a creature you have met.
// Replies are words only — no affection points — and a birthday adds a party hat and a special line.
function createResidentGifts(){
 const PROFILES={
  winter:{born:[12,21],likes:['trout','star-smelt','lenok','cocoa'],dislikes:['snow-loach'],love:'우와, 이거 제가 정말 좋아하는 거예요! 오늘 밤 오두막에 걸어 둘게요.',like:'고마워요. 마음이 따뜻해지네요.',meh:'음… 제 취향은 아니지만 마음은 고마워요.',birthday:'오늘이 제 생일인 걸 어떻게 알았어요? 동지라 밤이 제일 길어서, 오래오래 기억할게요.'},
  aquarium:{born:[7,14],likes:['seahorse','moon-jelly','lantern-jelly','clownfish'],dislikes:['bullhead'],love:'와, 이 친구 그림이라니! 수조 옆에 붙여 둘게요.',like:'고마워요. 오늘 먹이 시간이 더 즐겁겠어요.',meh:'하하, 이건 물고기들이 놀랄지도 몰라요. 그래도 고마워요.',birthday:'생일 축하를 받다니! 오늘은 해파리들도 더 반짝이는 것 같아요.'},
  library:{born:[4,23],likes:['moon-moth','sparrow','rain-snail','cocoa'],dislikes:['sardine'],love:'어머, 책갈피로 쓰고 싶을 만큼 예뻐요. 정말 고마워요.',like:'고마워요. 책 읽을 때 옆에 두고 볼게요.',meh:'조금 비린 냄새가 나는 것 같아요… 그래도 마음은 받았어요.',birthday:'오늘이 책의 날이자 제 생일이에요. 이렇게 기억해 주다니 정말 기뻐요.'}
 },me=PROFILES[CURRENT_WORLD];
 const COCOA={id:'cocoa',name:'따뜻한 코코아'},KEY=()=>'village-gifts:'+CURRENT_WORLD+':'+seoulDay();
 const seoulDay=(ms=Date.now())=>Math.floor((ms+9*3600e3)/86400e3),seoulDate=(ms=Date.now())=>{const d=new Date(ms+9*3600e3);return[d.getUTCMonth()+1,d.getUTCDate()];};
 function isBirthday(ms=Date.now()){const[m,d]=seoulDate(ms);return m===me.born[0]&&d===me.born[1];}
 function read(){try{return JSON.parse(localStorage.getItem(KEY())||'null');}catch{return null;}}
 function choices(){const met=typeof creatureBook==='object'&&creatureBook?creatureBook.entries():{},cards=(typeof creatureBook==='object'&&creatureBook?creatureBook.ENTRIES:[]).filter(e=>met[e.id]).map(e=>({id:e.id,name:e.name+' 그림 카드'}));return[COCOA,...cards];}
 function reaction(id){if(isBirthday())return'birthday';if(me.likes.includes(id))return'love';if(me.dislikes.includes(id))return'meh';return'like';}
 // Returns the reply kind, or null when today's gift was already given or the gift is not available.
 function give(id){if(read())return null;const g=choices().find(c=>c.id===id);if(!g)return null;const kind=reaction(id);try{localStorage.setItem(KEY(),JSON.stringify({id,kind,t:Date.now()}));}catch{}
  if(typeof villageJournal==='object'&&villageJournal&&villageJournal.note)villageJournal.note('first-gift');toast(residentGuide.role.name+': '+me[kind]);return kind;}
 // Birthday party hat: one small cone on the resident's head, only on the day.
 let hat=null;function dress(){const on=isBirthday();if(on&&!hat){hat=new THREE.Mesh(new THREE.ConeGeometry(.17,.36,10),new THREE.MeshLambertMaterial({color:0xf0a6a0}));hat.name='resident-birthday-hat';hat.position.set(.08,.52,0);hat.rotation.z=-.25;residentGuide.actor.head.add(hat);}if(hat)hat.visible=on;}
 const sheet=document.createElement('section');sheet.className='creature-book resident-gifts';sheet.hidden=true;const card=document.createElement('div');card.className='creature-book-card';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');const closeButton=document.createElement('button');closeButton.className='creature-book-close';closeButton.textContent='×';closeButton.setAttribute('aria-label','선물 창 닫기');const body=document.createElement('div');card.append(closeButton,body);sheet.append(card);document.body.append(sheet);
 function close(){sheet.hidden=true;}closeButton.addEventListener('click',close);sheet.addEventListener('click',e=>{if(e.target===sheet)close();});addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden)close();});
 function render(){const done=read(),title=document.createElement('h2'),note=document.createElement('p'),list=document.createElement('ul');title.textContent=residentGuide.role.name+'에게 선물하기';note.className='creature-count';
  const[m,d]=me.born;note.textContent=(isBirthday()?'오늘은 '+residentGuide.role.name+'의 생일이에요! ':'생일 '+m+'월 '+d+'일 · ')+(done?'오늘 선물은 이미 건넸어요.':'하루에 한 번 건넬 수 있어요.');
  list.replaceChildren(...choices().map(g=>{const li=document.createElement('li'),b=document.createElement('button');b.className='resident-next';b.textContent=g.name+' 건네기';b.disabled=Boolean(done);b.addEventListener('click',()=>{if(give(g.id))render();});li.append(b);return li;}));body.replaceChildren(title,note,list);}
 function open(){render();sheet.hidden=false;closeButton.focus();}
 if(residentGuide.addAction)residentGuide.addAction('선물 주기',()=>{residentGuide.close();open();});
 dress();
 return{PROFILES,profile:me,isBirthday,choices,reaction,give,given:read,open,close,isOpen:()=>!sheet.hidden,tick(){dress();},get hat(){return hat;}};
}
const residentGifts=createResidentGifts();
