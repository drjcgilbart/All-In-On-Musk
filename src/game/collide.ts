import type { Sphere } from "./drive";
import { carForward } from "./drive";
import { BUILDINGS, COLUMNS, bounds, poles, tunnelWalls, type Box, type Column } from "./layout";

const BOXES = [...BUILDINGS, ...bounds(), ...tunnelWalls(), ...poles()];

export function resolveBody(
  x: number,
  z: number,
  yaw: number,
  spheres: Sphere[],
  y: number,
) {
  let hit = false;
  let cx = x;
  let cz = z;
  const fwd = carForward(yaw);
  for (let pass = 0; pass < 2; pass++) {
    for (const sphere of spheres) {
      const sx = cx + fwd.x * sphere.oz;
      const sz = cz + fwd.z * sphere.oz;
      const solved = pushSphere(sx, sz, sphere.r, y);
      if (solved.hit) {
        hit = true;
        cx += solved.x - sx;
        cz += solved.z - sz;
      }
    }
  }
  return { x: cx, z: cz, hit };
}

function pushSphere(x: number, z: number, radius: number, y: number) {
  let hit = false;
  let px = x;
  let pz = z;
  for (const box of BOXES) {
    if (y < box.base - 0.4 || y > box.base + box.h) continue;
    const minX = box.x - box.w / 2;
    const maxX = box.x + box.w / 2;
    const minZ = box.z - box.d / 2;
    const maxZ = box.z + box.d / 2;
    const closestX = Math.max(minX, Math.min(px, maxX));
    const closestZ = Math.max(minZ, Math.min(pz, maxZ));
    const dx = px - closestX;
    const dz = pz - closestZ;
    const d2 = dx * dx + dz * dz;
    if (d2 >= radius * radius) continue;
    hit = true;
    if (d2 < 1e-8) {
      const left = px - minX;
      const right = maxX - px;
      const south = pz - minZ;
      const north = maxZ - pz;
      const m = Math.min(left, right, south, north);
      if (m === left) px = minX - radius;
      else if (m === right) px = maxX + radius;
      else if (m === south) pz = minZ - radius;
      else pz = maxZ + radius;
    } else {
      const d = Math.sqrt(d2);
      const push = (radius - d) / d;
      px += dx * push;
      pz += dz * push;
    }
  }
  for (const column of COLUMNS) {
    if (y < column.base - 0.4 || y > column.base + column.h) continue;
    const moved = pushCircle(px, pz, radius, column);
    px = moved.x;
    pz = moved.z;
    if (moved.hit) hit = true;
  }
  return { x: px, z: pz, hit };
}

function pushCircle(x: number, z: number, radius: number, column: Column) {
  const dx = x - column.x;
  const dz = z - column.z;
  const minR = column.r + radius;
  const d2 = dx * dx + dz * dz;
  if (d2 >= minR * minR) return { x, z, hit: false };
  const d = Math.sqrt(d2) || 0.0001;
  const push = (minR - d) / d;
  return { x: x + dx * push, z: z + dz * push, hit: true };
}

export function staticBoxes(): Box[] {
  return BOXES;
}
