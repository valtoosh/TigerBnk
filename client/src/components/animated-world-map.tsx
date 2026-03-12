import { useEffect, useRef, useState } from "react";
import mapImg from "@assets/Gemini_Generated_Image_9ugbyi9ugbyi9ugb_1773316811694.png";

const GOLD = "#C9A84C";
const GOLD_DIM = "rgba(201, 168, 76, 0.3)";
const GOLD_GLOW = "rgba(201, 168, 76, 0.6)";

const VB_W = 2752;
const VB_H = 1536;

const LON_MIN = -168;
const LON_MAX = 182;
const LAT_TOP = 80;
const LAT_BOT = -72;

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
  labelOffset: [number, number];
}

const CITIES: CityNode[] = [
  { name: "San Francisco", lat: 37.77, lon: -122.42, labelOffset: [-18, -18] },
  { name: "Los Angeles", lat: 34.05, lon: -118.24, labelOffset: [-18, 22] },
  { name: "Chicago", lat: 41.88, lon: -87.63, labelOffset: [18, -14] },
  { name: "Toronto", lat: 43.65, lon: -79.38, labelOffset: [0, -18] },
  { name: "New York", lat: 40.71, lon: -74.01, labelOffset: [18, 6] },
  { name: "Mexico City", lat: 19.43, lon: -99.13, labelOffset: [-18, 6] },
  { name: "São Paulo", lat: -23.55, lon: -46.63, labelOffset: [18, 6] },
  { name: "Buenos Aires", lat: -34.60, lon: -58.38, labelOffset: [18, 6] },
  { name: "Santiago", lat: -33.45, lon: -70.67, labelOffset: [-18, 6] },
  { name: "London", lat: 51.51, lon: -0.13, labelOffset: [-18, -14] },
  { name: "Amsterdam", lat: 52.37, lon: 4.90, labelOffset: [18, -14] },
  { name: "Zurich", lat: 47.38, lon: 8.54, labelOffset: [18, -14] },
  { name: "Paris", lat: 48.86, lon: 2.35, labelOffset: [-18, 6] },
  { name: "Milan", lat: 45.46, lon: 9.19, labelOffset: [18, 10] },
  { name: "Madrid", lat: 40.42, lon: -3.70, labelOffset: [-18, 10] },
  { name: "Frankfurt", lat: 50.11, lon: 8.68, labelOffset: [18, 6] },
  { name: "Moscow", lat: 55.76, lon: 37.62, labelOffset: [18, -14] },
  { name: "Istanbul", lat: 41.01, lon: 28.98, labelOffset: [18, 10] },
  { name: "Cairo", lat: 30.04, lon: 31.24, labelOffset: [18, 6] },
  { name: "Lagos", lat: 6.52, lon: 3.38, labelOffset: [-18, 10] },
  { name: "Nairobi", lat: -1.29, lon: 36.82, labelOffset: [18, 6] },
  { name: "Johannesburg", lat: -26.20, lon: 28.05, labelOffset: [18, 6] },
  { name: "Dubai", lat: 25.20, lon: 55.27, labelOffset: [0, -18] },
  { name: "Abu Dhabi", lat: 24.45, lon: 54.65, labelOffset: [-18, 16] },
  { name: "Riyadh", lat: 24.69, lon: 46.72, labelOffset: [-18, 6] },
  { name: "Karachi", lat: 24.86, lon: 67.01, labelOffset: [18, -14] },
  { name: "Delhi", lat: 28.61, lon: 77.21, labelOffset: [0, -18] },
  { name: "Mumbai", lat: 19.08, lon: 72.88, labelOffset: [-18, 10] },
  { name: "Bengaluru", lat: 12.97, lon: 77.59, labelOffset: [18, 10] },
  { name: "Bangkok", lat: 13.76, lon: 100.50, labelOffset: [18, -14] },
  { name: "Kuala Lumpur", lat: 3.14, lon: 101.69, labelOffset: [18, 10] },
  { name: "Singapore", lat: 1.35, lon: 103.82, labelOffset: [18, -14] },
  { name: "Jakarta", lat: -6.21, lon: 106.85, labelOffset: [18, 10] },
  { name: "Hong Kong", lat: 22.32, lon: 114.17, labelOffset: [18, 10] },
  { name: "Taipei", lat: 25.03, lon: 121.57, labelOffset: [18, -14] },
  { name: "Shanghai", lat: 31.23, lon: 121.47, labelOffset: [18, 6] },
  { name: "Beijing", lat: 39.90, lon: 116.40, labelOffset: [0, -18] },
  { name: "Seoul", lat: 37.57, lon: 126.98, labelOffset: [18, -14] },
  { name: "Tokyo", lat: 35.68, lon: 139.69, labelOffset: [18, 6] },
  { name: "Osaka", lat: 34.69, lon: 135.50, labelOffset: [-18, 16] },
  { name: "Sydney", lat: -33.87, lon: 151.21, labelOffset: [18, 6] },
  { name: "Melbourne", lat: -37.81, lon: 144.96, labelOffset: [-18, 6] },
  { name: "Auckland", lat: -36.85, lon: 174.76, labelOffset: [18, 6] },
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

function getCityPos(name: string): { x: number; y: number; offset: [number, number] } {
  const c = CITIES.find((c) => c.name === name)!;
  return { x: lonToX(c.lon), y: latToY(c.lat), offset: c.labelOffset };
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
  const { x, y, offset } = getCityPos(name);
  return (
    <g>
      <circle cx={x} cy={y} r="22" fill="none" stroke={GOLD_DIM} strokeWidth="2">
        <animate attributeName="r" values="10;36;10" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx={x} cy={y} r="8" fill={GOLD} />
      <circle cx={x} cy={y} r="14" fill="none" stroke={GOLD_GLOW} strokeWidth="1.5" opacity="0.4" />
      <text
        x={x + offset[0]}
        y={y + offset[1]}
        textAnchor={offset[0] > 0 ? "start" : offset[0] < 0 ? "end" : "middle"}
        fill="#5a4a28"
        fontSize="18"
        fontFamily="'JetBrains Mono', monospace"
        fontWeight="600"
        opacity="0.7"
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
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#f5f0e8" }}>
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
          <AnimatedArc key={`${arc.from}-${arc.to}`} arc={arc} delay={i * 0.45} />
        ))}

        {CITIES.map((city) => (
          <PulsingDot key={city.name} name={city.name} />
        ))}
      </svg>
    </div>
  );
}
