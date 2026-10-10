import {startJava} from './java.mjs';
try{const server=startJava();server.on('exit',code=>{process.exitCode=code??1});for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.kill(signal));}catch(e){console.error(e.message);process.exitCode=1;}
