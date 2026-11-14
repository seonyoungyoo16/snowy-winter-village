const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {loadWorld}=require('./test-harness.cjs');

async function checkCanvasRepaint(){
 const source=fs.readFileSync(__dirname+'/village-shell.js','utf8');
 const helper=source.slice(source.indexOf('function repaintWithVillageFont'),source.indexOf('function createVillageShell'));
 const font='700 54px "NanumSquareRound","Malgun Gothic",sans-serif',sample='눈송이 친구';
 let loaded=false,paints=0,loads=0;
 const context=vm.createContext({document:{fonts:{check(style,text){assert.equal(style,font);assert.equal(text,sample);return loaded;},
  async load(style,text){assert.equal(style,font);assert.equal(text,sample);loads++;loaded=true;}}}});
 vm.runInContext(helper,context);
 context.repaintWithVillageFont(()=>paints++,font,sample);
 await Promise.resolve();
 assert.equal(paints,1);
 context.repaintWithVillageFont(()=>paints++,font,sample);
 assert.equal(loads,1,'a loaded canvas font does not need another redraw');
 console.log('PASS: a cold canvas font repaints using the requested face, weight and nickname.');
}

checkCanvasRepaint().catch(error=>{console.error(error);process.exitCode=1;});

for(const world of ['winter','aquarium','library']){
 const {a,node,storage}=loadWorld(world,{expose:['villageShell','villageEvent','villageNotes','creatureBook','villageMarket','inviteURL','roomId','keys','handleVillageKeyDown'],extra:',setConnection(connected,full=false){networkJoined=connected;roomFull=full;}',
  storage:new Map([['village-purse',JSON.stringify({shells:12,bank:0,owned:['kite-sea'],use:{kite:'kite-sea'}})]])});
 assert.equal(node('enter').textContent,'친구 방 들어가기');
 assert.equal(a.inviteURL().split('#room=')[1],a.roomId);
 a.villageShell.enter();
 assert.equal(node('village-dock').hidden,false);
 const key=(value,tagName='BUTTON',properties={})=>{
  const event={key:value,target:{tagName},preventDefault(){this.defaultPrevented=true;},...properties};
  a.handleVillageKeyDown(event);
  return event.defaultPrevented===true;
 };
 for(const direction of ['ArrowUp','ArrowLeft','ArrowDown','ArrowRight','W']){
  assert(key(direction),'movement key with toolbar focus ignored: '+direction);
  assert(a.keys.delete(direction.toLowerCase()));
 }
 assert(!key('ArrowUp','INPUT'),'nickname field should own its arrow keys');
 assert(!key('ArrowUp','DIV',{target:{isContentEditable:true}}));
 assert(!key('ArrowLeft','CANVAS',{altKey:true}),'browser navigation shortcut was intercepted');
 assert(!key(' ','BUTTON',{code:'Space'}),'Space should activate the focused button');
 node('invite-modal').hidden=false;
 assert(!key('ArrowLeft'),'invite overlay must block walking');
 node('invite-modal').hidden=true;
 assert.equal(a.keys.size,0);

 a.setConnection(false,true);
 a.villageShell.connectionChanged();
 assert.equal(node('village-recovery').hidden,false);
 assert.equal(node('village-recovery-text').textContent,'이 방이 지금 가득 찼어요');
 a.setConnection(true);
 a.villageShell.connectionChanged();
 assert.equal(node('village-recovery').hidden,true);
 assert.equal(node('invite-status').textContent,'아직 친구가 오지 않았어요');
 assert(a.creatureBook.record('smelt'));
 a.villageEvent(a.villageNotes.todaysRequests()[0][0]);
 const legacy=JSON.parse(storage.get('village-purse'));
 assert.equal(legacy.shells,12);
 assert(a.villageMarket.owns('kite-sea'));
 console.log('PASS: '+world+' legacy invitation, connection recovery, and saved rewards after the UI change.');
}
