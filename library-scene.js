// A cutaway lantern library, made entirely from batched primitive meshes.
const colliders=[];
function block(x,z,r){colliders.push({x,z,r});}
function blockBox(x,z,w,d){colliders.push({x,z,w,d});}
function blocked(x,z,pad=.43){if(Math.abs(x)>19.5||z>16.7||z< -16.7)return true;return colliders.some(c=>c.r!==undefined?(c.x-x)**2+(c.z-z)**2<(c.r+pad)**2:Math.abs(c.x-x)<c.w/2+pad&&Math.abs(c.z-z)<c.d/2+pad);}
let seed=31415;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const WOOD=0x8b6657,TRIM=0xc4a17a,CREAM=0xe6d7b4;
box(world,0x5c4750,0,-.48,0,42,.85,38);box(world,0xb48c70,0,-.035,0,41.6,.07,37.6);
for(let z=-18;z<19;z+=1.25){box(details,Math.round(z*4)%3===0?0xc69f79:0xbd9572,0,.007,z,41.3,.012,1.21);for(let x=-20+(Math.round(z)%2)*2;x<21;x+=5.2)box(details,0xa37c64,x,.015,z,.018,.015,1.2);}
box(details,0xc8b99d,0,3.3,-17.9,41.5,6.6,.25);box(details,WOOD,0,.2,-17.55,41,.4,.18);
for(const x of[-20.7,20.7]){box(details,0xaa927e,x,.65,0,.25,1.3,36);box(details,WOOD,x,1.34,0,.34,.12,36);}
for(const x of[-19.5,0,19.5]){box(details,WOOD,x,3.2,-17.65,.2,6.4,.25);box(details,TRIM,x,6.5,-17.7,.32,.12,.3);}
box(details,0xaaa18b,0,6.6,-17.8,41.7,.18,.7);
// Moonlit window and warm paper lanterns.
box(details,WOOD,10.1,3.8,-17.6,11.6,5.1,.18);box(details,mat(0x697991,true),10.1,3.8,-17.45,10.9,4.55,.035);
for(const x of[6.4,10.1,13.8])box(details,TRIM,x,3.8,-17.37,.13,4.7,.12);box(details,TRIM,10.1,3.8,-17.36,11,.13,.13);box(details,WOOD,10.1,1.35,-17.2,12.1,.22,.65);
sphere(details,mat(0xf1ddad,true),13.7,5.18,-17.32,.42,.42,.06);sphere(details,mat(0x697991,true),13.9,5.32,-17.25,.37,.38,.05);
for(let i=0;i<18;i++)sphere(details,mat(i%3?0xd9d9c4:0xebc998,true),5.2+rand()*9.8,2.1+rand()*3.4,-17.3,.025+rand()*.013);
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
const windowSeats=[{x:8,z:-10.5,a:-.2},{x:11,z:-10.5,a:.1},{x:14,z:-10.1,a:.3},{x:5.2,z:-10,a:-.35}];
function armchair(s){const p=new THREE.Group();box(p,0x7b6659,0,.22,0,1.25,.38,1.1);sphere(p,0x9da98e,0,.62,0,.76,.2,.68);box(p,0x94a28d,0,1.13,-.48,1.48,1,.3);for(const side of[-1,1])box(p,0x9baa93,side*.7,.93,0,.22,.54,1.1);mergeModel(p);p.position.set(s.x,0,s.z);p.rotation.y=s.a;world.add(p);}
windowSeats.forEach(armchair);tableLamp(9.5,-12,0);tableLamp(15.4,-10.8,0);leafPlant(16,-14.8,1.5);leafPlant(3.6,-15.6,1.4);
const loungeRug=mesh(geom.disc,0xbda68a,details,9.5,.025,-11.2,6.8,3.7,1);loungeRug.rotation.x=-Math.PI/2;
// Bookmark desk and a small board.
box(details,0xa28267,9,1,1,4.1,.2,3.4);for(const x of[7.35,10.65])for(const z of[-.25,2.25])box(details,WOOD,x,.48,z,.18,.96,.18);blockBox(9,1,4.1,3.4);
littleBook(details,8,1.17,.3,0x9aac99,.1);littleBook(details,8.2,1.35,.4,0xa99ab6,-.1);box(details,0xc5b79a,10,1.16,.2,.8,.12,.56);tableLamp(10.3,-.1,1.1);
box(details,WOOD,13.2,1.7,1.2,2.5,2.3,.18);box(details,0xc8b794,13.2,1.7,1.31,2.23,2.03,.08);for(const x of[12.3,14.1])box(details,WOOD,x,.55,1.2,.12,1.1,.15);blockBox(13.2,1.2,2.5,.4);
leafPlant(-17,9.5,1.2);leafPlant(15,10.8,1.2);leafPlant(-5,13.7,.95);
for(const x of[-5,5]){mesh(geom.cyl,0x8a6b5d,details,x,2.6,14,.16,5.2,.16);sphere(details,mat(0xe9d2a6,true),x,4.65,14,.3);}
const arch=new THREE.CatmullRomCurve3(Array.from({length:21},(_,i)=>{const a=i/20*Math.PI;return new THREE.Vector3(-5*Math.cos(a),5.15+Math.sin(a)*1.2,14);}));mesh(new THREE.TubeGeometry(arch,40,.08,6,false),TRIM,details);
mergeModel(details);
function sceneSign(x,z,title,subtitle){const c=document.createElement('canvas');c.width=512;c.height=192;const ctx=c.getContext('2d');ctx.fillStyle='#594950';ctx.beginPath();ctx.roundRect(0,0,512,192,20);ctx.fill();ctx.textAlign='center';ctx.fillStyle='#f3e0b9';ctx.font='38px "Malgun Gothic",sans-serif';ctx.fillText(title,256,77);ctx.fillStyle='#c9b5a5';ctx.font='21px sans-serif';ctx.fillText(subtitle,256,133);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const m=mesh(new THREE.PlaneGeometry(2.7,1.012),new THREE.MeshBasicMaterial({map:texture}),world,x,1.36,z);m.rotation.x=-.1;mesh(geom.cyl,WOOD,world,x,.5,z,.045,1,.045);block(x,z,.15);}
sceneSign(-8.3,-4.5,'책의 숲','PICK A LITTLE STORY');sceneSign(12,-6.7,'달빛 창가','A QUIET WINDOW');sceneSign(11.7,4.3,'작은 책갈피','LEAVE A LITTLE MEMORY');
