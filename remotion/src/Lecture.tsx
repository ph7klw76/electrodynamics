import React, {useEffect, useRef, useState} from 'react';
import {AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame, delayRender, continueRender} from 'remotion';
import {Video, Audio} from '@remotion/media';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import './style.css';
import events from './generated/events.json';

const palette = {paper:'#071a24',panel:'#102a36',ink:'#f6f7ed',muted:'#b7d1d6',teal:'#74e2d4',gold:'#ffc679',line:'#305260'};
const font = 'Arial, Helvetica, sans-serif';
const symbols = ['∮ B', '∂B/∂t', '∇ × E', '∇ · J', 'E × H', 'E, H', 'δ'];
const labels = ['SAME CONTOUR','CHANGING FLUX','LOCAL TO GLOBAL','CHARGE BUDGET','ENERGY BUDGET','BOUNDARY MATCH','OPTICAL PHASE'];
type Scene = typeof events.scenes[number];

const Equation: React.FC<{formula:string; index:number}> = ({formula,index}) => {
  const frame=useCurrentFrame();
  const opacity=interpolate(frame,[10+index*14,25+index*14],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const html=katex.renderToString(formula,{displayMode:true,throwOnError:true});
  const fontSize=formula.length>140?33:formula.length>105?38:formula.length>70?42:49;
  const outer=useRef<HTMLDivElement>(null), inner=useRef<HTMLDivElement>(null);
  const [fit,setFit]=useState({scale:1,height:90});
  const [handle]=useState(()=>delayRender('Fit equation to the safe area'));
  useEffect(()=>{
    let active=true;
    document.fonts.ready.then(()=>{
      if (!active || !inner.current || !outer.current) return;
      const box=inner.current.getBoundingClientRect();
      const scale=Math.min(1,(outer.current.clientWidth-16)/box.width);
      setFit({scale,height:box.height*scale});
      requestAnimationFrame(()=>continueRender(handle));
    });
    return ()=>{active=false;continueRender(handle);};
  },[handle,formula]);
  return <div ref={outer} style={{opacity,height:fit.height,margin:'12px 0',position:'relative',width:'100%'}}>
    <div ref={inner} style={{position:'absolute',left:'50%',top:0,display:'inline-block',whiteSpace:'nowrap',
      fontSize,transform:`translateX(-50%) scale(${fit.scale})`,transformOrigin:'top center'}}
      dangerouslySetInnerHTML={{__html:html}}/>
  </div>;
};

const FieldLines:React.FC<{phase:number;color?:string}> = ({phase,color=palette.teal}) => (
  <svg width="100%" height="100%" viewBox="0 0 900 600" aria-hidden="true">
    <defs><radialGradient id="fieldGlow"><stop stopColor={color} stopOpacity=".18"/><stop offset="1" stopColor={color} stopOpacity="0"/></radialGradient></defs>
    <rect width="900" height="600" fill="url(#fieldGlow)"/>
    {Array.from({length:11},(_,i)=>{
      const y=68+i*46;
      const a=42*Math.cos(i*.46+phase);
      return <path key={i} d={`M 25 ${y} C 260 ${y+a} 610 ${y-a} 875 ${y}`} stroke={color} strokeOpacity={i===5?.62:.25} fill="none" strokeWidth={i===5?3:1.6}/>;
    })}
    {Array.from({length:15},(_,i)=><path key={i} d={`M ${30+i*60} 48 V 548`} stroke={color} strokeOpacity=".08"/>)}
    <circle cx="450" cy="300" r="150" fill="none" stroke={color} strokeOpacity=".24" strokeDasharray="5 14" strokeWidth="2"/>
  </svg>
);

const Presentation:React.FC<{scene:Scene}> = ({scene})=>{
  const frame=useCurrentFrame();
  const chapter=events.chapters[scene.chapter];
  const question=events.quizzes.find(q=>q.scene===scene.index);
  const enter=interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'});
  const highlight=scene.highlight_frame!==null&&frame+scene.start_frame>=scene.highlight_frame&&frame+scene.start_frame<scene.highlight_frame+70;
  const localAnimationFrames=Math.min(scene.duration_frames,chapter.animation_frames);
  const reveal=scene.kind==='reveal';
  const shell={position:'absolute' as const,left:66,right:66,top:277,height:652,borderRadius:20,background:palette.panel,border:`1px solid ${palette.line}`};
  return <AbsoluteFill style={{fontFamily:font,color:palette.ink}}>
    <header style={{position:'absolute',top:40,left:68,right:68,display:'flex',justifyContent:'space-between',fontSize:24,letterSpacing:3,color:palette.teal}}>
      <span>ELECTRODYNAMICS / FIELD LAB</span><span style={{color:palette.muted}}>CHAPTER {scene.chapter+1} / {events.chapters.length}</span>
    </header>
    <div style={{position:'absolute',left:66,right:66,top:102,opacity:enter}}>
      <div style={{fontSize:23,letterSpacing:3,color:palette.gold}}>{chapter.title.toUpperCase()}</div>
      <div style={{fontSize:63,lineHeight:1.04,fontWeight:700,marginTop:10}}>{scene.title}</div>
      <div style={{fontSize:30,color:palette.muted,marginTop:11}}>{scene.focus}</div>
    </div>
    {question?<div style={{...shell,padding:'36px 51px'}}>
      <div style={{fontSize:24,color:palette.gold,letterSpacing:4}}>PREDICT / {question.id}</div>
      <div style={{fontSize:48,fontWeight:700,lineHeight:1.14,margin:'23px 0 27px'}}>{question.question}</div>
      {question.options.map((option,i)=><div key={option} style={{display:'flex',alignItems:'center',gap:27,padding:'14px 20px',marginBottom:13,border:`1px solid ${palette.line}`,borderRadius:10,fontSize:35,lineHeight:1.17}}>
        <span style={{color:palette.teal,fontSize:27}}>{String.fromCharCode(65+i)}</span><span>{option}</span>
      </div>)}
      <div style={{position:'absolute',bottom:35,left:51,right:51,fontSize:27,color:palette.muted}}>Choose an answer. State the law and explain your sign or limit.
        <div style={{height:4,background:palette.line,marginTop:17}}><div style={{height:4,background:palette.gold,width:`${interpolate(frame+scene.start_frame,[question.hold_start_frame,question.reveal_frame],[0,100],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}%`}}/></div>
      </div>
    </div>:<>
      <div style={{...shell,right:'auto',width:874,overflow:'hidden'}}>
        {reveal?<><Img src={staticFile(`manim/chapter-${scene.chapter+1}.png`)} style={{width:874,height:612,objectFit:'contain'}}/>
          <Sequence durationInFrames={localAnimationFrames}><Video muted src={staticFile(`manim/chapter-${scene.chapter+1}.mp4`)} style={{width:874,height:612,objectFit:'contain'}}/></Sequence></>
          :<><FieldLines phase={scene.chapter*.9}/><div style={{position:'absolute',inset:0,display:'grid',placeContent:'center',textAlign:'center'}}>
              <div style={{fontSize:27,letterSpacing:5,color:palette.teal}}>{labels[scene.chapter]}</div>
              <div style={{font:'144px Georgia, serif',color:palette.ink,textShadow:`0 8px 45px ${palette.paper}`}}>{symbols[scene.chapter]}</div>
            </div></>}
        <div style={{position:'absolute',bottom:16,left:25,fontSize:20,letterSpacing:2,color:palette.muted}}>{reveal?'MODEL VISUALIZATION':'FIELD NOTE / KEY QUANTITY'}</div>
      </div>
      <div style={{position:'absolute',left:985,right:68,top:305,height:582,display:'flex',flexDirection:'column',justifyContent:'center'}}>
        <div style={{fontSize:24,letterSpacing:4,color:highlight?palette.gold:palette.teal}}>{highlight?`KEY IDEA / ${scene.highlight_term.toUpperCase()}`:reveal?'CHECK THE PREDICTION':'THE REASONING'}</div>
        <div style={{margin:'20px 0'}}>{scene.formulas.map((formula,i)=><Equation key={formula} formula={formula} index={i}/>)}</div>
        <div style={{fontSize:32,color:palette.muted,lineHeight:1.3,borderTop:`1px solid ${palette.line}`,paddingTop:23}}>{scene.note}</div>
        {scene.index===events.scenes.length-1&&<div style={{color:palette.gold,fontSize:27,marginTop:25}}>OPEN THE PYTHON LAB • LINK IN DESCRIPTION</div>}
      </div>
    </>}
    <footer style={{position:'absolute',left:68,right:68,bottom:39,borderTop:`1px solid ${palette.line}`,paddingTop:18,display:'flex',justifyContent:'space-between',color:palette.muted,fontSize:23,letterSpacing:2}}>
      <span>{scene.index===events.scenes.length-1?events.website_url.replace('https://',''):question?'PREDICTION FIRST / EXPLANATION NEXT':'SI UNITS / MODEL ASSUMPTIONS EXPLICIT'}</span>
      <span style={{color:palette.teal}}>{String(scene.index+1).padStart(2,'0')} / {events.scenes.length}</span>
    </footer>
  </AbsoluteFill>;
};

export const Lecture:React.FC<{showCaptions:boolean}> = ({showCaptions})=>{
  const frame=useCurrentFrame();
  const scene=events.scenes.find(s=>frame>=s.start_frame&&frame<s.end_frame)??events.scenes[0];
  const cue=showCaptions?(events.captions as {start_frame:number;end_frame:number;text:string}[]).find(c=>frame>=c.start_frame&&frame<c.end_frame):null;
  return <AbsoluteFill style={{background:palette.paper}}>
    <Sequence from={scene.start_frame} durationInFrames={scene.duration_frames}><Presentation scene={scene}/></Sequence>
    <Audio src={staticFile('media/narration.wav')}/>
    {cue&&<div style={{position:'absolute',left:130,right:130,bottom:130,font:`34px/1.3 ${font}`,color:'white',textAlign:'center',padding:18,background:'#071a24ed',borderRadius:10,whiteSpace:'pre-line'}}>{cue.text}</div>}
    <div style={{position:'absolute',bottom:0,height:5,width:`${100*frame/(events.duration_frames-1)}%`,background:palette.teal}}/>
  </AbsoluteFill>;
};

export const Thumbnail:React.FC = ()=> <AbsoluteFill style={{background:palette.paper,color:palette.ink,fontFamily:font}}>
  <div style={{position:'absolute',width:670,height:590,right:-120,top:56}}><FieldLines phase={1.2} color={palette.gold}/></div>
  <div style={{position:'absolute',right:68,top:209,color:palette.gold,font:'162px Georgia, serif'}}>E × H</div>
  <div style={{position:'absolute',left:64,top:65,fontSize:26,color:palette.teal,letterSpacing:5}}>ELECTRODYNAMICS / FIELD LAB</div>
  <div style={{position:'absolute',left:59,top:171,maxWidth:692,fontSize:86,fontWeight:800,lineHeight:.99}}>CAN ENERGY<br/>CROSS A <span style={{color:palette.teal}}>GAP?</span></div>
  <div style={{position:'absolute',left:64,top:454,color:palette.muted,fontSize:36}}>From Maxwell’s equations to optical coatings</div>
  <div style={{position:'absolute',bottom:56,left:64,right:64,borderTop:`1px solid ${palette.line}`,paddingTop:22,fontSize:26,letterSpacing:2,color:palette.gold}}>PREDICT • CALCULATE • TEST</div>
</AbsoluteFill>;
