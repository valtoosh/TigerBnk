import { useEffect, useRef, useState } from "react";
import mapImg from "@assets/map.png";

const BLACK = "#1a1a1a";

const VB_W = 2750;
const VB_H = 1536;

// Pixel positions detected from the black dots on map.png (2750x1536)
const CITIES: Record<string, [number, number]> = {
  "San Francisco": [267, 524],
  "Chicago":       [418, 401],
  "Toronto":       [460, 398],
  "New York":      [570, 460],
  "São Paulo":     [757, 875],
  "London":        [1229, 327],
  "Paris":         [1244, 335],
  "Zurich":        [1309, 365],
  "Frankfurt":     [1272, 341],
  "Moscow":        [1424, 224],
  "Dubai":         [1521, 466],
  "Mumbai":        [1606, 589],
  "Johannesburg":  [1403, 815],
  "Singapore":     [1845, 633],
  "Beijing":       [2020, 380],
  "Shanghai":      [2085, 455],
  "Hong Kong":     [2026, 500],
  "Tokyo":         [2233, 369],
  "Sydney":        [2355, 839],
  "Melbourne":     [2264, 866],
};

interface Arc {
  from: string;
  to: string;
}

const ARCS: Arc[] = [
  { from: "San Francisco", to: "Chicago" },
  { from: "Chicago", to: "Toronto" },
  { from: "Chicago", to: "New York" },
  { from: "New York", to: "São Paulo" },
  { from: "New York", to: "London" },
  { from: "São Paulo", to: "Johannesburg" },
  { from: "London", to: "Paris" },
  { from: "Paris", to: "Zurich" },
  { from: "Paris", to: "Frankfurt" },
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

function makeArcPath(fromX: number, fromY: number, toX: number, toY: number): string {
  const mx = (fromX + toX) / 2;
  const my = (fromY + toY) / 2;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const curvature = Math.min(dist * 0.2, 200);
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
  const [pathLength, setPathLength] = useState(600);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  const cycleDur = 4;

  return (
    <g>
      <path
        ref={pathRef}
        d={path}
        fill="none"
        stroke={BLACK}
        strokeWidth="4"
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

        {ARCS.map((arc, i) => (
          <AnimatedArc key={`${arc.from}-${arc.to}`} arc={arc} delay={i * 0.5} />
        ))}
      </svg>
    </div>
  );
}
