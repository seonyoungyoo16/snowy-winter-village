// Short expeditions: send the companion walking with you (or the resident's paper crane when there is none) to one of
// three places for 1, 3 or 6 hours. Time passes while the page is closed; nothing can go wrong. Coming home brings a
// story card, a picture for the creature book and a few shells for the village shop.
function createVillageExpedition(){
 const PLACES=[
  {id:'forest',name:'눈 덮인 숲길',pool:['minnow','trout','lenok','bullhead'],lines:['나무 사이로 작은 개울을 따라 걸었대요.','눈 위에 찍힌 발자국을 세어 보다 길을 살짝 돌아왔대요.','솔방울 하나를 주워 오는 길 내내 굴렸대요.']},
  {id:'shore',name:'등대 바닷가',pool:['sardine','turtle','clownfish','moon-jelly'],lines:['등대 불빛이 바다 위에 길을 그려 줬대요.','파도 소리에 맞춰 모래 위를 걸었대요.','조개껍데기를 주머니 가득 넣고 돌아왔대요.']},
  {id:'archive',name:'오래된 서고',pool:['sparrow','moon-moth','rain-snail'],lines:['먼지 쌓인 지도책을 한 장씩 넘겨 봤대요.','창틀에 앉아 비 오는 소리를 들었대요.','책장 꼭대기에서 오래된 엽서를 찾았대요.']}
 ],HOURS=[1,3,6],SHELLS={1:2,3:4,6:6},KEY='village-expedition',KEEP=6,H=3600e3;
 function load(){try{const s=JSON.parse(localStorage.getItem(KEY)||'null')||{},trip=s.trip&&PLACES.some(p=>p.id===s.trip.place)&&HOURS.includes(s.trip.hours)&&Number.isFinite(s.trip.start)&&typeof s.trip.who==='string'?s.trip:null;
  return{trip,cards:Array.isArray(s.cards)?s.cards.filter(c=>c&&typeof c.text==='string').slice(-KEEP):[]};}catch{return{trip:null,cards:[]};}}
 let state=load(),checkIn=0;
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
 const companions=()=>typeof villageCompanions==='object'&&villageCompanions?villageCompanions:null;
 // Who goes: the companion walking along, else the first one hatched, else the resident's paper crane.
 function traveler(){const c=companions();if(c&&c.state.owned.length){const id=c.state.out||c.state.owned[0],k=c.KINDS.find(x=>x.id===id);return{id,name:k.name};}return{id:'crane',name:residentGuide.role.name+'의 종이학'};}
 function away(id){return Boolean(state.trip&&state.trip.who===id);}
 function left(now=Date.now()){return state.trip?Math.max(0,state.trip.start+state.trip.hours*H-now):0;}
 function send(placeId,hours){if(state.trip)return false;const place=PLACES.find(p=>p.id===placeId);if(!place||!HOURS.includes(hours))return false;const who=traveler(),c=companions();
  state.trip={place:place.id,hours,start:Date.now(),who:who.id,name:who.name};save();if(c&&c.state.out===who.id)c.setOut(null);toast(who.name+'이(가) '+place.name+'(으)로 떠났어요 · '+hours+'시간 뒤에 돌아와요');return true;}
 // Coming home: one picture not in the book yet when possible (chosen by the start time, not by luck), shells and a story.
 function finish(){const t=state.trip,place=PLACES.find(p=>p.id===t.place),book=typeof creatureBook==='object'&&creatureBook?creatureBook:null,met=book?book.entries():{},fresh=place.pool.filter(id=>!met[id]),pool=fresh.length?fresh:place.pool,pick=pool[Math.floor(t.start/H)%pool.length];
  if(book)book.record(pick,{via:'expedition'});const shells=typeof villageMarket==='object'&&villageMarket?villageMarket.earn(SHELLS[t.hours],'원정 기념품'):0,entry=book?book.ENTRIES.find(e=>e.id===pick):null;
  const card={place:place.name,who:t.name,text:t.name+'이(가) '+place.name+'에서 돌아왔어요. '+place.lines[Math.floor(t.start/60e3)%place.lines.length]+(entry?' '+entry.name+' 그림을 가져왔어요.':''),souvenir:pick,shells,t:t.start+t.hours*H};
  state.cards.push(card);state.cards=state.cards.slice(-KEEP);state.trip=null;save();const c=companions();if(c&&t.who!=='crane'&&c.state.owned.includes(t.who)&&!c.state.out)c.setOut(t.who);
  toast(card.who+'이(가) 원정에서 돌아왔어요! 주민에게 이야기를 들어 봐요');if(typeof villageJournal==='object'&&villageJournal&&villageJournal.note)villageJournal.note('first-expedition');return card;}
 function check(){if(state.trip&&left()<=0)return finish();return null;}
 const sheet=document.createElement('section');sheet.className='creature-book village-expedition';sheet.hidden=true;const card=document.createElement('div');card.className='creature-book-card';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');const closeButton=document.createElement('button');closeButton.className='creature-book-close';closeButton.textContent='×';closeButton.setAttribute('aria-label','원정 창 닫기');const body=document.createElement('div');card.append(closeButton,body);sheet.append(card);document.body.append(sheet);
 function close(){sheet.hidden=true;}closeButton.addEventListener('click',close);sheet.addEventListener('click',e=>{if(e.target===sheet)close();});addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden)close();});
 let pickPlace=PLACES[0].id;
 function render(){const title=document.createElement('h2'),note=document.createElement('p'),list=document.createElement('ul');title.textContent='원정 보내기';note.className='creature-count';const rows=[];
  if(state.trip){const place=PLACES.find(p=>p.id===state.trip.place),m=Math.ceil(left()/60e3);note.textContent=state.trip.name+'이(가) '+place.name+'에 가 있어요 · '+(m>=60?Math.floor(m/60)+'시간 '+(m%60)+'분':m+'분')+' 뒤 돌아와요';}
  else{const who=traveler();note.textContent=who.name+'이(가) 다녀올 수 있어요. 창을 닫아도 시간은 흘러요.';
   const places=document.createElement('li'),hours=document.createElement('li');places.className='chips';hours.className='chips';
   for(const p of PLACES){const b=document.createElement('button');b.className='resident-next';b.textContent=p.name;b.setAttribute('aria-pressed',String(p.id===pickPlace));b.addEventListener('click',()=>{pickPlace=p.id;render();});places.append(b);}
   for(const h of HOURS){const b=document.createElement('button');b.className='resident-next';b.textContent=h+'시간';b.addEventListener('click',()=>{send(pickPlace,h);render();});hours.append(b);}rows.push(places,hours);}
  for(const c of state.cards.slice().reverse()){const li=document.createElement('li'),h=document.createElement('small');li.className='seen';h.textContent=c.place+' · '+c.who;li.append(h,document.createTextNode(c.text+(c.shells?' 조개껍데기 '+c.shells+'개.':'')));rows.push(li);}
  list.replaceChildren(...rows);body.replaceChildren(title,note,list);}
 function open(){check();render();sheet.hidden=false;closeButton.focus();}
 if(residentGuide.addAction)residentGuide.addAction('원정 보내기',()=>{residentGuide.close();open();});
 return{PLACES,HOURS,SHELLS,get state(){return state;},traveler,away,left,send,check,open,close,isOpen:()=>!sheet.hidden,
  tick(dt){checkIn-=dt;if(checkIn<=0){checkIn=5;check();}}};
}
const villageExpedition=createVillageExpedition();
