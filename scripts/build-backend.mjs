import {spawn} from 'node:child_process';import {copyFile} from 'node:fs/promises';import path from 'node:path';
const testOnly=process.argv[2]==='test';
const child=spawn(process.platform==='win32'?path.resolve('backend/mvnw.cmd'):'./mvnw',[testOnly?'test':'package'],{cwd:path.resolve('backend'),stdio:'inherit',shell:process.platform==='win32'});
child.on('error',e=>{console.error('Could not start Maven wrapper. Check JDK 17+ and JAVA_HOME.',e.message);process.exitCode=1});
child.on('exit',async code=>{if(code!==0){process.exitCode=code??1;return;}if(!testOnly){await copyFile('backend/target/tripcraft-backend.jar','backend/tripcraft-backend.jar');console.log('Java backend built. Run npm run dev, or npm run build then npm start.');}});
