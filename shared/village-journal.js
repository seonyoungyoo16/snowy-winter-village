// A village journal of "things you've done": first times and little completions, dated, with no points or ranks.
// Some pages are written when they happen; others are read from the creature book and the library's own stamp record.
function createVillageJournal(){
 const KEY='village-journal',LIBRARY_KEY='little-lantern-library-v1';
 const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v===null?f:v;}catch{return f;}};
 const book=()=>typeof creatureBook==='object'?creatureBook.entries():{},pages=()=>typeof creatureBook==='object'?creatureBook.ENTRIES:[];
 const metIn=world=>{const met=book();return pages().filter(p=>p.world===world).every(p=>met[p.id]);};
 const library=()=>{const v=read(LIBRARY_KEY,{});return{done:Array.isArray(v.completedBooks)?v.completedBooks:[],stamps:Array.isArray(v.memories)?v.memories:[]};};
 // [id, title, hint, derive?] — derived pages are checked whenever the journal is read.
 const ENTRIES=[
  ['visit-winter','겨울 마을에 처음 왔어요','눈 내리는 겨울 마을에 가 보기'],
  ['visit-aquarium','물결 수족관에 처음 왔어요','물결 수족관에 가 보기'],
  ['visit-library','책숲 도서관에 처음 왔어요','책숲 도서관에 가 보기'],
  ['did-snowman','처음으로 눈사람을 세웠어요','겨울 눈밭에서 눈덩이 굴리기'],
  ['did-warm','모닥불에서 손을 녹였어요','겨울 모닥불 옆에 앉기'],
  ['did-fish','얼음 연못에서 처음 낚았어요','겨울 얼음 연못에서 낚시하기'],
  ['did-reef','산호 수조 친구들에게 먹이를 줬어요','수족관 산호 정원에서 먹이 주기'],
  ['did-ocean','바다 수조를 사진에 담았어요','수족관 바다 수조에서 사진 찍기'],
  ['did-jelly','해파리 쉼터에서 쉬었어요','수족관 해파리 쉼터에서 쉬기'],
  ['did-read','도서관에서 책을 펼쳤어요','도서관에서 책 고르고 읽기'],
  ['did-window','도서관 창가에서 하늘을 봤어요','도서관 창가 자리에서 쉬기'],
  ['did-cat','귤이와 놀았어요','도서관 고양이 귤이와 놀기'],
  ['first-request','주민의 부탁을 처음 들어줬어요','게시판의 오늘 부탁 하나 들어주기'],
  ['first-letter','친구에게 편지를 보냈어요','우편함에서 편지 쓰기'],
  ['first-memo','게시판에 메모를 붙였어요','게시판에 메모 붙이기'],
  ['first-sign','표지판에 한 줄을 남겼어요','표지판에 문구 쓰기'],
  ['first-donation','전시 수조에 처음 기증했어요','해리에게 생물 기증하기'],
  ['first-emote','처음으로 마음을 표현했어요','☺ 버튼으로 표현하기'],
  ['first-kite','연을 하늘에 띄웠어요','겨울 낮에 연 날리기'],
  ['first-lantern','풍등을 띄웠어요','겨울 밤에 풍등 띄우기'],
  ['first-purchase','마을 가게에서 처음 마련했어요','주민의 마을 가게 둘러보기'],
  ['first-saving','저금통에 조개껍데기를 넣었어요','마을 가게 저금통 쓰기'],
  ['goal-done','친구들과 이번 주 목표를 이뤘어요','게시판 옆 주민에게 함께하는 목표 묻기'],
  ['photo-theme','오늘의 사진 주제를 담았어요','주제에 맞는 날 수족관 바다 수조 사진 찍기'],
  ['creatures-5','다섯 생물을 만났어요','도감에서 다섯 쪽 채우기',()=>Object.keys(book()).length>=5],
  ['pond-all','얼음 연못 물고기를 모두 만났어요','시간과 날씨를 바꿔 가며 낚시하기',()=>pages().length>0&&metIn('winter')],
  ['tanks-all','수족관 생물을 모두 만났어요','세 수조에서 활동하기 (등불해파리는 밤에)',()=>pages().length>0&&metIn('aquarium')],
  ['window-all','창가 손님을 모두 만났어요','낮·밤·비 오는 날 창가에서 쉬기',()=>pages().length>0&&metIn('library')],
  ['book-full','생물 도감을 다 채웠어요','도감 열여덟 쪽 모두 채우기',()=>pages().length>0&&pages().every(p=>book()[p.id])],
  ['stamp-first','처음으로 완독 스탬프를 남겼어요','도서관 책을 끝까지 읽고 스탬프 남기기',()=>library().stamps.length>0],
  ['stamp-all','세 권을 모두 끝까지 읽었어요','도서관의 세 권 모두 완독하기',()=>[0,1,2].every(b=>library().done.includes(b))]
 ];
 function load(){const v=read(KEY,{});return v&&typeof v==='object'?v:{};}
 function save(v){try{localStorage.setItem(KEY,JSON.stringify(v));}catch{}}
 // Writes a page once; returns true for a new page so the world can celebrate it quietly.
 function note(id){const entry=ENTRIES.find(e=>e[0]===id);if(!entry)return false;const v=load();if(v[id])return false;v[id]=Date.now();save(v);toast('마을 일기에 적었어요 · '+entry[1]);refresh();return true;}
 function sync(){for(const[id,,,derive]of ENTRIES)if(derive&&derive())note(id);return load();}
 function done(){return sync();}
 const sheet=document.createElement('section');sheet.className='creature-book village-notes village-journal';sheet.hidden=true;const card=document.createElement('div');card.className='creature-book-card';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');const closeButton=document.createElement('button');closeButton.className='creature-book-close';closeButton.textContent='×';closeButton.setAttribute('aria-label','일기 닫기');const body=document.createElement('div');card.append(closeButton,body);sheet.append(card);document.body.append(sheet);
 function close(){sheet.hidden=true;}closeButton.addEventListener('click',close);sheet.addEventListener('click',e=>{if(e.target===sheet)close();});addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden)close();});
 const when=t=>{const d=new Date(t+9*3600e3);return(d.getUTCMonth()+1)+'월 '+d.getUTCDate()+'일';};
 function refresh(){if(sheet.hidden)return;const v=load(),list=document.createElement('ul');for(const[id,title,hint]of ENTRIES){const li=document.createElement('li');li.className=v[id]?'seen':'unseen';const small=document.createElement('small');small.textContent=v[id]?when(v[id]):'아직이에요';li.append(small,document.createTextNode(v[id]?title:hint));list.append(li);}const h=document.createElement('h2');h.textContent='마을 일기';const p=document.createElement('p');p.className='creature-count';p.textContent=Object.keys(v).length+'가지를 해 봤어요 · 이 브라우저에만 적혀요';body.replaceChildren(h,p,list);}
 function open(){if(!entered)return;sync();sheet.hidden=false;refresh();closeButton.focus();}
 if(typeof residentGuide==='object'&&residentGuide.addAction)residentGuide.addAction('마을 일기',()=>{residentGuide.close();open();});
 note('visit-'+CURRENT_WORLD);
 return{ENTRIES,note,sync,done,open,close,isOpen:()=>!sheet.hidden};
}
const villageJournal=createVillageJournal();
