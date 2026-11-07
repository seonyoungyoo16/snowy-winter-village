// Line icons shared by the ring, the hotbar and the emote button, drawn on a 24-unit grid like the top bar icons.
const villageIcons={
 snowball:'<circle cx="12" cy="12" r="7"/><path d="M9.5 10h.01M14 9.5h.01M11.5 14h.01"/>',
 bubble:'<circle cx="10" cy="13" r="6"/><circle cx="17.5" cy="6.5" r="2.5"/><path d="M7.5 11.5a3 3 0 0 1 2.5-2.5"/>',
 plane:'<path d="M3 11 21 4l-6 16-3.5-6.5Z"/><path d="m11.5 13.5 4-4"/>',
 kite:'<path d="M12 3l6 7-6 7-6-7Z"/><path d="M6 10h12M12 3v14M12 17c0 2-2 2-2 4"/>',
 lantern:'<path d="M9 4h6M8 7h8l-1 10H9Z"/><path d="M10 20h4M12 17v3"/>',
 cocoa:'<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5Z"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M8.5 3.5c0 1.5 1.5 1.5 1.5 3M12.5 3.5c0 1.5 1.5 1.5 1.5 3"/>',
 camera:'<path d="M4 8h3l1.5-2h7L17 8h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/>',
 heart:'<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/>',
 smile:'<circle cx="12" cy="12" r="9"/><path d="M8 14a4.5 4.5 0 0 0 8 0M9 9.5h.01M15 9.5h.01"/>',
 wave:'<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V11m0-6a1.5 1.5 0 0 1 3 0v6m0-4.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5A6 6 0 0 1 5 18l-1.5-3a1.5 1.5 0 0 1 2.6-1.5L8 16"/>',
 moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
 surprise:'<path d="M12 4v10M12 19h.01"/>',
 clap:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
 pin:'<path d="M12 21s6-6 6-11a6 6 0 0 0-12 0c0 5 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/>',
 paw:'<circle cx="7" cy="10" r="1.6"/><circle cx="10.5" cy="6.5" r="1.6"/><circle cx="14.5" cy="6.5" r="1.6"/><circle cx="18" cy="10" r="1.6"/><path d="M12 12c-3 0-5 3.5-5 5.5S9 20 12 19s5 .5 5-1.5S15 12 12 12Z"/>',
 dice:'<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9 9h.01M15 15h.01M12 12h.01"/>',
 carry:'<path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4"/>',
 close:'<path d="M6 6l12 12M18 6 6 18"/>'
};
// An icon as markup; an unknown name falls back to its own text so an older caller still reads.
function villageIcon(name){return villageIcons[name]?'<svg viewBox="0 0 24 24" aria-hidden="true">'+villageIcons[name]+'</svg>':'<span aria-hidden="true">'+String(name||'')+'</span>';}
const EMOTE_ICONS=['heart','smile','wave','moon','surprise','clap'];
// A ring menu for one-finger choices: hold the scene still for half a second (or press Q) and pick an emote,
// a ping, a companion or a game. Things to hold (the throwable, kite, lantern, cocoa, camera) live in the hotbar. Arrow keys move around the ring, Enter picks, Esc closes.
function createRadialMenu(){
 const HOLD=.48,SLOP=10,RADIUS=112,extra=[];
 const ring=document.createElement('div');ring.className='radial-menu';ring.hidden=true;ring.setAttribute('role','menu');ring.setAttribute('aria-label','빠른 메뉴');
 const style=document.createElement('style');style.textContent='.radial-menu{position:fixed;inset:0;z-index:30;background:rgba(40,40,70,.28)}.radial-menu button{position:absolute;width:52px;height:52px;margin:-26px 0 0 -26px;border:0;border-radius:50%;background:rgba(255,247,232,.95);color:#5f5050;font:700 19px/1 "Winter Jua",sans-serif;box-shadow:0 3px 12px rgba(40,40,70,.22);cursor:pointer;display:grid;place-items:center}.radial-menu button svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.radial-menu button small{position:absolute;top:55px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:11px;font-weight:700;color:#fff8e8;text-shadow:0 1px 3px rgba(0,0,0,.65);pointer-events:none}.radial-menu button:focus-visible{outline:3px solid #8e9d83;outline-offset:2px}.radial-menu .radial-close{background:#8e9d83;color:#fff8e8;width:44px;height:44px;margin:-22px 0 0 -22px}';(document.head||document.body).append(style);document.body.append(ring);
 // Built fresh each time so a winter-only or newly hatched choice shows up when it applies.
 function items(){const out=[];if(typeof villagePlay==='object'&&villagePlay)villagePlay.EMOTES.forEach((e,i)=>out.push({icon:EMOTE_ICONS[i]||e[0],label:e[1],run:()=>villagePlay.say(i)}));
  if(typeof villageCompanions==='object'&&villageCompanions&&villageCompanions.state.owned.length)out.push({icon:'paw',label:'동반 친구',run:()=>villageCompanions.cycle()});
  for(const it of extra)if(!it.when||it.when())out.push(typeof it.label==='function'?{...it,label:it.label()}:it);return out;}
 let buttons=[],shown=[],press=null,suppress=false,restore=null,at=null;
 function busy(){return!entered||(typeof photoMode==='object'&&photoMode&&photoMode.on)||[...document.querySelectorAll('.creature-book')].some(s=>!s.hidden)||(typeof helpOpen==='function'&&helpOpen());}
 function open(x=innerWidth/2,y=innerHeight/2,held=false){if(busy())return false;at={x,y,held};shown=items();const r=shown.length>8?RADIUS+16:RADIUS,cx=Math.max(r+30,Math.min(innerWidth-r-30,x)),cy=Math.max(r+30,Math.min(innerHeight-r-40,y));
  buttons=shown.map((it,i)=>{const a=-Math.PI/2+i*Math.PI*2/shown.length,b=document.createElement('button'),label=document.createElement('small');b.setAttribute('role','menuitem');b.setAttribute('aria-label',it.label);b.innerHTML=villageIcon(it.icon);label.textContent=it.label;b.append(label);b.style.left=(cx+Math.cos(a)*r)+'px';b.style.top=(cy+Math.sin(a)*r)+'px';b.addEventListener('click',()=>pick(i));return b;});
  const x0=document.createElement('button');x0.className='radial-close';x0.innerHTML=villageIcon('close');x0.setAttribute('aria-label','빠른 메뉴 닫기');x0.style.left=cx+'px';x0.style.top=cy+'px';x0.addEventListener('click',close);
  restore=document.activeElement;ring.replaceChildren(...buttons,x0);ring.hidden=false;if(buttons[0])buttons[0].focus();return true;}
 function close(){if(ring.hidden)return;ring.hidden=true;ring.replaceChildren();buttons=[];if(restore&&restore.focus)restore.focus({preventScroll:true});restore=null;}
 // Each choice hears where the ring was opened ({x,y,held}); a long press marks a spot on the scene.
 function pick(i){const it=shown[i],where=at;close();if(it)it.run(where);return Boolean(it);}
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
  tick(dt){if(!press)return;press.t+=dt;if(press.t>=HOLD){const p=press;press=null;if(open(p.x,p.y,true))suppress=true;}}};
}
const radialMenu=createRadialMenu();
