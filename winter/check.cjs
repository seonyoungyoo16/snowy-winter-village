const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const THREE=require('./three.min.js');
const source=fs.readFileSync(__dirname+'/game.html','utf8');
function extract(start,end){const p=source.indexOf(start);assert(p>=0);const q=source.indexOf(end,p+start.length);assert(q>p);return source.slice(p,q);}
const meltSource=extract('function melt(now)','\nmelt(Date.now());');
const scale=()=>({set(...v){this.value=v;},setScalar(v){this.value=v;}});
function snow(created,x=0,z=0){return {created,x,z,body:{scale:scale()},label:{position:{},material:{}},shadow:{scale:scale()}};}
let removed=[],saves=0;
const context={LIFE:1000,snowmen:[snow(1000),snow(1500),snow(1999)],clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),removeSnowman:s=>removed.push(s.created),save:()=>saves++};
vm.createContext(context);vm.runInContext(meltSource,context);context.melt(2000);
assert.deepEqual(removed,[1000]);assert.equal(context.snowmen.length,2);assert(context.snowmen[0].body.scale.value[0]<context.snowmen[1].body.scale.value[0]);assert.equal(saves,1);
console.log('PASS: expired snowman removed; older surviving snowman visibly smaller.');
const finishSource=extract('function finishSnowman()','\nlet warmSeat');
removed=[];saves=0;
const finish={ball:{position:{x:4,z:4}},rollDistance:13,blocked:()=>false,groundHeight:()=>0,snowmen:Array.from({length:30},(_,i)=>snow(i,-20,i/10)),removeSnowman:s=>removed.push(s.created),nickname:'겨울별',selected:2,player:{rotation:{y:1}},makeSnowman:s=>s,scene:{remove(){}},save:()=>saves++,toast(){},updateUI(){}};
vm.createContext(finish);vm.runInContext(finishSource,finish);finish.finishSnowman();
assert.equal(finish.snowmen.length,30);assert.deepEqual(removed,[0]);assert.equal(finish.snowmen[29].name,'겨울별');assert.equal(finish.snowmen[29].kind,2);assert.equal(finish.ball,null);assert.equal(saves,1);
console.log('PASS: the 31st snowman replaces only the oldest; creator and avatar persist.');
const route={THREE,clamp:context.clamp,player:{position:{x:-8,z:0}},blocked:(x,z)=>Math.abs(x)>25||Math.abs(z)>25||Math.hypot(x,z)<3};
vm.createContext(route);vm.runInContext(extract('const GRID=.8','\nfunction navigate'),route);const path=route.pathTo(8,0);
assert(path.length>1);assert(path.every(v=>!route.blocked(v.x,v.z)));assert(Math.abs(path[path.length-1].x-8)<1);
console.log('PASS: walk path routes around a blocked area and reaches its destination.');
const html=fs.readFileSync(__dirname+'/눈 내리는 겨울 마을.html','utf8');
assert(!/<script[^>]+src=|<link[^>]+href=|<img[^>]+src=/i.test(html));assert(!html.includes('<!-- THREE_LIBRARY -->'));
for(const [,js]of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(js);
console.log('PASS: final standalone HTML has valid JavaScript and no external asset dependencies.');
