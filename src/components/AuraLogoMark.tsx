// AuraLogoMark.tsx — animated "Roofline" AR monogram for Aura Realty.
// Props: size (default 44), tone "dark" (on navy/video) | "light" (on white), animate (false = static)
// Requires the "Cinzel" Google Font (600/700).

type Props = {
  size?: number;
  tone?: "dark" | "light";
  animate?: boolean;
  className?: string;
};

const COPPER = "#C07A4A";
const NAVY = "#1E2A44";

const css = `
@keyframes arl-draw  { to { stroke-dashoffset: 0; } }
@keyframes arl-rise  { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: none; } }
@keyframes arl-smoke { 0% { opacity: 0; transform: translate(0,0) scale(.6); }
                       30% { opacity: .55; }
                       100% { opacity: 0; transform: translate(3px,-9px) scale(1.4); } }
@keyframes arl-glint { from { stroke-dashoffset: 1; opacity: .95; } 85% { opacity: .95; } to { stroke-dashoffset: -0.2; opacity: 0; } }

.arl .roof    { stroke-dasharray: 1; stroke-dashoffset: 1; animation: arl-draw .8s cubic-bezier(.65,0,.35,1) forwards; }
.arl .chimney { stroke-dasharray: 1; stroke-dashoffset: 1; animation: arl-draw .35s ease-out .65s forwards; }
.arl .smoke   { opacity: 0; transform-box: fill-box; transform-origin: center; }
.arl .smoke1  { animation: arl-smoke 1.2s ease-out .95s forwards; }
.arl .smoke2  { animation: arl-smoke 1.2s ease-out 1.2s forwards; }
.arl .ltrA    { opacity: 0; animation: arl-rise .5s cubic-bezier(.2,.8,.3,1.2) .85s forwards; }
.arl .ltrR    { opacity: 0; animation: arl-rise .5s cubic-bezier(.2,.8,.3,1.2) 1.0s forwards; }
.arl .base    { stroke-dasharray: 1; stroke-dashoffset: 1; animation: arl-draw .45s ease-out 1.25s forwards; }
.arl .glint   { stroke-dasharray: .12 1.2; stroke-dashoffset: 1; opacity: 0; animation: arl-glint .9s ease-in-out 1.55s forwards; }

.arl .roofgroup { transition: transform .25s ease; }
.arl:hover .roofgroup { transform: translateY(-1.5px); }

.arl.static .roof, .arl.static .chimney, .arl.static .base { animation: none; stroke-dashoffset: 0; }
.arl.static .ltrA, .arl.static .ltrR { animation: none; opacity: 1; }
.arl.static .smoke, .arl.static .glint { display: none; }

@media (prefers-reduced-motion: reduce) {
  .arl .roof, .arl .chimney, .arl .base { animation: none; stroke-dashoffset: 0; }
  .arl .ltrA, .arl .ltrR { animation: none; opacity: 1; }
  .arl .smoke, .arl .glint { display: none; }
  .arl .roofgroup { transition: none; }
}
`;

export default function AuraLogoMark({
  size = 44,
  tone = "dark",
  animate = true,
  className = "",
}: Props) {
  const letter = tone === "dark" ? "#FFFFFF" : NAVY;
  return (
    <>
      <style>{css}</style>
      <svg
        role="img"
        aria-label="Aura Realty"
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        className={`arl ${animate ? "" : "static"} ${className}`.trim()}
        style={{ flexShrink: 0, display: "block", overflow: "visible" }}
      >
        <g className="roofgroup" stroke={COPPER} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
          <path className="roof" pathLength={1} d="M8 30 L32 10 L56 30" />
          <path className="chimney" pathLength={1} d="M44 20 L44 13 L49 13 L49 24" />
          <path className="glint" pathLength={1} d="M8 30 L32 10 L56 30" stroke="#F6DCC7" strokeWidth={3} />
        </g>
        <circle className="smoke smoke1" cx="46.5" cy="9" r="1.6" fill={COPPER} />
        <circle className="smoke smoke2" cx="47.5" cy="8" r="1.3" fill={COPPER} />
        <text className="ltrA" x="25.5" y="50" textAnchor="middle" fontFamily="Cinzel, Georgia, serif" fontWeight={700} fontSize={20} fill={letter}>A</text>
        <text className="ltrR" x="39" y="50" textAnchor="middle" fontFamily="Cinzel, Georgia, serif" fontWeight={700} fontSize={20} fill={letter}>R</text>
        <g stroke={COPPER} strokeWidth={2.6} strokeLinecap="round">
          <path className="base" pathLength={1} d="M32 56 L16 56" />
          <path className="base" pathLength={1} d="M32 56 L48 56" />
        </g>
      </svg>
    </>
  );
}
