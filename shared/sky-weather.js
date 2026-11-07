// Sky and weather follow Seoul time, so every friend sees the same sky without any Firebase writes.
const SKY_KST_OFFSET=9*3600e3,SKY_BLOCK=3*3600e3,SKY_KINDS=['clear','cloudy','precip','heavy','fog'];
function skyHash(n){n=(n^61)^(n>>>16);n=Math.imul(n,9);n^=n>>>4;n=Math.imul(n,0x27d4eb2d);n^=n>>>15;return(n>>>0)/4294967296;}
function skyClock(now=Date.now()){const t=new Date(now+SKY_KST_OFFSET);return{hour:t.getUTCHours()+t.getUTCMinutes()/60+t.getUTCSeconds()/3600,month:t.getUTCMonth()+1,date:t.getUTCDate(),block:Math.floor((now+SKY_KST_OFFSET)/SKY_BLOCK)};}
// Daylight rises 5:00→7:30 and falls 16:30→19:00; warmth peaks at sunrise and sunset.
function skyPhaseAt(hour){const ramp=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};const daylight=ramp(5,7.5,hour)*(1-ramp(16.5,19,hour)),warmth=Math.max(0,1-Math.abs(hour-6.3)/1.4)+Math.max(0,1-Math.abs(hour-17.8)/1.4),phase=hour>=4.5&&hour<7.5?'dawn':hour>=7.5&&hour<16.5?'day':hour>=16.5&&hour<19.5?'dusk':'night';return{hour,phase,daylight,warmth:Math.min(1,warmth)};}
function skyKindForBlock(block){const r=skyHash(block*7+3);return r<.32?'clear':r<.52?'cloudy':r<.78?'precip':r<.88?'heavy':'fog';}
function skyWeatherAt(now=Date.now()){
 const clock=skyClock(now),sky=skyPhaseAt(clock.hour),kind=skyKindForBlock(clock.block),before=skyKindForBlock(clock.block-1),angle=skyHash(clock.block*7+5)*Math.PI*2,strength=Math.min(1,.15+skyHash(clock.block*7+6)*.65+(kind==='heavy'?.3:0));
 return{...sky,kind,rainbow:kind==='clear'&&(before==='precip'||before==='heavy')&&sky.daylight>.4,wind:{x:Math.cos(angle)*strength,z:Math.sin(angle)*strength,strength},block:clock.block};
}
function skyWeatherLabel(state,world){const phase={dawn:'새벽',day:'낮',dusk:'노을',night:'밤'}[state.phase],snow=world==='winter',weather=state.rainbow?'무지개':{clear:'맑음',cloudy:'흐림',precip:snow?'눈':'비',heavy:snow?'함박눈':'큰비',fog:'안개'}[state.kind];return(world==='aquarium'?'바깥 · ':'')+phase+' · '+weather;}
// Each world passes its own day/night look; this blends lights, fog and glowing windows toward the shared sky.
function createSkyWeather(config){
 const params=typeof location==='object'&&location.search?new URLSearchParams(location.search):null,forcedPhase=params&&params.get('sky'),forcedKind=params&&params.get('weather');
 const forcedHours={dawn:6.3,day:12,dusk:17.8,night:22};
 const color=v=>new THREE.Color(v),night=config.night,day=config.day,dusk=color(config.dusk||0xd9a19a);
 const hemi=config.hemi||config.scene.children.find(o=>o.isHemisphereLight),glows=(config.glows||[]).map(g=>({material:g.material,base:g.material.color.clone(),dim:g.dim}));
 const target={bg:new THREE.Color(),fog:new THREE.Color(),sky:new THREE.Color(),ground:new THREE.Color(),sun:new THREE.Color()},live={bg:color(night.bg),fog:color(night.fog),sky:color(night.hemiSky),ground:color(night.hemiGround),sun:color(night.sun),hemi:night.hemi,sunI:night.sunI,density:night.density,glow:0};
 let state=null,checkIn=0,first=true,badge=null;
 function compute(){
  let next=skyWeatherAt(config.now?config.now():Date.now());
  if(forcedPhase in forcedHours)next={...next,...skyPhaseAt(forcedHours[forcedPhase])};
  if(SKY_KINDS.includes(forcedKind))next={...next,kind:forcedKind,rainbow:false};else if(forcedKind==='rainbow')next={...next,kind:'clear',rainbow:true};
  return next;
 }
 function aim(s){
  // Indoor worlds only feel the weather through the light; their rooms never fill with fog.
  const d=s.daylight,w=s.warmth*.38,cloud=(s.kind==='clear'?0:s.kind==='cloudy'?.18:s.kind==='fog'?.28:.24)*(config.indoor?.5:1);
  for(const[key,from,to]of[['bg','bg','bg'],['fog','fog','fog'],['sky','hemiSky','hemiSky'],['ground','hemiGround','hemiGround'],['sun','sun','sun']]){target[key].set(night[from]).lerp(color(day[to]),d).lerp(dusk,key==='ground'?w*.4:w);if(key!=='sun')target[key].lerp(color(0x8d94a3),cloud*d);}
  target.hemi=(night.hemi+(day.hemi-night.hemi)*d)*(1-cloud*.35);target.sunI=(night.sunI+(day.sunI-night.sunI)*d)*(1-cloud*.6);
  target.density=(night.density+(day.density-night.density)*d)*(config.indoor?1:{fog:1.9,heavy:1.35,precip:1.15}[s.kind]||1);target.glow=d;
 }
 function apply(t){
  for(const key of['bg','fog','sky','ground','sun'])live[key].lerp(target[key],t);for(const key of['hemi','sunI','density','glow'])live[key]+=(target[key]-live[key])*t;
  config.scene.background.copy(live.bg);if(config.renderer&&config.renderer.setClearColor)config.renderer.setClearColor(live.bg);config.scene.fog.color.copy(live.fog);config.scene.fog.density=live.density;
  if(hemi){hemi.color.copy(live.sky);hemi.groundColor.copy(live.ground);hemi.intensity=live.hemi;}if(config.sun){config.sun.color.copy(live.sun);config.sun.intensity=live.sunI;}
  for(const g of glows)g.material.color.copy(g.base).multiplyScalar(1+(g.dim-1)*live.glow);
 }
 function showBadge(){
  // Centered above the scene on wide screens; on phones it tucks under the round utility buttons, clear of the title.
  try{if(!badge&&typeof document==='object'&&document.body){const style=document.createElement('style');style.textContent='.sky-weather-badge{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 12px);transform:translateX(-50%);z-index:4;padding:5px 12px;border-radius:999px;background:rgba(255,250,240,.78);color:#4b4a5c;font:700 12px/1.4 "Winter Jua","NanumSquareRound",sans-serif;letter-spacing:.02em;pointer-events:none;box-shadow:0 2px 10px rgba(40,40,70,.14);white-space:nowrap}@media (max-width:650px){.sky-weather-badge{left:auto;right:16px;transform:none;top:calc(max(22px,env(safe-area-inset-top)) + 52px);font-size:11px;padding:4px 10px}}';document.head.append(style);badge=document.createElement('div');badge.id='sky-weather-badge';badge.className='sky-weather-badge';badge.setAttribute('aria-label','지금 마을의 시간과 날씨');document.body.append(badge);}if(badge)badge.textContent=skyWeatherLabel(state,config.world);if(document.documentElement){document.documentElement.dataset.skyPhase=state.phase;document.documentElement.dataset.skyWeather=state.rainbow?'rainbow':state.kind;}}catch{}
 }
 function refresh(){const next=compute(),changed=!state||next.kind!==state.kind||next.phase!==state.phase||next.rainbow!==state.rainbow;state=next;aim(state);if(changed){showBadge();if(config.onChange)config.onChange(state);}}
 refresh();apply(1);
 return{
  tick(dt){checkIn-=dt;if(checkIn<=0){checkIn=2;refresh();}apply(first?1:Math.min(1,dt*.6));first=false;if(config.tick)config.tick(dt,state);},
  get state(){return state;},
  label(){return skyWeatherLabel(state,config.world);}
 };
}
const skyWeather=typeof skyWeatherConfig==='object'?createSkyWeather(skyWeatherConfig):null;
