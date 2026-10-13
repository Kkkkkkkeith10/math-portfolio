import * as THREE from "three";

export interface RooftopHandle {
  updateGarden(length: number, width: number, harvest: boolean): void;
  setStage(stage: "meet" | "build" | "compare" | "transfer" | "complete"): void;
  setInteractive(enabled: boolean, onResize?: (length: number, width: number) => void): void;
  /** The plank pile beside the workbench shows one plank per metre of fence still unused. */
  setFenceLeft(metres: number): void;
  /** Mei walks from the hut to the garden. */
  walkIn(onDone?: () => void): void;
  /** A small hop, used when Mei starts a new line. */
  hop(): void;
  /** Plant one seed per square, one at a time, until the seeds or the squares run out. */
  plantSeeds(seeds: number, onPlant: (planted: number) => void, onDone: (planted: number) => void): void;
  /** Called with Mei's head position in pixels, relative to the scene, whenever it changes. */
  onMeiMove(listener: (x: number, y: number) => void): void;
  destroy(): void;
}

/** A small, locally rendered diorama. All assets are procedural geometry. */
export function mountRooftop(host: HTMLElement): RooftopHandle {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  } catch {
    host.classList.add("rooftop-unavailable");
    const fallback = document.createElement("div");
    fallback.className = "rooftop-fallback";
    const artwork = document.createElement("img");
    artwork.src = "/img/rooftop-low-poly.webp";
    artwork.alt = "Auntie Mei’s low-poly rooftop garden above a pastel Hong Kong neighbourhood.";
    artwork.style.width = "100%";
    artwork.style.height = "100%";
    artwork.style.objectFit = "cover";
    artwork.style.display = "block";
    const note = document.createElement("p");
    note.textContent = "The planning board is ready to play.";
    fallback.append(artwork, note);
    host.append(fallback);
    let squares = 32;
    return {
      updateGarden: (length, width) => { squares = length * width; },
      setStage: () => undefined,
      setInteractive: () => undefined,
      setFenceLeft: () => undefined,
      walkIn: (onDone) => onDone?.(),
      hop: () => undefined,
      plantSeeds: (seeds, onPlant, onDone) => { const n = Math.min(seeds, squares); onPlant(n); onDone(n); },
      onMeiMove: () => undefined,
      destroy: () => { fallback.remove(); host.classList.remove("rooftop-unavailable"); },
    };
  }

  const canvas = renderer.domElement;
  canvas.className = "rooftop-canvas";
  canvas.setAttribute("aria-label", "A low-poly Hong Kong rooftop garden with Auntie Mei, terracotta pots and pastel city buildings.");
  canvas.setAttribute("role", "img");
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  host.append(canvas);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog("#e1eadc", 36, 50);
  const model = new THREE.Group();
  scene.add(model);
  const camera = new THREE.OrthographicCamera(-12, 12, 8, -8, 0.1, 120);
  const cameraTarget = new THREE.Vector3(-1.6, 1.88, 0.2);
  camera.position.copy(cameraTarget).add(new THREE.Vector3(16, 24, 20));
  camera.lookAt(cameraTarget);

  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const materialCache = new Map<string, THREE.MeshStandardMaterial>();
  const geometryCache = new Map<string, THREE.BufferGeometry>();
  const mat = (color: string): THREE.MeshStandardMaterial => {
    const existing = materialCache.get(color);
    if (existing) return existing;
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, flatShading: true });
    materials.add(material);
    materialCache.set(color, material);
    return material;
  };
  const geometry = (name: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry => {
    const existing = geometryCache.get(name);
    if (existing) return existing;
    const item = make();
    geometries.add(item);
    geometryCache.set(name, item);
    return item;
  };
  const boxGeometry = geometry("box", () => new THREE.BoxGeometry(1, 1, 1));
  const mesh = (parent: THREE.Object3D, shape: THREE.BufferGeometry, color: string, x: number, y: number, z: number): THREE.Mesh => {
    const item = new THREE.Mesh(shape, mat(color));
    item.position.set(x, y, z);
    item.castShadow = true;
    item.receiveShadow = true;
    parent.add(item);
    return item;
  };
  const box = (parent: THREE.Object3D, color: string, x: number, y: number, z: number, sx: number, sy: number, sz: number): THREE.Mesh => {
    const item = mesh(parent, boxGeometry, color, x, y, z);
    item.scale.set(sx, sy, sz);
    return item;
  };
  const cylinder = (parent: THREE.Object3D, color: string, x: number, y: number, z: number, top: number, bottom: number, height: number, sides = 7): THREE.Mesh => {
    const shape = geometry(`cylinder-${top}-${bottom}-${height}-${sides}`, () => new THREE.CylinderGeometry(top, bottom, height, sides));
    return mesh(parent, shape, color, x, y, z);
  };
  const rock = (parent: THREE.Object3D, color: string, x: number, y: number, z: number, scale: number): THREE.Mesh => {
    const item = mesh(parent, geometry("dodecahedron", () => new THREE.DodecahedronGeometry(1, 0)), color, x, y, z);
    item.scale.setScalar(scale);
    return item;
  };
  const beam = (parent: THREE.Object3D, color: string, from: THREE.Vector3, to: THREE.Vector3, thickness: number): THREE.Mesh => {
    const midpoint = from.clone().add(to).multiplyScalar(0.5);
    const item = box(parent, color, midpoint.x, midpoint.y, midpoint.z, thickness, from.distanceTo(to), thickness);
    item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
    return item;
  };
  const roofY = 1.38;
  const cream = "#f4e8cf";
  const teal = "#5b9f93";
  const darkTeal = "#356965";
  const terra = "#c97556";

  scene.add(new THREE.HemisphereLight("#fff6df", "#829b85", 2.0));
  const sunlight = new THREE.DirectionalLight("#ffefcc", 3.0);
  sunlight.position.set(-8, 20, 14);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048);
  sunlight.shadow.camera.left = -22;
  sunlight.shadow.camera.right = 22;
  sunlight.shadow.camera.top = 20;
  sunlight.shadow.camera.bottom = -18;
  sunlight.shadow.camera.near = 1;
  sunlight.shadow.camera.far = 70;
  sunlight.shadow.normalBias = 0.06;
  sunlight.shadow.bias = -0.0002;
  sunlight.shadow.radius = 4;
  sunlight.target.position.set(0, 0, -2);
  scene.add(sunlight, sunlight.target);
  scene.add(new THREE.AmbientLight("#fff1da", 0.35));
  const groundGeometry = geometry("shadow-ground", () => new THREE.PlaneGeometry(38, 30));
  const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.16 });
  materials.add(groundMaterial);
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.position.set(0, -1.91, -4);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Neighbours are a recognisable, miniature Hong Kong skyline, with rooftop tanks,
  // external air conditioners and little window awnings instead of flat silhouettes.
  function building(x: number, z: number, width: number, depth: number, height: number, color: string, accent: string): void {
    const bottom = -1.9;
    const top = bottom + height;
    box(model, color, x, bottom + height / 2, z, width, height, depth);
    box(model, "#eae2cb", x, top + 0.08, z, width + 0.24, 0.18, depth + 0.24);
    box(model, color, x - width / 2 + 0.07, top + 0.3, z, 0.15, 0.35, depth);
    box(model, color, x, top + 0.3, z - depth / 2 + 0.07, width, 0.35, 0.15);
    const floors = Math.floor((height - 0.75) / 0.95);
    const columns = Math.max(2, Math.floor(width / 0.9));
    for (let row = 0; row < floors; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const wx = x - width * 0.36 + column * (width * 0.72 / (columns - 1));
        const wy = bottom + 0.68 + row * 0.95;
        box(model, accent, wx, wy, z + depth / 2 + 0.021, 0.44, 0.54, 0.04);
        box(model, "#f8efd9", wx, wy, z + depth / 2 + 0.05, 0.035, 0.55, 0.035);
        if ((row + column) % 3 === 0) box(model, "#d5d7bf", wx + 0.12, wy - 0.44, z + depth / 2 + 0.13, 0.4, 0.18, 0.25);
        if ((row + column) % 4 === 1) box(model, "#e7b38e", wx, wy + 0.33, z + depth / 2 + 0.19, 0.66, 0.07, 0.39);
      }
    }
    for (let row = 0; row < floors; row += 1) {
      box(model, accent, x + width / 2 + 0.025, bottom + 0.7 + row * 0.95, z, 0.045, 0.53, 0.45);
    }
    cylinder(model, "#a4b9ae", x - 0.5, top + 0.58, z - 0.2, 0.42, 0.42, 0.8, 8);
    cylinder(model, "#d9e0ce", x - 0.5, top + 1.0, z - 0.2, 0.47, 0.47, 0.08, 8);
    box(model, "#d6cbb2", x + 0.7, top + 0.3, z + 0.25, 0.8, 0.55, 0.65);
  }
  building(-10.1, -7.9, 3.1, 3.1, 5.5, "#e0ba9e", "#879d95");
  building(-6.2, -10.6, 3.5, 3.3, 7.8, "#b8ccc0", "#648985");
  building(-1.8, -11.5, 3.6, 3.1, 6.4, "#f0d4a5", "#879885");
  building(2.8, -10.9, 3.1, 3.4, 8.5, "#d9b2a5", "#a08780");
  building(7.0, -9.1, 3.5, 3.3, 6.5, "#c6d2bb", "#7e9d90");
  building(11.1, -6.3, 2.8, 3.1, 5.1, "#ecd3b4", "#9bb5aa");

  // The rooftop is a proper little inhabited place, raised above a cream apartment.
  box(model, cream, 0, -0.35, 0, 15.7, 3.1, 10.7);
  box(model, "#e6d9be", 0, 1.2, 0, 16.3, 0.25, 11.3);
  box(model, "#f1e5cb", 0, roofY - 0.03, 0, 16, 0.12, 11);
  box(model, "#efe0bf", 0, roofY + 0.26, -5.42, 16.1, 0.53, 0.19);
  box(model, "#ead9b8", -7.93, roofY + 0.26, 0, 0.18, 0.53, 11);
  // Front facade: small windows and a sage striped shop awning.
  for (let i = 0; i < 7; i += 1) {
    const x = -6.45 + i * 2.15;
    box(model, darkTeal, x, 0.11, 5.37, 0.93, 1.12, 0.045);
    box(model, "#f8edda", x, 0.11, 5.42, 0.065, 1.16, 0.035);
    box(model, "#f8edda", x, 0.08, 5.42, 0.98, 0.055, 0.035);
    box(model, "#dfcba9", x, -0.56, 5.53, 1.15, 0.13, 0.35);
  }
  for (let i = 0; i < 8; i += 1) {
    const awning = box(model, i % 2 === 0 ? "#90b9a4" : "#f4e8cf", -6.6 + i * 0.38, -0.88, 5.85, 0.38, 0.08, 0.95);
    awning.rotation.x = -0.18;
  }
  for (let i = 0; i < 5; i += 1) box(model, "#b5c7b0", 7.88, -0.05, -4.1 + i * 2.05, 0.04, 1.05, 0.75);

  // Slender front and side railings keep the crop view open.
  for (let i = 0; i <= 16; i += 1) box(model, teal, -7.8 + i * 0.975, roofY + 0.43, 5.28, 0.055, 0.83, 0.055);
  box(model, teal, 0, roofY + 0.87, 5.28, 15.8, 0.065, 0.07);
  box(model, teal, 0, roofY + 0.32, 5.28, 15.8, 0.04, 0.04);
  for (let i = 0; i <= 10; i += 1) box(model, teal, 7.83, roofY + 0.43, -5.3 + i * 1.06, 0.055, 0.83, 0.055);
  box(model, teal, 7.83, roofY + 0.87, 0, 0.065, 0.065, 10.7);

  const hut = new THREE.Group();
  hut.position.set(4.82, roofY, -3.36);
  model.add(hut);
  box(hut, "#e6b587", 0, 1.06, 0, 3.12, 2.12, 2.62);
  box(hut, "#edc69a", 0, 2.15, 0, 3.46, 0.16, 2.93);
  box(hut, "#7ca394", 0, 2.25, 0, 3.48, 0.08, 2.95);
  box(hut, "#436e69", -0.68, 0.96, 1.34, 0.78, 1.91, 0.04);
  rock(hut, "#d9bb79", -0.41, 0.87, 1.4, 0.045);
  box(hut, "#fbecd1", 0.62, 1.25, 1.35, 1.04, 0.96, 0.08);
  box(hut, "#6f9c93", 0.62, 1.25, 1.41, 0.87, 0.8, 0.03);
  box(hut, "#fbecd1", 0.62, 1.25, 1.45, 0.05, 0.88, 0.03);
  box(hut, "#fbecd1", 0.62, 1.25, 1.45, 0.92, 0.05, 0.03);
  cylinder(hut, "#9cbbb0", 0.67, 2.67, -0.39, 0.47, 0.47, 0.77, 10);
  cylinder(hut, "#dbe0cc", 0.67, 3.09, -0.39, 0.5, 0.5, 0.08, 10);
  box(hut, "#80968b", -0.8, 2.48, -0.3, 0.85, 0.44, 0.69);

  // Stepping stones give the soil bed a natural home without prescribing an answer.
  for (let i = 0; i < 7; i += 1) {
    const tile = box(model, i % 2 ? "#d8cab0" : "#e0d4bd", 2.38, roofY + 0.035, -2.25 + i * 0.93, 0.75, 0.055, 0.67);
    tile.rotation.y = (i % 3 - 1) * 0.045;
  }

  function plant(parent: THREE.Object3D, x: number, z: number, seed: number, scale = 1): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.scale.setScalar(scale);
    parent.add(group);
    cylinder(group, "#789757", 0, 0.12, 0, 0.035, 0.04, 0.26, 5);
    const leafColors = ["#80a958", "#5f915a", "#9cbb6a"];
    for (let leaf = 0; leaf < 4; leaf += 1) {
      const angle = leaf * Math.PI / 2 + seed * 0.21;
      const foliage = rock(group, leafColors[(leaf + seed) % leafColors.length]!, Math.sin(angle) * 0.095, 0.17 + (leaf % 2) * 0.035, Math.cos(angle) * 0.095, 0.14);
      foliage.scale.set(0.125, 0.075, 0.2);
      foliage.rotation.set(0.32, angle, -0.22);
    }
    if (seed % 5 === 0) rock(group, "#da7957", 0, 0.2, 0, 0.085);
    return group;
  }

  function pot(x: number, z: number, scale: number, variant = 0): void {
    const group = new THREE.Group();
    group.position.set(x, roofY, z);
    group.scale.setScalar(scale);
    model.add(group);
    cylinder(group, terra, 0, 0.25, 0, 0.34, 0.22, 0.5, 7);
    cylinder(group, "#d98b65", 0, 0.49, 0, 0.38, 0.36, 0.13, 7);
    cylinder(group, "#725840", 0, 0.57, 0, 0.3, 0.3, 0.025, 7);
    if (variant === 1) {
      cylinder(group, "#81774c", 0, 1.05, 0, 0.07, 0.09, 1.02, 6);
      const canopy = rock(group, "#648c5b", 0, 1.57, 0, 0.62);
      canopy.scale.set(0.58, 0.7, 0.57);
      rock(group, "#7ea267", -0.3, 1.49, 0.14, 0.36);
      rock(group, "#90ad6e", 0.18, 1.87, 0.03, 0.32);
      rock(group, "#eec36a", 0.32, 1.57, 0.38, 0.08);
      rock(group, "#eec36a", -0.25, 1.65, 0.34, 0.075);
    } else {
      const greenery = plant(group, 0, 0, variant, 2.1);
      greenery.position.y = 0.55;
    }
  }
  pot(-6.92, -4.33, 1.45, 1);
  pot(-5.65, -4.4, 1.08, 2);
  pot(-4.53, -4.45, 0.88, 3);
  pot(6.65, -0.74, 1.1, 1);
  pot(6.8, 0.6, 0.83, 2);
  pot(-6.9, 4.16, 1.07, 3);
  pot(-5.91, 4.24, 0.7, 2);
  // A wooden workbench, empty clay pots and a little sack of seeds.
  box(model, "#be9369", -6.33, roofY + 0.65, -1.6, 1.9, 0.15, 0.92);
  for (const x of [-7.03, -5.63]) for (const z of [-1.93, -1.26]) box(model, "#a27e59", x, roofY + 0.3, z, 0.12, 0.61, 0.12);
  cylinder(model, terra, -6.71, roofY + 0.9, -1.58, 0.21, 0.15, 0.35, 7);
  cylinder(model, "#dc9c79", -6.14, roofY + 0.83, -1.66, 0.16, 0.12, 0.24, 7);
  const sack = rock(model, "#d7bb84", -6.42, roofY + 0.28, -0.51, 0.35);
  sack.scale.set(0.37, 0.45, 0.29);

  // Mei's fence supply: 24 one-metre planks, criss-crossed in layers of three.
  const pile = new THREE.Group();
  pile.position.set(-6.45, roofY, 0.55);
  pile.rotation.y = 0.12;
  model.add(pile);
  for (const z of [-0.36, 0.36]) box(pile, "#8b6a45", 0, 0.04, z, 1.1, 0.08, 0.14);
  const planks: THREE.Group[] = [];
  for (let i = 0; i < 24; i += 1) {
    const layer = Math.floor(i / 3);
    const offset = (i % 3 - 1) * 0.27;
    const along = layer % 2 === 0;
    const group = new THREE.Group();
    group.position.set(along ? 0 : offset, 0.13 + layer * 0.1, along ? offset : 0);
    group.userData.y = group.position.y;
    pile.add(group);
    box(group, (i + layer) % 3 === 0 ? "#d7a666" : (i + layer) % 3 === 1 ? "#c8924a" : "#deb377", 0, 0, 0, along ? 1.05 : 0.23, 0.09, along ? 0.23 : 1.05);
    planks.push(group);
  }
  let fenceLeft = 24;

  // Cloth bunting; gently sagging geometry, without a perpetual animation loop.
  const stringPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 24; i += 1) {
    const t = i / 24;
    stringPoints.push(new THREE.Vector3(-7 + t * 10.05, roofY + 2.5 - Math.sin(t * Math.PI) * 0.59, -4.75));
  }
  const stringGeometry = new THREE.BufferGeometry().setFromPoints(stringPoints);
  geometries.add(stringGeometry);
  const stringMaterial = new THREE.LineBasicMaterial({ color: "#8b7f63" });
  materials.add(stringMaterial);
  model.add(new THREE.Line(stringGeometry, stringMaterial));
  for (const x of [-7, 3.05]) box(model, "#8a9d80", x, roofY + 1.25, -4.75, 0.07, 2.5, 0.07);
  const flagColors = ["#dc967b", "#edcc84", "#83b5a6", "#d9b3a1"];
  for (let i = 1; i <= 11; i += 1) {
    const t = i / 12;
    const flagGeometry = new THREE.BufferGeometry();
    flagGeometry.setAttribute("position", new THREE.Float32BufferAttribute([-0.24, 0, 0, 0.24, 0, 0, 0, -0.43, 0], 3));
    flagGeometry.computeVertexNormals();
    geometries.add(flagGeometry);
    const flagMaterial = new THREE.MeshStandardMaterial({ color: flagColors[i % 4], side: THREE.DoubleSide, roughness: 1 });
    materials.add(flagMaterial);
    const flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(-7 + t * 10.05, roofY + 2.5 - Math.sin(t * Math.PI) * 0.59, -4.75);
    flag.castShadow = true;
    model.add(flag);
  }

  // Auntie Mei: faceted straw hat, small round glasses and a sage watering can.
  const mei = new THREE.Group();
  const meiStart = new THREE.Vector3(4.14, roofY, -1.7);
  const meiEnd = new THREE.Vector3(4.89, roofY, 2.66);
  mei.position.copy(meiStart);
  mei.rotation.y = Math.atan2(meiEnd.x - meiStart.x, meiEnd.z - meiStart.z);
  model.add(mei);
  cylinder(mei, "#438e84", 0, 0.68, 0, 0.29, 0.51, 1.05, 7);
  box(mei, "#d7e2c7", 0, 0.7, 0.28, 0.42, 0.64, 0.055);
  for (const x of [-0.19, 0.19]) {
    box(mei, "#b67f60", x, 0.16, 0, 0.15, 0.25, 0.16);
    box(mei, "#66756b", x, 0.05, 0.05, 0.21, 0.1, 0.29);
  }
  cylinder(mei, "#d6a580", 0, 1.25, 0, 0.11, 0.12, 0.18, 7);
  const head = rock(mei, "#e2b58d", 0, 1.5, 0, 0.3);
  head.scale.set(0.3, 0.32, 0.28);
  rock(mei, "#554b3d", 0, 1.57, -0.24, 0.15);
  cylinder(mei, "#d9b673", 0, 1.77, 0, 0.56, 0.56, 0.06, 9);
  cylinder(mei, "#e8c989", 0, 1.92, 0, 0.23, 0.33, 0.27, 8);
  cylinder(mei, "#ad8f62", 0, 1.8, 0, 0.33, 0.33, 0.05, 8);
  for (const x of [-0.105, 0.105]) {
    const glasses = mesh(mei, geometry("glasses", () => new THREE.TorusGeometry(0.082, 0.012, 4, 12)), "#6b6957", x, 1.53, 0.262);
    glasses.castShadow = false;
    const eye = rock(mei, "#4b4c41", x, 1.53, 0.275, 0.021);
    eye.castShadow = false;
  }
  box(mei, "#6b6957", 0, 1.53, 0.278, 0.06, 0.015, 0.013);
  rock(mei, "#c48866", 0, 1.42, 0.27, 0.026);
  beam(mei, "#dbac85", new THREE.Vector3(-0.29, 1.09, 0), new THREE.Vector3(-0.55, 0.76, 0.18), 0.15);
  beam(mei, "#dbac85", new THREE.Vector3(0.29, 1.09, 0), new THREE.Vector3(0.54, 0.87, 0.18), 0.15);
  cylinder(mei, "#79ac9b", 0.68, 0.63, 0.18, 0.24, 0.24, 0.43, 7);
  const handle = mesh(mei, geometry("watering-handle", () => new THREE.TorusGeometry(0.19, 0.035, 5, 12, Math.PI)), "#538e83", 0.68, 0.85, 0.18);
  handle.rotation.z = 0;
  beam(mei, "#79ac9b", new THREE.Vector3(0.86, 0.6, 0.18), new THREE.Vector3(1.15, 0.83, 0.18), 0.09);
  const nozzle = cylinder(mei, "#b3c7ac", 1.17, 0.85, 0.18, 0.1, 0.08, 0.07, 7);
  nozzle.rotation.z = -Math.PI / 4;
  // A pair of seed crates nearby helps distinguish Mei's work area from the plot.
  box(model, "#bd9564", 4.6, roofY + 0.22, 4.27, 0.95, 0.44, 0.63);
  for (let i = 0; i < 3; i += 1) box(model, "#d7b887", 4.27 + i * 0.33, roofY + 0.25, 4.6, 0.2, 0.33, 0.045);
  rock(model, "#b0c078", 4.4, roofY + 0.53, 4.2, 0.18);
  rock(model, "#e0b75e", 4.78, roofY + 0.53, 4.25, 0.17);

  // A tiny illustrated plaque is readable at the larger desktop view.
  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 512;
  labelCanvas.height = 128;
  const labelContext = labelCanvas.getContext("2d");
  if (labelContext) {
    labelContext.fillStyle = "#f4e8cf";
    labelContext.fillRect(0, 0, 512, 128);
    labelContext.fillStyle = "#356965";
    labelContext.font = "bold 43px sans-serif";
    labelContext.textAlign = "center";
    labelContext.fillText("MEI’S ROOFTOP", 256, 81);
    const texture = new THREE.CanvasTexture(labelCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    textures.add(texture);
    const labelMaterial = new THREE.MeshBasicMaterial({ map: texture });
    materials.add(labelMaterial);
    const plaque = new THREE.Mesh(geometry("plaque", () => new THREE.PlaneGeometry(2.56, 0.64)), labelMaterial);
    plaque.position.set(4.84, roofY + 1.9, -2.02);
    model.add(plaque);
  }

  const garden = new THREE.Group();
  garden.position.set(-1.6, roofY + 0.015, 0.2);
  model.add(garden);
  const unit = 0.65;
  let currentLength = 8;
  let currentWidth = 4;
  let currentStage: "meet" | "build" | "compare" | "transfer" | "complete" = "meet";
  let interactive = false;
  let resizeGarden: ((length: number, width: number) => void) | undefined;
  let cropGroup: THREE.Group | null = null;
  let destroyed = false;
  let isVisible = true;
  let renderId = 0;
  let plantToken = 0;
  let meiListener: ((x: number, y: number) => void) | null = null;
  /** Running animations. Each returns true when it has finished. */
  const anims = new Set<(now: number) => boolean>();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // These controls are actual raycastable 3D assets. The DOM markers simply make
  // their screen positions and dimension values readable at every pixel density.
  type DragAxis = "length" | "width" | "corner";
  const controls = new THREE.Group();
  controls.position.copy(garden.position);
  controls.visible = false;
  model.add(controls);
  const handles = new Map<DragAxis, THREE.Mesh>();
  const hitMeshes: THREE.Mesh[] = [];
  const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });
  materials.add(hitMaterial);
  const handleGeometry = geometry("garden-handle", () => new THREE.SphereGeometry(1, 10, 8));
  const hitGeometry = geometry("garden-hit-target", () => new THREE.SphereGeometry(0.42, 8, 6));
  const previousPosition = host.style.position;
  if (window.getComputedStyle(host).position === "static") host.style.position = "relative";
  const overlay = document.createElement("div");
  overlay.className = "rooftop-overlay";
  overlay.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden;";
  overlay.setAttribute("aria-hidden", "true");
  host.append(overlay);
  const markers = new Map<DragAxis, HTMLSpanElement>();
  for (const axis of ["length", "width", "corner"] as const) {
    const color = axis === "corner" ? "#e6b654" : "#1f7a6d";
    const knob = mesh(controls, handleGeometry, color, 0, 0.58, 0);
    knob.scale.setScalar(axis === "corner" ? 0.24 : 0.21);
    handles.set(axis, knob);
    const hit = new THREE.Mesh(hitGeometry, hitMaterial);
    hit.userData.axis = axis;
    controls.add(hit);
    hitMeshes.push(hit);
    const marker = document.createElement("span");
    marker.className = "rooftop-drag-handle";
    marker.dataset.axis = axis;
    marker.style.cssText = `position:absolute;display:grid;place-items:center;width:36px;height:36px;transform:translate(-50%,-50%);border:2px solid #fff9e8;border-radius:50%;background:${color};color:#fffdf4;font:700 19px/1 sans-serif;box-shadow:0 3px 12px #24483830;`;
    marker.textContent = axis === "corner" ? "⤢" : axis === "length" ? "↔" : "↕";
    overlay.append(marker);
    markers.set(axis, marker);
  }
  const lengthLabel = document.createElement("span");
  const widthLabel = document.createElement("span");
  for (const [axis, label] of [["length", lengthLabel], ["width", widthLabel]] as const) {
    label.className = "rooftop-dimension";
    label.dataset.axis = axis;
    label.style.cssText = "position:absolute;padding:7px 12px;border-radius:9px;transform:translate(-50%,-50%);background:#fff9eeeF;box-shadow:0 2px 12px #25453918;color:#185e54;font:700 15px/1.15 sans-serif;white-space:nowrap;";
    overlay.append(label);
  }
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(garden.position.y + 0.58));
  const planePoint = new THREE.Vector3();
  let drag: { axis: DragAxis; pointerId: number; start: THREE.Vector3; length: number; width: number } | null = null;

  function updateControlPositions(): void {
    const lx = currentLength * unit;
    const wz = currentWidth * unit;
    handles.get("length")!.position.set(lx / 2, 0.58, 0);
    handles.get("width")!.position.set(0, 0.58, wz / 2);
    handles.get("corner")!.position.set(lx / 2, 0.58, wz / 2);
    for (const hit of hitMeshes) hit.position.copy(handles.get(hit.userData.axis as DragAxis)!.position);
    lengthLabel.textContent = `${currentLength} m`;
    widthLabel.textContent = `${currentWidth} m`;
  }
  const projectedPoint = new THREE.Vector3();
  function placeOverlay(item: HTMLElement, worldPoint: THREE.Vector3, offsetY = 0): void {
    projectedPoint.copy(worldPoint).project(camera);
    const x = (projectedPoint.x + 1) * canvas.clientWidth / 2;
    const y = (1 - projectedPoint.y) * canvas.clientHeight / 2 + offsetY;
    item.style.left = `${x}px`;
    item.style.top = `${y}px`;
  }
  function updateOverlay(): void {
    model.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    overlay.style.display = interactive ? "block" : "none";
    if (!interactive) return;
    for (const [axis, knob] of handles) {
      placeOverlay(markers.get(axis)!, knob.getWorldPosition(new THREE.Vector3()));
    }
    const lengthMidpoint = new THREE.Vector3(0, 0.3, -currentWidth * unit / 2 - 0.27);
    const widthMidpoint = new THREE.Vector3(-currentLength * unit / 2 - 0.35, 0.3, 0);
    placeOverlay(lengthLabel, garden.localToWorld(lengthMidpoint), -10);
    placeOverlay(widthLabel, garden.localToWorld(widthMidpoint), 3);
  }

  function pointRay(event: PointerEvent): void {
    const bounds = canvas.getBoundingClientRect();
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
  }
  function pickHandle(event: PointerEvent): THREE.Intersection<THREE.Object3D> | undefined {
    const hits = raycaster.intersectObjects(hitMeshes, false);
    const bounds = canvas.getBoundingClientRect();
    let nearest: THREE.Intersection<THREE.Object3D> | undefined;
    let nearestDistance = Infinity;
    // Touch targets overlap on one-metre plots. Prefer the visible handle nearest
    // the pointer rather than whichever enlarged sphere is nearer the camera.
    for (const hit of hits) {
      const knob = handles.get(hit.object.userData.axis as DragAxis)!;
      knob.getWorldPosition(projectedPoint).project(camera);
      const x = bounds.left + (projectedPoint.x + 1) * bounds.width / 2;
      const y = bounds.top + (1 - projectedPoint.y) * bounds.height / 2;
      const distance = (event.clientX - x) ** 2 + (event.clientY - y) ** 2;
      if (distance < nearestDistance) { nearestDistance = distance; nearest = hit; }
    }
    return nearest;
  }
  function onPointerDown(event: PointerEvent): void {
    if (!interactive || event.button !== 0) return;
    pointRay(event);
    const hit = pickHandle(event);
    if (!hit || !raycaster.ray.intersectPlane(dragPlane, planePoint)) return;
    event.preventDefault();
    drag = {
      axis: hit.object.userData.axis as DragAxis,
      pointerId: event.pointerId,
      start: garden.worldToLocal(planePoint.clone()),
      length: currentLength,
      width: currentWidth,
    };
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = "grabbing";
    host.classList.add("rooftop-dragging");
  }
  function onPointerMove(event: PointerEvent): void {
    if (!interactive) return;
    pointRay(event);
    if (!drag) {
      canvas.style.cursor = pickHandle(event) ? "grab" : "default";
      return;
    }
    if (event.pointerId !== drag.pointerId || !raycaster.ray.intersectPlane(dragPlane, planePoint)) return;
    event.preventDefault();
    const local = garden.worldToLocal(planePoint.clone());
    // The plot grows symmetrically about its fixed centre, keeping it on the roof.
    // Starting with pointer deltas avoids a jump when a handle is grabbed off-centre.
    const length = drag.axis === "width" ? drag.length : Math.max(1, Math.min(11, Math.round(drag.length + 2 * (local.x - drag.start.x) / unit)));
    const width = drag.axis === "length" ? drag.width : Math.max(1, Math.min(11, Math.round(drag.width + 2 * (local.z - drag.start.z) / unit)));
    if (length === currentLength && width === currentWidth) return;
    updateGarden(length, width, false);
    resizeGarden?.(length, width);
  }
  function finishDrag(): void {
    const pointerId = drag?.pointerId;
    drag = null;
    if (pointerId !== undefined && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
    canvas.style.cursor = interactive ? "grab" : "default";
    host.classList.remove("rooftop-dragging");
  }
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", finishDrag);
  canvas.addEventListener("pointercancel", finishDrag);
  canvas.addEventListener("lostpointercapture", finishDrag);

  const meiHead = new THREE.Vector3();
  function render(): void {
    if (destroyed || !isVisible || document.hidden) return;
    updateOverlay();
    renderer.render(scene, camera);
    if (meiListener) {
      mei.localToWorld(meiHead.set(0, 2.25, 0)).project(camera);
      meiListener((meiHead.x + 1) * canvas.clientWidth / 2, (1 - meiHead.y) * canvas.clientHeight / 2);
    }
  }
  function loop(now: number): void {
    renderId = 0;
    if (destroyed) return;
    anims.forEach((step) => { if (step(now)) anims.delete(step); });
    render();
    if (anims.size && isVisible && !document.hidden) renderId = requestAnimationFrame(loop);
  }
  function run(step: (now: number) => boolean): void {
    anims.add(step);
    if (!renderId && isVisible && !document.hidden) renderId = requestAnimationFrame(loop);
  }
  function pause(): void {
    if (renderId) cancelAnimationFrame(renderId);
    renderId = 0;
  }
  function resume(): void {
    if (anims.size && !renderId) renderId = requestAnimationFrame(loop);
    else render();
  }
  const backOut = (p: number): number => 1 + 2.7 * (p - 1) ** 3 + 1.7 * (p - 1) ** 2;

  function walkIn(onDone?: () => void): void {
    const face = Math.atan2(meiEnd.x - meiStart.x, meiEnd.z - meiStart.z);
    if (reducedMotion.matches) {
      mei.position.copy(meiEnd);
      mei.rotation.set(0, 0.25, 0);
      render();
      onDone?.();
      return;
    }
    mei.position.copy(meiStart);
    mei.rotation.set(0, face, 0);
    let t0 = 0;
    run((now) => {
      if (!t0) t0 = now;
      const p = Math.min(1, (now - t0) / 2400);
      const eased = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
      mei.position.lerpVectors(meiStart, meiEnd, eased);
      mei.position.y = roofY + Math.abs(Math.sin(p * Math.PI * 7)) * 0.1 * (1 - p);
      mei.rotation.z = Math.sin(p * Math.PI * 7) * 0.06 * (1 - p);
      // Turn to face the student over the last part of the walk.
      mei.rotation.y = face + (0.25 - face) * Math.max(0, (p - 0.75) / 0.25);
      if (p < 1) return false;
      mei.position.copy(meiEnd);
      mei.rotation.set(0, 0.25, 0);
      onDone?.();
      return true;
    });
  }

  function hop(): void {
    if (reducedMotion.matches) return;
    let t0 = 0;
    run((now) => {
      if (!t0) t0 = now;
      const p = Math.min(1, (now - t0) / 380);
      mei.position.y = roofY + Math.sin(p * Math.PI) * 0.22;
      return p >= 1;
    });
  }

  function plantSeeds(seeds: number, onPlant: (planted: number) => void, onDone: (planted: number) => void): void {
    updateGarden(currentLength, currentWidth, false);
    const lx = currentLength * unit;
    const wz = currentWidth * unit;
    const cells: [number, number][] = [];
    for (let row = 0; row < currentWidth; row += 1) {
      for (let column = 0; column < currentLength; column += 1) cells.push([-lx / 2 + (column + 0.5) * unit, -wz / 2 + (row + 0.5) * unit]);
    }
    const total = Math.max(0, Math.min(seeds, cells.length));
    const token = ++plantToken;
    if (reducedMotion.matches || total === 0) {
      cells.slice(0, total).forEach(([x, z], i) => plant(cropGroup!, x, z, i * 7, 1.25));
      render();
      onPlant(total);
      onDone(total);
      return;
    }
    const gap = Math.max(70, Math.min(240, 3000 / total));
    const growing: { item: THREE.Group; t0: number }[] = [];
    let start = 0;
    let planted = 0;
    run((now) => {
      if (token !== plantToken || !cropGroup) return true;
      if (!start) start = now;
      const due = Math.min(total, Math.floor((now - start) / gap) + 1);
      while (planted < due) {
        const [x, z] = cells[planted]!;
        const item = plant(cropGroup, x, z, planted * 7, 1.25);
        item.scale.setScalar(0.01);
        growing.push({ item, t0: now });
        planted += 1;
        onPlant(planted);
      }
      for (let i = growing.length - 1; i >= 0; i -= 1) {
        const p = Math.min(1, (now - growing[i]!.t0) / 320);
        growing[i]!.item.scale.setScalar(Math.max(0.01, 1.25 * backOut(p)));
        if (p >= 1) growing.splice(i, 1);
      }
      if (planted < total || growing.length) return false;
      onDone(total);
      return true;
    });
  }
  function setFenceLeft(metres: number): void {
    const target = Math.max(0, Math.min(planks.length, Math.round(metres)));
    if (destroyed || target === fenceLeft) return;
    fenceLeft = target;
    planks.forEach((group, i) => {
      const show = i < target;
      if (show === (group.userData.shown ?? true)) return;
      group.userData.shown = show;
      const token = (group.userData.token = ((group.userData.token as number | undefined) ?? 0) + 1);
      const y = group.userData.y as number;
      if (reducedMotion.matches) { group.visible = show; return; }
      group.visible = true;
      let t0 = 0;
      run((now) => {
        if (group.userData.token !== token) return true;
        if (!t0) t0 = now;
        const p = Math.min(1, (now - t0) / 280);
        group.scale.setScalar(Math.max(0.01, show ? backOut(p) : 1 - p));
        group.position.y = show ? y : y + p * 0.6;
        if (p < 1) return false;
        group.visible = show;
        group.scale.setScalar(1);
        group.position.y = y;
        return true;
      });
    });
    render();
  }

  function resize(): void {
    if (destroyed) return;
    const bounds = host.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height || 400));
    const aspect = width / height;
    // Frame the garden and its immediate rooftop, not the entire city skyline.
    // The lens stays still while dragging so world-space movement remains stable.
    const frameWidth = currentStage === "meet" ? 12.8 : 10.6;
    const frameHeight = currentStage === "meet" ? 9.2 : 7.3;
    const halfHeight = Math.max(frameHeight / 2, frameWidth / (2 * aspect));
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    render();
  }

  function updateGarden(length: number, width: number, harvest: boolean): void {
    if (destroyed) return;
    plantToken += 1;
    garden.clear();
    const safeLength = Number.isFinite(length) ? Math.max(1, Math.min(11, Math.round(length))) : 6;
    const safeWidth = Number.isFinite(width) ? Math.max(1, Math.min(11, Math.round(width))) : 6;
    // Keep the changing plot readable at card size while reserving the rooftop's
    // paths and work area, even at the widest selectable dimensions.
    currentLength = safeLength;
    currentWidth = safeWidth;
    updateControlPositions();
    const lx = safeLength * unit;
    const wz = safeWidth * unit;
    box(garden, "#bca37a", 0, 0.065, 0, lx + 0.22, 0.13, wz + 0.22);
    box(garden, "#826344", 0, 0.145, 0, lx, 0.1, wz);
    // Small inset grid markers: one plot cell represents one square metre.
    for (let column = 0; column <= safeLength; column += 1) box(garden, "#967754", -lx / 2 + column * unit, 0.202, 0, 0.018, 0.012, wz);
    for (let row = 0; row <= safeWidth; row += 1) box(garden, "#967754", 0, 0.202, -wz / 2 + row * unit, lx, 0.012, 0.018);
    const fence = "#d9bb83";
    const post = (x: number, z: number): void => {
      box(garden, fence, x, 0.37, z, 0.06, 0.46, 0.06);
      cylinder(garden, "#e7cc9c", x, 0.62, z, 0, 0.052, 0.08, 4);
    };
    for (let i = 0; i <= safeLength; i += 1) {
      const x = -lx / 2 + i * unit;
      post(x, -wz / 2);
      post(x, wz / 2);
    }
    for (let i = 1; i < safeWidth; i += 1) {
      const z = -wz / 2 + i * unit;
      post(-lx / 2, z);
      post(lx / 2, z);
    }
    for (const y of [0.34, 0.52]) {
      for (const z of [-wz / 2, wz / 2]) box(garden, fence, 0, y, z, lx + 0.05, 0.038, 0.035);
      for (const x of [-lx / 2, lx / 2]) box(garden, fence, x, y, 0, 0.035, 0.038, wz + 0.05);
    }
    cropGroup = new THREE.Group();
    cropGroup.position.y = 0.22;
    garden.add(cropGroup);
    if (harvest) {
      for (let column = 0; column < safeLength; column += 1) {
        for (let row = 0; row < safeWidth; row += 1) {
          plant(cropGroup, -lx / 2 + (column + 0.5) * unit, -wz / 2 + (row + 0.5) * unit, column * 13 + row, 1.25);
        }
      }
    } else {
      for (let column = 0; column < safeLength; column += 1) {
        for (let row = 0; row < safeWidth; row += 1) {
          cylinder(cropGroup, "#ae8c5f", -lx / 2 + (column + 0.5) * unit, 0.004, -wz / 2 + (row + 0.5) * unit, 0.026, 0.026, 0.008, 5);
        }
      }
    }
    canvas.setAttribute("aria-label", `Auntie Mei’s rooftop. The garden is ${safeLength} by ${safeWidth} metres${harvest ? `, growing ${safeLength * safeWidth} plants` : ", ready to plant"}.`);
    render();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const visibilityObserver = new IntersectionObserver((entries) => {
    isVisible = entries.some((entry) => entry.isIntersecting);
    if (!isVisible) pause();
    else resume();
  }, { rootMargin: "100px" });
  visibilityObserver.observe(host);
  const onVisibility = (): void => {
    if (document.hidden) pause();
    else resume();
  };
  document.addEventListener("visibilitychange", onVisibility);
  const onMotion = (): void => render();
  reducedMotion.addEventListener("change", onMotion);
  resize();
  updateGarden(8, 4, false);

  return {
    updateGarden,
    walkIn,
    hop,
    plantSeeds,
    setFenceLeft,
    onMeiMove(listener) {
      meiListener = listener;
      render();
    },
    setStage(stage) {
      currentStage = stage;
      if (stage !== "meet") mei.rotation.y = stage === "complete" ? -0.18 : 0.25;
      resize();
    },
    setInteractive(enabled, onResize) {
      if (destroyed) return;
      interactive = enabled;
      resizeGarden = onResize;
      controls.visible = enabled;
      canvas.style.pointerEvents = enabled ? "auto" : "none";
      canvas.style.touchAction = enabled ? "none" : "auto";
      canvas.style.cursor = enabled ? "grab" : "default";
      if (!enabled) finishDrag();
      updateControlPositions();
      render();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      pause();
      anims.clear();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reducedMotion.removeEventListener("change", onMotion);
      finishDrag();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", finishDrag);
      canvas.removeEventListener("pointercancel", finishDrag);
      canvas.removeEventListener("lostpointercapture", finishDrag);
      geometries.forEach((item) => item.dispose());
      materials.forEach((item) => item.dispose());
      textures.forEach((item) => item.dispose());
      renderer.dispose();
      canvas.remove();
      overlay.remove();
      host.style.position = previousPosition;
    },
  };
}
