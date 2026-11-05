'use strict';

const select = selector => document.querySelector(selector);
const cfg = window.COURSE_CONFIG;
const nFilm = Math.sqrt(1.5);
const wavelength = select('#wavelength');
const thickness = select('#thickness');
const spectrum = select('#spectrum');
const NS = 'http://www.w3.org/2000/svg';

function plotNode(tag, attributes, value) {
  const node = document.createElementNS(NS, tag);
  for (const [key, attr] of Object.entries(attributes)) node.setAttribute(key, attr);
  if (value !== undefined) node.textContent = value;
  return node;
}
function updateModel() {
  const nm = Number(wavelength.value);
  const d = Number(thickness.value);
  const predict = w => FieldLab.coating(w*1e-9,d*1e-9,1,nFilm,1.5);
  const point = predict(nm);
  select('#wavelengthOut').textContent = nm+' nm';
  select('#thicknessOut').textContent = d.toFixed(2)+' nm';
  select('#reflectance').textContent = (100*point.reflectance).toFixed(3)+'%';
  select('#transmittance').textContent = (100*point.transmittance).toFixed(3)+'%';
  select('#design').textContent = (4*nFilm*d).toFixed(1)+' nm';

  const x = w => 72+(w-400)*1.79;
  const y = r => 243-r*4800;
  const curve = Array.from({length:121},(_,i)=>400+i*2.5)
    .map(w=>[x(w),y(predict(w).reflectance)].map(v=>v.toFixed(2)).join(',')).join(' ');
  const marks = [plotNode('rect',{x:72,y:26,width:537,height:217,fill:'#f6f8f3'})];
  for (const value of [0,.01,.02,.03,.04]) {
    marks.push(plotNode('path',{d:`M 72 ${y(value)} H 609`,stroke:'#d6ddd5'}));
    marks.push(plotNode('text',{x:60,y:y(value)+5,'text-anchor':'end'},`${100*value}%`));
  }
  for (const value of [400,500,600,700]) marks.push(plotNode('text',{x:x(value),y:265,'text-anchor':'middle'},value));
  marks.push(plotNode('text',{x:342,y:291,'text-anchor':'middle'},'Vacuum wavelength (nm)'));
  marks.push(plotNode('path',{d:`M 72 ${y(.04)} H 609`,stroke:'#96631e','stroke-width':2,'stroke-dasharray':'8 6'}));
  marks.push(plotNode('polyline',{points:curve,fill:'none',stroke:'#067c73','stroke-width':3}));
  marks.push(plotNode('circle',{cx:x(nm),cy:y(point.reflectance),r:6,fill:'#12313d'}));
  spectrum.replaceChildren(...marks);
  spectrum.setAttribute('aria-label',`Reflectance spectrum. At ${nm} nanometres, the coated interface reflects ${(100*point.reflectance).toFixed(3)} percent.`);
}
for (const control of [wavelength,thickness]) control.addEventListener('input',updateModel);
select('#controls').addEventListener('submit',event=>event.preventDefault());
select('#controls').addEventListener('reset',()=>requestAnimationFrame(updateModel));
updateModel();
document.querySelectorAll('[data-math]').forEach(el=>katex.render(el.dataset.math,el,{throwOnError:true,displayMode:true}));

const frame = select('#lectureH5p');
const status = select('#chapterFeedback');
let observedDoc, observer, player, pendingChapter;
if (cfg.youtube_url || cfg.local_preview) {
  select('#videoPending').hidden = true;
  frame.hidden = false;
  frame.src = 'h5p/electrodynamics.html?v='+encodeURIComponent(cfg.video_revision);
  if (cfg.youtube_url) {
    select('#youtubeLink').href = cfg.youtube_url;
    select('#youtubeLink').hidden = false;
    select('#h5pDownload').hidden = false;
  }
}
function resizePlayer() {
  const content = observedDoc?.querySelector('.h5p-content');
  if (!content || document.fullscreenElement===frame || observedDoc.fullscreenElement || observedDoc.defaultView.H5P?.isFullscreen) return;
  const height = Math.ceil(content.getBoundingClientRect().height)+2;
  if (height>100 && Math.abs(height-frame.getBoundingClientRect().height)>1) frame.style.height = height+'px';
}
function connectPlayer() {
  if (frame.hidden || !frame.contentDocument?.body) return;
  const doc = frame.contentDocument;
  if (doc!==observedDoc) {
    observer?.disconnect();
    observedDoc=doc;
    observer=new ResizeObserver(resizePlayer);
    observer.observe(doc.body);
  }
  const instance=frame.contentWindow.H5P?.instances?.[0];
  if (instance && player!==instance) {
    player=instance;
    player.on('resize',resizePlayer);
  }
  resizePlayer();
  if (pendingChapter && player?.video?.getDuration?.()>0) {
    player.seek(pendingChapter.start_seconds);
    player.play();
    status.textContent='Jumped to '+pendingChapter.title+'.';
    pendingChapter=null;
  }
}
frame.addEventListener('load',connectPlayer);
const timer=setInterval(connectPlayer,250);
window.addEventListener('pagehide',()=>{
  clearInterval(timer);
  observer?.disconnect();
},{once:true});

async function addLessonLinks() {
  const response = await fetch('publication_events.json');
  if (!response.ok) throw new Error('Lesson index unavailable');
  const events = await response.json();
  for (const chapter of events.chapters) {
    const button = document.createElement('button');
    button.type = 'button';
    const stamp = document.createElement('span');
    stamp.className = 'time';
    const seconds = Math.floor(chapter.start_seconds);
    stamp.textContent = String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
    button.append(stamp,document.createTextNode(chapter.title));
    button.addEventListener('click',()=>{
      if (frame.hidden) {
        status.textContent='The public lecture upload is pending.';
        return;
      }
      pendingChapter=chapter;
      status.textContent='Waiting for the lecture player…';
      connectPlayer();
    });
    select('#chapters').append(button);
  }
  for (const question of events.quizzes) {
    const link = document.createElement('a');
    link.href='h5p/question-'+question.id.slice(1)+'.html';
    const small=document.createElement('small');
    small.textContent=question.id+' / ORIGINAL FORMATIVE ACTIVITY';
    link.append(small,document.createTextNode(events.scenes[question.scene].title));
    select('#practiceLinks').append(link);
  }
}
addLessonLinks().catch(error=>{status.textContent=error.message;});
