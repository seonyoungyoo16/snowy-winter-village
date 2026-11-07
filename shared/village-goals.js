// Contests without winners: one weekly goal the friend group reaches together, and a daily photo theme for the ocean tank.
// Each visitor writes only their own weekly contribution; the sheet shows the group total and who joined, never per-person counts or ranks.
function createVillageGoals(){
 const GOALS=[{key:'f',target:20,text:'물고기 20마리 함께 낚기',event:'fish'},{key:'p',target:12,text:'바다 수조 사진 12장 함께 찍기',event:'ocean'},{key:'r',target:10,text:'주민 부탁 10개 함께 들어주기',event:'request'}];
 const THEMES=[
  {id:'clear-day',text:'맑은 낮의 바다 수조',test:s=>s.kind==='clear'&&s.daylight>.5},
  {id:'night',text:'밤의 바다 수조',test:s=>s.phase==='night'},
  {id:'rain',text:'비 오는 날의 바다 수조',test:s=>s.kind==='precip'||s.kind==='heavy'},
  {id:'golden',text:'새벽이나 노을 무렵의 바다 수조',test:s=>s.phase==='dawn'||s.phase==='dusk'},
  {id:'soft',text:'흐리거나 안개 낀 날의 바다 수조',test:s=>s.kind==='cloudy'||s.kind==='fog'}
 ];
 const seoulDay=(ms=Date.now())=>Math.floor((ms+9*3600e3)/86400e3),week=(ms=Date.now())=>Math.floor((seoulDay(ms)+3)/7);
 const goalFor=(w=week())=>GOALS[((w%3)+3)%3],themeFor=(d=seoulDay())=>THEMES[((d%5)+5)%5];
 const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v===null?f:v;}catch{return f;}},write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};
 let records={};villageStore.subscribe('goals',v=>{records=v||{};});
 const mineKey=()=>'w'+week()+'-'+(villageStore.uid()||'local');
 function mine(){const r=records[mineKey()];return r&&r.w===week()?{...r}:{w:week(),f:0,p:0,r:0};}
 function progress(){const g=goalFor(),w=week(),rows=Object.values(records).filter(r=>r&&r.w===w),total=rows.reduce((n,r)=>n+Math.max(0,Math.min(500,r[g.key]|0)),0),names=[...new Set(rows.filter(r=>(r[g.key]|0)>0).map(r=>r.n))].sort();return{goal:g,total,names,done:total>=g.target};}
 // Adds one to this visitor's own record for the week; the group total is recomputed from everyone's records.
 async function add(key){const before=progress(),r=mine();r[key]=Math.min(500,(r[key]|0)+1);r.n=nickname;r.u=villageStore.uid();r.t=Date.now();r.w=week();const result=await villageStore.put('goals',mineKey(),r);const after=progress();if(!before.done&&after.done&&after.goal.key===key){toast('이번 주 목표를 함께 이뤘어요 · '+after.goal.text);if(typeof villageJournal==='object')villageJournal.note('goal-done');}return result;}
 function event(name){const g=GOALS.find(x=>x.event===name);if(g)add(g.key);if(name==='ocean')photo(skyWeather.state);}
 // The photo theme is met when the ocean tank photo happens under today's sky.
 function photo(sky){const theme=themeFor(),key='village-photo-theme:'+seoulDay();if(!theme.test(sky))return false;if(read(key,false))return false;write(key,true);toast('오늘의 사진 주제를 담았어요 · '+theme.text);if(typeof villageJournal==='object')villageJournal.note('photo-theme');return true;}
 const sheet=document.createElement('section');sheet.className='creature-book village-notes village-goals';sheet.hidden=true;const card=document.createElement('div');card.className='creature-book-card';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');const closeButton=document.createElement('button');closeButton.className='creature-book-close';closeButton.textContent='×';closeButton.setAttribute('aria-label','목표 닫기');const body=document.createElement('div');card.append(closeButton,body);sheet.append(card);document.body.append(sheet);
 function close(){sheet.hidden=true;}closeButton.addEventListener('click',close);sheet.addEventListener('click',e=>{if(e.target===sheet)close();});addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden)close();});
 const line=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;n.textContent=text;return n;};
 function open(){if(!entered)return;const p=progress(),t=themeFor();body.replaceChildren(line('h2','','함께하는 목표'),line('h3','','이번 주'),line('p','creature-count',p.goal.text+' · '+Math.min(p.total,p.goal.target)+' / '+p.goal.target+(p.done?' · 함께 이뤘어요!':'')),line('p','creature-count',p.names.length?'함께한 친구: '+p.names.join(', '):'아직 아무도 시작하지 않았어요'),line('h3','','오늘의 사진 주제'),line('p','creature-count',t.text+(read('village-photo-theme:'+seoulDay(),false)?' · 담았어요':' · 수족관 바다 수조에서 사진 찍기')),line('p','creature-count',villageStore.mode==='shared'?'순위 없이 모두의 기록을 더해요.':'지금은 이 브라우저의 기록만 더해져요 (이 브라우저에만 보여요).'));sheet.hidden=false;closeButton.focus();}
 if(typeof residentGuide==='object'&&residentGuide.addAction)residentGuide.addAction('함께하는 목표',()=>{residentGuide.close();open();});
 return{GOALS,THEMES,week,goalFor,themeFor,progress,add,event,photo,open,close,isOpen:()=>!sheet.hidden};
}
const villageGoals=createVillageGoals();
