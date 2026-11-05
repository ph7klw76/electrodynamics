/* Test the real local MP4 H5P lesson in four independent contexts. */
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const root = path.resolve(__dirname,'..');
const cfg = require('../course/config.json');
const port = 8778;
const base = 'http://127.0.0.1:'+port+cfg.base_path;
const evidence = path.join(root,'outputs/browser');

async function learning(phone, embedded) {
  const label = (phone?'phone':'desktop')+(embedded?'-embedded':'');
  const log = fs.openSync(path.join(evidence,'preview-'+label+'.log'),'w');
  const env = {...process.env, H5P_URL: base+(embedded?'':'h5p/electrodynamics.html'),
    H5P_PREVIEW:'true', H5P_PHONE:String(phone), H5P_EMBEDDED:String(embedded)};
  try {
    await new Promise((resolve,reject)=>{
      const process = spawn(processExec(),['webtools/test-learning.cjs'],{cwd:root,env,stdio:['ignore',log,log],windowsHide:true});
      process.once('error',reject);
      process.once('exit',code=>code===0?resolve():reject(Error(label+' failed; see the preview log')));
    });
    console.log('PASS',label);
  } finally {
    fs.closeSync(log);
  }
}

function processExec() {
  return process.execPath;
}

async function main() {
  fs.mkdirSync(evidence,{recursive:true});
  const server = spawn(process.env.PYTHON||'python',['scripts/serve.py','--directory','outputs/h5p-preview',
    '--base-path',cfg.base_path,'--port',String(port)],{cwd:root,stdio:'ignore',windowsHide:true});
  try {
    let ready = false;
    for (let i=0;i<50;i++) {
      if (server.exitCode!==null) throw Error('The preview server exited before startup');
      try {ready=(await fetch(base+'h5p/electrodynamics.html')).ok;}catch {}
      if (ready) break;
      await new Promise(resolve=>setTimeout(resolve,200));
    }
    if (!ready) throw Error('Timed out starting the local MP4 preview');
    for (const embedded of [false,true]) {
      const results = await Promise.allSettled([learning(false,embedded),learning(true,embedded)]);
      const errors=results.filter(r=>r.status==='rejected').map(r=>r.reason);
      if (errors.length) throw new AggregateError(errors,'H5P preview verification failed');
    }
  } finally {
    server.kill();
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
