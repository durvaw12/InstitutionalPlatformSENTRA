/** Hero artwork for the landing page: campus building, shield, three people, trees and clouds. */
const Cloud = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity=".9">
    <ellipse cx="50" cy="48" rx="62" ry="22" fill="#cfe0fb" />
    <circle cx="38" cy="30" r="26" fill="#bcd3f8" />
    <circle cx="74" cy="32" r="20" fill="#a9c6f5" opacity=".8" />
  </g>
);
const Tree = ({ x, y, h = 130, w = 62 }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={w / 2 - 4} y={h * 0.55} width="8" height={h * 0.5} fill="#7f9fdc" />
    <ellipse cx={w / 2} cy={h * 0.38} rx={w / 2} ry={h * 0.42} fill="#8fb0ee" />
    <ellipse cx={w / 2 - 6} cy={h * 0.3} rx={w / 3} ry={h * 0.3} fill="#a5c1f4" opacity=".7" />
  </g>
);
const Person = ({ x, shirt }) => (
  <g transform={`translate(${x} 0)`}>
    <circle cx="0" cy="0" r="18" fill="#d9a07a" />
    <rect x="-28" y="22" width="56" height="86" rx="14" fill={shirt} />
    <rect x="-19" y="104" width="13" height="78" rx="6" fill="#1b2a5a" transform="rotate(-2 -12 104)" />
    <rect x="6" y="104" width="13" height="78" rx="6" fill="#1b2a5a" transform="rotate(8 12 104)" />
  </g>
);
export default function CampusIllustration() {
  return (
    <svg
      viewBox="0 0 760 560"
      role="img"
      aria-label="Illustration of a campus building protected by a shield, with three students in front"
      className="lp-art"
    >
      <defs>
        <linearGradient id="bld" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9dbcf2" />
          <stop offset="1" stopColor="#c3d8fa" />
        </linearGradient>
        <linearGradient id="shield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2f6be8" />
          <stop offset="1" stopColor="#1650d8" />
        </linearGradient>
      </defs>

      <Cloud x={40} y={50} s={1.1} />
      <Cloud x={410} y={10} s={1} />
      <Cloud x={660} y={110} s={0.9} />

      {/* building */}
      <g opacity=".92">
        <rect x="70" y="255" width="215" height="130" fill="url(#bld)" opacity=".75" />
        <rect x="245" y="215" width="270" height="170" fill="url(#bld)" />
        <rect x="475" y="270" width="210" height="115" fill="url(#bld)" opacity=".75" />
        <rect x="350" y="85" width="80" height="140" fill="#b9d0f8" />
        <polygon points="340,88 390,38 440,88" fill="#6f95e0" />
        <circle cx="390" cy="125" r="13" fill="#fff" />
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => (
            <rect key={`l${r}${c}`} x={92 + c * 62} y={282 + r * 30} width="48" height="16" fill="#e6efff" opacity=".95" />
          )),
        )}
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => (
            <rect key={`r${r}${c}`} x={500 + c * 62} y={296 + r * 28} width="48" height="16" fill="#e6efff" opacity=".95" />
          )),
        )}
        {[0, 1, 2].map((r) =>
          [0, 1].map((c) => (
            <rect key={`m${r}${c}`} x={c ? 420 : 262} y={238 + r * 28} width="75" height="14" fill="#e6efff" opacity=".9" />
          )),
        )}
      </g>

      {/* shield */}
      <g transform="translate(300 160)">
        <path d="M95 0 L185 40 V120 Q185 190 95 245 Q5 190 5 120 V40 Z" fill="url(#shield)" />
        <path
          d="M95 52 L145 74 V122 Q145 158 95 188 Q45 158 45 122 V74 Z"
          fill="none"
          stroke="#fff"
          strokeWidth="9"
          strokeLinejoin="round"
        />
        <path
          d="M70 118 L89 138 L123 100"
          fill="none"
          stroke="#fff"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* people */}
      <g transform="translate(0 360)">
        <Person x={180} shirt="#2552c4" />
        <Person x={395} shirt="#16285e" />
        <Person x={600} shirt="#2f62cf" />
      </g>

      <Tree x={10} y={300} h={140} w={64} />
      <Tree x={590} y={330} h={120} w={64} />
      <Tree x={650} y={290} h={170} w={78} />
    </svg>
  );
}
