/** Car heading is Three.js local −z. rotation.y > 0 is counter-clockwise from above. */

export function wrapAngle(a: number) {
  let x = a;
  while (x > Math.PI) x -= Math.PI * 2;
  while (x < -Math.PI) x += Math.PI * 2;
  return x;
}

/** World forward for a rig whose rotation.y is `yaw` and whose nose is local −z. */
export function carForward(yaw: number) {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return { x: -s, z: -c };
}

/** yaw such that carForward(yaw) matches the unit direction (x, z). */
export function yawFromForward(x: number, z: number) {
  return Math.atan2(-x, -z);
}

/** Right vector. forward (0, −1) → (1, 0). */
export function rightOf(fwd: { x: number; z: number }) {
  return { x: -fwd.z, z: fwd.x };
}

export type Sphere = { oz: number; r: number };

export type VehicleSpec = {
  id: string;
  name: string;
  blurb: string;
  accel: number;
  brake: number;
  top: number;
  grip: number;
  steer: number;
  mass: number;
  ride: number;
  width: number;
  length: number;
  height: number;
  color: number;
  spheres: Sphere[];
};

export type DriveInput = {
  throttle: number;
  brake: number;
  steer: number;
  boost: boolean;
  ludicrousToggle: boolean;
  autopilot: boolean;
  fsd: boolean;
};

export type DriveState = {
  x: number;
  z: number;
  yaw: number;
  speed: number;
  battery: number;
  cp: number;
  lap: number;
  leftStart: boolean;
  ludicrous: boolean;
  assist: number;
  assistMode: "none" | "auto" | "fsd";
  finished: boolean;
  hit: boolean;
};

export function createDriveState(x: number, z: number, yaw: number): DriveState {
  return {
    x,
    z,
    yaw,
    speed: 0,
    battery: 100,
    cp: 0,
    lap: 1,
    leftStart: false,
    ludicrous: false,
    assist: 0,
    assistMode: "none",
    finished: false,
    hit: false,
  };
}

export function stepDrive(
  state: DriveState,
  input: DriveInput,
  spec: VehicleSpec,
  dt: number,
  aim: { x: number; z: number } | null,
  gripMul: number,
  surfaceY: (x: number, z: number) => number,
  resolve: (
    x: number,
    z: number,
    yaw: number,
    spheres: Sphere[],
    y: number,
  ) => { x: number; z: number; hit: boolean },
  checkpoints: { x: number; z: number }[],
  lapsToWin: number,
) {
  const battery = state.battery;
  if (input.ludicrousToggle && battery > 12) state.ludicrous = !state.ludicrous;
  if (state.ludicrous && battery <= 4) state.ludicrous = false;

  if (input.autopilot && battery > 10 && state.assistMode !== "auto") {
    state.assistMode = "auto";
    state.assist = 6;
    state.battery = Math.max(0, state.battery - 8);
  }
  if (input.fsd && battery > 16 && state.assistMode !== "fsd") {
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
  const limit = spec.top * lud * boostMul;
  const accel = spec.accel * (state.ludicrous ? 1.45 : 1) * (boost ? 1.2 : 1) * limp;

  if (throttle > 0 && state.speed < limit) {
    const fade = 1 - Math.max(0, state.speed) / (limit * 1.08);
    state.speed += accel * throttle * Math.max(0.15, fade) * dt;
  }
  if (brake > 0) state.speed -= spec.brake * brake * dt;
  if (throttle === 0 && brake === 0) state.speed -= Math.sign(state.speed) * 1.6 * dt;
  if (state.speed > limit) state.speed = limit;
  if (state.speed < -7) state.speed = -7;
  if (Math.abs(state.speed) < 0.15 && throttle === 0 && brake === 0) state.speed = 0;

  const rate =
    spec.steer *
    spec.grip *
    gripMul *
    (0.5 + 0.5 * Math.min(Math.abs(state.speed) / 16, 1));
  state.yaw = wrapAngle(state.yaw - steer * rate * dt);

  const fwd = carForward(state.yaw);
  state.x += fwd.x * state.speed * dt;
  state.z += fwd.z * state.speed * dt;

  const y = surfaceY(state.x, state.z) + spec.ride;
  const solved = resolve(state.x, state.z, state.yaw, spec.spheres, y);
  state.x = solved.x;
  state.z = solved.z;
  state.hit = solved.hit;
  if (solved.hit) {
    const keep = spec.mass >= 10 ? 0.96 : 0.62;
    state.speed *= keep;
  }

  let drain = throttle * 2.1;
  if (boost) drain += 6;
  if (state.ludicrous) drain += 7;
  let regen = 0;
  if (throttle < 0.18 && brake < 0.12) regen += 4.5 + Math.min(Math.abs(state.speed) * 0.03, 3);
  if (brake > 0.2 && state.speed > 4) regen += brake * 6;
  state.battery = clamp(state.battery - drain * dt + regen * dt, 0, 100);

  const next = (state.cp + 1) % checkpoints.length;
  const gate = checkpoints[next];
  const dx = state.x - gate.x;
  const dz = state.z - gate.z;
  if (!state.leftStart && state.cp === 0) {
    const sdx = state.x - checkpoints[0].x;
    const sdz = state.z - checkpoints[0].z;
    if (sdx * sdx + sdz * sdz > 24 * 24) state.leftStart = true;
  }
  if (dx * dx + dz * dz < 16 * 16) {
    if (!(next === 0 && !state.leftStart)) {
      state.cp = next;
      if (next === 0) {
        state.lap += 1;
        if (state.lap > lapsToWin) state.finished = true;
      }
    }
  }
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
