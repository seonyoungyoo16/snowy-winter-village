// A weekly village newspaper written from what the friend group left in the village: donations, letters to everyone,
// signs and memos, plus the week's weather, events and resident birthdays. New issue every Seoul Monday; two past issues stay.
function createVillageNewspaper(){
 const DAY=86400e3,FIRST_MONDAY=Math.floor((Date.UTC(2026,10,2)+9*3600e3)/DAY),SNIP=24,WEATHER={clear:'맑음',cloudy:'흐림',precip:'눈·비',heavy:'함박눈·큰비',fog:'안개'},RESIDENTS={winter:'밤이',aquarium:'해리',library:'소담'};
 const seoulDay=ms=>Math.floor((ms+9*3600e3)/DAY),dayStartMs=d=>d*DAY-9*3600e3;
 // Day 4 since the epoch is a Monday.
 function weekStart(ms=Date.now()){const d=seoulDay(ms);return d-(((d-4)%7)+7)%7;}
 function issueNumber(startDay){return Math.max(1,Math.floor((startDay-FIRST_MONDAY)/7)+1);}
 const snip=s=>{const t=String(s||'').replace(/\s+/g,' ').trim();return t.length>SNIP?t.slice(0,SNIP)+'…':t;};
 const inRange=(t,a,b)=>Number.isFinite(t)&&t>=a&&t<b;
 function articles(startDay){const a=dayStartMs(startDay),b=a+7*DAY,out=[];
  const pages=typeof creatureBook==='object'&&creatureBook?creatureBook.ENTRIES:[],name=id=>(pages.find(p=>p.id===id)||{name:id}).name;
  const ex=Object.values(villageStore.list('exhibits')).filter(e=>e&&inRange(e.t,a,b));if(ex.length)out.push({title:'전시 수조에 새 친구 '+ex.length+'마리',body:ex.slice(0,4).map(e=>name(e.c)+'('+e.n+' 님)').join(', ')+' 가 수족관 전시 수조에 들어왔어요.'});
  const letters=Object.values(villageStore.list('letters')).filter(l=>l&&l.to==='*'&&inRange(l.t,a,b)).sort((x,y)=>y.t-x.t);if(letters.length)out.push({title:'모두에게 온 편지 '+letters.length+'통',body:'「'+snip(letters[0].b)+'」 — '+letters[0].f+' 님'});
  const signs=Object.values(villageStore.list('signs')).filter(s=>s&&inRange(s.t,a,b)).sort((x,y)=>y.t-x.t);if(signs.length)out.push({title:'표지판에 새 글',body:'「'+snip(signs[0].b)+'」 — '+signs[0].n+' 님'+(signs.length>1?' 외 '+(signs.length-1)+'곳':'')});
  const memos=Object.values(villageStore.list('board')).filter(m=>m&&inRange(m.t,a,b)).sort((x,y)=>y.t-x.t);if(memos.length)out.push({title:'게시판 메모 '+memos.length+'장',body:'가장 최근 메모: 「'+snip(memos[0].b)+'」'});
  // Weather of every three-hour block in the week, from the shared sky.
  const tally={};for(let t=a+90*60e3;t<b;t+=3*3600e3){const k=skyWeatherAt(t).kind;tally[k]=(tally[k]||0)+1;}const top=Object.entries(tally).sort((x,y)=>y[1]-x[1])[0];if(top)out.push({title:'이번 주 날씨',body:'가장 많았던 날씨는 '+WEATHER[top[0]]+'('+top[1]*3+'시간)이었어요.'});
  // Events come from the seasonal module itself, so lunar dates like Chuseok are counted too.
  if(typeof seasonalEventsAt==='function'){const names=new Set();for(let i=0;i<7;i++)for(const ev of seasonalEventsAt(a+i*DAY+12*3600e3))names.add(ev.name);if(names.size)out.push({title:'마을 행사',body:[...names].join(', ')+'이(가) 열렸어요.'});}
  if(typeof residentGifts==='object'&&residentGifts){const md=ms=>{const d=new Date(ms+9*3600e3);return[d.getUTCMonth()+1,d.getUTCDate()];};for(const[w,p]of Object.entries(residentGifts.PROFILES))for(let i=0;i<7;i++){const[m,d]=md(a+i*DAY+12*3600e3);if(m===p.born[0]&&d===p.born[1])out.push({title:RESIDENTS[w]+'의 생일',body:m+'월 '+d+'일은 '+RESIDENTS[w]+'의 생일이었어요.'});}}
  if(!out.length)out.push({title:'조용한 한 주',body:'이번 주 마을은 조용했어요. 다음 주 소식을 기다려요.'});
  return out;}
 function issue(offset=0){const start=weekStart()-offset*7;return{number:issueNumber(start),start,articles:articles(start)};}
 const sheet=document.createElement('section');sheet.className='creature-book village-newspaper';sheet.hidden=true;const card=document.createElement('div');card.className='creature-book-card';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');const closeButton=document.createElement('button');closeButton.className='creature-book-close';closeButton.textContent='×';closeButton.setAttribute('aria-label','신문 닫기');const body=document.createElement('div');card.append(closeButton,body);sheet.append(card);document.body.append(sheet);
 function close(){sheet.hidden=true;}closeButton.addEventListener('click',close);sheet.addEventListener('click',e=>{if(e.target===sheet)close();});addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden)close();});
 // Friend words are shown with textContent only.
 function render(offset){const it=issue(offset),d=new Date(dayStartMs(it.start)+9*3600e3),title=document.createElement('h2'),date=document.createElement('p'),list=document.createElement('ul'),nav=document.createElement('div');title.textContent='마을 신문 제'+it.number+'호';date.className='creature-count';date.textContent=(d.getUTCMonth()+1)+'월 '+d.getUTCDate()+'일 주'+(villageStore.mode==='shared'?'':' · 이 브라우저에 남은 소식');
  list.replaceChildren(...it.articles.map(x=>{const li=document.createElement('li'),h=document.createElement('small');li.className='seen';h.textContent=x.title;li.append(h,document.createTextNode(x.body));return li;}));
  nav.className='chips';[0,1,2].forEach(o=>{const b=document.createElement('button');b.className='resident-next';b.textContent=o?o+'주 전':'이번 호';b.disabled=o===offset;b.addEventListener('click',()=>render(o));nav.append(b);});
  body.replaceChildren(title,date,list,nav);}
 function open(){render(0);sheet.hidden=false;closeButton.focus();}
 if(residentGuide.addAction)residentGuide.addAction('마을 신문',()=>{residentGuide.close();open();});
 return{weekStart,issueNumber,issue,articles,open,close,isOpen:()=>!sheet.hidden};
}
const villageNewspaper=createVillageNewspaper();
