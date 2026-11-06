const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{spawnSync}=require('child_process');
for(const world of['winter','aquarium','library']){
 const scripts=world==='winter'?['check.cjs','check-multiplayer.cjs','check-notifications.cjs','check-world-travel.cjs']:['check.cjs','check-notifications.cjs','check-world-travel.cjs'];
 for(const script of scripts){const r=spawnSync(process.execPath,[script],{cwd:path.join(__dirname,world),stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
 const artifact=fs.readFileSync(path.join(__dirname,world,'docs/index.html'),'utf8'),deployed=fs.readFileSync(path.join(__dirname,'docs',world==='winter'?'':world,'index.html'),'utf8');assert.equal(artifact,deployed);
 for(const setting of['"winterPath":"/snowy-winter-village/"','"aquariumPath":"/snowy-winter-village/aquarium/"','"libraryPath":"/snowy-winter-village/library/"'])assert(artifact.includes(setting),world+' has an outdated travel destination');
}
for(const file of['world-travel.js','world-travel.html','world-travel.css']){const canonical=fs.readFileSync(path.join(__dirname,'winter',file),'utf8');for(const world of['aquarium','library'])assert.equal(fs.readFileSync(path.join(__dirname,world,file),'utf8'),canonical);}
console.log('PASS: one repository publishes all three self-contained worlds with matching shared travel and the same friend party.');
