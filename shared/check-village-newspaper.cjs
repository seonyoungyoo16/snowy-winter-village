const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),kst=(m,d,h=12)=>Date.UTC(2026,m-1,d,h-9);
assert(!fs.readFileSync(path.join(__dirname,'village-newspaper.js'),'utf8').includes('innerHTML'),'friend words must never become HTML');
function load(world,at){
 let serial=0,time=at;const nodes=new Map(),store=new Map(),ctx2d=new Proxy({measureText:()=>({width:100}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
 function node(id){if(!nodes.has(id))nodes.set(id,{id,hidden:false,disabled:false,value:'',textContent:'',className:'',style:{},dataset:{},children:[],handlers:{},classList:{add(){},remove(){},toggle(){}},addEventListener(k,v){this.handlers[k]=v;},setAttribute(k,v){this[k]=v;},focus(){},append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},getContext:()=>ctx2d});return nodes.get(id);}
 class TestDate extends Date{constructor(...a){super(...(a.length?a:[time]));}static now(){return time;}}
 const party='village-store:0123456789abcdef01234567:',put=(c,v)=>store.set(party+c,JSON.stringify(v));
 put('exhibits',{smelt:{c:'smelt',n:'곰돌이',u:'a',t:kst(11,10)},turtle:{c:'turtle',n:'옛날',u:'b',t:kst(10,20)}});
 put('letters',{l1:{f:'토끼',to:'*',b:'다들 이번 주말에 썰매 타러 와요 정말 재밌을 거예요',s:0,u:'a',t:kst(11,11,9)},l2:{f:'토끼',to:'곰',b:'비밀 편지',s:0,u:'a',t:kst(11,11,10)},l3:{f:'곰',to:'*',b:'지난주 편지',s:0,u:'b',t:kst(11,4)}});
 put('signs',{'winter-0':{b:'눈사람 조심',n:'여우',u:'c',t:kst(11,9,8)}});put('board',{m1:{n:'곰',b:'같이 낚시해요',u:'b',t:kst(11,10),w:'winter'}});
 const c={console:{log(){},warn(){},error:console.error},performance,Math,Date:TestDate,URL,URLSearchParams,Float32Array,Uint32Array,Uint8Array,Int32Array,Map,Set,Array,Object,Number,JSON,Promise,crypto:crypto.webcrypto,devicePixelRatio:1,innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){},addEventListener(){},document:{hidden:false,body:node('body'),getElementById:node,createElement:()=>node('generated-'+serial++),createTextNode:t=>({textContent:t}),querySelectorAll:()=>[],addEventListener(){}},location:{hash:'#room='+({winter:'',aquarium:'aq_',library:'lb_'}[world])+'0123456789abcdef01234567',pathname:'/snowy-winter-village/',search:'',href:'https://example.com/'},history:{replaceState(){}},localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)}};c.window=c;vm.createContext(c);
 const scripts=[...fs.readFileSync(path.join(root,world,'docs/index.html'),'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);vm.runInContext(scripts[0],c);c.THREE.WebGLRenderer=class{constructor(){this.domElement=node('renderer');}setPixelRatio(){}setSize(){}setClearColor(){}render(){}};
 vm.runInContext(scripts.at(-1).replace(/\}\)\(\);\s*$/,`globalThis.audit={villageNewspaper};})();`),c);return{N:c.audit.villageNewspaper,nodes};
}
for(const world of['winter','aquarium','library']){
 const{N,nodes}=load(world,kst(11,11,15));
 assert([...nodes.values()].some(n=>n.textContent==='마을 신문'&&n.className==='resident-next'),'no newspaper choice in the resident dialog');
 // Seoul Monday weeks: the week of 9 November is issue 2, the week before is issue 1.
 const now=N.issue(0),last=N.issue(1);assert.equal(now.number,2);assert.equal(last.number,1);assert.equal(N.issue(2).number,1,'issues never go below 1');
 const titles=now.articles.map(a=>a.title),text=now.articles.map(a=>a.body).join('\n');
 assert(titles.includes('전시 수조에 새 친구 1마리')&&text.includes('빙어(곰돌이 님)')&&!text.includes('옛날'),'exhibits outside the week leak in');
 assert(titles.includes('모두에게 온 편지 1통')&&!text.includes('비밀 편지')&&!text.includes('지난주 편지'),'private or old letters printed');
 assert(text.includes('「다들 이번 주말에 썰매 타러 와요 정말 재밌…」'),'letters are not shortened to 24 characters');
 assert(titles.includes('표지판에 새 글')&&titles.includes('게시판 메모 1장')&&titles.includes('이번 주 날씨'));assert(!titles.includes('이번 주 함께 목표'),'retired weekly goal is still shown');
 assert(last.articles.some(a=>a.title==='모두에게 온 편지 1통'&&a.body.includes('지난주 편지')),'last week loses its letter');assert(!last.articles.some(a=>a.title==='이번 주 함께 목표'),'past issues should not print the current goal');
 N.open();assert(N.isOpen());N.close();
 console.log('PASS: '+world+' newspaper numbers Seoul Monday weeks, prints only that week\'s donations, letters to everyone, signs, memos, and weather, keeps two past issues and shortens friend words.');
}
{
 // Birthday and event weeks: Bami's birthday (21 Dec) and the winter lights fall in the week of 21 December.
 const{N}=load('winter',kst(12,22));const t=N.issue(0).articles.map(a=>a.title);assert(t.includes('밤이의 생일'),'birthday missing');assert(t.includes('마을 행사'),'event missing');
 const quiet=load('library',kst(8,5)).N.issue(0).articles;assert(quiet.length>=1);
 console.log('PASS: birthday and seasonal event weeks make the paper, and a quiet week still prints something kind.');
}
