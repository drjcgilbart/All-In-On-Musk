export type Box = {
  id: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  base: number;
};

export type Column = { id: string; x: number; z: number; r: number; h: number; base: number };

export type Gate = { x: number; z: number; y: number };

export const RAMP_IN = { x0: 48, x1: 118, z0: 20, z1: 52, y0: 0, y1: -12 };
export const SHAFT = { x0: 118, x1: 268, z0: 20, z1: 52, y: -12 };
export const RAMP_OUT = { x0: 268, x1: 340, z0: 20, z1: 52, y0: -12, y1: 0 };
export const TUNNEL_CLEAR = 8;

export const CHECKPOINTS: Gate[] = [
  { x: -210, z: 70, y: 0 },
  { x: -90, z: -30, y: 0 },
  { x: 10, z: -160, y: 0 },
  { x: 150, z: -70, y: 0 },
  { x: 20, z: 36, y: 0 },
  { x: 190, z: 36, y: -12 },
  { x: 370, z: 100, y: 0 },
  { x: 250, z: 210, y: 0 },
  { x: 20, z: 230, y: 0 },
  { x: -170, z: 180, y: 0 },
];

export const BUILDINGS: Box[] = [
  { id: "city-a", x: -370, z: 30, w: 28, d: 28, h: 24, base: 0 },
  { id: "city-b", x: -370, z: 90, w: 26, d: 26, h: 46, base: 0 },
  { id: "city-c", x: -370, z: 150, w: 30, d: 22, h: 18, base: 0 },
  { id: "city-d", x: -318, z: 36, w: 24, d: 32, h: 58, base: 0 },
  { id: "city-e", x: -318, z: 110, w: 28, d: 24, h: 32, base: 0 },
  { id: "city-f", x: -318, z: 168, w: 22, d: 22, h: 16, base: 0 },
  { id: "north-a", x: -50, z: 340, w: 34, d: 24, h: 22, base: 0 },
  { id: "north-b", x: 20, z: 350, w: 40, d: 22, h: 52, base: 0 },
  { id: "north-c", x: 100, z: 336, w: 26, d: 26, h: 28, base: 0 },
  { id: "pad-a", x: -120, z: -310, w: 36, d: 18, h: 14, base: 0 },
  { id: "pad-b", x: 150, z: -280, w: 22, d: 44, h: 16, base: 0 },
  { id: "pad-c", x: 30, z: -370, w: 60, d: 16, h: 10, base: 0 },
  { id: "nk-a", x: 400, z: 170, w: 30, d: 22, h: 18, base: 0 },
  { id: "nk-b", x: 410, z: 250, w: 24, d: 34, h: 12, base: 0 },
  { id: "nk-c", x: 150, z: 320, w: 40, d: 18, h: 14, base: 0 },
  { id: "east-a", x: 440, z: 10, w: 28, d: 28, h: 20, base: 0 },
  { id: "east-b", x: 430, z: 160, w: 22, d: 40, h: 12, base: 0 },
];

export const COLUMNS: Column[] = [
  { id: "starship-1", x: -20, z: -255, r: 9, h: 72, base: 0 },
  { id: "starship-2", x: 60, z: -320, r: 9, h: 72, base: 0 },
  { id: "dome", x: 330, z: 255, r: 16, h: 26, base: 0 },
];

const BOUND = 480;

export function bounds(): Box[] {
  const t = 10;
  const s = BOUND * 2;
  return [
    { id: "bound-n", x: 0, z: BOUND, w: s, d: t, h: 8, base: 0 },
    { id: "bound-s", x: 0, z: -BOUND, w: s, d: t, h: 8, base: 0 },
    { id: "bound-e", x: BOUND, z: 0, w: t, d: s, h: 8, base: 0 },
    { id: "bound-w", x: -BOUND, z: 0, w: t, d: s, h: 8, base: 0 },
  ];
}

export function poles(): Box[] {
  const out: Box[] = [];
  for (let i = 0; i < CHECKPOINTS.length; i++) {
    const a = CHECKPOINTS[i];
    const b = CHECKPOINTS[(i + 1) % CHECKPOINTS.length];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz) || 1;
    const rx = -dz / len;
    const rz = dx / len;
    const steps = Math.max(1, Math.floor(len / 32));
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      const x = a.x + dx * t;
      const z = a.z + dz * t;
      if (surfaceY(x, z) < -1) continue;
      for (const side of [-1, 1]) {
        const px = x + rx * 14 * side;
        const pz = z + rz * 14 * side;
        if (surfaceY(px, pz) < -1) continue;
        const pole: Box = { id: `pole-${i}-${s}-${side}`, x: px, z: pz, w: 0.45, d: 0.45, h: 7, base: 0 };
        const blocked = BUILDINGS.some((bldg) => distPointToBox(px, pz, bldg) < 3);
        const columnHit = COLUMNS.some((c) => Math.hypot(px - c.x, pz - c.z) < c.r + 2);
        if (!blocked && !columnHit) out.push(pole);
      }
    }
  }
  return out;
}

export function tunnelWalls(): Box[] {
  const spans = [RAMP_IN, SHAFT, RAMP_OUT];
  const walls: Box[] = [];
  for (const span of spans) {
    const y0 = "y" in span ? span.y : Math.min(span.y0, span.y1);
    const midX = (span.x0 + span.x1) / 2;
    const len = span.x1 - span.x0;
    const base = y0;
    walls.push({
      id: `wall-s-${span.x0}`,
      x: midX,
      z: span.z0,
      w: len,
      d: 1.4,
      h: TUNNEL_CLEAR,
      base,
    });
    walls.push({
      id: `wall-n-${span.x0}`,
      x: midX,
      z: span.z1,
      w: len,
      d: 1.4,
      h: TUNNEL_CLEAR,
      base,
    });
  }
  return walls;
}

export function surfaceY(x: number, z: number) {
  if (xzInside(RAMP_IN, x, z)) {
    const t = (x - RAMP_IN.x0) / (RAMP_IN.x1 - RAMP_IN.x0);
    return RAMP_IN.y0 + (RAMP_IN.y1 - RAMP_IN.y0) * clamp01(t);
  }
  if (xzInside(SHAFT, x, z)) return SHAFT.y;
  if (xzInside(RAMP_OUT, x, z)) {
    const t = (x - RAMP_OUT.x0) / (RAMP_OUT.x1 - RAMP_OUT.x0);
    return RAMP_OUT.y0 + (RAMP_OUT.y1 - RAMP_OUT.y0) * clamp01(t);
  }
  return 0;
}

export function covered(x: number, z: number) {
  return xzInside(SHAFT, x, z) && surfaceY(x, z) < -6;
}

function xzInside(span: { x0: number; x1: number; z0: number; z1: number }, x: number, z: number) {
  return x >= span.x0 && x <= span.x1 && z >= span.z0 && z <= span.z1;
}

function clamp01(t: number) {
  return Math.max(0, Math.min(1, t));
}

export function distPointToBox(x: number, z: number, b: Box) {
  const cx = Math.max(b.x - b.w / 2, Math.min(x, b.x + b.w / 2));
  const cz = Math.max(b.z - b.d / 2, Math.min(z, b.z + b.d / 2));
  return Math.hypot(x - cx, z - cz);
}

export function layoutProblems() {
  const problems: string[] = [];
  const solids = BUILDINGS.filter((b) => b.base >= -0.1);
  const columns = COLUMNS;

  const clearance = (x: number, z: number, need: number, label: string) => {
    for (const b of solids) {
      const dist = distPointToBox(x, z, b);
      if (dist < need) problems.push(`${label} is ${dist.toFixed(1)}m from ${b.id}`);
    }
    for (const c of columns) {
      const dist = Math.hypot(x - c.x, z - c.z) - c.r;
      if (dist < need) problems.push(`${label} is ${dist.toFixed(1)}m from ${c.id}`);
    }
  };

  CHECKPOINTS.forEach((g, i) => clearance(g.x, g.z, 12, `checkpoint ${i}`));
  clearance(0, 0, 15, "origin");

  for (let i = 0; i < CHECKPOINTS.length; i++) {
    const a = CHECKPOINTS[i];
    const b = CHECKPOINTS[(i + 1) % CHECKPOINTS.length];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    if (len < 40) problems.push(`checkpoint span ${i} is only ${len.toFixed(0)}m`);
    const steps = Math.ceil(len / 10);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = a.x + (b.x - a.x) * t;
      const z = a.z + (b.z - a.z) * t;
      const y = surfaceY(x, z);
      if (y > -1) clearance(x, z, 8, `line ${i} sample ${s}`);
    }
  }

  const tunnelCp = CHECKPOINTS[5];
  if (Math.abs(surfaceY(tunnelCp.x, tunnelCp.z) - (-12)) > 0.01) {
    problems.push("tunnel checkpoint is not on the shaft floor");
  }
  if (!covered(tunnelCp.x, tunnelCp.z)) problems.push("tunnel checkpoint is not covered");

  for (const b of BUILDINGS) {
    if (b.x > SHAFT.x0 && b.x < RAMP_OUT.x1 && b.z > SHAFT.z0 && b.z < SHAFT.z1) {
      problems.push(`${b.id} sits on the tunnel corridor`);
    }
  }
  return problems;
}
