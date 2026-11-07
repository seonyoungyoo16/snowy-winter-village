// A ring menu for one-finger choices: hold the scene still for half a second (or press Q) and pick an emote,
// sky play, the camera or a companion. Arrow keys move around the ring, Enter picks, Esc closes.
function createRadialMenu(){
 const HOLD=.48,SLOP=10,RADIUS=104,extra=[];
 const ring=document.createElement('div');ring.className='radial-menu';ring.hidden=true;ring.setAttribute('role','menu');ring.setAttribute('aria-label','빠른 메뉴');
 const style=document.createElement('style');style.textContent='.radial-menu{position:fixed;inset:0;z-index:30;background:rgba(40,40,70,.12)}.radial-menu button{position:absolute;width:52px;height:52px;margin:-26px 0 0 -26px;border:0;border-radius:50%;background:rgba(255,247,232,.95);color:#5f5050;font:700 19px/1 "Winter Jua",sans-serif;box-shadow:0 3px 12px rgba(40,40,70,.22);cursor:pointer;display:grid;place-items:center}.radial-menu button small{display:none;position:absolute;top:56px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:11px;color:#fff8e8;text-shadow:0 1px 3px rgba(0,0,0,.6)}.radial-menu button:focus small,.radial-menu button:hover small{display:block}.radial-menu button:focus-visible{outline:3px solid #8e9d83;outline-offset:2px}.radial-menu .radial-close{background:#8e9d83;color:#fff8e8;width:44px;height:44px;margin:-22px 0 0 -22px}';(document.head||document.body).append(style);document.body.append(ring);
 // Built fresh each time so a winter-only or newly hatched choice shows up when it applies.
 function items(){const out=[];if(typeof villagePlay==='object'&&villagePlay){villagePlay.EMOTES.forEach((e,i)=>out.push({icon:e[0],label:e[1],run:()=>villagePlay.say(i)}));if(CURRENT_WORLD==='winter'){out.push({icon:'◇',label:villagePlay.kiteOn?'연 내리기':'연',run:()=>villagePlay.toggleKite()});out.push({icon:'✦',label:'풍등',run:()=>villagePlay.lantern()});}}
  if(typeof photoMode==='object'&&photoMode)out.push({icon:'▣',label:'사진',run:()=>photoMode.enter()});
  if(typeof villageCompanions==='object'&&villageCompanions&&villageCompanions.state.owned.length)out.push({icon:'✿',label:'동반 친구',run:()=>villageCompanions.cycle()});
  for(const it of extra)if(!it.when||it.when())out.push(it);return out;}
 let buttons=[],shown=[],press=null,suppress=false,restore=null;
 function busy(){return!entered||(typeof photoMode==='object'&&photoMode&&photoMode.on)||[...document.querySelectorAll('.creature-book')].some(s=>!s.hidden)||(typeof helpOpen==='function'&&helpOpen());}
 function open(x=innerWidth/2,y=innerHeight/2){if(busy())return false;shown=items();const r=shown.length>8?RADIUS+16:RADIUS,cx=Math.max(r+30,Math.min(innerWidth-r-30,x)),cy=Math.max(r+30,Math.min(innerHeight-r-40,y));
  buttons=shown.map((it,i)=>{const a=-Math.PI/2+i*Math.PI*2/shown.length,b=document.createElement('button'),label=document.createElement('small');b.setAttribute('role','menuitem');b.setAttribute('aria-label',it.label);b.textContent=it.icon;label.textContent=it.label;b.append(label);b.style.left=(cx+Math.cos(a)*r)+'px';b.style.top=(cy+Math.sin(a)*r)+'px';b.addEventListener('click',()=>pick(i));return b;});
  const x0=document.createElement('button');x0.className='radial-close';x0.textContent='×';x0.setAttribute('aria-label','빠른 메뉴 닫기');x0.style.left=cx+'px';x0.style.top=cy+'px';x0.addEventListener('click',close);
  restore=document.activeElement;ring.replaceChildren(...buttons,x0);ring.hidden=false;if(buttons[0])buttons[0].focus();return true;}
 function close(){if(ring.hidden)return;ring.hidden=true;ring.replaceChildren();buttons=[];if(restore&&restore.focus)restore.focus({preventScroll:true});restore=null;}
 function pick(i){const it=shown[i];close();if(it)it.run();return Boolean(it);}
 function focusStep(d){const i=buttons.indexOf(document.activeElement),n=buttons.length;if(n)buttons[((i<0?0:i+d)%n+n)%n].focus();}
 ring.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}else if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();focusStep(1);}else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();focusStep(-1);}else if(/^[1-9]$/.test(e.key)&&Number(e.key)<=buttons.length){e.preventDefault();pick(Number(e.key)-1);}});
 ring.addEventListener('click',e=>{if(e.target===ring)close();});
 addEventListener('keydown',e=>{if((e.key==='q'||e.key==='Q')&&!e.repeat&&ring.hidden&&e.target.tagName!=='INPUT'&&e.target.tagName!=='TEXTAREA'){if(open())e.preventDefault();}});
 // Long press on the scene: a still hold opens the ring there, and the release that follows does not walk.
 function pressStart(x,y,id){press={x,y,id,t:0};}
 function pressMove(x,y){if(press&&Math.hypot(x-press.x,y-press.y)>SLOP)press=null;}
 function pressEnd(){press=null;if(suppress){suppress=false;return true;}return false;}
 addEventListener('pointerdown',e=>{if(e.target===renderer.domElement&&e.isPrimary!==false&&(e.button===0||e.button===undefined))pressStart(e.clientX,e.clientY,e.pointerId);},true);
 addEventListener('pointermove',e=>{if(suppress){e.stopImmediatePropagation();return;}pressMove(e.clientX,e.clientY);},true);
 for(const k of['pointerup','pointercancel'])addEventListener(k,e=>{if(pressEnd())e.stopImmediatePropagation();},true);
 addEventListener('contextmenu',e=>{if(e.target===renderer.domElement&&(press||suppress||!ring.hidden))e.preventDefault();},true);
 return{HOLD,items,open,close,pick,isOpen:()=>!ring.hidden,addItem(it){extra.push(it);},pressStart,pressMove,pressEnd,
  tick(dt){if(!press)return;press.t+=dt;if(press.t>=HOLD){const p=press;press=null;if(open(p.x,p.y))suppress=true;}}};
}
const radialMenu=createRadialMenu();
