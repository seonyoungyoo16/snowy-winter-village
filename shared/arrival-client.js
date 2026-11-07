// The visitor reports their own confirmed join; the owner's browser is never the notification server.
const ARRIVAL_SERVICE=/* ARRIVAL_SERVICE_CONFIG */,arrivalRequests=new Map();
function arrivalDevice(){
 const agent=typeof navigator==='undefined'?{}:navigator,ua=agent.userAgent||'';
 if(/Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(ua)||(/Macintosh|MacIntel/.test(ua+' '+(agent.platform||''))&&agent.maxTouchPoints>1)||agent.userAgentData?.mobile===true)return 'mobile';
 if(agent.userAgentData?.mobile===false||/Windows NT|Macintosh|X11|CrOS|Linux/i.test(ua))return 'pc';
 return 'unknown';
}
async function reportOwnArrival(generation){
 if(!ARRIVAL_SERVICE.endpoint||partyId(roomId)!==ARRIVAL_SERVICE.partyId||!networkJoined||!networkAuth?.currentUser||generation!==networkGeneration)return;
 const expectedRoom=roomId,user=networkAuth.currentUser,key='village-phone-arrival-v1:'+ARRIVAL_SERVICE.partyId+':'+user.uid;
 if(arrivalRequests.has(key))return arrivalRequests.get(key);
 try{const sent=Number(sessionStorage.getItem(key));if(Number.isFinite(sent)&&sent>0&&Date.now()-sent<300000)return;}catch{}
 const pending=(async()=>{
  for(let attempt=0;attempt<3;attempt++){
   if(!networkJoined||generation!==networkGeneration||roomId!==expectedRoom)return;
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
   try{
    const idToken=await user.getIdToken(attempt>0),response=await fetch(ARRIVAL_SERVICE.endpoint.replace(/\/$/,'')+'/arrival',{method:'POST',mode:'cors',credentials:'omit',keepalive:true,headers:{'content-type':'application/json','authorization':'Bearer '+idToken},body:JSON.stringify({room:expectedRoom,session:sessionKey,device:arrivalDevice()}),signal:controller.signal});
    if(response.ok){try{sessionStorage.setItem(key,String(Date.now()));}catch{}return;}
    if(response.status===400||response.status===403||response.status===404)return;
   }catch{}finally{clearTimeout(timeout);}
   if(attempt<2)await new Promise(resolve=>setTimeout(resolve,1200*(attempt+1)));
  }
 })();arrivalRequests.set(key,pending);try{await pending;}finally{arrivalRequests.delete(key);}
}
