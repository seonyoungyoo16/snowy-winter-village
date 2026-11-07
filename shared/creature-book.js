// One creature book for all three worlds: the worlds share an origin, so this browser's record follows the visitor everywhere.
function createCreatureBook(){
 const KEY='village-creature-book',ENTRIES=[
  {id:'smelt',world:'winter',name:'빙어',hint:'얼음 연못, 언제나'},
  {id:'minnow',world:'winter',name:'버들치',hint:'얼음 연못, 밝은 낮'},
  {id:'trout',world:'winter',name:'송어',hint:'얼음 연못, 새벽과 낮'},
  {id:'cherry-salmon',world:'winter',name:'산천어',hint:'얼음 연못, 흐리거나 눈 오는 날'},
  {id:'lenok',world:'winter',name:'열목어',hint:'얼음 연못, 새벽이나 안개'},
  {id:'bullhead',world:'winter',name:'동자개',hint:'얼음 연못, 노을과 밤'},
  {id:'snow-loach',world:'winter',name:'눈꽃 미꾸리',hint:'얼음 연못, 눈이 내릴 때'},
  {id:'star-smelt',world:'winter',name:'별빛 빙어',hint:'얼음 연못, 맑은 밤'},
  {id:'clownfish',world:'aquarium',tank:'reef',name:'흰동가리',hint:'산호 수조에서 먹이 주기'},
  {id:'filefish',world:'aquarium',tank:'reef',name:'노랑쥐치',hint:'산호 수조에서 먹이 주기'},
  {id:'seahorse',world:'aquarium',tank:'reef',name:'산호해마',hint:'산호 수조에서 먹이 주기'},
  {id:'sardine',world:'aquarium',tank:'ocean',name:'정어리 떼',hint:'바다 수조에서 사진 찍기'},
  {id:'turtle',world:'aquarium',tank:'ocean',name:'바다거북',hint:'바다 수조에서 사진 찍기'},
  {id:'moon-jelly',world:'aquarium',tank:'jelly',name:'보름달물해파리',hint:'해파리 쉼터에서 쉬기'},
  {id:'lantern-jelly',world:'aquarium',tank:'jelly',name:'작은 등불해파리',hint:'해파리 쉼터에서 쉬기, 밤'},
  {id:'sparrow',world:'library',window:'day',name:'창가 참새',hint:'도서관 창가에서 쉬기, 낮'},
  {id:'moon-moth',world:'library',window:'night',name:'달빛 나방',hint:'도서관 창가에서 쉬기, 밤'},
  {id:'rain-snail',world:'library',window:'rain',name:'빗방울 달팽이',hint:'도서관 창가에서 쉬기, 비 오는 날'}
 ],WORLD_NAMES={winter:'겨울 마을',aquarium:'물결 수족관',library:'책숲 도서관'};
 function load(){try{const data=JSON.parse(localStorage.getItem(KEY)||'{}');return data&&typeof data.entries==='object'&&data.entries?data.entries:{};}catch{return{};}}
 let entries=load();
 function save(){try{localStorage.setItem(KEY,JSON.stringify({v:1,entries}));}catch{}}
 // Returns true for a first meeting so the world can celebrate it.
 function record(id,detail={}){const known=ENTRIES.find(e=>e.id===id);if(!known)return false;entries=load();const old=entries[id],sky=typeof skyWeather==='object'&&skyWeather?skyWeather.state:null;entries[id]={first:old?old.first:Date.now(),count:(old?old.count:0)+1,best:Math.max(old&&old.best||0,detail.cm||0),phase:old?old.phase:(sky?sky.phase:null)};save();if(!old){toast('도감에 새로 기록했어요 · '+known.name);refresh();}return!old;}
 // Tank activities meet one creature each time, preferring ones not yet in the book.
 function observeTank(tank){const sky=typeof skyWeather==='object'&&skyWeather?skyWeather.state:{phase:'day'},pool=ENTRIES.filter(e=>e.tank===tank&&(e.id!=='lantern-jelly'||sky.phase==='night'||sky.phase==='dusk'));if(!pool.length)return null;const fresh=pool.filter(e=>!entries[e.id]),pick=(fresh.length?fresh:pool)[Math.floor(Math.random()*(fresh.length||pool.length))];record(pick.id);return pick.id;}
 function observeWindow(sky){const id=sky.kind==='precip'||sky.kind==='heavy'?'rain-snail':sky.daylight>.4?'sparrow':'moon-moth';record(id);return id;}
 let button=null,dialog=null,list=null,count=null;
 function refresh(){if(!list)return;entries=load();const known=ENTRIES.filter(e=>entries[e.id]).length;count.textContent=known+' / '+ENTRIES.length;list.replaceChildren(...Object.keys(WORLD_NAMES).flatMap(world=>{const head=document.createElement('h3');head.textContent=WORLD_NAMES[world];return[head,...ENTRIES.filter(e=>e.world===world).map(e=>{const item=document.createElement('li'),seen=entries[e.id];item.className=seen?'seen':'unseen';item.textContent=seen?e.name+' · '+seen.count+'번'+(seen.best?' · 최대 '+seen.best+'cm':''):'??? · '+e.hint;return item;})];}));}
 function open(){if(!dialog)return;refresh();dialog.hidden=false;closeButton.focus();}
 function close(){if(dialog)dialog.hidden=true;}
 let closeButton=null;
 try{
  const style=document.createElement('style');style.textContent='.creature-book{position:fixed;inset:0;z-index:12;display:grid;place-items:center;padding:18px;background:#28243466}.creature-book-card{position:relative;width:min(380px,100%);max-height:min(560px,86vh);overflow:auto;padding:24px 22px 18px;border-radius:24px;background:#fff6e8f7;color:#5f5050}.creature-book-card h2{margin:0 0 4px;font-size:20px}.creature-book-card .creature-count{font-size:12px;color:#9a8574;margin:0 0 10px}.creature-book-card h3{font-size:13px;margin:14px 0 6px;color:#7a6658}.creature-book-card ul{list-style:none;margin:0;padding:0}.creature-book-card li{font-size:12px;line-height:1.6;padding:6px 10px;margin:4px 0;border-radius:11px;background:#f1e5d2}.creature-book-card li.unseen{color:#a39587;background:#f5eee3}.creature-book-close{position:absolute;right:8px;top:6px;width:44px;height:44px;border:0;background:transparent;font-size:24px;color:#a08b7c;cursor:pointer}';document.head.append(style);
  dialog=document.createElement('section');dialog.className='creature-book';dialog.hidden=true;dialog.setAttribute('aria-label','생물 도감');const card=document.createElement('div');card.className='creature-book-card';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');const title=document.createElement('h2');title.textContent='생물 도감';count=document.createElement('p');count.className='creature-count';list=document.createElement('ul');closeButton=document.createElement('button');closeButton.className='creature-book-close';closeButton.textContent='×';closeButton.setAttribute('aria-label','도감 닫기');card.append(closeButton,title,count,list);dialog.append(card);document.body.append(dialog);
  closeButton.addEventListener('click',close);dialog.addEventListener('click',e=>{if(e.target===dialog)close();});addEventListener('keydown',e=>{if(e.key==='Escape'&&dialog&&!dialog.hidden)close();});
  // The book sits with the round utility buttons, before help.
  const help=document.getElementById('help');button=document.createElement('button');button.id='creature-book';button.className='icon-btn';button.setAttribute('aria-label','생물 도감');button.title='생물 도감';button.innerHTML='<svg viewBox="0 0 24 24"><path d="M5 4.5h9.5a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h9.5"/><path d="M9 8.5h5"/></svg>';button.addEventListener('click',open);if(help&&help.parentNode&&help.parentNode.insertBefore)help.parentNode.insertBefore(button,help);
 }catch{}
 return{ENTRIES,record,observeTank,observeWindow,open,close,isOpen:()=>Boolean(dialog&&!dialog.hidden),entries:()=>load()};
}
const creatureBook=createCreatureBook();
// Winter's ice fishing reports each catch here.
function onFishCaught(fish){creatureBook.record(fish.id,{cm:fish.cm});}
