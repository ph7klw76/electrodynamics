import React from 'react';
import data from './field-data.json';

const ink='#f6f7ed', muted='#b7d1d6', teal='#74e2d4', gold='#ffc679', blue='#8cbcff', rose='#ff9ba0', line='#466473';
type Point=[number,number];
const TAU=2*Math.PI;
const ramp=(p:number,start:number,end:number)=>Math.max(0,Math.min(1,(p-start)/(end-start)));

export function PlotText({x=35,y,children,color=ink,size=23,anchor='start'}:{x?:number;y:number;children:React.ReactNode;color?:string;size?:number;anchor?:'start'|'middle'|'end'}){
  return <text x={x} y={y} textAnchor={anchor} fill={color} fontSize={size}>{children}</text>;
}

export function Vector({from,to,color=teal,weight=4,opacity=1}:{from:Point;to:Point;color?:string;weight?:number;opacity?:number}){
  const [x,y]=to, dx=x-from[0],dy=y-from[1],distance=Math.hypot(dx,dy);
  if(distance<2)return null;
  const ux=dx/distance,uy=dy/distance,head=Math.min(13,distance*.44);
  const base:Point=[x-ux*head,y-uy*head],half=head*.49;
  return <g opacity={opacity}><line x1={from[0]} y1={from[1]} x2={base[0]} y2={base[1]} stroke={color} strokeWidth={weight} strokeLinecap="round"/>
    <polygon points={[[x,y],[base[0]-uy*half,base[1]+ux*half],[base[0]+uy*half,base[1]-ux*half]].map(p=>p.join(',')).join(' ')} fill={color}/></g>;
}

export function Curve({points,color=teal,width=4,dash}:{points:Point[];color?:string;width?:number;dash?:string}){
  return <polyline points={points.map(p=>p.map(n=>n.toFixed(2)).join(',')).join(' ')} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dash} strokeLinejoin="round" strokeLinecap="round"/>;
}

export function Continuity({step,progress,seconds}:{step:number;progress:number;seconds:number}){
  const taper=step!==0;
  const active=ramp(progress,.18,.78), volume=step===0?100-40*active:100;
  const inside=data.taper.map(s=>[132+632*s.z,248-107*s.radius] as Point);
  const bottom=data.taper.map(s=>[132+632*s.z,248+107*s.radius] as Point);
  const yAt=(x:number)=>taper?107*Math.exp(-(x-132)/632):82;
  return <>
    <PlotText y={42} color={muted}>{taper?'STEADY CONSTRICTION  /  INSULATING WALL':'CHARGE CONSERVATION  /  A FIXED CONTROL VOLUME'}</PlotText>
    {taper?<><Curve points={inside} color={blue}/><Curve points={bottom} color={blue}/></>
      :<rect x="132" y="166" width="632" height="164" rx="5" fill={blue} fillOpacity=".08" stroke={blue} strokeWidth="3"/>}
    <rect x="244" y="109" width="404" height="278" rx="12" stroke={muted} strokeWidth="2" strokeDasharray="8 6" fill={blue} fillOpacity=".055"/>
    <PlotText x={446} y={97} anchor="middle" color={muted} size={19}>Fixed volume with outward normals</PlotText>
    <Vector from={[244,128]} to={[192,128]} color={gold}/><Vector from={[648,128]} to={[700,128]} color={gold}/>
    {taper&&data.taper.filter((_,i)=>i%3===1).flatMap((s,i)=>[-1,0,1].map(side=>{
      const x=132+632*s.z,y=248+side*.65*107*s.radius;
      const growth=s.axial/data.taper.at(-1)!.axial;
      return <Vector key={i+','+side} from={[x,y]} to={[x+26+62*growth,y+side*s.radial*14]} color={blue} opacity={.58}/>;
    }))}
    {taper&&Array.from({length:10},(_,i)=>{
      const fraction=(i/10+seconds*.082)%1;
      const z=-Math.log(1-fraction*(1-Math.exp(-2)))/2;
      const x=133+630*z;
      return <circle key={i} cx={x} cy={248+((i%3)-1)*.43*yAt(x)} r="5.5" fill={teal}/>;
    })}
    <Vector from={[143,356]} to={[235,356]} color={teal} weight={6}/>
    <Vector from={[656,356]} to={[taper?748:779,356]} color={teal} weight={6}/>
    <PlotText x={143} y={412} color={teal}>{taper?'Inflow  1 unit':'Inflow  1 unit/s'}</PlotText>
    <PlotText x={555} y={412} color={teal}>{taper?'Outflow  1 unit':'Outflow  2 units/s'}</PlotText>
    <PlotText x={35} y={474} color={gold} size={22}>{taper?'The same current crosses both faces.':'Stored charge decreases because outflow exceeds inflow.'}</PlotText>
    <rect x="703" y="459" width="140" height="12" rx="6" fill={line}/>
    <rect x="703" y="459" width={1.4*volume} height="12" rx="6" fill={gold}/>
  </>;
}

export function InterfaceWaves({step,progress,seconds}:{step:number;progress:number;seconds:number}){
  const target=step===3, m=data.optics.interfaces[target?1:0];
  const magnetic=step===0 && progress>.49;
  const trackY=[160,254,348], color=[teal,rose,blue];
  const period=4.9, phase=TAU*(seconds/period);
  const profile=(kind:number,z:number)=>{
    const forward=kind!==1;
    const amplitude=[1,m.r,m.t][kind];
    const n=kind===2?m.right:m.left;
    return amplitude*(magnetic?n/m.left*(forward?1:-1):1)*Math.cos((forward?1:-1)*z*n*.031-phase);
  };
  return <>
    <PlotText y={42} color={muted}>{magnetic?'MAGNETIC WAVE   /   H NORMALIZED TO INCIDENT H':'ELECTRIC WAVE   /   E NORMALIZED TO INCIDENT E'}</PlotText>
    <rect x="462" y="92" width="390" height="280" fill={blue} opacity=".08"/>
    <line x1="462" y1="94" x2="462" y2="373" stroke={ink} strokeWidth="2.5" strokeDasharray="8 6"/>
    <PlotText x={435} y={86} anchor="end" color={muted}>{'n = '+m.left.toFixed(1)}</PlotText>
    <PlotText x={482} y={86} color={muted}>{'n = '+m.right.toFixed(1)}</PlotText>
    {trackY.map((y,i)=>{
      const forward=i!==1, right=i===2, x0=right?462:153,x1=right?838:462;
      const points=Array.from({length:61},(_,n)=>{const x=x0+(x1-x0)*n/60;return [x,y-35*profile(i,x-462)] as Point;});
      return <g key={i}>
        <line x1={x0} x2={x1} y1={y} y2={y} stroke={line} strokeDasharray="4 7"/>
        <Curve points={points} color={color[i]}/>
        <circle cx="462" cy={y-35*profile(i,0)} r="5.5" fill={color[i]}/>
        <PlotText x={36} y={y-28} color={color[i]} size={20}>{['Incident','Reflected','Transmitted'][i]}</PlotText>
        <Vector from={[forward?x1-82:x1-29,y+40]} to={[forward?x1-29:x1-82,y+40]} color={color[i]} weight={3}/>
      </g>;
    })}
    {step===0?
      <PlotText x={35} y={474} color={gold} size={21}>{magnetic?'At fixed E, a backward wave has the opposite H direction.':'The three waves share one frequency. The medium sets wavelength.'}</PlotText>
      :<><PlotText x={35} y={432} color={gold} size={20}>{'Electric-field ratios  r = '+m.r.toFixed(2)+'  ·  t = '+m.t.toFixed(2)}</PlotText>
        <rect x="35" y="448" width="800" height="11" rx="5" fill={blue}/>
        <rect x="35" y="448" width={800*m.R} height="11" rx="5" fill={rose}/>
        <PlotText x={35} y={493} color={rose} size={20}>{'Reflected power  '+(100*m.R).toFixed(0)+'%'}</PlotText>
        <PlotText x={835} y={493} color={blue} size={20} anchor="end">{'Transmitted power  '+(100*m.T).toFixed(0)+'%'}</PlotText></>}
  </>;
}

export function ThinFilm({step,progress,seconds}:{step:number;progress:number;seconds:number}){
  const f=data.optics.film;
  const sweep=step===3?ramp(progress,.09,.81):0;
  const nm=step===3?550-150*Math.sin(sweep*Math.PI/2):550;
  const p=f.points[Math.round((nm-400)/5)];
  const xLeft=339,xRight=562;
  const phase=seconds*TAU/5.2, k=.033*550/p.nm;
  const trace=(start:number,end:number,y:number,k:number,ref:number,re:number,im:number)=>
    Array.from({length:58},(_,i)=>{
      const x=start+(end-start)*i/57, angle=k*(x-ref)-phase;
      return [x,y-24*(re*Math.cos(angle)-im*Math.sin(angle))] as Point;
    });
  const origin:Point=[218,365], scale=1050;
  const tip:Point=[origin[0]+f.front*scale,origin[1]];
  const total:Point=[tip[0]+p.return_x*scale,tip[1]-p.return_y*scale];
  const fx=(lambda:number)=>530+(lambda-400);
  const fy=(R:number)=>426-2900*R;
  return <>
    <PlotText y={38} color={muted}>AIR → THIN FILM → GLASS  /  NORMAL INCIDENCE</PlotText>
    <rect x={xLeft} y="62" width={xRight-xLeft} height="154" fill={gold} opacity=".13"/>
    <rect x={xRight} y="62" width="293" height="154" fill={blue} opacity=".10"/>
    <path d={'M'+xLeft+' 62V216 M'+xRight+' 62V216'} stroke={muted} strokeWidth="2"/>
    <PlotText x={41} y={91} color={muted} size={20}>Air</PlotText>
    <PlotText x={450} y={91} color={gold} size={20} anchor="middle">{'Film  '+f.thickness_nm.toFixed(1)+' nm'}</PlotText>
    <PlotText x={588} y={91} color={blue} size={20}>Glass</PlotText>
    <Curve points={trace(40,xLeft,129,k,xLeft,1,0)} color={teal}/>
    <Curve points={trace(40,xLeft,185,-k,xLeft,p.rx,p.ry)} color={rose}/>
    <Curve points={trace(xRight,847,129,1.5*k,xRight,p.tx,p.ty)} color={blue}/>
    <Vector from={[xLeft+24,137]} to={[xRight-25,137]} color={gold} weight={3}/>
    <Vector from={[xRight-25,179]} to={[xLeft+24,179]} color={gold} weight={3}/>
    <PlotText x={450} y={208} anchor="middle" color={muted} size={17}>round trip inside the film</PlotText>
    <PlotText x={35} y={268} color={muted} size={19}>REFLECTED AMPLITUDES</PlotText>
    <line x1="64" x2="410" y1={origin[1]} y2={origin[1]} stroke={line} strokeDasharray="5 6"/>
    <Vector from={[origin[0],origin[1]-12]} to={[tip[0],tip[1]-12]} color={gold} weight={5}/>
    <g opacity={ramp(progress,.21,.48)}>
      <line x1={tip[0]} x2={tip[0]} y1={tip[1]-12} y2={tip[1]+12} stroke={muted} strokeDasharray="4 5"/>
      <Vector from={[tip[0],tip[1]+12]} to={[total[0],total[1]+12]} color={blue} weight={5}/>
      <Vector from={origin} to={total} color={rose} weight={5}/>
      <circle cx={origin[0]} cy={origin[1]} r="5" fill={ink}/>
      <PlotText x={35} y={430} color={gold} size={18}>Gold = first reflection</PlotText>
      <PlotText x={35} y={459} color={blue} size={18}>Blue = sum of returns from the film</PlotText>
      <PlotText x={35} y={488} color={rose} size={18}>Pink = net reflected field</PlotText></g>
    <PlotText x={530} y={267} color={rose} size={19}>REFLECTANCE</PlotText>
    <line x1={fx(400)} x2={fx(700)} y1={fy(0)} y2={fy(0)} stroke={line} strokeWidth="2"/>
    <line x1={fx(400)} x2={fx(700)} y1={fy(f.bare_R)} y2={fy(f.bare_R)} stroke={muted} strokeDasharray="6 7"/>
    <PlotText x={830} y={fy(f.bare_R)-8} anchor="end" color={muted} size={17}>Bare glass 4%</PlotText>
    {step===3&&<Curve points={f.points.map(s=>[fx(s.nm),fy(s.R)])} color={teal}/>}
    <circle cx={fx(p.nm)} cy={fy(p.R)} r="6.5" fill={rose}/>
    <PlotText x={530} y={459} color={muted} size={18}>400</PlotText>
    <PlotText x={680} y={459} anchor="middle" color={muted} size={18}>550</PlotText>
    <PlotText x={830} y={459} anchor="end" color={muted} size={18}>700 nm</PlotText>
    <PlotText x={830} y={493} anchor="end" color={rose} size={20}>{p.nm+' nm  ·  '+(p.R*100).toFixed(2)+'% reflected'}</PlotText>
  </>;
}
