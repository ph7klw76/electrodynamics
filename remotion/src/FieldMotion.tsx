import React from 'react';
import data from './field-data.json';
import {PlotText as Text, Vector as Arrow, Curve as Trace, Continuity, InterfaceWaves, ThinFilm} from './Propagation';

const ink='#f6f7ed', muted='#b7d1d6', teal='#74e2d4', gold='#ffc679', blue='#8cbcff', rose='#ff9ba0', line='#466473';
const panel='#102a36';
type Point=[number,number];
type DiagramProps={step:number; progress:number; seconds:number};
const TAU=2*Math.PI;
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const ramp=(p:number,start:number,end:number)=>Math.max(0,Math.min(1,(p-start)/(end-start)));
const smooth=(p:number)=>p*p*(3-2*p);
const polar=(center:Point,r:number,theta:number):Point=>[center[0]+r*Math.cos(theta),center[1]-r*Math.sin(theta)];
const lerpPoint=(a:Point,b:Point,t:number):Point=>[mix(a[0],b[0],t),mix(a[1],b[1],t)];

function PlateDiagram({power=false,progress,step}:{power?:boolean;progress:number;step:number}){
  const charged=power || step===3;
  const level=ramp(progress,.10,.83);
  const sample=data.charging[Math.round(level*(data.charging.length-1))];
  const shape=smooth(ramp(progress,step===0?.23:.12,step===0?.54:.45));
  const crossing=step===3?1:shape;
  const loopY=387;
  // Meridian of a surface of revolution. Its endpoints stay on the same loop;
  // it bulges under and around the lower plate before entering the gap.
  const flat:Point[]=[[371,loopY],[398,loopY],[427,loopY],[450,loopY],[473,loopY],[502,loopY],[529,loopY]];
  const gap:Point[]=[[371,loopY],[215,347],[213,249],[450,230],[687,249],[685,347],[529,loopY]];

  const field=power?ramp(progress,.18,.33):charged?ramp(progress,.14,.4):ramp(progress,.06,.24)*.58;
  const flux=power?ramp(progress,step===0?.47:.28,step===0?.66:.52):0;
  const chargeDots=[287,330,373,416,459,502,545,588];
  const inwardLength=84*sample.inward_mw/20;
  return <>
    <Text y={42} color={muted}>{power?'SIDE VIEW  /  QUASISTATIC VACUUM GAP':'SIDE VIEW  /  AMPERIAN LOOP ON THE LOWER LEAD'}</Text>
    <path d="M450 83 V150 M450 310 V451" stroke={muted} strokeWidth="11" fill="none"/>
    <rect x="260" y="150" width="380" height="17" rx="4" fill={blue}/>
    <rect x="260" y="293" width="380" height="17" rx="4" fill={rose}/>
    <Text x={654} y={168} color={blue} size={29}>−</Text><Text x={654} y={308} color={rose} size={29}>+</Text>
    <g opacity={field}>
      <rect x="261" y="168" width="378" height="124" fill={gold} opacity={sample.field_kv_m/125}/>
      {[308,379,450,521,592].map(x=><Arrow key={x} from={[x,277]} to={[x,277-(charged?33+sample.field_kv_m*6:61)]} color={gold}/>)}
      <Text x={280} y={199} color={gold}>E</Text>
    </g>
    {charged&&chargeDots.map((x,i)=><g key={x} opacity={Math.max(.16,ramp(level,(i-1)/8,(i+1)/8))}>
      <Text x={x} y={146} color={blue} anchor="middle" size={18}>−</Text>
      <Text x={x} y={329} color={rose} anchor="middle" size={18}>+</Text>
    </g>)}
    {!power&&<>
      <g opacity={1-crossing}><Trace points={flat} color={blue} dash="7 5"/></g><g opacity={crossing}><Trace points={gap} color={blue} dash="7 5"/></g>
      <ellipse cx="450" cy={loopY} rx="79" ry="21" fill="none" stroke={teal} strokeWidth="3"/>
      <Arrow from={[495,405]} to={[514,399]} color={teal}/>
      <Text x={548} y={405} color={teal}>same loop</Text>
      <Arrow from={[450,439]} to={[450,334]} color={rose} weight={6}/>
      <Text x={405} y={446} color={rose} anchor="end">lead current</Text>
      {!charged&&<Text x={35} y={478} color={blue}>{crossing<.1?'Flat surface cuts the lead':crossing>.9?'Bulging surface passes through the gap':'Switch the chosen surface. Its edge stays fixed.'}</Text>}
      {charged&&<Text x={35} y={478} color={teal}>{'Displacement current  '+sample.displacement_ma.toFixed(1)+' mA   ·   Plate charge  '+sample.charge_nc.toFixed(2)+' nC'}</Text>}
    </>}
    {power&&<>
      <g opacity={ramp(progress,.26,.48)}>
        <Text x={269} y={266} color={blue} size={24}>⊙</Text><Text x={607} y={266} color={blue} size={24}>⊗</Text>
        <Text x={656} y={274} color={blue} size={18}>B into page</Text>
      </g>
      <g opacity={flux}>
        <Arrow from={[256-inwardLength,222]} to={[256,222]} color={teal} weight={7}/>
        <Arrow from={[644+inwardLength,222]} to={[644,222]} color={teal} weight={7}/>
        <Text x={664} y={190} color={teal}>energy in</Text>
      </g>
      <Text x={82} y={403} color={gold}>{'Electric energy  '+sample.stored_nj.toFixed(2)+' nJ'}</Text>
      <rect x="82" y="419" width="350" height="13" rx="6" fill={line}/>
      <rect x="82" y="419" width={350*sample.stored_nj/data.charging.at(-1)!.stored_nj} height="13" rx="6" fill={gold}/>
      <Text x={478} y={403} color={teal}>{'Inward power  '+sample.inward_mw.toFixed(1)+' mW'}</Text>
      <Text x={478} y={431} color={muted} size={18}>{'I = 2.0 mA  ·  V = '+sample.voltage.toFixed(1)+' V'}</Text>
      <Text x={82} y={484} color={muted} size={18}>Field and energy arrows are scaled for visibility.</Text>
    </>}
  </>;
}

function Solenoid({step,progress}:{step:number;progress:number}){
  const center:Point=[285,248], scale=720, a=data.induction.radius*scale;
  const driver=ramp(progress,.13,.85);
  const reversal=step===3;
  // With t = 0.10 s · driver, dB/dt = 2 cos(π · driver).
  const rate=data.induction.rate*(reversal?Math.cos(Math.PI*driver):1);
  const B=reversal?.08+.2/Math.PI*Math.sin(Math.PI*driver):.025+.2*driver;
  const diskRadius=step===1?mix(.015,.24,ramp(progress,.10,.85)):.205;
  const filledRadius=Math.min(a,diskRadius*scale);
  const fill=Math.min(1,(diskRadius/data.induction.radius)**2);
  return <>
    <Text y={42} color={muted}>SOLENOID END VIEW  /  +z TOWARD YOU</Text>
    <circle cx={center[0]} cy={center[1]} r={diskRadius*scale} fill={blue} fillOpacity=".05" stroke={blue} strokeWidth="2" strokeDasharray="6 7"/>
    <circle cx={center[0]} cy={center[1]} r={a} fill={gold} fillOpacity={.12+B*.9} stroke={gold} strokeWidth="2.5"/>
    <circle cx={center[0]} cy={center[1]} r={filledRadius} fill={gold} fillOpacity=".22"/>
    {[[0,0],[-31,0],[31,0],[0,-31],[0,31]].map(([x,y])=><g key={x+','+y} opacity={.45+B*2}>
      <circle cx={center[0]+x} cy={center[1]+y} r="9" fill="none" stroke={gold} strokeWidth="2"/>
      <circle cx={center[0]+x} cy={center[1]+y} r="2.8" fill={gold}/>
    </g>)}
    {data.induction.radii.flatMap((radius,i)=>[.35,1.92,3.49,5.06].map(angle=>{
      const base=polar(center,radius*scale,angle);
      const signed=data.induction.response[i]*(rate/data.induction.rate)*560;
      return <Arrow key={i+','+angle} from={base} to={[base[0]-Math.sin(angle)*signed,base[1]-Math.cos(angle)*signed]} color={teal} opacity={ramp(progress,.05,.17)} weight={3.7}/>;
    }))}
    <Text x={530} y={137} color={gold} size={27}>{'B inside  '+B.toFixed(2)+' T'}</Text>
    <Text x={530} y={181} color={muted}>B outside ≈ 0</Text>
    <Text x={530} y={237} color={gold}>{'dB/dt  '+(rate>=0?'+':'')+rate.toFixed(2)+' T/s'}</Text>
    {step===1?<><Text x={530} y={300} color={blue}>{'Loop radius  '+(diskRadius*100).toFixed(1)+' cm'}</Text>
      <Text x={530} y={351} color={gold}>{'Flux area  '+(fill*100).toFixed(0)+'% of coil area'}</Text>
      <rect x="530" y="370" width="280" height="12" rx="6" fill={line}/><rect x="530" y="370" width={280*fill} height="12" rx="6" fill={gold}/></>
      :<><Text x={530} y={300} color={teal}>{Math.abs(rate)<.12?'E nearly zero':rate>0?'E circulates clockwise':'E circulates counterclockwise'}</Text>
        <Text x={530} y={350} color={muted} size={18}>{reversal?'B stays positive as its slope changes sign.':'Teal arrows show the induced E field.'}</Text></>}
    <Text x={35} y={484} color={muted} size={18}>Ideal long coil · the model time is slowed · arrow lengths share one E scale</Text>
  </>;
}

function StokesTiles({progress}:{progress:number}){
  const fade=1-ramp(progress,.35,.60);
  const boundary:Point[]=[[210,393],[620,393],[620,123],[210,123],[210,393]];
  const travel=ramp(progress,.60,.94)*4, side=Math.min(3,Math.floor(travel));
  return <>
    <Text y={42} color={muted}>STOKES’ THEOREM  /  SUM ORIENTED CELL EDGES</Text>
    {[0,1].flatMap(j=>[0,1].map(i=>{
      const x=210+i*205,y=123+j*135;
      return <g key={i+','+j}><rect x={x} y={y} width="205" height="135" fill={i===j?blue:teal} fillOpacity=".10" stroke={line}/>
        <g opacity={fade}><Arrow from={[x+153,y+14]} to={[x+60,y+14]} color={gold}/><Arrow from={[x+14,y+37]} to={[x+14,y+98]} color={gold}/><Arrow from={[x+51,y+121]} to={[x+144,y+121]} color={gold}/><Arrow from={[x+191,y+98]} to={[x+191,y+37]} color={gold}/></g>
      </g>;
    }))}
    <g opacity={ramp(progress,.43,.69)}><Trace points={boundary} color={teal} width={6}/>
      {boundary.slice(0,4).map((point,i)=><Arrow key={i} from={lerpPoint(point,boundary[i+1],.41)} to={lerpPoint(point,boundary[i+1],.59)} color={teal} weight={6}/>)}
      <circle cx={lerpPoint(boundary[side],boundary[side+1],travel-side)[0]} cy={lerpPoint(boundary[side],boundary[side+1],travel-side)[1]} r="7" fill={ink}/>
    </g>
    <Text x={450} y={467} anchor="middle" color={fade>.5?gold:teal} size={26}>{fade>.5?'Adjacent cells traverse shared edges in opposite directions.':'The interior cancels. The exterior boundary remains.'}</Text>
  </>;
}

function ExteriorLoop({step,progress}:{step:number;progress:number}){
  const center:Point=[237,247], scale=1300, source=data.induction.loop;
  const offset:Point=[center[0]+source.center*scale,center[1]], radius=source.radius*scale;
  const n=source.projection.length-1;
  const scan=ramp(progress,.13,.56);
  const count=Math.round(scan*n);
  const orientation=step===3 && progress>.80?-1:1;
  const index=(i:number)=>orientation===1?i:n-i;
  const point=(i:number)=>polar(offset,radius,index(i)/n*TAU);
  const integral=orientation===1?source.integral_mv[count]:source.integral_mv[n-count]-source.integral_mv[n];
  return <>
    <Text y={42} color={muted}>EXTERIOR DISK  /  FIELD ALONG A SMALL OFFSET LOOP</Text>
    <circle cx={center[0]} cy={center[1]} r={data.induction.radius*scale} stroke={gold} strokeWidth="2" fill={gold} fillOpacity=".14"/>
    <Text x={center[0]} y={center[1]-6} anchor="middle" color={gold}>Coil interior</Text>
    <Text x={center[0]} y={center[1]+28} anchor="middle" color={muted} size={18}>changing B</Text>
    <circle cx={offset[0]} cy={offset[1]} r={radius} fill={blue} fillOpacity=".13" stroke={blue} strokeWidth="2"/>
    {Array.from({length:count},(_,i)=>{const a=point(i), b=point(i+1);
      return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={source.projection[index(i)]*orientation>=0?teal:rose} strokeWidth="6"/>;
    })}
    <circle cx={point(count)[0]} cy={point(count)[1]} r="6" fill={ink}/>
    {[0,1,2,3,4,5,6,7].map(i=>{
      const at=polar(offset,radius+20,i*TAU/8);
      const dx=at[0]-center[0],dy=at[1]-center[1],length=Math.hypot(dx,dy);
      return <Arrow key={i} from={at} to={[at[0]-dy/length*29,at[1]+dx/length*29]} color={gold} weight={2.4}/>;
    })}
    <Text x={605} y={145} color={blue} size={21}>Small loop entirely outside</Text>
    <Text x={605} y={192} color={gold} size={20}>Local E is nonzero.</Text>
    <Text x={605} y={238} color={teal} size={20}>Positive contribution</Text>
    <Text x={605} y={272} color={rose} size={20}>Negative contribution</Text>
    <Text x={605} y={323} color={ink} size={19}>{count===n?'Closed-loop integral':'Running integral'}</Text>
    <Text x={605} y={358} color={ink} size={28}>{(Math.abs(integral)<.005?'0.00':integral.toFixed(2))+' mV'}</Text>
    <Text x={605} y={391} color={muted} size={18}>{orientation===1?'Counterclockwise · +z normal':'Clockwise · −z normal'}</Text>
    <Text x={35} y={484} color={muted} size={18}>Coloured arcs mark the sign of E · dℓ along the path.</Text>
  </>;
}

export function FieldMotion({chapter,step,progress,seconds}:DiagramProps & {chapter:number}){
  const diagrams=[
    <PlateDiagram progress={progress} step={step}/>,
    <Solenoid progress={progress} step={step}/>,
    step===0?<StokesTiles progress={progress}/>:<ExteriorLoop progress={progress} step={step}/>,
    <Continuity progress={progress} seconds={seconds} step={step}/>,
    <PlateDiagram progress={progress} step={step} power/>,
    <InterfaceWaves progress={progress} seconds={seconds} step={step}/>,
    <ThinFilm progress={progress} seconds={seconds} step={step}/>,
  ];
  return <svg width="100%" height="100%" viewBox="0 0 900 520" style={{background:panel}} aria-hidden="true">
    {diagrams[chapter]}
  </svg>;
}
