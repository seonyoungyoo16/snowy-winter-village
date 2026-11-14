function handleVillageKeyDown(event){
 const target=event.target;
 if(!entered||helpOpen()||event.defaultPrevented||event.isComposing||event.ctrlKey||event.metaKey||event.altKey||
    target?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(target?.tagName))return;
 const key=event.key.toLowerCase();
 if(['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'].includes(key)){
  keys.add(key);
  event.preventDefault();
 }else if(!event.repeat&&(key==='e'||(event.code==='Space'&&target?.tagName!=='BUTTON'))){
  event.preventDefault();
  action();
 }
}
function repaintWithVillageFont(paint){
 const font='24px "Gangwon Edu Saeeum"';
 if(document.fonts&&!document.fonts.check(font,'겨울 마을')){
  document.fonts.load(font,'겨울 마을').then(paint,()=>{});
 }
}

function createVillageShell(invited){
 const menu=$('village-menu'), recovery=$('village-recovery');
 const guestName=$('nickname-label').textContent;
 const panels={spaces:'공간 이동',more:'더보기',records:'내 기록',profile:'캐릭터·닉네임'};
 let opener=null, draftCharacter=0, focusAfterClose=true;
 function updateSound(){
  const on=$('sound').getAttribute('aria-pressed')==='true';
  $('village-sound-state').textContent=on?'켜짐':'꺼짐';
  menu.querySelector('[data-shell-action="sound"]').setAttribute('aria-pressed',String(on));
 }
 function chooseDraft(kind){
  draftCharacter=kind;
  for(const button of menu.querySelectorAll('[data-profile-character]'))button.setAttribute('aria-pressed',String(Number(button.dataset.profileCharacter)===kind));
 }
 function openPanel(panel,trigger){
  if(!Object.hasOwn(panels,panel))return;
  if(!menu.open)opener=trigger;
  for(const id of Object.keys(panels))$('village-menu-'+id).hidden=id!==panel;
  $('village-menu-title').textContent=panels[panel];
  menu.dataset.panel=panel;
  menu.dataset.entry=String(!entered);
  if(panel==='profile'){
   chooseDraft(selected);
   $('village-profile-name').value=$('nickname').value;
  }
  if(panel==='more')updateSound();
  if(!menu.open)menu.showModal();
  keys.clear();
  $('village-menu-close').focus();
 }
 function connectionChanged(){
  const state=$('village-state').textContent;
  const pending=state.includes('연결 중');
  $('invite-status').textContent=networkJoined?(remotePlayers.size?state:'아직 친구가 오지 않았어요'):roomFull?'이 방이 지금 가득 찼어요':pending?state:'친구와 연결하지 못했어요';
  $('village-recovery-text').textContent=roomFull?'이 방이 지금 가득 찼어요':'친구와 연결하지 못했어요';
  recovery.hidden=!entered||networkJoined||pending;
 }
 function retry(){
  if(networkStarting)return;
  roomFull=false;
  void startNetwork();
 }
 function handOff(open){
  focusAfterClose=false;
  menu.close();
  open();
 }
 $('village-menu-close').addEventListener('click',()=>menu.close());
 menu.addEventListener('close',()=>{
  if(focusAfterClose&&opener?.isConnected)opener.focus();
  focusAfterClose=true;
 });
 menu.addEventListener('click',event=>{if(event.target===menu)menu.close();});
 $('village-retry').addEventListener('click',retry);
 $('village-menu-profile').addEventListener('submit',event=>{
  event.preventDefault();
  const name=$('village-profile-name').value.trim().replace(/[\u0000-\u001f\u007f]/g,'').slice(0,12);
  const input=$('nickname');
  input.value=name;
  chooseCharacter(draftCharacter);
  if(entered){
   nickname=name||guestName;
   $('nickname-label').textContent=nickname;
   save();
   publishState(true);
  }
  menu.close();
 });
 if(typeof document.querySelector==='function'){
  const travel=$('world-travel');
  $('village-travel-slot').append(travel);
  travel.addEventListener('click',event=>{if(event.target.closest('.world-switch')&&menu.open)menu.close();});
  $('village-current-space').textContent=WORLD_NAMES[CURRENT_WORLD]+' · 현재 위치';
  $('village-profile-name').placeholder=guestName;
  document.addEventListener('click',event=>{
   const button=event.target.closest('button');
   if(!button)return;
   if(button.dataset.shellPanel){openPanel(button.dataset.shellPanel,button);return;}
   if(button.hasAttribute('data-profile-character')){chooseDraft(Number(button.dataset.profileCharacter));return;}
   const actions={book:()=>creatureBook.open(),journal:()=>villageJournal.open(),bag:()=>villageBag.open(),help:()=>$('help').click()};
   const action=button.dataset.shellAction;
   if(action==='sound'){$('sound').click();updateSound();}
   else if(Object.hasOwn(actions,action))handOff(actions[action]);
  });
 }
 return{
  isOpen:()=>Boolean(menu.open),
  ready(){
   $('enter').disabled=false;
   $('enter').textContent=invited?'친구 방 들어가기':'마을 들어가기';
   if(invited)$('entry-caption').textContent='친구가 이곳으로 초대했어요.';
  },
  enter(){
   $('village-dock').hidden=false;
   if(document.body.dataset)document.body.dataset.villageEntered='true';
  },
  connectionChanged
 };
}
const villageShell=createVillageShell(villageInvitation);
