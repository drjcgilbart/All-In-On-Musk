/**
 * Tesla World Racer — standalone fan race.
 * Playable file is midnight-grid.html (Three.js inlined). Edit this file, then
 * run `node build-midnight-grid.mjs` from this folder to rebuild it.
 * Car nose is local −z. Heading is rotation.y = atan2(−dx, −dz).
 * A right turn lowers yaw. Camera chase uses the same forward vector.
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { Sky } from "three/addons/objects/Sky.js";

const LAPS = 2;
const ROAD_HALF = 7.2;
const WALL_OFFSET = 9.05;
// Bore is wider than the real Loop so the Semi (about 4 m tall) clears. Crown and chord come from this one circle.
const BORE_R = 3.9;
const BORE_Y = 1.4;
const TUNNEL_DEPTH = 7.4;
const TUNNEL_RAMP = 20;
const TUNNEL_SPAN = 78;
// One entry per soundtrack. Files sit next to midnight-grid.html and play in order, then loop.
// id "none" is the silent choice and is not listed here.
const SOUNDTRACKS = [
  { id: "neon-velocity-1", name: "Neon Velocity 1", files: ["neon-velocity-1.m4a"] },
  { id: "neon-velocity-2", name: "Neon Velocity 2", files: ["neon-velocity-2.m4a"] },
  { id: "cyber-necrosis-1", name: "Cyber Necrosis 1", files: ["cyber-necrosis-1.m4a"] },
  { id: "cyber-necrosis-2", name: "Cyber Necrosis 2", files: ["cyber-necrosis-2.m4a"] },
];
// Keyboard, touch, and the stick ease toward the held angle, then back to 0 on release.
// The steer slider multiplies this. Higher is quicker.
const STEER_RESPONSE = 3.1;
// Cold gas thrusters are a short Roadster hop. The tank is about a second and a half, then it refills slowly.
const THRUST_FUEL = 1.35;
const THRUST_REFILL = 0.22;
const THRUST_CEIL = 2.35;
const THRUST_PUSH = 26;
const THRUST_GRAV = 18;
// How far inside the bore skin the Roadster's wheels sit while it drives the wall.
const BORE_SKIN = 0.34;

const VEHICLES = [
  { id: "model3", name: "Model 3", blurb: "The balanced car. Point it and it stays there.", kind: "sedan", accel: 9, brake: 16, top: 70, grip: 1.05, steer: 1.55, mass: 1.8, ride: 0.16, width: 1.85, length: 4.7, height: 1.15, color: 0xd7dde6, spheres: [{ oz: 0.2, r: 1.15 }] },
  { id: "modely", name: "Model Y", blurb: "Taller, softer, a little slower to turn in.", kind: "crossover", accel: 8, brake: 15, top: 64, grip: 0.98, steer: 1.4, mass: 2, ride: 0.24, width: 1.92, length: 4.8, height: 1.35, color: 0xf2f4f7, spheres: [{ oz: 0.1, r: 1.2 }] },
  { id: "models", name: "Model S", blurb: "Long, fast, planted in the sweepers.", kind: "fastback", accel: 10.5, brake: 16, top: 78, grip: 1.02, steer: 1.45, mass: 2.2, ride: 0.14, width: 1.96, length: 5.05, height: 1.12, color: 0xb3122a, spheres: [{ oz: 0.2, r: 1.22 }] },
  { id: "modelx", name: "Model X", blurb: "Heavy doors, heavy car. It still moves.", kind: "crossover", accel: 7.6, brake: 14, top: 62, grip: 0.96, steer: 1.28, mass: 2.6, ride: 0.26, width: 2.05, length: 5.05, height: 1.42, color: 0x1c1f26, spheres: [{ oz: 0.1, r: 1.28 }] },
  { id: "cybertruck", name: "Cybertruck", blurb: "Stainless, wide, and hard to unsettle.", kind: "wedge", accel: 8.4, brake: 14, top: 68, grip: 1.18, steer: 1.22, mass: 3.2, ride: 0.32, width: 2.05, length: 5.7, height: 1.55, color: 0xd5dce6, spheres: [{ oz: 0.3, r: 1.35 }] },
  { id: "semi", name: "Semi", blurb: "Slow to leave. Almost nothing stops it.", kind: "truck", accel: 2.4, brake: 8, top: 32, grip: 1.25, steer: 0.72, mass: 16, ride: 0.55, width: 2.5, length: 8.3, height: 3.95, color: 0xf6f7f8, spheres: [{ oz: 1.2, r: 1.65 }, { oz: -1.85, r: 1.4 }] },
  { id: "roadster", name: "Roadster", blurb: "Fastest on the grid. T is a short hop. In the tunnel it can take the walls.", kind: "roadster", accel: 14, brake: 18, top: 98, grip: 0.9, steer: 1.75, mass: 1.25, ride: 0.08, width: 1.87, length: 3.94, height: 1.13, color: 0xc8102a, spheres: [{ oz: 0.05, r: 1.05 }] },
  // Published cap is 85 mph. Length 4.35, width 1.75, height 1.41, wheelbase 2.63.
  { id: "cybercab", name: "Cybercab", blurb: "Two seats, no wheel. It just takes you there. Tops out at 85.", kind: "cab", accel: 5.4, brake: 12, top: 38, grip: 1.12, steer: 1.32, mass: 1.45, ride: 0.16, width: 1.75, length: 4.35, height: 1.41, color: 0xc6a15a, spheres: [{ oz: 0.05, r: 1.18 }] },
];

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function wrapAngle(a) {
  let x = a;
  while (x > Math.PI) x -= Math.PI * 2;
  while (x < -Math.PI) x += Math.PI * 2;
  return x;
}

/** World forward for a rig whose rotation.y is yaw and whose nose is local −z. yaw 0 → (0, −1). */
function carForward(yaw) {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return { x: -s, z: -c };
}

/** yaw such that carForward(yaw) matches unit direction (x, z). */
function yawFromForward(x, z) {
  return Math.atan2(-x, -z);
}

/** Right of a ground forward. (0, −1) → (1, 0). */
function rightOf(fwd) {
  return { x: -fwd.z, z: fwd.x };
}

/**
 * Car basis. Nose is (fx, fz). Up is world +Y unless upRight/upY tilt it in the cross-section.
 * upRight is the component along track-right. Local +X is right, local −Z is the nose.
 * yaw 0, upright → right (1,0,0), up (0,1,0), nose (0,−1).
 */
function boreAxes(yaw, upRight, upY) {
  const fwd = carForward(yaw);
  let ux = 0;
  let uy = 1;
  let uz = 0;
  if (upRight != null) {
    const side = rightOf(fwd);
    ux = side.x * upRight;
    uy = upY;
    uz = side.z * upRight;
    const len = Math.hypot(ux, uy, uz) || 1;
    ux /= len;
    uy /= len;
    uz /= len;
  }
  const fx = fwd.x;
  const fz = fwd.z;
  return {
    fx, fz,
    rx: -fz * uy,
    ry: fz * ux - fx * uz,
    rz: fx * uy,
    ux, uy, uz,
  };
}

const _poseX = new THREE.Vector3();
const _poseY = new THREE.Vector3();
const _poseZ = new THREE.Vector3();
const _poseM = new THREE.Matrix4();

function poseCarRoot(root, yaw, upRight, upY) {
  const axes = boreAxes(yaw, upRight, upY);
  _poseX.set(axes.rx, axes.ry, axes.rz);
  _poseY.set(axes.ux, axes.uy, axes.uz);
  _poseZ.set(-axes.fx, 0, -axes.fz);
  root.quaternion.setFromRotationMatrix(_poseM.makeBasis(_poseX, _poseY, _poseZ));
}

function createDriveState(x, z, yaw) {
  return {
    x, z, yaw, speed: 0, battery: 100, cp: 0, lap: 1, leftStart: false,
    ludicrous: false, assist: 0, assistMode: "none", finished: false, hit: false,
    empCharge: 1, empStun: 0, empSpin: 1, empCool: 0,
    boreOn: false, boreA: 0, boreH: 0, boreUpRight: 0, boreUpY: 1,
    lift: 0, liftV: 0, thrustFuel: THRUST_FUEL, thrustOn: false,
    hull: 1, crashLatch: false, impact: 0, crashFx: 0,
  };
}

function hullScale(state) {
  const hull = state && state.hull != null ? state.hull : 1;
  return {
    hull,
    accel: 0.28 + 0.72 * hull,
    top: 0.38 + 0.62 * hull,
    steer: 0.62 + 0.38 * hull,
  };
}

function stepDrive(state, input, spec, dt, aim, gripMul, resolve, checkpoints, lapsToWin) {
  if (input.ludicrousToggle && state.battery > 12) state.ludicrous = !state.ludicrous;
  if (state.ludicrous && state.battery <= 4) state.ludicrous = false;

  if (input.autopilot && state.battery > 10 && state.assistMode !== "auto") {
    state.assistMode = "auto";
    state.assist = 6;
    state.battery = Math.max(0, state.battery - 8);
  }
  if (input.fsd && state.battery > 16 && state.assistMode !== "fsd") {
    state.assistMode = "fsd";
    state.assist = 4.5;
    state.battery = Math.max(0, state.battery - 14);
  }
  if (state.assist > 0) {
    state.assist = Math.max(0, state.assist - dt);
    if (state.assist === 0) state.assistMode = "none";
  }

  let steer = clamp(input.steer, -1, 1);
  let throttle = clamp(input.throttle, 0, 1);
  let brake = clamp(input.brake, 0, 1);

  if (state.assist > 0 && aim && state.assistMode !== "none") {
    const desired = yawFromForward(aim.x - state.x, aim.z - state.z);
    const diff = wrapAngle(desired - state.yaw);
    const autoSteer = clamp(-diff * 2.4, -1, 1);
    if (state.assistMode === "fsd") {
      steer = autoSteer;
      const target = spec.top * (state.ludicrous ? 1.12 : 0.82);
      throttle = state.speed < target ? 1 : 0.15;
      brake = state.speed > target * 1.08 ? 0.6 : 0;
    } else {
      steer = clamp(steer * 0.35 + autoSteer * 0.75, -1, 1);
    }
  }

  const boost = input.boost && state.battery > 6 && throttle > 0.2;
  const limp = state.battery <= 0 ? 0.35 : 1;
  const lud = state.ludicrous ? 1.16 : 1;
  const boostMul = boost ? 1.08 : 1;
  const hull = hullScale(state);
  let limit = spec.top * hull.top * lud * boostMul;
  if (state.driveLimit) limit = Math.max(limit, state.driveLimit);
  const accel = spec.accel * hull.accel * (state.ludicrous ? 1.45 : 1) * (boost ? 1.2 : 1) * limp;

  if (throttle > 0 && state.speed < limit) {
    const fade = 1 - Math.max(0, state.speed) / (limit * 1.08);
    state.speed += accel * throttle * Math.max(0.15, fade) * dt;
  }
  if (brake > 0) state.speed -= spec.brake * brake * dt;
  if (throttle === 0 && brake === 0) state.speed -= Math.sign(state.speed) * 1.6 * dt;
  if (state.speed > limit) state.speed = limit;
  if (state.speed < -7) state.speed = -7;
  if (Math.abs(state.speed) < 0.15 && throttle === 0 && brake === 0) state.speed = 0;

  const rate = spec.steer * spec.grip * hull.steer * gripMul * (0.5 + 0.5 * Math.min(Math.abs(state.speed) / 16, 1));
  state.yaw = wrapAngle(state.yaw - steer * rate * dt);

  const fwd = carForward(state.yaw);
  state.x += fwd.x * state.speed * dt;
  state.z += fwd.z * state.speed * dt;

  const solved = resolve(state.x, state.z, state.yaw, spec);
  state.x = solved.x;
  state.z = solved.z;
  state.hit = solved.hit;
  state.impact = solved.hit ? Math.abs(state.speed) : 0;
  // A brush along the bore should not throw away the tunnel draft.
  if (solved.hit) state.speed *= spec.mass >= 10 ? 0.96 : (state.boreDraft ? 0.9 : 0.62);

  let drain = throttle * 2.1;
  if (boost) drain += 6;
  if (state.ludicrous) drain += 7;
  let regen = 0;
  if (throttle < 0.18 && brake < 0.12) regen += 4.5 + Math.min(Math.abs(state.speed) * 0.03, 3);
  if (brake > 0.2 && state.speed > 4) regen += brake * 6;
  state.battery = clamp(state.battery - drain * dt + regen * dt, 0, 100);
  state.boosting = boost;

  const next = (state.cp + 1) % checkpoints.length;
  const gate = checkpoints[next];
  const dx = state.x - gate.x;
  const dz = state.z - gate.z;
  if (!state.leftStart && state.cp === 0) {
    const sdx = state.x - checkpoints[0].x;
    const sdz = state.z - checkpoints[0].z;
    if (sdx * sdx + sdz * sdz > 24 * 24) state.leftStart = true;
  }
  if (dx * dx + dz * dz < 18 * 18) {
    if (!(next === 0 && !state.leftStart)) {
      state.cp = next;
      if (next === 0) {
        state.lap += 1;
        if (state.lap > lapsToWin) state.finished = true;
      }
    }
  }
  return { steer, throttle, brake };
}

function pushOBB(px, pz, radius, obb) {
  const c = Math.cos(obb.yaw);
  const s = Math.sin(obb.yaw);
  const dx = px - obb.x;
  const dz = pz - obb.z;
  let lx = dx * c - dz * s;
  let lz = dx * s + dz * c;
  const hx = obb.hx;
  const hz = obb.hz;
  const cx = Math.max(-hx, Math.min(lx, hx));
  const cz = Math.max(-hz, Math.min(lz, hz));
  const ox = lx - cx;
  const oz = lz - cz;
  const d2 = ox * ox + oz * oz;
  if (d2 >= radius * radius) return { x: px, z: pz, hit: false };
  if (d2 < 1e-8) {
    const left = lx + hx;
    const right = hx - lx;
    const back = lz + hz;
    const front = hz - lz;
    const m = Math.min(left, right, back, front);
    if (m === left) lx = -hx - radius;
    else if (m === right) lx = hx + radius;
    else if (m === back) lz = -hz - radius;
    else lz = hz + radius;
  } else {
    const push = (radius - Math.sqrt(d2)) / Math.sqrt(d2);
    lx += ox * push;
    lz += oz * push;
  }
  return { x: obb.x + lx * c + lz * s, z: obb.z - lx * s + lz * c, hit: true };
}

function pushCircle(x, z, radius, column) {
  const dx = x - column.x;
  const dz = z - column.z;
  const minR = column.r + radius;
  const d2 = dx * dx + dz * dz;
  if (d2 >= minR * minR) return { x, z, hit: false };
  const d = Math.sqrt(d2) || 0.0001;
  const push = (minR - d) / d;
  return { x: x + dx * push, z: z + dz * push, hit: true };
}

function resolveBody(x, z, yaw, spec, boxes, columns, actors, worldY) {
  let hit = false;
  let cx = x;
  let cz = z;
  const fwd = carForward(yaw);
  const y = Number.isFinite(worldY) ? worldY : spec.ride;
  const extras = actors || [];
  for (let pass = 0; pass < 2; pass++) {
    for (const sphere of spec.spheres) {
      let sx = cx + fwd.x * sphere.oz;
      let sz = cz + fwd.z * sphere.oz;
      for (const box of boxes) {
        if (y < box.base - 0.4 || y > box.base + box.h) continue;
        const solved = pushOBB(sx, sz, sphere.r, box);
        if (solved.hit) {
          hit = true;
          sx = solved.x;
          sz = solved.z;
        }
      }
      for (const column of columns) {
        if (y < column.base - 0.4 || y > column.base + column.h) continue;
        const solved = pushCircle(sx, sz, sphere.r, column);
        if (solved.hit) {
          hit = true;
          sx = solved.x;
          sz = solved.z;
        }
      }
      for (const actor of extras) {
        if (y < actor.base - 0.4 || y > actor.base + actor.h) continue;
        const solved = pushCircle(sx, sz, sphere.r, actor);
        if (solved.hit) {
          hit = true;
          sx = solved.x;
          sz = solved.z;
        }
      }
      cx += sx - (cx + fwd.x * sphere.oz);
      cz += sz - (cz + fwd.z * sphere.oz);
    }
  }
  return { x: cx, z: cz, hit };
}

/** One circle for the tunnel mesh and its wall colliders. yaw 0 chord is ±x at y = 0. */
function boreProfile() {
  const arch = Math.acos(clamp(-BORE_Y / BORE_R, -1, 1));
  return { arch, chord: Math.sin(arch) * BORE_R, crown: BORE_Y + BORE_R };
}

/** Vertical span of the body above the road, in meters. Ceiling driving hangs below its root. */
function bodySpan(racer) {
  const state = racer.state;
  const root = state.boreOn ? (state.boreH || 0) : (state.lift || 0);
  const up = state.boreOn ? (state.boreUpY ?? 1) : 1;
  const h = racer.spec.height;
  return { bot: root + Math.min(0, up) * h, top: root + Math.max(0, up) * h };
}

function separateCars(a, b) {
  const spanA = bodySpan(a);
  const spanB = bodySpan(b);
  if (spanA.top < spanB.bot - 0.35 || spanB.top < spanA.bot - 0.35) return false;
  const dx = b.state.x - a.state.x;
  const dz = b.state.z - a.state.z;
  const min = a.spec.spheres[0].r + b.spec.spheres[0].r;
  const d = Math.hypot(dx, dz);
  if (d >= min || d < 1e-4) return false;
  const push = (min - d) / d;
  const inv = 1 / (a.spec.mass + b.spec.mass);
  a.state.x -= dx * push * b.spec.mass * inv;
  a.state.z -= dz * push * b.spec.mass * inv;
  b.state.x += dx * push * a.spec.mass * inv;
  b.state.z += dz * push * a.spec.mass * inv;
  const impactA = Math.abs(a.state.speed);
  const impactB = Math.abs(b.state.speed);
  a.state.speed *= a.spec.mass >= 10 ? 0.96 : 0.7;
  b.state.speed *= b.spec.mass >= 10 ? 0.96 : 0.7;
  a.state.hit = true;
  b.state.hit = true;
  if (!(a.state.impact > 0)) a.state.impact = impactA;
  if (!(b.state.impact > 0)) b.state.impact = impactB;
  a.state.carHit = true;
  b.state.carHit = true;
  return true;
}

function hash2(ix, iy) {
  let n = (ix * 374761393 + iy * 668265263) | 0;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}

function valueNoise(x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = hash2(x0, y0);
  const b = hash2(x0 + 1, y0);
  const c = hash2(x0, y0 + 1);
  const d = hash2(x0 + 1, y0 + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x, y) {
  let f = 0;
  let a = 0.5;
  let s = 0;
  for (let i = 0; i < 5; i++) {
    f += valueNoise(x, y) * a;
    s += a;
    x *= 2.05;
    y *= 2.05;
    a *= 0.5;
  }
  return f / s;
}

function makeMaps(size, paint) {
  const color = document.createElement("canvas");
  const normal = document.createElement("canvas");
  const rough = document.createElement("canvas");
  color.width = normal.width = rough.width = size;
  color.height = normal.height = rough.height = size;
  const cg = color.getContext("2d");
  const ng = normal.getContext("2d");
  const rg = rough.getContext("2d");
  const cimg = cg.createImageData(size, size);
  const nimg = ng.createImageData(size, size);
  const rimg = rg.createImageData(size, size);
  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      height[y * size + x] = fbm(x / 48, y / 48);
    }
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const h = height[y * size + x];
      const i = (y * size + x) * 4;
      const rgb = paint(h, hash2(x, y));
      cimg.data[i] = rgb[0];
      cimg.data[i + 1] = rgb[1];
      cimg.data[i + 2] = rgb[2];
      cimg.data[i + 3] = 255;
      const hl = height[y * size + ((x + size - 1) % size)];
      const hr = height[y * size + ((x + 1) % size)];
      const hd = height[((y + size - 1) % size) * size + x];
      const hu = height[((y + 1) % size) * size + x];
      const dx = (hr - hl) * 4;
      const dy = (hu - hd) * 4;
      const len = Math.hypot(dx, dy, 1);
      nimg.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      nimg.data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      nimg.data[i + 2] = (1 / len) * 0.5 * 255 + 128;
      nimg.data[i + 3] = 255;
      const roughV = paint.rough ? paint.rough(h) : 210 - h * 40;
      rimg.data[i] = rimg.data[i + 1] = rimg.data[i + 2] = roughV;
      rimg.data[i + 3] = 255;
    }
  }
  cg.putImageData(cimg, 0, 0);
  ng.putImageData(nimg, 0, 0);
  rg.putImageData(rimg, 0, 0);
  const toTex = (canvas, srgb) => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    tex.anisotropy = 8;
    return tex;
  };
  return { color: toTex(color, true), normal: toTex(normal, false), rough: toTex(rough, false) };
}

function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

function buildSamples(controls, count) {
  const m = controls.length;
  const pts = [];
  for (let i = 0; i < count; i++) {
    const f = (i / count) * m;
    const i1 = Math.floor(f) % m;
    const local = f - Math.floor(f);
    const i0 = (i1 - 1 + m) % m;
    const i2 = (i1 + 1) % m;
    const i3 = (i1 + 2) % m;
    pts.push({
      x: catmull(controls[i0][0], controls[i1][0], controls[i2][0], controls[i3][0], local),
      z: catmull(controls[i0][1], controls[i1][1], controls[i2][1], controls[i3][1], local),
      y: 0,
    });
  }
  for (let i = 0; i < count; i++) {
    const n = pts[(i + 1) % count];
    let fx = n.x - pts[i].x;
    let fz = n.z - pts[i].z;
    const len = Math.hypot(fx, fz) || 1;
    fx /= len;
    fz /= len;
    pts[i].fx = fx;
    pts[i].fz = fz;
    pts[i].rx = -fz;
    pts[i].rz = fx;
    pts[i].ds = len;
  }
  let dist = 0;
  for (const p of pts) {
    p.dist = dist;
    dist += p.ds;
  }
  pts.lapLength = dist;
  return pts;
}

function mulberry32(seed) {
  let a = seed | 0;
  return function rand() {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function controlDeflection(pts, index) {
  const n = pts.length;
  const prev = pts[(index - 1 + n) % n];
  const cur = pts[index];
  const next = pts[(index + 1) % n];
  const a0 = Math.atan2(cur[1] - prev[1], cur[0] - prev[0]);
  const a1 = Math.atan2(next[1] - cur[1], next[0] - cur[0]);
  return Math.abs(wrapAngle(a1 - a0));
}

// Medium keeps the original rival pace. The plan shape is a rounded polygon, not a circle.
// Higher levels add corners, a deeper bite, and a tighter minimum radius. Every control
// corner stays under 60°. Expert's tightest corner is always inside medium's floor.
const LEVELS = {
  novice: {
    id: "novice", base: 200, baseSpan: 28,
    corners: 5, cornerSpan: 2, gap: 0.35, rad: 0.38, bite: 0.78, smooth: 5,
    spreadMin: 1.18, bendMin: 3,
    maxStep: 0.12, minRadius: 88,
    hillLo: 1.45, hillHi: 0.55, hillGrade: 0.04, hillMin: 1.2,
    bridgeLo: 5.35, bridgeHi: 0.45, bridgeGrade: 0.048, bridgeMin: 5.1,
    bankMul: 1.8, bankMax: 0.1, crossings: 0,
    pace: 0.46, paceWave: 0.03, look: 14, steer: 1.35, wander: 2.2,
    empRange: 0, empDot: 0.99, crossCool: 1, blockTime: 3.4,
  },
  medium: {
    id: "medium", base: 156, baseSpan: 36,
    corners: 7, cornerSpan: 2, gap: 0.7, rad: 0.62, bite: 0.58, smooth: 4,
    spreadMin: 1.34, bendMin: 5,
    maxStep: 0.18, minRadius: 58,
    hillLo: 2.6, hillHi: 1.6, hillGrade: 0.07, hillMin: 2,
    bridgeLo: 7.6, bridgeHi: 1.1, bridgeGrade: 0.075, bridgeMin: 6.5,
    bankMul: 3.4, bankMax: 0.22, crossings: 3,
    pace: 0.62, paceWave: 0.08, look: 24, steer: 2.4, wander: 0,
    empRange: 38, empDot: 0.85, crossCool: 1, blockTime: 3.4,
  },
  expert: {
    id: "expert", base: 148, baseSpan: 18,
    corners: 8, cornerSpan: 2, gap: 0.85, rad: 0.75, bite: 0.5, smooth: 4,
    spreadMin: 1.42, bendMin: 7,
    maxStep: 0.32, minRadius: 34, maxRadius: 56,
    hillLo: 4.25, hillHi: 0.6, hillGrade: 0.072, hillMin: 4.1,
    bridgeLo: 9.05, bridgeHi: 0.85, bridgeGrade: 0.078, bridgeMin: 8.9,
    bankMul: 4.4, bankMax: 0.32, crossings: 3,
    pace: 0.88, paceWave: 0.03, look: 32, steer: 3.5, wander: 0,
    empRange: 52, empDot: 0.72, crossCool: 0.4, blockTime: 5.2,
  },
};

function courseLevel(id) {
  return LEVELS[id] || LEVELS.medium;
}

function levelLabel(id) {
  if (id === "novice") return "Novice";
  if (id === "expert") return "Expert";
  return "Medium";
}

function chaikin(pts) {
  const n = pts.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
    out.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
  }
  return out;
}

function segmentsCross(ax, az, bx, bz, cx, cz, dx, dz) {
  const abx = bx - ax;
  const abz = bz - az;
  const cdx = dx - cx;
  const cdz = dz - cz;
  const den = abx * cdz - abz * cdx;
  if (Math.abs(den) < 1e-8) return false;
  const acx = cx - ax;
  const acz = cz - az;
  const t = (acx * cdz - acz * cdx) / den;
  const u = (acx * abz - acz * abx) / den;
  return t > 0.03 && t < 0.97 && u > 0.03 && u < 0.97;
}

function loopCrosses(pts, skip) {
  const n = pts.length;
  const xOf = (p) => (p.x == null ? p[0] : p.x);
  const zOf = (p) => (p.z == null ? p[1] : p.z);
  for (let i = 0; i < n; i++) {
    for (let j = i + skip; j < n; j++) {
      if ((j + 1) % n === i) continue;
      if (Math.min(j - i, i + n - j) < skip) continue;
      const a = pts[i];
      const b = pts[(i + 1) % n];
      const c = pts[j];
      const d = pts[(j + 1) % n];
      if (segmentsCross(xOf(a), zOf(a), xOf(b), zOf(b), xOf(c), zOf(c), xOf(d), zOf(d))) return true;
    }
  }
  return false;
}

function radialSpread(pts) {
  let cx = 0;
  let cz = 0;
  const xOf = (p) => (p.x == null ? p[0] : p.x);
  const zOf = (p) => (p.z == null ? p[1] : p.z);
  for (const p of pts) {
    cx += xOf(p);
    cz += zOf(p);
  }
  cx /= pts.length;
  cz /= pts.length;
  let minR = Infinity;
  let maxR = 0;
  for (const p of pts) {
    const r = Math.hypot(xOf(p) - cx, zOf(p) - cz);
    minR = Math.min(minR, r);
    maxR = Math.max(maxR, r);
  }
  return { ratio: maxR / Math.max(1, minR), minR, maxR };
}

function bendCount(samples) {
  const n = samples.length;
  const curve = new Array(n);
  for (let i = 0; i < n; i++) {
    const a = samples[i];
    const b = samples[(i + 1) % n];
    curve[i] = Math.abs(wrapAngle(yawFromForward(b.fx, b.fz) - yawFromForward(a.fx, a.fz)));
  }
  let peaks = 0;
  for (let i = 0; i < n; i++) {
    const prev = curve[(i - 2 + n) % n];
    const here = curve[i];
    const next = curve[(i + 2) % n];
    if (here > prev && here >= next && here > 0.025) peaks += 1;
  }
  return peaks;
}

/**
 * Closed circuit. Vertices stay in angle order so the polygon cannot cross itself,
 * then corner-cutting rounds them into a racing line. A bite or a lobe keeps it off a circle.
 * Returns null when a control corner would pass 60°.
 */
function makeControls(rng, level) {
  const corners = level.corners + Math.floor(rng() * level.cornerSpan);
  const gaps = [];
  let gapSum = 0;
  for (let i = 0; i < corners; i++) {
    const gap = 0.62 + rng() * level.gap;
    gaps.push(gap);
    gapSum += gap;
  }
  const radii = [];
  for (let i = 0; i < corners; i++) radii.push(0.62 + rng() * level.rad);
  const bite = Math.floor(rng() * corners);
  const style = Math.floor(rng() * 3);
  if (style === 1 && corners >= 6) {
    radii[bite] *= level.bite;
    radii[(bite + (corners >> 1)) % corners] *= Math.min(0.92, level.bite + 0.12);
  } else if (style === 2) {
    radii[bite] *= 1 + (1 - level.bite) * 0.85;
  } else {
    radii[bite] *= level.bite;
  }
  let angle = rng() * Math.PI * 2;
  let pts = [];
  for (let i = 0; i < corners; i++) {
    angle += (gaps[i] / gapSum) * Math.PI * 2;
    pts.push([Math.cos(angle) * radii[i], Math.sin(angle) * radii[i]]);
  }
  for (let pass = 0; pass < level.smooth; pass++) pts = chaikin(pts);
  let cx = 0;
  let cz = 0;
  for (const p of pts) {
    cx += p[0];
    cz += p[1];
  }
  cx /= pts.length;
  cz /= pts.length;
  let mean = 0;
  for (const p of pts) mean += Math.hypot(p[0] - cx, p[1] - cz);
  mean /= pts.length;
  const target = level.base + rng() * level.baseSpan;
  const scale = target / Math.max(1e-3, mean);
  for (const p of pts) {
    p[0] = (p[0] - cx) * scale;
    p[1] = (p[1] - cz) * scale;
  }
  let worst = 0;
  for (let i = 0; i < pts.length; i++) worst = Math.max(worst, controlDeflection(pts, i));
  if (worst > Math.PI / 3) return null;
  if (loopCrosses(pts, 2)) return null;
  pts.maxControl = worst;
  return pts;
}

function courseCurvature(samples) {
  let maxStep = 0;
  let minRadius = Infinity;
  for (let i = 0; i < samples.length; i++) {
    const a = samples[i];
    const b = samples[(i + 1) % samples.length];
    const step = Math.abs(wrapAngle(yawFromForward(b.fx, b.fz) - yawFromForward(a.fx, a.fz)));
    maxStep = Math.max(maxStep, step);
    if (step > 0.012) minRadius = Math.min(minRadius, a.ds / step);
  }
  return { maxStep, minRadius };
}

function rotateSamples(samples, startAt) {
  const next = samples.slice(startAt).concat(samples.slice(0, startAt));
  let travelled = 0;
  for (const sample of next) {
    sample.dist = travelled;
    travelled += sample.ds;
    sample.y = 0;
    sample.bank = 0;
    sample.role = "flat";
    sample.half = ROAD_HALF;
  }
  next.lapLength = travelled;
  return next;
}

function paintBump(samples, start, span, peak, ramp) {
  const role = peak >= 5 ? "bridge" : "hill";
  for (let k = 0; k < span; k++) {
    const index = (start + k) % samples.length;
    let grade;
    if (k < ramp) grade = k / ramp;
    else if (k > span - 1 - ramp) grade = (span - 1 - k) / ramp;
    else grade = 1;
    const smooth = grade * grade * (3 - 2 * grade);
    samples[index].y = peak * smooth;
    samples[index].role = smooth > 0.2 ? role : samples[index].role;
  }
}

function seekFlat(samples, tunnel, start) {
  const n = samples.length;
  for (let step = 0; step < n; step++) {
    const index = (start + step) % n;
    if (index < 18 || index > n - 18) continue;
    const sample = samples[index];
    const role = sample.role;
    if (role === "tunnel" || role === "hill" || role === "bridge") continue;
    if (Math.abs(sample.y || 0) > 0.35) continue;
    if (index >= tunnel.start - 10 && index <= tunnel.start + tunnel.span + 10) continue;
    return index;
  }
  return -1;
}

function rangesOverlap(startA, spanA, startB, spanB, length) {
  const hit = (index) => {
    let u = index - startB;
    if (u < 0) u += length;
    return u < spanB;
  };
  for (let k = 0; k < spanA; k++) {
    if (hit((startA + k) % length)) return true;
  }
  return false;
}

function generateCourse(seed, levelId) {
  const level = courseLevel(levelId);
  const bore = boreProfile();
  for (let attempt = 0; attempt < 32; attempt++) {
    const rng = mulberry32((seed + attempt * 9973) | 0);
    const controls = makeControls(rng, level);
    if (!controls) continue;
    const raw = buildSamples(controls, 340);
    let straight = 0;
    let straightScore = Infinity;
    for (let i = 0; i < raw.length; i++) {
      let score = 0;
      for (let k = 0; k < 8; k++) {
        const a = raw[(i + k) % raw.length];
        const b = raw[(i + k + 1) % raw.length];
        score += Math.abs(wrapAngle(yawFromForward(b.fx, b.fz) - yawFromForward(a.fx, a.fz)));
      }
      if (score < straightScore) {
        straightScore = score;
        straight = i;
      }
    }
    const samples = rotateSamples(raw, straight);
    const curve = courseCurvature(samples);
    if (curve.maxStep > level.maxStep || curve.minRadius < level.minRadius) continue;
    if (level.maxRadius && curve.minRadius > level.maxRadius) continue;
    if (loopCrosses(samples, 8)) continue;
    const spread = radialSpread(samples);
    if (spread.ratio < level.spreadMin) continue;
    const bends = bendCount(samples);
    if (bends < level.bendMin) continue;
    const avg = samples.lapLength / samples.length;
    const hillPeak = level.hillLo + rng() * level.hillHi;
    const hillRamp = Math.max(12, Math.ceil(hillPeak / (level.hillGrade * avg)));
    const hillSpan = hillRamp * 2 + 8;
    const bridgePeak = level.bridgeLo + rng() * level.bridgeHi;
    const bridgeRamp = Math.max(16, Math.ceil(bridgePeak / (level.bridgeGrade * avg)));
    const bridgeSpan = bridgeRamp * 2 + 10;
    const hillAt = 32;
    const bridgeAt = hillAt + hillSpan + 18;
    if (bridgeAt + bridgeSpan > samples.length - TUNNEL_SPAN - 30) continue;
    paintBump(samples, hillAt, hillSpan, hillPeak, hillRamp);
    paintBump(samples, bridgeAt, bridgeSpan, bridgePeak, bridgeRamp);
    let tunnelAt = -1;
    let tunnelFar = -1;
    let cx = 0;
    let cz = 0;
    for (const sample of samples) {
      cx += sample.x;
      cz += sample.z;
    }
    cx /= samples.length;
    cz /= samples.length;
    for (let i = 24; i < samples.length - TUNNEL_SPAN - 10; i++) {
      if (rangesOverlap(i, TUNNEL_SPAN, hillAt, hillSpan, samples.length)) continue;
      if (rangesOverlap(i, TUNNEL_SPAN, bridgeAt, bridgeSpan, samples.length)) continue;
      if (i < 28) continue;
      const mid = samples[i + (TUNNEL_SPAN >> 1)];
      const away = Math.hypot(mid.x - cx, mid.z - cz);
      if (away > tunnelFar) {
        tunnelFar = away;
        tunnelAt = i;
      }
    }
    if (tunnelAt < 0) continue;
    const tunnel = { start: tunnelAt, span: TUNNEL_SPAN };
    for (let i = 0; i < samples.length; i++) {
      const u = i - tunnel.start;
      if (u < 0 || u >= tunnel.span) continue;
      let grade;
      if (u < TUNNEL_RAMP) grade = u / TUNNEL_RAMP;
      else if (u > tunnel.span - 1 - TUNNEL_RAMP) grade = (tunnel.span - 1 - u) / TUNNEL_RAMP;
      else grade = 1;
      const smooth = grade * grade * (3 - 2 * grade);
      samples[i].y = -TUNNEL_DEPTH * smooth;
      samples[i].role = "tunnel";
      samples[i].bank = 0;
    }
    const boreRoad = Math.max(2.5, bore.chord - 0.5);
    const taper = 12;
    const enter = tunnel.start;
    const exit = tunnel.start + tunnel.span - 1;
    for (let i = 0; i < samples.length; i++) {
      let blend = 0;
      if (i >= enter && i <= exit) blend = 1;
      else if (i < enter && enter - i < taper) blend = 1 - (enter - i) / taper;
      else if (i > exit && i - exit < taper) blend = 1 - (i - exit) / taper;
      const shaped = blend * blend * (3 - 2 * blend);
      samples[i].half = ROAD_HALF + (boreRoad - ROAD_HALF) * shaped;
    }
    for (let i = 0; i < samples.length; i++) {
      if (samples[i].role === "tunnel") continue;
      const next = samples[(i + 1) % samples.length];
      const turn = wrapAngle(yawFromForward(next.fx, next.fz) - yawFromForward(samples[i].fx, samples[i].fz));
      samples[i].bank = clamp(-turn * level.bankMul, -level.bankMax, level.bankMax);
    }
    for (let pass = 0; pass < 2; pass++) {
      const copy = samples.map((sample) => sample.bank || 0);
      for (let i = 0; i < samples.length; i++) {
        if (samples[i].role === "tunnel") {
          samples[i].bank = 0;
          continue;
        }
        const prev = copy[(i - 1 + samples.length) % samples.length];
        const next = copy[(i + 1) % samples.length];
        samples[i].bank = prev * 0.25 + copy[i] * 0.5 + next * 0.25;
      }
    }
    const columns = [
      { id: "starship-a", x: cx - 8, z: cz - 6, r: 7.2, h: 78, base: 0 },
      { id: "starship-b", x: cx + 34, z: cz + 18, r: 6.4, h: 64, base: 0 },
    ];
    let columnClear = true;
    for (const sample of samples) {
      for (const column of columns) {
        if (Math.hypot(sample.x - column.x, sample.z - column.z) - column.r < 18) columnClear = false;
      }
    }
    if (!columnClear) continue;
    const crossings = [];
    for (const mark of [0.22, 0.48, 0.73].slice(0, level.crossings)) {
      const index = seekFlat(samples, tunnel, Math.floor(mark * samples.length));
      if (index < 0) continue;
      crossings.push({ index, side: crossings.length % 2 === 0 ? 1 : -1 });
    }
    if (crossings.length < level.crossings) continue;
    const pads = [];
    for (const mark of [0.28, 0.55, 0.78]) {
      let index = seekFlat(samples, tunnel, Math.floor(mark * samples.length));
      if (index < 0) continue;
      if (crossings.some((crossing) => Math.abs(crossing.index - index) < 8) || pads.some((pad) => Math.abs(pad.index - index) < 8)) {
        index = seekFlat(samples, tunnel, index + 14);
      }
      if (index < 0) continue;
      if (crossings.some((crossing) => Math.abs(crossing.index - index) < 8) || pads.some((pad) => Math.abs(pad.index - index) < 8)) continue;
      pads.push({ index, lateral: pads.length % 2 === 0 ? 3.1 : -3.1 });
    }
    if (pads.length < 3) continue;
    const boxes = [];
    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i];
      const yaw = yawFromForward(sample.fx, sample.fz);
      const hz = Math.max(sample.ds * 0.56, 1);
      if (sample.role === "tunnel") {
        for (const side of [-1, 1]) {
          const lateral = side * (bore.chord + 0.42);
          boxes.push({
            x: sample.x + sample.rx * lateral,
            z: sample.z + sample.rz * lateral,
            yaw, hx: 0.42, hz, h: 5.4, base: sample.y || 0, pinch: true,
          });
        }
        continue;
      }
      const gap = crossings.some((crossing) => Math.abs(i - crossing.index) <= 1);
      for (const side of [-1, 1]) {
        if (gap && crossings.some((crossing) => crossing.side === side && Math.abs(i - crossing.index) <= 1)) continue;
        const lateral = WALL_OFFSET * side;
        const edgeY = (sample.y || 0) - Math.sin(sample.bank || 0) * lateral;
        boxes.push({
          x: sample.x + sample.rx * lateral,
          z: sample.z + sample.rz * lateral,
          yaw, hx: 0.38, hz, h: 1.25, base: edgeY,
        });
      }
    }
    boxes.push(
      { x: cx - 28, z: cz + 8, yaw: 0, hx: 1.1, hz: 1.1, h: 48, base: 0, tower: true },
      { x: cx - 28, z: cz + 22, yaw: 0, hx: 1.1, hz: 1.1, h: 48, base: 0, tower: true },
      { x: cx - 28, z: cz + 15, yaw: 0, hx: 1.4, hz: 8, h: 2.2, base: 36, tower: true },
    );
    const mouthIn = samples[tunnel.start].y;
    const mouthOut = samples[tunnel.start + tunnel.span - 1].y;
    const floor = samples[tunnel.start + (tunnel.span >> 1)].y;
    if (Math.abs(mouthIn) > 0.05 || Math.abs(mouthOut) > 0.05) continue;
    if (floor > -4 || floor + bore.crown > -1) continue;
    if (samples[enter].half > bore.chord - 0.25) continue;
    if (samples[tunnel.start + (tunnel.span >> 1)].half > bore.chord - 0.25) continue;
    let hillTop = 0;
    let bridgeTop = 0;
    for (const sample of samples) {
      if (sample.role === "hill") hillTop = Math.max(hillTop, sample.y || 0);
      if (sample.role === "bridge") bridgeTop = Math.max(bridgeTop, sample.y || 0);
    }
    if (hillTop < level.hillMin || bridgeTop < level.bridgeMin) continue;
    return {
      samples, cx, cz, tunnel, boxes, crossings, columns, bore, pads,
      maxTurnDeg: curve.maxStep * 180 / Math.PI,
      minRadius: curve.minRadius,
      hillTop, bridgeTop, seed: (seed + attempt * 9973) | 0,
      level: level.id,
      spread: spread.ratio,
      bends,
      maxControlDeg: (controls.maxControl || 0) * 180 / Math.PI,
    };
  }
  return null;
}

function ribbonGeometry(samples, side, halfWidth, y, colorAt, dash) {
  const n = samples.length;
  const positions = new Float32Array(n * 2 * 3);
  const uvs = new Float32Array(n * 2 * 2);
  const colors = typeof colorAt === "function" ? new Float32Array(n * 2 * 3) : null;
  const indices = [];
  for (let i = 0; i < n; i++) {
    const p = samples[i];
    const lateral = typeof side === "function" ? side(p) : side;
    const half = typeof halfWidth === "function" ? halfWidth(p) : halfWidth;
    const cx = p.x + p.rx * lateral;
    const cz = p.z + p.rz * lateral;
    const o = i * 6;
    const bank = Math.sin(p.bank || 0);
    const pyL = (p.y || 0) + y - bank * (lateral - half);
    const pyR = (p.y || 0) + y - bank * (lateral + half);
    positions[o] = cx - p.rx * half;
    positions[o + 1] = pyL;
    positions[o + 2] = cz - p.rz * half;
    positions[o + 3] = cx + p.rx * half;
    positions[o + 4] = pyR;
    positions[o + 5] = cz + p.rz * half;
    const v = p.dist / 4;
    const uo = i * 4;
    uvs[uo] = 0;
    uvs[uo + 1] = v;
    uvs[uo + 2] = 3;
    uvs[uo + 3] = v;
    if (colors) {
      const c0 = colorAt(p, -1);
      const c1 = colorAt(p, 1);
      const co = i * 6;
      colors.set(c0, co);
      colors.set(c1, co + 3);
    }
    const j = (i + 1) % n;
    const a = i * 2;
    const b = a + 1;
    const c = j * 2;
    const d = c + 1;
    const dashedOut = dash && Math.floor(p.dist / 6) % 2 === 1;
    if (!dashedOut) indices.push(a, b, d, a, d, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  if (colors) geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function paintMaterial(color, metal) {
  if (metal) {
    const map = steelMat.map ? steelMat.map.clone() : null;
    if (map) map.repeat.set(2, 1);
    return new THREE.MeshPhysicalMaterial({
      color,
      map,
      metalness: 0.42,
      roughness: 0.28,
      clearcoat: 0.35,
      clearcoatRoughness: 0.18,
      envMapIntensity: 0.55,
    });
  }
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.04,
    roughness: 0.38,
    clearcoat: 0.55,
    clearcoatRoughness: 0.24,
    envMapIntensity: 0.35,
  });
}

const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0x0b141e,
  metalness: 0.12,
  roughness: 0.06,
  clearcoat: 1,
  clearcoatRoughness: 0.04,
  transparent: true,
  opacity: 0.78,
  envMapIntensity: 1.6,
  ior: 1.5,
});

const rubberMat = new THREE.MeshPhysicalMaterial({ color: 0x141414, metalness: 0, roughness: 0.94 });
const rimMat = new THREE.MeshPhysicalMaterial({ color: 0xc5ccd4, metalness: 1, roughness: 0.18, envMapIntensity: 1.5 });
const lampMat = new THREE.MeshPhysicalMaterial({
  color: 0xfff4d2, emissive: 0xfff4d2, emissiveIntensity: 2.4, roughness: 0.2, metalness: 0,
});
const trimMat = new THREE.MeshPhysicalMaterial({ color: 0x14171c, metalness: 0.2, roughness: 0.55 });
const steelMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff, metalness: 0.72, roughness: 0.34, envMapIntensity: 1.15,
});
const engineMat = new THREE.MeshPhysicalMaterial({
  color: 0x2a3038, metalness: 0.6, roughness: 0.48,
});
const bellMat = new THREE.MeshPhysicalMaterial({
  color: 0xff6a2a, emissive: 0xff6a2a, emissiveIntensity: 1.4, roughness: 0.4, metalness: 0.2,
});

/** Driver eye is local −x (left seat). local +z is the tail, so eyeZ < 0 sits toward the nose.
 *  sink is how far the dash center sits below the eye. lookDrop pitches the view down toward the hood. */
function cockpitSpec(spec) {
  if (spec.kind === "truck") {
    return { eyeX: -0.58, eyeY: 2.55, eyeZ: -1.15, look: 16, fov: 68, wheel: "wheel", dashW: 2.05, yokeR: 0.16, sink: 0.92, lookDrop: 1.35 };
  }
  if (spec.kind === "roadster") {
    return { eyeX: -0.32, eyeY: 1.12, eyeZ: 0.38, look: 12, fov: 70, wheel: "wheel", dashW: 1.02, yokeR: 0.1, sink: 0.56, lookDrop: 0.92 };
  }
  if (spec.kind === "cab") {
    return { eyeX: -0.36, eyeY: 1.18, eyeZ: -0.08, look: 14, fov: 70, wheel: "none", dashW: 1.15, yokeR: 0, sink: 0.6, lookDrop: 0.88 };
  }
  if (spec.kind === "wedge") {
    return { eyeX: -0.38, eyeY: 1.2, eyeZ: 0.42, look: 14, fov: 66, wheel: "squircle", dashW: 1.5, yokeR: 0.16, sink: 0.44, lookDrop: 0.62 };
  }
  if (spec.kind === "crossover") {
    const eyeY = spec.height * 0.82 + 0.14;
    return {
      eyeX: -0.34,
      eyeY,
      eyeZ: 0.18,
      look: 14,
      fov: 66,
      wheel: spec.id === "modelx" ? "yoke" : "wheel",
      dashW: spec.width * 0.72,
      yokeR: 0.12,
      sink: eyeY - spec.height * 0.4,
      lookDrop: 0.72,
    };
  }
  if (spec.kind === "fastback") {
    return { eyeX: -0.34, eyeY: 0.96, eyeZ: 0.05, look: 14, fov: 68, wheel: "yoke", dashW: spec.width * 0.7, yokeR: 0.13, sink: 0.5, lookDrop: 0.62 };
  }
  return {
    eyeX: -0.32,
    eyeY: spec.height * 0.7 + 0.08,
    eyeZ: 0.48,
    look: 14,
    fov: 68,
    wheel: "wheel",
    dashW: spec.width * 0.72,
    yokeR: 0.15,
    sink: 0.36,
    lookDrop: 0.55,
  };
}

const dashPadMat = new THREE.MeshPhysicalMaterial({ color: 0xe4e0d8, roughness: 0.58, metalness: 0.04 });
const deckMat = new THREE.MeshPhysicalMaterial({ color: 0x23262b, roughness: 0.5, metalness: 0.22 });
const helmMat = new THREE.MeshPhysicalMaterial({ color: 0x2a2e34, roughness: 0.42, metalness: 0.4 });
const helmPadMat = new THREE.MeshPhysicalMaterial({ color: 0x14171c, roughness: 0.55, metalness: 0.16 });
const helmMarkMat = new THREE.MeshPhysicalMaterial({ color: 0xd5dbe3, roughness: 0.4, metalness: 0.1 });
const semiHood = new THREE.MeshPhysicalMaterial({ color: 0xf4f6f8, roughness: 0.34, metalness: 0.02 });
let dashScreenMat = null;

function dashScreenMaterial() {
  if (dashScreenMat) return dashScreenMat;
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  const g = canvas.getContext("2d");
  g.fillStyle = "#1a242c";
  g.fillRect(0, 0, 640, 360);
  g.strokeStyle = "#2c363f";
  g.lineWidth = 2;
  for (let y = 48; y <= 312; y += 32) {
    g.beginPath();
    g.moveTo(36, y);
    g.lineTo(604, y);
    g.stroke();
  }
  for (let x = 80; x <= 560; x += 80) {
    g.beginPath();
    g.moveTo(x, 48);
    g.lineTo(x, 312);
    g.stroke();
  }
  g.fillStyle = "#d5dde4";
  g.beginPath();
  g.moveTo(168, 214);
  g.lineTo(246, 170);
  g.lineTo(392, 150);
  g.lineTo(474, 188);
  g.lineTo(456, 214);
  g.closePath();
  g.fill();
  g.fillStyle = "#3c434a";
  g.beginPath();
  g.arc(214, 214, 18, 0, Math.PI * 2);
  g.arc(430, 214, 18, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#6aa8b4";
  g.globalAlpha = 0.7;
  g.lineWidth = 3;
  g.strokeRect(24, 18, 592, 324);
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  dashScreenMat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: true });
  return dashScreenMat;
}

/** Closed tube in the local XY plane. power 1 is a circle; 0.55 is a squircle. */
function wheelRim(radius, tube, power) {
  const pts = [];
  const n = 56;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    pts.push(new THREE.Vector3(
      Math.sign(c) * Math.pow(Math.abs(c), power) * radius,
      Math.sign(s) * Math.pow(Math.abs(s), power) * radius,
      0,
    ));
  }
  const curve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.08);
  return new THREE.TubeGeometry(curve, 72, tube, 8, true);
}

function buildCockpit(visual, spec) {
  const rig = cockpitSpec(spec);
  const g = new THREE.Group();
  g.name = "cockpit";
  visual.add(g);
  const ex = rig.eyeX;
  const ey = rig.eyeY;
  const ez = rig.eyeZ;
  const dashY = ey - rig.sink;
  const extra = Math.max(0, rig.sink - 0.36);
  const spread = rig.dashW / 1.33;
  const pillarH = 0.72 + extra;
  const pillarY = ey + 0.04 - extra * 0.45;
  const pillarZ = ez - 0.82 - extra * 0.55;
  solid(g, 0.05, pillarH, 0.07, deckMat, ex - 0.78 * spread, pillarY, pillarZ, 0, 0.008);
  solid(g, 0.05, pillarH, 0.07, deckMat, ex + 1.2 * spread, pillarY, pillarZ, 0, 0.008);
  const headerY = ey + 0.4;
  const headerZ = pillarZ + 0.02;
  solid(g, rig.dashW * 0.98, 0.06, 0.14, deckMat, 0, headerY, headerZ, 0.12, 0.01);
  const pod = addMesh(g, new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.1, 4), deckMat));
  pod.position.set(0, headerY - 0.08, headerZ + 0.05);
  pod.rotation.x = Math.PI * 0.82;
  pod.rotation.y = Math.PI / 4;
  solid(g, rig.dashW, 0.07, 0.62, dashPadMat, 0, dashY - 0.01, ez - 0.78, 0.2, 0.02);
  solid(g, rig.dashW * 0.94, 0.05, 0.28, deckMat, 0, dashY + 0.07, ez - 0.98, 0.38, 0.01);
  if (spec.kind === "truck") {
    solid(g, 2.05, 0.045, 1.5, semiHood, 0, dashY - 0.02, ez - 1.7, -0.2, 0.01);
  }
  const screenW = rig.wheel === "none" ? 0.62 : 0.46;
  const screenH = rig.wheel === "none" ? 0.34 : 0.26;
  const screenX = rig.wheel === "none" ? 0.02 : 0.14;
  const screenY = rig.wheel === "none" ? ey - 0.2 : Math.min(ey - 0.18, Math.max(dashY + 0.22, ey - 0.38));
  const screenZ = ez - 0.78;
  const back = addMesh(g, new THREE.Mesh(new THREE.PlaneGeometry(screenW + 0.04, screenH + 0.04), deckMat));
  back.position.set(screenX, screenY, screenZ - 0.02);
  back.rotation.x = 0.14;
  const screen = addMesh(g, new THREE.Mesh(new THREE.PlaneGeometry(screenW, screenH), dashScreenMaterial()));
  screen.position.set(screenX, screenY, screenZ);
  screen.rotation.x = 0.14;
  if (rig.wheel !== "none") {
    const radius = rig.yokeR;
    const mount = new THREE.Group();
    mount.position.set(ex, ey - 0.26, ez - 0.58);
    mount.rotation.x = rig.wheel === "yoke" ? 0.28 : 0.5;
    if (rig.wheel === "yoke") mount.scale.setScalar(1.55);
    g.add(mount);
    const spin = new THREE.Group();
    spin.name = "steer";
    mount.add(spin);
    if (rig.wheel === "yoke") {
      solid(spin, radius * 3.2, 0.045, 0.04, helmMat, 0, radius * 0.62, 0, 0, 0.008);
      solid(spin, 0.04, radius * 0.85, 0.04, helmMat, -radius * 1.35, radius * 0.24, 0, 0, 0.008);
      solid(spin, 0.04, radius * 0.85, 0.04, helmMat, radius * 1.35, radius * 0.24, 0, 0, 0.008);
      solid(spin, radius * 0.72, radius * 0.36, 0.016, helmPadMat, 0, radius * 0.12, 0.01, 0, 0.004);
    } else {
      addMesh(spin, new THREE.Mesh(wheelRim(radius, radius * 0.085, rig.wheel === "squircle" ? 0.72 : 1), helmMat));
      for (let i = 0; i < 3; i++) {
        const spoke = addMesh(spin, new THREE.Mesh(new THREE.BoxGeometry(radius * 0.07, radius * 1.35, 0.016), helmPadMat));
        spoke.rotation.z = (i / 3) * Math.PI * 2;
      }
      const hub = addMesh(spin, new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.22, radius * 0.22, 0.024, 16), helmPadMat));
      hub.rotation.x = Math.PI / 2;
    }
    const mark = addMesh(spin, new THREE.Mesh(new THREE.BoxGeometry(radius * 0.1, radius * 0.16, 0.014), helmMarkMat));
    mark.position.y = radius * (rig.wheel === "yoke" ? 0.62 : 0.8);
  }
  return rig;
}

function buildVehicle(spec) {
  const root = new THREE.Group();
  root.name = spec.id;
  const visual = new THREE.Group();
  visual.name = "visual";
  root.add(visual);
  const bodyMat = paintMaterial(spec.color, spec.kind === "wedge");
  const wheels = [];
  const tails = [];
  if (spec.kind === "truck") buildTruck(visual, spec, bodyMat, wheels, tails);
  else if (spec.kind === "wedge") buildWedge(visual, spec, bodyMat, wheels, tails);
  else if (spec.kind === "roadster") buildRoadster(visual, spec, bodyMat, wheels, tails);
  else if (spec.kind === "cab") buildCybercab(visual, spec, bodyMat, wheels, tails);
  else buildCar(visual, spec, bodyMat, wheels, tails);
  const cockpit = buildCockpit(visual, spec);
  const glass = [];
  visual.traverse((obj) => {
    if (!obj.isMesh) return;
    const glassy = obj.material && obj.material.transparent && obj.material.opacity <= 0.96;
    if (glassy || obj.userData.occlude) glass.push(obj);
  });

  const nose = new THREE.Object3D();
  nose.name = "nose";
  nose.position.set(0, spec.height * 0.42, -spec.length * 0.5);
  root.add(nose);

  const lampY = spec.kind === "truck" ? 1.15 : spec.kind === "wedge" ? 0.92 : spec.kind === "roadster" ? 0.52 : spec.kind === "cab" ? 0.62 : Math.min(0.78, spec.height * 0.62);
  const lampZ = -spec.length * 0.52;
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xfff4d2, emissive: 0xfff1cc, emissiveIntensity: 0.15, roughness: 0.25 });
  const lamps = [];
  for (const side of [-1, 1]) {
    const x = side * spec.width * 0.32;
    const spot = new THREE.SpotLight(0xfff1cc, 0, 46, 0.38, 0.62, 1.55);
    spot.position.set(x, lampY, lampZ);
    spot.castShadow = false;
    const target = new THREE.Object3D();
    target.position.set(x * 0.35, lampY - 0.45, lampZ - 26);
    root.add(spot, target);
    spot.target = target;
    const lens = new THREE.Mesh(new THREE.CircleGeometry(spec.kind === "truck" ? 0.14 : 0.07, 12), lampMat);
    lens.position.set(x, lampY, lampZ + 0.04);
    lens.rotation.y = Math.PI;
    root.add(lens);
    lamps.push({ spot, lens });
  }
  const dentMat = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.9, metalness: 0.08 });
  const dents = [];
  for (const spot of [[0.28, 0.46, -0.34], [-0.34, 0.4, 0.05], [0.12, 0.55, 0.32]]) {
    const dent = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), dentMat);
    dent.scale.set(1.15, 0.32, 0.85);
    dent.position.set(spot[0] * spec.width, spot[1] * spec.height, spot[2] * spec.length * 0.45);
    dent.visible = false;
    visual.add(dent);
    dents.push(dent);
  }

  root.userData.wheels = wheels;
  root.userData.visual = visual;
  root.userData.tails = tails;
  root.userData.lamps = lamps;
  root.userData.lampMat = lampMat;
  root.userData.dents = dents;
  root.userData.bodyMat = bodyMat;
  root.userData.cockpit = cockpit;
  root.userData.glass = glass;
  return root;
}

function arrowGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 1.35);
  shape.lineTo(0.72, 0.15);
  shape.lineTo(0.28, 0.15);
  shape.lineTo(0.28, -0.85);
  shape.lineTo(-0.28, -0.85);
  shape.lineTo(-0.28, 0.15);
  shape.lineTo(-0.72, 0.15);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(-Math.PI / 2);
  return geo;
}

function addMesh(parent, mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function solid(parent, w, h, d, material, x, y, z, rx, rounded) {
  const geo = rounded
    ? new RoundedBoxGeometry(w, h, d, 2, Math.min(rounded, w / 2, h / 2, d / 2))
    : new THREE.BoxGeometry(w, h, d);
  const mesh = addMesh(parent, new THREE.Mesh(geo, material));
  mesh.position.set(x, y, z);
  if (rx) mesh.rotation.x = rx;
  return mesh;
}

/** Bottom sits on y. The front face (-z) is frontH tall and the back face is backH tall. */
function slopedBox(parent, w, frontH, backH, d, material, x, y, z) {
  const hw = w / 2;
  const hd = d / 2;
  const stations = [
    [-hd, frontH],
    [-hd * 0.15, frontH + (backH - frontH) * 0.62],
    [hd, backH],
  ];
  const positions = [];
  const indices = [];
  const push = (ax, ay, az) => {
    positions.push(ax, ay, az);
    return (positions.length / 3) - 1;
  };
  const quad = (a, b, c, d0) => indices.push(a, b, c, a, c, d0);
  const ring = stations.map(([sz, sh]) => [
    push(-hw, 0, sz), push(hw, 0, sz), push(hw, sh, sz), push(-hw, sh, sz),
  ]);
  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i];
    const b = ring[i + 1];
    quad(a[0], b[0], b[1], a[1]);
    quad(a[1], b[1], b[2], a[2]);
    quad(a[2], b[2], b[3], a[3]);
    quad(a[3], b[3], b[0], a[0]);
  }
  const nose = ring[0];
  const tail = ring[ring.length - 1];
  quad(nose[0], nose[1], nose[2], nose[3]);
  quad(tail[3], tail[2], tail[1], tail[0]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const skin = material.userData.bothSides ? material : material.clone();
  skin.side = THREE.DoubleSide;
  skin.userData.bothSides = true;
  const mesh = addMesh(parent, new THREE.Mesh(geo, skin));
  mesh.position.set(x, y, z);
  return mesh;
}

function addWheel(parent, wheels, x, y, z, radius, front) {
  const steer = new THREE.Group();
  steer.position.set(x, y, z);
  const spin = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, radius * 0.72, 22), rubberMat);
  tire.geometry.rotateZ(Math.PI / 2);
  tire.castShadow = true;
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.62, radius * 0.62, radius * 0.78, 18), rimMat);
  rim.geometry.rotateZ(Math.PI / 2);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.16, radius * 0.16, radius * 0.84, 10), rimMat);
  cap.geometry.rotateZ(Math.PI / 2);
  spin.add(tire, rim, cap);
  for (let i = 0; i < 5; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.1, radius * 1.05, radius * 0.08), rimMat);
    spoke.rotation.x = (i / 5) * Math.PI;
    spin.add(spoke);
  }
  steer.add(spin);
  parent.add(steer);
  wheels.push({ steer, spin, front, radius });
}

function lampsAndTail(parent, spec, tails, zNose, zTail, y) {
  for (const side of [-1, 1]) {
    const lamp = addMesh(parent, new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.05), lampMat));
    lamp.position.set(side * spec.width * 0.32, y, zNose);
  }
  const tailMat = new THREE.MeshPhysicalMaterial({
    color: 0xff1d3a, emissive: 0xff1d3a, emissiveIntensity: 0.7, roughness: 0.35,
  });
  for (const side of [-1, 1]) {
    const tail = addMesh(parent, new THREE.Mesh(new THREE.BoxGeometry(spec.width * 0.22, 0.1, 0.06), tailMat));
    tail.position.set(side * spec.width * 0.28, y * 0.95, zTail);
  }
  tails.push(tailMat);
}

function facingDisc(parent, radius, depth, material, x, y, z, towardNose) {
  const disc = addMesh(parent, new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 24), material));
  disc.rotation.x = towardNose ? -Math.PI / 2 : Math.PI / 2;
  disc.position.set(x, y, z);
  return disc;
}

function underglow(parent, width, length) {
  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.42, 0.015, length * 0.36),
    new THREE.MeshPhysicalMaterial({ color: 0x2ee7ff, emissive: 0x2ee7ff, emissiveIntensity: 0.35, roughness: 0.4 }),
  );
  glow.position.set(0, 0.06, 0);
  parent.add(glow);
}

/** Original Roadster: long hood, round lamps, oval nose opening, flying-buttress rear glass. Nose is −z. */
function buildRoadster(visual, spec, bodyMat, wheels, tails) {
  bodyMat.roughness = 0.18;
  bodyMat.metalness = 0.1;
  bodyMat.clearcoat = 0.92;
  bodyMat.clearcoatRoughness = 0.07;
  bodyMat.envMapIntensity = 0.8;

  const frontAxle = -1.175;
  const rearAxle = 1.175;
  const radius = 0.33;
  const track = 0.8;
  const screen = glassMat.clone();
  screen.opacity = 0.62;
  screen.color.set(0x9fd4ea);
  screen.roughness = 0.04;
  screen.envMapIntensity = 1.5;
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: 0xfff6df, emissive: 0xfff1c8, emissiveIntensity: 2.2, roughness: 0.12,
  });
  const markerMat = new THREE.MeshPhysicalMaterial({
    color: 0xff7a18, emissive: 0xff7a18, emissiveIntensity: 0.7, roughness: 0.4,
  });

  solid(visual, 1.48, 0.1, 3.35, trimMat, 0, 0.16, 0.06, 0, 0.04);
  solid(visual, 1.52, 0.34, 3.25, bodyMat, 0, 0.38, 0.04, 0, 0.1);
  slopedBox(visual, 1.28, 0.08, 0.3, 1.6, bodyMat, 0, 0.46, -1.02);
  solid(visual, 1.34, 0.12, 0.36, trimMat, 0, 0.2, -1.72, 0, 0.04);
  const grille = addMesh(visual, new THREE.Mesh(new THREE.SphereGeometry(0.16, 22, 14), trimMat));
  grille.scale.set(1.7, 0.5, 0.28);
  grille.position.set(0, 0.34, -1.9);

  for (const side of [-1, 1]) {
    solid(visual, 0.34, 0.26, 1.2, bodyMat, side * 0.68, 0.56, -1.02, 0, 0.1);
    solid(visual, 0.36, 0.2, 0.85, bodyMat, side * 0.66, 0.5, rearAxle + 0.02, 0, 0.08);
    facingDisc(visual, 0.11, 0.035, trimMat, side * 0.58, 0.6, -1.64, true);
    facingDisc(visual, 0.082, 0.04, lensMat, side * 0.58, 0.6, -1.68, true);
    solid(visual, 0.06, 0.1, 0.26, trimMat, side * 0.8, 0.38, -0.35, 0, 0.02);
    solid(visual, 0.045, 0.045, 0.08, markerMat, side * 0.82, 0.4, -1.28, 0, 0);
    solid(visual, 0.08, 0.06, 0.14, bodyMat, side * 0.88, 0.7, -0.12, 0, 0.02);
  }

  const cowl = solid(visual, 0.98, 0.16, 0.55, trimMat, 0, 0.68, 0.02, 0, 0.03);
  cowl.userData.occlude = true;
  const windshield = solid(visual, 1.08, 0.28, 0.5, screen, 0, 0.8, -0.08, 0.48, 0.03);
  windshield.castShadow = false;
  const lid = solid(visual, 0.96, 0.08, 0.42, bodyMat, 0, 0.96, 0.18, 0, 0.04);
  lid.userData.occlude = true;
  for (const side of [-1, 1]) {
    const pane = solid(visual, 0.04, 0.16, 0.36, screen, side * 0.54, 0.8, 0.1, 0, 0);
    pane.castShadow = false;
    solid(visual, 0.16, 0.16, 0.46, bodyMat, side * 0.46, 0.62, 0.7, 0, 0.04);
  }
  const hatch = solid(visual, 0.62, 0.14, 0.34, screen, 0, 0.68, 0.58, -0.35, 0);
  hatch.castShadow = false;
  slopedBox(visual, 1.32, 0.16, 0.07, 0.72, bodyMat, 0, 0.46, 1.22);
  solid(visual, 1.28, 0.1, 0.28, trimMat, 0, 0.2, 1.7, 0, 0.03);

  const tailMat = new THREE.MeshPhysicalMaterial({
    color: 0xff1d3a, emissive: 0xff1d3a, emissiveIntensity: 0.9, roughness: 0.28,
  });
  tails.push(tailMat);
  for (const side of [-1, 1]) {
    facingDisc(visual, 0.072, 0.045, tailMat, side * 0.56, 0.5, 1.7, false);
    facingDisc(visual, 0.046, 0.04, tailMat, side * 0.4, 0.5, 1.72, false);
  }

  addWheel(visual, wheels, track, radius, frontAxle, radius, true);
  addWheel(visual, wheels, -track, radius, frontAxle, radius, true);
  addWheel(visual, wheels, track, radius, rearAxle, radius, false);
  addWheel(visual, wheels, -track, radius, rearAxle, radius, false);
  underglow(visual, spec.width, spec.length);
}

function addCoveredWheel(parent, wheels, x, y, z, radius, front, coverMat) {
  const steer = new THREE.Group();
  steer.position.set(x, y, z);
  const spin = new THREE.Group();
  const width = Math.max(0.18, radius * 0.42);
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 28), rubberMat);
  tire.geometry.rotateZ(Math.PI / 2);
  tire.castShadow = true;
  const face = width * 0.28;
  const cover = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.86, radius * 0.86, face, 40), coverMat);
  cover.geometry.rotateZ(Math.PI / 2);
  const out = x >= 0 ? 1 : -1;
  cover.position.x = out * (width / 2 - face / 2);
  spin.add(tire, cover);
  steer.add(spin);
  parent.add(steer);
  wheels.push({ steer, spin, front, radius });
}

/** Gold two-seat cab: smooth body, body-color wheel covers, one thin lamp. Nose is −z. */
function buildCybercab(visual, spec, bodyMat, wheels, tails) {
  bodyMat.roughness = 0.42;
  bodyMat.metalness = 0.24;
  bodyMat.clearcoat = 0.35;
  bodyMat.clearcoatRoughness = 0.32;
  bodyMat.envMapIntensity = 0.45;
  bodyMat.color.set(0xd2ae62);

  const frontAxle = -1.317;
  const rearAxle = 1.317;
  const frontR = 0.38;
  const rearR = 0.42;
  const track = 0.86;
  const screen = glassMat.clone();
  screen.opacity = 0.55;
  screen.color.set(0xb7d7ea);
  screen.roughness = 0.04;
  screen.envMapIntensity = 1.4;

  solid(visual, 1.66, 0.5, 3.45, bodyMat, 0, 0.52, 0.08, 0, 0.22);
  const hump = solid(visual, 1.4, 0.28, 1.65, bodyMat, 0, 0.8, -0.02, 0, 0.12);
  hump.userData.occlude = true;
  slopedBox(visual, 1.48, 0.1, 0.26, 1.25, bodyMat, 0, 0.46, -1.28);
  const shelf = solid(visual, 1.1, 0.14, 0.55, trimMat, 0, 0.74, -0.2, 0, 0.03);
  shelf.userData.occlude = true;
  const windshield = solid(visual, 1.22, 0.32, 0.62, screen, 0, 0.92, -0.32, 0.5, 0.03);
  windshield.castShadow = false;
  for (const side of [-1, 1]) {
    const pane = solid(visual, 0.045, 0.2, 0.7, screen, side * 0.68, 0.88, -0.02, 0, 0);
    pane.castShadow = false;
    solid(visual, 0.08, 0.08, 2.2, trimMat, side * 0.8, 0.2, 0.12, 0, 0.02);
  }
  solid(visual, 1.35, 0.07, 0.22, trimMat, 0, 0.16, -1.78, 0, 0.02);

  const bar = addMesh(visual, new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.022, 0.025), lampMat));
  bar.position.set(0, 0.5, -1.96);
  const tailMat = new THREE.MeshPhysicalMaterial({
    color: 0xff1d3a, emissive: 0xff1d3a, emissiveIntensity: 0.75, roughness: 0.32,
  });
  tails.push(tailMat);
  const rearBar = addMesh(visual, new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.02, 0.025), tailMat));
  rearBar.position.set(0, 0.55, 1.92);

  addCoveredWheel(visual, wheels, track, frontR, frontAxle, frontR, true, bodyMat);
  addCoveredWheel(visual, wheels, -track, frontR, frontAxle, frontR, true, bodyMat);
  addCoveredWheel(visual, wheels, track, rearR, rearAxle, rearR, false, bodyMat);
  addCoveredWheel(visual, wheels, -track, rearR, rearAxle, rearR, false, bodyMat);
  underglow(visual, spec.width, spec.length);
}

function buildCar(visual, spec, bodyMat, wheels, tails) {
  const L = spec.length;
  const W = spec.width;
  const H = spec.height;
  const sports = spec.kind === "sports";
  const fast = spec.kind === "fastback";
  const cross = spec.kind === "crossover";
  const isX = spec.id === "modelx";
  const round = sports ? 0.045 : 0.08;
  const cabinH = H * (sports ? 0.28 : fast ? 0.34 : cross ? (isX ? 0.5 : 0.44) : 0.38);
  const cabinL = L * (sports ? 0.3 : fast ? 0.56 : cross ? 0.5 : 0.42);
  const cabinZ = L * (sports ? 0.08 : fast ? 0.02 : -0.04);
  const cabinY = H * (sports ? 0.46 : cross ? 0.6 : 0.54);
  solid(visual, W * 0.94, H * 0.32, L * 0.86, bodyMat, 0, H * 0.24, L * 0.02, 0, round);
  solid(visual, W * 0.98, H * 0.07, L * 0.7, trimMat, 0, H * 0.1, 0, 0, 0.02);
  solid(visual, W * 0.88, H * 0.1, L * 0.3, bodyMat, 0, H * 0.38, -L * 0.3, sports ? -0.1 : -0.04, round);
  solid(
    visual, W * 0.86, H * (fast ? 0.14 : 0.1), L * (fast ? 0.32 : 0.2), bodyMat,
    0, H * (fast ? 0.4 : 0.38), L * (fast ? 0.28 : 0.34), fast ? -0.24 : 0.05, round,
  );
  const cabin = solid(visual, W * (isX ? 0.84 : 0.78), cabinH, cabinL, glassMat, 0, cabinY, cabinZ, fast ? -0.18 : 0, 0.04);
  cabin.castShadow = false;
  const cabinBlock = solid(visual, W * 0.62, cabinH * 0.42, cabinL * 0.62, trimMat, 0, cabinY - cabinH * 0.16, cabinZ, 0, 0);
  cabinBlock.userData.occlude = true;
  const radius = sports ? 0.32 : cross ? 0.4 : 0.34;
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      solid(visual, 0.16, radius * 0.72, radius * 1.35, trimMat, side * W * 0.46, radius * 0.82, end * L * 0.31, 0, 0.03);
    }
    solid(visual, 0.14, 0.05, 0.09, bodyMat, side * W * 0.52, cabinY * 0.92, cabinZ - cabinL * 0.32, 0, 0.02);
  }
  if (cross) {
    solid(visual, 0.05, 0.04, L * 0.36, trimMat, -W * 0.26, cabinY + cabinH * 0.52, cabinZ, 0, 0);
    solid(visual, 0.05, 0.04, L * 0.36, trimMat, W * 0.26, cabinY + cabinH * 0.52, cabinZ, 0, 0);
  }
  if (sports) solid(visual, W * 0.55, 0.045, 0.32, bodyMat, 0, H * 0.58, L * 0.38, -0.25, 0.02);
  if (isX) {
    const bar = addMesh(visual, new THREE.Mesh(new THREE.BoxGeometry(W * 0.36, 0.035, 0.05), lampMat));
    bar.position.set(0, cabinY + cabinH * 0.46, cabinZ - cabinL * 0.15);
  }
  lampsAndTail(visual, spec, tails, -L * 0.47, L * 0.46, H * 0.3);
  const axle = W * 0.5 + 0.06;
  addWheel(visual, wheels, axle, radius, -L * 0.32, radius, true);
  addWheel(visual, wheels, -axle, radius, -L * 0.32, radius, true);
  addWheel(visual, wheels, axle, radius, L * 0.32, radius, false);
  addWheel(visual, wheels, -axle, radius, L * 0.32, radius, false);
  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.42, 0.015, L * 0.36),
    new THREE.MeshPhysicalMaterial({ color: 0x2ee7ff, emissive: 0x2ee7ff, emissiveIntensity: 0.35, roughness: 0.4 }),
  );
  glow.position.set(0, 0.06, 0);
  visual.add(glow);
}

function buildWedge(visual, spec, bodyMat, wheels, tails) {
  const L = spec.length;
  const W = spec.width;
  const H = spec.height;
  solid(visual, W, H * 0.42, L * 0.9, bodyMat, 0, H * 0.3, 0.02 * L, 0, 0);
  solid(visual, W * 0.98, H * 0.2, L * 0.4, bodyMat, 0, H * 0.4, -L * 0.24, 0.38, 0);
  solid(visual, W * 0.94, H * 0.22, L * 0.26, bodyMat, 0, H * 0.46, L * 0.3, -0.08, 0);
  const glass = solid(visual, W * 0.7, H * 0.26, L * 0.34, glassMat, 0, H * 0.58, -L * 0.02, 0.62, 0);
  glass.castShadow = false;
  const deck = solid(visual, W * 0.5, H * 0.12, L * 0.2, trimMat, 0, H * 0.5, 0, 0.4, 0);
  deck.userData.occlude = true;
  for (const side of [-1, 1]) {
    solid(visual, 0.045, H * 0.55, L * 0.86, trimMat, side * W * 0.49, H * 0.36, 0, 0, 0);
  }
  solid(visual, W, 0.04, 0.08, trimMat, 0, H * 0.12, -L * 0.4, 0, 0);
  const bar = addMesh(visual, new THREE.Mesh(new THREE.BoxGeometry(W * 0.78, 0.04, 0.04), lampMat));
  bar.position.set(0, H * 0.42, -L * 0.46);
  lampsAndTail(visual, spec, tails, -L * 0.47, L * 0.47, H * 0.28);
  const radius = 0.44;
  const axle = W * 0.5 + 0.02;
  addWheel(visual, wheels, axle, radius, -L * 0.3, radius, true);
  addWheel(visual, wheels, -axle, radius, -L * 0.3, radius, true);
  addWheel(visual, wheels, axle, radius, L * 0.32, radius, false);
  addWheel(visual, wheels, -axle, radius, L * 0.32, radius, false);
}

function addTruckWheel(parent, wheels, x, y, z, radius, front) {
  const steer = new THREE.Group();
  steer.position.set(x, y, z);
  const spin = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.38, 28), rubberMat);
  tire.geometry.rotateZ(Math.PI / 2);
  tire.castShadow = true;
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.62, radius * 0.62, 0.3, 28),
    rimMat,
  );
  rim.geometry.rotateZ(Math.PI / 2);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.16, radius * 0.16, 0.34, 14), trimMat);
  hub.geometry.rotateZ(Math.PI / 2);
  spin.add(tire, rim, hub);
  for (let i = 0; i < 10; i++) {
    const lug = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.32, 6), trimMat);
    lug.geometry.rotateZ(Math.PI / 2);
    const a = (i / 10) * Math.PI * 2;
    lug.position.set(0, Math.cos(a) * radius * 0.36, Math.sin(a) * radius * 0.36);
    spin.add(lug);
  }
  steer.add(spin);
  parent.add(steer);
  wheels.push({ steer, spin, front, radius });
}

const optimusGold = new THREE.MeshPhysicalMaterial({
  color: 0xd7b56a,
  metalness: 0.28,
  roughness: 0.46,
  clearcoat: 0.2,
  clearcoatRoughness: 0.3,
  envMapIntensity: 0.35,
});
const optimusBlack = new THREE.MeshPhysicalMaterial({
  color: 0x121212,
  metalness: 0.48,
  roughness: 0.34,
  clearcoat: 0.28,
  clearcoatRoughness: 0.24,
  envMapIntensity: 0.55,
});
const optimusHead = new THREE.MeshPhysicalMaterial({
  color: 0x0a0a0a,
  metalness: 0.72,
  roughness: 0.12,
  clearcoat: 0.8,
  clearcoatRoughness: 0.08,
  envMapIntensity: 1.1,
});

function buildOptimus() {
  const root = new THREE.Group();
  const hip = new THREE.Group();
  hip.position.y = 0.9;
  root.add(hip);
  const thighs = [];
  const shins = [];
  const arms = [];
  for (const side of [-1, 1]) {
    const thigh = new THREE.Group();
    thigh.position.set(side * 0.1, 0.01, 0);
    hip.add(thigh);
    solid(thigh, 0.13, 0.34, 0.14, optimusGold, 0, -0.17, 0, 0, 0.045);
    const shin = new THREE.Group();
    shin.position.set(0, -0.34, 0);
    thigh.add(shin);
    solid(shin, 0.12, 0.08, 0.13, optimusBlack, 0, -0.02, 0, 0, 0.03);
    solid(shin, 0.11, 0.36, 0.12, optimusBlack, 0, -0.24, 0, 0, 0.04);
    solid(shin, 0.11, 0.08, 0.26, optimusBlack, 0, -0.48, -0.02, 0, 0.03);
    thighs.push(thigh);
    shins.push(shin);
  }
  solid(hip, 0.34, 0.14, 0.18, optimusBlack, 0, 0.02, 0, 0, 0.05);
  solid(hip, 0.32, 0.32, 0.16, optimusBlack, 0, 0.24, 0, 0, 0.05);
  solid(hip, 0.24, 0.3, 0.05, optimusGold, 0, 0.28, -0.09, 0, 0.02);
  for (const side of [-1, 1]) {
    const shoulder = addMesh(hip, new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), optimusGold));
    shoulder.scale.set(1.05, 0.7, 0.82);
    shoulder.position.set(side * 0.24, 0.4, 0);
    const arm = new THREE.Group();
    arm.position.set(side * 0.32, 0.36, 0);
    solid(arm, 0.09, 0.3, 0.09, optimusGold, 0, -0.18, 0, 0, 0.04);
    solid(arm, 0.1, 0.07, 0.1, optimusBlack, 0, -0.36, 0, 0, 0.03);
    solid(arm, 0.08, 0.26, 0.08, optimusGold, 0, -0.52, 0, 0, 0.035);
    solid(arm, 0.07, 0.1, 0.05, optimusBlack, 0, -0.7, 0.01, 0, 0.02);
    hip.add(arm);
    arms.push(arm);
  }
  solid(hip, 0.09, 0.08, 0.09, optimusBlack, 0, 0.46, 0, 0, 0.03);
  const head = addMesh(hip, new THREE.Mesh(new THREE.SphereGeometry(0.115, 22, 16), optimusHead));
  head.scale.set(0.92, 1.15, 0.98);
  head.position.set(0, 0.6, -0.01);
  root.userData.hip = hip;
  root.userData.head = head;
  root.userData.thighs = thighs;
  root.userData.shins = shins;
  root.userData.arms = arms;
  return root;
}

function buildTruck(visual, spec, bodyMat, wheels, tails) {
  const paint = new THREE.MeshPhysicalMaterial({
    color: 0xf4f6f8,
    metalness: 0.02,
    roughness: 0.34,
    clearcoat: 0.48,
    clearcoatRoughness: 0.22,
    envMapIntensity: 0.4,
  });
  const semiGlass = new THREE.MeshPhysicalMaterial({
    color: 0x071018,
    metalness: 0.04,
    roughness: 0.22,
    transparent: true,
    opacity: 0.94,
    envMapIntensity: 0.28,
  });
  const clad = new THREE.MeshPhysicalMaterial({
    color: 0x14161a,
    metalness: 0.18,
    roughness: 0.55,
    clearcoat: 0.22,
    clearcoatRoughness: 0.32,
  });
  const amber = new THREE.MeshPhysicalMaterial({
    color: 0xff8a2a,
    emissive: 0xff6a12,
    emissiveIntensity: 1.8,
    roughness: 0.35,
  });
  void bodyMat;

  solid(visual, 2.32, 0.36, 0.55, clad, 0, 0.4, -3.9, 0, 0.04);
  slopedBox(visual, 2.22, 0.32, 0.95, 1.45, paint, 0, 0.38, -3.15);
  const brow = slopedBox(visual, 2.46, 0.48, 2.62, 1.45, paint, 0, 0.9, -1.95);
  brow.userData.occlude = true;
  const browShade = slopedBox(visual, 2.16, 0.16, 1.28, 0.92, clad, 0, 1.42, -2.08);
  browShade.userData.occlude = true;
  const glass = slopedBox(visual, 1.96, 0.1, 1.05, 0.78, semiGlass, 0, 1.5, -2.16);
  glass.castShadow = false;
  const cabBox = solid(visual, 2.46, 2.2, 2.45, paint, 0, 2.28, -0.42, 0, 0.08);
  cabBox.userData.occlude = true;
  solid(visual, 2.28, 0.22, 2.05, paint, 0, 3.46, -0.28, 0, 0.06);
  for (const side of [-1, 1]) {
    solid(visual, 0.07, 2.22, 0.1, clad, side * 1.22, 2.28, 0.86, 0, 0.01);
  }
  solid(visual, 2.5, 0.08, 0.1, clad, 0, 3.36, 0.86, 0, 0.01);
  for (const side of [-1, 1]) {
    const window = solid(visual, 0.05, 0.7, 1.15, semiGlass, side * 1.24, 2.42, -0.72, 0, 0.02);
    window.castShadow = false;
    solid(visual, 0.04, 1.5, 0.025, clad, side * 1.25, 2.15, -0.15, 0, 0);
    const mirror = new THREE.Group();
    mirror.position.set(side * 1.32, 1.95, -2.35);
    solid(mirror, 0.16, 0.06, 0.22, clad, side * 0.1, 0.02, 0, 0, 0.02);
    solid(mirror, 0.14, 0.26, 0.08, clad, side * 0.2, 0.12, -0.02, 0, 0.02);
    visual.add(mirror);
  }
  solid(visual, 2.48, 0.42, 0.62, clad, 0, 0.58, -3.52, 0, 0.03);
  solid(visual, 2.5, 0.42, 1.7, clad, 0, 0.78, -0.85, 0, 0.03);
  solid(visual, 0.95, 0.38, 3.15, clad, 0, 0.78, 2.05, 0, 0.04);
  for (const side of [-1, 1]) {
    solid(visual, 0.36, 0.42, 1.85, clad, side * 1.12, 1.02, 2.15, 0, 0.04);
    solid(visual, 0.04, 0.55, 0.28, clad, side * 1.18, 0.4, 3.15, 0, 0);
  }
  const fifth = addMesh(visual, new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.46, 0.1, 20), clad));
  fifth.position.set(0, 1.18, 2.05);
  solid(visual, 0.7, 0.06, 0.7, trimMat, 0, 1.26, 2.05, 0, 0.02);
  for (const x of [-0.62, 0, 0.62]) {
    const marker = solid(visual, 0.14, 0.03, 0.04, amber, x, 2.78, -1.72, 0.35, 0);
    marker.userData.occlude = true;
  }
  const bar = addMesh(visual, new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.045, 0.04), lampMat));
  bar.position.set(0, 0.62, -4.12);
  solid(visual, 0.025, 0.02, 0.48, clad, -0.32, 1.72, -2.55, 0.7, 0);
  solid(visual, 0.025, 0.02, 0.48, clad, 0.28, 1.72, -2.55, 0.7, 0);

  const tailMat = new THREE.MeshPhysicalMaterial({
    color: 0xff1d3a, emissive: 0xff1d3a, emissiveIntensity: 0.7, roughness: 0.35,
  });
  for (const side of [-1, 1]) {
    const tail = addMesh(visual, new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.04), tailMat));
    tail.position.set(side * 0.42, 0.72, 3.62);
  }
  tails.push(tailMat);

  const radius = 0.53;
  addTruckWheel(visual, wheels, 1.32, radius, -2.55, radius, true);
  addTruckWheel(visual, wheels, -1.32, radius, -2.55, radius, true);
  for (const z of [1.85, 2.85]) {
    addTruckWheel(visual, wheels, 1.16, radius, z, radius, false);
    addTruckWheel(visual, wheels, -1.16, radius, z, radius, false);
  }
  void spec;
}

function makePool(count, color, size, opacity, blending) {
  const positions = new Float32Array(count * 3);
  const life = new Float32Array(count);
  const vel = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) positions[i * 3 + 1] = -20;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color, size, transparent: true, opacity, depthWrite: false, blending, sizeAttenuation: true,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return { positions, life, vel, geo, pts, cursor: 0, count };
}

function emitParticle(pool, x, y, z, vx, vy, vz, life) {
  const i = pool.cursor;
  pool.cursor = (pool.cursor + 1) % pool.count;
  pool.positions[i * 3] = x;
  pool.positions[i * 3 + 1] = y;
  pool.positions[i * 3 + 2] = z;
  pool.vel[i * 3] = vx;
  pool.vel[i * 3 + 1] = vy;
  pool.vel[i * 3 + 2] = vz;
  pool.life[i] = life;
}

function updatePool(pool, dt, gravity) {
  for (let i = 0; i < pool.count; i++) {
    if (pool.life[i] <= 0) continue;
    pool.life[i] -= dt;
    pool.vel[i * 3 + 1] -= gravity * dt;
    pool.positions[i * 3] += pool.vel[i * 3] * dt;
    pool.positions[i * 3 + 1] += pool.vel[i * 3 + 1] * dt;
    pool.positions[i * 3 + 2] += pool.vel[i * 3 + 2] * dt;
    if (pool.life[i] <= 0) pool.positions[i * 3 + 1] = -20;
  }
  pool.geo.attributes.position.needsUpdate = true;
}

function nearestIndex(samples, x, z) {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < samples.length; i++) {
    const d = (samples[i].x - x) ** 2 + (samples[i].z - z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

function aheadPoint(samples, index, meters) {
  let left = meters;
  let k = index;
  for (let n = 0; n < samples.length; n++) {
    left -= samples[k].ds;
    k = (k + 1) % samples.length;
    if (left <= 0) break;
  }
  return samples[k];
}

function gripAt(samples, x, z) {
  const s = samples[nearestIndex(samples, x, z)];
  const lateral = Math.abs((x - s.x) * s.rx + (z - s.z) * s.rz);
  if (lateral < ROAD_HALF - 0.3) return 1;
  if (lateral < WALL_OFFSET) return 0.76;
  return 0.5;
}

/** Positive steer is a right turn. The driver looks toward local −z, so a positive
 *  helm rotation.z reads clockwise from the seat. Left steer spins the other way
 *  and the 12-o'clock mark moves toward local −x. */
function helmSpin(steer) {
  return -steer * 1.05;
}

function smoothToward(current, target, dt, sens) {
  const response = STEER_RESPONSE * (Number.isFinite(sens) ? sens : 1);
  const step = Number.isFinite(dt) ? dt : 1 / 60;
  const next = current + (target - current) * (1 - Math.exp(-response * step));
  if (Math.abs(target) < 1e-6 && Math.abs(next) < 0.012) return 0;
  return clamp(next, -1, 1);
}

function selfTestFrame() {
  const failures = [];
  const fwd = carForward(0);
  if (Math.abs(fwd.x) > 1e-6 || Math.abs(fwd.z + 1) > 1e-6) failures.push("yaw 0 is not −z");
  const right = rightOf(fwd);
  if (Math.abs(right.x - 1) > 1e-6 || Math.abs(right.z) > 1e-6) failures.push("right of −z is not +x");
  if (Math.abs(yawFromForward(0, -1)) > 1e-6) failures.push("yawFromForward(0,-1) is not 0");
  const spec = VEHICLES[0];
  const idleResolve = (x, z) => ({ x, z, hit: false });
  const gates = [{ x: 0, z: 0 }, { x: 0, z: -200 }];
  const moved = createDriveState(0, 0, 0);
  const blank = { steer: 0, brake: 0, boost: false, ludicrousToggle: false, autopilot: false, fsd: false };
  for (let i = 0; i < 90; i++) stepDrive(moved, { ...blank, throttle: 1 }, spec, 1 / 60, null, 1, idleResolve, gates, 2);
  if (!(moved.z < -2)) failures.push(`throttle did not move −z (${moved.z.toFixed(2)})`);
  const nose = carForward(moved.yaw);
  const travel = { x: moved.x, z: moved.z };
  const travelLen = Math.hypot(travel.x, travel.z) || 1;
  if (nose.x * travel.x / travelLen + nose.z * travel.z / travelLen < 0.9) failures.push("nose does not match travel");
  const turned = createDriveState(0, 0, 0);
  turned.speed = 20;
  stepDrive(turned, { ...blank, throttle: 0, steer: 1 }, spec, 1 / 60, null, 1, idleResolve, gates, 2);
  if (!(turned.yaw < 0)) failures.push("right steer did not lower yaw");
  const swing = new THREE.Group();
  const foot = new THREE.Object3D();
  foot.position.set(0, -1, 0);
  swing.add(foot);
  swing.rotation.x = 0.5;
  swing.updateMatrixWorld(true);
  const swung = new THREE.Vector3();
  foot.getWorldPosition(swung);
  if (!(swung.z < -0.2)) failures.push("leg swing +x does not move the foot toward −z");
  const leftSpin = helmSpin(-1);
  if (!(-Math.sin(leftSpin) < -0.4)) failures.push("left steer does not roll the wheel toward −x");
  const scoreIds = new Set();
  for (const score of SOUNDTRACKS) {
    if (!score.id || !score.name || !Array.isArray(score.files) || score.files.length < 1) failures.push("soundtrack entry needs id, name, and files");
    if (score.id === "none" || scoreIds.has(score.id)) failures.push(`soundtrack id ${score.id} is reserved or repeated`);
    scoreIds.add(score.id);
  }
  let eased = 0;
  const one = smoothToward(0, -1, 1 / 60, 1);
  if (!(one < -0.02 && one > -0.12)) failures.push(`steer moved too far in one frame (${one.toFixed(3)})`);
  for (let i = 0; i < 8; i++) eased = smoothToward(eased, -1, 1 / 60, 1);
  if (!(eased < -0.2 && eased > -0.55)) failures.push(`steer ramp is out of range (${eased.toFixed(2)})`);
  let released = -1;
  for (let i = 0; i < 20; i++) released = smoothToward(released, 0, 1 / 60, 1);
  if (!(released < -0.05 && released > -0.7)) failures.push(`steer did not ease back (${released.toFixed(2)})`);
  for (let i = 0; i < 180; i++) released = smoothToward(released, 0, 1 / 60, 1);
  if (released !== 0) failures.push("steer did not return to center");
  for (const vehicle of VEHICLES) {
    const rig = cockpitSpec(vehicle);
    const nose = carForward(0);
    const right = rightOf(nose);
    const lookX = nose.x * rig.look;
    const lookZ = nose.z * rig.look;
    const lookLen = Math.hypot(lookX, lookZ) || 1;
    if (lookX / lookLen * nose.x + lookZ / lookLen * nose.z < 0.99) failures.push(`${vehicle.id} cockpit does not look along the nose`);
    const seatX = right.x * rig.eyeX - nose.x * rig.eyeZ;
    if (vehicle.kind !== "cab" && seatX >= -0.15) failures.push(`${vehicle.id} driver eye is not on the left`);
    if (rig.wheel === "none" && vehicle.kind !== "cab") failures.push(`${vehicle.id} is missing a wheel`);
    if (!(rig.sink > 0.2) || !(rig.lookDrop > 0.3)) failures.push(`${vehicle.id} cockpit framing is missing`);
  }
  const bore = boreProfile();
  if (bore.crown < 4.8) failures.push(`tunnel crown ${bore.crown.toFixed(2)} is too low for the Semi`);
  if (bore.chord < 3.2) failures.push(`tunnel chord ${bore.chord.toFixed(2)} is too narrow for the Semi`);
  const obb = { x: 0, z: 0, yaw: 0, hx: 1, hz: 1, h: 2, base: 0 };
  const outside = pushOBB(1.5, 0, 0.8, obb);
  if (!outside.hit || outside.x < 1.7) failures.push("obb push failed");
  const clear = pushOBB(3, 0, 0.5, obb);
  if (clear.hit) failures.push("obb hit empty space");
  const upright = boreAxes(0, null, null);
  if (Math.abs(upright.fx) > 1e-6 || Math.abs(upright.fz + 1) > 1e-6) failures.push("upright nose is not −z");
  if (Math.abs(upright.rx - 1) > 1e-6 || Math.abs(upright.uy - 1) > 1e-6) failures.push("upright basis is not identity");
  const yawed = new THREE.Group();
  poseCarRoot(yawed, 0.4, null, null);
  const noseDir = new THREE.Vector3(0, 0, -1).applyQuaternion(yawed.quaternion);
  const expect = carForward(0.4);
  if (noseDir.x * expect.x + noseDir.z * expect.z < 0.99) failures.push("posed nose left the forward vector");
  const crown = boreAxes(0, 0, -1);
  if (!(crown.uy < -0.99) || Math.abs(crown.fz + 1) > 1e-6) failures.push("ceiling pose is not upside down on −z");
  const rightWall = boreAxes(0, -0.9, 0.4);
  if (!(rightWall.ux < -0.7)) failures.push("right-wall up does not point inward");
  if (!(Math.sin(0.8) > 0)) failures.push("positive bore angle is not toward track right");
  return failures;
}

const CONTROLS = [
  [-170, 100], [-40, 132], [100, 118], [190, 48], [200, -58],
  [130, -148], [10, -172], [-120, -148], [-196, -52], [-200, 36],
];

function panelTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 1024;
  const g = canvas.getContext("2d");
  g.fillStyle = "#d5dde6";
  g.fillRect(0, 0, 256, 1024);
  g.strokeStyle = "rgba(55, 64, 74, 0.55)";
  g.lineWidth = 3;
  for (let y = 0; y < 1024; y += 32) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(256, y);
    g.stroke();
  }
  for (const x of [86, 170]) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, 1024);
    g.stroke();
  }
  g.fillStyle = "rgba(92, 104, 118, 0.28)";
  for (let i = 0; i < 36; i++) {
    g.fillRect((i * 83) % 230, (i * 61) % 990, 40, 16);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function cityTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 128;
  const g = canvas.getContext("2d");
  g.fillStyle = "#141820";
  g.fillRect(0, 0, 64, 128);
  for (let y = 6; y < 124; y += 10) {
    for (let x = 4; x < 60; x += 8) {
      const n = hash2(x, y);
      if (n < 0.42) continue;
      g.fillStyle = n > 0.72 ? "#7ef6ff" : "#ff4fd8";
      g.globalAlpha = 0.45 + (n % 0.4);
      g.fillRect(x, y, 3, 5);
    }
  }
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function boot() {
  const frameFailures = selfTestFrame();
  try {
    const storedLevel = localStorage.getItem("twr-diff");
    if (storedLevel === "novice" || storedLevel === "medium" || storedLevel === "expert") {
      document.querySelectorAll("[data-diff]").forEach((el) => {
        el.classList.toggle("is-on", el.dataset.diff === storedLevel);
      });
    }
  } catch { /* private mode */ }
  let course = null;
  for (let attempt = 0; attempt < 24 && !course; attempt++) {
    course = generateCourse((Math.random() * 0x7fffffff) | 0, chosenLevel());
  }
  if (!course) throw new Error("Could not build a race course");
  let samples = course.samples;
  let cx = course.cx;
  let cz = course.cz;
  let columns = course.columns;
  let bore = course.bore;
  let tunnel = course.tunnel;
  let crossings = course.crossings;
  let boxes = course.boxes;
  let pads = course.pads;
  const enter = tunnel.start;
  const homeCx = cx;
  const homeCz = cz;

  const layoutFailures = [];
  let minWall = Infinity;
  let minPinch = Infinity;
  for (const s of samples) {
    for (const column of columns) {
      const gap = Math.hypot(s.x - column.x, s.z - column.z) - column.r;
      if (gap < 16) layoutFailures.push(`${column.id} is ${gap.toFixed(1)}m from the racing line`);
    }
    for (const box of boxes) {
      const gap = Math.hypot(s.x - box.x, s.z - box.z) - box.hx;
      if (box.pinch) minPinch = Math.min(minPinch, gap);
      else minWall = Math.min(minWall, Math.hypot(s.x - box.x, s.z - box.z));
    }
  }
  if (minWall < 6) layoutFailures.push(`barrier sits ${minWall.toFixed(1)}m off the racing line`);
  if (minPinch < 2.3) layoutFailures.push(`tunnel wall sits ${minPinch.toFixed(1)}m off the racing line`);
  const mouthIn = samples[tunnel.start].y;
  const mouthOut = samples[tunnel.start + tunnel.span - 1].y;
  const floor = samples[tunnel.start + (tunnel.span >> 1)].y;
  if (Math.abs(mouthIn) > 0.05 || Math.abs(mouthOut) > 0.05) layoutFailures.push("tunnel mouth is not at ground level");
  if (floor > -4) layoutFailures.push(`tunnel only drops ${floor.toFixed(1)}m`);
  if (floor + bore.crown > -1) layoutFailures.push("tunnel crown is not underground");
  if (samples[enter].half > bore.chord - 0.25) layoutFailures.push("tunnel mouth road does not fit the bore");
  if (samples[tunnel.start + (tunnel.span >> 1)].half > bore.chord - 0.25) layoutFailures.push("tunnel road is wider than the bore");
  const failures = [...frameFailures, ...layoutFailures];

  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  document.body.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070814, 0.0065);
  const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.45, 1400);

  const asphalt = makeMaps(512, (h, speckle) => {
    const base = 58 + h * 36 + (speckle > 0.96 ? 22 : 0);
    return [base, base + 1, base + 3];
  });
  const concrete = makeMaps(256, (h) => {
    const base = 62 + h * 18;
    return [base, base + 1, base + 2];
  });
  steelMat.map = panelTexture();
  steelMat.needsUpdate = true;

  const roadMat = new THREE.MeshPhysicalMaterial({
    map: asphalt.color,
    normalMap: asphalt.normal,
    roughnessMap: asphalt.rough,
    roughness: 0.94,
    metalness: 0.02,
    envMapIntensity: 0.25,
  });
  const road = new THREE.Mesh(ribbonGeometry(samples, 0, (p) => p.half, 0.045, null), roadMat);
  road.receiveShadow = true;
  scene.add(road);

  const curbMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.58, metalness: 0.02 });
  const curbColor = (p) => {
    const band = Math.floor(p.dist / 2.2) % 2 === 0 ? [0.85, 0.1, 0.16] : [0.9, 0.9, 0.92];
    return band;
  };
  const curbMeshes = [];
  for (const side of [-1, 1]) {
    const curb = new THREE.Mesh(ribbonGeometry(samples, (p) => side * (p.half + 0.36), 0.22, 0.08, curbColor), curbMat);
    curb.receiveShadow = true;
    scene.add(curb);
    curbMeshes.push(curb);
  }
  const lineMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4fbff, roughness: 0.45, emissive: 0x123040, emissiveIntensity: 0.3,
  });
  const lineMeshes = [
    new THREE.Mesh(ribbonGeometry(samples, 0, 0.07, 0.07, null, true), lineMat),
    new THREE.Mesh(ribbonGeometry(samples, (p) => p.half - 0.42, 0.06, 0.06, null), lineMat),
    new THREE.Mesh(ribbonGeometry(samples, (p) => -(p.half - 0.42), 0.06, 0.06, null), lineMat),
  ];
  for (const line of lineMeshes) scene.add(line);

  function rebuildRibbons() {
    road.geometry.dispose();
    road.geometry = ribbonGeometry(samples, 0, (p) => p.half, 0.045, null);
    curbMeshes.forEach((mesh, index) => {
      const side = index === 0 ? -1 : 1;
      mesh.geometry.dispose();
      mesh.geometry = ribbonGeometry(samples, (p) => side * (p.half + 0.36), 0.22, 0.08, curbColor);
    });
    const specs = [
      [0, 0.07, true],
      [(p) => p.half - 0.42, 0.06, false],
      [(p) => -(p.half - 0.42), 0.06, false],
    ];
    lineMeshes.forEach((mesh, index) => {
      const [side, width, dash] = specs[index];
      mesh.geometry.dispose();
      mesh.geometry = ribbonGeometry(samples, side, width, width, null, dash);
    });
  }

  const groundMat = new THREE.MeshPhysicalMaterial({
    map: concrete.color, normalMap: concrete.normal, roughness: 0.96, metalness: 0.02,
  });
  const cutPacked = new Float32Array(32 * 4);
  let cutCount = 0;
  function syncCuts() {
    const cutSegs = [];
    for (let i = tunnel.start; i < tunnel.start + tunnel.span - 1; i++) {
      const a = samples[i];
      const b = samples[i + 1];
      const open = (point) => (point.y || 0) < 0.3 && (point.y || 0) + bore.crown > -0.4;
      if (!open(a) && !open(b)) continue;
      cutSegs.push([a.x, a.z, b.x, b.z]);
    }
    cutCount = Math.min(32, cutSegs.length);
    for (let i = 0; i < 32; i++) {
      const seg = cutSegs[Math.min(i, Math.max(0, cutCount - 1))] || [0, 0, 0, 0];
      cutPacked.set(seg, i * 4);
    }
    groundMat.userData.cutRadius = bore.chord + 1.15;
    const shader = groundMat.userData.shader;
    if (shader) {
      shader.uniforms.uCutN.value = cutCount;
      shader.uniforms.uCutR.value = groundMat.userData.cutRadius;
    }
    return cutCount;
  }
  if (syncCuts() < 4) failures.push(`tunnel mouth cut is only ${cutCount} segments`);
  groundMat.onBeforeCompile = (shader) => {
    groundMat.userData.shader = shader;
    shader.uniforms.uCut = { value: cutPacked };
    shader.uniforms.uCutN = { value: cutCount };
    shader.uniforms.uCutR = { value: groundMat.userData.cutRadius };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vGroundWorld;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvGroundWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vGroundWorld;\nuniform vec4 uCut[32];\nuniform float uCutN;\nuniform float uCutR;")
      .replace("#include <clipping_planes_fragment>", `#include <clipping_planes_fragment>
        for (int i = 0; i < 32; i++) {
          if (float(i) >= uCutN) continue;
          vec2 a = uCut[i].xy;
          vec2 b = uCut[i].zw;
          vec2 pa = vGroundWorld.xz - a;
          vec2 ba = b - a;
          float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
          if (dot(pa - ba * h, pa - ba * h) < uCutR * uCutR) discard;
        }`);
  };
  groundMat.customProgramCacheKey = () => "tunnel-ground-cut";
  const ground = new THREE.Mesh(new THREE.CircleGeometry(520, 64), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const pad = new THREE.Mesh(
    new THREE.CircleGeometry(46, 48),
    new THREE.MeshPhysicalMaterial({ color: 0x2a3038, roughness: 0.8, metalness: 0.15 }),
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(cx, 0.03, cz);
  pad.receiveShadow = true;
  scene.add(pad);

  function starship(column, scale) {
    const group = new THREE.Group();
    group.position.set(column.x, 0, column.z);
    const radius = 4.15 * scale;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.06, column.h * 0.7, 28), steelMat);
    body.position.y = column.h * 0.46;
    body.castShadow = true;
    const noseCone = new THREE.Mesh(new THREE.ConeGeometry(radius, column.h * 0.2, 28), steelMat);
    noseCone.position.y = column.h * 0.88;
    noseCone.castShadow = true;
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.08, radius * 1.2, column.h * 0.1, 24), engineMat);
    skirt.position.y = column.h * 0.08;
    skirt.castShadow = true;
    group.add(body, noseCone, skirt);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.55 * scale, 0.95 * scale, 1.6, 12), bellMat);
      bell.position.set(Math.cos(a) * radius * 0.55, 1.1, Math.sin(a) * radius * 0.55);
      group.add(bell);
    }
    for (const side of [-1, 1]) {
      for (const fwd of [-1, 1]) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.22, column.h * 0.07, 3.4 * scale), steelMat);
        fin.position.set(side * radius * 1.15, column.h * 0.72, fwd * 1.2 * scale);
        fin.rotation.y = side * fwd * 0.5;
        fin.castShadow = true;
        group.add(fin);
      }
    }
    const bandMat = new THREE.MeshPhysicalMaterial({
      color: 0xff2bd6, emissive: 0xff2bd6, emissiveIntensity: 1.3, roughness: 0.35,
    });
    const band = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.02, 0.16, 8, 28), bandMat);
    band.rotation.x = Math.PI / 2;
    band.position.y = column.h * 0.58;
    const windows = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 1.01, 0.08, 8, 28),
      new THREE.MeshPhysicalMaterial({ color: 0xb7f7ff, emissive: 0x7ee8ff, emissiveIntensity: 1.1, roughness: 0.3 }),
    );
    windows.rotation.x = Math.PI / 2;
    windows.position.y = column.h * 0.5;
    group.add(band, windows);
    const flameGeo = new THREE.ConeGeometry(radius * 0.72, 1, 18);
    flameGeo.rotateX(Math.PI);
    flameGeo.translate(0, -0.5, 0);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xfff6e8,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.y = 1.35;
    const glowGeo = new THREE.ConeGeometry(radius * 1.55, 1, 16);
    glowGeo.rotateX(Math.PI);
    glowGeo.translate(0, -0.5, 0);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff7a2a,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.y = 1.2;
    const flameLight = new THREE.PointLight(0xff7a2a, 0, 58, 2);
    flameLight.position.set(0, 2.2, 0);
    group.add(flame, glow, flameLight);
    scene.add(group);
    const fill = new THREE.PointLight(0xd5e4ff, 4, 32, 2);
    fill.position.set(column.x + 10 * scale, column.h * 0.42, column.z + 8);
    scene.add(fill);
    return { group, bandMat, flame, flameMat, glow, glowMat, flameLight, fill, column, scale };
  }
  const ships = columns.map((column, index) => starship(column, index === 0 ? 1 : 0.86));
  const shipBands = ships.map((ship) => ship.bandMat);

  const towerGroup = new THREE.Group();
  for (const leg of [8, 22]) {
    const mast = new THREE.Mesh(new THREE.BoxGeometry(1.6, 52, 1.6), steelMat);
    mast.position.set(cx - 28, 26, cz + leg);
    mast.castShadow = true;
    towerGroup.add(mast);
  }
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 16), steelMat);
  arm.position.set(cx - 28, 38, cz + 15);
  arm.castShadow = true;
  const beacon = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.35, 1.8),
    new THREE.MeshPhysicalMaterial({ color: 0x2ee7ff, emissive: 0x2ee7ff, emissiveIntensity: 2, roughness: 0.3 }),
  );
  beacon.position.set(cx - 28, 52.2, cz + 15);
  towerGroup.add(arm, beacon);
  scene.add(towerGroup);

  const towerLight = new THREE.SpotLight(0xd7e7ff, 90, 140, 0.55, 0.35, 1);
  towerLight.position.set(cx - 40, 48, cz + 15);
  const towerTarget = new THREE.Object3D();
  towerTarget.position.set(cx, 36, cz);
  scene.add(towerLight, towerTarget);
  towerLight.target = towerTarget;

  const cityMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: cityTexture(),
    emissive: 0xffffff,
    emissiveMap: null,
    roughness: 0.82,
    metalness: 0.08,
  });
  cityMat.emissiveMap = cityMat.map;
  const cityGeo = new THREE.BoxGeometry(1, 1, 1);
  const cityUv = cityGeo.attributes.uv;
  for (let i = 0; i < cityUv.count; i++) cityUv.setXY(i, cityUv.getX(i) * 3, cityUv.getY(i) * 6);
  const city = new THREE.InstancedMesh(cityGeo, cityMat, 42);
  city.castShadow = true;
  city.receiveShadow = true;
  const cityDummy = new THREE.Object3D();
  function seatCity() {
    let placed = 0;
    for (let i = 0; i < samples.length && placed < 42; i += 8) {
      const s = samples[i];
      const ox = s.x - cx;
      const oz = s.z - cz;
      const olen = Math.hypot(ox, oz) || 1;
      const reach = 34 + (placed % 4) * 9;
      const h = 12 + ((placed * 19) % 26);
      const w = 9 + (placed % 3) * 4;
      cityDummy.position.set(s.x + (ox / olen) * reach, h / 2, s.z + (oz / olen) * reach);
      cityDummy.rotation.y = Math.atan2(ox, oz);
      cityDummy.scale.set(w, h, w * 0.62);
      cityDummy.updateMatrix();
      city.setMatrixAt(placed, cityDummy.matrix);
      placed += 1;
    }
    city.count = placed;
    city.instanceMatrix.needsUpdate = true;
  }
  seatCity();
  scene.add(city);

  const WALL_CAP = 900;
  const wallGeo = new THREE.BoxGeometry(1, 1, 1);
  const wallMat = new THREE.MeshPhysicalMaterial({ color: 0x141820, roughness: 0.72, metalness: 0.35 });
  const walls = new THREE.InstancedMesh(wallGeo, wallMat, WALL_CAP);
  walls.castShadow = true;
  walls.receiveShadow = true;
  const neonMat = new THREE.MeshPhysicalMaterial({
    color: 0x2ee7ff, emissive: 0x2ee7ff, emissiveIntensity: 1.4, roughness: 0.3,
  });
  const neons = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), neonMat, WALL_CAP);
  const dummy = new THREE.Object3D();
  function fillWalls() {
    const barrierBoxes = boxes.filter((box) => box.h < 4 && !box.pinch);
    const count = Math.min(WALL_CAP, barrierBoxes.length);
    for (let index = 0; index < count; index++) {
      const box = barrierBoxes[index];
      const base = box.base || 0;
      dummy.position.set(box.x, base + box.h / 2, box.z);
      dummy.rotation.y = box.yaw;
      dummy.scale.set(box.hx * 2, box.h, box.hz * 2);
      dummy.updateMatrix();
      walls.setMatrixAt(index, dummy.matrix);
      dummy.position.y = base + box.h - 0.08;
      dummy.scale.set(box.hx * 2.05, 0.08, box.hz * 2);
      dummy.updateMatrix();
      neons.setMatrixAt(index, dummy.matrix);
    }
    walls.count = count;
    neons.count = count;
    walls.instanceMatrix.needsUpdate = true;
    neons.instanceMatrix.needsUpdate = true;
  }
  fillWalls();
  scene.add(walls, neons);

  function disposeGroup(group) {
    const geos = new Set();
    group.traverse((obj) => {
      if (obj.geometry) geos.add(obj.geometry);
    });
    group.clear();
    for (const geo of geos) geo.dispose();
  }

  const tunnelRoot = new THREE.Group();
  scene.add(tunnelRoot);
  const dressRoot = new THREE.Group();
  scene.add(dressRoot);

  function loopTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const g = canvas.getContext("2d");
    g.fillStyle = "#e4e0d8";
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 700; i++) {
      g.fillStyle = `rgba(90, 86, 78, ${0.05 + (i % 4) * 0.02})`;
      g.fillRect((i * 53) % 256, (i * 31) % 256, 3, 2);
    }
    g.strokeStyle = "rgba(72, 68, 62, 0.7)";
    g.lineWidth = 8;
    g.beginPath();
    g.moveTo(0, 6);
    g.lineTo(256, 6);
    g.stroke();
    g.strokeStyle = "rgba(255, 252, 246, 0.45)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, 14);
    g.lineTo(256, 14);
    g.stroke();
    g.strokeStyle = "rgba(60, 58, 54, 0.4)";
    g.lineWidth = 2;
    for (let x = 0; x < 256; x += 42) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 256);
      g.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 8;
    return tex;
  }

  const loopMat = new THREE.MeshPhysicalMaterial({
    color: 0xf7f4ee,
    map: loopTexture(),
    roughness: 0.94,
    metalness: 0,
    envMapIntensity: 0.12,
    side: THREE.DoubleSide,
  });
  const crownMat = new THREE.MeshStandardMaterial({
    color: 0xf4f7ff,
    emissive: 0xe7eef8,
    emissiveIntensity: 1.15,
    roughness: 0.35,
    side: THREE.DoubleSide,
  });
  const edgeMat = new THREE.MeshStandardMaterial({
    color: 0xd5ecff,
    emissive: 0x8ecfff,
    emissiveIntensity: 1.05,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });
  const apronMat = new THREE.MeshPhysicalMaterial({
    color: 0xd5d0c8, roughness: 0.92, metalness: 0.02, side: THREE.DoubleSide,
  });

  function archPoint(s, angle, radius) {
    const lateral = Math.sin(angle) * radius;
    return {
      x: s.x + s.rx * lateral,
      y: (s.y || 0) + BORE_Y + Math.cos(angle) * radius,
      z: s.z + s.rz * lateral,
    };
  }

  function addArchMesh(stations, radius, segs, material, vScale) {
    const positions = [];
    const uvs = [];
    const indices = [];
    const row = segs + 1;
    stations.forEach((s, i) => {
      for (let j = 0; j <= segs; j++) {
        const a = -bore.arch + (j / segs) * bore.arch * 2;
        const p = archPoint(s, a, radius);
        positions.push(p.x, p.y, p.z);
        uvs.push(j / segs, s.dist / vScale);
      }
      if (i === 0) return;
      for (let j = 0; j < segs; j++) {
        const a = (i - 1) * row + j;
        const b = i * row + j;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    tunnelRoot.add(mesh);
    return mesh;
  }

  function mountTunnel() {
    disposeGroup(tunnelRoot);
    const tunnelStations = samples.slice(tunnel.start, tunnel.start + tunnel.span);
    addArchMesh(tunnelStations, BORE_R, 24, loopMat, 2.2);
    const crownStations = tunnelStations.filter((_, i) => i % 1 === 0);
    const crownPos = [];
    const edgePos = [];
    for (let i = 0; i < crownStations.length; i++) {
      const s = crownStations[i];
      const crown = archPoint(s, 0, BORE_R - 0.12);
      crownPos.push(crown.x, crown.y, crown.z);
      for (const sign of [-1, 1]) {
        const edge = archPoint(s, sign * (bore.arch - 0.08), BORE_R - 0.08);
        edgePos.push(edge.x, edge.y + 0.08, edge.z);
      }
      if (i > 0 && i % 6 === 0) {
        const light = new THREE.PointLight(0xf7f4ee, 1.6, 18, 2);
        light.position.set(crown.x, crown.y - 0.35, crown.z);
        tunnelRoot.add(light);
      }
    }
    function ribbonStrip(points, width, material) {
      const positions = [];
      const indices = [];
      for (let i = 0; i < points.length; i += 3) {
        const s = crownStations[i / 3];
        positions.push(points[i] - s.rx * width, points[i + 1], points[i + 2] - s.rz * width);
        positions.push(points[i] + s.rx * width, points[i + 1], points[i + 2] + s.rz * width);
        if (i === 0) continue;
        const a = (i / 3 - 1) * 2;
        indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      tunnelRoot.add(new THREE.Mesh(geo, material));
    }
    ribbonStrip(crownPos, 0.16, crownMat);
    const leftEdge = [];
    const rightEdge = [];
    for (let i = 0; i < edgePos.length; i += 6) {
      leftEdge.push(edgePos[i], edgePos[i + 1], edgePos[i + 2]);
      rightEdge.push(edgePos[i + 3], edgePos[i + 4], edgePos[i + 5]);
    }
    ribbonStrip(leftEdge, 0.08, edgeMat);
    ribbonStrip(rightEdge, 0.08, edgeMat);
    addArchMesh([tunnelStations[0], tunnelStations[1]], BORE_R + 0.38, 24, loopMat, 8);
    addArchMesh(tunnelStations.slice(-2), BORE_R + 0.38, 24, loopMat, 8);

    const apronPos = [];
    const apronIdx = [];
    const apronStations = [];
    for (let i = tunnel.start - 2; i <= tunnel.start + 2; i++) apronStations.push(samples[i]);
    for (let i = tunnel.start + tunnel.span - 3; i <= tunnel.start + tunnel.span + 1; i++) apronStations.push(samples[i]);
    apronStations.forEach((s, i) => {
      for (const side of [-1, 1]) {
        const inner = bore.chord + 0.15;
        const outer = WALL_OFFSET + 1.2;
        apronPos.push(s.x + s.rx * side * inner, 0.08, s.z + s.rz * side * inner);
        apronPos.push(s.x + s.rx * side * outer, 0.08, s.z + s.rz * side * outer);
      }
      if (i === 0 || i === 5) return;
      const base = (i - 1) * 4;
      const here = i * 4;
      for (const side of [0, 2]) {
        apronIdx.push(base + side, here + side, base + side + 1, base + side + 1, here + side, here + side + 1);
      }
    });
    const apronGeo = new THREE.BufferGeometry();
    apronGeo.setAttribute("position", new THREE.Float32BufferAttribute(apronPos, 3));
    apronGeo.setIndex(apronIdx);
    apronGeo.computeVertexNormals();
    const apron = new THREE.Mesh(apronGeo, apronMat);
    apron.receiveShadow = true;
    tunnelRoot.add(apron);
  }
  mountTunnel();


  const debug = new THREE.Group();
  debug.visible = false;
  const debugMat = new THREE.MeshBasicMaterial({ color: 0x2ee7ff, wireframe: true });
  scene.add(debug);
  function rebuildDebug() {
    disposeGroup(debug);
    for (const box of boxes) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(box.hx * 2, box.h, box.hz * 2), debugMat);
      mesh.position.set(box.x, (box.base || 0) + box.h / 2, box.z);
      mesh.rotation.y = box.yaw;
      debug.add(mesh);
    }
    for (const column of columns) {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(column.r, column.r, column.h, 16), debugMat);
      mesh.position.set(column.x, column.h / 2, column.z);
      debug.add(mesh);
    }
  }
  rebuildDebug();

  const checkpoints = [];
  const gates = [];
  const gateMat = new THREE.MeshPhysicalMaterial({
    color: 0xff2bd6, emissive: 0xff2bd6, emissiveIntensity: 0.4, roughness: 0.3,
  });
  function refreshGates() {
    for (const gate of gates) {
      scene.remove(gate);
      gate.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material && obj.material !== gateMat) obj.material.dispose();
      });
    }
    gates.length = 0;
    checkpoints.length = 0;
    for (let i = 0; i < 8; i++) {
      const gateIndex = Math.floor((i / 8) * samples.length);
      const gate = samples[gateIndex];
      checkpoints.push(gate);
      const group = new THREE.Group();
      group.position.set(gate.x, gate.y || 0, gate.z);
      scene.add(group);
      gates.push(group);
      const inBore = gateIndex >= tunnel.start - 1 && gateIndex < tunnel.start + tunnel.span + 1;
      if (gateIndex === 0 || inBore || Math.abs(gate.y || 0) > 0.35) continue;
      const mat = gateMat.clone();
      group.userData.mat = mat;
      for (const side of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 4.5, 0.25), mat);
        post.position.set(gate.rx * 8 * side, 2.25, gate.rz * 8 * side);
        group.add(post);
      }
      const beam = new THREE.Mesh(new THREE.BoxGeometry(16, 0.12, 0.12), mat);
      beam.position.y = 4.4;
      beam.rotation.y = yawFromForward(gate.fx, gate.fz);
      group.add(beam);
    }
  }
  refreshGates();

  const chargePadViews = [];
  const dress = {
    dark: new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.55 }),
    light: new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.45 }),
    post: new THREE.MeshStandardMaterial({ color: 0x1c2128, roughness: 0.55, metalness: 0.35 }),
    pier: new THREE.MeshStandardMaterial({ color: 0x3c434c, roughness: 0.82 }),
    water: new THREE.MeshStandardMaterial({ color: 0x163038, roughness: 0.18, metalness: 0.55, transparent: true, opacity: 0.9 }),
    dune: new THREE.MeshStandardMaterial({ color: 0x8a7044, roughness: 0.96 }),
    solar: new THREE.MeshStandardMaterial({ color: 0x1a2838, roughness: 0.32, metalness: 0.62, emissive: 0x102030, emissiveIntensity: 0.2 }),
    shed: new THREE.MeshStandardMaterial({ color: 0x2a3138, roughness: 0.72, metalness: 0.18 }),
    skylight: new THREE.MeshStandardMaterial({ color: 0xc5d0d8, emissive: 0xa8b6c0, emissiveIntensity: 0.22, roughness: 0.4 }),
    vent: new THREE.MeshStandardMaterial({ color: 0x24282e, roughness: 0.5, metalness: 0.45 }),
    dome: new THREE.MeshStandardMaterial({ color: 0xd5dbe3, roughness: 0.38, metalness: 0.12 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x1c2430, roughness: 0.15, metalness: 0.7, emissive: 0x123040, emissiveIntensity: 0.18 }),
    embank: new THREE.MeshStandardMaterial({ color: 0x6e6248, roughness: 0.95, side: THREE.DoubleSide }),
  };

  function farFromRoad(x, z, minGap) {
    for (let i = 0; i < samples.length; i += 2) {
      const s = samples[i];
      if (Math.hypot(x - s.x, z - s.z) < minGap) return false;
    }
    return true;
  }

  function mountDressing() {
    disposeGroup(dressRoot);
    for (const view of chargePadViews) {
      if (view.mat) view.mat.dispose();
    }
    chargePadViews.length = 0;
    const start = samples[0];
    const banner = new THREE.Group();
    banner.position.set(start.x, start.y || 0, start.z);
    banner.rotation.y = yawFromForward(start.fx, start.fz);
    const span = (start.half + 1.15) * 2;
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.28, 6.7, 0.28), dress.post);
      post.position.set(side * (start.half + 0.9), 3.35, 0);
      post.castShadow = true;
      banner.add(post);
    }
    const squares = 12;
    const clothW = span / squares;
    for (let i = 0; i < squares; i++) {
      const cloth = new THREE.Mesh(
        new THREE.BoxGeometry(clothW * 0.98, 1.15, 0.08),
        i % 2 === 0 ? dress.dark : dress.light,
      );
      cloth.position.set(-span / 2 + clothW * (i + 0.5), 5.9, 0);
      banner.add(cloth);
    }
    dressRoot.add(banner);

    const embPos = [];
    const embIdx = [];
    let embV = 0;
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      if (s.role !== "hill" || (s.y || 0) < 0.4) continue;
      const n = samples[(i + 1) % samples.length];
      if (n.role !== "hill") continue;
      for (const side of [-1, 1]) {
        const inner = s.half + 0.25;
        const outer = s.half + 4.4;
        const y0 = (s.y || 0) - Math.sin(s.bank || 0) * side * inner;
        const y1 = (n.y || 0) - Math.sin(n.bank || 0) * side * inner;
        const quad = [
          [s.x + s.rx * side * inner, Math.max(0.05, y0), s.z + s.rz * side * inner],
          [s.x + s.rx * side * outer, 0.04, s.z + s.rz * side * outer],
          [n.x + n.rx * side * inner, Math.max(0.05, y1), n.z + n.rz * side * inner],
          [n.x + n.rx * side * outer, 0.04, n.z + n.rz * side * outer],
        ];
        for (const p of quad) embPos.push(p[0], p[1], p[2]);
        embIdx.push(embV, embV + 1, embV + 2, embV + 1, embV + 3, embV + 2);
        embV += 4;
      }
    }
    if (embV) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(embPos, 3));
      geo.setIndex(embIdx);
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, dress.embank);
      mesh.receiveShadow = true;
      dressRoot.add(mesh);
    }

    let bridgeMid = null;
    let pierStep = 0;
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      if (s.role !== "bridge" || (s.y || 0) < 5) continue;
      if (!bridgeMid || s.y > bridgeMid.y) bridgeMid = s;
      pierStep += 1;
      if (pierStep % 5 !== 0) continue;
      const h = Math.max(1.2, s.y - 0.8);
      const pier = new THREE.Mesh(new THREE.BoxGeometry(1.15, h, 1.15), dress.pier);
      pier.position.set(s.x, h / 2, s.z);
      pier.castShadow = true;
      dressRoot.add(pier);
    }
    if (bridgeMid) {
      const water = new THREE.Mesh(new THREE.BoxGeometry(18, 0.22, 78), dress.water);
      water.position.set(bridgeMid.x, 0.16, bridgeMid.z);
      water.rotation.y = Math.atan2(bridgeMid.rx, bridgeMid.rz);
      dressRoot.add(water);
    }

    const mouth = samples[Math.max(0, tunnel.start - 4)];
    const vent = new THREE.Group();
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, 6.2, 12), dress.vent);
    stack.position.y = 3.1;
    stack.castShadow = true;
    const lip = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.12, 8, 16), dress.skylight);
    lip.rotation.x = Math.PI / 2;
    lip.position.y = 6.15;
    vent.add(stack, lip);
    vent.position.set(mouth.x + mouth.rx * (WALL_OFFSET + 7), 0, mouth.z + mouth.rz * (WALL_OFFSET + 7));
    dressRoot.add(vent);

    const rng = mulberry32(course.seed || 1);
    function plant(mesh, gap) {
      for (let n = 0; n < 28; n++) {
        const ang = rng() * Math.PI * 2;
        const rad = 78 + rng() * 170;
        const x = cx + Math.cos(ang) * rad;
        const z = cz + Math.sin(ang) * rad;
        if (!farFromRoad(x, z, gap)) continue;
        mesh.position.x = x;
        mesh.position.z = z;
        mesh.rotation.y = ang;
        dressRoot.add(mesh);
        return;
      }
    }

    const shed = new THREE.Group();
    const shedBody = new THREE.Mesh(new THREE.BoxGeometry(78, 9, 32), dress.shed);
    shedBody.position.y = 4.5;
    shedBody.castShadow = true;
    shedBody.receiveShadow = true;
    shed.add(shedBody);
    for (let i = -2; i <= 2; i++) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(70, 0.12, 1.3), dress.skylight);
      strip.position.set(0, 9.02, i * 5);
      shed.add(strip);
    }
    plant(shed, 30);

    const solar = new THREE.Group();
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 8; col++) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 1.6), dress.solar);
        panel.position.set((col - 3.5) * 4.2, 1.15, (row - 2) * 3.1);
        panel.rotation.x = -0.5;
        solar.add(panel);
      }
    }
    plant(solar, 26);

    const dome = new THREE.Mesh(new THREE.SphereGeometry(7.5, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), dress.dome);
    dome.castShadow = true;
    plant(dome, 24);

    const cluster = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const cube = new THREE.Mesh(new THREE.BoxGeometry(5.5, 7 + i * 1.4, 5.5), dress.glass);
      cube.position.set((i - 1.5) * 7.5, 3.5 + i * 0.7, (i % 2) * 5);
      cube.castShadow = true;
      cluster.add(cube);
    }
    plant(cluster, 28);

    for (let i = 0; i < 12; i++) {
      const mound = new THREE.Mesh(new THREE.SphereGeometry(3.5 + rng() * 5.5, 12, 8), dress.dune);
      mound.scale.y = 0.35;
      const ang = rng() * Math.PI * 2;
      const rad = 36 + rng() * 230;
      const x = cx + Math.cos(ang) * rad;
      const z = cz + Math.sin(ang) * rad;
      if (!farFromRoad(x, z, 20)) continue;
      mound.position.set(x, 0.2, z);
      dressRoot.add(mound);
    }
    for (let i = 0; i < 16; i++) {
      const ang = rng() * Math.PI * 2;
      const rad = 100 + rng() * 190;
      const x = cx + Math.cos(ang) * rad;
      const z = cz + Math.sin(ang) * rad;
      if (!farFromRoad(x, z, 22)) continue;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 2.2, 6), dress.post);
      post.position.set(x, 1.1, z);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), dress.skylight);
      cap.position.set(x, 2.25, z);
      dressRoot.add(post, cap);
    }
    for (let i = 0; i < 8; i++) {
      const ang = rng() * Math.PI * 2;
      const rad = 42 + rng() * 80;
      const x = cx + Math.cos(ang) * rad;
      const z = cz + Math.sin(ang) * rad;
      if (Math.hypot(x - cx, z - cz) < 30 || !farFromRoad(x, z, 24)) continue;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1 + rng() * 1.8), dress.pier);
      rock.position.set(x, 0.35, z);
      rock.rotation.set(rng() * 0.6, rng() * 6, rng() * 0.4);
      rock.scale.y = 0.42;
      dressRoot.add(rock);
    }

    for (const pad of pads) {
      const s = samples[pad.index];
      const mat = dress.skylight.clone();
      mat.color = new THREE.Color(0xd7c4ff);
      mat.emissive = new THREE.Color(0xb794f6);
      mat.emissiveIntensity = 0.85;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.15, 0.16, 8, 24), mat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(s.x + s.rx * pad.lateral, (s.y || 0) + 0.18, s.z + s.rz * pad.lateral);
      dressRoot.add(ring);
      chargePadViews.push({ index: pad.index, lateral: pad.lateral, mesh: ring, mat, dark: 0 });
    }

    const arrowGeo = arrowGeometry();
    const arrowMat = new THREE.MeshBasicMaterial({
      color: 0xffe14a, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
    });
    for (let i = 8; i < samples.length; i += 12) {
      const s = samples[i];
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      arrow.name = "arrow";
      arrow.userData.index = i;
      arrow.position.set(s.x, (s.y || 0) + 0.16, s.z);
      arrow.rotation.y = yawFromForward(s.fx, s.fz);
      arrow.renderOrder = 2;
      dressRoot.add(arrow);
      if (s.role === "tunnel" && (s.y || 0) < -1.2) {
        for (const side of [-1, 1]) {
          const lat = side * (s.half + 5.5);
          const shoulder = new THREE.Mesh(arrowGeo, arrowMat);
          shoulder.name = "arrow";
          shoulder.userData.index = i;
          shoulder.userData.shoulder = true;
          shoulder.position.set(s.x + s.rx * lat, 0.12, s.z + s.rz * lat);
          shoulder.rotation.y = arrow.rotation.y;
          shoulder.renderOrder = 2;
          dressRoot.add(shoulder);
        }
      }
    }
  }
  mountDressing();

  function stepPads(dt) {
    for (const view of chargePadViews) {
      if (view.dark > 0) {
        view.dark = Math.max(0, view.dark - dt);
        view.mat.emissiveIntensity = 0.05;
      } else {
        view.mat.emissiveIntensity = 0.85;
      }
    }
  }

  function takePad(racer) {
    for (const view of chargePadViews) {
      if (view.dark > 0) continue;
      const s = samples[view.index];
      const x = s.x + s.rx * view.lateral;
      const z = s.z + s.rz * view.lateral;
      if (Math.hypot(racer.state.x - x, racer.state.z - z) > 3.15) continue;
      if (Math.abs(roadHeight(racer.state.x, racer.state.z) - (s.y || 0)) > 2.2) continue;
      // A car that already holds its one shot leaves the ring armed.
      if (racer.state.empCharge >= 1) continue;
      racer.state.empCharge = 1;
      view.dark = 8;
      view.mat.emissiveIntensity = 0.05;
    }
  }

  const sky = new Sky();
  sky.scale.setScalar(700);
  sky.renderOrder = -1;
  sky.material.uniforms.turbidity.value = 8;
  sky.material.uniforms.rayleigh.value = 1.8;
  sky.material.uniforms.mieCoefficient.value = 0.0025;
  sky.material.uniforms.mieDirectionalG.value = 0.72;
  sky.material.uniforms.cloudDensity.value = 0.22;
  sky.material.fragmentShader = sky.material.fragmentShader.replace(
    "gl_FragColor = vec4( texColor, 1.0 );",
    "gl_FragColor = vec4( texColor * 0.2, 1.0 );",
  );
  scene.add(sky);
  const nightSky = new THREE.Mesh(
    new THREE.SphereGeometry(620, 20, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      transparent: true,
      uniforms: { night: { value: 1 } },
      vertexShader: "varying vec3 vPos; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vPos = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
      fragmentShader: "varying vec3 vPos; uniform float night; void main(){ float h = normalize(vPos).y; vec3 col = mix(vec3(0.03,0.07,0.16), vec3(0.005,0.008,0.02), smoothstep(0.02, 0.55, h)); gl_FragColor = vec4(col, night); }",
    }),
  );
  nightSky.renderOrder = -2;
  scene.add(nightSky);
  const starPositions = new Float32Array(600 * 3);
  for (let i = 0; i < 600; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.72 + 0.28);
    const radius = 480;
    starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = radius * Math.cos(phi);
    starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0xf4fbff, size: 1.6, sizeAttenuation: false, transparent: true, depthWrite: false }),
  );
  stars.renderOrder = 0;
  scene.add(stars);
  const cosmos = new THREE.Group();
  const planetMat = new THREE.MeshBasicMaterial({ color: 0x6a5a38, transparent: true, opacity: 0.32, depthWrite: false });
  const planet = new THREE.Mesh(new THREE.SphereGeometry(26, 28, 18), planetMat);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xc4b48a, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(40, 1.1, 8, 48), ringMat);
  ring.rotation.x = 1.15;
  planet.add(ring);
  const moonMat = new THREE.MeshBasicMaterial({ color: 0x8d8a96, transparent: true, opacity: 0.3, depthWrite: false });
  const moonA = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), moonMat);
  moonA.position.set(58, 12, 10);
  const moonB = new THREE.Mesh(new THREE.SphereGeometry(3.2, 12, 10), moonMat);
  moonB.position.set(-46, -8, 22);
  planet.add(moonA, moonB);
  cosmos.add(planet);
  const nebulaMat = new THREE.MeshBasicMaterial({ color: 0x3a2458, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });
  const nebula = new THREE.Mesh(new THREE.SphereGeometry(90, 16, 12), nebulaMat);
  nebula.position.set(-180, 160, 40);
  const nebulaBMat = new THREE.MeshBasicMaterial({ color: 0x123040, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide });
  const nebulaB = new THREE.Mesh(new THREE.SphereGeometry(70, 14, 10), nebulaBMat);
  nebulaB.position.set(160, 190, -80);
  cosmos.add(nebula, nebulaB);
  const linkPositions = new Float32Array(36 * 3);
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    linkPositions[i * 3] = Math.cos(a) * 210;
    linkPositions[i * 3 + 1] = 70 + (i % 5) * 6;
    linkPositions[i * 3 + 2] = Math.sin(a) * 210;
  }
  const starlink = new THREE.Points(
    new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(linkPositions, 3)),
    new THREE.PointsMaterial({ color: 0x9fd7e4, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0.35, depthWrite: false }),
  );
  scene.add(cosmos, starlink);
  function styleCosmos(seed) {
    const hue = ((seed % 360) + 360) % 360 / 360;
    planetMat.color.setHSL(hue, 0.42, 0.28);
    planetMat.opacity = 0.3;
    ringMat.color.setHSL((hue + 0.08) % 1, 0.25, 0.55);
    nebulaMat.color.setHSL((hue + 0.72) % 1, 0.45, 0.16);
    nebulaBMat.color.setHSL((hue + 0.45) % 1, 0.4, 0.14);
    const ang = ((seed % 628) / 100);
    planet.position.set(Math.cos(ang) * 240, 130 + (seed % 30), Math.sin(ang) * 240);
    sky.material.uniforms.turbidity.value = 7.7 + (Math.abs(seed) % 8) * 0.08;
    sky.material.uniforms.cloudDensity.value = 0.18 + (Math.abs(seed) % 5) * 0.012;
  }
  styleCosmos(course.seed || 1);

  const rim = new THREE.PointLight(0xb7f7ff, 6, 7, 2);
  scene.add(rim);
  const sunDir = new THREE.Vector3();
  const sun = new THREE.DirectionalLight(0xfff5e6, 3.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 8;
  sun.shadow.camera.far = 180;
  sun.shadow.camera.left = sun.shadow.camera.bottom = -55;
  sun.shadow.camera.right = sun.shadow.camera.top = 55;
  sun.shadow.bias = -0.00025;
  sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);
  const moon = new THREE.DirectionalLight(0x8fb4ff, 0.35);
  scene.add(moon, moon.target);
  const hemi = new THREE.HemisphereLight(0x87a2c4, 0x141018, 0.55);
  scene.add(hemi);
  const padLightA = new THREE.PointLight(0xff2bd6, 30, 80, 2);
  padLightA.position.set(cx + 10, 8, cz - 10);
  const padLightB = new THREE.PointLight(0x2ee7ff, 26, 80, 2);
  padLightB.position.set(cx - 16, 6, cz + 12);
  scene.add(padLightA, padLightB);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(new THREE.HemisphereLight(0x203040, 0x100810, 1));
  for (const [color, x, y, z] of [[0x2ee7ff, 14, 6, -6], [0xff2bd6, -12, 8, 8], [0xffffff, 0, 18, 0]]) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(7, 7, 7),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 3, roughness: 0.35 }),
    );
    mesh.position.set(x, y, z);
    envScene.add(mesh);
  }
  const envMap = pmrem.fromScene(envScene, 0.04).texture;
  scene.environment = envMap;
  pmrem.dispose();

  const smoke = makePool(220, 0x6a7078, 1.4, 0.35, THREE.NormalBlending);
  const sparks = makePool(320, 0xffb15a, 0.16, 0.95, THREE.AdditiveBlending);
  const boost = makePool(240, 0x2ee7ff, 0.28, 0.85, THREE.AdditiveBlending);
  const fest = makePool(420, 0xfff3c4, 0.62, 0.95, THREE.AdditiveBlending);
  scene.add(smoke.pts, sparks.pts, boost.pts, fest.pts);
  const debris = [];
  const shardGeo = new THREE.BoxGeometry(0.22, 0.06, 0.34);
  for (let i = 0; i < 40; i++) {
    const glass = i % 3 === 1;
    const mat = new THREE.MeshStandardMaterial({
      color: glass ? 0xc5e8ff : i % 3 === 0 ? 0xd5dbe3 : 0x6a542c,
      metalness: glass ? 0.05 : 0.75,
      roughness: glass ? 0.15 : 0.4,
      transparent: true,
      opacity: 1,
      emissive: glass ? 0x8ecfff : 0x000000,
      emissiveIntensity: glass ? 0.35 : 0,
    });
    const mesh = new THREE.Mesh(shardGeo, mat);
    mesh.visible = false;
    mesh.castShadow = true;
    scene.add(mesh);
    debris.push({ mesh, life: 0, vx: 0, vy: 0, vz: 0, spin: 0 });
  }
  const plume = makePool(180, 0xff9a3c, 1.6, 0.42, THREE.AdditiveBlending);
  scene.add(plume.pts);
  const boltMat = new THREE.MeshBasicMaterial({
    color: 0xd7fbff, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const bolts = [];
  for (let i = 0; i < 8; i++) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 2.6), boltMat);
    mesh.visible = false;
    scene.add(mesh);
    bolts.push({ mesh, life: 0, x: 0, y: 0, z: 0, vx: 0, vz: 0, hover: 0.5, owner: null });
  }
  const flashes = [];
  for (let i = 0; i < 4; i++) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xe8fbff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    mesh.visible = false;
    scene.add(mesh);
    flashes.push({ mesh, life: 0 });
  }
  const bursts = [];
  for (let i = 0; i < 4; i++) {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.07, 8, 18),
      new THREE.MeshBasicMaterial({ color: 0xb7f6ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    );
    mesh.visible = false;
    scene.add(mesh);
    bursts.push({ mesh, life: 0 });
  }

  function spawnFlash(x, y, z, color) {
    const slot = flashes.find((item) => item.life <= 0) || flashes[0];
    slot.life = 0.16;
    slot.mesh.visible = true;
    slot.mesh.position.set(x, y, z);
    slot.mesh.scale.setScalar(1);
    slot.mesh.material.color.setHex(color || 0xe8fbff);
    slot.mesh.material.opacity = 0.85;
  }

  function spawnBurst(x, y, z) {
    const slot = bursts.find((item) => item.life <= 0) || bursts[0];
    slot.life = 0.36;
    slot.mesh.visible = true;
    slot.mesh.position.set(x, y, z);
    slot.mesh.rotation.x = Math.PI / 2;
    slot.mesh.scale.setScalar(1);
    slot.mesh.material.opacity = 0.75;
  }

  function tryFire(racer) {
    const state = racer.state;
    if (phase !== "race" || countdown > 0) return false;
    if (state.empStun > 0 || state.empCharge < 1 || state.empCool > 0) return false;
    const slot = bolts.find((bolt) => bolt.life <= 0);
    if (!slot) return false;
    state.empCharge = 0;
    state.empCool = racer === player ? 0.35 : 1.15;
    const fwd = carForward(state.yaw);
    const nose = racer.spec.length * 0.52;
    slot.x = state.x + fwd.x * nose;
    slot.z = state.z + fwd.z * nose;
    slot.hover = racer.spec.height * 0.45;
    slot.y = roadHeight(slot.x, slot.z) + slot.hover;
    slot.vx = fwd.x * 88;
    slot.vz = fwd.z * 88;
    slot.life = 0.55;
    slot.owner = racer;
    slot.mesh.visible = true;
    slot.mesh.position.set(slot.x, slot.y, slot.z);
    slot.mesh.rotation.y = Math.atan2(slot.vx, slot.vz);
    spawnFlash(slot.x, slot.y, slot.z);
    playZap();
    return true;
  }

  function stepBolts(dt) {
    for (const flash of flashes) {
      if (flash.life <= 0) {
        flash.mesh.visible = false;
        continue;
      }
      flash.life -= dt;
      const u = Math.max(0, flash.life / 0.12);
      flash.mesh.material.opacity = u * 0.8;
      flash.mesh.scale.setScalar(1 + (1 - u) * 1.6);
      if (flash.life <= 0) flash.mesh.visible = false;
    }
    for (const burst of bursts) {
      if (burst.life <= 0) {
        burst.mesh.visible = false;
        continue;
      }
      burst.life -= dt;
      const u = Math.max(0, burst.life / 0.36);
      burst.mesh.material.opacity = u * 0.7;
      burst.mesh.scale.setScalar(1 + (1 - u) * 4.2);
      if (burst.life <= 0) burst.mesh.visible = false;
    }
    const live = [player, ...pack].filter((racer) => racer.root.visible && (racer === player || racer.ai));
    for (const bolt of bolts) {
      if (bolt.life <= 0) {
        bolt.mesh.visible = false;
        continue;
      }
      const x0 = bolt.x;
      const z0 = bolt.z;
      bolt.x += bolt.vx * dt;
      bolt.z += bolt.vz * dt;
      bolt.y = roadHeight(bolt.x, bolt.z) + bolt.hover;
      bolt.life -= dt;
      bolt.mesh.position.set(bolt.x, bolt.y, bolt.z);
      bolt.mesh.rotation.y = Math.atan2(bolt.vx, bolt.vz);
      bolt.mesh.visible = bolt.life > 0;
      if (bolt.life <= 0) continue;
      for (const racer of live) {
        if (racer === bolt.owner || racer.state.empStun > 0) continue;
        const span = bodySpan(racer);
        const ry = roadHeight(racer.state.x, racer.state.z) + (span.bot + span.top) * 0.5;
        if (Math.abs(bolt.y - ry) > 3.2) continue;
        const dx = racer.state.x - x0;
        const dz = racer.state.z - z0;
        const sx = bolt.x - x0;
        const sz = bolt.z - z0;
        const len2 = sx * sx + sz * sz || 1;
        const t = clamp((dx * sx + dz * sz) / len2, 0, 1);
        const px = x0 + sx * t;
        const pz = z0 + sz * t;
        if (Math.hypot(racer.state.x - px, racer.state.z - pz) > 2.35) continue;
        racer.state.empStun = 2.6;
        racer.state.empSpin = Math.random() < 0.5 ? -1 : 1;
        racer.state.speed = 0;
        bolt.life = 0;
        bolt.mesh.visible = false;
        spawnBurst(racer.state.x, ry, racer.state.z);
        playEmpHit();
        break;
      }
    }
  }

  function aiEmp(racer) {
    const state = racer.state;
    const level = courseLevel(chosenLevel());
    if (level.empRange <= 0) return;
    if (state.empCharge < 1 || state.empCool > 0 || state.empStun > 0) return;
    const fwd = carForward(state.yaw);
    const others = [player, ...pack].filter((other) => other !== racer && other.root.visible && (other === player || other.ai));
    for (const other of others) {
      if (other.state.empStun > 0) continue;
      const mine = bodySpan(racer);
      const theirs = bodySpan(other);
      if (Math.abs((theirs.bot + theirs.top) * 0.5 - (mine.bot + mine.top) * 0.5) > 3) continue;
      const dx = other.state.x - state.x;
      const dz = other.state.z - state.z;
      const dist = Math.hypot(dx, dz);
      if (dist > level.empRange || dist < 6) continue;
      if ((dx / dist) * fwd.x + (dz / dist) * fwd.z > level.empDot) {
        tryFire(racer);
        return;
      }
    }
  }

  function tunnelDepth(sample) {
    if (!sample || sample.role !== "tunnel") return 0;
    return clamp(-(sample.y || 0) / TUNNEL_DEPTH, 0, 1);
  }

  function stickBore(racer) {
    const state = racer.state;
    if (!state.boreOn) return;
    const sample = samples[nearestIndex(samples, state.x, state.z)];
    const rad = BORE_R - BORE_SKIN;
    const lat = Math.sin(state.boreA) * rad;
    const along = (state.x - sample.x) * sample.fx + (state.z - sample.z) * sample.fz;
    state.x = sample.x + sample.fx * along + sample.rx * lat;
    state.z = sample.z + sample.fz * along + sample.rz * lat;
    state.boreH = BORE_Y + Math.cos(state.boreA) * rad;
    state.boreUpRight = -Math.sin(state.boreA);
    state.boreUpY = -Math.cos(state.boreA);
    state.yaw = yawFromForward(sample.fx, sample.fz);
  }

  // Player Roadster only. Steer climbs the bore; the racing line keeps the nose in the tunnel.
  function applyBoreRide(racer, input, dt) {
    const state = racer.state;
    const sample = samples[nearestIndex(samples, state.x, state.z)];
    const depth = sampleFrame(state.x, state.z).depth;
    if (racer !== player || racer.spec.kind !== "roadster") {
      state.boreOn = false;
      return;
    }
    if (depth < 0.68) {
      if (state.boreOn) {
        const lat = clamp((state.x - sample.x) * sample.rx + (state.z - sample.z) * sample.rz, -2.1, 2.1);
        state.x = sample.x + sample.rx * lat;
        state.z = sample.z + sample.rz * lat;
      }
      state.boreOn = false;
      state.boreH = 0;
      state.boreUpRight = 0;
      state.boreUpY = 1;
      return;
    }
    const steer = clamp(input.steer || 0, -1, 1);
    const latNow = (state.x - sample.x) * sample.rx + (state.z - sample.z) * sample.rz;
    if (!state.boreOn) {
      const climbAt = Math.min(2.25, bore.chord - 1.35);
      if (Math.abs(latNow) >= climbAt && steer * Math.sign(latNow || 1) > 0.35) {
        state.boreOn = true;
        state.boreA = Math.sign(latNow || 1) * bore.arch * 0.9;
        state.lift = 0;
        state.liftV = 0;
      } else {
        return;
      }
    }
    state.boreA = clamp(state.boreA + steer * 1.35 * dt, -bore.arch * 0.98, bore.arch * 0.98);
    if (Math.abs(state.boreA) > bore.arch * 0.96 && steer * Math.sign(state.boreA) > 0.45) {
      const edge = Math.sin(state.boreA) * (BORE_R - BORE_SKIN);
      state.x = sample.x + sample.rx * clamp(edge, -2.1, 2.1);
      state.z = sample.z + sample.rz * clamp(edge, -2.1, 2.1);
      state.boreOn = false;
      state.boreH = 0;
      state.boreUpRight = 0;
      state.boreUpY = 1;
      return;
    }
    stickBore(racer);
  }

  function applyTunnelBoost(state, spec, dt, brake) {
    if (state.speed <= 1 || brake > 0.4) return;
    const depth = sampleFrame(state.x, state.z).depth;
    if (depth < 0.45) return;
    const limit = spec.top * hullScale(state).top * (1.08 + 0.16 * depth);
    if (state.speed < limit) state.speed = Math.min(limit, state.speed + (16 * depth + spec.accel * 0.35) * dt);
  }

  function applyThrusters(racer, input, dt) {
    const state = racer.state;
    const allowed = racer === player && racer.spec.kind === "roadster" && !state.boreOn && state.empStun <= 0;
    const burning = Boolean(allowed && input.thrust && state.thrustFuel > 0.04);
    state.thrustOn = burning;
    if (!racer || racer.spec.kind !== "roadster" || racer !== player) {
      state.lift = 0;
      state.liftV = 0;
      state.thrustOn = false;
      return;
    }
    if (burning) {
      state.thrustFuel = Math.max(0, state.thrustFuel - dt);
      state.liftV += THRUST_PUSH * dt;
    } else if (state.thrustFuel < THRUST_FUEL) {
      state.thrustFuel = Math.min(THRUST_FUEL, state.thrustFuel + THRUST_REFILL * dt);
    }
    state.liftV -= THRUST_GRAV * dt;
    state.lift += state.liftV * dt;
    if (state.lift <= 0) {
      state.lift = 0;
      state.liftV = 0;
    } else if (state.lift > THRUST_CEIL) {
      state.lift = THRUST_CEIL;
      if (state.liftV > 0) state.liftV = 0;
    }
  }

  const openBoxes = [];
  function boxesFor(racer) {
    if (!racer.state.boreOn) return boxes;
    openBoxes.length = 0;
    for (const box of boxes) if (!box.pinch) openBoxes.push(box);
    return openBoxes;
  }

  function driveOne(racer, input, dt, aim, laps, actors) {
    const state = racer.state;
    if (state.empCool > 0) state.empCool = Math.max(0, state.empCool - dt);
    if (state.empStun > 0) {
      state.empStun = Math.max(0, state.empStun - dt);
      state.speed = 0;
      state.thrustOn = false;
      state.yaw = wrapAngle(state.yaw + state.empSpin * 5.4 * dt);
      state.liftV -= THRUST_GRAV * dt;
      state.lift = Math.max(0, state.lift + state.liftV * dt);
      if (state.lift === 0) state.liftV = 0;
      state.hit = false;
      return { steer: 0, throttle: 0, brake: 0 };
    }
    const slotted = state.boreOn && racer === player && racer.spec.kind === "roadster";
    const driveInput = slotted ? { ...input, steer: 0 } : input;
    const depthNow = sampleFrame(state.x, state.z).depth;
    const canThrust = racer === player && racer.spec.kind === "roadster" && !state.boreOn && input.thrust && state.thrustFuel > 0.04;
    state.thrustOn = Boolean(canThrust);
    state.boreDraft = depthNow > 0.45;
    state.driveLimit = 0;
    const hullTop = hullScale(state).top;
    if (state.boreDraft && state.speed > 1) state.driveLimit = racer.spec.top * hullTop * (1.08 + 0.16 * depthNow);
    if (canThrust) state.driveLimit = Math.max(state.driveLimit, racer.spec.top * hullTop + 6 * hullTop);
    const steerMul = state.boreDraft ? 1 + 0.55 * depthNow : 1;
    const felt = stepDrive(
      state, driveInput, racer.spec, dt, aim,
      gripAt(samples, state.x, state.z) * steerMul,
      (x, z, yaw, spec) => resolveBody(x, z, yaw, spec, boxesFor(racer), columns, actors, roadHeight(x, z) + spec.ride + (state.lift || 0)),
      checkpoints, laps,
    );
    applyGrade(state, racer.spec, dt);
    applyTunnelBoost(state, racer.spec, dt, driveInput.brake || 0);
    applyThrusters(racer, input, dt);
    applyBoreRide(racer, input, dt);
    if (slotted || state.boreOn) felt.steer = input.steer || 0;
    return felt;
  }



  const trackRobots = [];
  function clearForRobot(x, z) {
    for (const column of columns) {
      if (Math.hypot(x - column.x, z - column.z) < column.r + 5) return false;
    }
    return true;
  }
  function spawnRobot(x, z, yaw, phase, behavior) {
    if (!clearForRobot(x, z)) return null;
    const robot = buildOptimus();
    robot.position.set(x, 0, z);
    robot.rotation.y = yaw;
    Object.assign(robot.userData, {
      phase,
      gait: phase,
      mode: "patrol",
      timer: 2 + (phase % 3),
      dir: 1,
      gestureKind: Math.floor(Math.abs(phase) * 3) % 3,
      cooldown: 6 + (phase % 5) * 2,
      crosser: false,
      lateral: 0,
      home: 0,
      side: 1,
      index: 0,
      anchor: 0,
      gapIndex: 0,
      local: null,
    }, behavior);
    scene.add(robot);
    trackRobots.push(robot);
    return robot;
  }
  function flatAnchor(index) {
    const n = samples.length;
    const origin = ((Math.round(index) % n) + n) % n;
    for (let step = 0; step < n; step++) {
      const i = (origin + step) % n;
      const role = samples[i].role;
      if (role && role !== "flat") continue;
      if (Math.abs(samples[i].y || 0) > 0.4) continue;
      return i;
    }
    return origin;
  }
  for (let i = 10; i < samples.length; i += 22) {
    const index = flatAnchor(i);
    const s = samples[index];
    const side = Math.floor(i / 22) % 2 === 0 ? 1 : -1;
    const reach = 12.2 + (i % 5) * 0.45;
    const x = s.x + s.rx * side * reach;
    const z = s.z + s.rz * side * reach;
    const yaw = yawFromForward(s.fx, s.fz);
    spawnRobot(x, z, yaw, i * 0.13, {
      index, anchor: index, side, lateral: side * reach, home: side * reach,
    });
    if (i % 44 === 10) {
      const ahead = samples[(index + 4) % samples.length];
      spawnRobot(x + ahead.fx * 1.45, z + ahead.fz * 1.45, yaw, i * 0.13 + 1, {
        index: index + 1.2, anchor: index, side, lateral: side * (reach + 0.4), home: side * (reach + 0.4),
      });
    }
  }
  for (const spot of [
    [cx + 16, cz + 12, yawFromForward(-0.6, -1), 0.2],
    [cx + 17.4, cz + 13.6, yawFromForward(-0.2, -1), 1.4],
    [cx - 20, cz + 10, yawFromForward(0.8, -0.4), 2.1],
    [cx + 6, cz - 18, yawFromForward(-0.2, 1), 0.8],
  ]) {
    const face = carForward(spot[2]);
    spawnRobot(spot[0], spot[1], spot[2], spot[3], {
      local: { x: spot[0], z: spot[1], yaw: spot[2], dist: 0, dir: 1, fx: face.x, fz: face.z },
      localOff: { x: spot[0] - cx, z: spot[1] - cz },
    });
  }
  function assignCrossers() {
    for (const robot of trackRobots) {
      if (!robot.userData.local) robot.userData.crosser = false;
    }
    for (const crossing of crossings) {
      let best = null;
      let bestD = Infinity;
      for (const robot of trackRobots) {
        if (robot.userData.local || robot.userData.crosser) continue;
        if (robot.userData.side !== crossing.side) continue;
        const d = Math.abs(robot.userData.anchor - crossing.index);
        if (d < bestD) {
          bestD = d;
          best = robot;
        }
      }
      if (!best) continue;
      const s = samples[crossing.index];
      best.userData.crosser = true;
      best.userData.gapIndex = crossing.index;
      best.userData.anchor = crossing.index;
      best.userData.index = crossing.index;
      best.userData.cooldown = (5 + crossings.indexOf(crossing) * 6) * courseLevel(chosenLevel()).crossCool;
      best.position.set(
        s.x + s.rx * best.userData.home,
        0,
        s.z + s.rz * best.userData.home,
      );
    }
  }
  assignCrossers();

  function reseatRobots() {
    for (const robot of trackRobots) {
      const ud = robot.userData;
      ud.mode = "patrol";
      ud.timer = 2.2;
      if (ud.local && ud.localOff) {
        ud.local.x = cx + ud.localOff.x;
        ud.local.z = cz + ud.localOff.z;
        robot.position.set(ud.local.x, 0, ud.local.z);
        continue;
      }
      ud.crosser = false;
      ud.anchor = flatAnchor(ud.anchor);
      ud.index = ud.anchor;
      ud.lateral = ud.home;
    }
    assignCrossers();
    for (const robot of trackRobots) {
      if (!robot.userData.local) placeRobot(robot);
    }
  }

  function wrapSample(index) {
    const n = samples.length;
    let i = index % n;
    if (i < 0) i += n;
    return i;
  }

  function placeRobot(robot) {
    const ud = robot.userData;
    if (ud.local) return;
    const index = wrapSample(ud.index);
    const i0 = Math.floor(index) % samples.length;
    const i1 = (i0 + 1) % samples.length;
    const t = index - Math.floor(index);
    const a = samples[i0];
    const b = samples[i1];
    const rx = a.rx + (b.rx - a.rx) * t;
    const rz = a.rz + (b.rz - a.rz) * t;
    const fx = a.fx + (b.fx - a.fx) * t;
    const fz = a.fz + (b.fz - a.fz) * t;
    robot.position.set(
      a.x + (b.x - a.x) * t + rx * ud.lateral,
      0,
      a.z + (b.z - a.z) * t + rz * ud.lateral,
    );
    let faceX = fx * ud.dir;
    let faceZ = fz * ud.dir;
    if (ud.mode === "cross") {
      faceX = -rx * Math.sign(ud.side || 1);
      faceZ = -rz * Math.sign(ud.side || 1);
    } else if (ud.mode === "return") {
      faceX = rx * Math.sign(ud.side || 1);
      faceZ = rz * Math.sign(ud.side || 1);
    } else if (ud.mode === "block") {
      faceX = -fx;
      faceZ = -fz;
    }
    const len = Math.hypot(faceX, faceZ) || 1;
    robot.rotation.y = yawFromForward(faceX / len, faceZ / len);
  }

  function poseRobot(robot, dt) {
    const ud = robot.userData;
    const moving = ud.mode === "patrol" || ud.mode === "cross" || ud.mode === "return" || ud.mode === "turn";
    ud.gait += dt * (moving ? 7.4 : 1.4);
    const s = Math.sin(ud.gait);
    const amp = moving ? 0.62 : 0.06;
    ud.thighs[0].rotation.x = s * amp;
    ud.thighs[1].rotation.x = -s * amp;
    ud.shins[0].rotation.x = -0.22 - Math.max(0, -s) * (moving ? 0.85 : 0.05);
    ud.shins[1].rotation.x = -0.22 - Math.max(0, s) * (moving ? 0.85 : 0.05);
    let left = -s * amp * 0.7;
    let rightArm = s * amp * 0.7;
    if (ud.mode === "gesture") {
      const lift = Math.sin(clamp(1 - ud.timer / 1.7, 0, 1) * Math.PI);
      if (ud.gestureKind === 0) left = 1.55 * lift;
      else if (ud.gestureKind === 1) {
        left = 1.15 * lift;
        rightArm = 1.15 * lift;
      } else rightArm = 0.95 * lift;
    } else if (ud.mode === "block") {
      left = 0.35 + Math.sin(elapsed * 1.4 + ud.phase) * 0.35;
      rightArm = 0.15;
    }
    ud.arms[0].rotation.x = left;
    ud.arms[1].rotation.x = rightArm;
    ud.hip.position.y = 0.9 + (moving ? Math.abs(s) * 0.03 : Math.sin(elapsed * 0.8 + ud.phase) * 0.012);
    ud.hip.rotation.z = s * (moving ? 0.045 : 0.02);
    ud.head.rotation.y = (ud.mode === "pause" || ud.mode === "block") ? Math.sin(elapsed * 0.7 + ud.phase) * 0.45 : s * 0.08;
    ud.head.rotation.x = ud.mode === "gesture" && ud.gestureKind === 2 ? 0.4 : 0;
  }

  function roadOccupied() {
    return trackRobots.some((robot) => {
      const mode = robot.userData.mode;
      return mode === "cross" || mode === "block" || mode === "return";
    });
  }

  function stepRobots(dt) {
    if (reducedMotion) return;
    for (const robot of trackRobots) {
      const ud = robot.userData;
      ud.timer -= dt;
      if (ud.crosser) ud.cooldown -= dt;
      if (ud.local) {
        const face = ud.local;
        face.dist += face.dir * 0.75 * dt;
        if (Math.abs(face.dist) > 2.1) {
          face.dist = Math.sign(face.dist) * 2.1;
          face.dir *= -1;
          ud.mode = "gesture";
          ud.timer = 1.6;
          ud.gestureKind = (ud.gestureKind + 1) % 3;
        } else if (ud.mode !== "gesture") ud.mode = "patrol";
        else if (ud.timer <= 0) ud.mode = "patrol";
        const nx = face.x + face.fx * face.dist;
        const nz = face.z + face.fz * face.dist;
        if (clearForRobot(nx, nz)) robot.position.set(nx, 0, nz);
        const way = face.dir >= 0 ? 1 : -1;
        robot.rotation.y = yawFromForward(face.fx * way, face.fz * way);
        poseRobot(robot, dt);
        continue;
      }
      if (ud.mode === "patrol") {
        const s = samples[Math.floor(wrapSample(ud.index)) % samples.length];
        let towardGap = false;
        if (ud.crosser && ud.cooldown <= 0 && !roadOccupied()) {
          const diff = ud.gapIndex - ud.index;
          if (Math.abs(diff) < 0.35) {
            ud.index = ud.gapIndex;
            ud.mode = "cross";
            ud.timer = 8;
            towardGap = true;
          } else {
            ud.dir = diff > 0 ? 1 : -1;
            towardGap = true;
          }
        }
        if (ud.mode === "patrol") {
          ud.index += ud.dir * (1.4 / (s.ds || 4)) * dt;
          const lo = ud.anchor - 8;
          const hi = ud.anchor + 8;
          if (!towardGap && (ud.index > hi || ud.index < lo)) {
            ud.index = clamp(ud.index, lo, hi);
            ud.dir *= -1;
            ud.mode = "turn";
            ud.timer = 0.45;
          } else if (!towardGap && ud.timer <= 0) {
            ud.mode = (ud.phase + elapsed) % 1 > 0.55 ? "gesture" : "pause";
            ud.timer = ud.mode === "gesture" ? 1.7 : 1.05;
            ud.gestureKind = Math.floor(elapsed + ud.phase) % 3;
          }
        }
      } else if (ud.mode === "pause" || ud.mode === "turn" || ud.mode === "gesture") {
        if (ud.timer <= 0) {
          ud.mode = "patrol";
          ud.timer = 3.2 + (ud.phase % 2);
        }
      } else if (ud.mode === "cross") {
        ud.index = ud.gapIndex;
        const target = ud.side * 1.15;
        const step = 2.35 * dt;
        if (Math.abs(ud.lateral - target) <= step) {
          ud.lateral = target;
          ud.mode = "block";
          ud.timer = courseLevel(chosenLevel()).blockTime;
        } else ud.lateral += Math.sign(target - ud.lateral) * step;
      } else if (ud.mode === "block") {
        ud.index = ud.gapIndex;
        if (ud.timer <= 0) ud.mode = "return";
      } else if (ud.mode === "return") {
        ud.index = ud.gapIndex;
        const step = 2.5 * dt;
        if (Math.abs(ud.lateral - ud.home) <= step) {
          ud.lateral = ud.home;
          ud.mode = "patrol";
          ud.cooldown = (16 + (ud.phase % 4) * 2) * courseLevel(chosenLevel()).crossCool;
          ud.timer = 2.2;
        } else ud.lateral += Math.sign(ud.home - ud.lateral) * step;
      }
      placeRobot(robot);
      poseRobot(robot, dt);
    }
  }

  function roadActors() {
    const actors = [];
    for (const robot of trackRobots) {
      const ud = robot.userData;
      if (ud.local) continue;
      if (ud.mode !== "cross" && ud.mode !== "block" && ud.mode !== "return") continue;
      if (Math.abs(ud.lateral) > ROAD_HALF - 0.1) continue;
      actors.push({ x: robot.position.x, z: robot.position.z, r: 0.46, h: 1.85, base: 0 });
    }
    return actors;
  }

  function bumpRoadRobots(racer) {
    const reach = racer.spec.spheres[0].r + 0.55;
    for (const robot of trackRobots) {
      const mode = robot.userData.mode;
      if (mode !== "cross" && mode !== "block") continue;
      const dx = robot.position.x - racer.state.x;
      const dz = robot.position.z - racer.state.z;
      if (dx * dx + dz * dz < reach * reach) robot.userData.mode = "return";
    }
  }

  const racers = VEHICLES.map((spec) => ({
    spec,
    root: buildVehicle(spec),
    state: createDriveState(0, 0, 0),
    ai: false,
    phaseSeed: Math.random() * 6,
  }));
  for (const racer of racers) {
    racer.root.visible = false;
    scene.add(racer.root);
  }
  for (const id of ["roadster", "semi", "model3"]) {
    const racer = racers.find((item) => item.spec.id === id);
    const lamps = racer && racer.root.userData.lamps;
    if (!lamps || lamps.length !== 2) failures.push(`${id} needs two headlights`);
    else if (!(lamps[0].spot.position.z < -racer.spec.length * 0.5 + 0.02)) failures.push(`${id} headlights sit behind the nose`);
    else if (!(lamps[0].spot.position.x * lamps[1].spot.position.x < 0)) failures.push(`${id} headlights are on the same side`);
    else if (!(lamps[0].spot.target.position.z < lamps[0].spot.position.z - 8)) failures.push(`${id} headlight beam does not point forward`);
  }

  let player = racers[0];
  let pack = [];

  function sampleFrame(x, z) {
    const n = samples.length;
    const i = nearestIndex(samples, x, z);
    const a = samples[i];
    const prev = samples[(i - 1 + n) % n];
    const next = samples[(i + 1) % n];
    const along = (x - a.x) * a.fx + (z - a.z) * a.fz;
    const from = along >= 0 ? a : prev;
    const to = along >= 0 ? next : a;
    const abx = to.x - from.x;
    const abz = to.z - from.z;
    const len2 = abx * abx + abz * abz || 1;
    const t = clamp(((x - from.x) * abx + (z - from.z) * abz) / len2, 0, 1);
    const midY = (from.y || 0) + ((to.y || 0) - (from.y || 0)) * t;
    const bank = (from.bank || 0) + ((to.bank || 0) - (from.bank || 0)) * t;
    const rx = from.rx + (to.rx - from.rx) * t;
    const rz = from.rz + (to.rz - from.rz) * t;
    const px = from.x + (to.x - from.x) * t;
    const pz = from.z + (to.z - from.z) * t;
    const lat = (x - px) * rx + (z - pz) * rz;
    const half = (from.half || ROAD_HALF) + ((to.half || ROAD_HALF) - (from.half || ROAD_HALF)) * t;
    const tunnel = from.role === "tunnel" || to.role === "tunnel";
    let y = midY - Math.sin(bank) * lat;
    let inBore = false;
    if (tunnel) {
      const lane = half + 0.4;
      const clear = Math.max(half + 2.2, (bore.chord || 3.6) + 1.7);
      if (Math.abs(lat) <= lane) inBore = true;
      else if (Math.abs(lat) >= clear) y = 0;
    }
    const depth = inBore ? clamp(-midY / TUNNEL_DEPTH, 0, 1) : 0;
    return { y, lat, inBore, depth, tunnel, index: i };
  }

  function roadHeight(x, z) {
    return sampleFrame(x, z).y;
  }

  function applyGrade(state, spec, dt) {
    const frame = sampleFrame(state.x, state.z);
    let grade = 0;
    if (!frame.tunnel || frame.inBore) {
      const n = samples.length;
      const i = frame.index;
      const behind = samples[(i - 3 + n) % n];
      const ahead = samples[(i + 3) % n];
      const span = Math.max(1, Math.hypot(ahead.x - behind.x, ahead.z - behind.z));
      grade = ((ahead.y || 0) - (behind.y || 0)) / span;
    }
    state.speed -= 9.8 * grade * dt;
    const hullTop = hullScale(state).top;
    const cap = (frame.depth > 0.45 ? spec.top * (1.08 + 0.16 * frame.depth) : spec.top * 1.15) * hullTop;
    if (state.speed > cap) state.speed = cap;
    if (state.speed < -7) state.speed = -7;
  }

  function place(racer, index, lateral) {
    const s = samples[index];
    racer.state.x = s.x + s.rx * lateral;
    racer.state.z = s.z + s.rz * lateral;
    racer.state.yaw = yawFromForward(s.fx, s.fz);
    racer.state.speed = 0;
    racer.state.boreOn = false;
    racer.state.boreH = 0;
    racer.state.boreUpRight = 0;
    racer.state.boreUpY = 1;
    racer.state.lift = 0;
    racer.state.liftV = 0;
    racer.state.thrustOn = false;
  }

  const keys = new Set();
  const prev = { shift: false, q: false, e: false, c: false, r: false, m: false, f: false, t: false, padL: false, padA: false, padF: false, padEmp: false, padStart: false, touchEmp: false };
  const touch = { throttle: 0, brake: 0, steer: 0, boost: false, ludicrous: false, auto: false, fsd: false, emp: false };
  let forcedThrottle = 0;
  let camMode = "cockpit";
  let camDist = 11;
  let muted = false;
  let racePaused = false;
  let scoreId = "neon-velocity-1";
  let phase = "menu";
  let playMode = "race";
  let lapsToWin = 2;
  let countdown = 0;
  let raceTime = 0;
  let snap = true;
  const camPos = new THREE.Vector3();
  let elapsed = 0;
  let showDebug = false;
  let audio = null;
  let steerHold = 0;
  let steerApplied = 0;
  let steerDir = 0;
  let steerFromPad = false;
  let steerSens = 1;
  let party = null;
  let wrongTime = 0;

  function fieldRivals() {
    const pool = racers.filter((racer) => racer !== player);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const swap = pool[i];
      pool[i] = pool[j];
      pool[j] = swap;
    }
    return pool.slice(0, 3);
  }

  function selectCar(id) {
    for (const racer of racers) racer.root.visible = false;
    player = racers.find((racer) => racer.spec.id === id) ?? racers[0];
    player.root.visible = true;
    place(player, 0, 0);
    syncCar(player, 0, 0, 0);
    document.querySelectorAll("[data-car]").forEach((button) => {
      button.classList.toggle("is-on", button.dataset.car === player.spec.id);
    });
    const blurb = document.querySelector("#blurb");
    if (blurb) blurb.textContent = player.spec.blurb;
  }

  let stepDt = 1 / 60;

  function syncCar(racer, steer, throttle, brake) {
    const state = racer.state;
    racer.root.visible = phase === "menu" ? racer.root === player.root : racer.root === player.root || racer.ai;
    const extra = state.boreOn ? (state.boreH || 0) : (state.lift || 0);
    racer.root.position.set(state.x, 0.04 + roadHeight(state.x, state.z) + extra, state.z);
    if (state.boreOn) poseCarRoot(racer.root, state.yaw, state.boreUpRight, state.boreUpY);
    else racer.root.rotation.set(0, state.yaw, 0);
    const helm = racer.root.getObjectByName("steer");
    if (helm) helm.rotation.z = helmSpin(steer);
    const visual = racer.root.userData.visual;
    visual.rotation.z = steer * clamp(state.speed / 40, -1, 1) * -0.045;
    visual.rotation.x = throttle * 0.02 - brake * 0.035;
    const wheels = racer.root.userData.wheels;
    for (const wheel of wheels) {
      if (wheel.front) wheel.steer.rotation.y = -steer * 0.42;
      wheel.spin.rotation.x += (state.speed / wheel.radius) * stepDt;
    }
    const tailPower = state.empStun > 0 ? 1.4 + Math.sin(elapsed * 28) * 0.7 : brake > 0.2 ? 4.5 : 0.65;
    for (const mat of racer.root.userData.tails) mat.emissiveIntensity = tailPower;
    const hullNow = state.hull == null ? 1 : state.hull;
    const dents = racer.root.userData.dents || [];
    const shown = Math.ceil((1 - hullNow) * dents.length - 0.01);
    for (let i = 0; i < dents.length; i++) dents[i].visible = i < shown;
    updateLamps(racer);
    const inCockpit = racer.root === player.root && camMode === "cockpit" && phase === "race";
    for (const mesh of racer.root.userData.glass) mesh.visible = !inCockpit;
    const cockpitGroup = racer.root.getObjectByName("cockpit");
    if (cockpitGroup) cockpitGroup.visible = inCockpit;
  }

  function updateLamps(racer) {
    const night = dayAmount < 0.62 ? clamp((0.62 - dayAmount) / 0.32, 0, 1) : 0;
    const show = Boolean(racer.root.visible) && night > 0.04;
    for (const lamp of racer.root.userData.lamps || []) {
      lamp.spot.visible = show;
      lamp.spot.intensity = show ? (racer === player ? 28 : 18) * night : 0;
    }
    if (racer.root.userData.lampMat) racer.root.userData.lampMat.emissiveIntensity = show ? 0.4 + night * 2.1 : 0.08;
  }

  let dayAmount = 0;

  function updateSky(dt) {
    elapsed += dt;
    cosmos.rotation.y = elapsed * 0.012;
    planet.rotation.y = elapsed * 0.05;
    starlink.rotation.y = elapsed * 0.04;
    const cycle = (elapsed / 150 + 0.72) % 1;
    const elev = Math.sin(cycle * Math.PI * 2);
    const az = cycle * Math.PI * 2;
    sunDir.set(Math.cos(az) * Math.cos(elev), Math.sin(elev), Math.sin(az) * Math.cos(elev)).normalize();
    sky.material.uniforms.sunPosition.value.copy(sunDir).multiplyScalar(450000);
    sky.material.uniforms.cloudCoverage.value = 0.16 + (1 - clamp(elev, 0, 1)) * 0.12;
    dayAmount = THREE.MathUtils.smoothstep(elev, -0.08, 0.45);
    sun.intensity = 0.22 + dayAmount * 1.45;
    moon.intensity = 0.32 + (1 - dayAmount) * 0.9;
    hemi.intensity = 0.42 + dayAmount * 0.22;
    stars.material.opacity = 0.15 + (1 - dayAmount) * 0.85;
    sky.visible = dayAmount > 0.18;
    nightSky.material.uniforms.night.value = 1 - dayAmount * 0.85;
    neonMat.emissiveIntensity = 0.7 + (1 - dayAmount) * 2.4;
    for (const band of shipBands) band.emissiveIntensity = 0.5 + (1 - dayAmount) * 2;
    towerLight.intensity = 12 + (1 - dayAmount) * 50;
    padLightA.intensity = 8 + (1 - dayAmount) * 36;
    padLightB.intensity = 8 + (1 - dayAmount) * 30;
    renderer.toneMappingExposure = 0.84 + dayAmount * 0.08;
    const fogColor = new THREE.Color(0x070814).lerp(new THREE.Color(0x3e627f), dayAmount);
    scene.fog.color.copy(fogColor);
    scene.fog.density = 0.00145 + (1 - dayAmount) * 0.00135;
    cityMat.emissiveIntensity = 0.2 + (1 - dayAmount) * 1.15;
    const nose = carForward(player.state.yaw);
    const back = player.spec.length * 0.55 + 1.4;
    rim.position.set(player.state.x - nose.x * back, 1.8 + roadHeight(player.state.x, player.state.z), player.state.z - nose.z * back);
    rim.distance = back + 4;
    rim.intensity = 3.5 + (1 - dayAmount) * 5;
    const anchor = player.root.position;
    sun.position.copy(anchor).addScaledVector(sunDir, 90);
    sun.target.position.copy(anchor);
    moon.position.copy(anchor).addScaledVector(sunDir, -80);
    moon.target.position.copy(anchor);
  }

  function steerWord(value) {
    if (value < 0.75) return "Gentle";
    if (value < 1.25) return "Standard";
    return "Sharp";
  }

  function applySteerSens(value, write) {
    steerSens = clamp(Number(value) || 1, 0.45, 1.8);
    if (write) {
      try { localStorage.setItem("twr-steer", String(Math.round(steerSens * 100) / 100)); } catch { /* private mode */ }
    }
    const word = steerWord(steerSens);
    for (const [inputId, labelId] of [["sens", "sens-label"], ["sens-live", "sens-live-label"]]) {
      const input = document.querySelector(`#${inputId}`);
      const label = document.querySelector(`#${labelId}`);
      if (input && Math.abs(Number(input.value) - steerSens) > 0.001) input.value = String(steerSens);
      if (label) label.textContent = word;
    }
  }

  function readInput(dt) {
    const pad = navigator.getGamepads?.()[0] ?? null;
    let throttle = touch.throttle;
    let brake = touch.brake;
    let digital = touch.steer;
    if (keys.has("KeyW") || keys.has("ArrowUp")) throttle = 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) brake = 1;
    if (keys.has("KeyA") || keys.has("ArrowLeft")) digital -= 1;
    if (keys.has("KeyD") || keys.has("ArrowRight")) digital += 1;
    digital = clamp(digital, -1, 1);
    if (forcedThrottle) throttle = 1;
    let stick = 0;
    if (pad) {
      const raw = pad.axes[0] || 0;
      if (Math.abs(raw) > 0.15) stick = Math.sign(raw) * (Math.abs(raw) - 0.15) / 0.85;
      const rt = pad.buttons[7]?.value ?? 0;
      const lt = pad.buttons[6]?.value ?? 0;
      if (rt > 0.05) throttle = rt;
      if (lt > 0.05) brake = lt;
    }
    const step = Number.isFinite(dt) ? dt : 1 / 60;
    let target = 0;
    if (stick !== 0) {
      steerFromPad = true;
      const expo = 1 / steerSens;
      target = Math.sign(stick) * Math.pow(Math.abs(stick), expo);
    } else {
      steerFromPad = false;
      target = digital;
    }
    steerHold = 0;
    steerDir = 0;
    steerApplied = smoothToward(steerApplied, target, step, steerSens);
    const steer = clamp(steerApplied, -1, 1);
    const shift = keys.has("ShiftLeft") || keys.has("ShiftRight");
    const q = keys.has("KeyQ");
    const e = keys.has("KeyE");
    const c = keys.has("KeyC");
    const r = keys.has("KeyR");
    const m = keys.has("KeyM");
    const padL = Boolean(pad?.buttons[3]?.pressed);
    const padA = Boolean(pad?.buttons[2]?.pressed);
    const padF = Boolean(pad?.buttons[1]?.pressed);
    const fDown = keys.has("KeyF");
    const padEmp = Boolean(pad?.buttons[5]?.pressed);
    const emp = (fDown && !prev.f) || (padEmp && !prev.padEmp) || (touch.emp && !prev.touchEmp);
    const thrustHeld = keys.has("KeyT") || Boolean(pad?.buttons[4]?.pressed);
    if (thrustHeld && !prev.t && phase === "race" && !racePaused) playThrust();
    const ludicrousToggle = (shift && !prev.shift) || (padL && !prev.padL) || touch.ludicrous;
    const autopilot = (q && !prev.q) || (padA && !prev.padA) || touch.auto;
    const fsd = (e && !prev.e) || (padF && !prev.padF) || touch.fsd;
    if (c && !prev.c && phase === "race") {
      if (camMode === "cockpit") {
        camMode = "chase";
        camDist = 8;
      } else if (camDist === 8) camDist = 11;
      else if (camDist === 11) camDist = 15;
      else camMode = "cockpit";
      snap = true;
    }
    if (r && !prev.r && phase === "race" && !racePaused) resetCar();
    if (keys.has("Backquote") && !prev.debug) showDebug = !showDebug;
    prev.debug = keys.has("Backquote");
    prev.shift = shift;
    prev.q = q;
    prev.e = e;
    prev.c = c;
    prev.r = r;
    prev.m = m;
    prev.padL = padL;
    prev.padA = padA;
    prev.padF = padF;
    prev.f = fDown;
    prev.t = thrustHeld;
    prev.padEmp = padEmp;
    prev.touchEmp = touch.emp;
    touch.ludicrous = false;
    touch.auto = false;
    touch.fsd = false;
    const boost = keys.has("Space") || touch.boost || Boolean(pad?.buttons[0]?.pressed);
    return {
      throttle, brake, steer: clamp(steer, -1, 1), boost, ludicrousToggle, autopilot, fsd, emp,
      thrust: thrustHeld,
    };
  }

  function resetCar() {
    const gate = checkpoints[player.state.cp];
    const index = nearestIndex(samples, gate.x, gate.z);
    place(player, index, 0);
    player.state.speed = 0;
    snap = true;
  }

  function startRace() {
    playMode = chosenMode();
    lapsToWin = playMode === "roam" ? 1e9 : chosenLaps();
    if (playMode !== "roam") {
      try { localStorage.setItem("twr-laps", String(lapsToWin)); } catch { /* private mode */ }
    }
    try { localStorage.setItem("twr-mode", playMode); } catch { /* private mode */ }
    try { localStorage.setItem("twr-diff", chosenLevel()); } catch { /* private mode */ }
    phase = "race";
    camMode = "cockpit";
    countdown = 3.2;
    raceTime = 0;
    snap = true;
    for (const racer of racers) {
      racer.ai = false;
      racer.root.visible = false;
      racer.state = createDriveState(0, 0, 0);
    }
    player.root.visible = true;
    place(player, 0, 0);
    pack = playMode === "roam" ? [] : fieldRivals();
    if (new URLSearchParams(location.search).has("go")) countdown = 0;
    pack.forEach((racer, index) => {
      racer.ai = true;
      racer.root.visible = true;
      racer.state = createDriveState(0, 0, 0);
      place(racer, 8 + index * 7, index === 1 ? 2.4 : -2.2);
    });
    document.querySelector("#menu").hidden = true;
    document.querySelector("#hud").hidden = false;
    document.querySelector("#done").hidden = true;
    const board = document.querySelector("#board-wrap");
    if (board) board.hidden = true;
    setPaused(false);
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    steerHold = 0;
    steerApplied = 0;
    steerDir = 0;
    steerFromPad = false;
    party = null;
    wrongTime = 0;
    const celebrate = document.querySelector("#celebrate");
    if (celebrate) celebrate.hidden = true;
    const wrong = document.querySelector("#wrong-way");
    if (wrong) wrong.hidden = true;
    ensureAudio();
    ensureSoundtrack(scoreId);
    if (audio.ctx.state === "suspended") audio.ctx.resume();
    playScore(scoreId);
  }

  function retileCourse() {
    const levelId = chosenLevel();
    let next = null;
    for (let attempt = 0; attempt < 16 && !next; attempt++) {
      next = generateCourse((Math.random() * 0x7fffffff) | 0, levelId);
    }
    if (!next || (course && next.seed === course.seed)) {
      const retry = generateCourse(((course && course.seed) || 1) + 9973, levelId);
      if (retry && retry.seed !== (course && course.seed)) next = retry;
    }
    if (!next) return false;
    course = next;
    samples = next.samples;
    cx = next.cx;
    cz = next.cz;
    columns = next.columns;
    bore = next.bore;
    tunnel = next.tunnel;
    crossings = next.crossings;
    boxes = next.boxes;
    pads = next.pads;
    rebuildRibbons();
    fillWalls();
    syncCuts();
    mountTunnel();
    mountDressing();
    refreshGates();
    seatCity();
    rebuildDebug();
    ships.forEach((ship, index) => {
      const column = columns[index];
      if (!column) return;
      ship.column = column;
      ship.group.position.x = column.x;
      ship.group.position.z = column.z;
      if (ship.fill) {
        ship.fill.position.x = column.x + 10 * ship.scale;
        ship.fill.position.z = column.z + 8;
      }
    });
    towerGroup.position.set(cx - homeCx, 0, cz - homeCz);
    pad.position.set(cx, 0.03, cz);
    padLightA.position.set(cx + 10, 8, cz - 10);
    padLightB.position.set(cx - 16, 6, cz + 12);
    towerLight.position.set(cx - 40, 48, cz + 15);
    towerTarget.position.set(cx, 36, cz);
    reseatRobots();
    styleCosmos(next.seed || 1);
    for (const racer of racers) {
      racer.ai = false;
      racer.root.visible = racer === player;
    }
    place(player, 0, 0);
    player.state.speed = 0;
    snap = true;
    return true;
  }

  function finishRace() {
    const standing = rank();
    phase = "done";
    setPaused(false);
    saveResult(standing);
    document.querySelector("#done").hidden = false;
    document.querySelector("#done-time").textContent = `${raceTime.toFixed(1)}s`;
    const donePlace = document.querySelector("#done-place");
    if (donePlace) donePlace.textContent = `${driverName()} finished P${standing} in the ${player.spec.name}. ${lapsToWin} laps. ${levelLabel(chosenLevel())}.`;
    retileCourse();
    const board = document.querySelector("#board-wrap");
    if (board) board.hidden = false;
    const map = document.querySelector("#map");
    if (map) map.hidden = true;
    const standingWin = standing === 1;
    party = { life: standingWin ? 7.2 : 4.4, place: standing, acc: 0 };
    const celebrate = document.querySelector("#celebrate");
    if (celebrate) {
      celebrate.hidden = false;
      celebrate.textContent = standingWin ? "P1" : `P${standing}`;
    }
    const wrong = document.querySelector("#wrong-way");
    if (wrong) wrong.hidden = true;
    playCheer(standingWin);
  }

  function quitRace() {
    if (phase !== "race" && phase !== "done") return;
    phase = "menu";
    setPaused(false);
    document.querySelector("#hud").hidden = true;
    document.querySelector("#menu").hidden = false;
    document.querySelector("#done").hidden = true;
    document.querySelector("#count").hidden = true;
    const map = document.querySelector("#map");
    if (map) map.hidden = true;
    const board = document.querySelector("#board-wrap");
    if (board) board.hidden = false;
    if (audio) {
      audio.started = false;
      stopScores();
    }
    for (const racer of racers) {
      racer.ai = false;
      racer.root.visible = racer === player;
    }
    place(player, 0, 0);
    player.state.speed = 0;
    snap = true;
    party = null;
    wrongTime = 0;
    const celebrate = document.querySelector("#celebrate");
    if (celebrate) celebrate.hidden = true;
    const wrong = document.querySelector("#wrong-way");
    if (wrong) wrong.hidden = true;
    retileCourse();
  }

  let framed = null;

  function updateCamera(dt) {
    const fwd = carForward(player.state.yaw);
    if (!player.state.boreOn) camera.up.set(0, 1, 0);
    if (framed) {
      camera.position.set(framed.px, framed.py, framed.pz);
      camera.lookAt(framed.tx, framed.ty, framed.tz);
      return fwd;
    }
    const tall = Math.max(0, player.spec.height - 1.6);
    if (phase === "menu") {
      const t = reducedMotion ? 0.4 : elapsed * 0.15;
      const orbit = player.root.position;
      const f = carForward(player.state.yaw);
      const side = rightOf(f);
      camera.position.set(
        orbit.x - f.x * 12 + side.x * Math.sin(t) * 3,
        3.6 + tall * 0.55,
        orbit.z - f.z * 12 + side.z * Math.sin(t) * 3,
      );
      camera.lookAt(cx, 10, cz);
      return fwd;
    }
    const right = rightOf(fwd);
    const rig = player.root.userData.cockpit;
    const roadY = roadHeight(player.state.x, player.state.z) + (player.state.boreOn ? 0 : (player.state.lift || 0));
    const eyeX = player.state.x + right.x * rig.eyeX - fwd.x * rig.eyeZ;
    const eyeY = 0.04 + rig.eyeY + roadY;
    const eyeZ = player.state.z + right.z * rig.eyeX - fwd.z * rig.eyeZ;
    if (player.state.boreOn) {
      const axes = boreAxes(player.state.yaw, player.state.boreUpRight, player.state.boreUpY);
      const root = player.root.position;
      camera.up.set(axes.ux, axes.uy, axes.uz);
      if (camMode === "cockpit") {
        camPos.set(
          root.x + axes.rx * rig.eyeX + axes.ux * rig.eyeY - axes.fx * rig.eyeZ,
          root.y + axes.ry * rig.eyeX + axes.uy * rig.eyeY,
          root.z + axes.rz * rig.eyeX + axes.uz * rig.eyeY - axes.fz * rig.eyeZ,
        );
      } else {
        camPos.set(
          root.x - axes.fx * camDist + axes.rx * 2.2 + axes.ux * 1.6,
          root.y + axes.uy * 1.6,
          root.z - axes.fz * camDist + axes.rz * 2.2 + axes.uz * 1.6,
        );
      }
      camera.position.copy(camPos);
      const look = camMode === "cockpit" ? rig.look : 7;
      const drop = camMode === "cockpit" ? rig.lookDrop : 0.35;
      camera.lookAt(
        camPos.x + axes.fx * look - axes.ux * drop,
        camPos.y - axes.uy * drop,
        camPos.z + axes.fz * look - axes.uz * drop,
      );
      const fov = (camMode === "cockpit" ? rig.fov : 62) + (player.state.ludicrous ? 4 : 0);
      const near = camMode === "cockpit" ? 0.05 : 0.45;
      if (Math.abs(camera.fov - fov) > 0.1 || Math.abs(camera.near - near) > 0.001) {
        camera.fov = fov;
        camera.near = near;
        camera.updateProjectionMatrix();
      }
      return fwd;
    }
    const chase = new THREE.Vector3(
      player.state.x - fwd.x * camDist + right.x * 2.2,
      1.9 + player.spec.ride + tall * 0.42 + roadY,
      player.state.z - fwd.z * camDist + right.z * 2.2,
    );
    const desired = camMode === "cockpit" ? new THREE.Vector3(eyeX, eyeY, eyeZ) : chase;
    if (snap || camMode === "cockpit") {
      camPos.copy(desired);
      snap = false;
    } else {
      camPos.lerp(desired, 1 - Math.exp(-7 * dt));
    }
    camera.position.copy(camPos);
    if (camMode === "cockpit") {
      camera.lookAt(camPos.x + fwd.x * rig.look, eyeY - rig.lookDrop, camPos.z + fwd.z * rig.look);
    } else {
      camera.lookAt(
        player.state.x + fwd.x * 7 + right.x * 0.35,
        0.85 + tall * 0.22 + roadY,
        player.state.z + fwd.z * 7 + right.z * 0.35,
      );
    }
    const fov = (camMode === "cockpit" ? rig.fov : 62) + (player.state.ludicrous ? 4 : 0);
    const near = camMode === "cockpit" ? 0.05 : 0.45;
    if (Math.abs(camera.fov - fov) > 0.1 || Math.abs(camera.near - near) > 0.001) {
      camera.fov = fov;
      camera.near = near;
      camera.updateProjectionMatrix();
    }
    return fwd;
  }

  function burstCrash(racer) {
    const fwd = carForward(racer.state.yaw);
    const right = rightOf(fwd);
    const y = roadHeight(racer.state.x, racer.state.z) + racer.spec.height * 0.45;
    spawnFlash(racer.state.x, y, racer.state.z, 0xffc27a);
    spawnBurst(racer.state.x, y, racer.state.z);
    for (let n = 0; n < 18; n++) {
      const side = (Math.random() - 0.5) * racer.spec.width;
      emitParticle(
        sparks,
        racer.state.x + right.x * side,
        y,
        racer.state.z + right.z * side,
        -fwd.x * (2 + Math.random() * 8) + (Math.random() - 0.5) * 9,
        2 + Math.random() * 7,
        -fwd.z * (2 + Math.random() * 8) + (Math.random() - 0.5) * 9,
        0.35 + Math.random() * 0.35,
      );
    }
    for (let n = 0; n < 8; n++) {
      emitParticle(
        smoke,
        racer.state.x + (Math.random() - 0.5) * 1.2,
        y * 0.5,
        racer.state.z + (Math.random() - 0.5) * 1.2,
        (Math.random() - 0.5) * 3,
        1.2 + Math.random() * 2,
        (Math.random() - 0.5) * 3,
        0.9,
      );
    }
    let tossed = 0;
    for (const bit of debris) {
      if (bit.life > 0) continue;
      bit.life = 0.85 + Math.random() * 0.45;
      bit.vx = -fwd.x * (3 + Math.random() * 6) + right.x * (Math.random() - 0.5) * 8;
      bit.vy = 2.5 + Math.random() * 6;
      bit.vz = -fwd.z * (3 + Math.random() * 6) + right.z * (Math.random() - 0.5) * 8;
      bit.spin = (Math.random() - 0.5) * 14;
      bit.mesh.visible = true;
      bit.mesh.position.set(racer.state.x + right.x * (Math.random() - 0.5) * racer.spec.width, y, racer.state.z + right.z * (Math.random() - 0.5) * racer.spec.width);
      bit.mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      bit.mesh.scale.set(0.45 + Math.random() * 0.8, 0.35 + Math.random() * 0.5, 0.5 + Math.random() * 0.9);
      bit.mesh.material.opacity = 1;
      tossed += 1;
      if (tossed >= 7) break;
    }
  }

  function stepDebris(dt) {
    for (const bit of debris) {
      if (bit.life <= 0) continue;
      bit.life -= dt;
      bit.vy -= 12 * dt;
      bit.mesh.position.x += bit.vx * dt;
      bit.mesh.position.y += bit.vy * dt;
      bit.mesh.position.z += bit.vz * dt;
      bit.mesh.rotation.x += bit.spin * dt;
      bit.mesh.rotation.y += bit.spin * 0.6 * dt;
      const groundY = roadHeight(bit.mesh.position.x, bit.mesh.position.z) + 0.04;
      if (bit.mesh.position.y < groundY) {
        bit.mesh.position.y = groundY;
        bit.vy = Math.abs(bit.vy) * 0.28;
        bit.vx *= 0.62;
        bit.vz *= 0.62;
      }
      bit.mesh.material.opacity = clamp(bit.life / 0.4, 0, 1);
      if (bit.life <= 0) bit.mesh.visible = false;
    }
  }

  function noteCrash(racer) {
    const state = racer.state;
    if (state.crashFx > 0) state.crashFx = Math.max(0, state.crashFx - stepDt);
    if (state.hit && !state.crashLatch) {
      state.crashLatch = true;
      if ((state.impact || 0) > 6) {
        const bite = clamp(state.impact / 95, 0.05, 0.13);
        state.hull = Math.max(0, (state.hull == null ? 1 : state.hull) - bite);
        state.crashFx = 0.5;
        const dx = state.x - player.state.x;
        const dz = state.z - player.state.z;
        if (racer === player || dx * dx + dz * dz < 80 * 80) playCrash();
        if (!reducedMotion) burstCrash(racer);
      }
    } else if (!state.hit) state.crashLatch = false;
  }

  function emitFx(racer, input, dt) {
    if (reducedMotion) return;
    const fwd = carForward(racer.state.yaw);
    const right = rightOf(fwd);
    const rear = racer.spec.length * 0.42;
    const yRoad = roadHeight(racer.state.x, racer.state.z);
    if (input.brake > 0.35 && racer.state.speed > 8) {
      for (const side of [-1, 1]) {
        if (Math.random() < dt * 30) {
          emitParticle(
            smoke,
            racer.state.x - fwd.x * rear + right.x * side * racer.spec.width * 0.42,
            0.25 + yRoad,
            racer.state.z - fwd.z * rear + right.z * side * racer.spec.width * 0.42,
            -fwd.x * 2 + (Math.random() - 0.5),
            1.2 + Math.random(),
            -fwd.z * 2 + (Math.random() - 0.5),
            0.8,
          );
        }
      }
    }
    if (racer.state.crashFx > 0.2 && Math.random() < dt * 40) {
      emitParticle(
        sparks,
        racer.state.x + (Math.random() - 0.5) * racer.spec.width,
        0.35 + yRoad + racer.spec.height * 0.3,
        racer.state.z + (Math.random() - 0.5) * racer.spec.width,
        (Math.random() - 0.5) * 6,
        1.5 + Math.random() * 4,
        (Math.random() - 0.5) * 6,
        0.28,
      );
    }
    if ((racer.state.hull == null ? 1 : racer.state.hull) < 0.4 && racer.state.speed > 2 && Math.random() < dt * 10) {
      emitParticle(smoke, racer.state.x - fwd.x * rear, 0.4 + yRoad, racer.state.z - fwd.z * rear, -fwd.x, 1.4, -fwd.z, 0.7);
    }
    if (racer.state.thrustOn && Math.random() < dt * 40) {
      emitParticle(
        boost,
        racer.state.x - fwd.x * rear,
        0.15 + yRoad + (racer.state.lift || 0),
        racer.state.z - fwd.z * rear,
        -fwd.x * 2,
        -1.4,
        -fwd.z * 2,
        0.22,
      );
    }
    if ((racer.state.boosting || racer.state.ludicrous) && racer.state.speed > 4) {
      emitParticle(
        boost,
        racer.state.x - fwd.x * rear,
        0.35 + yRoad,
        racer.state.z - fwd.z * rear,
        -fwd.x * racer.state.speed * 0.15,
        0.4,
        -fwd.z * racer.state.speed * 0.15,
        0.28,
      );
    }
  }

  function soundtrackById(id) {
    return SOUNDTRACKS.find((score) => score.id === id) || null;
  }

  function setPaused(on) {
    racePaused = Boolean(on) && phase === "race";
    const panel = document.querySelector("#pause");
    if (panel) panel.hidden = !racePaused;
    const button = document.querySelector("#pause-btn");
    if (button) button.textContent = racePaused ? "Resume" : "Pause";
    const note = document.querySelector("#pause-note");
    const drive = playMode === "roam" ? "drive" : "race";
    const kicker = document.querySelector("#pause-kicker");
    if (kicker) kicker.textContent = playMode === "roam" ? "Free roam" : "Race";
    if (note) {
      const spec = soundtrackById(scoreId);
      note.textContent = spec ? `${spec.name} waits with the ${drive}.` : "No music is playing.";
    }
  }

  function pollPausePad() {
    const pad = navigator.getGamepads?.()[0] ?? null;
    const start = Boolean(pad?.buttons[9]?.pressed);
    if (start && !prev.padStart && phase === "race") setPaused(!racePaused);
    prev.padStart = start;
  }

  function eachTrack(visit) {
    if (!audio) return;
    for (const list of Object.values(audio.scores)) {
      for (const el of list) visit(el);
    }
  }

  function musicShouldPlay() {
    if (muted || racePaused) return false;
    if (phase === "race") return Boolean(soundtrackById(scoreId));
    if (phase === "done") return Boolean(audio && audio.activeId && audio.activeId !== "none" && soundtrackById(audio.activeId));
    return false;
  }

  function ensureAudio() {
    if (audio) return;
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    const noiseLen = ctx.sampleRate;
    const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) data[i] = Math.random() * 2 - 1;
    audio = { ctx, master, noiseBuf, crashAt: -10, scores: {}, activeId: "none", index: 0, started: false };
  }

  function ensureSoundtrack(id) {
    ensureAudio();
    const spec = soundtrackById(id);
    if (!spec || audio.scores[id]) return;
    audio.scores[id] = spec.files.map((src, index) => {
      const el = new Audio(src);
      el.preload = "auto";
      el.volume = 0.82;
      el.loop = spec.files.length === 1;
      el.addEventListener("ended", () => {
        if (!audio || muted) return;
        if (phase === "done" && audio.activeId === id) {
          playFile(id, (index + 1) % spec.files.length);
          return;
        }
        if (!musicShouldPlay() || scoreId !== id) return;
        playFile(id, (index + 1) % spec.files.length);
      });
      return el;
    });
  }

  function stopScores() {
    eachTrack((el) => {
      if (!el.paused) el.pause();
    });
  }

  function playFile(id, index) {
    if (!audio || !audio.scores[id]) return;
    stopScores();
    audio.activeId = id;
    audio.index = index;
    audio.started = true;
    const el = audio.scores[id][index];
    try { el.currentTime = 0; } catch { /* metadata not in yet */ }
    const pending = el.play();
    if (pending && pending.catch) pending.catch(() => {});
  }

  function playScore(id) {
    ensureAudio();
    stopScores();
    audio.index = 0;
    if (!soundtrackById(id)) {
      audio.activeId = "none";
      audio.started = false;
      return;
    }
    ensureSoundtrack(id);
    playFile(id, 0);
  }

  function playCrash() {
    ensureAudio();
    if (!audio || muted) return;
    const now = performance.now() / 1000;
    if (now - audio.crashAt < 0.22) return;
    audio.crashAt = now;
    const hit = () => {
      const time = audio.ctx.currentTime;
      const src = audio.ctx.createBufferSource();
      src.buffer = audio.noiseBuf;
      const filter = audio.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1400, time);
      filter.frequency.exponentialRampToValueAtTime(180, time + 0.28);
      filter.Q.value = 0.55;
      const gain = audio.ctx.createGain();
      gain.gain.setValueAtTime(0.62, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.42);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(audio.ctx.destination);
      src.start(time);
      src.stop(time + 0.44);
      const osc = audio.ctx.createOscillator();
      const thud = audio.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(110, time);
      osc.frequency.exponentialRampToValueAtTime(38, time + 0.24);
      thud.gain.setValueAtTime(0.7, time);
      thud.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);
      osc.connect(thud);
      thud.connect(audio.ctx.destination);
      osc.start(time);
      osc.stop(time + 0.3);
      const clank = audio.ctx.createOscillator();
      const clankGain = audio.ctx.createGain();
      clank.type = "square";
      clank.frequency.setValueAtTime(240, time);
      clank.frequency.exponentialRampToValueAtTime(70, time + 0.12);
      clankGain.gain.setValueAtTime(0.12, time);
      clankGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
      clank.connect(clankGain);
      clankGain.connect(audio.ctx.destination);
      clank.start(time);
      clank.stop(time + 0.18);
    };
    if (audio.ctx.state === "suspended") {
      const pending = audio.ctx.resume();
      if (pending && pending.then) pending.then(hit);
      else hit();
      return;
    }
    hit();
  }

  function playCheer(win) {
    ensureAudio();
    if (!audio || muted) return;
    const cheer = () => {
      const time = audio.ctx.currentTime;
      const src = audio.ctx.createBufferSource();
      src.buffer = audio.noiseBuf;
      const filter = audio.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = win ? 1600 : 1100;
      filter.Q.value = 0.45;
      const gain = audio.ctx.createGain();
      const peak = win ? 0.28 : 0.14;
      const dur = win ? 1.7 : 0.85;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(peak, time + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(audio.ctx.destination);
      src.start(time);
      src.stop(time + dur + 0.05);
      if (!win) return;
      for (const freq of [523, 659, 784]) {
        const osc = audio.ctx.createOscillator();
        const tone = audio.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        tone.gain.setValueAtTime(0.0001, time);
        tone.gain.exponentialRampToValueAtTime(0.08, time + 0.05);
        tone.gain.exponentialRampToValueAtTime(0.0001, time + 1.15);
        osc.connect(tone);
        tone.connect(audio.ctx.destination);
        osc.start(time);
        osc.stop(time + 1.2);
      }
    };
    if (audio.ctx.state === "suspended") {
      const pending = audio.ctx.resume();
      if (pending && pending.then) pending.then(cheer);
      else cheer();
      return;
    }
    cheer();
  }

  function noiseHit(freq, freq2, dur, gainValue, filterFreq) {
    if (!audio || muted) return;
    const time = audio.ctx.currentTime;
    const src = audio.ctx.createBufferSource();
    src.buffer = audio.noiseBuf;
    const filter = audio.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(filterFreq, time);
    filter.Q.value = 0.7;
    const gain = audio.ctx.createGain();
    gain.gain.setValueAtTime(gainValue, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(audio.ctx.destination);
    src.start(time);
    src.stop(time + dur + 0.02);
    const osc = audio.ctx.createOscillator();
    const thud = audio.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq2), time + dur);
    thud.gain.setValueAtTime(gainValue * 0.35, time);
    thud.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(thud);
    thud.connect(audio.ctx.destination);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  function playThrust() {
    if (!audio || muted) return;
    const time = audio.ctx.currentTime;
    if (time - (audio.thrustAt || -10) < 0.18) return;
    audio.thrustAt = time;
    noiseHit(220, 70, 0.16, 0.08, 900);
  }

  function playZap() {
    if (!audio || muted) return;
    const time = audio.ctx.currentTime;
    if (time - (audio.zapAt || -10) < 0.07) return;
    audio.zapAt = time;
    noiseHit(480, 110, 0.12, 0.14, 2200);
  }

  function playEmpHit() {
    if (!audio || muted) return;
    const time = audio.ctx.currentTime;
    if (time - (audio.hitAt || -10) < 0.07) return;
    audio.hitAt = time;
    noiseHit(160, 42, 0.2, 0.2, 480);
  }

  function updateAudio() {
    if (!audio) return;
    if (musicShouldPlay() && audio.ctx.state === "suspended") audio.ctx.resume();
    if (!musicShouldPlay()) {
      if (phase !== "race" && phase !== "done") audio.started = false;
      stopScores();
      return;
    }
    if (phase === "race" && (!audio.started || audio.activeId !== scoreId)) {
      playScore(scoreId);
      return;
    }
    const playingId = phase === "done" ? audio.activeId : scoreId;
    const el = audio.scores[playingId] && audio.scores[playingId][audio.index];
    if (el && el.paused) {
      const pending = el.play();
      if (pending && pending.catch) pending.catch(() => {});
    }
  }

  function rank() {
    const field = [player, ...pack];
    const score = (racer) => (racer.state.lap - 1) * samples.length + nearestIndex(samples, racer.state.x, racer.state.z);
    field.sort((a, b) => score(b) - score(a));
    return field.indexOf(player) + 1;
  }

  function updateHud() {
    const speed = document.querySelector("#speed");
    const battery = document.querySelector("#battery");
    const lap = document.querySelector("#lap");
    const assist = document.querySelector("#assist");
    const place = document.querySelector("#place");
    const skyLabel = document.querySelector("#sky");
    const count = document.querySelector("#count");
    if (speed) {
      const mph = String(Math.round(Math.abs(player.state.speed) * 2.23694));
      let text = speed.firstChild;
      if (!text || text.nodeType !== Node.TEXT_NODE) {
        text = document.createTextNode("");
        speed.insertBefore(text, speed.firstChild);
      }
      text.nodeValue = mph;
    }
    if (battery) battery.style.width = `${player.state.battery}%`;
    const roaming = playMode === "roam";
    if (lap) lap.textContent = roaming ? "Open" : `${Math.min(player.state.lap, lapsToWin)} / ${lapsToWin}`;
    const diffLive = document.querySelector("#diff-live");
    if (diffLive) diffLive.textContent = levelLabel(chosenLevel());
    const empMeter = document.querySelector("#emp");
    if (empMeter) empMeter.style.width = player.state.empCharge >= 1 ? "100%" : "0%";
    const bodyMeter = document.querySelector("#body");
    if (bodyMeter) {
      const hull = player.state.hull == null ? 1 : player.state.hull;
      bodyMeter.style.width = `${Math.round(hull * 100)}%`;
      const tone = hull > 0.55 ? "#7dffb2" : hull > 0.25 ? "#f0c14a" : "#ff5a6a";
      bodyMeter.style.background = tone;
      bodyMeter.style.boxShadow = `0 0 10px ${tone}`;
    }
    const thrustWrap = document.querySelector("#thrust-wrap");
    const thrustMeter = document.querySelector("#thrust");
    if (thrustWrap) thrustWrap.hidden = player.spec.kind !== "roadster";
    if (thrustMeter) thrustMeter.style.width = `${Math.round(((player.state.thrustFuel || 0) / THRUST_FUEL) * 100)}%`;
    if (place) place.textContent = roaming ? "Roam" : `P${rank()} / ${1 + pack.length}`;
    drawMap();
    if (assist) {
      assist.textContent = player.state.assistMode === "none" ? "" : `${player.state.assistMode === "fsd" ? "FSD" : "Autopilot"} ${player.state.assist.toFixed(1)}`;
    }
    if (skyLabel) skyLabel.textContent = dayAmount > 0.65 ? "DAY" : dayAmount > 0.3 ? "DUSK" : "NIGHT";
    if (count) {
      count.hidden = countdown <= 0 || phase !== "race";
      count.textContent = countdown > 1 ? String(Math.ceil(countdown - 0.01)) : "GO";
    }
  }

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.addPass(new RenderPass(scene, camera));
  const gtao = new GTAOPass(scene, camera, innerWidth, innerHeight);
  gtao.output = GTAOPass.OUTPUT.Default;
  gtao.blendIntensity = 0.55;
  gtao.updateGtaoMaterial({
    radius: 0.45, distanceExponent: 1, thickness: 1, scale: 1.15, samples: 8, distanceFallOff: 1, screenSpaceRadius: true,
  });
  composer.addPass(gtao);
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.14, 0.35, 0.96);
  composer.addPass(bloom);
  const motion = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, velocity: { value: new THREE.Vector2() } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform vec2 velocity;
      varying vec2 vUv;
      void main() {
        vec2 v = velocity;
        vec4 col = texture2D(tDiffuse, vUv) * 0.36;
        col += texture2D(tDiffuse, vUv + v * 0.35) * 0.2;
        col += texture2D(tDiffuse, vUv - v * 0.35) * 0.2;
        col += texture2D(tDiffuse, vUv + v * 0.7) * 0.12;
        col += texture2D(tDiffuse, vUv - v * 0.7) * 0.12;
        gl_FragColor = col;
      }
    `,
  });
  composer.addPass(motion);
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, night: { value: 0 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float night;
      varying vec2 vUv;
      void main() {
        vec3 col = texture2D(tDiffuse, vUv).rgb;
        float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
        col = mix(vec3(l), col, 1.12);
        col = mix(col, col * vec3(0.82, 0.94, 1.18), night * 0.55);
        col = (col - 0.5) * 1.06 + 0.5;
        gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
      }
    `,
  });
  composer.addPass(grade);
  composer.addPass(new OutputPass());

  const prevCam = new THREE.Vector3();
  prevCam.copy(camera.position);

  function launchFirework(big) {
    const spread = big ? 18 : 8;
    const shells = big ? 2 : 1;
    for (let shell = 0; shell < shells; shell++) {
      const px = player.state.x + (Math.random() - 0.5) * spread;
      const pz = player.state.z + (Math.random() - 0.5) * spread;
      const py = roadHeight(px, pz) + (big ? 8 + Math.random() * 5 : 4 + Math.random() * 3);
      const count = big ? 40 : 18;
      for (let n = 0; n < count; n++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 2.2 + Math.random() * (big ? 8 : 4);
        emitParticle(
          fest, px, py, pz,
          Math.cos(ang) * sp,
          6 + Math.random() * (big ? 14 : 7),
          Math.sin(ang) * sp,
          0.85 + Math.random() * 0.55,
        );
      }
    }
  }

  function stepParty(dt) {
    if (!party) return;
    party.life -= dt;
    party.acc -= dt;
    if (party.acc <= 0 && party.life > 0.35) {
      launchFirework(party.place === 1);
      party.acc = reducedMotion ? 30 : party.place === 1 ? 0.34 : 0.66;
    }
    if (party.life <= 0) {
      party = null;
      const celebrate = document.querySelector("#celebrate");
      if (celebrate) celebrate.hidden = true;
    }
  }

  function updateWrongWay(dt) {
    const el = document.querySelector("#wrong-way");
    if (!el) return;
    let backward = false;
    if (playMode !== "roam" && phase === "race" && countdown <= 0 && player.state.speed > 4) {
      const s = samples[nearestIndex(samples, player.state.x, player.state.z)];
      const fwd = carForward(player.state.yaw);
      if (fwd.x * s.fx + fwd.z * s.fz < -0.35) backward = true;
    }
    wrongTime = backward ? wrongTime + dt : Math.max(0, wrongTime - dt * 1.4);
    el.hidden = wrongTime < 2.4;
  }

  function frame(dt) {
    pollPausePad();
    if (racePaused && phase === "race") {
      prev.c = keys.has("KeyC");
      prev.r = keys.has("KeyR");
      prev.q = keys.has("KeyQ");
      prev.e = keys.has("KeyE");
      prev.f = keys.has("KeyF");
      prev.t = keys.has("KeyT");
      prev.shift = keys.has("ShiftLeft") || keys.has("ShiftRight");
      updateAudio();
      updateHud();
      return;
    }
    stepDt = dt;
    updateSky(dt);
    debug.visible = showDebug;
    stepRobots(dt);
    const actors = roadActors();
    const input = phase === "race" && countdown <= 0 ? readInput(dt) : readInputHold();
    if (phase === "race") {
      if (countdown > 0) {
        countdown -= dt;
        player.state.speed = 0;
      } else if (!player.state.finished) {
        raceTime += dt;
        const aim = aheadPoint(samples, nearestIndex(samples, player.state.x, player.state.z), player.state.assistMode === "fsd" ? 30 : 20);
        const felt = driveOne(player, input, dt, aim, lapsToWin, actors);
        input.steer = felt.steer;
        input.throttle = felt.throttle;
        input.brake = felt.brake;
        for (const racer of pack) {
          if (!racer.ai) continue;
          const index = nearestIndex(samples, racer.state.x, racer.state.z);
          const level = courseLevel(chosenLevel());
          const aimR = aheadPoint(samples, index, level.look);
          let aimX = aimR.x;
          let aimZ = aimR.z;
          if (level.wander) {
            const wobble = Math.sin(elapsed * 0.65 + racer.phaseSeed * 4) * level.wander;
            aimX += aimR.rx * wobble;
            aimZ += aimR.rz * wobble;
          }
          const desired = yawFromForward(aimX - racer.state.x, aimZ - racer.state.z);
          const diff = wrapAngle(desired - racer.state.yaw);
          const target = racer.spec.top * (level.pace + level.paceWave * Math.sin(elapsed * 0.25 + racer.phaseSeed));
          driveOne(
            racer,
            {
              throttle: racer.state.speed < target ? 1 : 0.15,
              brake: racer.state.speed > target * 1.12 ? 0.65 : 0,
              steer: clamp(-diff * level.steer, -1, 1),
              boost: false, ludicrousToggle: false, autopilot: false, fsd: false, emp: false,
            },
            dt, null, 99, actors,
          );
          aiEmp(racer);
        }
        const live = [player, ...pack];
        for (const racer of live) racer.state.carHit = false;
        for (let i = 0; i < live.length; i++) {
          for (let j = i + 1; j < live.length; j++) separateCars(live[i], live[j]);
        }
        for (const racer of live) {
          const worldY = roadHeight(racer.state.x, racer.state.z) + racer.spec.ride + (racer.state.boreOn ? (racer.state.boreH || 0) : (racer.state.lift || 0));
          const again = resolveBody(
            racer.state.x, racer.state.z, racer.state.yaw, racer.spec, boxesFor(racer), columns, actors, worldY,
          );
          if (!racer.state.boreOn) {
            racer.state.x = again.x;
            racer.state.z = again.z;
          }
          if (again.hit) {
            racer.state.hit = true;
            if (!(racer.state.impact > 0)) racer.state.impact = Math.abs(racer.state.speed);
          }
          if (racer.state.boreOn && !racer.state.carHit) stickBore(racer);
          bumpRoadRobots(racer);
          takePad(racer);
        }
        if (input.emp) tryFire(player);
        stepBolts(dt);
        stepPads(dt);
        if (playMode !== "roam" && player.state.finished) finishRace();
      }
      for (const racer of [player, ...pack]) {
        if (racer === player || racer.ai) noteCrash(racer);
      }
      syncCar(player, input.steer, input.throttle, input.brake);
      emitFx(player, input, dt);
      for (const racer of pack) {
        if (!racer.ai) continue;
        syncCar(racer, 0, racer.state.speed > 1 ? 1 : 0, 0);
      }
    } else {
      syncCar(player, 0, 0, 0);
    }
    updateLaunches(dt);
    stepDebris(dt);
    stepParty(dt);
    updateWrongWay(dt);
    updatePool(smoke, dt, -0.4);
    updatePool(sparks, dt, 14);
    updatePool(boost, dt, 0.2);
    updatePool(plume, dt, -1);
    updatePool(fest, dt, 7.5);
    const nextGate = (player.state.cp + 1) % gates.length;
    gates.forEach((gate, index) => {
      gate.traverse((obj) => {
        if (obj.material) obj.material.emissiveIntensity = index === nextGate ? 1.05 : 0.28;
      });
    });
    updateCamera(dt);
    updateAudio();
    updateHud();
    const vel = camera.position.clone().sub(prevCam);
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    const blur = reducedMotion ? 0 : clamp(player.state.speed / 80, 0, 1) * 0.012;
    motion.uniforms.velocity.value.set(vel.dot(right) * blur, vel.dot(up) * blur);
    prevCam.copy(camera.position);
    grade.uniforms.night.value = 1 - dayAmount;
  }

  const LAUNCH_HOLD = 16;
  const LAUNCH_IGNITE = 3.2;
  const LAUNCH_CLIMB = 14;
  const LAUNCH_GONE = 5;
  const LAUNCH_CYCLE = LAUNCH_HOLD + LAUNCH_IGNITE + LAUNCH_CLIMB + LAUNCH_GONE;

  function updateLaunches(dt) {
    ships.forEach((ship, index) => {
      const local = (elapsed + index * LAUNCH_CYCLE * 0.5) % LAUNCH_CYCLE;
      let thrust = 0.05;
      let altitude = 0;
      if (!reducedMotion && local >= LAUNCH_HOLD) {
        if (local < LAUNCH_HOLD + LAUNCH_IGNITE) {
          const u = (local - LAUNCH_HOLD) / LAUNCH_IGNITE;
          thrust = 0.2 + u * 0.8;
          altitude = u * u * 6;
        } else if (local < LAUNCH_HOLD + LAUNCH_IGNITE + LAUNCH_CLIMB) {
          const u = (local - LAUNCH_HOLD - LAUNCH_IGNITE) / LAUNCH_CLIMB;
          thrust = 1;
          altitude = 6 + u * u * 240;
        } else {
          const u = (local - LAUNCH_HOLD - LAUNCH_IGNITE - LAUNCH_CLIMB) / LAUNCH_GONE;
          thrust = Math.max(0, 1 - u);
          altitude = u > 0.82 ? 0 : 246 + u * 70;
          ship.group.visible = u <= 0.82;
        }
      }
      if (local < LAUNCH_HOLD) ship.group.visible = true;
      ship.group.position.y = altitude;
      const length = 1.5 + thrust * 22 * ship.scale;
      ship.flame.scale.set(0.7 + thrust * 0.35, length, 0.7 + thrust * 0.35);
      ship.flameMat.opacity = 0.2 + thrust * 0.65;
      ship.glow.scale.set(1.15, length * 0.62, 1.15);
      ship.glowMat.opacity = thrust * 0.28;
      ship.flameLight.intensity = thrust * 16;
      if (!reducedMotion && thrust > 0.25 && Math.random() < dt * (16 + thrust * 40)) {
        emitParticle(
          plume,
          ship.column.x + (Math.random() - 0.5) * 2.4,
          altitude + 1.1,
          ship.column.z + (Math.random() - 0.5) * 2.4,
          (Math.random() - 0.5) * 1.6,
          -4 - thrust * 8,
          (Math.random() - 0.5) * 1.6,
          0.35 + Math.random() * 0.3,
        );
      }
    });
  }

  function readInputHold() {
    const input = readInput(stepDt);
    input.throttle = 0;
    input.brake = 0;
    input.boost = false;
    input.ludicrousToggle = false;
    input.autopilot = false;
    input.fsd = false;
    input.emp = false;
    input.thrust = false;
    return input;
  }

  let last = performance.now();
  let accum = 0;
  function loop(now) {
    const stamp = Number.isFinite(now) && now > 0 ? now : last + 1000 / 60;
    let delta = (stamp - last) / 1000;
    if (!Number.isFinite(delta) || delta <= 0) delta = 1 / 60;
    const frameDt = Math.min(0.05, delta);
    last = stamp;
    accum += frameDt;
    const step = 1 / 60;
    let guard = 0;
    let stepped = false;
    while (accum >= step && guard < 4) {
      frame(step);
      accum -= step;
      guard += 1;
      stepped = true;
    }
    if (stepped) composer.render();
    requestAnimationFrame(loop);
  }

  addEventListener("resize", () => {
    camera.aspect = innerWidth / Math.max(innerHeight, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
  });
  function chosenLevel() {
    const on = document.querySelector("[data-diff].is-on");
    const id = on && on.dataset.diff;
    return id === "novice" || id === "expert" ? id : "medium";
  }

  function chosenLaps() {
    const el = document.querySelector("#laps");
    const n = Number(el && el.value);
    return n === 1 || n === 2 || n === 3 || n === 5 ? n : 2;
  }

  function chosenMode() {
    const on = document.querySelector("[data-mode].is-on");
    return on && on.dataset.mode === "roam" ? "roam" : "race";
  }

  function applyMode(mode, persist) {
    const id = mode === "roam" ? "roam" : "race";
    document.querySelectorAll("[data-mode]").forEach((el) => el.classList.toggle("is-on", el.dataset.mode === id));
    const lapsEl = document.querySelector("#laps");
    if (lapsEl) lapsEl.hidden = id === "roam";
    if (persist) {
      try { localStorage.setItem("twr-mode", id); } catch { /* private mode */ }
    }
  }

  function driverName() {
    const input = document.querySelector("#driver");
    const raw = input ? input.value : "";
    return raw.replace(/\s+/g, " ").trim().slice(0, 18);
  }

  function loadBoard() {
    try {
      const parsed = JSON.parse(localStorage.getItem("twr-board") || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((row) => row && typeof row.name === "string" && Number.isFinite(Number(row.time)));
    } catch {
      return [];
    }
  }

  function renderBoard() {
    const rows = loadBoard();
    document.querySelectorAll("[data-board]").forEach((list) => {
      list.replaceChildren();
      if (!rows.length) {
        const li = document.createElement("li");
        li.textContent = "No finishes yet.";
        list.appendChild(li);
        return;
      }
      const level = chosenLevel();
      const visible = rows.filter((row) => (row.level || "medium") === level);
      if (!visible.length) {
        const li = document.createElement("li");
        li.textContent = "No finishes yet.";
        list.appendChild(li);
        return;
      }
      visible.slice(0, 8).forEach((row, index) => {
        const li = document.createElement("li");
        const laps = row.laps || 2;
        li.textContent = `${index + 1}. ${row.name} · ${Number(row.time).toFixed(1)}s · ${laps} laps · ${levelLabel(row.level || "medium")} · ${row.car} · P${row.place}`;
        list.appendChild(li);
      });
    });
  }

  function saveResult(standing) {
    const rows = loadBoard();
    rows.push({
      name: driverName() || "Driver",
      car: player.spec.name,
      time: Math.round(raceTime * 10) / 10,
      place: standing,
      laps: lapsToWin,
      level: chosenLevel(),
      at: Date.now(),
    });
    rows.sort((a, b) => a.time - b.time || a.at - b.at);
    const kept = ["novice", "medium", "expert"].flatMap((id) => rows.filter((row) => (row.level || "medium") === id).slice(0, 12));
    try { localStorage.setItem("twr-board", JSON.stringify(kept)); } catch { /* private mode */ }
    renderBoard();
  }

  function drawMap() {
    const canvas = document.querySelector("#map");
    if (!canvas) return;
    canvas.hidden = phase !== "race";
    if (canvas.hidden) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const s of samples) {
      minX = Math.min(minX, s.x);
      maxX = Math.max(maxX, s.x);
      minZ = Math.min(minZ, s.z);
      maxZ = Math.max(maxZ, s.z);
    }
    const pad = 14;
    const scale = Math.min((w - pad * 2) / (maxX - minX || 1), (h - pad * 2) / (maxZ - minZ || 1));
    const ox = (w - (maxX - minX) * scale) / 2;
    const oy = (h - (maxZ - minZ) * scale) / 2;
    const project = (x, z) => [ox + (x - minX) * scale, oy + (z - minZ) * scale];
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(46, 231, 255, 0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    samples.forEach((s, i) => {
      const [x, y] = project(s.x, s.z);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i = tunnel.start; i < tunnel.start + tunnel.span; i++) {
      const [x, y] = project(samples[i].x, samples[i].z);
      if (i === tunnel.start) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    const [sx, sy] = project(samples[0].x, samples[0].z);
    ctx.fillStyle = "#f4f4f4";
    ctx.fillRect(sx - 4, sy - 4, 8, 8);
    ctx.fillStyle = "#111111";
    ctx.fillRect(sx - 4, sy - 4, 4, 4);
    ctx.fillRect(sx, sy, 4, 4);
    for (const racer of pack) {
      if (!racer.ai || !racer.root.visible) continue;
      const [x, y] = project(racer.state.x, racer.state.z);
      ctx.fillStyle = "#" + racer.spec.color.toString(16).padStart(6, "0");
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#f4fbff";
      ctx.stroke();
    }
    const [px, py] = project(player.state.x, player.state.z);
    const fwd = carForward(player.state.yaw);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(Math.atan2(fwd.x, -fwd.z));
    ctx.fillStyle = "#2ee7ff";
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(5.5, 6);
    ctx.lineTo(-5.5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  addEventListener("keydown", (event) => {
    if (event.target && (event.target.id === "driver" || event.target.id === "laps" || event.target.closest?.("[data-diff]") || event.target.closest?.("[data-mode]"))) return;
    const driving = ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code);
    const sliderHasKeys = document.activeElement && (document.activeElement.id === "sens" || document.activeElement.id === "sens-live") && phase !== "race";
    if (driving && !sliderHasKeys) event.preventDefault();
    if (!event.repeat && (event.code === "Escape" || event.code === "KeyP") && phase === "race") {
      event.preventDefault();
      setPaused(!racePaused);
    }
    if (!event.repeat && event.code === "KeyM") muted = !muted;
    keys.add(event.code);
    ensureAudio();
  }, true);
  addEventListener("keyup", (event) => keys.delete(event.code));

  document.querySelector("#cars").innerHTML = VEHICLES.map((spec) => `<button type="button" data-car="${spec.id}">${spec.name}</button>`).join("");
  document.querySelector("#cars").addEventListener("click", (event) => {
    const button = event.target.closest("[data-car]");
    if (!button || phase !== "menu") return;
    selectCar(button.dataset.car);
  });
  document.querySelector("#start").addEventListener("click", () => {
    const name = driverName();
    const input = document.querySelector("#driver");
    if (chosenMode() !== "roam" && !name) {
      if (input) {
        input.focus();
        input.placeholder = "Enter your name";
      }
      return;
    }
    if (input) input.value = name;
    try { localStorage.setItem("twr-name", name); } catch { /* private mode */ }
    lapsToWin = chosenLaps();
    try { localStorage.setItem("twr-laps", String(lapsToWin)); } catch { /* private mode */ }
    ensureAudio();
    startRace();
  });
  const modeRow = document.querySelector(".mode-row");
  if (modeRow) modeRow.addEventListener("click", (event) => {
    const button = event.target.closest("[data-mode]");
    if (!button || phase === "race") return;
    const id = button.dataset.mode === "roam" ? "roam" : "race";
    applyMode(id, true);
  });
  const diffRow = document.querySelector(".diff-row");
  if (diffRow) diffRow.addEventListener("click", (event) => {
    const button = event.target.closest("[data-diff]");
    if (!button || phase === "race") return;
    const id = button.dataset.diff;
    if (id !== "novice" && id !== "medium" && id !== "expert") return;
    const previous = chosenLevel();
    document.querySelectorAll("[data-diff]").forEach((el) => el.classList.toggle("is-on", el.dataset.diff === id));
    try { localStorage.setItem("twr-diff", id); } catch { /* private mode */ }
    if (previous !== id) {
      const built = retileCourse();
      if (!built) {
        document.querySelectorAll("[data-diff]").forEach((el) => el.classList.toggle("is-on", el.dataset.diff === previous));
        try { localStorage.setItem("twr-diff", previous); } catch { /* private mode */ }
      }
    }
    renderBoard();
  });
  try {
    const savedName = localStorage.getItem("twr-name");
    const nameInput = document.querySelector("#driver");
    if (savedName && nameInput) nameInput.value = savedName.slice(0, 18);
    const storedLaps = Number(localStorage.getItem("twr-laps"));
    const lapsEl = document.querySelector("#laps");
    if (lapsEl && (storedLaps === 1 || storedLaps === 2 || storedLaps === 3 || storedLaps === 5)) {
      lapsEl.value = String(storedLaps);
    }
    lapsToWin = chosenLaps();
    const storedMode = localStorage.getItem("twr-mode");
    applyMode(storedMode === "roam" ? "roam" : "race", false);
  } catch { /* private mode */ }
  document.querySelector("#driver").addEventListener("keydown", (event) => {
    if (event.code !== "Enter") return;
    event.preventDefault();
    document.querySelector("#start").click();
  });
  try {
    const storedRaw = localStorage.getItem("twr-steer");
    const stored = storedRaw == null ? NaN : Number(storedRaw);
    if (Number.isFinite(stored)) steerSens = clamp(stored, 0.45, 1.8);
  } catch { /* private mode */ }
  applySteerSens(steerSens, false);
  for (const id of ["sens", "sens-live"]) {
    document.querySelector(`#${id}`).addEventListener("input", (event) => {
      applySteerSens(event.target.value, true);
    });
  }
  document.querySelector("#again").addEventListener("click", () => {
    if (!driverName()) {
      quitRace();
      document.querySelector("#driver").focus();
      return;
    }
    startRace();
  });
  document.querySelector("#pause-btn").addEventListener("click", () => {
    if (phase !== "race") return;
    setPaused(!racePaused);
  });
  document.querySelector("#resume").addEventListener("click", () => setPaused(false));
  document.querySelector("#quit-btn").addEventListener("click", () => quitRace());
  document.querySelector("#pause-quit").addEventListener("click", () => quitRace());
  function renderScoreLists() {
    const options = [{ id: "none", name: "No music" }, ...SOUNDTRACKS];
    const html = options.map((item) => `<button type="button" data-score="${item.id}">${item.name}</button>`).join("");
    document.querySelectorAll("[data-score-list]").forEach((el) => { el.innerHTML = html; });
  }
  function selectScore(id, preload) {
    scoreId = id === "none" || soundtrackById(id) ? id : SOUNDTRACKS[0].id;
    try { localStorage.setItem("twr-score", scoreId); } catch { /* private mode */ }
    document.querySelectorAll("[data-score]").forEach((button) => {
      button.classList.toggle("is-on", button.dataset.score === scoreId);
    });
    const note = document.querySelector("#pause-note");
    if (note && racePaused) {
      const spec = soundtrackById(scoreId);
      note.textContent = spec ? `${spec.name} waits with the race.` : "No music is playing.";
    }
    if (preload && soundtrackById(scoreId)) ensureSoundtrack(scoreId);
  }
  renderScoreLists();
  try {
    let storedScore = localStorage.getItem("twr-score");
    if (storedScore === "neon-velocity") storedScore = "neon-velocity-1";
    if (storedScore === "cyber-necrosis") storedScore = "cyber-necrosis-1";
    if (storedScore) selectScore(storedScore);
    else selectScore(scoreId);
  } catch { selectScore(scoreId); }
  renderBoard();
  document.querySelector("#ui").addEventListener("click", (event) => {
    const button = event.target.closest("[data-score]");
    if (!button) return;
    if (phase === "race" && !racePaused) return;
    selectScore(button.dataset.score, true);
  });
  document.querySelector("#touch").addEventListener("pointerdown", (event) => {
    const kind = event.target.dataset.touch;
    if (!kind) return;
    if (kind === "throttle") touch.throttle = 1;
    if (kind === "brake") touch.brake = 1;
    if (kind === "left") touch.steer = -1;
    if (kind === "right") touch.steer = 1;
    if (kind === "boost") touch.boost = true;
    if (kind === "emp") touch.emp = true;
  });
  document.querySelector("#touch").addEventListener("pointerup", () => {
    touch.throttle = 0;
    touch.brake = 0;
    touch.steer = 0;
    touch.boost = false;
    touch.emp = false;
  });
  document.querySelector("#touch").addEventListener("pointerleave", () => {
    touch.throttle = 0;
    touch.brake = 0;
    touch.steer = 0;
    touch.boost = false;
    touch.emp = false;
  });

  selectCar("model3");
  updateSky(0);
  updateCamera(1 / 60);

  const fwd = carForward(player.state.yaw);
  const behind = (camera.position.x - player.state.x) * fwd.x + (camera.position.z - player.state.z) * fwd.z;
  if (phase !== "menu" && behind > -1) failures.push(`camera is not behind the car (${behind.toFixed(2)})`);

  window.__grid = {
    failures,
    get samples() { return samples; },
    get boxes() { return boxes; },
    get columns() { return columns; },
    startRace,
    selectCar,
    quitRace,
    finishNow() { finishRace(); },
    field() { return pack.filter((racer) => racer.ai).map((racer) => racer.spec.id); },
    results() { return loadBoard(); },
    holdThrottle(on) { forcedThrottle = on ? 1 : 0; },
    testRoam() {
      applyMode("roam", false);
      const name = document.querySelector("#driver");
      const savedName = name ? name.value : "";
      if (name) name.value = "";
      document.querySelector("#start").click();
      const startedBlank = phase === "race" && playMode === "roam";
      if (name) name.value = savedName || "Driver";
      applyMode("roam", false);
      startRace();
      countdown = 0;
      const drive = { throttle: 1, brake: 0, steer: 0, boost: false, ludicrousToggle: false, autopilot: false, fsd: false, emp: false, thrust: false };
      let peak = 0;
      for (let i = 0; i < 120; i++) {
        const index = nearestIndex(samples, player.state.x, player.state.z);
        const aim = aheadPoint(samples, index, 20);
        driveOne(player, drive, 1 / 60, aim, lapsToWin, []);
        peak = Math.max(peak, Math.abs(player.state.speed));
      }
      const sample = samples[nearestIndex(samples, player.state.x, player.state.z)];
      player.state.speed = 20;
      player.state.yaw = yawFromForward(-sample.fx, -sample.fz);
      updateWrongWay(3);
      updateHud();
      const report = {
        startedBlank,
        phase,
        mode: playMode,
        rivals: pack.filter((racer) => racer.ai).length,
        finished: Boolean(player.state.finished),
        lap: player.state.lap,
        peak,
        place: document.querySelector("#place").textContent,
        lapText: document.querySelector("#lap").textContent,
        lapsHidden: Boolean(document.querySelector("#laps").hidden),
        wrongHidden: Boolean(document.querySelector("#wrong-way").hidden),
      };
      applyMode("race", false);
      if (name) name.value = "Driver";
      startRace();
      updateHud();
      report.raceRivals = pack.filter((racer) => racer.ai).length;
      report.raceLaps = lapsToWin;
      report.racePlace = document.querySelector("#place").textContent;
      report.raceLap = document.querySelector("#lap").textContent;
      quitRace();
      if (name) name.value = "";
      applyMode("race", false);
      document.querySelector("#start").click();
      report.raceNeedsName = phase === "menu";
      if (name) name.value = savedName;
      applyMode("race", false);
      return report;
    },
    pose() {
      return {
        x: player.state.x, z: player.state.z, yaw: player.state.yaw, speed: player.state.speed,
        battery: player.state.battery, lap: player.state.lap, phase, countdown,
        mode: playMode, rivals: pack.filter((racer) => racer.ai).length,
        finished: Boolean(player.state.finished),
      };
    },
    cameraBehind() {
      const f = carForward(player.state.yaw);
      return (camera.position.x - player.state.x) * f.x + (camera.position.z - player.state.z) * f.z;
    },
    noseDot() {
      const nose = player.root.getObjectByName("nose");
      const pos = new THREE.Vector3();
      nose.getWorldPosition(pos);
      pos.sub(player.root.position);
      pos.y = 0;
      if (pos.length() < 0.001) return 0;
      pos.normalize();
      const f = carForward(player.state.yaw);
      return pos.x * f.x + pos.z * f.z;
    },
    setDebug(on) { showDebug = on; },
    scrub(seconds) { elapsed = Math.max(0, seconds); },
    robots: trackRobots.length,
    get tunnel() {
      return {
        start: tunnel.start,
        span: tunnel.span,
        chord: bore.chord,
        crown: bore.crown,
        floor: samples[tunnel.start + (tunnel.span >> 1)].y,
      };
    },
    courseReport() {
      let hillTop = 0;
      let bridgeTop = 0;
      let maxStep = 0;
      for (let i = 0; i < samples.length; i++) {
        const sample = samples[i];
        if (sample.role === "hill") hillTop = Math.max(hillTop, sample.y || 0);
        if (sample.role === "bridge") bridgeTop = Math.max(bridgeTop, sample.y || 0);
        const next = samples[(i + 1) % samples.length];
        maxStep = Math.max(maxStep, Math.abs(wrapAngle(yawFromForward(next.fx, next.fz) - yawFromForward(sample.fx, sample.fz))));
      }
      return {
        seed: course.seed,
        hillTop,
        bridgeTop,
        maxTurnDeg: maxStep * 180 / Math.PI,
        minRadius: course.minRadius,
        tunnelStart: tunnel.start,
        pads: pads.length,
        laps: lapsToWin,
        banner: dressRoot.children.length > 0,
        level: course.level || chosenLevel(),
        crossings: crossings.length,
        spread: course.spread || 0,
        bends: course.bends || 0,
        maxControlDeg: course.maxControlDeg || 0,
      };
    },
    tune() {
      const level = courseLevel(chosenLevel());
      return { id: level.id, pace: level.pace, empRange: level.empRange, look: level.look, steer: level.steer };
    },
    newCourse() { retileCourse(); },
    empState() {
      return { charge: player.state.empCharge, stun: player.state.empStun, cool: player.state.empCool };
    },
    testEmp() {
      const rival = racers.find((racer) => racer !== player);
      const saved = phase;
      rival.ai = true;
      rival.root.visible = true;
      pack = [rival];
      place(player, 40, 0);
      player.state.empCharge = 1;
      player.state.empCool = 0;
      player.state.empStun = 0;
      const fwd = carForward(player.state.yaw);
      rival.state.x = player.state.x + fwd.x * 18;
      rival.state.z = player.state.z + fwd.z * 18;
      rival.state.yaw = player.state.yaw;
      rival.state.speed = 0;
      rival.state.empStun = 0;
      phase = "race";
      countdown = 0;
      tryFire(player);
      for (let i = 0; i < 30; i++) stepBolts(1 / 60);
      const again = tryFire(player);
      player.state.empCharge = 0;
      player.state.empCool = 0;
      const idle = { throttle: 0, brake: 0, steer: 0, boost: false, ludicrousToggle: false, autopilot: false, fsd: false, emp: false };
      for (let i = 0; i < 120; i++) driveOne(player, idle, 1 / 60, null, 99, []);
      const report = { stun: rival.state.empStun, charge: player.state.empCharge, again };
      rival.ai = false;
      rival.root.visible = false;
      pack = [];
      phase = saved;
      return report;
    },
    testPad() {
      const view = chargePadViews[0];
      if (!view) return null;
      const sample = samples[view.index];
      const rival = racers.find((racer) => racer !== player);
      const saved = {
        x: player.state.x, z: player.state.z, charge: player.state.empCharge,
        rx: rival.state.x, rz: rival.state.z, rcharge: rival.state.empCharge,
      };
      const x = sample.x + sample.rx * view.lateral;
      const z = sample.z + sample.rz * view.lateral;
      player.state.x = x;
      player.state.z = z;
      rival.state.x = x;
      rival.state.z = z;
      player.state.empCharge = 1;
      view.dark = 0;
      takePad(player);
      const full = { charge: player.state.empCharge, dark: view.dark };
      player.state.empCharge = 0;
      view.dark = 0;
      takePad(player);
      const empty = { charge: player.state.empCharge, dark: view.dark };
      player.state.empCharge = 1;
      rival.state.empCharge = 0;
      view.dark = 0;
      takePad(player);
      takePad(rival);
      const shared = { player: player.state.empCharge, rival: rival.state.empCharge, dark: view.dark };
      player.state.x = saved.x;
      player.state.z = saved.z;
      player.state.empCharge = saved.charge;
      rival.state.x = saved.rx;
      rival.state.z = saved.rz;
      rival.state.empCharge = saved.rcharge;
      view.dark = 0;
      view.mat.emissiveIntensity = 0.85;
      return { full, empty, shared };
    },
    testTunnel() {
      let mouth = tunnel.start;
      for (let i = 0; i < tunnel.span; i++) {
        if (tunnelDepth(samples[tunnel.start + i]) > 0.62) { mouth = tunnel.start + i; break; }
      }
      const savedId = player.spec.id;
      const drive = (id) => {
        selectCar(id);
        place(player, mouth, 0);
        player.state.speed = player.spec.top * 0.9;
        const before = player.state.speed;
        let peak = before;
        let hits = 0;
        const base = { throttle: 1, brake: 0, steer: 0, boost: false, ludicrousToggle: false, autopilot: false, fsd: false, emp: false, thrust: false };
        for (let n = 0; n < 100; n++) {
          const i = nearestIndex(samples, player.state.x, player.state.z);
          const sample = samples[i];
          const lat = (player.state.x - sample.x) * sample.rx + (player.state.z - sample.z) * sample.rz;
          const ahead = samples[(i + 8) % samples.length];
          const desired = yawFromForward(ahead.x - player.state.x, ahead.z - player.state.z);
          const steer = clamp(-wrapAngle(desired - player.state.yaw) * 1.8 - lat * 0.35, -1, 1);
          driveOne(player, { ...base, steer }, 1 / 60, null, 99, []);
          if (player.state.hit) hits += 1;
          peak = Math.max(peak, player.state.speed);
        }
        const end = nearestIndex(samples, player.state.x, player.state.z);
        return { id, before, peak, top: player.spec.top, hits, role: samples[end].role, end };
      };
      const roadster = drive("roadster");
      const semi = drive("semi");
      selectCar(savedId);
      return { roadster, semi, depth: samples[tunnel.start + (tunnel.span >> 1)].y, mouth };
    },
    testWall() {
      let deep = tunnel.start + (tunnel.span >> 1);
      for (let i = 0; i < tunnel.span; i++) {
        const sample = samples[tunnel.start + i];
        if ((sample.y || 0) < -6) { deep = tunnel.start + i; break; }
      }
      const savedId = player.spec.id;
      const blank = { throttle: 1, brake: 0, steer: 0, boost: false, ludicrousToggle: false, autopilot: false, fsd: false, emp: false, thrust: false };
      selectCar("roadster");
      place(player, deep, 2.3);
      player.state.speed = 24;
      for (let i = 0; i < 3; i++) driveOne(player, { ...blank, steer: 1 }, 1 / 60, null, 99, []);
      const attached = { on: player.state.boreOn, a: player.state.boreA, h: player.state.boreH };
      for (let i = 0; i < 70; i++) driveOne(player, { ...blank, steer: -1 }, 1 / 60, null, 99, []);
      const sample = samples[nearestIndex(samples, player.state.x, player.state.z)];
      const lat = (player.state.x - sample.x) * sample.rx + (player.state.z - sample.z) * sample.rz;
      const climbed = { on: player.state.boreOn, a: player.state.boreA, h: player.state.boreH, up: player.state.boreUpY, lat };
      selectCar("model3");
      place(player, deep, 2.3);
      player.state.speed = 24;
      for (let i = 0; i < 80; i++) driveOne(player, { ...blank, steer: 1 }, 1 / 60, null, 99, []);
      const sedan = { on: Boolean(player.state.boreOn), h: player.state.boreH || 0 };
      selectCar(savedId);
      return { attached, climbed, sedan };
    },
    testThrust() {
      const savedId = player.spec.id;
      const blank = { throttle: 1, brake: 0, steer: 0, boost: false, ludicrousToggle: false, autopilot: false, fsd: false, emp: false, thrust: true };
      selectCar("roadster");
      place(player, 6, 0);
      player.state.speed = 40;
      player.state.thrustFuel = THRUST_FUEL;
      player.state.boreOn = false;
      let maxL = 0;
      const before = player.state.speed;
      for (let i = 0; i < 80; i++) {
        driveOne(player, blank, 1 / 60, null, 99, []);
        maxL = Math.max(maxL, player.state.lift || 0);
      }
      const roadster = { maxL, fuel: player.state.thrustFuel, gained: player.state.speed - before, on: player.state.thrustOn };
      selectCar("model3");
      place(player, 6, 0);
      player.state.speed = 30;
      for (let i = 0; i < 80; i++) driveOne(player, blank, 1 / 60, null, 99, []);
      const sedan = { lift: player.state.lift || 0 };
      selectCar(savedId);
      return { roadster, sedan };
    },
    roadY(x, z) { return roadHeight(x, z); },
    testBypass() {
      const mid = tunnel.start + (tunnel.span >> 1);
      const s = samples[mid];
      const center = roadHeight(s.x, s.z);
      const around = roadHeight(s.x + s.rx * (s.half + 6), s.z + s.rz * (s.half + 6));
      return { center, around, half: s.half, y: s.y };
    },
    testHull() {
      const savedId = player.spec.id;
      selectCar("roadster");
      player.state.hull = 1;
      player.state.impact = 48;
      player.state.hit = true;
      player.state.crashLatch = false;
      noteCrash(player);
      const once = player.state.hull;
      noteCrash(player);
      const held = player.state.hull;
      const run = (hull) => {
        place(player, 8, 0);
        player.state.hull = hull;
        player.state.speed = 120;
        player.state.hit = false;
        player.state.crashLatch = false;
        player.state.impact = 0;
        const blank = { throttle: 1, brake: 0, steer: 0, boost: false, ludicrousToggle: false, autopilot: false, fsd: false, emp: false, thrust: false };
        driveOne(player, blank, 1 / 60, null, 99, []);
        return player.state.speed;
      };
      const limp = run(0);
      const healthy = run(1);
      player.state.hull = 1;
      player.state.hit = false;
      selectCar(savedId);
      return { once, held, limp, healthy };
    },
    testLamps() {
      const savedDay = dayAmount;
      const vis = racers.map((racer) => racer.root.visible);
      const read = (amount) => {
        dayAmount = amount;
        return ["roadster", "semi", "model3"].map((id) => {
          const racer = racers.find((item) => item.spec.id === id);
          racer.root.visible = true;
          updateLamps(racer);
          const lamps = racer.root.userData.lamps;
          return {
            id,
            left: lamps[0].spot.position.x,
            right: lamps[1].spot.position.x,
            z: lamps[0].spot.position.z,
            nose: -racer.spec.length * 0.5,
            aim: lamps[0].spot.target.position.z,
            y: lamps[0].spot.position.y,
            intensity: lamps[0].spot.intensity,
          };
        });
      };
      const day = read(0.95);
      const night = read(0.02);
      dayAmount = savedDay;
      racers.forEach((racer, index) => {
        racer.root.visible = vis[index];
        updateLamps(racer);
      });
      return { day, night };
    },
    testArrows() {
      const arrows = [];
      dressRoot.traverse((obj) => { if (obj.name === "arrow") arrows.push(obj); });
      let worst = 1;
      let checked = 0;
      const dir = new THREE.Vector3();
      for (const arrow of arrows) {
        if (arrow.userData.shoulder) continue;
        const s = samples[arrow.userData.index];
        dir.set(0, 0, -1).applyQuaternion(arrow.quaternion);
        worst = Math.min(worst, dir.x * s.fx + dir.z * s.fz);
        checked += 1;
      }
      return { count: arrows.length, checked, worst, shoulders: arrows.filter((arrow) => arrow.userData.shoulder).length };
    },
    testWrong() {
      const saved = { x: player.state.x, z: player.state.z, yaw: player.state.yaw, speed: player.state.speed, phase, countdown };
      phase = "race";
      countdown = 0;
      place(player, 12, 0);
      player.state.speed = 12;
      player.state.yaw = wrapAngle(player.state.yaw + Math.PI);
      wrongTime = 0;
      for (let i = 0; i < 8; i++) updateWrongWay(0.4);
      const shown = document.querySelector("#wrong-way").hidden === false;
      player.state.yaw = yawFromForward(samples[12].fx, samples[12].fz);
      wrongTime = 0;
      updateWrongWay(0.05);
      const cleared = document.querySelector("#wrong-way").hidden === true;
      phase = saved.phase;
      countdown = saved.countdown;
      player.state.x = saved.x;
      player.state.z = saved.z;
      player.state.yaw = saved.yaw;
      player.state.speed = saved.speed;
      wrongTime = 0;
      updateWrongWay(0.05);
      return { shown, cleared };
    },
    musicProbe() {
      ensureAudio();
      const prev = { phase, started: audio.started, activeId: audio.activeId };
      audio.started = true;
      audio.activeId = scoreId;
      phase = "menu";
      const menu = musicShouldPlay();
      phase = "done";
      const done = musicShouldPlay();
      phase = "race";
      const race = musicShouldPlay();
      phase = prev.phase;
      audio.started = prev.started;
      audio.activeId = prev.activeId;
      return { menu, done, race };
    },
    cam() {
      const f = carForward(player.state.yaw);
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      return {
        mode: camMode,
        fov: camera.fov,
        near: camera.near,
        y: camera.position.y,
        dot: dir.x * f.x + dir.z * f.z,
      };
    },
    robotReport() {
      return trackRobots.map((robot) => ({
        x: robot.position.x,
        z: robot.position.z,
        mode: robot.userData.mode,
        lateral: robot.userData.lateral,
        onRoad: !robot.userData.local && Math.abs(robot.userData.lateral) < ROAD_HALF,
      }));
    },
    solo() {
      for (const racer of racers) {
        if (racer === player) continue;
        racer.ai = false;
        racer.root.visible = false;
      }
    },
    goto(index, lateral = 0) {
      const i = ((index % samples.length) + samples.length) % samples.length;
      place(player, i, lateral);
      player.state.speed = 0;
      snap = true;
      syncCar(player, 0, 0, 0);
      updateCamera(1 / 60);
    },
    dropRobot() {
      const robot = trackRobots.find((item) => item.userData.crosser);
      if (!robot) return null;
      robot.userData.mode = "block";
      robot.userData.lateral = robot.userData.side * 1.15;
      robot.userData.index = robot.userData.gapIndex;
      placeRobot(robot);
      poseRobot(robot, 0.016);
      return { x: robot.position.x, z: robot.position.z, index: robot.userData.gapIndex };
    },
    look(px, py, pz, tx, ty, tz) {
      framed = { px, py, pz, tx, ty, tz };
    },
    clearFrame() { framed = null; },
    steerFeel() {
      return { applied: steerApplied, hold: steerHold, sens: steerSens, fromPad: steerFromPad };
    },
    selectScore,
    pause(on) { setPaused(on); },
    seek(seconds) {
      if (!audio || !audio.scores[scoreId]) return null;
      const el = audio.scores[scoreId][audio.index];
      if (!el) return null;
      if (Number.isFinite(seconds)) {
        try { el.currentTime = seconds; } catch { /* metadata still loading */ }
      }
      return { score: scoreId, track: audio.index, time: el.currentTime, duration: Number.isFinite(el.duration) ? el.duration : 0, paused: el.paused };
    },
    sound() {
      const tracks = audio && audio.scores ? audio.scores[audio.activeId] : null;
      const el = tracks ? tracks[audio.index] : null;
      return {
        engine: false,
        score: scoreId,
        catalog: SOUNDTRACKS.map((item) => item.id),
        muted,
        racePaused,
        track: audio ? audio.index : 0,
        started: Boolean(audio && audio.started),
        paused: el ? el.paused : true,
        time: el ? el.currentTime : 0,
        file: el ? el.currentSrc || el.src : "",
        ready: el ? el.readyState : 0,
        error: el && el.error ? el.error.code : 0,
      };
    },
    frame(mode) {
      const p = player.root.position;
      const f = carForward(player.state.yaw);
      const r = rightOf(f);
      const cabX = p.x + f.x * 1.1;
      const cabZ = p.z + f.z * 1.1;
      const aimY = mode === "front" ? 1.7 : 1.85;
      const setups = {
        side: [cabX + r.x * 8.5 + f.x * 3.5, 2.5, cabZ + r.z * 8.5 + f.z * 3.5, cabX, aimY, cabZ],
        front: [p.x + f.x * 11, 1.9, p.z + f.z * 11, cabX, 1.6, cabZ],
        rear: [p.x - f.x * 11, 2.5, p.z - f.z * 11, p.x, 1.8, p.z],
      };
      const spot = setups[mode] || setups.side;
      framed = { px: spot[0], py: spot[1], pz: spot[2], tx: spot[3], ty: spot[4], tz: spot[5] };
    },
    frameRobot() {
      const robot = trackRobots[4] || trackRobots[0];
      if (!robot) return;
      const p = robot.position;
      const f = carForward(robot.rotation.y);
      framed = { px: p.x + f.x * 3.4, py: 2.15, pz: p.z + f.z * 3.4, tx: p.x, ty: 0.75, tz: p.z };
    },
    launchState() {
      return ships.map((ship) => ({ y: ship.group.position.y, light: ship.flameLight.intensity, visible: ship.group.visible }));
    },
  };

  if (failures.length) {
    const note = document.querySelector("#fail");
    note.hidden = false;
    note.textContent = failures.join(" · ");
  }

  requestAnimationFrame(loop);
  if (new URLSearchParams(location.search).has("autostart")) startRace();
}

const params = new URLSearchParams(location.search);
if (params.has("autostart")) {
  /* started inside boot once the scene exists */
}

try {
  boot();
} catch (error) {
  const note = document.querySelector("#fail");
  if (note) {
    note.hidden = false;
    note.textContent = error.stack || error.message;
  }
  console.error(error);
}
