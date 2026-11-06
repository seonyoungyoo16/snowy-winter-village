const http=require('http'),fs=require('fs'),path=require('path');
http.createServer((req,res)=>{if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});fs.createReadStream(path.join(__dirname,'dist/index.html')).pipe(res);}).listen(4187,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4187'));
