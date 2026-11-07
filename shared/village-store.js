// Friend-group storage for things that stay in the village (exhibits, letters, signs…): Firebase under village/{party}/{collection}.
// Until those rules are deployed the reads and writes are refused, so everything falls back to this browser and keeps working.
function createVillageStore(){
 const party=partyId(roomId),cache=new Map(),listeners=new Map(),live=new Set();let mode='pending';
 const localKey=c=>'village-store:'+party+':'+c;
 function readLocal(c){try{const v=JSON.parse(localStorage.getItem(localKey(c))||'{}');return v&&typeof v==='object'?v:{};}catch{return{};}}
 function writeLocal(c,data){try{localStorage.setItem(localKey(c),JSON.stringify(data));}catch{}}
 function items(c){return{...readLocal(c),...(cache.get(c)||{})};}
 function emit(c){for(const f of listeners.get(c)||[])f(items(c));}
 function ready(){return typeof networkDB!=='undefined'&&networkDB&&networkAuth&&networkAuth.currentUser&&window.WinterFirebase;}
 function connect(c){
  if(live.has(c)||mode==='local'||!ready())return;live.add(c);const F=window.WinterFirebase;
  try{F.onValue(F.ref(networkDB,'village/'+party+'/'+c),snapshot=>{mode='shared';cache.set(c,snapshot.val()||{});emit(c);},()=>{mode='local';live.delete(c);emit(c);});}catch{mode='local';live.delete(c);}
 }
 // The network signs in after the page loads; keep trying quietly until it is ready or refused.
 setInterval(()=>{for(const c of listeners.keys())connect(c);},4000);
 return{
  party,
  get mode(){return mode;},
  list(c){connect(c);return items(c);},
  subscribe(c,f){if(!listeners.has(c))listeners.set(c,[]);listeners.get(c).push(f);connect(c);f(items(c));},
  // Resolves 'shared' when friends will see it, 'local' when only this browser keeps it.
  async put(c,id,value){const local=readLocal(c);local[id]=value;writeLocal(c,local);cache.set(c,{...(cache.get(c)||{}),[id]:value});emit(c);
   if(mode==='local'||!ready())return'local';const F=window.WinterFirebase;
   try{await F.set(F.ref(networkDB,'village/'+party+'/'+c+'/'+id),value);mode='shared';return'shared';}catch{mode='local';return'local';}},
  uid(){return ready()?networkAuth.currentUser.uid:'';}
 };
}
const villageStore=createVillageStore();
