const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const worlds={winter:'',aquarium:'aquarium',library:'library'};
for(const[world,destination]of Object.entries(worlds)){
 const result=spawnSync(process.execPath,['build-multiplayer.cjs'],{cwd:path.join(__dirname,world),stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
 const output=path.join(__dirname,'docs',destination);fs.mkdirSync(output,{recursive:true});fs.copyFileSync(path.join(__dirname,world,'docs/index.html'),path.join(output,'index.html'));
}
fs.writeFileSync(path.join(__dirname,'docs/.nojekyll'),'');
console.log('Built all three worlds for /my-little-village/.');
