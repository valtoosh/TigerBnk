import { useEffect, useRef, useState } from "react";
import mapImg from "@assets/Gemini_Generated_Image_9ugbyi9ugbyi9ugb_1773316811694.png";

const GOLD = "#C9A84C";
const GOLD_DIM = "rgba(201, 168, 76, 0.3)";
const GOLD_GLOW = "rgba(201, 168, 76, 0.6)";

const VB_W = 2752;
const VB_H = 1536;

interface CityNode {
  name: string;
  x: number;
  y: number;
}

const CITIES: CityNode[] = [
  { name: "San Francisco",  x: 342,  y: 494 },
  { name: "Los Angeles",    x: 321,  y: 544 },
  { name: "Chicago",        x: 530,  y: 451 },
  { name: "Toronto",        x: 594,  y: 424 },
  { name: "New York",       x: 640,  y: 453 },
  { name: "Mexico City",    x: 438,  y: 629 },

  { name: "São Paulo",      x: 741,  y: 918 },
  { name: "Buenos Aires",   x: 702,  y: 991 },
  { name: "Santiago",       x: 637,  y: 981 },

  { name: "Zurich",         x: 1262, y: 315 },
  { name: "Amsterdam",      x: 1232, y: 289 },
  { name: "London",         x: 1207, y: 309 },
  { name: "Paris",          x: 1225, y: 332 },
  { name: "Milan",          x: 1267, y: 342 },
  { name: "Madrid",         x: 1177, y: 377 },
  { name: "Frankfurt",      x: 1273, y: 311 },
  { name: "Moscow",         x: 1502, y: 287 },

  { name: "Istanbul",       x: 1443, y: 367 },
  { name: "Cairo",          x: 1435, y: 466 },
  { name: "Riyadh",         x: 1547, y: 504 },
  { name: "Dubai",          x: 1633, y: 478 },
  { name: "Abu Dhabi",      x: 1617, y: 498 },
  { name: "Karachi",        x: 1695, y: 470 },

  { name: "Lagos",          x: 1247, y: 648 },
  { name: "Nairobi",        x: 1496, y: 702 },
  { name: "Johannesburg",   x: 1445, y: 862 },

  { name: "Delhi",          x: 1756, y: 446 },
  { name: "Mumbai",         x: 1730, y: 536 },
  { name: "Bengaluru",      x: 1742, y: 581 },

  { name: "Bangkok",        x: 1933, y: 579 },
  { name: "Kuala Lumpur",   x: 1943, y: 635 },
  { name: "Singapore",      x: 1960, y: 659 },
  { name: "Jakarta",        x: 1987, y: 709 },

  { name: "Hong Kong",      x: 2035, y: 518 },
  { name: "Taipei",         x: 2073, y: 497 },
  { name: "Shanghai",       x: 2066, y: 459 },
  { name: "Beijing",        x: 2047, y: 406 },
  { name: "Seoul",          x: 2111, y: 412 },
  { name: "Tokyo",          x: 2155, y: 436 },
  { name: "Osaka",          x: 2134, y: 455 },

  { name: "Sydney",         x: 2268, y: 928 },
  { name: "Melbourne",      x: 2236, y: 963 },
  { name: "Auckland",       x: 2377, y: 948 },
];

interface Arc {
  from: string;
  to: string;
}

const ARCS: Arc[] = [
  { from: "San Francisco", to: "Los Angeles" },
  { from: "Los Angeles", to: "Mexico City" },
  { from: "San Francisco", to: "Chicago" },
  { from: "Chicago", to: "Toronto" },
  { from: "Toronto", to: "New York" },
  { from: "New York", to: "Chicago" },
  { from: "Mexico City", to: "São Paulo" },
  { from: "São Paulo", to: "Buenos Aires" },
  { from: "Buenos Aires", to: "Santiago" },
  { from: "New York", to: "London" },
  { from: "São Paulo", to: "Lagos" },
  { from: "London", to: "Amsterdam" },
  { from: "London", to: "Paris" },
  { from: "Paris", to: "Zurich" },
  { from: "Zurich", to: "Milan" },
  { from: "Paris", to: "Madrid" },
  { from: "Frankfurt", to: "London" },
  { from: "Frankfurt", to: "Milan" },
  { from: "Amsterdam", to: "Frankfurt" },
  { from: "London", to: "Moscow" },
  { from: "Istanbul", to: "Moscow" },
  { from: "Istanbul", to: "Dubai" },
  { from: "London", to: "Dubai" },
  { from: "Cairo", to: "Istanbul" },
  { from: "Cairo", to: "Dubai" },
  { from: "Dubai", to: "Riyadh" },
  { from: "Dubai", to: "Abu Dhabi" },
  { from: "Dubai", to: "Karachi" },
  { from: "Dubai", to: "Mumbai" },
  { from: "Lagos", to: "Nairobi" },
  { from: "Nairobi", to: "Johannesburg" },
  { from: "Nairobi", to: "Dubai" },
  { from: "Karachi", to: "Delhi" },
  { from: "Delhi", to: "Mumbai" },
  { from: "Mumbai", to: "Bengaluru" },
  { from: "Mumbai", to: "Bangkok" },
  { from: "Bengaluru", to: "Singapore" },
  { from: "Bangkok", to: "Kuala Lumpur" },
  { from: "Kuala Lumpur", to: "Singapore" },
  { from: "Singapore", to: "Jakarta" },
  { from: "Hong Kong", to: "Singapore" },
  { from: "Mumbai", to: "Singapore" },
  { from: "Hong Kong", to: "Tokyo" },
  { from: "Hong Kong", to: "Shanghai" },
  { from: "Shanghai", to: "Beijing" },
  { from: "Beijing", to: "Seoul" },
  { from: "Seoul", to: "Tokyo" },
  { from: "Tokyo", to: "Osaka" },
  { from: "Hong Kong", to: "Taipei" },
  { from: "Taipei", to: "Shanghai" },
  { from: "Singapore", to: "Sydney" },
  { from: "Sydney", to: "Melbourne" },
  { from: "Sydney", to: "Auckland" },
  { from: "Jakarta", to: "Sydney" },
];

function getCityPos(name: string): { x: number; y: number } {
  const c = CITIES.find((c) => c.name === name)!;
  return { x: c.x, y: c.y };
}

function makeArcPath(fromX: number, fromY: number, toX: number, toY: number): string {
  const mx = (fromX + toX) / 2;
  const my = (fromY + toY) / 2;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const curvature = Math.min(dist * 0.25, 230);
  const cx = mx - (dy / dist) * curvature;
  const cy = my + (dx / dist) * curvature;
  return `M${fromX},${fromY} Q${cx},${cy} ${toX},${toY}`;
}

function PulsingDot({ name }: { name: string }) {
  const { x, y } = getCityPos(name);
  return (
    <g>
      <circle cx={x} cy={y} r="22" fill="none" stroke={GOLD_DIM} strokeWidth="2">
        <animate attributeName="r" values="10;36;10" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx={x} cy={y} r="8" fill={GOLD} />
      <circle cx={x} cy={y} r="14" fill="none" stroke={GOLD_GLOW} strokeWidth="1.5" opacity="0.4" />
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

  const cycleDur = 4;
  const drawDur = cycleDur * 0.4;

  return (
    <g>
      <path
        ref={pathRef}
        d={path}
        fill="none"
        stroke={GOLD}
        strokeWidth="3"
        opacity="0.7"
        strokeDasharray={pathLength}
        strokeDashoffset={pathLength}
        filter="url(#arc-glow)"
      >
        <animate
          attributeName="stroke-dashoffset"
          values={`${pathLength};0;0;${pathLength}`}
          keyTimes="0;0.35;0.65;1"
          dur={`${cycleDur}s`}
          begin={`${delay}s`}
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0;0.7;0.7;0"
          keyTimes="0;0.1;0.7;1"
          dur={`${cycleDur}s`}
          begin={`${delay}s`}
          repeatCount="indefinite"
        />
      </path>
      <circle r="7" fill={GOLD} opacity="0">
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
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#FFF8E7" }}>
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
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {ARCS.map((arc, i) => (
          <AnimatedArc key={`${arc.from}-${arc.to}`} arc={arc} delay={i * 0.37} />
        ))}

        {CITIES.map((city) => (
          <PulsingDot key={city.name} name={city.name} />
        ))}
      </svg>
    </div>
  );
}
