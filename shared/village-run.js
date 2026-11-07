// Running: hold Shift on a keyboard, or tap the running shoe at the end of the hotbar on a phone, to move about 1.8×
// faster while walking. Only plain walking speeds up (not rolling a snowball, sledding or sitting), and the legs swing
// faster to match. There is no stamina to watch; it is just quicker across the wider village.
function createVillageRun(){
 const FACTOR=1.8,STRIDE=1.7;let held=false,toggled=false,phase=0;
 const button=document.createElement('button');button.className='run-toggle';button.setAttribute('aria-pressed','false');button.setAttribute('aria-label','달리기');button.title='달리기 (Shift)';button.hidden=true;
 button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="14.5" cy="4.5" r="2"/><path d="M8 21l3-6 3 2v5M6 12l3-4h5l3 4 3 1M11 8l-1 5 4 2"/></svg><b>달리기</b>';
 const style=document.createElement('style');style.textContent='.run-toggle{position:fixed;right:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 186px);z-index:4;width:50px;height:46px;border:0;border-radius:13px;background:rgba(255,247,232,.92);color:#5f5050;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font:700 9.5px/1 "Winter Jua",sans-serif;cursor:pointer}.run-toggle[hidden]{display:none}.run-toggle svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.run-toggle[aria-pressed="true"]{background:#d98c7a;color:#fff8e8}.village-hotbar .run-toggle{position:static;margin-left:3px;box-shadow:none}@media(max-width:420px){.village-hotbar{gap:4px;padding:3px}.village-hotbar button,.village-hotbar .play-toggle,.village-hotbar .run-toggle{width:42px;margin-left:0}}';(document.head||document.body).append(style);
 // It sits at the end of the hotbar when there is one, beside the emote button.
 const bar=typeof villageHotbar==='object'&&villageHotbar?villageHotbar.bar:null;(bar||document.body).append(button);
 function set(v){toggled=Boolean(v);button.setAttribute('aria-pressed',String(toggled));if(toggled&&typeof villageJournal==='object'&&villageJournal&&villageJournal.note)villageJournal.note('first-run');return toggled;}
 button.addEventListener('click',()=>set(!toggled));
 addEventListener('keydown',e=>{if(e.key==='Shift')held=true;});addEventListener('keyup',e=>{if(e.key==='Shift')held=false;});addEventListener('blur',()=>{held=false;});
 const on=()=>Boolean(entered)&&(held||toggled);
 return{FACTOR,button,on,set,get toggled(){return toggled;},
  // Speed factor for the current activity: only idle walking runs.
  factor(state){return on()&&(state==='idle'||state==='walk')?FACTOR:1;},
  // A walk-cycle clock that ticks faster while running, so the stride matches the speed without a jump when switching.
  phase(dt,moving){phase+=dt*(moving&&on()?STRIDE:1);return phase;},
  tick(){button.hidden=!entered;}};
}
const villageRun=createVillageRun();
