import React, {useEffect, useRef, useState} from 'react';
import {AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame, delayRender, continueRender} from 'remotion';
import {Audio} from '@remotion/media';
import {FieldMotion} from './FieldMotion';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import './style.css';
import events from './generated/events.json';

const palette = {paper:'#071a24',panel:'#102a36',ink:'#f6f7ed',muted:'#b7d1d6',teal:'#74e2d4',gold:'#ffc679',line:'#305260'};
const font = 'Arial, Helvetica, sans-serif';
const takeaways: Record<number,string> = {
  0:'Keep the edge fixed and compare two surfaces.',
  1:'The flat surface cuts the wire. The bulging surface reaches the gap.',
  3:'The electric flux grows while the lead current stays steady.',
  4:'A changing axial field drives electric circulation outside the coil.',
  5:'The field-filled area stops growing at the coil radius.',
  7:'Reverse the magnetic ramp. The electric arrows reverse even while B stays positive.',
  8:'Adjacent cells trace each shared edge in opposite directions.',
  9:'The small loop encloses no changing magnetic flux. Local E still exists along it.',
  11:'The signed contributions cancel after one trip around the exterior loop.',
  12:'When outflow exceeds inflow, the charge inside decreases.',
  13:'The narrow end has larger current density over a smaller area.',
  15:'The end currents balance. The steady volume stores no additional charge.',
  16:'Use the E and B directions to find which way energy crosses the rim.',
  17:'Watch the stored electric energy rise as power enters through the side.',
  19:'Inward power grows from 4 to 20 mW as the voltage rises at fixed current.',
  20:'Changing the direction of propagation reverses H relative to E.',
  21:'Field amplitudes and power fractions tell you different things.',
  23:'The reflected electric field flips phase. The reflected power is 4%.',
  24:'The thickness sets the round-trip phase. The index sets the amplitudes.',
  25:'At 550 nm the returning phasor cancels the first reflection.',
  27:'A shorter wavelength changes the phase and produces a net reflected field.',
};
const equationIndex: Record<number,number> = {3:1,4:0,5:0,7:0,8:0,11:0,12:1,13:0,16:1,17:1,19:1,20:0,21:1,25:0};
type Scene = typeof events.scenes[number];

const Equation: React.FC<{formula:string; at:number}> = ({formula,at}) => {
  const frame=useCurrentFrame();
  const opacity=interpolate(frame,[at,at+22],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
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

const Presentation:React.FC<{scene:Scene}> = ({scene})=>{
  const frame=useCurrentFrame();
  const chapter=events.chapters[scene.chapter];
  const question=events.quizzes.find(q=>q.scene===scene.index);
  const enter=interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'});
  const progress=frame/(scene.duration_frames-1);
  const reveal=scene.kind==='reveal';
  const equation=scene.formulas[equationIndex[scene.index]];
  const equationAt=Math.round(scene.duration_frames*.58);
  const shell={position:'absolute' as const,left:66,right:66,top:277,height:652,borderRadius:20,background:palette.panel,border:`1px solid ${palette.line}`};
  return <AbsoluteFill style={{fontFamily:font,color:palette.ink}}>
    <header style={{position:'absolute',top:40,left:68,right:68,display:'flex',justifyContent:'space-between',fontSize:24,letterSpacing:3,color:palette.teal}}>
      <span>ELECTRODYNAMICS / FIELD LAB</span><span style={{color:palette.muted}}>CHAPTER {scene.chapter+1} / {events.chapters.length}</span>
    </header>
    <div style={{position:'absolute',left:66,right:66,top:102,opacity:enter}}>
      <div style={{fontSize:23,letterSpacing:3,color:palette.gold}}>{chapter.title.toUpperCase()}</div>
      <div style={{fontSize:63,lineHeight:1.04,fontWeight:700,marginTop:10}}>{scene.title}</div>
      <div style={{fontSize:30,color:palette.muted,marginTop:11}}>{scene.index===7?'Clockwise for increasing B. The arrows reverse when B decreases.':scene.focus}</div>
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
      <div style={{...shell,right:'auto',width:1164,overflow:'hidden'}}>
        <FieldMotion chapter={scene.chapter} step={scene.index%4} progress={progress} seconds={frame/events.fps}/>
      </div>
      <div style={{position:'absolute',left:1280,right:69,top:303,height:597,display:'flex',flexDirection:'column',justifyContent:'center'}}>
        <div style={{fontSize:24,letterSpacing:3,color:palette.teal}}>{reveal?'CHECK THE PREDICTION':'WATCH THE MODEL'}</div>
        <div style={{fontSize:40,lineHeight:1.22,margin:'24px 0'}}>{takeaways[scene.index]}</div>
        {equation&&frame>=equationAt&&<div style={{paddingTop:16,borderTop:'1px solid '+palette.line}}>
          <Equation formula={equation} at={equationAt}/>
        </div>}
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
    {cue&&<div style={{position:'absolute',left:130,right:130,bottom:80,font:`34px/1.3 ${font}`,color:'white',textAlign:'center',padding:18,background:'#071a24ed',borderRadius:10,whiteSpace:'pre-line'}}>{cue.text}</div>}
    <div style={{position:'absolute',bottom:0,height:5,width:`${100*frame/(events.duration_frames-1)}%`,background:palette.teal}}/>
  </AbsoluteFill>;
};

export const Thumbnail:React.FC = ()=> <AbsoluteFill style={{background:palette.paper,color:palette.ink,fontFamily:font}}>
  <svg width="520" height="500" viewBox="0 0 520 500" style={{position:'absolute',right:30,top:110}}>
    <rect x="93" y="118" width="330" height="18" rx="6" fill="#8cbcff"/>
    <rect x="93" y="338" width="330" height="18" rx="6" fill="#ff9ba0"/>
    <path d="M156 315V158m-13 16 13-16 13 16 M258 315V158m-13 16 13-16 13 16 M360 315V158m-13 16 13-16 13 16" fill="none" stroke={palette.gold} strokeWidth="8"/>
    <path d="M15 243H113m-24-19 24 19-24 19 M501 243H403m24-19-24 19 24 19" fill="none" stroke={palette.teal} strokeWidth="12"/>
    <text x="260" y="416" fill={palette.teal} fontSize="26" textAnchor="middle" letterSpacing="3">ENERGY ENTERS THE GAP</text>
  </svg>
  <div style={{position:'absolute',left:64,top:65,fontSize:26,color:palette.teal,letterSpacing:5}}>ELECTRODYNAMICS / FIELD LAB</div>
  <div style={{position:'absolute',left:59,top:171,maxWidth:692,fontSize:86,fontWeight:800,lineHeight:.99}}>CAN ENERGY<br/>CROSS A <span style={{color:palette.teal}}>GAP?</span></div>
  <div style={{position:'absolute',left:64,top:454,color:palette.muted,fontSize:36}}>Field animations from Maxwell to optics</div>
  <div style={{position:'absolute',bottom:56,left:64,right:64,borderTop:`1px solid ${palette.line}`,paddingTop:22,fontSize:26,letterSpacing:2,color:palette.gold}}>PREDICT • CALCULATE • TEST</div>
</AbsoluteFill>;
