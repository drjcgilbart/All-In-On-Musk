import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { resolveBody, staticBoxes } from "./collide";
import {
  carForward,
  createDriveState,
  rightOf,
  stepDrive,
  yawFromForward,
  type DriveInput,
  type DriveState,
  type VehicleSpec,
} from "./drive";
import { CHECKPOINTS, COLUMNS, covered, surfaceY } from "./layout";
import { buildVehicle, vehicleById, type WheelRig } from "./vehicles";
import { buildWorld } from "./world";

export type Hud = {
  speed: number;
  battery: number;
  lap: string;
  place: string;
  status: string;
  toast: string;
  assist: string;
};

const LAPS = 2;
const EMPTY: DriveInput = {
  throttle: 0,
  brake: 0,
  steer: 0,
  boost: false,
  ludicrousToggle: false,
  autopilot: false,
  fsd: false,
};

export class RaceEngine {
  selfTestResult: string[] = [];
  readonly touch = {
    steer: 0,
    throttle: 0,
    brake: 0,
    boost: false,
    ludicrous: false,
    auto: false,
    fsd: false,
  };

  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(62, 1, 0.1, 1200);
  private rig = new THREE.Group();
  private wheels: WheelRig[] = [];
  private spot: THREE.SpotLight | null = null;
  private tail: THREE.Mesh | null = null;
  private visual: THREE.Group | null = null;
  private player: DriveState;
  private ais: { state: DriveState; spec: VehicleSpec; mesh: THREE.Group; cruise: number }[] = [];
  private keys = new Set<string>();
  private prev = { shift: false, q: false, e: false, c: false, r: false, m: false, padL: false, padA: false, padF: false };
  private clock = new THREE.Clock();
  private acc = 0;
  private spin = 0;
  private lastSteer = 0;
  private camDist = 11;
  private camPos = new THREE.Vector3();
  private snap = true;
  private muted = false;
  private elapsed = 0;
  private raceTime = 0;
  private weather: "clear" | "rain" | "haze" = "clear";
  private weatherAt = 40;
  private launchAt = 28;
  private launching = 0;
  private launchedPulse = false;
  private toast = "";
  private toastUntil = 0;
  private finishedSent = false;
  private raf = 0;
  private world: ReturnType<typeof buildWorld>;
  private whine = new Whine();
  private onKeyDown: (e: KeyboardEvent) => void;
  private onKeyUp: (e: KeyboardEvent) => void;
  private onResize: () => void;
  private disposed = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private minimap: HTMLCanvasElement,
    private spec: VehicleSpec,
    private mode: "race" | "roam",
    private reducedMotion: boolean,
    coarse: boolean,
    selfTest: boolean,
    private onHud: (hud: Hud) => void,
    private onFinish: (seconds: number) => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !coarse, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.6));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = !coarse;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.world = buildWorld(this.scene);
    if (coarse) this.world.day.sun.castShadow = false;

    const spawn = this.spawnPose(0);
    this.player = createDriveState(spawn.x, spawn.z, spawn.yaw);
    const car = buildVehicle(spec);
    this.rig.add(car);
    this.scene.add(this.rig);
    this.wheels = car.userData.wheels as WheelRig[];
    this.spot = car.userData.spot as THREE.SpotLight;
    this.tail = (car.userData.tail as THREE.Mesh) ?? null;
    this.visual = car.userData.visual as THREE.Group;
    this.placeRig(this.player, this.rig);
    this.snapCamera();

    if (mode === "race") {
      const rivals = [
        { id: "models", cruise: 0.8 },
        { id: "model3", cruise: 0.86 },
        { id: "cybertruck", cruise: 0.78 },
        { id: "roadster", cruise: 0.9 },
      ];
      const fwd = carForward(spawn.yaw);
      const right = rightOf(fwd);
      rivals.forEach((rival, index) => {
        const rivalSpec = vehicleById(rival.id);
        const mesh = buildVehicle(rivalSpec);
        this.scene.add(mesh);
        const back = 8 + index * 7;
        const side = (index - 1.5) * 4.2;
        const state = createDriveState(
          spawn.x - fwd.x * back + right.x * side,
          spawn.z - fwd.z * back + right.z * side,
          spawn.yaw,
        );
        this.placeRig(state, mesh);
        this.ais.push({ state, spec: rivalSpec, mesh, cruise: rival.cruise });
      });
    }

    this.onKeyDown = (event) => {
      this.keys.add(event.code);
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
      this.whine.ensure();
    };
    this.onKeyUp = (event) => this.keys.delete(event.code);
    this.onResize = () => this.fit();
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("resize", this.onResize);
    this.fit();

    if (selfTest) this.selfTestResult = this.runSelfTest();
  }

  showColliders() {
    const mat = new THREE.MeshBasicMaterial({ color: 0x3de8ff, wireframe: true });
    for (const box of staticBoxes()) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(box.w, box.h, box.d), mat);
      mesh.position.set(box.x, box.base + box.h / 2, box.z);
      this.scene.add(mesh);
    }
    for (const column of COLUMNS) {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(column.r, column.r, column.h, 12), mat);
      mesh.position.set(column.x, column.base + column.h / 2, column.z);
      this.scene.add(mesh);
    }
  }

  preview(kind: "tunnel" | "pad" | "launch") {
    if (kind === "tunnel") {
      this.player.x = 190;
      this.player.z = 36;
      this.player.yaw = yawFromForward(1, 0);
    } else {
      this.player.x = -20;
      this.player.z = -170;
      this.player.yaw = yawFromForward(0, -1);
      if (kind === "launch") this.launching = 8;
    }
    this.player.speed = 0;
    this.snap = true;
  }

  start() {
    this.clock.start();
    const frame = () => {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(frame);
      const dt = Math.min(this.clock.getDelta(), 0.05);
      this.acc += dt;
      this.elapsed += dt;
      if (!this.player.finished) this.raceTime += dt;
      let steps = 0;
      while (this.acc >= 1 / 60 && steps < 4) {
        this.tick(1 / 60);
        this.acc -= 1 / 60;
        steps += 1;
      }
      this.renderWorld(dt);
      this.drawMap();
      this.emitHud();
    };
    this.raf = requestAnimationFrame(frame);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("resize", this.onResize);
    this.whine.stop();
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material;
      if (!material) return;
      const list = Array.isArray(material) ? material : [material];
      for (const item of list) item.dispose();
    });
    this.scene.environment?.dispose();
    this.renderer.dispose();
  }

  private tick(dt: number) {
    this.advanceWorld(dt);
    const input = this.readInput();
    const aim = this.aimFor(this.player);
    const grip = this.weather === "rain" ? 0.78 : this.weather === "haze" ? 0.92 : 1;
    if (!this.player.finished) {
      stepDrive(this.player, input, this.spec, dt, aim, grip, surfaceY, resolveBody, CHECKPOINTS, this.mode === "race" ? LAPS : 99);
    }
    this.lastSteer = input.steer;
    this.pushRivals(dt, grip);
    if (this.player.finished && !this.finishedSent && this.mode === "race") {
      this.finishedSent = true;
      this.onFinish(this.raceTime);
    }
  }

  private pushRivals(dt: number, grip: number) {
    for (const ai of this.ais) {
      const aim = this.aimFor(ai.state);
      const desired = aim ? yawFromForward(aim.x - ai.state.x, aim.z - ai.state.z) : ai.state.yaw;
      const diff = desired - ai.state.yaw;
      const wrapped = Math.atan2(Math.sin(diff), Math.cos(diff));
      const steer = Math.max(-1, Math.min(1, -wrapped * 2.2));
      const target = ai.spec.top * ai.cruise;
      stepDrive(
        ai.state,
        {
          ...EMPTY,
          throttle: ai.state.speed < target ? 1 : 0.2,
          brake: ai.state.speed > target * 1.05 ? 0.5 : 0,
          steer,
        },
        ai.spec,
        dt,
        null,
        grip,
        surfaceY,
        resolveBody,
        CHECKPOINTS,
        99,
      );
      this.separate(this.player, this.spec, ai.state, ai.spec);
    }
  }

  private separate(a: DriveState, aSpec: VehicleSpec, b: DriveState, bSpec: VehicleSpec) {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    const dist = Math.hypot(dx, dz) || 0.0001;
    const min = 2.6;
    if (dist >= min) return;
    const push = (min - dist) / dist;
    const aShare = bSpec.mass / (aSpec.mass + bSpec.mass);
    a.x += dx * push * aShare;
    a.z += dz * push * aShare;
    b.x -= dx * push * (1 - aShare);
    b.z -= dz * push * (1 - aShare);
    if (aSpec.mass < 10) a.speed *= 0.92;
  }

  private renderWorld(dt: number) {
    this.placeRig(this.player, this.rig);
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.rig.quaternion);
    fwd.y = 0;
    if (fwd.lengthSq() > 0) fwd.normalize();
    const ahead = surfaceY(this.player.x + fwd.x * 3, this.player.z + fwd.z * 3);
    const behind = surfaceY(this.player.x - fwd.x * 3, this.player.z - fwd.z * 3);
    if (this.visual) this.visual.rotation.x = ((ahead - behind) / 6) * 0.9;
    this.spin += (this.player.speed / 0.36) * dt;
    for (const wheel of this.wheels) {
      wheel.spin.rotation.x = this.spin;
      if (wheel.front) wheel.steer.rotation.y = -this.lastSteer * 0.42;
    }
    const tailMat = this.tail?.material;
    if (tailMat && "emissiveIntensity" in tailMat) {
      tailMat.emissiveIntensity = this.keys.has("KeyS") || this.keys.has("ArrowDown") || this.touch.brake > 0.2 ? 3 : 0.4;
    }
    for (const ai of this.ais) this.placeRig(ai.state, ai.mesh);

    const day = this.daylight();
    const { fog, hemi, sun } = this.world.day;
    const night = 1 - day;
    hemi.intensity = 0.25 + day * 0.7;
    sun.intensity = 0.18 + day * 1.25;
    sun.color.set(day > 0.5 ? "#ffe0b8" : "#9eb4d8");
    fog.color.set(day > 0.55 ? "#9ec7ea" : "#07091a");
    fog.density = this.weather === "haze" ? 0.008 : this.weather === "rain" ? 0.005 : 0.0034;
    if (this.scene.background instanceof THREE.Color) this.scene.background.copy(fog.color);
    this.world.sky.uniforms.top.value.set(day > 0.55 ? "#6eb6ef" : "#07091a");
    this.world.sky.uniforms.bottom.value.set(day > 0.55 ? "#d7e8f6" : "#241433");
    this.world.stars.visible = night > 0.45;
    for (const mat of this.world.neons) mat.emissiveIntensity = 0.25 + night * 1.5;
    if (this.spot) this.spot.intensity = night * 22;

    const flameMat = this.world.flame.material as THREE.MeshStandardMaterial;
    const burn = Math.max(0, this.launching);
    if (burn > 0) {
      this.world.sky.uniforms.top.value.set("#4a160c");
      this.world.sky.uniforms.bottom.value.set("#ff6a1a");
    }
    flameMat.opacity = burn > 0 ? 0.85 : 0;
    flameMat.emissiveIntensity = burn * 4;
    this.world.flame.scale.set(1, 0.4 + burn * 1.4, 1);
    this.world.launchLight.intensity = burn * 80;

    const rainMat = this.world.rain.material as THREE.PointsMaterial;
    rainMat.opacity = this.weather === "rain" ? 0.7 : 0;
    if (this.weather === "rain") {
      const pos = this.world.rain.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - dt * 28;
        if (y < 0) y = 24;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
      this.world.rain.position.set(this.player.x, surfaceY(this.player.x, this.player.z), this.player.z);
    }

    this.world.gates.forEach((gate, index) => {
      const mat = gate.material as THREE.MeshStandardMaterial;
      const next = (this.player.cp + 1) % CHECKPOINTS.length;
      mat.emissiveIntensity = index === next ? 2.4 : 0.2;
    });

    this.updateCamera(fwd, night);
    this.whine.update(this.player.speed, this.lastThrottle(), this.player.ludicrous, this.muted);
    this.renderer.render(this.scene, this.camera);
  }

  private updateCamera(fwd: THREE.Vector3, night: number) {
    let dist = this.camDist;
    const y = this.rig.position.y;
    if (covered(this.player.x, this.player.z)) dist = Math.min(dist, 6.2);
    const desired = this.rig.position.clone().addScaledVector(fwd, -dist);
    desired.y = y + 2.5 + this.spec.ride;
    if (covered(this.player.x, this.player.z)) {
      desired.y = Math.min(desired.y, y + 4.8);
      desired.z = Math.max(22.8, Math.min(49.2, desired.z));
    }
    if (this.snap) {
      this.camPos.copy(desired);
      this.snap = false;
    } else {
      this.camPos.lerp(desired, 0.12);
    }
    const shake =
      !this.reducedMotion && this.launching > 0
        ? Math.min(0.35, 40 / (Math.hypot(this.player.x + 20, this.player.z + 255) + 8))
        : 0;
    this.camera.position.copy(this.camPos);
    if (shake) {
      this.camera.position.x += (Math.random() - 0.5) * shake;
      this.camera.position.y += (Math.random() - 0.5) * shake;
    }
    const look = this.rig.position.clone().addScaledVector(fwd, 8);
    look.y += 1.05;
    this.camera.lookAt(look);
    this.camera.fov = 62 + night * 2 + (this.player.ludicrous ? 6 : 0);
    this.camera.updateProjectionMatrix();
  }

  private advanceWorld(dt: number) {
    if (this.elapsed > this.weatherAt) {
      this.weather = this.weather === "clear" ? "rain" : this.weather === "rain" ? "haze" : "clear";
      this.weatherAt = this.elapsed + 55;
      this.say(this.weather === "clear" ? "Sky clear" : this.weather === "rain" ? "Rain on the line" : "Haze rolling in");
    }
    if (this.elapsed > this.launchAt && this.launching <= 0) {
      this.launching = 8;
      this.launchAt = this.elapsed + 78;
      this.launchedPulse = false;
      this.say("Starship launch");
    }
    if (this.launching > 0) {
      this.launching -= dt;
      if (!this.launchedPulse) {
        this.launchedPulse = true;
        const dx = this.player.x + 20;
        const dz = this.player.z + 255;
        const dist = Math.hypot(dx, dz);
        if (dist < 90 && dist > 1 && !this.reducedMotion) {
          this.player.x += (dx / dist) * 6;
          this.player.z += (dz / dist) * 6;
        }
      }
    }
  }

  private readInput(): DriveInput {
    const pad = navigator.getGamepads?.()[0] ?? null;
    let throttle = this.touch.throttle;
    let brake = this.touch.brake;
    let steer = this.touch.steer;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) throttle = 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) brake = 1;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) steer -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) steer += 1;
    if (pad) {
      steer = Math.abs(pad.axes[0]) > 0.15 ? pad.axes[0] : steer;
      const rt = pad.buttons[7]?.value ?? 0;
      const lt = pad.buttons[6]?.value ?? 0;
      if (rt > 0.05) throttle = rt;
      if (lt > 0.05) brake = lt;
    }
    const shift = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight");
    const q = this.keys.has("KeyQ");
    const e = this.keys.has("KeyE");
    const c = this.keys.has("KeyC");
    const r = this.keys.has("KeyR");
    const m = this.keys.has("KeyM");
    const padL = Boolean(pad?.buttons[3]?.pressed);
    const padA = Boolean(pad?.buttons[2]?.pressed);
    const padF = Boolean(pad?.buttons[1]?.pressed);
    const ludicrousToggle = (shift && !this.prev.shift) || (padL && !this.prev.padL) || this.touch.ludicrous;
    const autopilot = (q && !this.prev.q) || (padA && !this.prev.padA) || this.touch.auto;
    const fsd = (e && !this.prev.e) || (padF && !this.prev.padF) || this.touch.fsd;
    if (c && !this.prev.c) this.camDist = this.camDist === 8 ? 11 : this.camDist === 11 ? 15 : 8;
    if (r && !this.prev.r) this.resetCar();
    if (m && !this.prev.m) this.muted = !this.muted;
    this.prev = { shift, q, e, c, r, m, padL, padA, padF };
    this.touch.ludicrous = false;
    this.touch.auto = false;
    this.touch.fsd = false;
    const boost = this.keys.has("Space") || this.touch.boost || Boolean(pad?.buttons[0]?.pressed);
    return {
      throttle,
      brake,
      steer: Math.max(-1, Math.min(1, steer)),
      boost,
      ludicrousToggle,
      autopilot,
      fsd,
    };
  }

  private resetCar() {
    const pose = this.spawnPose(this.player.cp);
    this.player.x = pose.x;
    this.player.z = pose.z;
    this.player.yaw = pose.yaw;
    this.player.speed = 0;
    this.snap = true;
  }

  private spawnPose(index: number) {
    const here = CHECKPOINTS[index];
    const next = CHECKPOINTS[(index + 1) % CHECKPOINTS.length];
    return { x: here.x, z: here.z, yaw: yawFromForward(next.x - here.x, next.z - here.z) };
  }

  private aimFor(state: DriveState) {
    const next = CHECKPOINTS[(state.cp + 1) % CHECKPOINTS.length];
    return { x: next.x, z: next.z };
  }

  private placeRig(state: DriveState, rig: THREE.Object3D) {
    rig.position.set(state.x, surfaceY(state.x, state.z) + 0.02, state.z);
    rig.rotation.set(0, state.yaw, 0);
    rig.updateMatrixWorld(true);
  }

  private snapCamera() {
    this.placeRig(this.player, this.rig);
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.rig.quaternion);
    fwd.y = 0;
    fwd.normalize();
    this.snap = true;
    this.updateCamera(fwd, 1);
    this.snap = true;
  }

  private daylight() {
    const wave = Math.sin(this.elapsed / 48 - 0.8);
    return Math.max(0, Math.min(1, wave * 0.5 + 0.5));
  }

  private lastThrottle() {
    return this.keys.has("KeyW") || this.keys.has("ArrowUp") || this.touch.throttle > 0 ? 1 : 0;
  }

  private say(text: string) {
    this.toast = text;
    this.toastUntil = this.elapsed + 3.2;
  }

  private emitHud() {
    const speed = Math.abs(this.player.speed) * 3.6;
    const rivalsAhead = this.ais.filter((ai) => this.progress(ai.state) > this.progress(this.player)).length;
    const place = this.mode === "race" ? `${rivalsAhead + 1} / ${this.ais.length + 1}` : "Roam";
    let status = "Drive";
    if (this.player.ludicrous) status = "Ludicrous";
    else if (this.player.battery <= 0) status = "Limp";
    const assist =
      this.player.assistMode === "fsd"
        ? `Full Self-Driving ${this.player.assist.toFixed(1)}s`
        : this.player.assistMode === "auto"
          ? `Autopilot ${this.player.assist.toFixed(1)}s`
          : "";
    this.onHud({
      speed,
      battery: this.player.battery,
      lap: this.mode === "race" ? `${Math.min(this.player.lap, LAPS)} / ${LAPS}` : "Open",
      place,
      status,
      toast: this.elapsed < this.toastUntil ? this.toast : "",
      assist,
    });
  }

  private progress(state: DriveState) {
    const next = CHECKPOINTS[(state.cp + 1) % CHECKPOINTS.length];
    const here = CHECKPOINTS[state.cp];
    const span = Math.hypot(next.x - here.x, next.z - here.z) || 1;
    const left = Math.hypot(next.x - state.x, next.z - state.z);
    return state.lap * CHECKPOINTS.length + state.cp + (1 - Math.min(left / span, 1));
  }

  private drawMap() {
    const ctx = this.minimap.getContext("2d");
    if (!ctx) return;
    const w = this.minimap.width;
    const h = this.minimap.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(8, 10, 16, 0.72)";
    ctx.fillRect(0, 0, w, h);
    const project = (x: number, z: number) => ({
      x: ((x + 480) / 960) * w,
      y: ((z + 480) / 960) * h,
    });
    ctx.strokeStyle = "rgba(61, 232, 255, 0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    CHECKPOINTS.forEach((gate, index) => {
      const p = project(gate.x, gate.z);
      if (index === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    const first = project(CHECKPOINTS[0].x, CHECKPOINTS[0].z);
    ctx.lineTo(first.x, first.y);
    ctx.stroke();
    for (const ai of this.ais) {
      const p = project(ai.state.x, ai.state.z);
      ctx.fillStyle = "#8d97a8";
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    const p = project(this.player.x, this.player.z);
    const f = carForward(this.player.yaw);
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + f.x * 12, p.y + f.z * 12);
    ctx.stroke();
  }

  private fit() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(height, 1);
    this.camera.updateProjectionMatrix();
  }

  private runSelfTest() {
    const failures: string[] = [];
    const spec = vehicleById("model3");
    const blank = { ...EMPTY };
    const straight = createDriveState(0, 0, 0);
    const z0 = straight.z;
    for (let i = 0; i < 50; i++) {
      stepDrive(straight, { ...blank, throttle: 1 }, spec, 1 / 60, null, 1, surfaceY, resolveBody, CHECKPOINTS, 9);
    }
    if (!(straight.z < z0 - 1)) failures.push(`forward z delta ${straight.z - z0}`);
    const travel = { x: straight.x, z: straight.z - z0 };
    const fwd = carForward(straight.yaw);
    const len = Math.hypot(travel.x, travel.z) || 1;
    const align = (fwd.x * travel.x + fwd.z * travel.z) / len;
    if (align < 0.9) failures.push(`facing alignment ${align.toFixed(2)}`);

    const turned = createDriveState(0, 0, 0);
    for (let i = 0; i < 70; i++) {
      stepDrive(turned, { ...blank, throttle: 1, steer: 1 }, spec, 1 / 60, null, 1, surfaceY, resolveBody, CHECKPOINTS, 9);
    }
    if (!(turned.yaw < -0.2)) failures.push(`right yaw ${turned.yaw.toFixed(2)}`);
    if (!(turned.x > 0.3)) failures.push(`right x ${turned.x.toFixed(2)}`);

    this.snapCamera();
    const nose = new THREE.Vector3(0, 0, -1).applyQuaternion(this.rig.quaternion);
    nose.y = 0;
    nose.normalize();
    const relX = this.camera.position.x - this.rig.position.x;
    const relZ = this.camera.position.z - this.rig.position.z;
    const behind = relX * nose.x + relZ * nose.z;
    if (!(behind < -1)) failures.push(`camera behind ${behind.toFixed(2)}`);
    return failures;
  }
}

class Whine {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;

  ensure() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    this.osc = this.ctx.createOscillator();
    this.osc.type = "sawtooth";
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0;
    this.osc.connect(filter);
    filter.connect(this.gain);
    this.gain.connect(this.ctx.destination);
    this.osc.start();
    void this.ctx.resume();
  }

  update(speed: number, throttle: number, ludicrous: boolean, muted: boolean) {
    if (!this.ctx || !this.osc || !this.gain) return;
    const freq = 48 + Math.abs(speed) * 2.4 + (ludicrous ? 36 : 0);
    this.osc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.06);
    const vol = muted ? 0 : 0.012 + throttle * 0.035;
    this.gain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
  }

  stop() {
    this.osc?.stop();
    void this.ctx?.close();
  }
}
