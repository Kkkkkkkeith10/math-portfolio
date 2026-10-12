import * as THREE from "three";

export type SceneName = "dam" | "market" | "bakery";

export interface TownKit {
  root: THREE.Group;
  mat(c: string): THREE.MeshStandardMaterial;
  track(g: THREE.BufferGeometry): void;
  box(p: THREE.Object3D, c: string, x: number, y: number, z: number, sx: number, sy: number, sz: number, radius?: number): THREE.Mesh;
  cyl(p: THREE.Object3D, c: string, x: number, y: number, z: number, rt: number, rb: number, h: number, sides?: number): THREE.Mesh;
  ball(p: THREE.Object3D, c: string, x: number, y: number, z: number, r: number): THREE.Mesh;
  rock(p: THREE.Object3D, c: string, x: number, y: number, z: number, s: number): THREE.Mesh;
  person(p: THREE.Object3D, shirt: string, hat: string, x: number, z: number, turn: number): THREE.Group;
}

export interface BuiltTownModel { tick?(t: number): void }

const C = {
  grass: "#80a958", grassLight: "#9cbb6a", grassDark: "#5f915a",
  earth: "#c7a78b", sand: "#efe1c8", cream: "#f4e8cf", milk: "#fff9ed",
  pink: "#e9b1b2", berry: "#c96168", teal: "#5b9f93", tealDark: "#356965",
  wood: "#bf8d64", woodDark: "#8c6854", terra: "#c97556", gold: "#edc270",
  stone: "#ddd8c9", stoneDark: "#b7b8aa", water: "#83c7ce", waterLight: "#b6e1dd",
  skin: "#e2b58d", hair: "#554b3d", ink: "#4b4c41",
};

function group(parent: THREE.Object3D, x = 0, y = 0, z = 0, turn = 0): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = turn;
  parent.add(g);
  return g;
}

function mesh(k: TownKit, p: THREE.Object3D, geo: THREE.BufferGeometry, color: string): THREE.Mesh {
  k.track(geo);
  const m = new THREE.Mesh(geo, k.mat(color));
  m.castShadow = true;
  m.receiveShadow = true;
  p.add(m);
  return m;
}

/** A horizontal polygon, with its top at y. Used for water and soft little shores. */
function island(k: TownKit, color: string, points: readonly (readonly [number, number])[], y: number, depth = 0.03): THREE.Mesh {
  const shape = new THREE.Shape();
  points.forEach(([x, z], i) => i ? shape.lineTo(x, -z) : shape.moveTo(x, -z));
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  const m = mesh(k, k.root, geo, color);
  m.rotation.x = -Math.PI / 2;
  m.position.y = y - depth;
  return m;
}

function base(k: TownKit, color = C.grass): void {
  // A small collectible clay tile, rather than a raw square slab.
  k.box(k.root, C.earth, 0, -0.25, 0, 6, 0.58, 6, 0.23);
  k.box(k.root, C.sand, 0, -0.03, 0, 5.94, 0.2, 5.94, 0.2);
  k.box(k.root, color, 0, 0.09, 0, 5.88, 0.15, 5.88, 0.17);
}

function tree(k: TownKit, x: number, z: number, scale = 1, leaf = C.grassDark): void {
  const g = group(k.root, x, 0.15, z);
  g.scale.setScalar(scale);
  k.cyl(g, C.woodDark, 0, 0.57, 0, 0.075, 0.12, 1.14, 7);
  const branch = k.cyl(g, C.woodDark, 0.15, 0.82, 0, 0.04, 0.07, 0.5, 6);
  branch.rotation.z = -0.6;
  k.ball(g, leaf, 0, 1.25, 0, 0.55);
  k.ball(g, C.grass, -0.25, 1.12, 0.11, 0.39);
  k.ball(g, C.grassLight, 0.2, 1.39, 0.04, 0.38);
  k.cyl(g, "#799583", 0, 0.04, 0, 0.42, 0.46, 0.06, 10);
}

function pot(k: TownKit, p: THREE.Object3D, x: number, z: number, s = 1, flowers = false): void {
  const g = group(p, x, 0.15, z);
  g.scale.setScalar(s);
  k.cyl(g, C.terra, 0, 0.16, 0, 0.25, 0.17, 0.32, 10);
  k.cyl(g, "#e1a184", 0, 0.32, 0, 0.28, 0.28, 0.08, 10);
  k.cyl(g, C.woodDark, 0, 0.365, 0, 0.23, 0.23, 0.02, 10);
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    const leaf = k.box(g, i % 2 ? C.grassDark : C.grass, Math.sin(a) * 0.11, 0.53, Math.cos(a) * 0.11, 0.13, 0.31, 0.065, 0.035);
    leaf.rotation.set(Math.cos(a) * 0.36, -a, Math.sin(a) * -0.36);
    if (flowers && i % 2 === 0) {
      k.ball(g, i === 0 ? C.pink : C.gold, Math.sin(a) * 0.14, 0.72, Math.cos(a) * 0.14, 0.09);
    }
  }
}

function tuft(k: TownKit, x: number, z: number): void {
  for (let i = -1; i <= 1; i++) {
    const blade = k.box(k.root, i ? C.grassDark : C.grassLight, x + i * 0.07, 0.25, z, 0.06, 0.23 + (1 - Math.abs(i)) * 0.07, 0.055, 0.025);
    blade.rotation.z = i * -0.22;
  }
}

/** The same tapered clothes, faceted heads and straw hats as Mei in the rooftop game. */
function character(k: TownKit, x: number, z: number, shirt: string, turn: number, role: "gardener" | "seller" | "baker" | "child"): THREE.Group {
  const g = group(k.root, x, 0.18, z, turn);
  if (role === "child") g.scale.setScalar(0.82);
  for (const side of [-1, 1]) {
    k.box(g, "#b67f60", side * 0.135, 0.135, 0, 0.11, 0.19, 0.12, 0);
    k.box(g, "#66756b", side * 0.135, 0.045, 0.035, 0.15, 0.075, 0.21, 0);
    const start = new THREE.Vector3(side * 0.205, 0.855, 0);
    const end = new THREE.Vector3(side * 0.375, 0.54, 0.13);
    const center = start.clone().add(end).multiplyScalar(0.5);
    const arm = k.cyl(g, C.skin, center.x, center.y, center.z, 0.055, 0.06, start.distanceTo(end), 7);
    arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
    k.rock(g, C.skin, side * 0.375, 0.515, 0.14, 0.065);
  }
  k.cyl(g, shirt, 0, 0.575, 0, 0.2, 0.35, 0.77, 7);
  k.cyl(g, "#d6a580", 0, 0.99, 0, 0.075, 0.085, 0.14, 7);
  const head = k.rock(g, C.skin, 0, 1.15, 0, 0.24);
  head.scale.x *= 0.95;
  head.scale.y *= 1.23;
  head.scale.z *= 1.05;
  k.rock(g, C.hair, 0, 1.2, -0.18, 0.115);
  for (const side of [-1, 1]) {
    k.rock(g, C.ink, side * 0.079, 1.172, 0.21, 0.016);
  }
  k.rock(g, "#c48866", 0, 1.1, 0.211, 0.02);
  if (role !== "child") {
    k.box(g, role === "gardener" ? "#d7e2c7" : C.cream, 0, 0.57, 0.215, 0.3, 0.47, 0.04, 0);
    k.box(g, role === "gardener" ? C.teal : C.sand, 0, 0.48, 0.239, 0.15, 0.09, 0.018, 0);
  }
  if (role === "gardener") {
    k.cyl(g, "#d9b673", 0, 1.365, 0, 0.405, 0.405, 0.044, 9);
    k.cyl(g, "#e8c989", 0, 1.474, 0, 0.17, 0.24, 0.195, 8);
    k.cyl(g, "#ad8f62", 0, 1.39, 0, 0.24, 0.24, 0.035, 8);
    for (const side of [-1,1]) {
      const glasses = mesh(k, g, new THREE.TorusGeometry(0.06, 0.009, 4, 12), "#6b6957");
      glasses.position.set(side * 0.079, 1.172, 0.2);
      glasses.castShadow = false;
    }
    k.box(g, "#6b6957", 0, 1.172, 0.213, 0.045, 0.011, 0.01, 0);
  } else if (role === "baker") {
    k.cyl(g, C.milk, 0, 1.365, 0, 0.405, 0.405, 0.044, 9);
    k.cyl(g, C.milk, 0, 1.4, 0, 0.24, 0.24, 0.13, 8);
    for (const [a, b] of [[-0.11, 0], [0.11, 0], [0, 0.08]] as const) k.ball(g, C.milk, a, 1.535, b, 0.16);
  } else if (role === "seller") {
    k.cyl(g, "#d9b673", 0, 1.365, 0, 0.405, 0.405, 0.044, 9);
    k.cyl(g, "#e8c989", 0, 1.474, 0, 0.17, 0.24, 0.195, 8);
    k.cyl(g, C.tealDark, 0, 1.39, 0, 0.24, 0.24, 0.035, 8);
  } else {
    k.cyl(g, "#d9b673", 0, 1.365, 0, 0.405, 0.405, 0.044, 9);
    k.cyl(g, "#e8c989", 0, 1.474, 0, 0.17, 0.24, 0.195, 8);
    k.cyl(g, C.terra, 0, 1.39, 0, 0.24, 0.24, 0.035, 8);
  }
  return g;
}

function arch(k: TownKit, p: THREE.Object3D, color: string, x: number, y: number, z: number, w: number, h: number, depth: number): THREE.Mesh {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(-w / 2, h - w / 2);
  s.absarc(0, h - w / 2, w / 2, Math.PI, 0, true);
  s.lineTo(w / 2, 0);
  s.closePath();
  const m = mesh(k, p, new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.02, bevelSegments: 1, curveSegments: 12 }), color);
  m.position.set(x, y, z);
  return m;
}

function dam(k: TownKit): BuiltTownModel {
  base(k);
  island(k, C.sand, [[-2.82,-2.82],[2.82,-2.82],[2.82,-0.8],[1.9,-0.55],[1.05,0.1],[0.95,1.1],[1.25,2.82],[-0.55,2.82],[-0.75,1.4],[-0.55,0.3],[-1.4,-0.65],[-2.82,-0.85]], 0.175);
  island(k, C.water, [[-2.78,-2.78],[2.78,-2.78],[2.78,-1.08],[1.9,-0.82],[0.66,-0.25],[0.58,0.5],[0.53,1.2],[0.85,2.77],[-0.22,2.77],[-0.38,1.45],[-0.22,0.3],[-0.77,-0.45],[-1.8,-0.83],[-2.78,-1.13]], 0.195);
  // Raised reservoir water remains visible above the wall in the isometric view.
  island(k, "#8ac9cc", [[-2.7,-2.7],[2.7,-2.7],[2.7,-1.04],[1.6,-0.91],[0.5,-0.88],[-0.5,-0.88],[-1.65,-0.91],[-2.7,-1.07]], 0.72, 0.53);
  k.box(k.root, C.stoneDark, 0, 0.49, -2.78, 5.52, 0.65, 0.14, 0.04);
  for (const x of [-2.78,2.78]) k.box(k.root, C.stoneDark, x, 0.49, -1.94, 0.14, 0.65, 1.8, 0.04);
  island(k, C.waterLight, [[-0.09,0.23],[0.27,0.29],[0.19,1.1],[0.34,1.78],[0.24,2.45],[0.02,1.78],[-0.11,1.03]], 0.202, 0.006);
  // Shallow stone banks frame a genuine open timber gate in the middle.
  for (const [center, width] of [[-1.68, 2.08],[1.68,2.08]] as const) {
    k.box(k.root, C.stoneDark, center, 0.31, -0.72, width + 0.12, 0.22, 0.62, 0.06);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        k.box(k.root, (row + col) % 3 === 0 ? "#e6e0d2" : C.stone, center - width / 2 + 0.265 + col * 0.515, 0.49 + row * 0.245, -0.72, 0.495, 0.225, 0.49, 0.035);
      }
    }
    k.box(k.root, "#e9e2d3", center, 1.1, -0.72, width + 0.08, 0.15, 0.6, 0.045);
  }
  for (const x of [-0.61, 0.61]) {
    k.box(k.root, C.woodDark, x, 0.8, -0.68, 0.2, 1.26, 0.28, 0.04);
    k.box(k.root, C.wood, x, 1.43, -0.68, 0.25, 0.12, 0.33, 0.035);
    k.ball(k.root, C.stoneDark, x, 0.91, -0.515, 0.045);
    k.ball(k.root, C.stoneDark, x, 0.51, -0.515, 0.045);
  }
  // One slat remains; the measured repair plank is on the grassy bank.
  k.box(k.root, C.wood, 0, 0.375, -0.68, 1.06, 0.2, 0.14, 0.025);
  k.box(k.root, C.waterLight, 0, 0.485, -0.32, 0.65, 0.54, 0.11, 0.035);
  k.box(k.root, "#d7efdf", 0, 0.227, -0.22, 0.76, 0.035, 0.22, 0.045);
  const measuring = group(k.root, 1.65, 0.25, 1.07, -0.48);
  k.box(measuring, C.woodDark, 0, -0.025, 0, 1.64, 0.12, 0.39, 0.035);
  k.box(measuring, "#e6bf83", 0, 0.045, 0, 1.59, 0.085, 0.36, 0.025);
  k.box(measuring, C.gold, 0, 0.1, -0.055, 1.55, 0.028, 0.16, 0.014);
  for (let i = 0; i <= 10; i++) k.box(measuring, C.woodDark, -0.7 + i * 0.14, 0.117, -0.055, 0.012, 0.009, i % 5 === 0 ? 0.12 : 0.065);
  for (const x of [-0.65, 0.65]) k.ball(measuring, C.stoneDark, x, 0.085, 0.12, 0.025);
  const worker = character(k, -1.37, 0.87, C.terra, 0.25, "gardener");
  const hammer = group(worker, 0.35, 0.38, 0.07, 0.1);
  k.box(hammer, C.woodDark, 0, -0.05, 0, 0.045, 0.36, 0.05, 0.012);
  k.box(hammer, C.stoneDark, 0, 0.13, 0, 0.22, 0.1, 0.12, 0.03);
  // Carefully sized set dressing, with the water and repair object left clear.
  tree(k, -2.22, 0.02, 0.85);
  tree(k, 2.27, -0.01, 0.62, "#91b5a0");
  for (const [x,z,s] of [[-2.61,-1.17,0.25],[-2.35,-1.2,0.17],[2.53,-1.05,0.25],[2.63,-1.61,0.15],[-0.66,1.78,0.16],[0.73,2.16,0.14]] as const) k.rock(k.root, C.stoneDark, x, 0.16 + s * 0.4, z, s);
  for (const [x,z] of [[-2.24,1.4],[-1.75,2.2],[2.48,1.2],[1.68,2.38]] as const) tuft(k, x, z);
  k.cyl(k.root, C.terra, -1.45, 0.31, 2.19, 0.2, 0.15, 0.3, 10);
  k.cyl(k.root, C.water, -1.45, 0.47, 2.19, 0.16, 0.16, 0.01, 10);
  const handle = mesh(k, k.root, new THREE.TorusGeometry(0.19, 0.018, 5, 14, Math.PI), C.woodDark);
  handle.position.set(-1.45, 0.48, 2.19);
  // Thin foam ripples move along the stream, rather than bouncing solid scenery.
  const ripples: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) ripples.push(k.box(k.root, "#d7efdf", 0.08, 0.212, 0.46 + i * 0.61, 0.3, 0.007, 0.025, 0.009));
  for (const [x,z,w] of [[-1.7,-2.1,0.55],[0.1,-1.88,0.35],[1.54,-2.33,0.55]] as const) k.box(k.root, "#b3deda", x, 0.73, z, w, 0.008, 0.035, 0.01);
  return { tick(t) { ripples.forEach((r, i) => { const p = (t * 0.14 + i / 3) % 1; r.position.z = 0.12 + p * 2.28; r.position.x = 0.08 + Math.sin(p * 4) * 0.07; }); } };
}

function crate(k: TownKit, p: THREE.Object3D, x: number, y: number, z: number, color: string): void {
  k.box(p, C.woodDark, x, y, z, 0.79, 0.12, 0.61, 0.025);
  for (const side of [-1, 1]) {
    k.box(p, C.wood, x + side * 0.38, y + 0.11, z, 0.045, 0.22, 0.65, 0.015);
    k.box(p, C.wood, x, y + 0.11, z + side * 0.3, 0.79, 0.22, 0.045, 0.015);
  }
  for (let i = 0; i < 6; i++) {
    const fx = x - 0.24 + (i % 3) * 0.24;
    const fz = z - 0.14 + Math.floor(i / 3) * 0.26;
    k.ball(p, color, fx, y + 0.21, fz, 0.128);
    k.cyl(p, C.woodDark, fx, y + 0.35, fz, 0.015, 0.019, 0.05, 5);
    const leaf = k.box(p, C.grassDark, fx + 0.04, y + 0.35, fz, 0.1, 0.027, 0.06, 0.02);
    leaf.rotation.z = 0.35;
  }
}

function coin(k: TownKit, p: THREE.Object3D, x: number, y: number, z: number, radius = 0.18): void {
  k.cyl(p, "#d6a35e", x, y, z, radius, radius, 0.05, 14);
  k.cyl(p, C.gold, x, y + 0.027, z, radius * 0.82, radius * 0.82, 0.012, 14);
  k.box(p, "#b58b52", x, y + 0.037, z, radius * 0.14, 0.009, radius * 0.85, 0.009);
}

function market(k: TownKit): BuiltTownModel {
  base(k, "#e6dbc8");
  // A small paved town square, with an irregular inset instead of a checkerboard.
  k.box(k.root, "#f4ead7", 0, 0.185, 0.05, 5.35, 0.055, 5.18, 0.17);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      const x = -2.12 + col * 1.03 + (row % 2) * 0.1;
      k.box(k.root, (row + col) % 3 ? "#e9dfcd" : "#e2d5c1", x, 0.22, -1.98 + row * 1.19, 0.985, 0.025, 1.13, 0.035);
    }
  }
  const stall = group(k.root, -0.22, 0, -0.58);
  k.box(stall, C.tealDark, 0, 0.72, 0.2, 3.17, 0.98, 1.5, 0.09);
  for (let i = 0; i < 7; i++) k.box(stall, C.teal, -1.34 + i * 0.445, 0.72, 0.975, 0.415, 0.83, 0.05, 0.035);
  k.box(stall, "#d6ad82", 0, 1.23, 0.2, 3.34, 0.13, 1.68, 0.05);
  k.box(stall, C.woodDark, 0, 0.3, 0.995, 3.12, 0.08, 0.08, 0.02);
  for (const x of [-1.53,1.53]) {
    k.box(stall, C.wood, x, 1.58, -0.46, 0.11, 2.71, 0.11, 0.025);
    k.box(stall, C.woodDark, x, 2.79, -0.46, 0.17, 0.11, 0.17, 0.025);
  }
  k.box(stall, C.woodDark, 0, 2.79, -0.46, 3.3, 0.11, 0.11, 0.025);
  // Individual pitched cloth stripes and scallops give the canopy a clean silhouette.
  for (let i = 0; i < 8; i++) {
    const color = i % 2 ? C.milk : "#d89183";
    const x = -1.444 + i * 0.4125;
    const roof = k.box(stall, color, x, 2.72, -0.05, 0.412, 0.08, 1.68, 0.025);
    roof.rotation.x = 0.15;
    k.box(stall, color, x, 2.55, 0.785, 0.411, 0.2, 0.06, 0.025);
    const scallop = k.cyl(stall, color, x, 2.45, 0.79, 0.206, 0.206, 0.055, 14);
    scallop.rotation.x = Math.PI / 2;
    scallop.scale.y = 0.5;
  }
  crate(k, stall, -1.06, 1.32, 0.6, "#db7965");
  crate(k, stall, 0, 1.32, 0.6, "#ecb366");
  crate(k, stall, 1.06, 1.32, 0.6, "#a3bc72");
  // Tiny cream price tags face the visitor; numeral-like strokes avoid unreadable text textures.
  for (let i = 0; i < 3; i++) {
    k.box(stall, C.cream, -1.06 + i * 1.06, 1.06, 1.017, 0.35, 0.2, 0.035, 0.025);
    k.box(stall, C.tealDark, -1.06 + i * 1.06, 1.065, 1.039, 0.035, 0.09, 0.008, 0.008);
    k.box(stall, C.tealDark, -1.02 + i * 1.06, 1.108, 1.039, 0.09, 0.022, 0.008, 0.007);
  }
  const sign = group(stall, 0, 3.05, -0.25);
  k.box(sign, C.woodDark, 0, 0, 0, 1.06, 0.47, 0.12, 0.07);
  k.box(sign, C.cream, 0, 0, 0.069, 0.94, 0.36, 0.03, 0.05);
  k.ball(sign, "#d87965", 0, -0.005, 0.12, 0.117);
  k.box(sign, C.grassDark, 0.07, 0.11, 0.12, 0.13, 0.04, 0.055, 0.02).rotation.z = 0.35;
  character(k, -2.28, -0.76, C.terra, 0.55, "seller");
  const shopper = character(k, -1.19, 1.27, C.gold, 0.45, "child");
  const basket = group(shopper, 0.37, 0.42, 0.12);
  k.cyl(basket, C.wood, 0, -0.08, 0, 0.17, 0.13, 0.23, 8);
  const basketHandle = mesh(k, basket, new THREE.TorusGeometry(0.16, 0.021, 5, 12, Math.PI), C.woodDark);
  basketHandle.position.y = 0.035;
  k.ball(basket, "#d87965", 0, 0.05, 0, 0.1);
  // The payment tray is a visible second focal object beside the fruit.
  const pay = group(k.root, 1.43, 0, 1.19, -0.18);
  k.box(pay, C.woodDark, 0, 0.66, 0, 1.05, 0.16, 0.79, 0.055);
  for (const x of [-0.35,0.35]) k.box(pay, C.wood, x, 0.44, 0, 0.12, 0.47, 0.52, 0.03);
  k.box(pay, C.cream, 0, 0.762, 0, 0.87, 0.06, 0.63, 0.045);
  for (let i = 0; i < 4; i++) coin(k, pay, -0.19, 0.81 + i * 0.058, -0.05, 0.17);
  coin(k, pay, 0.2, 0.811, 0.05, 0.17);
  coin(k, pay, 0.1, 0.817, -0.16, 0.13);
  pot(k, k.root, 2.43, -1.79, 1.05, true);
  pot(k, k.root, -2.46, -1.81, 0.83);
  k.box(k.root, C.wood, 1.77, 0.38, -1.94, 0.79, 0.31, 0.6, 0.035);
  for (let i = 0; i < 3; i++) k.box(k.root, C.woodDark, 1.5 + i * 0.26, 0.39, -1.627, 0.017, 0.23, 0.018, 0.006);
  k.ball(k.root, "#ecb366", 1.66, 0.62, -1.92, 0.13);
  k.ball(k.root, "#ecb366", 1.92, 0.62, -1.92, 0.13);
  tree(k, -2.32, 0.06, 0.69, "#95b69a");
  // A small folded paper bag anchors the foreground without obscuring the figures.
  k.box(k.root, "#d7b88d", 0.07, 0.36, 2.15, 0.37, 0.33, 0.29, 0.025);
  k.box(k.root, "#e8cfa5", 0.07, 0.54, 2.15, 0.38, 0.09, 0.3, 0.025);
  return {};
}

function bakery(k: TownKit): BuiltTownModel {
  base(k, "#bdcdae");
  k.box(k.root, C.sand, 0, 0.19, 0.06, 4.95, 0.07, 5.21, 0.15);
  for (let i = 0; i < 5; i++) k.box(k.root, "#e5d4ba", -1.76 + i * 0.88, 0.233, 2.12, 0.8, 0.025, 0.7, 0.035);
  // A cream and raspberry bakery facade forms a quiet backdrop to the cake.
  const building = group(k.root, 0, 0, -1.79);
  k.box(building, "#efd8c5", 0, 1.06, 0, 3.55, 1.65, 0.72, 0.11);
  k.box(building, C.terra, 0, 0.4, 0.37, 3.57, 0.25, 0.09, 0.035);
  k.box(building, C.cream, 0, 1.96, 0.05, 3.86, 0.14, 1.16, 0.045);
  for (let i = 0; i < 8; i++) {
    const x = -1.664 + i * 0.475;
    const color = i % 2 ? "#f5d6c8" : "#d78e85";
    k.box(building, color, x, 2.075, 0.01, 0.475, 0.16, 1.08, 0.035);
    k.box(building, color, x, 1.925, 0.573, 0.47, 0.22, 0.08, 0.035);
  }
  arch(k, building, C.cream, -0.94, 0.32, 0.39, 1.08, 1.4, 0.065);
  arch(k, building, C.tealDark, -0.94, 0.34, 0.466, 0.89, 1.22, 0.024);
  arch(k, building, "#afd0c4", -0.94, 0.78, 0.5, 0.64, 0.68, 0.018);
  k.box(building, C.cream, -0.94, 1.08, 0.528, 0.045, 0.48, 0.032, 0.014);
  k.box(building, C.cream, -0.94, 1.08, 0.528, 0.66, 0.043, 0.032, 0.014);
  k.ball(building, C.gold, -0.67, 0.64, 0.507, 0.034);
  arch(k, building, C.cream, 0.75, 0.79, 0.39, 1.06, 0.93, 0.065);
  arch(k, building, "#98b6a6", 0.75, 0.85, 0.466, 0.86, 0.77, 0.027);
  k.box(building, C.wood, 0.75, 0.85, 0.53, 1.2, 0.13, 0.4, 0.03);
  for (let i = 0; i < 3; i++) {
    const bread = k.box(building, "#e8b97e", 0.46 + i * 0.3, 1.02, 0.555, 0.22, 0.2, 0.35, 0.08);
    bread.rotation.y = -0.14;
    for (let cut = 0; cut < 2; cut++) k.box(building, "#bc8f61", 0.46 + i * 0.3, 1.126, 0.495 + cut * 0.11, 0.12, 0.009, 0.02, 0.007);
  }
  // Rounded sign with a little biscuit medallion, entirely geometry.
  k.box(building, C.woodDark, 0, 2.35, 0.01, 1.23, 0.45, 0.16, 0.08);
  k.box(building, C.cream, 0, 2.35, 0.106, 1.08, 0.34, 0.03, 0.055);
  const biscuit = k.cyl(building, C.gold, 0, 2.35, 0.153, 0.125, 0.125, 0.035, 10);
  biscuit.rotation.x = Math.PI / 2;
  for (const [x,y] of [[-0.05,0.04],[0.05,0.025],[0,-0.05]] as const) k.ball(building, C.woodDark, x, 2.35 + y, 0.185, 0.016);
  // Low table makes the exposed cake sectors the unmistakable foreground subject.
  const table = group(k.root, -0.16, 0, 0.34);
  k.box(table, C.tealDark, 0, 0.91, 0, 3.09, 0.14, 1.77, 0.07);
  k.box(table, C.teal, 0, 0.993, 0, 3.14, 0.055, 1.81, 0.045);
  for (const [x,z] of [[-1.27,-0.62],[1.27,-0.62],[-1.27,0.62],[1.27,0.62]] as const) {
    const leg = k.box(table, C.wood, x, 0.57, z, 0.13, 0.65, 0.13, 0.025);
    leg.rotation.z = x * -0.035;
  }
  k.box(table, C.wood, 0, 0.46, 0, 2.56, 0.08, 0.1, 0.02);
  const cake = group(table, -0.25, 1.06, -0.01);
  k.cyl(cake, C.milk, 0, -0.025, 0, 0.96, 0.96, 0.055, 32);
  k.cyl(cake, "#e2cbaa", 0, -0.058, 0, 0.78, 0.78, 0.035, 24);
  const pieces: THREE.Group[] = [];
  const count = 8;
  for (let i = 0; i < count; i++) {
    const piece = group(cake);
    const theta = i * Math.PI * 2 / count + 0.025;
    const span = Math.PI * 2 / count - 0.05;
    const mid = theta + span / 2;
    const offset = i === 1 ? 0.25 : 0.034;
    piece.position.set(Math.sin(mid) * offset, 0, Math.cos(mid) * offset);
    for (const [color,y,h,r] of [["#e9bb84",0.13,0.26,0.77],[C.berry,0.275,0.035,0.77],["#f0cc99",0.37,0.155,0.77],[C.milk,0.463,0.035,0.785]] as const) {
      const g = new THREE.CylinderGeometry(r, r, h, 8, 1, false, theta, span);
      const layer = mesh(k, piece, g, color);
      layer.position.y = y;
    }
    const bx = Math.sin(mid) * 0.56;
    const bz = Math.cos(mid) * 0.56;
    k.cyl(piece, C.milk, bx, 0.515, bz, 0.08, 0.1, 0.07, 8);
    const berry = k.ball(piece, "#d57575", bx, 0.61, bz, 0.095);
    berry.scale.y *= 1.15;
    k.box(piece, C.grassDark, bx, 0.708, bz, 0.12, 0.022, 0.07, 0.02).rotation.y = mid;
    pieces.push(piece);
  }
  // A pair of empty plates makes sharing clear; none cover the slice boundaries.
  for (const z of [-0.5,0.43]) {
    k.cyl(table, C.milk, 1.06, 1.05, z, 0.26, 0.26, 0.025, 20);
    k.cyl(table, "#e4c6bd", 1.06, 1.067, z, 0.18, 0.18, 0.008, 20);
  }
  const knife = k.box(table, C.stone, -1.23, 1.08, 0.16, 0.06, 0.035, 0.48, 0.018);
  knife.rotation.y = -0.3;
  k.box(table, C.woodDark, -1.15, 1.08, 0.44, 0.085, 0.045, 0.19, 0.02).rotation.y = -0.3;
  character(k, 1.96, 0.25, C.pink, -0.2, "baker");
  character(k, -1.72, 1.28, C.teal, 0.36, "child");
  pot(k, k.root, -2.18, -1.49, 0.92, true);
  pot(k, k.root, 2.3, -1.59, 0.92, true);
  // Small stool and a milk bottle complete the scene without competing with the cake.
  k.cyl(k.root, C.wood, 1.66, 0.45, 1.79, 0.28, 0.29, 0.09, 12);
  for (const a of [0, Math.PI * 2 / 3, Math.PI * 4 / 3]) k.box(k.root, C.woodDark, 1.66 + Math.sin(a) * 0.19, 0.33, 1.79 + Math.cos(a) * 0.19, 0.07, 0.24, 0.07, 0.015);
  k.cyl(k.root, C.milk, 1.66, 0.645, 1.79, 0.11, 0.14, 0.29, 12);
  k.cyl(k.root, C.teal, 1.66, 0.815, 1.79, 0.085, 0.085, 0.055, 10);
  for (const [x,z] of [[-2.55,0.3],[-2.45,2.28],[2.52,1.1],[2.53,2.36]] as const) tuft(k, x, z);
  const highlighted = pieces[1]!;
  const mid = Math.PI * 3 / 8;
  return { tick(t) { const d = 0.245 + Math.sin(t * 0.7) * 0.025; highlighted.position.set(Math.sin(mid) * d, 0, Math.cos(mid) * d); } };
}

export function buildTownModel(name: SceneName, kit: TownKit): BuiltTownModel {
  return name === "dam" ? dam(kit) : name === "market" ? market(kit) : bakery(kit);
}
