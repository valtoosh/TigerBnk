import { useEffect, useRef, useState } from "react";
import mapImg from "@assets/blankmap.png";

const BLACK = "#1a1a1a";
const ORANGE = "#FF4D00";

const VB_W = 1024;
const VB_H = 572;
const BASE_H = 512; // equirectangular base height (VB_W / 2)
const Y_OFF = 30;   // vertical offset for 16:9 crop ((VB_H - BASE_H) / 2)
const X_OFF = -15;  // shift nodes left to align with map

// Lat/lon for each city — positions computed dynamically
const CITIES_GEO: Record<string, { lat: number; lon: number }> = {
  "San Francisco": { lat: 37.77, lon: -122.42 },
  "Chicago":       { lat: 41.88, lon: -87.63 },
  "Toronto":       { lat: 46.00, lon: -79.38 },
  "New York":      { lat: 40.71, lon: -74.01 },
  "São Paulo":     { lat: -23.55, lon: -46.63 },
  "London":        { lat: 51.51, lon: -0.13 },
  "Paris":         { lat: 48.86, lon: 2.35 },
  "Zurich":        { lat: 47.38, lon: 8.54 },
  "Frankfurt":     { lat: 50.11, lon: 8.68 },
  "Moscow":        { lat: 55.76, lon: 37.62 },
  "Dubai":         { lat: 25.20, lon: 55.27 },
  "Mumbai":        { lat: 19.08, lon: 72.88 },
  "Johannesburg":  { lat: -26.20, lon: 28.05 },
  "Singapore":     { lat: 1.35, lon: 103.82 },
  "Beijing":       { lat: 39.90, lon: 116.41 },
  "Shanghai":      { lat: 31.23, lon: 121.47 },
  "Hong Kong":     { lat: 22.32, lon: 114.17 },
  "Tokyo":         { lat: 35.68, lon: 139.65 },
  "Sydney":        { lat: -33.87, lon: 151.21 },
  "Melbourne":     { lat: -37.81, lon: 144.96 },
};

const EAST_X_OFF = -20; // extra left shift for Mumbai and cities east of it

function geoToXY(lat: number, lon: number): [number, number] {
  const extraShift = lon >= 72 ? EAST_X_OFF : 0;
  const x = ((lon + 180) / 360) * VB_W + X_OFF + extraShift;
  const y = ((90 - lat) / 180) * BASE_H + Y_OFF;
  return [x, y];
}

// Pre-compute pixel positions
const CITIES: Record<string, [number, number]> = {};
for (const [name, { lat, lon }] of Object.entries(CITIES_GEO)) {
  CITIES[name] = geoToXY(lat, lon);
}
// Manual nudge
CITIES["Toronto"][1] -= 20;

interface Arc {
  from: string;
  to: string;
}

const ARCS: Arc[] = [
  { from: "San Francisco", to: "Chicago" },
  { from: "Chicago", to: "New York" },
  { from: "Chicago", to: "Toronto" },
  { from: "New York", to: "São Paulo" },
  { from: "New York", to: "London" },
  { from: "São Paulo", to: "Johannesburg" },
  { from: "London", to: "Paris" },
  { from: "Paris", to: "Frankfurt" },
  { from: "Frankfurt", to: "Zurich" },
  { from: "London", to: "Frankfurt" },
  { from: "London", to: "Moscow" },
  { from: "Moscow", to: "Dubai" },
  { from: "London", to: "Dubai" },
  { from: "Dubai", to: "Mumbai" },
  { from: "Dubai", to: "Johannesburg" },
  { from: "Mumbai", to: "Singapore" },
  { from: "Singapore", to: "Hong Kong" },
  { from: "Hong Kong", to: "Shanghai" },
  { from: "Shanghai", to: "Beijing" },
  { from: "Hong Kong", to: "Tokyo" },
  { from: "Beijing", to: "Tokyo" },
  { from: "Singapore", to: "Sydney" },
  { from: "Sydney", to: "Melbourne" },
  { from: "Mumbai", to: "Hong Kong" },
  { from: "San Francisco", to: "Tokyo" },
];

// Label offsets [dx, dy] to space out clustered names
const LABEL_OFFSETS: Record<string, [number, number]> = {
  // Europe cluster
  "London":      [-20, -14],
  "Paris":       [-30, 18],
  "Frankfurt":   [8, -10],
  "Zurich":      [10, 14],
  // East Asia cluster
  "Beijing":     [8, -10],
  "Shanghai":    [8, 14],
  "Hong Kong":   [-42, -15],
  "Tokyo":       [8, -10],
  // Australia cluster
  "Sydney":      [8, -10],
  "Melbourne":   [-70, 14],
  // US cluster
  "Chicago":     [-12, -10],
  "Toronto":     [8, -6],
  "New York":    [8, -10],
  "San Francisco": [-90, -4],
};

function makeArcPath(fromX: number, fromY: number, toX: number, toY: number): string {
  const mx = (fromX + toX) / 2;
  const my = (fromY + toY) / 2;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return `M${fromX},${fromY} L${toX},${toY}`;
  const curvature = Math.min(dist * 0.15, 80);
  const cx = mx - (dy / dist) * curvature;
  const cy = my + (dx / dist) * curvature;
  return `M${fromX},${fromY} Q${cx},${cy} ${toX},${toY}`;
}

function AnimatedArc({ arc, delay }: { arc: Arc; delay: number }) {
  const from = CITIES[arc.from];
  const to = CITIES[arc.to];
  if (!from || !to) return null;

  const path = makeArcPath(from[0], from[1], to[0], to[1]);
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(300);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [path]);

  const cycleDur = 4;

  return (
    <g>
      <path
        ref={pathRef}
        d={path}
        fill="none"
        stroke={ORANGE}
        strokeWidth="2.5"
        opacity="0.7"
        strokeDasharray={pathLength}
        strokeDashoffset={pathLength}
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
    </g>
  );
}

export default function AnimatedWorldMap() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#FFF8E7" }}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
      >
        <image
          href={mapImg}
          x="0"
          y="0"
          width={VB_W}
          height={VB_H}
          preserveAspectRatio="xMidYMid slice"
        />

        {/* City dots */}
        {Object.entries(CITIES).map(([name, [x, y]]) => (
          <circle key={name} cx={x} cy={y} r="5" fill={BLACK} />
        ))}

        {/* City labels — custom offsets for clustered names */}
        {Object.entries(CITIES).map(([name, [x, y]]) => {
          const off = LABEL_OFFSETS[name] || [8, -8];
          return (
            <text
              key={`label-${name}`}
              x={x + off[0]}
              y={y + off[1]}
              fill={BLACK}
              fontSize="14.4"
              fontFamily="sans-serif"
              fontWeight="600"
            >
              {name}
            </text>
          );
        })}

        {/* Animated arcs */}
        {ARCS.map((arc, i) => (
          <AnimatedArc key={`${arc.from}-${arc.to}`} arc={arc} delay={i * 0.3} />
        ))}
      </svg>
    </div>
  );
}
