const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(__dirname,'sky-weather.js'),'utf8'),three=fs.readFileSync(path.join(root,'winter/three.min.js'),'utf8');
function load(search=''){const c={console:{log(){},warn(){},error:console.error},Math,Date,URLSearchParams,location:{search}};vm.createContext(c);vm.runInContext(three,c);vm.runInContext(source+'\nglobalThis.api={skyClock,skyPhaseAt,skyWeatherAt,skyWeatherLabel,createSkyWeather,skyWeather};',c);return c;}
const{api}=load(),kst=(y,m,d,h,min=0)=>Date.UTC(y,m-1,d,h-9,min);

// Seoul time, phases and determinism.
assert.equal(api.skyClock(kst(2026,1,1,12)).hour,12);
for(const[h,phase,lit]of[[3,'night',0],[6.3,'dawn',null],[12,'day',1],[17.8,'dusk',null],[22,'night',0]]){const s=api.skyPhaseAt(h);assert.equal(s.phase,phase);if(lit!==null)assert.equal(s.daylight,lit);}
assert(api.skyPhaseAt(6.3).warmth>.9&&api.skyPhaseAt(17.8).warmth>.9&&api.skyPhaseAt(12).warmth===0);
const t=kst(2026,11,7,13,10);assert.deepEqual(api.skyWeatherAt(t),api.skyWeatherAt(t));assert.equal(api.skyWeatherAt(kst(2026,11,7,12,5)).kind,api.skyWeatherAt(kst(2026,11,7,14,55)).kind);
assert.equal(api.skyWeatherAt(kst(2026,11,7,13)).block+1,api.skyWeatherAt(kst(2026,11,7,16)).block);

// Sixty days of three-hour blocks cover every weather kind without one dominating; rainbows only follow rain in daylight.
const counts={},start=kst(2026,1,1,0);let rainbows=0;
for(let i=0;i<60*8;i++){const now=start+i*3*3600e3+90*60e3,s=api.skyWeatherAt(now),before=api.skyWeatherAt(now-3*3600e3);counts[s.kind]=(counts[s.kind]||0)+1;assert(s.wind.strength>=0&&s.wind.strength<=1);
 if(s.rainbow){rainbows++;assert.equal(s.kind,'clear');assert(['precip','heavy'].includes(before.kind));assert(s.daylight>.4);}}
for(const kind of['clear','cloudy','precip','heavy','fog']){const share=(counts[kind]||0)/480;assert(share>.04&&share<.45,kind+' share '+share);}
assert(rainbows>0,'a rainbow appears after daytime rain');

// Labels name the world's own weather.
const rain={phase:'day',kind:'precip',rainbow:false};
assert.equal(api.skyWeatherLabel(rain,'winter'),'낮 · 눈');assert.equal(api.skyWeatherLabel(rain,'library'),'낮 · 비');assert.equal(api.skyWeatherLabel({...rain,kind:'heavy'},'winter'),'낮 · 함박눈');
assert.equal(api.skyWeatherLabel({phase:'night',kind:'clear',rainbow:false},'aquarium'),'바깥 · 밤 · 맑음');assert.equal(api.skyWeatherLabel({phase:'day',kind:'clear',rainbow:true},'library'),'낮 · 무지개');
assert.equal(api.skyWeather,null,'no world config means no runtime instance');

// The runtime blends a real Three.js scene from the night look to the day look and dims lamp glass by day.
function world(c,config){const T=c.THREE,scene=new T.Scene();scene.background=new T.Color();scene.fog=new T.FogExp2(0,0.01);const hemi=new T.HemisphereLight(),sun=new T.DirectionalLight();scene.add(hemi,sun);const glass=new T.MeshBasicMaterial({color:0xffd99c});
 const look={night:{bg:0x555b7b,fog:0x777d9d,hemiSky:0xf1e4f2,hemiGround:0x747e9b,hemi:2.15,sun:0xffe7ce,sunI:2.1,density:.0155},day:{bg:0xaec0d8,fog:0xc4d0e1,hemiSky:0xffffff,hemiGround:0x95a2bd,hemi:2.55,sun:0xfff2df,sunI:2.4,density:.0125}};
 const changes=[],sky=c.api.createSkyWeather({world:'winter',scene,sun,glows:[{material:glass,dim:.6}],...look,...config,onChange:s=>changes.push(s.phase+'|'+s.kind)});return{T:c.THREE,scene,hemi,sun,glass,sky,changes,look};}
let clock=kst(2026,11,7,22,30);const night=world(load(),{now:()=>clock});
const near=(a,b,eps=.02)=>Math.abs(a-b)<=eps,sameColor=(a,b)=>near(a.r,b.r)&&near(a.g,b.g)&&near(a.b,b.b);
night.sky.tick(.016);assert.equal(night.sky.state.phase,'night');assert(sameColor(night.scene.background,new night.T.Color(night.look.night.bg)));assert(sameColor(night.glass.color,new night.T.Color(0xffd99c)));
clock=kst(2026,11,8,12,30);for(let i=0;i<12;i++)night.sky.tick(1);
const noon=night.sky.state;assert.equal(noon.phase,'day');assert(night.changes.some(c=>c.startsWith('day|')));
if(noon.kind==='clear'){assert(sameColor(night.scene.background,new night.T.Color(night.look.day.bg)));assert(near(night.hemi.intensity,night.look.day.hemi,.05));}
assert(night.scene.background.r>new night.T.Color(night.look.night.bg).r,'noon is brighter than night');
assert(sameColor(night.glass.color,new night.T.Color(0xffd99c).multiplyScalar(.6)),'lamp glass dims by day');

// URL overrides make QA screenshots reproducible; fog thickens outdoors but never inside a room.
const foggy=world(load('?sky=day&weather=fog'),{});foggy.sky.tick(.016);assert.equal(foggy.sky.state.kind,'fog');assert.equal(foggy.sky.state.phase,'day');assert(foggy.scene.fog.density>foggy.look.day.density*1.5);
const room=world(load('?sky=day&weather=fog'),{indoor:true});room.sky.tick(.016);assert(near(room.scene.fog.density,room.look.day.density,1e-6));
const rainbow=world(load('?sky=day&weather=rainbow'),{});rainbow.sky.tick(.016);assert(rainbow.sky.state.rainbow&&rainbow.sky.state.kind==='clear');

// Every published world bundles the module with its own config and no leftover placeholder.
for(const[w,dir]of[['winter',''],['aquarium','aquarium'],['library','library']]){const html=fs.readFileSync(path.join(root,'docs',dir,'index.html'),'utf8');assert(html.includes('function createSkyWeather('),w);assert(html.includes("skyWeatherConfig={world:'"+w+"'"),w+' config');assert(!html.includes('/* SKY_WEATHER_CODE */'),w+' placeholder');assert(html.includes('skyWeather.tick(dt)'),w+' tick');}
const library=fs.readFileSync(path.join(root,'docs/library/index.html'),'utf8');assert(library.includes("windowRain.name='window-rain'")&&library.includes('makeWindowSky(s.phase,s.kind,s.rainbow)'));

console.log('PASS: Seoul-time sky phases and three-hour weather are deterministic for every friend, cover all kinds, rainbows follow daytime rain, and all three worlds blend their own day/night look without indoor fog.');
