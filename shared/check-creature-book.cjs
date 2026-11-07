const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(__dirname,'creature-book.js'),'utf8');
function el(tag){return{tag,hidden:false,children:[],style:{},attrs:{},handlers:{},textContent:'',innerHTML:'',className:'',setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,v){this.handlers[k]=v;},append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},focus(){}};}
function world(store,sky={phase:'day',kind:'clear',daylight:1},opts={}){
 const toasts=[],help=el('button'),bar=el('div');bar.insertBefore=(n,ref)=>{bar.children.splice(bar.children.indexOf(ref),0,n);};bar.children.push(help);help.parentNode=bar;
 const storage=opts.broken?{getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}}:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)};
 const c={Math,Date,JSON,Object,Array,localStorage:storage,toast:m=>toasts.push(m),skyWeather:{state:sky},addEventListener(){},document:{head:el('head'),body:el('body'),createElement:el,getElementById:id=>id==='help'?help:null}};
 vm.createContext(c);vm.runInContext(source+'\nglobalThis.api={book:creatureBook,onFishCaught};',c);return{...c.api,toasts,bar,body:c.document.body,setSky(s){c.skyWeather.state=s;}};
}
const store=new Map(),w=world(store),ids=w.book.ENTRIES.map(e=>e.id);
assert.equal(new Set(ids).size,ids.length,'duplicate creature ids');
// Every ice-fishing creature has a page in the book.
const fishIds=[...fs.readFileSync(path.join(root,'winter/ice-fishing.js'),'utf8').matchAll(/\{id:'([a-z-]+)',name:/g)].map(m=>m[1]);assert(fishIds.length>=8);for(const id of fishIds)assert(ids.includes(id),id+' has no book page');

// First meetings celebrate once; counts and best sizes accumulate; unknown ids are ignored.
assert.equal(w.book.record('smelt',{cm:11}),true);assert.equal(w.toasts.length,1);assert.equal(w.book.record('smelt',{cm:9}),false);assert.equal(w.toasts.length,1);
let e=w.book.entries().smelt;assert.equal(e.count,2);assert.equal(e.best,11);assert.equal(e.phase,'day');assert.equal(w.book.record('not-a-creature'),false);
w.onFishCaught({id:'trout',cm:31});assert.equal(w.book.entries().trout.best,31,'winter catches reach the book');

// The record follows the visitor into another world on the same origin.
const other=world(store);assert.equal(other.book.entries().smelt.count,2);assert.equal(other.book.record('smelt'),false);

// Tank activities prefer creatures not yet met; the lantern jelly only glows after dusk.
const aq=world(new Map()),reef=new Set();for(let i=0;i<3;i++)reef.add(aq.book.observeTank('reef'));assert.deepEqual([...reef].sort(),['clownfish','filefish','seahorse']);
for(let i=0;i<20;i++)assert.notEqual(aq.book.observeTank('jelly'),'lantern-jelly','lantern jelly appears in daylight');
aq.setSky({phase:'night',kind:'clear',daylight:0});assert.equal(aq.book.observeTank('jelly'),'lantern-jelly');assert.equal(aq.book.observeTank('nowhere'),null);
// The library window shows a different visitor by time and weather.
assert.equal(w.book.observeWindow({kind:'clear',daylight:1}),'sparrow');assert.equal(w.book.observeWindow({kind:'clear',daylight:0}),'moon-moth');assert.equal(w.book.observeWindow({kind:'precip',daylight:1}),'rain-snail');

// Broken or blocked storage never stops play.
const corrupt=new Map([['village-creature-book','{not json']]);assert.equal(Object.keys(world(corrupt).book.entries()).length,0);const blocked=world(null,undefined,{broken:true});assert.equal(blocked.book.record('smelt'),true);

// The book button sits before help; the list shows every page, met or not.
assert.equal(w.bar.children[0].attrs['aria-label'],'생물 도감');w.book.open();assert(w.book.isOpen());const dialog=w.body.children.find(x=>x.className==='creature-book'),list=dialog.children[0].children[3];
assert.equal(list.children.filter(x=>x.tag==='li').length,ids.length);assert.equal(list.children.filter(x=>x.tag==='h3').length,3);assert(list.children.some(x=>x.className==='unseen'&&x.textContent.startsWith('???')));assert(list.children.some(x=>x.className==='seen'&&x.textContent.startsWith('빙어 · 3번 · 최대 11cm')));
w.book.close();assert(!w.book.isOpen());

// Every published world bundles the book; the aquarium tanks and the library window feed it.
for(const[name,dir]of[['winter',''],['aquarium','aquarium'],['library','library']]){const html=fs.readFileSync(path.join(root,'docs',dir,'index.html'),'utf8');assert(html.includes('function createCreatureBook('),name);assert(!html.includes('/* CREATURE_BOOK_CODE */'),name);assert(html.includes('creatureBook.isOpen()'),name+' lets taps walk under the open book');}
assert(fs.readFileSync(path.join(root,'docs/aquarium/index.html'),'utf8').includes("creatureBook.observeTank('reef')"));assert(fs.readFileSync(path.join(root,'docs/library/index.html'),'utf8').includes('creatureBook.observeWindow(skyWeather.state)'));
console.log('PASS: one creature book follows the visitor across worlds, records first meetings once with counts and best sizes, meets tank and window creatures by sky, survives broken storage and lists every page.');
