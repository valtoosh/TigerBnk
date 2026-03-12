import { useEffect, useRef, useState } from "react";
import mapImg from "@assets/Screenshot_2026-03-12_at_3.44.10_PM_1773316067240.png";

const GOLD = "#C9A84C";
const GOLD_DIM = "rgba(201, 168, 76, 0.3)";
const GOLD_GLOW = "rgba(201, 168, 76, 0.6)";

const VB_W = 970;
const VB_H = 634;

const LON_MIN = -175;
const LON_MAX = 180;
const LAT_TOP = 83;
const LAT_BOT = -60;

function mercatorProject(lat: number) {
  const latRad = (lat * Math.PI) / 180;
  return (1 - Math.log(Math.tan(Math.PI / 4 + latRad / 2)) / Math.PI) / 2;
}

const Y_TOP = mercatorProject(LAT_TOP);
const Y_BOT = mercatorProject(LAT_BOT);

function lonToX(lon: number) {
  return ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * VB_W;
}
function latToY(lat: number) {
  const yNorm = mercatorProject(Math.max(LAT_BOT, Math.min(LAT_TOP, lat)));
  return ((yNorm - Y_TOP) / (Y_BOT - Y_TOP)) * VB_H;
}

interface CityNode {
  name: string;
  lat: number;
  lon: number;
  labelOffset?: [number, number];
}

const CITIES: CityNode[] = [
  { name: "Dubai", lat: 25.2, lon: 55.3, labelOffset: [-30, -14] },
  { name: "Mumbai", lat: 19.1, lon: 72.9, labelOffset: [0, 18] },
  { name: "Karachi", lat: 24.9, lon: 67.0, labelOffset: [0, -14] },
  { name: "Hong Kong", lat: 22.3, lon: 114.2, labelOffset: [12, 5] },
  { name: "Jakarta", lat: -6.2, lon: 106.8, labelOffset: [12, 5] },
  { name: "Beijing", lat: 39.9, lon: 116.4, labelOffset: [0, -14] },
  { name: "Moscow", lat: 55.8, lon: 37.6, labelOffset: [0, -14] },
];

interface Arc {
  from: string;
  to: string;
}

const ARCS: Arc[] = [
  { from: "Dubai", to: "Mumbai" },
  { from: "Mumbai", to: "Hong Kong" },
  { from: "Hong Kong", to: "Beijing" },
  { from: "Beijing", to: "Moscow" },
  { from: "Dubai", to: "Karachi" },
  { from: "Jakarta", to: "Hong Kong" },
  { from: "Mumbai", to: "Jakarta" },
];

function getCityPos(name: string): { x: number; y: number; offset: [number, number] } {
  const c = CITIES.find((c) => c.name === name)!;
  return { x: lonToX(c.lon), y: latToY(c.lat), offset: c.labelOffset || [0, -14] };
}

function makeArcPath(fromX: number, fromY: number, toX: number, toY: number): string {
  const mx = (fromX + toX) / 2;
  const my = (fromY + toY) / 2;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const curvature = Math.min(dist * 0.3, 80);
  const cx = mx - (dy / dist) * curvature;
  const cy = my + (dx / dist) * curvature;
  return `M${fromX},${fromY} Q${cx},${cy} ${toX},${toY}`;
}

function PulsingDot({ name }: { name: string }) {
  const { x, y, offset } = getCityPos(name);
  return (
    <g>
      <circle cx={x} cy={y} r="8" fill="none" stroke={GOLD_DIM} strokeWidth="1">
        <animate attributeName="r" values="4;14;4" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx={x} cy={y} r="3.5" fill={GOLD} />
      <circle cx={x} cy={y} r="5.5" fill="none" stroke={GOLD_GLOW} strokeWidth="0.5" opacity="0.5" />
      <text
        x={x + offset[0]}
        y={y + offset[1]}
        textAnchor={offset[0] > 0 ? "start" : offset[0] < 0 ? "end" : "middle"}
        fill="#6b5a2e"
        fontSize="9"
        fontFamily="'JetBrains Mono', monospace"
        fontWeight="600"
      >
        {name}
      </text>
    </g>
  );
}

function AnimatedArc({ arc, delay }: { arc: Arc; delay: number }) {
  const from = getCityPos(arc.from);
  const to = getCityPos(arc.to);
  const path = makeArcPath(from.x, from.y, to.x, to.y);
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
        strokeWidth="1.5"
        opacity="0.8"
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
          values="0;0.8;0.8;0"
          keyTimes="0;0.1;0.7;1"
          dur={`${totalDur + fadeDur}s`}
          begin={`${delay}s`}
          repeatCount="indefinite"
        />
      </path>
      <circle r="3" fill={GOLD} opacity="0">
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
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#fff" }}>
      <img
        src={mapImg}
        alt=""
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: "cover", objectPosition: "center" }}
        draggable={false}
      />
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <filter id="arc-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {ARCS.map((arc, i) => (
          <AnimatedArc key={`${arc.from}-${arc.to}`} arc={arc} delay={i * 0.7} />
        ))}

        {CITIES.map((city) => (
          <PulsingDot key={city.name} name={city.name} />
        ))}
      </svg>
    </div>
  );
}
