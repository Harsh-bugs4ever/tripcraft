import {spawn} from 'node:child_process';
import {startJava} from './java.mjs';
let server,frontend;
try{
 server=startJava({PORT:'8080'});
 frontend=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','3000'],{stdio:'inherit'});
 const stop=()=>{server?.kill();frontend?.kill()};
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,stop);
 server.on('exit',code=>{frontend?.kill();process.exitCode=code??1});
 frontend.on('exit',code=>{server?.kill();process.exitCode=code??1});
}catch(e){server?.kill();frontend?.kill();console.error(e.message);process.exitCode=1;}
