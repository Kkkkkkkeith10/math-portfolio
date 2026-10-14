import * as THREE from "three";

export interface RooftopHandle {
  /** The small 3 m x 2 m demo plot used only while Mei is teaching perimeter and area. */
  updateGarden(length: number, width: number, harvest: boolean): void;
  setStage(stage: "meet" | "build" | "compare" | "complete"): void;
  /** Show the length and width labels on the demo plot, without a drag handle. */
  showLabels(enabled: boolean): void;
  /** The fence pile beside the workbench shows one plank per metre of fence still unused. */
  setFenceLeft(metres: number): void;
  /** Mei walks from the hut to the demo plot. */
  walkIn(onDone?: () => void): void;
  /** Mei walks to stand beside one of the three farm plots. */
  walkToFarm(index: number, onDone?: () => void): void;
  /** A small hop, used when Mei starts a new line. */
  hop(): void;
  /** Plant one seed per square on the demo plot, one at a time. */
  plantSeeds(seeds: number, onPlant: (planted: number) => void, onDone: (planted: number) => void): void;
  /** Draw a farm's fence as a path of up to four sides from the plot's corner. */
  beginDraw(index: number, options: DrawOptions): void;
  /** Fly planks from the pile onto the closed path, one per metre. Metres the pile can't cover stay dotted. */
  buildFence(index: number, onDone: (built: number) => void): void;
  /** Turn the finished fence into a farm and slide it to the middle of its plot. */
  settleFarm(index: number, onDone: () => void): void;
  /** Take a farm's fence down so it can be drawn again; the planks go back on the pile. */
  clearFarm(index: number): void;
  /** True while a farm can be drawn with a drag gesture (false on the no-WebGL fallback). */
  canDraw(): boolean;
  /**
   * Plant exactly count plants, one at a time. Squares left over get a dotted outline; plants with no
   * square left queue up in red outside the fence.
   */
  growFarm(index: number, count: number, onPlant: (planted: number) => void, onDone: () => void): void;
  /** Hide the other two farms and slide this one to the middle plot. */
  featureFarm(index: number, onDone: () => void): void;
  /** Rebuild the featured farm as each size in turn, with its area shown; the last one gets a crown. */
  showcaseAreas(sizes: { length: number; width: number }[], onDone: () => void): void;
  /** Show a finished farm's length and width labels, or hide them when index is null. */
  showFarmLabels(index: number | null): void;
  /** Show a farm and its patch of roof in black and white, so it reads as finished. */
  setFarmGrey(index: number, grey: boolean): void;
  /** Glide the camera to one farm, or pull back to see all three when index is null. */
  focusFarm(index: number | null): void;
  /** Hide and clear all three farm plots, ready to draw again. */
  resetFarms(): void;
  /** Called with Mei's head position in pixels, relative to the scene, whenever it changes. */
  onMeiMove(listener: (x: number, y: number, footY: number) => void): void;
  destroy(): void;
}

export interface DrawOptions {
  /** Dotted outline to trace, in metres. */
  guide: { length: number; width: number } | null;
  /** Metres of fence drawn so far. */
  onChange(drawn: number): void;
  /** The path has closed into a rectangle. Call buildFence next. */
  onClose(length: number, width: number): void;
}

const FARM_FENCE = 12;
const unit = 0.65;
const roofY = 1.38;

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
      showLabels: () => undefined,
      setFenceLeft: () => undefined,
      walkIn: (onDone) => onDone?.(),
      walkToFarm: (_index, onDone) => onDone?.(),
      hop: () => undefined,
      plantSeeds: (seeds, onPlant, onDone) => { const n = Math.min(seeds, squares); onPlant(n); onDone(n); },
      beginDraw: () => undefined,
      buildFence: (_index, onDone) => onDone(0),
      settleFarm: (_index, onDone) => onDone(),
      clearFarm: () => undefined,
      canDraw: () => false,
      growFarm: (_index, count, onPlant, onDone) => { onPlant(count); onDone(); },
      featureFarm: (_index, onDone) => onDone(),
      showcaseAreas: (_sizes, onDone) => onDone(),
      showFarmLabels: () => undefined,
      setFarmGrey: () => undefined,
      focusFarm: () => undefined,
      resetFarms: () => undefined,
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
  const cameraOffset = new THREE.Vector3(16, 24, 20);

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

  // Mei's fence supply: one-metre planks, criss-crossed in layers of three.
  const pile = new THREE.Group();
  pile.position.set(-6.45, roofY, 0.55);
  pile.rotation.y = 0.12;
  model.add(pile);
  for (const z of [-0.36, 0.36]) box(pile, "#8b6a45", 0, 0.04, z, 1.1, 0.08, 0.14);
  const planks: THREE.Group[] = [];
  for (let i = 0; i < FARM_FENCE; i += 1) {
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
  let fenceLeft = FARM_FENCE;

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
  // Seen from straight above, the bunting is just a line across the third plot, so it hides while a fence is drawn.
  const bunting = new THREE.Group();
  model.add(bunting);
  bunting.add(new THREE.Line(stringGeometry, stringMaterial));
  for (const x of [-7, 3.05]) box(bunting, "#8a9d80", x, roofY + 1.25, -4.75, 0.07, 2.5, 0.07);
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
    bunting.add(flag);
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

  /* ---------- The demo plot: Mei's fixed 3 m x 2 m teaching example ---------- */
  const garden = new THREE.Group();
  garden.position.set(-1.6, roofY + 0.015, 0.2);
  model.add(garden);
  let demoLength = 3;
  let demoWidth = 2;
  let demoCropGroup: THREE.Group | null = null;
  let labelsVisible = false;
  const demoLengthLabel = document.createElement("span");
  const demoWidthLabel = document.createElement("span");
  const previousPosition = host.style.position;
  if (window.getComputedStyle(host).position === "static") host.style.position = "relative";
  const overlay = document.createElement("div");
  overlay.className = "rooftop-overlay";
  overlay.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden;";
  overlay.setAttribute("aria-hidden", "true");
  host.append(overlay);
  for (const [axis, label] of [["length", demoLengthLabel], ["width", demoWidthLabel]] as const) {
    label.className = "rooftop-dimension";
    label.dataset.axis = axis;
    label.style.cssText = "position:absolute;padding:7px 12px;border-radius:9px;transform:translate(-50%,-50%);background:#fff9eeeF;box-shadow:0 2px 12px #25453918;color:#185e54;font:700 15px/1.15 sans-serif;white-space:nowrap;";
    overlay.append(label);
  }
  const projectedPoint = new THREE.Vector3();
  function placeOverlay(item: HTMLElement, worldPoint: THREE.Vector3, offsetY = 0): void {
    projectedPoint.copy(worldPoint).project(camera);
    const x = (projectedPoint.x + 1) * canvas.clientWidth / 2;
    const y = (1 - projectedPoint.y) * canvas.clientHeight / 2 + offsetY;
    item.style.left = `${x}px`;
    item.style.top = `${y}px`;
  }
  function renderDemo(length: number, width: number, harvest: boolean): void {
    garden.clear();
    demoLength = length;
    demoWidth = width;
    const lx = length * unit;
    const wz = width * unit;
    box(garden, "#bca37a", 0, 0.065, 0, lx + 0.22, 0.13, wz + 0.22);
    box(garden, "#826344", 0, 0.145, 0, lx, 0.1, wz);
    for (let column = 0; column <= length; column += 1) box(garden, "#b0916a", -lx / 2 + column * unit, 0.202, 0, 0.032, 0.014, wz);
    for (let row = 0; row <= width; row += 1) box(garden, "#b0916a", 0, 0.202, -wz / 2 + row * unit, lx, 0.014, 0.032);
    const fence = "#d9bb83";
    const post = (x: number, z: number): void => {
      box(garden, fence, x, 0.37, z, 0.06, 0.46, 0.06);
      cylinder(garden, "#e7cc9c", x, 0.62, z, 0, 0.052, 0.08, 4);
    };
    for (let i = 0; i <= length; i += 1) { const x = -lx / 2 + i * unit; post(x, -wz / 2); post(x, wz / 2); }
    for (let i = 1; i < width; i += 1) { const z = -wz / 2 + i * unit; post(-lx / 2, z); post(lx / 2, z); }
    for (const y of [0.34, 0.52]) {
      for (const z of [-wz / 2, wz / 2]) box(garden, fence, 0, y, z, lx + 0.05, 0.038, 0.035);
      for (const x of [-lx / 2, lx / 2]) box(garden, fence, x, y, 0, 0.035, 0.038, wz + 0.05);
    }
    demoCropGroup = new THREE.Group();
    demoCropGroup.position.y = 0.22;
    garden.add(demoCropGroup);
    if (harvest) {
      for (let column = 0; column < length; column += 1) {
        for (let row = 0; row < width; row += 1) plant(demoCropGroup, -lx / 2 + (column + 0.5) * unit, -wz / 2 + (row + 0.5) * unit, column * 13 + row, 1.25);
      }
    } else {
      for (let column = 0; column < length; column += 1) {
        for (let row = 0; row < width; row += 1) cylinder(demoCropGroup, "#ae8c5f", -lx / 2 + (column + 0.5) * unit, 0.004, -wz / 2 + (row + 0.5) * unit, 0.026, 0.026, 0.008, 5);
      }
    }
    render();
  }

  /* ---------- The three farm plots, one behind the other, each on its own patch of roof ---------- */
  const FARM_COUNT = 3;
  /** One metre of farm, in world units. Smaller than the demo plot so three equal plots fit front to back. */
  const fu = 0.5;
  /** Each plot holds a 6 m × 6 m drawing grid. */
  const GRID = 6;
  const PAD = 3.35;
  const padCentres = [3.375, -0.125, -3.625].map((z) => new THREE.Vector3(-1.325, roofY, z));
  const padInset = (PAD - GRID * fu) / 2;
  // Drawing starts at the plot's back-left grid corner (the top corner on screen); the grid runs +X and forward (+Z).
  const drawOrigin = (index: number): THREE.Vector3 => new THREE.Vector3(padCentres[index]!.x - PAD / 2 + padInset, roofY + 0.015, padCentres[index]!.z - PAD / 2 + padInset);
  const farmGroups = padCentres.map((_c, i) => { const g = new THREE.Group(); g.position.copy(drawOrigin(i)); g.visible = false; model.add(g); return g; });
  const farmPads = padCentres.map((centre) => {
    const pad = new THREE.Group();
    pad.position.copy(centre);
    pad.visible = false;
    model.add(pad);
    box(pad, "#d6c39d", 0, 0.035, 0, PAD + 0.14, 0.03, PAD + 0.14);
    box(pad, "#eadbbb", 0, 0.04, 0, PAD, 0.03, PAD);
    return pad;
  });
  const farmCrop: (THREE.Group | null)[] = [null, null, null];
  const farmDims: { length: number; width: number }[] = [{ length: 0, width: 0 }, { length: 0, width: 0 }, { length: 0, width: 0 }];

  const greyCache = new Map<THREE.Material, THREE.Material>();
  function greyOf(material: THREE.Material): THREE.Material {
    let grey = greyCache.get(material);
    if (!grey) {
      const colour = (material as THREE.MeshStandardMaterial).color ?? new THREE.Color("#999999");
      const light = colour.r * 0.2126 + colour.g * 0.7152 + colour.b * 0.0722;
      grey = new THREE.MeshStandardMaterial({ color: new THREE.Color(light, light, light), roughness: 0.95, metalness: 0, flatShading: true });
      materials.add(grey);
      greyCache.set(material, grey);
    }
    return grey;
  }
  const farmGrey = [false, false, false];
  function paintGrey(index: number): void {
    for (const part of [farmGroups[index]!, farmPads[index]!]) {
      part.traverse((item) => {
        if (!(item instanceof THREE.Mesh)) return;
        const original = (item.userData.colour as THREE.Material | undefined) ?? (item.material as THREE.Material);
        item.userData.colour = original;
        item.material = farmGrey[index] ? greyOf(original) : original;
      });
    }
  }

  /** The four grid directions, in metres: +X, front (+Z), -X, back (-Z). Opposite directions are two apart. */
  const sideDirs = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, -1)];
  interface Side { dir: number; len: number }
  /** End of a path of sides, in metres from the drawing origin. */
  function tipOf(sides: readonly Side[], count = sides.length): THREE.Vector3 {
    const point = new THREE.Vector3();
    for (let i = 0; i < count; i += 1) point.addScaledVector(sideDirs[sides[i]!.dir]!, sides[i]!.len);
    return point;
  }
  /** How many metres the grid allows in a direction from a point. */
  function room(from: THREE.Vector3, dir: number): number {
    const r = dir === 0 ? GRID - from.x : dir === 2 ? from.x : dir === 1 ? GRID - from.z : from.z;
    return Math.max(0, Math.round(r));
  }
  /** Every one-metre piece of a path, in path order, in world units. */
  function metresOf(sides: readonly Side[]): { from: THREE.Vector3; dir: THREE.Vector3 }[] {
    const pieces: { from: THREE.Vector3; dir: THREE.Vector3 }[] = [];
    const point = new THREE.Vector3();
    for (const side of sides) {
      const dir = sideDirs[side.dir]!;
      for (let i = 0; i < side.len; i += 1) {
        pieces.push({ from: point.clone().multiplyScalar(fu), dir });
        point.add(dir);
      }
    }
    return pieces;
  }
  function fenceSide(parent: THREE.Object3D, from: THREE.Vector3, dir: THREE.Vector3, metres: number): void {
    for (let i = 0; i <= metres; i += 1) {
      const p = from.clone().addScaledVector(dir, i * fu);
      box(parent, "#d9bb83", p.x, 0.37, p.z, 0.06, 0.46, 0.06);
      cylinder(parent, "#e7cc9c", p.x, 0.62, p.z, 0, 0.052, 0.08, 4);
    }
    const mid = from.clone().addScaledVector(dir, metres * fu / 2);
    const along = metres * fu + 0.05;
    for (const y of [0.34, 0.52]) box(parent, "#d9bb83", mid.x, y, mid.z, dir.x ? along : 0.035, 0.038, dir.z ? along : 0.035);
  }
  function dashes(parent: THREE.Object3D, from: THREE.Vector3, dir: THREE.Vector3, metres: number, material: THREE.Material, y = 0.07): void {
    for (let i = 0; i < metres * 2; i += 1) {
      const p = from.clone().addScaledVector(dir, (i + 0.5) * fu / 2);
      const dash = new THREE.Mesh(boxGeometry, material);
      dash.position.set(p.x, y, p.z);
      dash.scale.set(dir.x ? fu * 0.28 : 0.07, 0.02, dir.z ? fu * 0.28 : 0.07);
      parent.add(dash);
    }
  }

  const guideGroup = new THREE.Group();
  guideGroup.visible = false;
  model.add(guideGroup);
  const guideMaterial = new THREE.MeshBasicMaterial({ color: "#2f8577" });
  const shortMaterial = new THREE.MeshBasicMaterial({ color: "#d4573f" });
  materials.add(guideMaterial);
  materials.add(shortMaterial);
  /** A faint 1 m grid over the plot while a fence is being drawn. */
  const gridGroup = new THREE.Group();
  gridGroup.visible = false;
  model.add(gridGroup);
  const gridMaterial = new THREE.MeshBasicMaterial({ color: "#b7a47c", transparent: true, opacity: 0.38 });
  materials.add(gridMaterial);
  for (let i = 0; i <= GRID; i += 1) {
    for (const alongX of [true, false]) {
      const line = new THREE.Mesh(boxGeometry, gridMaterial);
      line.position.set(alongX ? GRID * fu / 2 : i * fu, 0.02, alongX ? i * fu : GRID * fu / 2);
      line.scale.set(alongX ? GRID * fu : 0.014, 0.004, alongX ? 0.014 : GRID * fu);
      gridGroup.add(line);
    }
  }
  function showGuide(index: number, guide: { length: number; width: number } | null): void {
    gridGroup.position.copy(drawOrigin(index));
    gridGroup.visible = true;
    guideGroup.clear();
    guideGroup.visible = !!guide;
    if (!guide) return;
    guideGroup.position.copy(drawOrigin(index));
    const sides: Side[] = [{ dir: 0, len: guide.length }, { dir: 1, len: guide.width }, { dir: 2, len: guide.length }, { dir: 3, len: guide.width }];
    sides.forEach((side, i) => dashes(guideGroup, tipOf(sides, i).multiplyScalar(fu), sideDirs[side.dir]!, side.len, guideMaterial));
  }

  function buildPlotInto(parent: THREE.Group, length: number, width: number, harvest: boolean): THREE.Group {
    parent.clear();
    const inner = new THREE.Group();
    inner.position.set(length * fu / 2, 0, width * fu / 2);
    parent.add(inner);
    const lx = length * fu;
    const wz = width * fu;
    box(inner, "#bca37a", 0, 0.065, 0, lx + 0.18, 0.13, wz + 0.18);
    box(inner, "#826344", 0, 0.145, 0, lx, 0.1, wz);
    for (let column = 0; column <= length; column += 1) box(inner, "#b0916a", -lx / 2 + column * fu, 0.202, 0, 0.028, 0.014, wz);
    for (let row = 0; row <= width; row += 1) box(inner, "#b0916a", 0, 0.202, -wz / 2 + row * fu, lx, 0.014, 0.028);
    fenceSide(inner, new THREE.Vector3(-lx / 2, 0, -wz / 2), sideDirs[0]!, length);
    fenceSide(inner, new THREE.Vector3(lx / 2, 0, -wz / 2), sideDirs[1]!, width);
    fenceSide(inner, new THREE.Vector3(lx / 2, 0, wz / 2), sideDirs[2]!, length);
    fenceSide(inner, new THREE.Vector3(-lx / 2, 0, wz / 2), sideDirs[3]!, width);
    const crop = new THREE.Group();
    crop.position.y = 0.22;
    inner.add(crop);
    for (let column = 0; column < length; column += 1) {
      for (let row = 0; row < width; row += 1) {
        if (harvest) plant(crop, -lx / 2 + (column + 0.5) * fu, -wz / 2 + (row + 0.5) * fu, column * 13 + row, cropScale);
        else cylinder(crop, "#ae8c5f", -lx / 2 + (column + 0.5) * fu, 0.004, -wz / 2 + (row + 0.5) * fu, 0.022, 0.022, 0.008, 5);
      }
    }
    return crop;
  }
  const cropScale = 1.25 * fu / unit;

  /* ---------- The draw handle: one reusable handle at the end of the side being drawn ---------- */
  const controls = new THREE.Group();
  controls.visible = false;
  model.add(controls);
  const handleGeometry = geometry("garden-handle", () => new THREE.SphereGeometry(1, 10, 8));
  const knob = mesh(controls, handleGeometry, "#e6b654", 0, 0.58, 0);
  knob.scale.setScalar(0.24);
  // The pen replaces the ball on screen; the knob stays as the point the pen's nib touches.
  knob.visible = false;
  const marker = document.createElement("span");
  marker.className = "rooftop-drag-handle";
  marker.style.cssText = "position:absolute;display:grid;width:46px;height:46px;transform:translate(-3px,-43px);filter:drop-shadow(0 3px 5px #24483850);pointer-events:none;";
  marker.innerHTML = `<svg viewBox="0 0 46 46" width="46" height="46" aria-hidden="true"><path d="M3 43 7 30 33 4a4 4 0 0 1 6 0l3 3a4 4 0 0 1 0 6L16 39z" fill="#e6b654" stroke="#24483a" stroke-width="2.5" stroke-linejoin="round"/><path d="M7 30l9 9" stroke="#24483a" stroke-width="2.5"/><path d="M28 9l9 9" stroke="#24483a" stroke-width="2.5"/><path d="M3 43l2.2-7.2 5 5z" fill="#24483a"/></svg>`;
  overlay.append(marker);
  const sideLabels = [0, 1, 2, 3].map((side) => {
    const label = document.createElement("span");
    label.className = "rooftop-dimension";
    label.dataset.axis = `side-${side + 1}`;
    label.style.cssText = "position:absolute;display:none;padding:6px 10px;border-radius:9px;transform:translate(-50%,-50%);background:#fff9eeeF;box-shadow:0 2px 12px #25453918;color:#185e54;font:700 14px/1.15 sans-serif;white-space:nowrap;";
    overlay.append(label);
    return label;
  });

  const previewGroup = new THREE.Group();
  model.add(previewGroup);

  interface DrawState {
    farm: number;
    sides: Side[];
    options: DrawOptions;
    /** Once the fence closes, the shape is fixed and only the labels stay. */
    closed: boolean;
    /** The direction the handle last moved in, for the arrow; null before anything is drawn. */
    arrow: number | null;
  }
  let draw: DrawState | null = null;
  let drag: { pointerId: number } | null = null;
  const used = (state: DrawState): number => state.sides.reduce((sum, side) => sum + side.len, 0);
  const handleLocal = (state: DrawState): THREE.Vector3 => tipOf(state.sides).multiplyScalar(fu).setY(0.58);
  const dirOf = (v: THREE.Vector3, alongX: boolean): number => alongX ? (v.x > 0 ? 0 : 2) : (v.z > 0 ? 1 : 3);

  /**
   * Move the tip of the path towards p (in metres). Dragging along the last side lengthens or shortens it;
   * shortening it to nothing removes it, so the side before can be edited again. Dragging across the
   * last side starts a new side, up to four.
   */
  function stepDrag(state: DrawState, p: THREE.Vector3): boolean {
    let changed = false;
    for (let guard = 0; guard < 8; guard += 1) {
      const tip = tipOf(state.sides);
      const v = p.clone().sub(tip);
      const last = state.sides[state.sides.length - 1];
      if (!last) {
        const alongX = Math.abs(v.x) >= Math.abs(v.z);
        const reach = Math.abs(alongX ? v.x : v.z);
        if (reach < 0.6) return changed;
        const dir = dirOf(v, alongX);
        const len = Math.min(Math.round(reach), room(tip, dir));
        if (len < 1) return changed;
        state.sides.push({ dir, len });
        state.arrow = dir;
        return true;
      }
      const d = sideDirs[last.dir]!;
      const alongX = d.x !== 0;
      const along = v.x * d.x + v.z * d.z;
      const across = alongX ? v.z : v.x;
      if (state.sides.length < 4 && Math.abs(across) >= 0.6 && Math.abs(across) > Math.abs(along) + 0.2) {
        const dir = dirOf(v, !alongX);
        const len = Math.min(Math.round(Math.abs(across)), room(tip, dir));
        if (len >= 1) {
          state.sides.push({ dir, len });
          state.arrow = dir;
          changed = true;
          continue;
        }
      }
      const base = tip.clone().addScaledVector(d, -last.len);
      const t = (p.x - base.x) * d.x + (p.z - base.z) * d.z;
      const len = Math.max(0, Math.min(room(base, last.dir), Math.round(t)));
      if (len === last.len) return changed;
      state.arrow = len > last.len ? last.dir : (last.dir + 2) % 4;
      if (len === 0) {
        state.sides.pop();
        changed = true;
        continue;
      }
      last.len = len;
      return true;
    }
    return changed;
  }
  const isClosed = (state: DrawState): boolean => state.sides.length === 4 && tipOf(state.sides).lengthSq() < 0.01;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(roofY + 0.015 + 0.58));
  const planePoint = new THREE.Vector3();

  function updateHandlePosition(): void {
    if (!draw) return;
    const group = farmGroups[draw.farm]!;
    const local = handleLocal(draw);
    controls.position.copy(group.position);
    knob.position.copy(local);
    placeOverlay(marker, group.localToWorld(local.clone()));
    // Labels sit outside the shape: away from the middle of everything drawn so far.
    const points = [new THREE.Vector3(), ...draw.sides.map((_s, i) => tipOf(draw!.sides, i + 1))];
    const centre = points.reduce((sum, p) => sum.add(p), new THREE.Vector3()).divideScalar(Math.max(1, points.length));
    sideLabels.forEach((label, i) => {
      const side = draw!.sides[i];
      if (!side) { label.style.display = "none"; return; }
      const dir = sideDirs[side.dir]!;
      const mid = tipOf(draw!.sides, i).addScaledVector(dir, side.len / 2);
      const out = dir.x !== 0 ? new THREE.Vector3(0, 0, mid.z - centre.z < -0.01 ? -1 : 1) : new THREE.Vector3(mid.x - centre.x < -0.01 ? -1 : 1, 0, 0);
      placeOverlay(label, group.localToWorld(mid.multiplyScalar(fu).addScaledVector(out, 0.42).setY(0.3)), -6);
      label.textContent = `${side.len} m`;
      label.style.display = "block";
    });
  }
  const lineMaterial = new THREE.MeshBasicMaterial({ color: "#24483a" });
  const pegRimMaterial = new THREE.MeshBasicMaterial({ color: "#24483a" });
  const pegMaterial = new THREE.MeshBasicMaterial({ color: "#f2c45f" });
  materials.add(lineMaterial);
  materials.add(pegRimMaterial);
  materials.add(pegMaterial);
  const pegGeometry = geometry("draw-peg", () => new THREE.CylinderGeometry(1, 1, 1, 16));
  function peg(x: number, z: number): void {
    const rim = new THREE.Mesh(pegGeometry, pegRimMaterial);
    rim.position.set(x, 0.1, z);
    rim.scale.set(0.085, 0.04, 0.085);
    const top = new THREE.Mesh(pegGeometry, pegMaterial);
    top.position.set(x, 0.125, z);
    top.scale.set(0.058, 0.02, 0.058);
    previewGroup.add(rim, top);
  }
  /** While drawing: a bold line with a round peg at every metre, so each metre can be counted. The fence is only built once the shape closes. */
  function renderDrawPreview(): void {
    if (!draw) return;
    previewGroup.clear();
    previewGroup.position.copy(drawOrigin(draw.farm));
    if (!draw.closed) {
      metresOf(draw.sides).forEach(({ from, dir }) => {
        const mid = from.clone().addScaledVector(dir, fu / 2);
        const line = new THREE.Mesh(boxGeometry, lineMaterial);
        line.position.set(mid.x, 0.08, mid.z);
        line.scale.set(dir.x ? fu : 0.075, 0.03, dir.z ? fu : 0.075);
        previewGroup.add(line);
        const end = from.clone().addScaledVector(dir, fu);
        peg(end.x, end.z);
      });
      peg(0, 0);
    }
    controls.visible = !draw.closed;
    updateHandlePosition();
    render();
  }
  function endDraw(): void {
    draw = null;
    drag = null;
    topDown = false;
    controls.visible = false;
    guideGroup.visible = false;
    gridGroup.visible = false;
    bunting.visible = true;
    previewGroup.clear();
    canvas.style.pointerEvents = "none";
    marker.style.display = "none";
    sideLabels.forEach((label) => { label.style.display = "none"; });
  }

  function pointRay(event: PointerEvent): void {
    const bounds = canvas.getBoundingClientRect();
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
  }
  function overHandle(event: PointerEvent): boolean {
    if (!draw) return false;
    const p = knob.getWorldPosition(new THREE.Vector3()).project(camera);
    const bounds = canvas.getBoundingClientRect();
    const x = bounds.left + (p.x + 1) / 2 * bounds.width;
    const y = bounds.top + (1 - p.y) / 2 * bounds.height;
    // Fingers need a bigger target than the drawn handle, especially when the phone camera is zoomed out.
    const reach = event.pointerType === "mouse" ? 26 : 44;
    return Math.hypot(event.clientX - x, event.clientY - y) <= reach;
  }
  function onPointerDown(event: PointerEvent): void {
    if (!draw || draw.closed || event.button !== 0) return;
    if (!overHandle(event)) return;
    event.preventDefault();
    drag = { pointerId: event.pointerId };
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = "grabbing";
    host.classList.add("rooftop-dragging");
  }
  function onPointerMove(event: PointerEvent): void {
    if (!draw || draw.closed) return;
    pointRay(event);
    if (!drag) { canvas.style.cursor = overHandle(event) ? "grab" : "default"; return; }
    if (event.pointerId !== drag.pointerId || !raycaster.ray.intersectPlane(dragPlane, planePoint)) return;
    event.preventDefault();
    const metres = farmGroups[draw.farm]!.worldToLocal(planePoint.clone()).divideScalar(fu);
    if (!stepDrag(draw, metres)) return;
    draw.options.onChange(used(draw));
    renderDrawPreview();
  }
  function finishDrag(): void {
    const wasDragging = drag !== null;
    const pointerId = drag?.pointerId;
    drag = null;
    if (pointerId !== undefined && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
    canvas.style.cursor = draw ? "grab" : "default";
    host.classList.remove("rooftop-dragging");
    if (!draw || !wasDragging || draw.closed || !isClosed(draw)) return;
    draw.closed = true;
    canvas.style.pointerEvents = "none";
    canvas.style.cursor = "default";
    renderDrawPreview();
    gridGroup.visible = false;
    bunting.visible = true;
    topDown = false;
    moveCamera(draw.farm);
    // The grid starts at a corner, so a closed four-sided path is always [0, L] × [0, W].
    const points = draw.sides.map((_s, i) => tipOf(draw!.sides, i + 1));
    const length = Math.round(Math.max(...points.map((p) => p.x)));
    const width = Math.round(Math.max(...points.map((p) => p.z)));
    draw.options.onClose(length, width);
  }
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", finishDrag);
  canvas.addEventListener("pointercancel", finishDrag);
  canvas.addEventListener("lostpointercapture", finishDrag);

  function updateOverlay(): void {
    model.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    const showDemo = labelsVisible;
    if (showDemo) {
      const lengthMid = new THREE.Vector3(0, 0.3, -demoWidth * unit / 2 - 1.25);
      const widthMid = new THREE.Vector3(-demoLength * unit / 2 - 1.35, 0.3, 0);
      placeOverlay(demoLengthLabel, garden.localToWorld(lengthMid), -18);
      placeOverlay(demoWidthLabel, garden.localToWorld(widthMid), 0);
      demoLengthLabel.textContent = `${demoLength} m`;
      demoWidthLabel.textContent = `${demoWidth} m`;
      demoLengthLabel.style.display = "block";
      demoWidthLabel.style.display = "block";
    } else {
      demoLengthLabel.style.display = "none";
      demoWidthLabel.style.display = "none";
    }
    marker.style.display = draw && !draw.closed ? "grid" : "none";
    if (draw) updateHandlePosition();
    else placeFarmLabels();
    placeAreaLabel();
  }
  let labelFarm: number | null = null;
  /** Length on the front edge, width on the right edge: the two sides facing the camera. */
  function placeFarmLabels(): void {
    sideLabels.forEach((label, i) => {
      if (labelFarm === null || i > 1) { label.style.display = "none"; return; }
      const { length, width } = farmDims[labelFarm]!;
      const at = i === 0 ? new THREE.Vector3(length * fu / 2, 0.3, width * fu + 0.42) : new THREE.Vector3(length * fu + 0.42, 0.3, width * fu / 2);
      placeOverlay(label, farmGroups[labelFarm]!.localToWorld(at), -6);
      label.textContent = `${i === 0 ? length : width} m`;
      label.style.display = "block";
    });
  }

  const meiHead = new THREE.Vector3();
  function render(): void {
    if (destroyed || !isVisible || document.hidden) return;
    updateOverlay();
    renderer.render(scene, camera);
    if (meiListener) {
      mei.localToWorld(meiHead.set(0, 2.25, 0)).project(camera);
      const headX = (meiHead.x + 1) * canvas.clientWidth / 2;
      const headY = (1 - meiHead.y) * canvas.clientHeight / 2;
      mei.localToWorld(meiHead.set(0, 0, 0)).project(camera);
      meiListener(headX, headY, (1 - meiHead.y) * canvas.clientHeight / 2);
    }
  }
  let destroyed = false;
  let isVisible = true;
  let renderId = 0;
  let plantToken = 0;
  let meiListener: ((x: number, y: number, footY: number) => void) | null = null;
  const anims = new Set<(now: number) => boolean>();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
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

  function walkTo(target: THREE.Vector3, onDone?: () => void, duration = 1400): void {
    const start = mei.position.clone();
    const face = Math.atan2(target.x - start.x, target.z - start.z);
    const startFace = mei.rotation.y;
    if (reducedMotion.matches) {
      mei.position.copy(target);
      mei.rotation.set(0, 0.25, 0);
      render();
      onDone?.();
      return;
    }
    let t0 = 0;
    run((now) => {
      if (!t0) t0 = now;
      const p = Math.min(1, (now - t0) / duration);
      const eased = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
      mei.position.lerpVectors(start, target, eased);
      mei.position.y = roofY + Math.abs(Math.sin(p * Math.PI * 7)) * 0.08 * (1 - p);
      mei.rotation.y = startFace + (face - startFace) * Math.min(1, p * 2.4);
      if (p < 1) return false;
      mei.position.copy(target);
      mei.rotation.set(0, 0.25, 0);
      onDone?.();
      return true;
    });
  }
  function walkIn(onDone?: () => void): void { walkTo(meiEnd, onDone, 2400); }
  function walkToFarm(index: number, onDone?: () => void): void {
    // On the left of the plot, so her speech bubble can hang above her without covering the farm.
    const spot = new THREE.Vector3(padCentres[index]!.x - PAD / 2 - 1.1, roofY, padCentres[index]!.z + 0.8);
    spot.y = roofY;
    walkTo(spot, onDone, Math.max(900, Math.min(2200, mei.position.distanceTo(spot) * 200)));
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
    renderDemo(demoLength, demoWidth, false);
    const lx = demoLength * unit;
    const wz = demoWidth * unit;
    const cells: [number, number][] = [];
    for (let row = 0; row < demoWidth; row += 1) for (let column = 0; column < demoLength; column += 1) cells.push([-lx / 2 + (column + 0.5) * unit, -wz / 2 + (row + 0.5) * unit]);
    const total = Math.max(0, Math.min(seeds, cells.length));
    const token = ++plantToken;
    if (reducedMotion.matches || total === 0) {
      cells.slice(0, total).forEach(([x, z], i) => plant(demoCropGroup!, x, z, i * 7, 1.25));
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
      if (token !== plantToken || !demoCropGroup) return true;
      if (!start) start = now;
      const due = Math.min(total, Math.floor((now - start) / gap) + 1);
      while (planted < due) {
        const [x, z] = cells[planted]!;
        const item = plant(demoCropGroup, x, z, planted * 7, 1.25);
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

  const spareMaterial = new THREE.MeshStandardMaterial({ color: "#d4573f", roughness: 0.9, flatShading: true });
  materials.add(spareMaterial);
  const MAX_SPARE = 12;
  function growFarm(index: number, count: number, onPlant: (planted: number) => void, onDone: () => void): void {
    const { length, width } = farmDims[index]!;
    const crop = buildPlotInto(farmGroups[index]!, length, width, false);
    farmCrop[index] = crop;
    paintGrey(index);
    farmGroups[index]!.visible = true;
    const lx = length * fu;
    const wz = width * fu;
    const cells: [number, number][] = [];
    for (let row = 0; row < width; row += 1) for (let column = 0; column < length; column += 1) cells.push([-lx / 2 + (column + 0.5) * fu, -wz / 2 + (row + 0.5) * fu]);
    crop.clear();
    // Plants with no square left queue up in red outside the front fence, on the roof.
    const spare = new THREE.Group();
    spare.position.y = 0.02;
    crop.parent!.add(spare);
    const columns = Math.max(3, length);
    const spots: { parent: THREE.Group; x: number; z: number; spare: boolean }[] = cells.slice(0, count).map(([x, z]) => ({ parent: crop, x, z, spare: false }));
    for (let i = 0; i < Math.min(MAX_SPARE, count - cells.length); i += 1) {
      spots.push({ parent: spare, x: -((columns - 1) * fu) / 2 + (i % columns) * fu, z: wz / 2 + 0.4 + Math.floor(i / columns) * fu, spare: true });
    }
    const place = (i: number): THREE.Group => {
      const spot = spots[i]!;
      const item = plant(spot.parent, spot.x, spot.z, i * 7, cropScale);
      if (spot.spare) item.traverse((part) => { if (part instanceof THREE.Mesh) part.material = spareMaterial; });
      return item;
    };
    // Squares the count didn't reach get a dotted outline.
    const outlineEmpty = (): void => {
      cells.slice(count).forEach(([x, z]) => {
        const corner = new THREE.Vector3(x - fu / 2, 0.01, z - fu / 2);
        const far = new THREE.Vector3(x + fu / 2, 0.01, z + fu / 2);
        dashes(crop, corner, sideDirs[0]!, 1, guideMaterial, 0.01);
        dashes(crop, corner, sideDirs[1]!, 1, guideMaterial, 0.01);
        dashes(crop, far, sideDirs[2]!, 1, guideMaterial, 0.01);
        dashes(crop, far, sideDirs[3]!, 1, guideMaterial, 0.01);
      });
    };
    const token = ++plantToken;
    if (reducedMotion.matches) {
      spots.forEach((_s, i) => place(i));
      outlineEmpty();
      onPlant(count);
      render();
      onDone();
      return;
    }
    const gap = Math.max(60, Math.min(260, 2400 / Math.max(1, count)));
    const growing: { item: THREE.Group; t0: number }[] = [];
    let start = 0;
    let counted = 0;
    run((now) => {
      if (token !== plantToken) return true;
      if (!start) start = now;
      const due = Math.min(count, Math.floor((now - start) / gap) + 1);
      while (counted < due) {
        if (counted < spots.length) {
          const item = place(counted);
          item.scale.setScalar(0.01);
          growing.push({ item, t0: now });
        }
        counted += 1;
        onPlant(counted);
      }
      for (let i = growing.length - 1; i >= 0; i -= 1) {
        const p = Math.min(1, (now - growing[i]!.t0) / 300);
        growing[i]!.item.scale.setScalar(Math.max(0.01, cropScale * backOut(p)));
        if (p >= 1) growing.splice(i, 1);
      }
      if (counted < count || growing.length) return false;
      outlineEmpty();
      onDone();
      return true;
    });
  }

  /** Hide the other farms and slide this one, with its patch of roof, to the middle plot. */
  let featured: number | null = null;
  function featureFarm(index: number, onDone: () => void): void {
    featured = index;
    const shift = padCentres[1]!.z - padCentres[index]!.z;
    const group = farmGroups[index]!;
    const pad = farmPads[index]!;
    const groupZ = group.position.z;
    const padZ = pad.position.z;
    farmGrey[index] = false;
    paintGrey(index);
    const others = [0, 1, 2].filter((i) => i !== index).flatMap((i) => [farmGroups[i]!, farmPads[i]!]);
    moveCamera(1);
    if (reducedMotion.matches) {
      others.forEach((part) => { part.visible = false; });
      group.position.z = groupZ + shift;
      pad.position.z = padZ + shift;
      render();
      onDone();
      return;
    }
    let t0 = 0;
    run((now) => {
      if (destroyed) return true;
      if (!t0) t0 = now;
      const fade = Math.min(1, (now - t0) / 450);
      others.forEach((part) => { part.scale.setScalar(Math.max(0.01, 1 - fade)); part.visible = fade < 1; });
      const p = Math.min(1, Math.max(0, (now - t0 - 300) / 900));
      const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
      group.position.z = groupZ + shift * e;
      pad.position.z = padZ + shift * e;
      group.position.y = roofY + 0.015 + Math.sin(p * Math.PI) * 0.2;
      if (p < 1) return false;
      onDone();
      return true;
    });
  }

  /* ---------- Showcase: one fence, rebuilt as each farm in turn, with a crown on the biggest area ---------- */
  const crown = new THREE.Group();
  crown.visible = false;
  scene.add(crown);
  const crownGold = new THREE.MeshStandardMaterial({ color: "#f2c14e", roughness: 0.35, metalness: 0.45, flatShading: true });
  const crownGem = new THREE.MeshStandardMaterial({ color: "#d4573f", roughness: 0.4, flatShading: true });
  materials.add(crownGold);
  materials.add(crownGem);
  {
    const band = new THREE.Mesh(geometry("crown-band", () => new THREE.CylinderGeometry(0.36, 0.32, 0.22, 10, 1, true)), crownGold);
    band.material.side = THREE.DoubleSide;
    crown.add(band);
    const spike = geometry("crown-spike", () => new THREE.ConeGeometry(0.09, 0.26, 5));
    const gem = geometry("crown-gem", () => new THREE.IcosahedronGeometry(0.045, 0));
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2;
      const point = new THREE.Mesh(spike, crownGold);
      point.position.set(Math.sin(a) * 0.33, 0.23, Math.cos(a) * 0.33);
      crown.add(point);
      const tip = new THREE.Mesh(gem, crownGem);
      tip.position.set(Math.sin(a) * 0.33, 0.38, Math.cos(a) * 0.33);
      crown.add(tip);
    }
    crown.traverse((part) => { if (part instanceof THREE.Mesh) part.castShadow = true; });
  }
  const areaLabel = document.createElement("span");
  areaLabel.style.cssText = "position:absolute;display:none;padding:8px 14px;border-radius:12px;transform:translate(-50%,-100%);background:#fffdf8;border:2px solid #24483a;box-shadow:0 8px 22px -10px #17342180;color:#24483a;font:700 17px/1.2 sans-serif;white-space:nowrap;transition:background .25s,color .25s;";
  overlay.append(areaLabel);
  let areaText: string | null = null;
  let areaWinner = false;
  function placeAreaLabel(): void {
    if (areaText === null || featured === null) { areaLabel.style.display = "none"; return; }
    const { length, width } = farmDims[featured]!;
    const above = farmGroups[featured]!.localToWorld(new THREE.Vector3(length * fu / 2, crown.visible ? 2.15 : 0.95, width * fu / 2));
    placeOverlay(areaLabel, above, -8);
    areaLabel.textContent = areaText;
    areaLabel.style.background = areaWinner ? "#f2c14e" : "#fffdf8";
    areaLabel.style.display = "block";
  }
  function showcaseAreas(sizes: { length: number; width: number }[], onDone: () => void): void {
    const index = featured;
    if (index === null || !sizes.length) { onDone(); return; }
    const group = farmGroups[index]!;
    const best = sizes.reduce((a, b) => (b.length * b.width > a.length * a.width ? b : a));
    labelFarm = index;
    const build = (size: { length: number; width: number }): void => {
      farmDims[index] = { ...size };
      farmCrop[index] = buildPlotInto(group, size.length, size.width, true);
      paintGrey(index);
      group.visible = true;
      group.position.set(padCentres[1]!.x - size.length * fu / 2, roofY + 0.015, padCentres[1]!.z - size.width * fu / 2);
      areaWinner = size === best;
      areaText = `${size.length * size.width} m²`;
      crown.visible = areaWinner;
    };
    const centre = (): THREE.Vector3 => group.localToWorld(new THREE.Vector3(farmDims[index]!.length * fu / 2, 1.45, farmDims[index]!.width * fu / 2));
    if (reducedMotion.matches) {
      build(sizes[sizes.length - 1]!);
      crown.position.copy(centre());
      render();
      onDone();
      return;
    }
    const SINK = 320;
    const RISE = 560;
    // Loops until the farms are reset; the biggest area stays up longest.
    const lengths = sizes.map((size) => SINK + RISE + (size === best ? 3400 : 1150));
    const cycle = lengths.reduce((a, b) => a + b, 0);
    let t0 = 0;
    let shown = -1;
    let told = false;
    run((now) => {
      if (destroyed || featured !== index) return true;
      if (!t0) t0 = now;
      const t = now - t0;
      let local = t % cycle;
      let step = 0;
      while (local >= lengths[step]!) { local -= lengths[step]!; step += 1; }
      if (local < SINK && step !== shown) {
        // The old fence sinks into the roof before the planks come back up in the new shape.
        group.scale.set(1, Math.max(0.01, 1 - local / SINK), 1);
        crown.visible = false;
        areaText = null;
        return false;
      }
      if (step !== shown) { build(sizes[step]!); shown = step; }
      const rise = Math.min(1, Math.max(0, (local - SINK) / RISE));
      group.scale.set(1, Math.max(0.01, backOut(rise)), 1);
      if (crown.visible) {
        const pop = Math.min(1, Math.max(0, (local - SINK - RISE * 0.6) / 420));
        crown.position.copy(centre()).add(new THREE.Vector3(0, 0.25 * (1 - pop) + Math.sin(now / 380) * 0.04, 0));
        crown.rotation.y = now / 900;
        crown.scale.setScalar(Math.max(0.01, backOut(pop)) * 1.15);
      }
      if (!told && areaWinner && local >= SINK + RISE + 700) { told = true; onDone(); }
      return false;
    });
  }

  function setFarmGrey(index: number, grey: boolean): void {
    farmGrey[index] = grey;
    paintGrey(index);
    render();
  }

  function resetFarms(): void {
    endDraw();
    labelFarm = null;
    featured = null;
    areaText = null;
    crown.visible = false;
    flyToken += 1;
    for (let i = 0; i < FARM_COUNT; i += 1) {
      farmGroups[i]!.clear();
      farmGroups[i]!.visible = false;
      farmGroups[i]!.position.copy(drawOrigin(i));
      farmGroups[i]!.scale.setScalar(1);
      farmPads[i]!.visible = false;
      farmPads[i]!.position.copy(padCentres[i]!);
      farmPads[i]!.scale.setScalar(1);
      farmCrop[i] = null;
      farmDims[i] = { length: 0, width: 0 };
      farmGrey[i] = false;
      paintGrey(i);
    }
    render();
  }

  function beginDraw(index: number, options: DrawOptions): void {
    farmPads[index]!.visible = true;
    farmGrey[index] = false;
    paintGrey(index);
    farmGroups[index]!.clear();
    farmGroups[index]!.position.copy(drawOrigin(index));
    farmGroups[index]!.visible = true;
    draw = { farm: index, sides: [], options, closed: false, arrow: null };
    showGuide(index, options.guide);
    canvas.style.pointerEvents = "auto";
    options.onChange(0);
    renderDrawPreview();
    bunting.visible = false;
    topDown = true;
    moveCamera(index);
  }

  let flyToken = 0;
  const plankMaterial = mat("#d7a666");
  function buildFence(index: number, onDone: (built: number) => void): void {
    const state = draw;
    if (!state || state.farm !== index) { onDone(0); return; }
    const group = farmGroups[index]!;
    group.clear();
    const pieces = metresOf(state.sides);
    const supply = Math.min(fenceLeft, pieces.length);
    const finish = (): void => {
      // Whatever the pile couldn't cover stays as a red dotted line.
      pieces.slice(supply).forEach(({ from, dir }) => dashes(group, from, dir, 1, shortMaterial, 0.09));
      render();
      onDone(supply);
    };
    if (reducedMotion.matches) {
      pieces.slice(0, supply).forEach(({ from, dir }) => fenceSide(group, from, dir, 1));
      setFenceLeft(fenceLeft - supply);
      finish();
      return;
    }
    const token = ++flyToken;
    const gap = Math.max(90, Math.min(170, 2000 / Math.max(1, supply)));
    const flight = 560;
    const flyers: { item: THREE.Mesh; from: THREE.Vector3; to: THREE.Vector3; turn0: number; turn1: number; t0: number; piece: number }[] = [];
    let launched = 0;
    let landed = 0;
    let start = 0;
    run((now) => {
      if (token !== flyToken || destroyed) { flyers.forEach((f) => f.item.removeFromParent()); return true; }
      if (!start) start = now;
      while (launched < supply && now - start >= launched * gap) {
        const plank = planks[fenceLeft - 1]!;
        const from = plank.getWorldPosition(new THREE.Vector3());
        plank.visible = false;
        plank.userData.shown = false;
        fenceLeft -= 1;
        const { from: at, dir } = pieces[launched]!;
        const to = group.localToWorld(at.clone().addScaledVector(dir, fu / 2).setY(0.45));
        const item = new THREE.Mesh(boxGeometry, plankMaterial);
        item.castShadow = true;
        item.position.copy(from);
        model.add(item);
        const across = plank.children[0] ? (plank.children[0] as THREE.Mesh).scale.x < 0.5 : false;
        flyers.push({ item, from, to, turn0: pile.rotation.y + (across ? Math.PI / 2 : 0), turn1: dir.x ? 0 : Math.PI / 2, t0: now, piece: launched });
        launched += 1;
      }
      for (let i = flyers.length - 1; i >= 0; i -= 1) {
        const f = flyers[i]!;
        const p = Math.min(1, (now - f.t0) / flight);
        const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
        f.item.position.lerpVectors(f.from, f.to, e);
        f.item.position.y += Math.sin(p * Math.PI) * 1.8;
        f.item.rotation.y = f.turn0 + (f.turn1 + Math.PI * 2 - f.turn0) * e;
        f.item.scale.set(1.05 + (fu - 1.05) * e, 0.09, 0.23 + (0.07 - 0.23) * e);
        if (p < 1) continue;
        f.item.removeFromParent();
        flyers.splice(i, 1);
        const { from, dir } = pieces[f.piece]!;
        fenceSide(group, from, dir, 1);
        landed += 1;
      }
      if (landed < supply) return false;
      finish();
      return true;
    });
  }

  function settleFarm(index: number, onDone: () => void): void {
    const state = draw;
    if (!state || state.farm !== index) { onDone(); return; }
    const points = state.sides.map((_s, i) => tipOf(state.sides, i + 1));
    const length = Math.round(Math.max(...points.map((p) => p.x)));
    const width = Math.round(Math.max(...points.map((p) => p.z)));
    farmDims[index] = { length, width };
    endDraw();
    const group = farmGroups[index]!;
    buildPlotInto(group, length, width, false);
    const from = group.position.clone();
    const to = padCentres[index]!.clone().add(new THREE.Vector3(-length * fu / 2, 0.015, -width * fu / 2));
    if (reducedMotion.matches) { group.position.copy(to); render(); onDone(); return; }
    let t0 = 0;
    run((now) => {
      if (!t0) t0 = now;
      const p = Math.min(1, (now - t0) / 700);
      const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
      group.position.lerpVectors(from, to, e);
      group.position.y = to.y + Math.sin(p * Math.PI) * 0.25;
      if (p < 1) return false;
      group.position.copy(to);
      onDone();
      return true;
    });
  }

  function clearFarm(index: number): void {
    flyToken += 1;
    if (draw?.farm === index) endDraw();
    farmGroups[index]!.clear();
    farmGroups[index]!.position.copy(drawOrigin(index));
    setFenceLeft(FARM_FENCE);
    render();
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

  /* ---------- Camera: a target point, how much of the roof to fit, and where on screen the target sits ---------- */
  /** top blends the usual 3D angle (0) into looking straight down (1), so a fence is drawn on a flat grid. */
  interface View { target: THREE.Vector3; frameWidth: number; frameHeight: number; x: number; y: number; top: number }
  type Focus = "meet" | "overview" | number;
  let focus: Focus = "meet";
  let topDown = false;
  let aspect = 1;
  let view: View | null = null;
  let viewToken = 0;
  let viewMoving = false;
  function viewFor(target: Focus): View {
    const phone = aspect < 0.9;
    if (target === "meet") return { target: new THREE.Vector3(-1.6, 1.88, 0.2), frameWidth: 12.8, frameHeight: 9.2, x: phone ? 0.5 : 0.44, y: phone ? 0.35 : 0.5, top: 0 };
    if (target === "overview") return { target: new THREE.Vector3(-1.6, roofY, -0.1), frameWidth: phone ? 11.5 : 13, frameHeight: phone ? 10 : 9.6, x: 0.5, y: phone ? 0.6 : 0.56, top: 0 };
    // Drawing: straight down onto the plot, filling the screen below Mei's docked speech bubble.
    if (topDown) return { target: padCentres[target]!.clone(), frameWidth: phone ? 4.3 : 5.6, frameHeight: phone ? 4.3 : 5.2, x: phone ? 0.5 : 0.56, y: phone ? 0.6 : 0.56, top: 1 };
    // A little closer than the opening view, the same for every plot. The plot sits right of and below centre,
    // leaving room on the left for Mei and her speech bubble above her.
    return { target: padCentres[target]!.clone().setY(roofY + 0.3), frameWidth: phone ? 6.4 : 8.4, frameHeight: phone ? 6 : 6.2, x: phone ? 0.6 : 0.62, y: phone ? 0.68 : 0.62, top: 0 };
  }
  const offsetLength = cameraOffset.length();
  const sideAzimuth = Math.atan2(cameraOffset.x, cameraOffset.z);
  const sideElevation = Math.asin(cameraOffset.y / offsetLength);
  // Just short of vertical, so the camera's up direction stays well defined and the grid stays square to the screen.
  const downElevation = Math.PI / 2 - 0.01;
  const viewOffset = new THREE.Vector3();
  function applyView(): void {
    if (!view) return;
    const halfHeight = Math.max(view.frameHeight / 2, view.frameWidth / (2 * aspect));
    const halfWidth = halfHeight * aspect;
    camera.left = -2 * view.x * halfWidth;
    camera.right = 2 * (1 - view.x) * halfWidth;
    camera.top = 2 * view.y * halfHeight;
    camera.bottom = -2 * (1 - view.y) * halfHeight;
    const azimuth = sideAzimuth * (1 - view.top);
    const elevation = sideElevation + (downElevation - sideElevation) * view.top;
    viewOffset.set(Math.sin(azimuth) * Math.cos(elevation), Math.sin(elevation), Math.cos(azimuth) * Math.cos(elevation)).multiplyScalar(offsetLength);
    camera.position.copy(view.target).add(viewOffset);
    camera.lookAt(view.target);
    camera.updateProjectionMatrix();
  }
  function moveCamera(target: Focus): void {
    focus = target;
    const to = viewFor(target);
    const token = ++viewToken;
    if (!view || reducedMotion.matches) {
      viewMoving = false;
      view = to;
      applyView();
      render();
      return;
    }
    const from = { ...view, target: view.target.clone() };
    viewMoving = true;
    let t0 = 0;
    run((now) => {
      if (token !== viewToken || destroyed) return true;
      if (!t0) t0 = now;
      const p = Math.min(1, (now - t0) / 1200);
      const e = p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
      const mix = (a: number, b: number): number => a + (b - a) * e;
      view = { target: from.target.clone().lerp(to.target, e), frameWidth: mix(from.frameWidth, to.frameWidth), frameHeight: mix(from.frameHeight, to.frameHeight), x: mix(from.x, to.x), y: mix(from.y, to.y), top: mix(from.top, to.top) };
      applyView();
      if (p < 1) return false;
      viewMoving = false;
      return true;
    });
  }
  function resize(): void {
    if (destroyed) return;
    const bounds = host.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height || 400));
    aspect = width / height;
    renderer.setSize(width, height, false);
    if (!viewMoving) view = viewFor(focus);
    applyView();
    render();
  }

  const resizeObserver = new ResizeObserver(() => resize());
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
  renderDemo(3, 2, false);

  return {
    updateGarden: renderDemo,
    walkIn,
    walkToFarm,
    hop,
    plantSeeds,
    setFenceLeft,
    beginDraw,
    buildFence,
    settleFarm,
    clearFarm,
    canDraw: () => true,
    growFarm,
    featureFarm,
    showcaseAreas,
    showFarmLabels(index) {
      labelFarm = index;
      render();
    },
    setFarmGrey,
    focusFarm: (index) => moveCamera(index ?? "overview"),
    resetFarms,
    onMeiMove(listener) {
      meiListener = listener;
      render();
    },
    setStage(stage) {
      garden.visible = stage === "meet";
      if (stage === "meet") moveCamera("meet");
      else if (stage !== "build") moveCamera("overview");
      render();
    },
    showLabels(enabled) {
      labelsVisible = enabled;
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

/** A small, independent, rotatable 3D preview of one finished farm, used in the comparison cards. */
export function mountFarmCard(host: HTMLElement, length: number, width: number): { destroy(): void } {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const canvas = renderer.domElement;
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.touchAction = "none";
  host.append(canvas);

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight("#fff6df", "#829b85", 2.2));
  const sun = new THREE.DirectionalLight("#ffefcc", 2.4);
  sun.position.set(-3, 6, 5);
  scene.add(sun);

  const materials: THREE.Material[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  geometries.push(boxGeometry);
  const cylinderCache = new Map<string, THREE.BufferGeometry>();
  const matCache = new Map<string, THREE.MeshStandardMaterial>();
  const mat = (color: string): THREE.MeshStandardMaterial => {
    const existing = matCache.get(color);
    if (existing) return existing;
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.92, flatShading: true });
    matCache.set(color, m);
    materials.push(m);
    return m;
  };
  const box = (parent: THREE.Object3D, color: string, x: number, y: number, z: number, sx: number, sy: number, sz: number): void => {
    const item = new THREE.Mesh(boxGeometry, mat(color));
    item.position.set(x, y, z);
    item.scale.set(sx, sy, sz);
    parent.add(item);
  };
  const cylinder = (parent: THREE.Object3D, color: string, x: number, y: number, z: number, top: number, bottom: number, height: number, sides = 6): void => {
    const key = `${top}-${bottom}-${height}-${sides}`;
    let shape = cylinderCache.get(key);
    if (!shape) { shape = new THREE.CylinderGeometry(top, bottom, height, sides); cylinderCache.set(key, shape); geometries.push(shape); }
    const item = new THREE.Mesh(shape, mat(color));
    item.position.set(x, y, z);
    parent.add(item);
  };
  const dodecahedron = new THREE.DodecahedronGeometry(1, 0);
  geometries.push(dodecahedron);
  const rock = (parent: THREE.Object3D, color: string, x: number, y: number, z: number, scale: number, sx = 1, sy = 1, sz = 1): void => {
    const item = new THREE.Mesh(dodecahedron, mat(color));
    item.position.set(x, y, z);
    item.scale.set(scale * sx, scale * sy, scale * sz);
    parent.add(item);
  };

  const plot = new THREE.Group();
  scene.add(plot);
  // Same scale and plot as on the roof, so all three cards are framed identically.
  const u = 0.5;
  const lx = length * u;
  const wz = width * u;
  box(plot, "#d6c39d", 0, -0.03, 0, 3.49, 0.03, 3.49);
  box(plot, "#eadbbb", 0, -0.01, 0, 3.35, 0.03, 3.35);
  box(plot, "#bca37a", 0, 0.065, 0, lx + 0.18, 0.13, wz + 0.18);
  box(plot, "#826344", 0, 0.145, 0, lx, 0.1, wz);
  for (let column = 0; column <= length; column += 1) box(plot, "#b0916a", -lx / 2 + column * u, 0.202, 0, 0.03, 0.014, wz);
  for (let row = 0; row <= width; row += 1) box(plot, "#b0916a", 0, 0.202, -wz / 2 + row * u, lx, 0.014, 0.03);
  const post = (x: number, z: number): void => { box(plot, "#d9bb83", x, 0.37, z, 0.055, 0.44, 0.055); cylinder(plot, "#e7cc9c", x, 0.6, z, 0, 0.05, 0.075, 4); };
  for (let i = 0; i <= length; i += 1) { const x = -lx / 2 + i * u; post(x, -wz / 2); post(x, wz / 2); }
  for (let i = 1; i < width; i += 1) { const z = -wz / 2 + i * u; post(-lx / 2, z); post(lx / 2, z); }
  for (const y of [0.33, 0.5]) {
    for (const z of [-wz / 2, wz / 2]) box(plot, "#d9bb83", 0, y, z, lx + 0.05, 0.035, 0.03);
    for (const x of [-lx / 2, lx / 2]) box(plot, "#d9bb83", x, y, 0, 0.03, 0.035, wz + 0.05);
  }
  for (let column = 0; column < length; column += 1) {
    for (let row = 0; row < width; row += 1) {
      const px = -lx / 2 + (column + 0.5) * u;
      const pz = -wz / 2 + (row + 0.5) * u;
      cylinder(plot, "#789757", px, 0.28, pz, 0.028, 0.032, 0.21, 5);
      const leafColors = ["#80a958", "#5f915a", "#9cbb6a"];
      const seed = column * 13 + row;
      for (let leaf = 0; leaf < 4; leaf += 1) {
        const angle = leaf * Math.PI / 2 + seed * 0.21;
        rock(plot, leafColors[(leaf + seed) % leafColors.length]!, px + Math.sin(angle) * 0.075, 0.38 + (leaf % 2) * 0.028, pz + Math.cos(angle) * 0.075, 0.11, 1.15, 0.65, 1.7);
      }
    }
  }

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  let azimuth = Math.PI * 0.22;
  const elevation = 0.62;
  const distance = 8.2;
  function placeCamera(): void {
    camera.position.set(Math.sin(azimuth) * distance * Math.cos(elevation), distance * Math.sin(elevation), Math.cos(azimuth) * distance * Math.cos(elevation));
    camera.lookAt(0, 0.15, 0);
  }
  placeCamera();

  let destroyed = false;
  function render(): void { if (!destroyed) renderer.render(scene, camera); }
  function resize(): void {
    const bounds = host.getBoundingClientRect();
    const size = Math.max(1, Math.round(Math.min(bounds.width, bounds.height || bounds.width)));
    camera.aspect = bounds.width / (bounds.height || bounds.width);
    camera.updateProjectionMatrix();
    renderer.setSize(Math.max(1, Math.round(bounds.width)), Math.max(1, Math.round(bounds.height || bounds.width)), false);
    void size;
    render();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();

  let dragId: number | null = null;
  let lastX = 0;
  const onDown = (event: PointerEvent): void => {
    dragId = event.pointerId;
    lastX = event.clientX;
    canvas.setPointerCapture(event.pointerId);
  };
  const onMove = (event: PointerEvent): void => {
    if (dragId !== event.pointerId) return;
    azimuth += (event.clientX - lastX) * 0.012;
    lastX = event.clientX;
    placeCamera();
    render();
  };
  const onUp = (event: PointerEvent): void => {
    if (dragId !== event.pointerId) return;
    dragId = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      renderer.dispose();
      canvas.remove();
    },
  };
}
