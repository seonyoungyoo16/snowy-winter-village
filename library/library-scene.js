// A cutaway lantern library, made entirely from batched primitive meshes.
const colliders=[];
function block(x,z,r){colliders.push({x,z,r});}
function blockBox(x,z,w,d){colliders.push({x,z,w,d});}
function blocked(x,z,pad=.43,catPass=false){if(Math.abs(x)>19.5||z>16.7||z< -16.7)return true;return colliders.some(c=>!(catPass&&c.catProp)&&(c.r!==undefined?(c.x-x)**2+(c.z-z)**2<(c.r+pad)**2:Math.abs(c.x-x)<c.w/2+pad&&Math.abs(c.z-z)<c.d/2+pad));}
let seed=31415;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const WOOD=0x8b6657,TRIM=0xc4a17a,CREAM=0xe6d7b4;
box(world,0x5c4750,0,-.48,0,42,.85,38);box(world,0xb48c70,0,-.035,0,41.6,.07,37.6);
for(let z=-18;z<19;z+=1.25){box(details,Math.round(z*4)%3===0?0xc69f79:0xbd9572,0,.007,z,41.3,.012,1.21);for(let x=-20+(Math.round(z)%2)*2;x<21;x+=5.2)box(details,0xa37c64,x,.015,z,.018,.015,1.2);}
box(details,0xc8b99d,0,3.3,-17.9,41.5,6.6,.25);box(details,WOOD,0,.2,-17.55,41,.4,.18);
for(const x of[-20.7,20.7]){box(details,0xaa927e,x,.65,0,.25,1.3,36);box(details,WOOD,x,1.34,0,.34,.12,36);}
for(const x of[-19.5,0,19.5]){box(details,WOOD,x,3.2,-17.65,.2,6.4,.25);box(details,TRIM,x,6.5,-17.7,.32,.12,.3);}
box(details,0xaaa18b,0,6.6,-17.8,41.7,.18,.7);
// Moonlit window and warm paper lanterns.
box(details,WOOD,10.1,3.8,-17.6,11.6,5.1,.18);
// One small procedural sky texture stays behind every window rail and inside the glass; it is redrawn when Seoul time or weather changes.
const WINDOW_LOOKS={
 night:{stops:['#081426','#243c59','#647b89'],stars:1,moon:true,cloud:[139,158,174],hills:['#344c5e','#152c3c']},
 dawn:{stops:['#4d5d86','#c99aa6','#f2c7a1'],stars:.25,sun:{x:250,y:330,r:30,color:'255,214,170'},cloud:[214,170,170],hills:['#6b6a80','#4b4c63']},
 day:{stops:['#78acd6','#b3d3e8','#e2edf0'],stars:0,sun:{x:600,y:92,r:26,color:'255,250,226'},cloud:[255,255,255],hills:['#8aa6a8','#6d8c8e']},
 dusk:{stops:['#3e4a78','#d68f7f','#f4bd86'],stars:.15,sun:{x:780,y:330,r:32,color:'255,190,140'},cloud:[222,150,140],hills:['#5e5368','#3e3a50']}
};
function makeWindowSky(phase='night',weather='clear',rainbow=false){
 const look=WINDOW_LOOKS[phase]||WINDOW_LOOKS.night,overcast=weather!=='clear'&&weather!=='fog';
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=428;const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
 const gradient=ctx.createLinearGradient(0,0,0,h);gradient.addColorStop(0,look.stops[0]);gradient.addColorStop(.62,look.stops[1]);gradient.addColorStop(1,look.stops[2]);ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
 if(overcast){ctx.fillStyle=`rgba(112,120,134,${weather==='cloudy'?.32:.5})`;ctx.fillRect(0,0,w,h);}
 const noise=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
 const smooth=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return lerp(lerp(noise(ix,iy),noise(ix+1,iy),u),lerp(noise(ix,iy+1),noise(ix+1,iy+1),u),v);};
 const stars=overcast?0:look.stars;if(stars)for(let i=0;i<175;i++){const x=noise(i,3)*w,y=noise(i,7)*h*.86,r=.3+Math.pow(noise(i,11),5)*1.15;ctx.fillStyle=`rgba(${210+Math.floor(noise(i,19)*45)},${220+Math.floor(noise(i,23)*30)},245,${(.25+noise(i,13)*.65)*stars})`;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();}
 if(look.moon&&!overcast){const mx=600,my=104,r=24,halo=ctx.createRadialGradient(mx,my,r*.7,mx,my,r*3.4);halo.addColorStop(0,'#dbe8f62d');halo.addColorStop(1,'#dbe8f600');ctx.fillStyle=halo;ctx.fillRect(mx-r*3.4,my-r*3.4,r*6.8,r*6.8);
  ctx.save();ctx.beginPath();ctx.arc(mx,my,r,0,TAU);ctx.clip();const moon=ctx.createRadialGradient(mx-r*.35,my-r*.3,r*.08,mx+r*.3,my+r*.1,r*1.5);moon.addColorStop(0,'#eceee1');moon.addColorStop(.62,'#b8c2c3');moon.addColorStop(1,'#57647a');ctx.fillStyle=moon;ctx.fillRect(mx-r,my-r,r*2,r*2);for(let i=0;i<24;i++){ctx.fillStyle=i%2?'#66748622':'#f4f5e01a';ctx.beginPath();ctx.arc(mx+(noise(i,31)-.5)*r*1.9,my+(noise(i,37)-.5)*r*1.9,1+noise(i,41)*5,0,TAU);ctx.fill();}ctx.restore();}
 if(look.sun&&!overcast){const s=look.sun,glow=ctx.createRadialGradient(s.x,s.y,s.r*.6,s.x,s.y,s.r*4);glow.addColorStop(0,`rgba(${s.color},.85)`);glow.addColorStop(.3,`rgba(${s.color},.3)`);glow.addColorStop(1,`rgba(${s.color},0)`);ctx.fillStyle=glow;ctx.fillRect(s.x-s.r*4,s.y-s.r*4,s.r*8,s.r*8);ctx.fillStyle=`rgba(${s.color},1)`;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,TAU);ctx.fill();}
 if(rainbow){ctx.save();ctx.globalAlpha=.32;['#e98d8d','#f0b77e','#f1df8a','#9fd39a','#8fb8e0','#a99bd6'].forEach((c,i)=>{ctx.strokeStyle=c;ctx.lineWidth=9;ctx.beginPath();ctx.arc(w*.42,h*1.25,h*.95-i*9,Math.PI*1.12,Math.PI*1.88);ctx.stroke();});ctx.restore();}
 const [cr,cg,cb]=overcast?[150,156,166]:look.cloud,cloudAmount=overcast?2.4:1;
 const clouds=document.createElement('canvas');clouds.width=256;clouds.height=107;const cc=clouds.getContext('2d'),pixels=cc.createImageData(256,107);for(let y=0;y<107;y++)for(let x=0;x<256;x++){let n=0,weight=.55;for(let octave=0;octave<4;octave++){n+=smooth(x/48*2**octave,y/28*2**octave)*weight;weight*=.5;}const alpha=Math.min(255,clamp((n-(overcast?.36:.47))*2.5,0,1)*Math.sin(y/107*Math.PI)*68*cloudAmount),at=(y*256+x)*4;pixels.data[at]=cr;pixels.data[at+1]=cg;pixels.data[at+2]=cb;pixels.data[at+3]=alpha;}cc.putImageData(pixels,0,0);ctx.drawImage(clouds,0,0,w,h);
 for(let layer=0;layer<2;layer++){ctx.fillStyle=look.hills[layer];ctx.beginPath();ctx.moveTo(0,h);for(let x=0;x<=w;x+=16)ctx.lineTo(x,h-12-layer*8-smooth(x/170,layer+10)*28);ctx.lineTo(w,h);ctx.closePath();ctx.fill();}
 if(weather==='fog'){ctx.fillStyle='rgba(214,218,222,.42)';ctx.fillRect(0,0,w,h);}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function makeNightSky(){return makeWindowSky('night');}
const windowSky=mesh(new THREE.PlaneGeometry(10.9,4.55),new THREE.MeshBasicMaterial({map:makeNightSky(),toneMapped:false,fog:false}),world,10.1,3.8,-17.48);windowSky.name='window-night-sky';
// Rain stays outside the glass: one line batch between the sky picture and the window rails.
const RAIN_DROPS=mobile?44:80,rainArray=new Float32Array(RAIN_DROPS*6),rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainArray,3));
for(let i=0;i<RAIN_DROPS;i++){const x=4.75+rand()*10.7,y=1.6+rand()*4.4;rainArray.set([x,y,-17.45,x-.05,y-.32,-17.45],i*6);}
const windowRain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:0xd8e4ee,transparent:true,opacity:.55,fog:false}));windowRain.name='window-rain';windowRain.visible=false;windowRain.frustumCulled=false;world.add(windowRain);
let windowSkyKey='night|clear|false';
const skyWeatherConfig={world:'library',indoor:true,scene,renderer,sun:light,night:{bg:0x695b66,fog:0x796a77,hemiSky:0xffe5bf,hemiGround:0x807986,hemi:1.95,sun:0xffe2b0,sunI:1.75,density:.012},day:{bg:0x8f7f87,fog:0x9d8d94,hemiSky:0xfff0d8,hemiGround:0x918995,hemi:2.25,sun:0xfff0d0,sunI:2.05,density:.011},dusk:0xd6a08f,glows:[{material:mat(0xf1d49c,true),dim:.82}],
 onChange(s){const key=s.phase+'|'+s.kind+'|'+s.rainbow;if(key!==windowSkyKey){windowSkyKey=key;const old=windowSky.material.map;windowSky.material.map=makeWindowSky(s.phase,s.kind,s.rainbow);windowSky.material.needsUpdate=true;old.dispose();}windowRain.visible=s.kind==='precip'||s.kind==='heavy';},
 tick(dt,s){if(!windowRain.visible||reduced)return;const fall=(s.kind==='heavy'?9:6)*dt,slant=s.wind.x*.03;for(let i=0;i<RAIN_DROPS;i++){let y=rainArray[i*6+1]-fall;if(y<1.6)y+=4.4;const x=rainArray[i*6];rainArray[i*6+1]=y;rainArray[i*6+3]=x-.05-slant;rainArray[i*6+4]=y-.32;}rainGeo.attributes.position.needsUpdate=true;}};
for(const x of[6.4,10.1,13.8])box(details,TRIM,x,3.8,-17.37,.13,4.7,.12);box(details,TRIM,10.1,3.8,-17.36,11,.13,.13);box(details,WOOD,10.1,1.35,-17.2,12.1,.22,.65);
function lantern(x,z,h=6){mesh(geom.cyl,WOOD,details,x,h+.65,z,.025,1.3,.025);sphere(details,mat(0xf1d49c,true),x,h,z,.55,.43,.55);for(let i=0;i<5;i++)ring(details,0xc5aa7f,x,h-.27+i*.135,z,.52*Math.sqrt(1-((i-2)/3)**2),.012);mesh(geom.cyl,WOOD,details,x,h+.43,z,.13,.08,.13);}
lantern(-7,1,5.9);lantern(5,-4,6.3);lantern(13,9,5.6);
function leafPlant(x,z,s=1){mesh(geom.cyl,0xb6aa8c,details,x,.35*s,z,.42*s,.7*s,.42*s);mesh(geom.cyl,0x837b59,details,x,.9*s,z,.035*s,1.2*s,.035*s);for(let i=0;i<7;i++){const a=i*2.4,leaf=sphere(details,[0x7b947b,0x8fa58a,0x9eac89][i%3],x+Math.sin(a)*.25*s,(1+i*.12)*s,z+Math.cos(a)*.24*s,.32*s,.12*s,.18*s);leaf.rotation.z=Math.cos(a)*.55;leaf.rotation.y=a;}block(x,z,.35*s);}
const bookColors=[0x9aac99,0xd1a292,0xc1ad81,0xa29ab8,0x7895a0,0xd0bb98];
function shelf(x,z,w=6,h=3.9,rotation=0){const p=new THREE.Group();for(const side of[-1,1])box(p,WOOD,side*w/2,h/2,0,.16,h,1.1);box(p,0x6c5652,0,h/2,-.48,w,h,.12);for(let row=0;row<4;row++){const gap=(h-.25)/4,y=.16+row*gap;box(p,TRIM,0,y,0,w+.14,.12,1.14);for(let i=0;i<Math.floor(w/.31)-1;i++){const width=.16+rand()*.12,height=gap*(.55+rand()*.32),bx=-w/2+.3+i*.3,bz=.07;const b=box(p,bookColors[Math.floor(rand()*bookColors.length)],bx,y+height/2+.07,bz,width,height,.65);if(i%7===3)b.rotation.z=.13;box(p,mat(0xe4ce9c,true),bx,y+height*.7,bz+.334,width*.7,.023,.016);}}box(p,WOOD,0,h+.08,0,w+.35,.2,1.3);mergeModel(p);p.position.set(x,0,z);p.rotation.y=rotation;world.add(p);if(Math.abs(rotation)>.5)blockBox(x,z,1.2,w+.3);else blockBox(x,z,w+.3,1.2);return p;}
shelf(-12,-14.7,7.8,3.9);shelf(-3.2,-14.7,7.8,3.9);shelf(-12,-7.3,7.6,3.3);shelf(-18,-7,6.2,3.3,Math.PI/2);shelf(18,-8,7.6,3.9,-Math.PI/2);
// Reading rug, round table and small stools.
const rug=mesh(geom.disc,0xa88b91,details,0,.026,-2,7.5,6.4,1);rug.rotation.x=-Math.PI/2;
const rugBorder=mesh(new THREE.RingGeometry(.94,1,72),0xc2aaa2,details,0,.033,-2,7.15,6,1);rugBorder.rotation.x=-Math.PI/2;
mesh(geom.cyl,0x72564f,details,0,.48,-2,.58,.96,.58);mesh(geom.cyl,0xc1a180,details,0,.98,-2,3.1,.18,3.1);ring(details,WOOD,0,1.08,-2,3.04,.025);block(0,-2,3.12);
function littleBook(p,x,y,z,c,angle=0){const b=new THREE.Group();box(b,c,0,0,0,.65,.13,.82);box(b,0xe5d8ba,0,.012,.018,.59,.086,.73);box(b,c,0,.074,0,.66,.03,.83);b.position.set(x,y,z);b.rotation.y=angle;p.add(b);}
for(let i=0;i<4;i++)littleBook(details,-1.5+i*.9,1.14,-2+Math.sin(i)*.5,bookColors[i],i*.5);
function tableLamp(x,z,y=1.1){mesh(geom.cyl,0x8d785e,details,x,y+.02,z,.28,.06,.28);mesh(geom.cyl,0x8d785e,details,x,y+.39,z,.035,.72,.035);mesh(new THREE.CylinderGeometry(.3,.5,.44,16),0xc8bca0,details,x,y+.86,z);sphere(details,mat(0xffe0a2,true),x,y+.7,z,.13);}
tableLamp(0,-2);
const readingSeats=[{x:-4,z:-2,a:Math.PI/2},{x:4,z:-2,a:-Math.PI/2},{x:0,z:2.1,a:Math.PI},{x:0,z:-6.1,a:0}].map((s,index)=>({...s,index,approach:{x:s.x-Math.sin(s.a)*1.05,z:s.z-Math.cos(s.a)*1.05}}));
function stool(x,z){mesh(geom.cyl,0x9c7863,details,x,.27,z,.08,.54,.08);mesh(geom.cyl,0xaca28d,details,x,.54,z,.52,.16,.52);block(x,z,.2);}
readingSeats.forEach(s=>stool(s.x,s.z));
const windowSeats=[6.2,8.8,11.4,14].map(x=>({x,z:-15.3,a:Math.PI,approach:{x,z:-14.05}}));
function windowChair(s){const p=new THREE.Group();p.name='sky-facing-wooden-chair';for(const x of[-.43,.43])for(const z of[-.37,.37])box(p,WOOD,x,.31,z,.1,.62,.1);box(p,TRIM,0,.62,0,1.12,.14,1.02);box(p,0x9da98e,0,.73,0,.98,.1,.88);for(const x of[-.46,.46])box(p,WOOD,x,1.08,-.43,.1,.98,.1);box(p,TRIM,0,1.52,-.43,1.12,.12,.14);for(const x of[-.25,0,.25])box(p,TRIM,x,1.13,-.43,.065,.65,.09);mergeModel(p);p.position.set(s.x,0,s.z);p.rotation.y=s.a;world.add(p);blockBox(s.x,s.z,1.12,1.15);}
windowSeats.forEach(windowChair);tableLamp(4.7,-14.2,0);tableLamp(15.5,-14.2,0);leafPlant(17,-15.7,1.5);leafPlant(3.6,-15.6,1.4);
const loungeRug=mesh(geom.disc,0xbda68a,details,10.1,.025,-14.8,6.6,1.8,1);loungeRug.rotation.x=-Math.PI/2;
// Bookmark desk and a small board.
box(details,0xa28267,9,1,1,4.1,.2,3.4);for(const x of[7.35,10.65])for(const z of[-.25,2.25])box(details,WOOD,x,.48,z,.18,.96,.18);blockBox(9,1,4.1,3.4);
littleBook(details,8,1.17,.3,0x9aac99,.1);littleBook(details,8.2,1.35,.4,0xa99ab6,-.1);box(details,0xc5b79a,10,1.16,.2,.8,.12,.56);tableLamp(10.3,-.1,1.1);
box(details,WOOD,13.2,1.7,1.2,2.5,2.3,.18);box(details,0xc8b794,13.2,1.7,1.31,2.23,2.03,.08);for(const x of[12.3,14.1])box(details,WOOD,x,.55,1.2,.12,1.1,.15);blockBox(13.2,1.2,2.5,.4);
leafPlant(-18,5,1.2);leafPlant(15,10.8,1.2);leafPlant(-5,13.7,.95);
for(const x of[-5,5]){mesh(geom.cyl,0x8a6b5d,details,x,2.6,14,.16,5.2,.16);sphere(details,mat(0xe9d2a6,true),x,4.65,14,.3);}
const arch=new THREE.CatmullRomCurve3(Array.from({length:21},(_,i)=>{const a=i/20*Math.PI;return new THREE.Vector3(-5*Math.cos(a),5.15+Math.sin(a)*1.2,14);}));mesh(new THREE.TubeGeometry(arch,40,.08,6,false),TRIM,details);
mergeModel(details);
function sceneSign(x,z,title,subtitle){const c=document.createElement('canvas');c.width=512;c.height=192;const ctx=c.getContext('2d');ctx.fillStyle='#594950';ctx.beginPath();ctx.roundRect(0,0,512,192,20);ctx.fill();ctx.textAlign='center';ctx.fillStyle='#f3e0b9';ctx.font='38px "Malgun Gothic",sans-serif';ctx.fillText(title,256,77);ctx.fillStyle='#c9b5a5';ctx.font='21px sans-serif';ctx.fillText(subtitle,256,133);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const m=mesh(new THREE.PlaneGeometry(2.7,1.012),new THREE.MeshBasicMaterial({map:texture}),world,x,1.36,z);m.rotation.x=-.1;mesh(geom.cyl,WOOD,world,x,.5,z,.045,1,.045);block(x,z,.15);}
sceneSign(-8.3,-4.5,'책의 숲','PICK A LITTLE STORY');sceneSign(12,-6.7,'달빛 창가','A QUIET WINDOW');sceneSign(11.7,4.3,'작은 책갈피','LEAVE A LITTLE MEMORY');
