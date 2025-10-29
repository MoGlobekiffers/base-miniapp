import Image from "next/image";

export default function WheelPage() {
  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl md:text-4xl font-semibold text-center mb-8">DailyWheel</h1>

        <div className="relative w-full max-w-[520px] mx-auto aspect-square">
          <Image
            src="/dailywheel.png"
            alt="DailyWheel"
            fill
            priority
            sizes="(max-width: 520px) 90vw, 520px"
            style={{ objectFit: "contain" }}
          />
          <Image
            src="/wheel-pointer.svg"
            alt="Pointeur"
            width={56}
            height={56}
            priority
            style={{ position: "absolute", top: "-6px", left: "50%", transform: "translateX(-50%)" }}
          />
        </div>
      </div>
    </main>
  );
}
