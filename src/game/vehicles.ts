import * as THREE from "three";
import type { VehicleSpec } from "./drive";

const paint = (color: number) =>
  new THREE.MeshStandardMaterial({
    color,
    metalness: 0.86,
    roughness: 0.28,
  });

const glassMat = new THREE.MeshStandardMaterial({
  color: 0x9bb7d4,
  metalness: 0.7,
  roughness: 0.08,
  transparent: true,
  opacity: 0.45,
});

const lampMat = new THREE.MeshStandardMaterial({
  color: 0xfff4d2,
  emissive: 0xfff4d2,
  emissiveIntensity: 2.2,
  roughness: 0.3,
});

const tailMat = new THREE.MeshStandardMaterial({
  color: 0xff1d3a,
  emissive: 0xff1d3a,
  emissiveIntensity: 0.4,
  roughness: 0.4,
});

const tireMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.85, metalness: 0.1 });
const rimMat = new THREE.MeshStandardMaterial({ color: 0xc9d0d8, metalness: 0.9, roughness: 0.25 });

export const VEHICLES: VehicleSpec[] = [
  {
    id: "model3",
    name: "Model 3",
    blurb: "The balanced car. Point it and it stays there.",
    accel: 9,
    brake: 16,
    top: 70,
    grip: 1.05,
    steer: 1.55,
    mass: 1.8,
    ride: 0.16,
    width: 1.85,
    length: 4.7,
    height: 1.15,
    color: 0xd7dde6,
    spheres: [{ oz: 0.2, r: 1.15 }],
  },
  {
    id: "modely",
    name: "Model Y",
    blurb: "Taller, softer, a little slower to turn in.",
    accel: 8,
    brake: 15,
    top: 64,
    grip: 0.98,
    steer: 1.4,
    mass: 2,
    ride: 0.24,
    width: 1.92,
    length: 4.8,
    height: 1.35,
    color: 0xf2f4f7,
    spheres: [{ oz: 0.1, r: 1.2 }],
  },
  {
    id: "models",
    name: "Model S",
    blurb: "Long, fast, planted in the sweepers.",
    accel: 10.5,
    brake: 16,
    top: 78,
    grip: 1.02,
    steer: 1.45,
    mass: 2.2,
    ride: 0.14,
    width: 1.96,
    length: 5.05,
    height: 1.12,
    color: 0xb3122a,
    spheres: [{ oz: 0.2, r: 1.22 }],
  },
  {
    id: "modelx",
    name: "Model X",
    blurb: "Heavy doors, heavy car. It still moves.",
    accel: 7.6,
    brake: 14,
    top: 62,
    grip: 0.96,
    steer: 1.28,
    mass: 2.6,
    ride: 0.26,
    width: 2.05,
    length: 5.05,
    height: 1.42,
    color: 0x1c1f26,
    spheres: [{ oz: 0.1, r: 1.28 }],
  },
  {
    id: "cybertruck",
    name: "Cybertruck",
    blurb: "Stainless, wide, and hard to unsettle.",
    accel: 8.4,
    brake: 14,
    top: 68,
    grip: 1.18,
    steer: 1.22,
    mass: 3.2,
    ride: 0.32,
    width: 2.05,
    length: 5.7,
    height: 1.55,
    color: 0xb7c0c8,
    spheres: [{ oz: 0.3, r: 1.35 }],
  },
  {
    id: "semi",
    name: "Semi",
    blurb: "Slow to leave. Almost nothing stops it.",
    accel: 2.4,
    brake: 8,
    top: 32,
    grip: 1.25,
    steer: 0.72,
    mass: 16,
    ride: 0.45,
    width: 2.6,
    length: 14,
    height: 3.1,
    color: 0xe8eef5,
    spheres: [
      { oz: 4.2, r: 1.55 },
      { oz: -2.4, r: 1.55 },
    ],
  },
  {
    id: "roadster",
    name: "Roadster",
    blurb: "The fastest thing on the grid. It will bite.",
    accel: 14,
    brake: 18,
    top: 98,
    grip: 0.9,
    steer: 1.75,
    mass: 1.25,
    ride: 0.08,
    width: 2,
    length: 4.45,
    height: 0.95,
    color: 0xf4f7fb,
    spheres: [{ oz: 0.15, r: 1.12 }],
  },
];

export function vehicleById(id: string) {
  return VEHICLES.find((car) => car.id === id) ?? VEHICLES[0];
}

export type WheelRig = { steer: THREE.Group; spin: THREE.Group; front: boolean };

export function buildVehicle(spec: VehicleSpec) {
  const root = new THREE.Group();
  root.name = spec.id;
  const visual = new THREE.Group();
  visual.name = "visual";
  root.add(visual);

  const bodyMat = paint(spec.color);
  const wheels: WheelRig[] = [];

  if (spec.id === "semi") buildSemi(visual, spec, bodyMat, wheels);
  else if (spec.id === "cybertruck") buildCyber(visual, spec, bodyMat, wheels);
  else if (spec.id === "roadster") buildRoadster(visual, spec, bodyMat, wheels);
  else buildSedan(visual, spec, bodyMat, wheels);

  const spot = new THREE.SpotLight(0xfff1cc, 0, 46, 0.55, 0.45, 1.1);
  spot.position.set(0, spec.height * 0.55, -spec.length * 0.42);
  const target = new THREE.Object3D();
  target.position.set(0, 0.2, -24);
  root.add(spot, target);
  spot.target = target;

  root.userData.wheels = wheels;
  root.userData.visual = visual;
  root.userData.spot = spot;
  root.userData.tail = visual.getObjectByName("tail") as THREE.Mesh | undefined;
  return root;
}

function buildSedan(visual: THREE.Group, spec: VehicleSpec, bodyMat: THREE.Material, wheels: WheelRig[]) {
  const L = spec.length;
  const W = spec.width;
  const H = spec.height;
  const lower = box(W, H * 0.45, L, bodyMat);
  lower.position.y = H * 0.28;
  const cabin = box(W * 0.86, H * 0.42, L * 0.48, glassMat);
  cabin.position.set(0, H * 0.62, -L * 0.02);
  const nose = box(W * 0.92, H * 0.18, L * 0.22, bodyMat);
  nose.position.set(0, H * 0.42, -L * 0.36);
  visual.add(lower, cabin, nose, lamps(spec), tailBar(spec));
  addAxle(visual, wheels, W, L, 0.34, true);
  addAxle(visual, wheels, W, L, 0.34, false);
}

function buildRoadster(visual: THREE.Group, spec: VehicleSpec, bodyMat: THREE.Material, wheels: WheelRig[]) {
  const L = spec.length;
  const W = spec.width;
  const H = spec.height;
  const lower = box(W, H * 0.42, L, bodyMat);
  lower.position.y = H * 0.24;
  const cabin = box(W * 0.72, H * 0.38, L * 0.34, glassMat);
  cabin.position.set(0, H * 0.48, L * 0.08);
  const hood = box(W * 0.88, H * 0.12, L * 0.4, bodyMat);
  hood.position.set(0, H * 0.38, -L * 0.22);
  visual.add(lower, cabin, hood, lamps(spec), tailBar(spec));
  addAxle(visual, wheels, W, L, 0.32, true);
  addAxle(visual, wheels, W, L, 0.32, false);
}

function buildCyber(visual: THREE.Group, spec: VehicleSpec, bodyMat: THREE.Material, wheels: WheelRig[]) {
  const L = spec.length;
  const W = spec.width;
  const H = spec.height;
  const bed = box(W, H * 0.55, L * 0.62, bodyMat);
  bed.position.set(0, H * 0.4, L * 0.12);
  const nose = box(W * 0.96, H * 0.28, L * 0.42, bodyMat);
  nose.position.set(0, H * 0.32, -L * 0.28);
  nose.rotation.x = 0.22;
  const glass = box(W * 0.7, H * 0.28, L * 0.28, glassMat);
  glass.position.set(0, H * 0.72, -L * 0.02);
  glass.rotation.x = 0.35;
  visual.add(bed, nose, glass, lamps(spec), tailBar(spec));
  addAxle(visual, wheels, W, L, 0.42, true);
  addAxle(visual, wheels, W, L, 0.42, false);
}

function buildSemi(visual: THREE.Group, spec: VehicleSpec, bodyMat: THREE.Material, wheels: WheelRig[]) {
  const cab = box(2.55, 2.7, 3.2, bodyMat);
  cab.position.set(0, 1.7, -4.6);
  const sleeper = box(2.55, 2.2, 1.4, bodyMat);
  sleeper.position.set(0, 1.55, -2.6);
  const wind = box(2.3, 1.1, 0.15, glassMat);
  wind.position.set(0, 2.15, -6.15);
  const trailer = box(2.6, 3.05, 8.2, bodyMat);
  trailer.position.set(0, 1.85, 2.5);
  const fifth = box(1.2, 0.3, 1.2, bodyMat);
  fifth.position.set(0, 1.15, -1.2);
  visual.add(cab, sleeper, wind, trailer, fifth, lamps(spec), tailBar(spec));
  addAxle(visual, wheels, 2.5, 10.5, 0.52, true, -4.8);
  addAxle(visual, wheels, 2.5, 10.5, 0.52, false, 0.4);
  addAxle(visual, wheels, 2.5, 10.5, 0.52, false, 1.8);
  addAxle(visual, wheels, 2.5, 10.5, 0.52, false, 4.6);
}

function box(w: number, h: number, d: number, material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function lamps(spec: VehicleSpec) {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(0.28, 0.1, 0.06);
  for (const side of [-1, 1]) {
    const lamp = new THREE.Mesh(geo, lampMat);
    lamp.position.set(side * spec.width * 0.32, spec.height * 0.32, -spec.length * 0.5);
    g.add(lamp);
  }
  return g;
}

function tailBar(spec: VehicleSpec) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(spec.width * 0.72, 0.08, 0.06), tailMat.clone());
  mesh.name = "tail";
  mesh.position.set(0, spec.height * 0.34, spec.length * 0.5);
  return mesh;
}

function addAxle(
  visual: THREE.Group,
  wheels: WheelRig[],
  width: number,
  length: number,
  radius: number,
  front: boolean,
  zOverride?: number,
) {
  const z = zOverride ?? (front ? -length * 0.32 : length * 0.32);
  for (const side of [-1, 1]) {
    const steer = new THREE.Group();
    steer.position.set(side * (width * 0.5 - 0.05), radius, z);
    const spin = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.26, 16), tireMat);
    tire.geometry.rotateZ(Math.PI / 2);
    tire.castShadow = true;
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.55, radius * 0.55, 0.28, 12), rimMat);
    rim.geometry.rotateZ(Math.PI / 2);
    spin.add(tire, rim);
    steer.add(spin);
    visual.add(steer);
    wheels.push({ steer, spin, front });
  }
}
