"use client";
import { useEffect, useRef, useState } from "react";

const SEGMENTS = 12;
const SEGMENT_ANGLE = 360 / SEGMENTS;
const POINTER_OFFSET_DEG = 15; // centre du segment sous le pointeur

const QUESTS = [
  "Check-in quotidien",
  "Like 3 casts",
  "Recast 1 post",
  "Suivre 2 comptes",
  "Poster 1 cast",
  "Répondre à 1 cast",
  "Visiter miniapp partenaire",
  "Claim du jour",
  "Lire 1 thread",
  "Partager un lien",
  "Inviter 1 ami",
  "Bonus mystère"
];

const COLORS = [
  "#ef4444","#f59e0b","#3b82f6","#fbbf24",
  "#22c55e","#a78bfa","#f97316","#93c5fd",
  "#10b981","#60a5fa","#fde68a","#94a3b8"
];

function conicFromColors(cols: string[]) {
  const step = 360 / cols.length;
  return `conic-gradient(${cols.map((c,i)=>`${c} ${i*step}deg ${(i+1)*step}deg`).join(",")})`;
}
function now(){return Date.now();}
function keyFor(fid:string){return `dw:lastSpin:${fid}`;}
function getLastSpin(fid:string){try{const v=localStorage.getItem(keyFor(fid));return v?parseInt(v,10):0;}catch{return 0;}}
function setLastSpin(fid:string,t:number){try{localStorage.setItem(keyFor(fid),String(t));}catch{}}
function secsLeft(fid:string){const last=getLastSpin(fid);const ttl=24*3600*1000;return Math.max(0,Math.ceil((ttl-(now()-last))/1000));}
function fmtHMS(total:number){const h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;}

const LABELS = Array.from({length: SEGMENTS}, (_,i)=> QUESTS[i] ?? `Quête ${i+1}`);

export default function WheelPage(){
  const [fid,setFid]=useState("");
  const [angle,setAngle]=useState(0);
  const [spinning,setSpinning]=useState(false);
  const [result,setResult]=useState<string|null>(null);
  const [cooldown,setCooldown]=useState(0);
  const target=useRef(0);

  useEffect(()=>{const tick=()=>setCooldown(fid?secsLeft(fid):0);tick();const id=setInterval(tick,1000);return()=>clearInterval(id);},[fid]);

  function canSpin(){
    if(!fid.trim()) return {ok:false,reason:"Entre ton FID Farcaster"};
    if(cooldown>0) return {ok:false,reason:`Prochain spin dans ${fmtHMS(cooldown)}`};
    return {ok:true,reason:""};
  }

  function spin(){
    const gate=canSpin();
    if(!gate.ok||spinning) return;
    setResult(null);
    const tours=6*360;
    const rand=Math.floor(Math.random()*360);
    target.current=angle+tours+rand;
    setSpinning(true);
    setAngle(target.current);
  }

  function onEnd(){
    const a=((target.current%360)+360)%360;
    const normalized=(360-a+POINTER_OFFSET_DEG)%360;
    const index=Math.floor(normalized/SEGMENT_ANGLE)%SEGMENTS;
    setResult(LABELS[index]);
    setSpinning(false);
    if(fid.trim()){setLastSpin(fid.trim(),now());setCooldown(secsLeft(fid.trim()));}
  }

  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl md:text-4xl font-semibold text-center mb-6">DailyWheel</h1>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <input
            value={fid}
            onChange={(e)=>setFid(e.target.value.replace(/[^0-9]/g,""))}
            placeholder="FID (ex: 1234)"
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 outline-none"
            inputMode="numeric"
          />
          <button
            onClick={spin}
            disabled={spinning || !canSpin().ok}
            className="px-6 py-3 rounded-xl bg-white text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow"
            title={!canSpin().ok ? canSpin().reason : "Lancer la roue"}
          >
            {spinning ? "Spinning..." : "Spin"}
          </button>
          {result && (
            <div className="text-sm md:text-base bg-white/10 px-3 py-2 rounded-lg border border-white/10">
              Quête gagnée : <span className="font-semibold">{result}</span>
            </div>
          )}
        </div>

        <div className="text-center text-white/60 text-sm mb-4">
          {fid ? (cooldown>0 ? `Prochain spin dans ${fmtHMS(cooldown)}` : "Tu peux spinner") : "Entre un FID pour spinner"}
        </div>

        {/* Zone roue */}
        <div className="relative w-full max-w-[560px] mx-auto aspect-square">
          {/* Pointeur au-dessus */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-40">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M28 8L38 28H18L28 8Z" fill="#2563eb" stroke="#0b1220" strokeWidth="4"/>
            </svg>
          </div>

          {/* Bord + ombre */}
          <div className="absolute inset-0 rounded-full ring-8 ring-[#0f172a]/60 z-10" />
          <div className="absolute inset-0 rounded-full shadow-[inset_0_20px_60px_rgba(0,0,0,0.35)] z-20 pointer-events-none" />
          <div className="absolute inset-0 grid place-items-center z-30 pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-[#0f172a] ring-8 ring-zinc-200/80 shadow-xl" />
          </div>

          {/* Roue qui tourne (segments + labels radiaux) */}
          <div
            className="absolute inset-0 rounded-full overflow-hidden z-0"
            style={{
              transform:`rotate(${angle}deg)`,
              transition:spinning?"transform 4.2s cubic-bezier(0.16,1,0.3,1)":"none",
              willChange:"transform"
            }}
            onTransitionEnd={onEnd}
          >
            {/* Segments */}
            <div className="absolute inset-0" style={{background:conicFromColors(COLORS)}} />
            <div className="absolute inset-0" style={{background:"repeating-conic-gradient(from 0deg, rgba(0,0,0,.22) 0deg 0.6deg, transparent 0.6deg 30deg)"}} />

            {/* Labels radiaux (dans le conteneur qui TOURNE) */}
            <div className="absolute inset-0 z-20 pointer-events-none">
              {LABELS.map((txt,i)=>{
                const mid=i*SEGMENT_ANGLE+SEGMENT_ANGLE/2;
                return (
                  <div
                    key={i}
                    className="absolute top-1/2 left-1/2 text-white font-semibold drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]"
                    style={{
                      transform:`rotate(${mid}deg) translate(0,-40%)`,
                      transformOrigin:"0 0",
                      width:"0",
                      writingMode:"vertical-rl" as any,
                      textOrientation:"upright" as any,
                      fontSize:"12px",
                      lineHeight: "1.1",
                      letterSpacing: "1px",
                      textAlign:"center"
                    }}
                    title={txt}
                  >
                    {txt}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
