import { useEffect, useRef, useState } from "react";
import mapImg from "@assets/Gemini_Generated_Image_w055lew055lew055_1773321842913.png";

const GOLD = "#C9A84C";
const GOLD_DIM = "rgba(201, 168, 76, 0.3)";
const GOLD_GLOW = "rgba(201, 168, 76, 0.6)";

const VB_W = 2752;
const VB_H = 1536;

// Asymmetric bounds: the map image has ~4% left cream pad and ~10% right cream pad,
// so the Prime Meridian sits at 47% of image width, not 50%.
// LON range = 419°, LAT range = 175°
const LON_MIN = -197;
const LON_MAX = 222;
const LAT_TOP = 87;
const LAT_BOT = -88;

function lonToX(lon: number) {
  return ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * VB_W;
}
function latToY(lat: number) {
  return ((LAT_TOP - lat) / (LAT_TOP - LAT_BOT)) * VB_H;
}

interface CityNode {
  name: string;
  lat: number;
  lon: number;
  lo: [number, number]; // label offset in SVG viewBox units
}

const CITIES: CityNode[] = [
  { name: "San Francisco", lat: 37.77,  lon: -122.42, lo: [-24, -16] },
  { name: "Los Angeles",   lat: 34.05,  lon: -118.24, lo: [-24,  18] },
  { name: "Chicago",       lat: 41.88,  lon: -87.63,  lo: [  0, -20] },
  { name: "Toronto",       lat: 43.65,  lon: -79.38,  lo: [ 20, -14] },
  { name: "New York",      lat: 40.71,  lon: -74.01,  lo: [ 20,   6] },
  { name: "Mexico City",   lat: 19.43,  lon: -99.13,  lo: [-24,  20] },
  { name: "São Paulo",     lat: -23.55, lon: -46.63,  lo: [ 20,  10] },
  { name: "Buenos Aires",  lat: -34.60, lon: -58.38,  lo: [ 20,  12] },
  { name: "Santiago",      lat: -33.45, lon: -70.67,  lo: [-24,  12] },
  { name: "London",        lat: 51.51,  lon: -0.13,   lo: [-24, -16] },
  { name: "Amsterdam",     lat: 52.37,  lon:  4.90,   lo: [ 20, -14] },
  { name: "Zurich",        lat: 47.38,  lon:  8.54,   lo: [ 20, -14] },
  { name: "Paris",         lat: 48.86,  lon:  2.35,   lo: [-24,  12] },
  { name: "Milan",         lat: 45.46,  lon:  9.19,   lo: [ 20,  12] },
  { name: "Madrid",        lat: 40.42,  lon: -3.70,   lo: [-24,  12] },
  { name: "Frankfurt",     lat: 50.11,  lon:  8.68,   lo: [ 20,  10] },
  { name: "Moscow",        lat: 55.76,  lon: 37.62,   lo: [ 20, -16] },
  { name: "Istanbul",      lat: 41.01,  lon: 28.98,   lo: [ 20,  12] },
  { name: "Cairo",         lat: 30.04,  lon: 31.24,   lo: [ 20,  10] },
  { name: "Lagos",         lat:  6.52,  lon:  3.38,   lo: [-24,  14] },
  { name: "Nairobi",       lat: -1.29,  lon: 36.82,   lo: [ 20,  10] },
  { name: "Johannesburg",  lat: -26.20, lon: 28.05,   lo: [ 20,  12] },
  { name: "Dubai",         lat: 25.20,  lon: 55.27,   lo: [  0, -20] },
  { name: "Abu Dhabi",     lat: 24.45,  lon: 54.65,   lo: [-24,  18] },
  { name: "Riyadh",        lat: 24.69,  lon: 46.72,   lo: [-24,  10] },
  { name: "Karachi",       lat: 24.86,  lon: 67.01,   lo: [ 20, -16] },
  { name: "Delhi",         lat: 28.61,  lon: 77.21,   lo: [  0, -20] },
  { name: "Mumbai",        lat: 19.08,  lon: 72.88,   lo: [-24,  12] },
  { name: "Bengaluru",     lat: 12.97,  lon: 77.59,   lo: [ 20,  12] },
  { name: "Bangkok",       lat: 13.76,  lon: 100.50,  lo: [ 20, -16] },
  { name: "Kuala Lumpur",  lat:  3.14,  lon: 101.69,  lo: [ 20,  14] },
  { name: "Singapore",     lat:  1.35,  lon: 103.82,  lo: [ 20, -16] },
  { name: "Jakarta",       lat: -6.21,  lon: 106.85,  lo: [ 20,  14] },
  { name: "Hong Kong",     lat: 22.32,  lon: 114.17,  lo: [ 20,  12] },
  { name: "Taipei",        lat: 25.03,  lon: 121.57,  lo: [ 20, -16] },
  { name: "Shanghai",      lat: 31.23,  lon: 121.47,  lo: [ 20,  10] },
  { name: "Beijing",       lat: 39.90,  lon: 116.40,  lo: [  0, -20] },
  { name: "Seoul",         lat: 37.57,  lon: 126.98,  lo: [ 20, -14] },
  { name: "Tokyo",         lat: 35.68,  lon: 139.69,  lo: [ 20,  10] },
  { name: "Osaka",         lat: 34.69,  lon: 135.50,  lo: [-24,  18] },
  { name: "Sydney",        lat: -33.87, lon: 151.21,  lo: [ 20,  10] },
  { name: "Melbourne",     lat: -37.81, lon: 144.96,  lo: [-24,  10] },
  { name: "Auckland",      lat: -36.85, lon: 174.76,  lo: [ 20,  10] },
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

function getCityPos(name: string): { x: number; y: number; lo: [number, number] } {
  const c = CITIES.find((c) => c.name === name)!;
  return { x: lonToX(c.lon), y: latToY(c.lat), lo: c.lo };
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
  const { x, y, lo } = getCityPos(name);
  const anchor = lo[0] > 0 ? "start" : lo[0] < 0 ? "end" : "middle";
  return (
    <g>
      <circle cx={x} cy={y} r="22" fill="none" stroke={GOLD_DIM} strokeWidth="2">
        <animate attributeName="r" values="10;36;10" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx={x} cy={y} r="8" fill={GOLD} />
      <circle cx={x} cy={y} r="14" fill="none" stroke={GOLD_GLOW} strokeWidth="1.5" opacity="0.4" />
      <text
        x={x + lo[0]}
        y={y + lo[1]}
        textAnchor={anchor}
        fill="#3d2e0e"
        fontSize="19"
        fontFamily="'JetBrains Mono', monospace"
        fontWeight="600"
        opacity="0.72"
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
