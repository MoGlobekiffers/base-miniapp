"use client";
import { useEffect, useMemo, useRef, useState } from "react";

/** Réglages */
const SEGMENTS = 12;
const A = 360 / SEGMENTS;
const POINTER_OFFSET_DEG = 15;              // centre du segment sous le pointeur
const CX = 500, CY = 500;
const R_OUT = 470;                           // bord extérieur
const R_IN  = 140;                           // moyeu
const R_TEXT = 365;                          // rayon du texte (proche du bord)
const FONT_SIZE = 26;                        // taille du texte sur l’arc

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

/** Utils géométrie (arrondis stables => pas d’erreur d’hydratation) */
const r = (n:number) => Number(n.toFixed(3));
const d2r = (d:number) => (Math.PI/180)*d;
function P(deg:number, RR:number){
  const a = d2r(deg - 90);
  return { x: r(CX + RR*Math.cos(a)), y: r(CY + RR*Math.sin(a)) };
}
function arcPath(RR:number, a0:number, a1:number){
  const p0 = P(a0, RR), p1 = P(a1, RR);
  const large = ((a1 - a0 + 360) % 360) > 180 ? 1 : 0;
  return `M ${p0.x} ${p0.y} A ${RR} ${RR} 0 ${large} 1 ${p1.x} ${p1.y}`;
}
function wedgePath(Ro:number, Ri:number, a0:number, a1:number){
  const o0 = P(a0, Ro), o1 = P(a1, Ro);
  const i1 = P(a1, Ri), i0 = P(a0, Ri);
  const large = ((a1 - a0 + 360) % 360) > 180 ? 1 : 0;
  return `M ${o0.x} ${o0.y} A ${Ro} ${Ro} 0 ${large} 1 ${o1.x} ${o1.y} L ${i1.x} ${i1.y} A ${Ri} ${Ri} 0 ${large} 0 ${i0.x} ${i0.y} Z`;
}

export default function WheelPage(){
  const [fid, setFid] = useState("");
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string|null>(null);
  const [cooldown, setCooldown] = useState(0);
  const target = useRef(0);

  useEffect(() => {
    const tick = () => {
      if (!fid) return setCooldown(0);
      const last = +(localStorage.getItem(`dw:lastSpin:${fid}`) || 0);
      const left = Math.max(0, 24*3600*1000 - (Date.now()-last));
      setCooldown(Math.ceil(left/1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [fid]);

  const segments = useMemo(() => (
    Array.from({length: SEGMENTS}, (_, i) => ({
      i,
      a0: i*A,
      a1: (i+1)*A,
      mid: i*A + A/2,
      color: COLORS[i % COLORS.length],
      label: QUESTS[i] ?? `Quête ${i+1}`
    }))
  ), []);

  function fmtHMS(t:number){ const h=Math.floor(t/3600), m=Math.floor((t%3600)/60), s=t%60; return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`; }
  function canSpin(){
    if (!fid.trim()) return { ok:false, reason:"Entre ton FID Farcaster" };
    if (cooldown>0) return { ok:false, reason:`Prochain spin dans ${fmtHMS(cooldown)}` };
    return { ok:true, reason:"" };
  }
  function spin(){
    const gate = canSpin();
    if (!gate.ok || spinning) return;
    setResult(null);
    const tours = 6*360;
    const rand  = Math.floor(Math.random()*360);
    target.current = angle + tours + rand;
    setSpinning(true);
    setAngle(target.current);
  }
  function onEnd(){
    const a = ((target.current % 360)+360)%360;
    const normalized = (360 - a + POINTER_OFFSET_DEG) % 360; // 0° = haut
    const idx = Math.floor(normalized / A) % SEGMENTS;
    setResult(segments[idx].label);
    setSpinning(false);
    if (fid.trim()){
      localStorage.setItem(`dw:lastSpin:${fid}`, String(Date.now()));
      setCooldown(24*3600);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl md:text-4xl font-semibold text-center mb-6">DailyWheel</h1>

        {/* Contrôles */}
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

        {/* ROUE */}
        <div className="relative w-full max-w-[560px] mx-auto">
          {/* Pointeur */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-40">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M28 8L38 28H18L28 8Z" fill="#2563eb" stroke="#0b1220" strokeWidth="4"/>
            </svg>
          </div>

          <svg viewBox="0 0 1000 1000" className="w-full h-auto block">
            {/* Fond */}
            <circle cx={CX} cy={CY} r={R_OUT} fill="#0f172a" opacity="0.25"/>

            {/* Groupe qui TOURNE */}
            <g
              style={{
                transformBox: "fill-box",
                transformOrigin: "50% 50%",
                transform: `rotate(${angle}deg)`,
                transition: spinning ? "transform 4.2s cubic-bezier(0.16,1,0.3,1)" : "none",
              }}
              onTransitionEnd={onEnd}
            >
              {/* Segments */}
              {segments.map(s => (
                <path key={`wedge-${s.i}`} d={wedgePath(R_OUT, R_IN, s.a0, s.a1)} fill={s.color}/>
              ))}
              {/* Séparateurs doux */}
              {segments.map(s => (
                <path key={`sep-${s.i}`} d={arcPath(R_OUT, s.a0, s.a1)} stroke="rgba(0,0,0,0.18)" strokeWidth="2" fill="none"/>
              ))}

              {/* Défs des ARCS de texte (lecture sur l’arc, bien lisible) */}
              <defs>
                {segments.map(s=>{
                  // arc couvrant ~90% du secteur pour laisser un peu de marge
                  const span = A * 0.9;
                  const aStart = s.mid - span/2;
                  const aEnd   = s.mid + span/2;
                  return <path id={`arc-${s.i}`} key={`arcdef-${s.i}`} d={arcPath(R_TEXT, aStart, aEnd)} />;
                })}
              </defs>

              {/* Libellés sur arc, centrés */}
              {segments.map(s => (
                <text
                  key={`txt-${s.i}`}
                  fontSize={FONT_SIZE}
                  fontWeight={800}
                  fill="#fff"
                  textAnchor="middle"
                  style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.7)", strokeWidth: 6 }}
                >
                  <textPath href={`#arc-${s.i}`} startOffset="50%">
                    {s.label}
                  </textPath>
                </text>
              ))}
            </g>

            {/* Bord + moyeu fixes */}
            <circle cx={CX} cy={CY} r={R_OUT} fill="none" stroke="#0f172a" strokeWidth="16" opacity="0.6"/>
            <circle cx={CX} cy={CY} r={R_IN} fill="#0b1220" stroke="#e5e7eb" strokeWidth="16"/>
          </svg>
        </div>
      </div>
    </main>
  );
}
