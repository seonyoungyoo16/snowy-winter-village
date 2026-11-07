// Keeps the screen quiet once you know your way around: the walking hint steps aside after the first walk, the corner
// notes (already in the help window) fade after a few seconds, the hotbar sits in line with the other bottom controls
// with the emote button at its end, and on a phone the walk buttons shrink and the two world-travel buttons fold into one.
function createVillageTidy(){
 const NOTE_TIME=8,WALKED=1.5,hint=document.getElementById('hint'),controls=document.getElementById('controls'),idleHint=hint?hint.textContent:'';
 const style=document.createElement('style');style.textContent='.hint[data-quiet="1"]{display:none}.keyboard.tidy-faded,.saved-note.tidy-faded{opacity:0;transition:opacity .8s}.village-hotbar.in-controls{position:static;transform:none;pointer-events:auto}.play-toggle.in-hotbar{position:static;width:46px;height:46px;margin-left:3px;box-shadow:none;background:#f1dfbf}.world-fold{display:none}@media(max-width:600px){.topbar .brand p{display:none}.travel{gap:5px}.travel button{font-size:11px;padding:6px 10px;min-height:38px}.travel button span{font-size:12px;margin-right:3px}.world-fold{display:inline-flex;align-items:center;gap:6px}.world-travel:not(.unfolded) .world-switch-row .world-switch{display:none}.world-travel.unfolded .world-fold{display:none}}';(document.head||document.body).append(style);
 let start=null,walked=false,noteLeft=NOTE_TIME;
 // The hotbar joins the bottom column just above the hint, so the rows stack evenly instead of overlapping.
 const bar=typeof villageHotbar==='object'&&villageHotbar?villageHotbar.bar:null;
 if(bar&&controls&&hint&&typeof controls.insertBefore==='function'&&hint.parentNode===controls){controls.insertBefore(bar,hint);bar.classList.add('in-controls');}
 const toggle=bar&&document.querySelector?document.querySelector('.play-toggle'):null;if(toggle){bar.append(toggle);toggle.classList.add('in-hotbar');}
 // Phone: one "다른 공간" button opens the two destinations; picking one or tapping elsewhere folds them back.
 const travel=document.getElementById('world-travel'),row=travel&&travel.querySelector?travel.querySelector('.world-switch-row'):null;let fold=null;
 if(travel&&row&&typeof travel.insertBefore==='function'){fold=document.createElement('button');fold.className='world-switch world-fold';fold.setAttribute('aria-expanded','false');fold.innerHTML='<span>다른 공간</span><span class="world-arrow" aria-hidden="true">↗</span>';
  fold.addEventListener('click',e=>{e.stopPropagation();setFold(true);});travel.insertBefore(fold,row);
  row.addEventListener('click',()=>setFold(false));addEventListener('pointerdown',e=>{if(travel.classList.contains('unfolded')&&!travel.contains(e.target))setFold(false);});}
 function setFold(open){if(!travel||!fold)return;travel.classList.toggle('unfolded',open);fold.setAttribute('aria-expanded',String(open));if(open){const first=row.querySelector('.world-switch:not([hidden])');if(first)first.focus();}}
 return{NOTE_TIME,WALKED,get walked(){return walked;},fold:()=>fold,setFold,
  tick(dt){if(!entered){start=null;return;}
   if(!start)start={x:player.position.x,z:player.position.z};else if(!walked&&Math.hypot(player.position.x-start.x,player.position.z-start.z)>WALKED)walked=true;
   // The hint stays for anything new it has to say; only the opening "tap where to go" line goes quiet.
   if(hint)hint.dataset.quiet=walked&&hint.textContent===idleHint?'1':'0';
   if(noteLeft>0){noteLeft-=dt;if(noteLeft<=0)for(const id of['keyboard','saved-note']){const n=document.getElementById(id);if(n&&n.classList)n.classList.add('tidy-faded');}}}};
}
const villageTidy=createVillageTidy();
