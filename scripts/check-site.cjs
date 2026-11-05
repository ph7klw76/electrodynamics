/* Cross-check the built site's browser formula and every relative learner resource. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const out=path.join(root,'outputs','pages');
const model=require(path.join(out,'physics.js'));
const cfg=require(path.join(out,'config.json'));
const events=require(path.join(out,'publication_events.json'));
const fixtures=require(path.join(root,'outputs','physics-fixtures.json'));
for(const row of fixtures){
  const actual=model.coating(...row.args);
  assert.ok(Math.abs(actual.reflectance-row.reflectance)<1e-12);
  assert.ok(Math.abs(actual.transmittance-row.transmittance)<1e-12);
  assert.ok(Math.abs(actual.reflectance+actual.transmittance-1)<1e-12);
}
for(const page of ['index.html','assessment.html']){
  const html=fs.readFileSync(path.join(out,page),'utf8');
  for(const [,name] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    if(name.startsWith('#') || /^https:\/\//.test(name))continue;
    if(!cfg.youtube_url && name.endsWith('.h5p'))continue;
    assert.ok(!name.startsWith('/'),name+' escapes the repository prefix');
    const file=name.split(/[?#]/,1)[0];
    assert.ok(fs.existsSync(path.resolve(out,file)),page+' has a missing target '+name);
  }
}
for(const q of events.quizzes)assert.ok(fs.existsSync(path.join(out,'h5p','question-'+q.id.slice(1)+'.html')));
if(cfg.youtube_url)assert.ok(fs.existsSync(path.join(out,'h5p','electrodynamics.html')));
console.log(JSON.stringify({status:'PASS',checkedFixtures:fixtures.length,basePath:cfg.base_path,standaloneQuestions:events.quizzes.length}));
