const assert=require('node:assert/strict');
const {loadWorld}=require('./test-harness.cjs');

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
