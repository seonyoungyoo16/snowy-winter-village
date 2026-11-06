const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/multiplayer.js','utf8');
const take=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
const context={};vm.createContext(context);vm.runInContext(take('function createArrivalTracker(','const firebaseConfig'),context);
let time=0;const tracker=context.createArrivalTracker(()=>time),a=['a',{u:'owner-a',n:'기존 친구'}],b=['b',{u:'owner-b',n:'새 친구'}];
tracker.seed([a]);assert.equal(tracker.observe([a]).length,0);
assert.equal(tracker.observe([a,b]).length,1);assert.equal(tracker.observe([a,['b',{...b[1],m:'walk',k:2}]]).length,0);
time=1000;tracker.observe([a]);time=2000;assert.equal(tracker.observe([a,b]).length,0);
time=3000;tracker.observe([a]);time=35000;assert.equal(tracker.observe([a,b]).length,1);
assert.equal(tracker.observe([a,b,['b-second-tab',{u:'owner-b',n:'새 친구'}]]).length,0);
tracker.pause();assert.equal(tracker.observe([a,b,['c',{u:'owner-c'}]]).length,0);tracker.seed([a,b]);assert.equal(tracker.observe([a,b]).length,0);
tracker.reset();assert.equal(tracker.observe([b]).length,0);tracker.seed([]);assert.equal(tracker.observe([b]).length,1);
console.log('PASS: new arrivals notify once; existing players, movement, avatar updates and short reconnects stay quiet.');

let permission='granted',refreshes=0,focused=0;const notices=[];
function Notification(title,options){this.title=title;this.options=options;this.closed=false;this.close=()=>this.closed=true;notices.push(this);}
const desktop={desktopAlertsEnabled:false,desktopUnsupported:false,desktopPermission:()=>permission,refreshDesktopAlerts:()=>refreshes++,storeDesktopPreference:enabled=>{desktop.desktopAlertsEnabled=enabled;refreshes++;},setTimeout(){},window:{Notification,focus:()=>focused++}};
vm.createContext(desktop);vm.runInContext(take('function showDesktopAlert(','function announceArrival'),desktop);
assert.equal(desktop.showDesktopAlert('title','body','tag'),false);assert.equal(notices.length,0);
desktop.desktopAlertsEnabled=true;permission='denied';assert.equal(desktop.showDesktopAlert('title','body','tag'),false);
permission='granted';assert.equal(desktop.showDesktopAlert('친구 입장','새 친구가 왔어요','friend-b'),true);assert.equal(notices[0].options.tag,'friend-b');notices[0].onclick();assert.equal(focused,1);assert.equal(notices[0].closed,true);
desktop.window.Notification=function(){throw new TypeError('Unsupported constructor');};assert.equal(desktop.showDesktopAlert('title','body','tag'),false);assert.equal(desktop.desktopUnsupported,true);assert.equal(desktop.desktopAlertsEnabled,false);assert.equal(refreshes,1);
console.log('PASS: desktop alerts require opt-in and permission; unsupported browsers fail safely.');

const storage=new Map(),toasts=[],alerts=[];const arrivals={roomId:'room-1',desktopAlertsEnabled:true,desktopPermission:()=> 'granted',localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},DESKTOP_DEDUPE_KEY:'last-notice',toast:message=>toasts.push(message),showDesktopAlert:(...args)=>alerts.push(args)};
vm.createContext(arrivals);vm.runInContext(take('function announceArrival(','async function toggleDesktopAlerts'),arrivals);arrivals.announceArrival('session-b',{n:'새 친구',u:'owner-b'});arrivals.announceArrival('session-b',{n:'새 친구',u:'owner-b'});assert.equal(toasts.length,2);assert.equal(alerts.length,1);assert(alerts[0][1].includes('새 친구'));assert(alerts[0][2].includes('room-1'));
console.log('PASS: repeated delivery of one arrival does not duplicate the desktop notification.');
