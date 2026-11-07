// A small village radio made only of Web Audio tones (no recordings): three channels of soft pentatonic phrases
// that follow the existing sound button, slow down at night and brighten by day.
function createVillageRadio(){
 const CHANNELS=[
  {id:'snow',name:'눈 오는 밤',root:261.63,scale:[0,2,4,7,9],wave:'sine',beat:.9,decay:2.4},
  {id:'wave',name:'물결',root:220,scale:[0,3,5,7,10],wave:'triangle',beat:.7,decay:1.6},
  {id:'shelf',name:'책장',root:293.66,scale:[0,2,5,7,9],wave:'sine',beat:.6,decay:1.1}
 ],HOME={winter:0,aquarium:1,library:2}[CURRENT_WORLD],KEY='village-radio';
 function load(){try{const v=localStorage.getItem(KEY);return v==='off'?'off':v!==null&&/^[0-2]$/.test(v)?Number(v):'auto';}catch{return'auto';}}
 let choice=load(),gain=null,next=0,step=0,seed=1;
 const current=()=>choice==='off'?null:CHANNELS[choice==='auto'?HOME:choice];
 function save(){try{localStorage.setItem(KEY,String(choice));}catch{}}
 // Cycle: auto (this world's channel) → each channel → off.
 function cycle(){choice=choice==='auto'?0:choice==='off'?'auto':choice===2?'off':choice+1;save();return label();}
 function label(){const c=current();return choice==='off'?'라디오 끄기':(choice==='auto'?'라디오 · 이 공간':'라디오')+' · '+c.name;}
 const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 // Schedules a little ahead of the audio clock; tempo and octave follow the shared sky.
 function schedule(ctx,c){const sky=typeof skyWeather==='object'&&skyWeather?skyWeather.state:{daylight:1},slow=sky.daylight<.35?1.35:1,lift=sky.daylight>.6?2:1;
  while(next<ctx.currentTime+.6){const deg=c.scale[Math.floor(rand()*c.scale.length)]+(step%8===7?12:0),freq=c.root*lift*Math.pow(2,deg/12)/2,o=ctx.createOscillator(),g=ctx.createGain();o.type=c.wave;o.frequency.value=freq;g.gain.setValueAtTime(0,next);g.gain.linearRampToValueAtTime(.09,next+.03);g.gain.exponentialRampToValueAtTime(.0008,next+c.decay);o.connect(g);g.connect(gain);o.start(next);o.stop(next+c.decay+.05);
   next+=c.beat*slow*(step%4===3?2:1);step++;if(scheduled)scheduled.push({freq,at:next});}}
 let scheduled=null;
 // The channel is changed from the resident's dialog, so the top bar keeps its few buttons.
 if(typeof residentGuide==='object'&&residentGuide&&residentGuide.addAction)residentGuide.addAction('라디오 채널',()=>toast(cycle()+(typeof audioOn!=='undefined'&&!audioOn&&choice!=='off'?' · 소리 버튼을 켜면 들려요':'')));
 return{CHANNELS,cycle,label,get choice(){return choice;},current,
  // Lets the check record what would be played.
  record(on){scheduled=on?[]:null;return scheduled;},
  tick(){const on=typeof audio==='object'&&audio&&typeof audioOn!=='undefined'&&audioOn&&current();if(!audio)return;const ctx=audio.ctx;if(!gain){gain=ctx.createGain();gain.gain.value=0;gain.connect(ctx.destination);next=ctx.currentTime+.1;}
   gain.gain.setTargetAtTime(on?.5:0,ctx.currentTime,.4);if(on)schedule(ctx,current());else next=ctx.currentTime+.1;}
 };
}
const villageRadio=createVillageRadio();
