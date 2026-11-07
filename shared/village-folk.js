// Village folk: many small residents built from the same avatar parts as visitors (animal, coat, scarf, accessory, size),
// each with a name, a temperament and a loop of stops in one part of the space. Where everyone stands is worked out
// from Seoul time alone, so friends in the same room see the same folk in the same places without sending anything.
// Walk up to one and tap the name above them to chat; a reply a day makes you a little closer, and a close friend
// hands over a shell once. In winter a travelling merchant visits the market street every third day and at weekends.
function createVillageFolk(){
 const WORLD=CURRENT_WORLD,COUNT={winter:14,aquarium:9,library:9}[WORLD]||8,SHOW=5,SEE=28,TALK=2.8,KEY='village-folk-v1',SPEED=.9,H=3600e3;
 const NAMES=['콩이','보리','몽이','단비','호두','솔이','라떼','모카','밤톨','두부','토리','쿠키','율무','감자','하루','나리','별이','구름','포도','땅콩','망고','레몬','꼬미','도토리','깨비','사과','초코','마루','수수','눈꽃'];
 const TYPES={
  chatty:{label:'수다쟁이',hi:['어머, 안녕! 오늘 무슨 일 있었어?','마침 잘 왔어, 할 얘기가 산더미야!'],glad:'나도 나도! 다음엔 더 길게 얘기하자.',how:'하루 종일 떠들었더니 목이 다 쉬었어. 그래도 즐거워!'},
  calm:{label:'느긋함',hi:['천천히 와도 괜찮아요.','바람 소리 들려요? 좋다…'],glad:'네, 저도요. 같이 잠깐 쉬어요.',how:'별일 없어서 좋은 날이에요.'},
  busy:{label:'부지런함',hi:['아, 안녕하세요! 잠깐이면 돼요.','오늘 할 일이 많지만 반가워요!'],glad:'저도요! 다음엔 차 한 잔 해요.',how:'아침부터 길을 쓸고 장작도 날랐어요. 뿌듯해요!'},
  dreamy:{label:'몽상가',hi:['구름 모양이 꼭 고래 같지 않아요?','어젯밤 꿈에서 여기 와 본 것 같아요.'],glad:'반가움이 눈송이처럼 내려앉네요.',how:'하늘 색을 세어 보는 중이었어요. 벌써 일곱 가지예요.'},
  shy:{label:'수줍음',hi:['아… 안녕하세요.','저, 저한테 말 거신 거예요?'],glad:'…저, 저도요. 헤헤.',how:'조용히 산책하는 게 제일 좋아요.'},
  curious:{label:'호기심쟁이',hi:['그건 뭐예요? 처음 보는데!','저쪽엔 뭐가 있을까요?'],glad:'반가워요! 다음엔 어디서 왔는지 들려줘요.',how:'오늘은 발자국 모양을 모으고 있어요. 벌써 열두 개!'}};
 const TYPE_IDS=Object.keys(TYPES),ACCESSORIES=['none','beanie','earmuffs','flower','glasses','none'];
 const PLACES={aquarium:['바다 수조','산호 정원','해파리 쉼터'],library:['책장 숲','창가 자리','스탬프 책상']};
 // A small seeded generator per space, so every browser builds the same folk.
 let seed=[...WORLD].reduce((h,c)=>Math.imul(h^c.charCodeAt(0),16777619)>>>0,2166136261);const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const districts=typeof villageDistricts==='object'&&villageDistricts?villageDistricts.DISTRICTS:null;
 const BOUNDS={winter:null,aquarium:{r:18},library:{x:17,z:14}}[WORLD];
 function freeSpot(home){for(let i=0;i<80;i++){let x,z;if(home){const a=rnd()*Math.PI*2,r=rnd()*home.r*.7;x=home.x+Math.cos(a)*r;z=home.z+Math.sin(a)*r;}else if(BOUNDS&&BOUNDS.r){const a=rnd()*Math.PI*2,r=Math.sqrt(rnd())*BOUNDS.r;x=Math.cos(a)*r;z=Math.sin(a)*r;}else{x=(rnd()*2-1)*(BOUNDS?BOUNDS.x:18);z=(rnd()*2-1)*(BOUNDS?BOUNDS.z:18);}
  if(!blocked(x,z,.8)&&Math.hypot(x,z-7)>2.2)return{x,z};}return{x:home?home.x:0,z:home?home.z+3:3};}
 const day=(ms=now())=>Math.floor((ms+9*H)/86400e3),now=()=>Date.now()+(typeof serverOffset==='number'?serverOffset:0);
 const folk=[];const used=new Set();
 for(let i=0;i<COUNT;i++){let n;do{n=NAMES[Math.floor(rnd()*NAMES.length)];}while(used.has(n));used.add(n);
  const home=districts?districts[i%districts.length]:null,stops=[0,1,2].map(()=>freeSpot(home)),type=TYPE_IDS[Math.floor(rnd()*TYPE_IDS.length)];
  const look={c:1+Math.floor(rnd()*6),s:1+Math.floor(rnd()*6),a:ACCESSORIES[Math.floor(rnd()*ACCESSORIES.length)]},kind=Math.floor(rnd()*3),scale=.84+rnd()*.2,offset=rnd()*3600;
  const legs=stops.map((a,k)=>{const b=stops[(k+1)%stops.length];return{a,b,walk:Math.hypot(b.x-a.x,b.z-a.z)*1.3/SPEED,rest:16+rnd()*26};});
  folk.push({id:WORLD+'-'+i,name:n,type,look,kind,scale,home:home&&home.id,stops,legs,offset,cycle:legs.reduce((s,l)=>s+l.walk+l.rest,0),night:rnd()<.35,actor:null,pos:{x:stops[0].x,z:stops[0].z},yaw:0,walking:false});}
 // The merchant stands beside the middle stall of the market street on visiting days.
 const marketD=districts&&districts.find(d=>d.id==='market');
 const merchant=marketD?{id:'merchant',name:'떠돌이 상인 바람',type:'curious',look:{c:4,s:3,a:'beanie'},kind:2,scale:1,merchant:true,spot:{x:marketD.x+2.6,z:marketD.z},actor:null,pos:{x:marketD.x+2.6,z:marketD.z},yaw:-Math.PI/2,walking:false}:null;
 const merchantDay=(ms=now())=>{const d=day(ms),wd=new Date(ms+9*H).getUTCDay();return d%3===0||wd===0||wd===6;};
 // Each leg follows the walking grid once it is needed; the timing uses the straight distance so every browser agrees.
 const routes=new Map();
 function route(f,k){const key=f.id+':'+k;if(routes.has(key))return routes.get(key);const{a,b}=f.legs[k];let pts=[{x:a.x,z:a.z}];
  if(typeof pathTo==='function'){const keep=player.position.clone();player.position.set(a.x,player.position.y,a.z);let p=[];try{p=pathTo(b.x,b.z);}catch{p=[];}player.position.copy(keep);for(const v of p)pts.push({x:v.x,z:v.z});}
  if(pts.length<2||Math.hypot(pts.at(-1).x-b.x,pts.at(-1).z-b.z)>1.2)pts.push({x:b.x,z:b.z});const len=[0];for(let i=1;i<pts.length;i++)len.push(len[i-1]+Math.hypot(pts[i].x-pts[i-1].x,pts[i].z-pts[i-1].z));const r={pts,len};routes.set(key,r);return r;}
 function along(r,f){const want=f*r.len.at(-1);for(let i=1;i<r.pts.length;i++)if(r.len[i]>=want){const t=(want-r.len[i-1])/Math.max(1e-6,r.len[i]-r.len[i-1]),a=r.pts[i-1],b=r.pts[i];return{x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,yaw:Math.atan2(b.x-a.x,b.z-a.z)};}const e=r.pts.at(-1);return{x:e.x,z:e.z,yaw:0};}
 // Where one of the folk is at a moment: walking a leg, or resting at the stop it reached.
 function placeAt(f,ms,detailed=true){if(f.merchant)return{x:f.spot.x,z:f.spot.z,yaw:f.yaw,walking:false,out:merchantDay(ms)};
  const hour=new Date(ms+9*H).getUTCHours(),out=!(hour<6||hour>=23)||f.night;let t=((ms/1000+f.offset)%f.cycle+f.cycle)%f.cycle;
  for(let k=0;k<f.legs.length;k++){const l=f.legs[k];if(t<l.walk){const frac=t/l.walk;if(!detailed){return{x:l.a.x+(l.b.x-l.a.x)*frac,z:l.a.z+(l.b.z-l.a.z)*frac,yaw:Math.atan2(l.b.x-l.a.x,l.b.z-l.a.z),walking:true,out};}const p=along(route(f,k),frac);return{...p,walking:true,out};}t-=l.walk;if(t<l.rest)return{x:l.b.x,z:l.b.z,yaw:null,walking:false,out};t-=l.rest;}
  return{x:f.stops[0].x,z:f.stops[0].z,yaw:null,walking:false,out};}
 function actorFor(f){if(f.actor)return f.actor;const a=avatar(f.kind,f.look);a.root.scale.setScalar(f.scale);a.root.name='folk-'+f.id;a.root.visible=false;scene.add(a.root);f.actor=a;return a;}
 // Friendship: one step a Seoul day per person, a shell from a close friend once.
 const load=()=>{try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');return s&&typeof s==='object'&&!Array.isArray(s)?s:{};}catch{return{};}};
 let bond=load();const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(bond));}catch{}};
 const bondOf=id=>{const b=bond[id];return b&&Number.isFinite(b.f)?b:{f:0,d:-1,g:false};};
 // Chat card.
 const style=document.createElement('style');style.textContent='.folk-bubble{position:fixed;z-index:3;transform:translate(-50%,-100%);white-space:nowrap;padding:7px 12px;border:0;border-radius:16px;background:#fff3e3ee;color:#655346;font:700 11px "Winter Jua",sans-serif;min-height:34px;box-shadow:0 3px 12px #302c3326;cursor:pointer}.folk-bubble[hidden],.folk-dialog[hidden]{display:none}.folk-dialog{position:fixed;inset:0;z-index:12;display:grid;align-items:end;justify-items:center;padding:18px;background:linear-gradient(0deg,#29213266,transparent 65%)}.folk-card{position:relative;width:min(360px,100%);padding:22px 22px 18px;border-radius:25px;background:#fff3e3;color:#69534f;text-align:center;box-shadow:0 8px 30px #2a223326}.folk-card h2{margin:0 0 4px;font-size:19px}.folk-card .folk-tag{display:inline-block;margin-bottom:12px;padding:3px 10px;border-radius:999px;background:#efe1cb;font-size:11px}.folk-card p{font-size:13px;line-height:1.8;margin:0 0 14px}.folk-card .folk-replies{display:grid;gap:7px}.folk-card button{font:inherit;min-height:44px;border:0;border-radius:14px;cursor:pointer;background:#efe1cb;color:#6a5350}.folk-card .folk-close{position:absolute;right:8px;top:7px;width:40px;background:transparent;color:#a18b7d;font-size:24px}';(document.head||document.body).append(style);
 const bubble=document.createElement('button');bubble.className='folk-bubble';bubble.hidden=true;document.body.append(bubble);
 const dialog=document.createElement('section');dialog.className='folk-dialog';dialog.hidden=true;const card=document.createElement('div');card.className='folk-card';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');
 const closeButton=document.createElement('button');closeButton.className='folk-close';closeButton.textContent='×';closeButton.setAttribute('aria-label','이야기 닫기');const title=document.createElement('h2'),tag=document.createElement('span'),line=document.createElement('p'),replies=document.createElement('div');tag.className='folk-tag';replies.className='folk-replies';
 card.append(closeButton,title,tag,line,replies);dialog.append(card);document.body.append(dialog);
 let near=null,talking=null;
 function close(){dialog.hidden=true;talking=null;}closeButton.addEventListener('click',close);dialog.addEventListener('click',e=>{if(e.target===dialog)close();});addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialog.hidden)close();});
 const levelName=f=>f>=3?'친한 사이':f>=1?'아는 사이':'처음 만남';
 function recommend(){if(districts){const here=villageDistricts.current&&villageDistricts.current.id,pick=districts.filter(d=>d.id!==here)[day()%(districts.length-1)];return pick.name+'에 가 봐요. 등불도 밝혀 보고요!';}const list=PLACES[WORLD]||[];return list.length?list[day()%list.length]+' 쪽이 요즘 제일 좋아요.':'여기저기 다 좋아요.';}
 function weatherLine(){const s=typeof skyWeather==='object'&&skyWeather?skyWeather.state:null;if(!s)return'';if(s.kind==='heavy'||s.kind==='precip')return WORLD==='winter'?' 눈이 펑펑 와서 발자국이 금방 지워져요.':' 밖에 비가 오나 봐요.';if(s.kind==='rainbow')return' 무지개 봤어요?';return s.phase==='night'?' 밤이라 조금 졸려요.':'';}
 function choices(f){const t=TYPES[f.type];if(f.merchant)return[['구경할게요',()=>{close();if(typeof villageMarket==='object'&&villageMarket)villageMarket.open();return null;}],['어디서 왔어요?',()=>'눈 덮인 산 너머, 등불이 많은 마을에서요. 사흘마다 들르니까 또 봐요!'],['오늘의 이야기',()=>'오는 길에 얼음 호수에서 스케이트 타는 여우를 봤어요. 아주 능숙하던걸요.']];
  return[['반가워요!',()=>t.glad],['요즘 어때요?',()=>t.how+weatherLine()],['추천할 곳 있어요?',recommend]];}
 function render(f){const b=bondOf(f.id),t=TYPES[f.type];title.textContent=f.name;tag.textContent=(f.merchant?'떠돌이 상인':t.label)+' · '+levelName(b.f);
  line.textContent=f.merchant?'먼 마을에서 왔어요. 오늘만 가게를 열어요!':b.f>=3?nickname()+' 님 오셨네요! 기다렸어요.':t.hi[day()%t.hi.length];
  replies.replaceChildren(...choices(f).map(([label,run],i)=>{const btn=document.createElement('button');btn.textContent=label;btn.addEventListener('click',()=>reply(i));return btn;}));}
 const nickname=()=>{try{return typeof myNickname==='function'?myNickname():(document.getElementById('nickname-label')||{}).textContent||'손님';}catch{return'손님';}};
 function open(id){const f=[...folk,merchant].find(x=>x&&x.id===id);if(!f||!entered)return false;talking=f;render(f);dialog.hidden=false;closeButton.focus();return true;}
 function reply(i){const f=talking;if(!f)return null;const said=choices(f)[i][1]();if(said===null)return'shop';const b=bondOf(f.id),d=day();let gift=false;
  if(b.d!==d){b.f+=1;b.d=d;if(b.f>=3&&!b.g&&typeof villageMarket==='object'&&villageMarket){b.g=true;gift=villageMarket.earn(1,f.name+'의 선물')>0;}bond[f.id]=b;save();}
  line.textContent=said+(gift?' 이건 작은 선물이에요!':'');tag.textContent=(f.merchant?'떠돌이 상인':TYPES[f.type].label)+' · '+levelName(b.f);const done=document.createElement('button');done.textContent='고마워요';done.addEventListener('click',close);replies.replaceChildren(done);
  if(typeof villageJournal==='object'&&villageJournal&&villageJournal.note)villageJournal.note('first-folk');return said;}
 bubble.addEventListener('click',()=>{if(near)open(near.id);});
 const project=new THREE.Vector3();
 return{FOLK:folk,merchant,TYPES,placeAt,merchantDay,open,close,reply,isOpen:()=>!dialog.hidden,bondOf,dialog,bubble,get near(){return near;},
  visible:()=>[...folk,merchant].filter(f=>f&&f.actor&&f.actor.root.visible),
  tick(dt){const ms=now(),me=player.position,t=performance.now()/1000;
   // Rough places for everyone, then full detail (and a body) only for the few nearest.
   const all=[...folk,merchant].filter(Boolean).map(f=>({f,p:placeAt(f,ms,false)})).filter(o=>o.p.out).map(o=>({...o,d:Math.hypot(o.p.x-me.x,o.p.z-me.z)})).sort((a,b)=>a.d-b.d);
   const shown=new Set(all.filter(o=>o.d<SEE).slice(0,SHOW).map(o=>o.f));
   for(const f of[...folk,merchant]){if(!f)continue;if(!shown.has(f)){if(f.actor)f.actor.root.visible=false;continue;}
    const a=actorFor(f),p=talking===f?{x:f.pos.x,z:f.pos.z,yaw:Math.atan2(me.x-f.pos.x,me.z-f.pos.z),walking:false}:placeAt(f,ms,true);f.pos={x:p.x,z:p.z};f.walking=p.walking;
    if(p.yaw===null){let face=null,best=3.2;for(const g of shown)if(g!==f&&!g.walking){const d=Math.hypot(g.pos.x-p.x,g.pos.z-p.z);if(d<best){best=d;face=g;}}p.yaw=face?Math.atan2(face.pos.x-p.x,face.pos.z-p.z):Math.hypot(me.x-p.x,me.z-p.z)<5?Math.atan2(me.x-p.x,me.z-p.z):f.yaw;}
    f.yaw=p.yaw;const y=typeof groundHeight==='function'?groundHeight(p.x,p.z):0;a.root.visible=true;a.root.position.set(p.x,y+(p.walking?Math.abs(Math.sin(t*7+f.scale*9))*.05:Math.sin(t*1.6+f.scale*5)*.012),p.z);
    let dy=f.yaw-a.root.rotation.y;dy=Math.atan2(Math.sin(dy),Math.cos(dy));a.root.rotation.y+=dy*Math.min(1,dt*6);
    const swing=p.walking?Math.sin(t*7+f.scale*9)*.55:0;if(a.legs)a.legs.forEach((l,i)=>{l.rotation.x=i?swing:-swing;});if(a.arms)a.arms.forEach((m,i)=>{m.rotation.x=i?-swing*.7:swing*.7;});}
   // The nearest one within reach gets a name bubble to tap.
   near=null;if(entered&&dialog.hidden&&!(typeof helpOpen==='function'&&helpOpen())){let best=TALK;for(const f of shown){const d=Math.hypot(f.pos.x-me.x,f.pos.z-me.z);if(d<best){best=d;near=f;}}}
   if(near&&near.actor){project.set(near.pos.x,(typeof groundHeight==='function'?groundHeight(near.pos.x,near.pos.z):0)+2.3*near.scale,near.pos.z).project(camera);const x=(project.x+1)*innerWidth/2,y=(-project.y+1)*innerHeight/2;
    bubble.textContent=near.name+(near.merchant?' · 가게':' · 말 걸기');bubble.setAttribute('aria-label',near.name+'에게 말 걸기');bubble.style.left=x+'px';bubble.style.top=y+'px';bubble.hidden=project.z>1||project.z<-1;}else bubble.hidden=true;}};
}
const villageFolk=createVillageFolk();
