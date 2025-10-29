"use client";
import { useEffect, useMemo, useRef, useState } from "react";

/* Settings */
const SEGMENTS = 12;
const A = 360 / SEGMENTS;
const POINTER_OFFSET_DEG = 0;      // fine tune if needed (-1, 0, 1)

const CX = 500, CY = 500;
const R_OUT = 470;
const R_IN  = 140;

/* Radial text (outer -> inner) */
const R_LABEL_OUT = R_OUT - 26;
const R_LABEL_IN  = R_IN  + 24;
const FONT_SIZE   = 26;
const STROKE_W    = 6;

/* Quests in EN (shortened) */
const QUESTS = [
  "Daily check-in",
  "Like 3 casts",
  "Recast 1 post",
  "Follow 2 accts",
  "Post 1 cast",
  "Reply to 1 cast",
  "Visit partner app",
  "Daily claim",
  "Read 1 thread",
  "Share a link",
  "Invite a friend",
  "Mystery bonus"
];
const COLORS = [
  "#ef4444","#f59e0b","#3b82f6","#fbbf24",
  "#22c55e","#a78bfa","#f97316","#93c5fd",
  "#10b981","#60a5fa","#fde68a","#94a3b8"
];

/* Geometry utils (stable rounding) */
const r=(n:number)=>Number(n.toFixed(3));
const d2r=(d:number)=>(Math.PI/180)*d;
function P(deg:number, RR:number){ const a=d2r(deg-90); return {x:r(CX+RR*Math.cos(a)), y:r(CY+RR*Math.sin(a))}; }
function arcPath(RR:number,a0:number,a1:number){ const p0=P(a0,RR),p1=P(a1,RR); const large=((a1-a0+360)%360)>180?1:0; return `M ${p0.x} ${p0.y} A ${RR} ${RR} 0 ${large} 1 ${p1.x} ${p1.y}`; }
function wedgePath(Ro:number,Ri:number,a0:number,a1:number){
  const o0=P(a0,Ro),o1=P(a1,Ro),i1=P(a1,Ri),i0=P(a0,Ri);
  const large=((a1-a0+360)%360)>180?1:0;
  return `M ${o0.x} ${o0.y} A ${Ro} ${Ro} 0 ${large} 1 ${o1.x} ${o1.y} L ${i1.x} ${i1.y} A ${Ri} ${Ri} 0 ${large} 0 ${i0.x} ${i0.y} Z`;
}

/* Easing */
function easeOutCubic(t:number){ return 1 - Math.pow(1 - t, 3); }

export default function WheelPage(){
  const [fid,setFid]=useState("");
  const [angle,setAngle]=useState(0);           // current angle (deg)
  const [spinning,setSpinning]=useState(false);
  const [result,setResult]=useState<string|null>(null);
  const [cooldown,setCooldown]=useState(0);

  // animation refs
  const animRef = useRef<number|undefined>(undefined);
  const startRef = useRef(0);
  const fromRef = useRef(0);
  const toRef = useRef(0);
  const durRef = useRef(4200);                  // ms

  /* 1 spin / 24h / FID */
  useEffect(()=>{const t=()=>{if(!fid)return setCooldown(0);const last=+(localStorage.getItem(`dw:lastSpin:${fid}`)||0);const left=Math.max(0,24*3600*1000-(Date.now()-last));setCooldown(Math.ceil(left/1000));};t();const id=setInterval(t,1000);return()=>clearInterval(id);},[fid]);

  const segments = useMemo(()=>Array.from({length:SEGMENTS},(_,i)=>({
    i,a0:i*A,a1:(i+1)*A,mid:i*A+A/2,color:COLORS[i%COLORS.length],label:QUESTS[i]??`Quest ${i+1}`
  })),[]);

  function fmtHMS(t:number){const h=Math.floor(t/3600),m=Math.floor((t%3600)/60),s=t%60;return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;}
  function canSpin(){ if(!fid.trim())return{ok:false,reason:"Enter a FID to spin"}; if(cooldown>0)return{ok:false,reason:`Next spin in ${fmtHMS(cooldown)}`}; return{ok:true,reason:""}; }

  /* Animation with requestAnimationFrame (exact center rotation) */
  function rafStep(ts:number){
    if(!startRef.current) startRef.current = ts;
    const t = Math.min(1, (ts - startRef.current) / durRef.current);
    const eased = easeOutCubic(t);
    const ang = fromRef.current + (toRef.current - fromRef.current) * eased;
    setAngle(ang);
    if(t < 1){
      animRef.current = requestAnimationFrame(rafStep);
    }else{
      const a=((toRef.current%360)+360)%360;
      const normalized=(360 - a + POINTER_OFFSET_DEG) % 360; // 0° = top
      const idx=Math.round(normalized / A) % SEGMENTS;       // choose nearest segment center
      setResult(segments[idx].label);
      setSpinning(false);
      if(fid.trim()){
        localStorage.setItem(`dw:lastSpin:${fid}`,String(Date.now()));
        setCooldown(24*3600);
      }
    }
  }

  function spin(){
    const g=canSpin();
    if(!g.ok || spinning) return;
    setResult(null);
    const tours = 6*360;
    const rand  = Math.floor(Math.random()*360);
    fromRef.current = angle;
    toRef.current   = angle + tours + rand;
    startRef.current = 0;
    setSpinning(true);
    cancelAnimationFrame(animRef.current!);
    animRef.current = requestAnimationFrame(rafStep);
  }

  useEffect(()=>()=>cancelAnimationFrame(animRef.current!),[]);

  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl md:text-4xl font-semibold text-center mb-6">DailyWheel</h1>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <input value={fid} onChange={(e)=>setFid(e.target.value.replace(/[^0-9]/g,""))} placeholder="FID (e.g., 1234)" className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 outline-none" inputMode="numeric"/>
          <button onClick={spin} disabled={spinning||!canSpin().ok} className="px-6 py-3 rounded-xl bg-white text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow" title={!canSpin().ok?canSpin().reason:"Spin the wheel"}>{spinning?"Spinning...":"Spin"}</button>
          {result && <div className="text-sm md:text-base bg-white/10 px-3 py-2 rounded-lg border border-white/10">Won quest : <span className="font-semibold">{result}</span></div>}
        </div>

        <div className="text-center text-white/60 text-sm mb-4">
          {fid? (cooldown>0?`Next spin in ${fmtHMS(cooldown)}`:"You can spin") : "Enter a FID to spin"}
        </div>

        <div className="relative w-full max-w-[560px] mx-auto">
          {/* Blue pointer aiming to center */}
          <div className="absolute -top-[6px] left-1/2 -translate-x-1/2 z-40">
            <svg width="64" height="40" viewBox="0 0 64 40" xmlns="http://www.w3.org/2000/svg">
              <path d="M32 36 L50 8 H14 Z" fill="#2563eb" stroke="#0b1220" strokeWidth="6" strokeLinejoin="round"/>
            </svg>
          </div>

          <svg viewBox="0 0 1000 1000" className="w-full h-auto block">
            {/* All visuals rotate around (CX,CY) */}
            <g transform={`rotate(${angle} ${CX} ${CY})`}>
              <circle cx={CX} cy={CY} r={R_OUT} fill="#0f172a" opacity="0.25"/>

              {segments.map(s=> <path key={`w-${s.i}`} d={wedgePath(R_OUT,R_IN,s.a0,s.a1)} fill={s.color}/>)}
              {segments.map(s=> <path key={`sep-${s.i}`} d={arcPath(R_OUT,s.a0,s.a1)} stroke="rgba(0,0,0,0.18)" strokeWidth="2" fill="none"/>)}

              <defs>
                {segments.map(s=>{
                  const pOut=P(s.mid,R_LABEL_OUT), pIn=P(s.mid,R_LABEL_IN);
                  return <path id={`rad-${s.i}`} key={`rad-${s.i}`} d={`M ${pOut.x} ${pOut.y} L ${pIn.x} ${pIn.y}`} />;
                })}
              </defs>

              {segments.map(s=>(
                <g key={`txt-${s.i}`}>
                  <text fontSize={FONT_SIZE} fontWeight={900} fill="#000" opacity="0.65" textAnchor="middle" style={{paintOrder:"stroke",stroke:"#000",strokeWidth:STROKE_W}}>
                    <textPath href={`#rad-${s.i}`} startOffset="50%" method="align" spacing="auto">{s.label}</textPath>
                  </text>
                  <text fontSize={FONT_SIZE} fontWeight={900} fill="#fff" textAnchor="middle">
                    <textPath href={`#rad-${s.i}`} startOffset="50%" method="align" spacing="auto">{s.label}</textPath>
                  </text>
                </g>
              ))}
            </g>

            {/* Top rings */}
            <circle cx={CX} cy={CY} r={R_OUT} fill="none" stroke="#0f172a" strokeWidth="16" opacity="0.6"/>
            <circle cx={CX} cy={CY} r={R_IN} fill="#0b1220" stroke="#e5e7eb" strokeWidth="16"/>
          </svg>
        </div>
      </div>
    </main>
  );
}
