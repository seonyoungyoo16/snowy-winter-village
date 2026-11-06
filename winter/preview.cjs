const http=require('http'),fs=require('fs'),path=require('path');
const page=path.join(__dirname,'눈 내리는 겨울 마을.html');
http.createServer((req,res)=>{if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});fs.createReadStream(page).pipe(res);}).listen(4185,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4185'));
