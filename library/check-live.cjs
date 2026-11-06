const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto');
const config=JSON.parse(fs.readFileSync(__dirname+'/firebase-config.json','utf8'));
const room='lb_'+crypto.randomBytes(12).toString('hex'),sessionA=crypto.randomBytes(12).toString('hex'),sessionB=crypto.randomBytes(12).toString('hex');
let a,b;
async function auth(){const r=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key='+config.apiKey,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({returnSecureToken:true})});const data=await r.json();if(!r.ok)throw Error('Anonymous sign-in failed: '+(data.error?.message||r.status));return data;}
async function request(path,token,method='GET',body){const url=config.databaseURL+'/'+path+'.json'+(token?'?auth='+encodeURIComponent(token):'');const r=await fetch(url,{method,headers:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});return{status:r.status,data:await r.json()};}
const payload=(user,name)=>({v:1,u:user.localId,n:name,k:0,x:0,y:0,z:7,a:0,p:0,m:'idle',b:0,t:{'.sv':'timestamp'},s:1,j:Date.now()});
(async()=>{
 try{
  a=await auth();b=await auth();const pa='rooms/'+room+'/players/'+sessionA,pb='rooms/'+room+'/players/'+sessionB,bodyA=payload(a,'검증 토끼'),bodyB=payload(b,'검증 곰');
  assert.equal((await request(pa,a.idToken,'DELETE')).status,200);console.log('PASS: disconnect cleanup can be reserved before the first character write.');
  assert.equal((await request('rooms/'+room+'/players')).status,401);console.log('PASS: signed-out access is denied.');
  assert.equal((await request(pa,a.idToken,'PUT',bodyA)).status,200);assert.equal((await request(pb,b.idToken,'PUT',bodyB)).status,200);
  const state=await request('rooms/'+room+'/players',b.idToken);assert.equal(state.status,200);assert.equal(Object.keys(state.data).length,2);console.log('PASS: two independent anonymous users can join the same room and read character state.');
  assert.equal((await request(pa,b.idToken,'PUT',{...bodyA,u:b.localId,n:'다른 사람'})).status,401);assert.equal((await request(pa,b.idToken,'DELETE')).status,401);console.log('PASS: another user cannot overwrite or delete a character.');
  assert.equal((await request(pa,a.idToken,'PUT',{...bodyA,x:999})).status,401);assert.equal((await request(pa,a.idToken,'PUT',{...bodyA,extra:'blocked'})).status,401);console.log('PASS: out-of-bounds positions and unexpected fields are rejected.');
  for(const m of['walk','rolling','warm','sled','celebrate','idle']){assert.equal((await request(pa,a.idToken,'PUT',{...bodyA,m,b:m==='rolling'?.5:0,s:2})).status,200);}
  for(const progress of[0,.19,.2,.39,.4,.59])assert.equal((await request(pa,a.idToken,'PUT',{...bodyA,m:'sled',b:progress,s:3})).status,200);
  for(const reading of[.012,.12,.147,.212,.32,.347,.412,.52,.547])assert.equal((await request(pa,a.idToken,'PUT',{...bodyA,m:'rolling',y:.2,b:reading,s:4})).status,200);
  for(const reservation of[.6,.62,.64,.66])assert.equal((await request(pa,a.idToken,'PUT',{...bodyA,m:'walk',b:reservation,s:4})).status,200);
  for(const progress of[.55,.57,.59,.6,.62,.64,.65,.67,.69,.695,.698,.7])assert.equal((await request(pa,a.idToken,'PUT',{...bodyA,m:'celebrate',b:progress,s:5})).status,200);
  for(const approach of[.67,.68,.69])assert.equal((await request(pa,a.idToken,'PUT',{...bodyA,m:'walk',b:approach,s:6})).status,200);
  assert.equal((await request('rooms',a.idToken)).status,401);console.log('PASS: library actions, three book selections and bookmark progress sync; room-directory browsing is denied.');
 }finally{
  if(a)await request('rooms/'+room+'/players/'+sessionA,a.idToken,'DELETE');if(b)await request('rooms/'+room+'/players/'+sessionB,b.idToken,'DELETE');
  for(const user of[a,b])if(user)await fetch('https://identitytoolkit.googleapis.com/v1/accounts:delete?key='+config.apiKey,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({idToken:user.idToken})});
 }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
