import * as THREE from "three";
import {
  BUILDINGS,
  CHECKPOINTS,
  COLUMNS,
  RAMP_IN,
  RAMP_OUT,
  SHAFT,
  poles,
  surfaceY,
  tunnelWalls,
} from "./layout";

export type WorldView = {
  sky: THREE.ShaderMaterial;
  flame: THREE.Mesh;
  launchLight: THREE.PointLight;
  rain: THREE.Points;
  gates: THREE.Mesh[];
  neons: THREE.MeshStandardMaterial[];
  stars: THREE.Points;
  day: { fog: THREE.FogExp2; hemi: THREE.HemisphereLight; sun: THREE.DirectionalLight };
};

export function buildWorld(scene: THREE.Scene): WorldView {
  const neons: THREE.MeshStandardMaterial[] = [];
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1400, 1400),
    new THREE.MeshStandardMaterial({ color: 0x10141c, roughness: 0.95, metalness: 0.04 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(1400, 70, 0x1c2433, 0x161b26);
  grid.position.y = 0.02;
  scene.add(grid);

  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x232a38,
    roughness: 0.8,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  const edgeMat = new THREE.MeshStandardMaterial({
    color: 0x12343c,
    emissive: 0x1ad4e6,
    emissiveIntensity: 0.7,
    roughness: 0.45,
    side: THREE.DoubleSide,
  });
  neons.push(edgeMat);
  for (let i = 0; i < CHECKPOINTS.length; i++) {
    const a = CHECKPOINTS[i];
    const b = CHECKPOINTS[(i + 1) % CHECKPOINTS.length];
    scene.add(ribbon(a.x, a.z, b.x, b.z, 16, 0.05, roadMat, surfaceY));
    scene.add(ribbon(a.x, a.z, b.x, b.z, 16.8, 0.06, edgeMat, surfaceY));
  }

  const windows = windowTexture();
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x1a2030,
    roughness: 0.7,
    metalness: 0.25,
    map: windows,
  });
  for (const b of BUILDINGS) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), wallMat);
    mesh.position.set(b.x, b.base + b.h / 2, b.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    scene.add(beacon(b.x, b.h + 0.4, b.z, neons));
  }

  for (const column of COLUMNS) {
    if (column.id.startsWith("starship")) scene.add(starship(column.x, column.z));
    else scene.add(dome(column.x, column.z, column.r));
  }

  const concrete = new THREE.MeshStandardMaterial({ color: 0x2a303c, roughness: 0.9, side: THREE.DoubleSide });
  scene.add(slant(RAMP_IN, concrete));
  scene.add(slant(RAMP_OUT, concrete));
  const shaftFloor = new THREE.Mesh(new THREE.BoxGeometry(SHAFT.x1 - SHAFT.x0, 0.4, SHAFT.z1 - SHAFT.z0), concrete);
  shaftFloor.position.set((SHAFT.x0 + SHAFT.x1) / 2, SHAFT.y - 0.2, (SHAFT.z0 + SHAFT.z1) / 2);
  scene.add(shaftFloor);
  const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x12161e, roughness: 0.8 });
  const ceiling = new THREE.Mesh(
    new THREE.BoxGeometry(SHAFT.x1 - SHAFT.x0, 0.5, SHAFT.z1 - SHAFT.z0),
    ceilingMat,
  );
  ceiling.position.set((SHAFT.x0 + SHAFT.x1) / 2, SHAFT.y + 8, (SHAFT.z0 + SHAFT.z1) / 2);
  scene.add(ceiling);

  const tunnelMat = new THREE.MeshStandardMaterial({ color: 0x3a4254, roughness: 0.75 });
  for (const wall of tunnelWalls()) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(wall.w, wall.h, wall.d), tunnelMat);
    mesh.position.set(wall.x, wall.base + wall.h / 2, wall.z);
    scene.add(mesh);
  }
  const strip = new THREE.MeshStandardMaterial({
    color: 0x06241f,
    emissive: 0x19f0c8,
    emissiveIntensity: 0.8,
  });
  neons.push(strip);
  const guide = new THREE.Mesh(new THREE.BoxGeometry(SHAFT.x1 - SHAFT.x0, 0.08, 0.2), strip);
  guide.position.set((SHAFT.x0 + SHAFT.x1) / 2, SHAFT.y + 0.1, (SHAFT.z0 + SHAFT.z1) / 2);
  scene.add(guide);

  const poleMat = new THREE.MeshStandardMaterial({ color: 0x222833, metalness: 0.6, roughness: 0.4 });
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xd7fbff,
    emissive: 0x9ff6ff,
    emissiveIntensity: 1.4,
  });
  neons.push(bulbMat);
  for (const pole of poles()) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, pole.h, 6), poleMat);
    post.position.set(pole.x, pole.h / 2, pole.z);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), bulbMat);
    bulb.position.set(pole.x, pole.h + 0.2, pole.z);
    scene.add(post, bulb);
  }

  const gates: THREE.Mesh[] = [];
  const gateMat = new THREE.MeshStandardMaterial({
    color: 0x9eefff,
    emissive: 0x37e7ff,
    emissiveIntensity: 0.35,
  });
  CHECKPOINTS.forEach((gate) => {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(14, 0.2, 0.2), gateMat.clone());
    beam.position.set(gate.x, gate.y + 3.2, gate.z);
    scene.add(beam);
    gates.push(beam);
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.2, 0.25), gateMat);
      post.position.set(gate.x + side * 6.5, gate.y + 1.6, gate.z);
      scene.add(post);
    }
  });

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffb15a,
    emissive: 0xff6a1a,
    emissiveIntensity: 0,
    transparent: true,
    opacity: 0,
  });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(9, 40, 16), flameMat);
  flame.position.set(-20, 24, -240);
  scene.add(flame);
  const launchLight = new THREE.PointLight(0xff7a3c, 0, 180, 1.4);
  launchLight.position.set(-20, 20, -255);
  scene.add(launchLight);

  const rainGeo = new THREE.BufferGeometry();
  const count = 500;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 80;
    positions[i * 3 + 1] = Math.random() * 30;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
  }
  rainGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const rain = new THREE.Points(
    rainGeo,
    new THREE.PointsMaterial({ color: 0xb7d4e8, size: 0.12, transparent: true, opacity: 0 }),
  );
  scene.add(rain);

  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(400 * 3);
  for (let i = 0; i < 400; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.45;
    const r = 700;
    starPos[i * 3] = Math.cos(theta) * Math.sin(phi) * r;
    starPos[i * 3 + 1] = Math.cos(phi) * r;
    starPos[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * r;
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, sizeAttenuation: false }),
  );
  scene.add(stars);

  const sky = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      top: { value: new THREE.Color("#07091a") },
      bottom: { value: new THREE.Color("#1a1030") },
    },
    vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader:
      "varying vec3 vP; uniform vec3 top; uniform vec3 bottom; void main(){ float h = normalize(vP).y * 0.5 + 0.5; gl_FragColor = vec4(mix(bottom, top, smoothstep(0.0, 0.85, h)), 1.0); }",
  });
  const skyMesh = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 16), sky);
  scene.add(skyMesh);

  const hemi = new THREE.HemisphereLight(0x8aa0c8, 0x12141c, 0.45);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xc5d4ef, 0.35);
  sun.position.set(80, 120, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 280;
  sun.shadow.camera.left = -80;
  sun.shadow.camera.right = 80;
  sun.shadow.camera.top = 80;
  sun.shadow.camera.bottom = -80;
  scene.add(sun);

  const fog = new THREE.FogExp2(0x07091a, 0.0036);
  scene.fog = fog;
  scene.background = new THREE.Color(0x07091a);

  sign(scene, -20, 8, -210, "LAUNCH");
  sign(scene, 250, 8, 250, "NEURALINK");
  sign(scene, 48, 6, 8, "TUNNEL");

  return { sky, flame, launchLight, rain, gates, neons, stars, day: { fog, hemi, sun } };
}

function ribbon(
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  width: number,
  yLift: number,
  material: THREE.Material,
  heightAt: (x: number, z: number) => number,
) {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const len = Math.hypot(dx, dz) || 1;
  const rx = (-dz / len) * (width / 2);
  const rz = (dx / len) * (width / 2);
  const steps = Math.max(1, Math.ceil(len / 12));
  const positions = new Float32Array(steps * 18);
  for (let step = 0; step < steps; step++) {
    const t0 = step / steps;
    const t1 = (step + 1) / steps;
    const sx0 = x0 + dx * t0;
    const sz0 = z0 + dz * t0;
    const sx1 = x0 + dx * t1;
    const sz1 = z0 + dz * t1;
    const yStart = heightAt(sx0, sz0) + yLift;
    const yEnd = heightAt(sx1, sz1) + yLift;
    const o = step * 18;
    positions.set(
      [
        sx0 + rx, yStart, sz0 + rz,
        sx0 - rx, yStart, sz0 - rz,
        sx1 - rx, yEnd, sz1 - rz,
        sx0 + rx, yStart, sz0 + rz,
        sx1 - rx, yEnd, sz1 - rz,
        sx1 + rx, yEnd, sz1 + rz,
      ],
      o,
    );
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  const normal = new THREE.Vector3().fromBufferAttribute(geo.getAttribute("normal") as THREE.BufferAttribute, 0);
  if (normal.y < 0) geo.index = null;
  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true;
  return mesh;
}

function slant(span: { x0: number; x1: number; z0: number; z1: number; y0: number; y1: number }, material: THREE.Material) {
  const positions = new Float32Array([
    span.x0, span.y0 + 0.08, span.z0,
    span.x1, span.y1 + 0.08, span.z0,
    span.x1, span.y1 + 0.08, span.z1,
    span.x0, span.y0 + 0.08, span.z0,
    span.x1, span.y1 + 0.08, span.z1,
    span.x0, span.y0 + 0.08, span.z1,
  ]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, material);
}

function beacon(x: number, y: number, z: number, neons: THREE.MeshStandardMaterial[]) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffe8ea,
    emissive: 0xe10600,
    emissiveIntensity: 1.6,
  });
  neons.push(mat);
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.2, 0.35), mat);
  stem.position.y = 1.1;
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.28, 0.28), mat);
  bar.position.y = 2.05;
  g.add(stem, bar);
  g.position.set(x, y, z);
  return g;
}

function starship(x: number, z: number) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const steel = new THREE.MeshStandardMaterial({ color: 0xd5dbe3, metalness: 0.75, roughness: 0.32 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 6.1, 56, 20), steel);
  body.position.y = 30;
  body.castShadow = true;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(5.4, 14, 20), steel);
  nose.position.y = 65;
  g.add(body, nose);
  for (const angle of [0, 2.2, 4.2]) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7, 3.2), steel);
    fin.position.set(Math.cos(angle) * 7.6, 8, Math.sin(angle) * 7.6);
    // local +z (the long axis) must point along the radius (cos θ, 0, sin θ)
    fin.rotation.y = Math.PI / 2 - angle;
    g.add(fin);
  }
  return g;
}

function dome(x: number, z: number, r: number) {
  const g = new THREE.Group();
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 1.05, r * 1.15, 3, 24),
    new THREE.MeshStandardMaterial({ color: 0x242a36, roughness: 0.7 }),
  );
  plinth.position.y = 1.5;
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(r, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({
      color: 0x8fd0ff,
      emissive: 0x1a6cff,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.55,
      roughness: 0.1,
      metalness: 0.2,
    }),
  );
  shell.position.y = 3;
  g.add(plinth, shell);
  g.position.set(x, 0, z);
  return g;
}

function windowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#161b27";
  ctx.fillRect(0, 0, 64, 128);
  for (let y = 8; y < 120; y += 16) {
    for (let x = 6; x < 58; x += 14) {
      ctx.fillStyle = Math.random() > 0.28 ? "#d5e6ff" : "#0c1018";
      ctx.fillRect(x, y, 8, 9);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 2);
  return texture;
}

function sign(scene: THREE.Scene, x: number, y: number, z: number, text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#07080d";
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = "#3ef0ff";
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 496, 112);
  ctx.fillStyle = "#e9fbff";
  ctx.font = "600 64px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 68);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    emissive: 0x9ff6ff,
    emissiveMap: texture,
    emissiveIntensity: 0.6,
    roughness: 0.45,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(18, 4.5), mat);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  const back = mesh.clone();
  back.rotateY(Math.PI);
  scene.add(back);
}
