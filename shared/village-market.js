// A gentle village economy kept in this browser only: shells come from small activities with a daily cap,
// and the resident's shop sells little things that never change how anyone's avatar looks. No ranking, no totals for others to see.
function createVillageMarket(){
 const KEY='village-purse',DAILY_CAP=15,BANK_DAILY=1,BANK_MIN=10;
 const ITEMS=[
  {id:'paper-3',kind:'paper',name:'엽서 편지지',price:6},
  {id:'paper-4',kind:'paper',name:'별빛 편지지',price:8},
  {id:'kite-sun',kind:'kite',name:'치자빛 연',price:5,color:0xf2c14e},
  {id:'kite-sea',kind:'kite',name:'물빛 연',price:5,color:0x6fb6c9},
  {id:'kite-plum',kind:'kite',name:'자두빛 연',price:5,color:0xb07aa8},
  {id:'lantern-peach',kind:'lantern',name:'복숭아빛 풍등',price:4,color:0xffb59a},
  {id:'lantern-sky',kind:'lantern',name:'하늘빛 풍등',price:4,color:0xbfe1ff}
 ];
 const today=(ms=Date.now())=>Math.floor((ms+9*3600e3)/86400e3);
 function load(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&typeof v==='object'&&Number.isFinite(v.shells))return{shells:Math.max(0,Math.floor(v.shells)),bank:Math.max(0,Math.floor(v.bank||0)),owned:Array.isArray(v.owned)?v.owned.filter(id=>ITEMS.some(i=>i.id===id)):[],use:v.use&&typeof v.use==='object'?v.use:{},day:v.day|0,earned:v.earned|0,bankDay:v.bankDay|0};}catch{}return{shells:0,bank:0,owned:[],use:{},day:0,earned:0,bankDay:0};}
 function save(p){try{localStorage.setItem(KEY,JSON.stringify(p));}catch{}}
 // The piggy bank adds one shell per Seoul day while at least ten are saved.
 function settle(p){const d=today();if(p.day!==d){p.day=d;p.earned=0;}if(p.bank<BANK_MIN||!p.bankDay)p.bankDay=d;else if(d>p.bankDay){p.bank+=BANK_DAILY*Math.min(7,d-p.bankDay);p.bankDay=d;}return p;}
 function purse(){return settle(load());}
 function earn(n,why){const p=purse(),room=Math.max(0,DAILY_CAP-p.earned),got=Math.min(room,Math.max(0,Math.floor(n)));if(!got)return 0;p.shells+=got;p.earned+=got;save(p);toast('조개껍데기 '+got+'개를 받았어요'+(why?' · '+why:''));refresh();return got;}
 function buy(id){const item=ITEMS.find(i=>i.id===id),p=purse();if(!item||p.owned.includes(id))return false;if(p.shells<item.price){toast('조개껍데기가 조금 모자라요');return false;}p.shells-=item.price;p.owned.push(id);if(item.kind!=='paper')p.use[item.kind]=id;save(p);toast(item.name+' 마련했어요');refresh();return true;}
 // Selling gives half back; an item in use is put away first.
 function sell(id){const item=ITEMS.find(i=>i.id===id),p=purse();if(!item||!p.owned.includes(id))return false;p.owned=p.owned.filter(o=>o!==id);if(p.use[item.kind]===id)delete p.use[item.kind];p.shells+=Math.floor(item.price/2);save(p);toast(item.name+' 다시 내놓았어요');refresh();return true;}
 function use(id){const item=ITEMS.find(i=>i.id===id),p=purse();if(!item||item.kind==='paper'||!p.owned.includes(id))return false;p.use[item.kind]=p.use[item.kind]===id?undefined:id;save(p);refresh();return true;}
 function deposit(n){const p=purse(),k=Math.min(p.shells,Math.max(0,Math.floor(n)));if(!k)return 0;p.shells-=k;p.bank+=k;save(p);refresh();return k;}
 function withdraw(n){const p=purse(),k=Math.min(p.bank,Math.max(0,Math.floor(n)));if(!k)return 0;p.bank-=k;p.shells+=k;save(p);refresh();return k;}
 function owns(id){return purse().owned.includes(id);}
 function choice(kind){const p=purse(),id=p.use[kind],item=ITEMS.find(i=>i.id===id);return item?item.color:null;}
 // The shop opens from the resident's conversation in every world.
 const sheet=document.createElement('section');sheet.className='creature-book village-notes village-market';sheet.hidden=true;const card=document.createElement('div');card.className='creature-book-card';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');const closeButton=document.createElement('button');closeButton.className='creature-book-close';closeButton.textContent='×';closeButton.setAttribute('aria-label','가게 닫기');const body=document.createElement('div');card.append(closeButton,body);sheet.append(card);document.body.append(sheet);
 function close(){sheet.hidden=true;}closeButton.addEventListener('click',close);sheet.addEventListener('click',e=>{if(e.target===sheet)close();});addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden)close();});
 const el=(tag,props={},...kids)=>{const n=document.createElement(tag);Object.assign(n,props);n.append(...kids);return n;},btn=(text,run)=>{const b=el('button',{className:'note-send',textContent:text});b.addEventListener('click',run);return b;};
 function refresh(){if(sheet.hidden)return;const p=purse();body.replaceChildren(el('h2',{textContent:'마을 가게'}),el('p',{className:'creature-count',textContent:'조개껍데기 '+p.shells+'개 · 저금통 '+p.bank+'개 · 오늘 받은 '+p.earned+'/'+DAILY_CAP+' · 이 브라우저에만 보여요'}),
  el('ul',{},...ITEMS.map(item=>{const mine=p.owned.includes(item.id),row=el('li',{className:mine?'seen':'unseen'},el('small',{textContent:(mine?(item.kind!=='paper'&&p.use[item.kind]===item.id?'사용 중':'가지고 있어요'):'조개껍데기 '+item.price+'개')}),document.createTextNode(item.name));if(mine){if(item.kind!=='paper')row.append(btn(p.use[item.kind]===item.id?'그만 쓰기':'쓰기',()=>use(item.id)));row.append(btn('되팔기 (+'+Math.floor(item.price/2)+')',()=>sell(item.id)));}else row.append(btn('마련하기',()=>buy(item.id)));return row;})),
  el('h3',{textContent:'저금통'}),el('p',{className:'creature-count',textContent:BANK_MIN+'개 이상 넣어 두면 하루에 '+BANK_DAILY+'개씩 늘어요.'}),btn('5개 넣기',()=>deposit(5)),btn('5개 꺼내기',()=>withdraw(5)));}
 function open(){if(!entered)return;sheet.hidden=false;refresh();closeButton.focus();}
 if(typeof residentGuide==='object'&&residentGuide.addAction)residentGuide.addAction('마을 가게',()=>{residentGuide.close();open();});
 return{ITEMS,DAILY_CAP,earn,buy,sell,use,deposit,withdraw,owns,choice,purse,open,close,isOpen:()=>!sheet.hidden};
}
const villageMarket=createVillageMarket();
