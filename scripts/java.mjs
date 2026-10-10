import {spawnSync,spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import path from 'node:path';
export function startJava(extraEnv={}) {
 const check=spawnSync('java',['-version'],{encoding:'utf8'});
 const output=(check.stderr||'')+(check.stdout||'');
 const match=output.match(/version "(\d+)(?:\.(\d+))?/);
 const major=match?.[1]==='1'?Number(match[2]):Number(match?.[1]);
 if(check.error||!major||major<17)throw new Error('TripCraft requires Java 17 or newer. Install JDK 17/21, update JAVA_HOME and PATH, then reopen the terminal. Java 8 cannot run this backend.');
 const jar=path.resolve('backend/tripcraft-backend.jar');
 if(!existsSync(jar))throw new Error('Build the Java backend first: npm run build:backend');
 return spawn('java',['-jar',jar],{env:{...process.env,...extraEnv},stdio:'inherit'});
}
