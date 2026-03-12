import { useEffect, useRef, useState } from "react";

const GOLD = "#C9A84C";
const GOLD_DIM = "rgba(201, 168, 76, 0.25)";
const GOLD_GLOW = "rgba(201, 168, 76, 0.6)";
const MAP_BG = "#0a0a0a";
const COUNTRY_FILL = "#111";
const COUNTRY_STROKE = "rgba(201, 168, 76, 0.18)";

const WORLD_PATHS = [
  "M220,120 L225,115 L235,118 L240,125 L238,135 L230,140 L220,138 L215,130 Z",
  "M242,125 L260,118 L275,120 L285,128 L290,140 L280,150 L265,148 L250,142 L242,132 Z",
  "M292,125 L310,120 L325,125 L330,135 L325,145 L310,148 L295,142 Z",
  "M335,110 L370,105 L400,108 L420,115 L430,130 L425,145 L410,155 L390,158 L370,155 L350,148 L340,135 L335,120 Z",
  "M432,115 L460,110 L490,112 L510,120 L520,135 L515,150 L500,158 L480,155 L460,148 L440,140 L432,125 Z",
  "M525,125 L550,118 L575,122 L590,135 L585,150 L570,158 L550,155 L535,145 L525,135 Z",
  "M600,110 L630,105 L660,110 L680,120 L690,135 L685,150 L670,160 L650,162 L630,158 L610,148 L600,135 Z",
  "M240,160 L260,155 L280,162 L285,180 L275,200 L260,210 L245,205 L235,190 L238,175 Z",
  "M290,165 L310,158 L330,165 L335,185 L325,205 L305,215 L290,210 L285,195 L288,180 Z",
  "M260,220 L280,215 L300,222 L310,240 L305,260 L290,275 L275,280 L260,270 L255,250 L258,235 Z",
  "M315,225 L340,218 L360,225 L365,245 L355,265 L340,275 L320,270 L312,255 L315,240 Z",
  "M370,170 L395,165 L415,170 L420,185 L415,200 L400,208 L385,205 L372,195 L370,180 Z",
  "M425,160 L460,155 L490,160 L510,175 L520,195 L515,215 L495,230 L470,235 L445,228 L430,210 L425,190 Z",
  "M530,155 L560,148 L590,155 L610,170 L620,190 L615,210 L595,225 L570,228 L545,220 L530,200 L528,175 Z",
  "M625,145 L655,140 L685,148 L705,165 L710,185 L700,205 L680,215 L655,212 L635,200 L625,180 L623,160 Z",
  "M720,155 L750,150 L770,158 L778,175 L775,195 L760,208 L740,210 L725,200 L718,180 Z",
  "M160,240 L180,235 L200,240 L210,260 L205,280 L190,295 L170,300 L155,290 L148,270 Z",
  "M218,250 L240,245 L255,252 L258,270 L250,285 L235,290 L220,285 L215,268 Z",
  "M350,280 L370,275 L390,282 L398,300 L390,318 L370,325 L355,320 L348,305 Z",
  "M405,178 L425,172 L445,178 L450,195 L445,212 L430,218 L410,215 L405,198 Z",
  "M455,250 L475,245 L495,252 L502,270 L498,290 L480,300 L462,295 L455,278 Z",
  "M550,245 L570,240 L590,248 L598,268 L590,285 L572,292 L555,288 L548,270 Z",
  "M650,260 L680,255 L700,262 L710,280 L705,300 L688,310 L665,305 L655,290 Z",
  "M720,260 L750,255 L780,262 L800,280 L805,305 L795,330 L770,345 L745,340 L730,320 L718,295 Z",
  "M200,300 L220,295 L240,302 L248,320 L240,340 L220,352 L200,348 L192,330 Z",
  "M260,310 L285,305 L305,312 L318,335 L310,360 L290,372 L268,365 L258,345 Z",
  "M322,340 L345,335 L365,342 L375,365 L368,388 L350,398 L330,392 L320,370 Z",
];

interface CityNode {
  name: string;
  x: number;
  y: number;
}

const CITIES: CityNode[] = [
  { name: "Dubai", x: 530, y: 195 },
  { name: "New York", x: 230, y: 155 },
  { name: "London", x: 370, y: 128 },
  { name: "Frankfurt", x: 395, y: 130 },
  { name: "Mumbai", x: 560, y: 200 },
  { name: "Singapore", x: 640, y: 240 },
];

interface Arc {
  from: string;
  to: string;
}

const ARCS: Arc[] = [
  { from: "Dubai", to: "New York" },
  { from: "Dubai", to: "London" },
  { from: "Mumbai", to: "Dubai" },
  { from: "London", to: "Frankfurt" },
  { from: "New York", to: "London" },
  { from: "Singapore", to: "Dubai" },
  { from: "Mumbai", to: "Singapore" },
  { from: "Frankfurt", to: "New York" },
];

function getCityByName(name: string): CityNode {
  return CITIES.find(c => c.name === name)!;
}

function makeArcPath(from: CityNode, to: CityNode): string {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const curvature = Math.min(dist * 0.3, 80);
  const cx = mx - (dy / dist) * curvature;
  const cy = my + (dx / dist) * curvature;
  return `M${from.x},${from.y} Q${cx},${cy} ${to.x},${to.y}`;
}

function PulsingDot({ city }: { city: CityNode }) {
  return (
    <g>
      <circle cx={city.x} cy={city.y} r="8" fill="none" stroke={GOLD_DIM} strokeWidth="1">
        <animate attributeName="r" values="4;14;4" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx={city.x} cy={city.y} r="3" fill={GOLD} />
      <circle cx={city.x} cy={city.y} r="5" fill="none" stroke={GOLD_GLOW} strokeWidth="0.5" opacity="0.5" />
      <text
        x={city.x}
        y={city.y - 12}
        textAnchor="middle"
        fill="rgba(201, 168, 76, 0.5)"
        fontSize="8"
        fontFamily="'JetBrains Mono', monospace"
        fontWeight="500"
      >
        {city.name}
      </text>
    </g>
  );
}

function AnimatedArc({ arc, delay }: { arc: Arc; delay: number }) {
  const from = getCityByName(arc.from);
  const to = getCityByName(arc.to);
  const path = makeArcPath(from, to);
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(600);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  const totalDur = 3;
  const drawDur = totalDur * 0.6;
  const fadeDur = totalDur * 0.4;

  return (
    <g>
      <path
        ref={pathRef}
        d={path}
        fill="none"
        stroke={GOLD}
        strokeWidth="1.2"
        opacity="0.7"
        strokeDasharray={pathLength}
        strokeDashoffset={pathLength}
        filter="url(#arc-glow)"
      >
        <animate
          attributeName="stroke-dashoffset"
          values={`${pathLength};0;0;${pathLength}`}
          keyTimes="0;0.35;0.65;1"
          dur={`${totalDur + fadeDur}s`}
          begin={`${delay}s`}
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0;0.7;0.7;0"
          keyTimes="0;0.1;0.7;1"
          dur={`${totalDur + fadeDur}s`}
          begin={`${delay}s`}
          repeatCount="indefinite"
        />
      </path>
      <circle r="2.5" fill={GOLD} opacity="0">
        <animateMotion
          path={path}
          dur={`${drawDur}s`}
          begin={`${delay}s`}
          repeatCount="indefinite"
          fill="freeze"
        />
        <animate
          attributeName="opacity"
          values="0;1;1;0"
          keyTimes="0;0.05;0.85;1"
          dur={`${drawDur}s`}
          begin={`${delay}s`}
          repeatCount="indefinite"
        />
      </circle>
    </g>
  );
}

export default function AnimatedWorldMap() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: MAP_BG }}>
      <svg
        viewBox="0 60 900 360"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        style={{ opacity: 0.85 }}
      >
        <defs>
          <filter id="arc-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {WORLD_PATHS.map((d, i) => (
          <path
            key={i}
            d={d}
            fill={COUNTRY_FILL}
            stroke={COUNTRY_STROKE}
            strokeWidth="0.8"
          />
        ))}

        {ARCS.map((arc, i) => (
          <AnimatedArc key={`${arc.from}-${arc.to}`} arc={arc} delay={i * 0.7} />
        ))}

        {CITIES.map((city) => (
          <PulsingDot key={city.name} city={city} />
        ))}
      </svg>
    </div>
  );
}
