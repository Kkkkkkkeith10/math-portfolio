import * as THREE from "three";

export type SceneName = "dam" | "market" | "bakery";
export interface Diorama { destroy(): void }

interface Kit {
  root: THREE.Group;
  mat(c: string): THREE.MeshStandardMaterial;
  track(g: THREE.BufferGeometry): void;
  box(p: THREE.Object3D, c: string, x: number, y: number, z: number, sx: number, sy: number, sz: number): THREE.Mesh;
  cyl(p: THREE.Object3D, c: string, x: number, y: number, z: number, rt: number, rb: number, h: number, sides?: number): THREE.Mesh;
  ball(p: THREE.Object3D, c: string, x: number, y: number, z: number, r: number): THREE.Mesh;
  rock(p: THREE.Object3D, c: string, x: number, y: number, z: number, s: number): THREE.Mesh;
  person(p: THREE.Object3D, shirt: string, hat: string, x: number, z: number, turn: number): THREE.Group;
}
interface Built { tick?(t: number): void }

const GRASS = "#9cc98a";
const SOIL = "#c7a37a";
const CREAM = "#f4e8cf";
const TEAL = "#5b9f93";
const TERRA = "#c97556";
const GOLD = "#f2c14e";

function base(k: Kit, top = GRASS): void {
  k.box(k.root, SOIL, 0, -0.35, 0, 6.4, 0.7, 6.4);
  k.box(k.root, top, 0, 0.05, 0, 6.4, 0.12, 6.4);
}

const BUILD: Record<SceneName, (k: Kit) => Built> = {
  dam(k) {
    base(k);
    // Reservoir behind the wall, river in front.
    k.box(k.root, "#6fb7d6", 0, 0.14, -2.2, 6.2, 0.1, 1.9);
    const river = k.box(k.root, "#8fcbe3", 0.2, 0.13, 1.7, 1.1, 0.06, 3);
    k.rock(k.root, "#a9b49c", -2.7, 0.6, -0.8, 0.9);
    k.rock(k.root, "#b8c2a8", 2.8, 0.55, -0.9, 0.8);
    // Dam wall with a gap in the middle.
    k.box(k.root, "#d9d3c4", -1.55, 0.75, -1, 2.5, 1.3, 0.6);
    k.box(k.root, "#d9d3c4", 1.85, 0.75, -1, 1.9, 1.3, 0.6);
    k.box(k.root, "#b9b2a2", 0.2, 0.25, -1, 0.8, 0.3, 0.6);
    const drops: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i += 1) drops.push(k.box(k.root, "#9ad3ea", 0.05 + (i % 3) * 0.15, 0.6, -0.6, 0.12, 0.25, 0.12));
    // Plank with ruler marks, waiting to be measured.
    const plank = new THREE.Group();
    plank.position.set(1.5, 0.22, 1.3);
    plank.rotation.y = -0.4;
    k.root.add(plank);
    k.box(plank, "#e3b267", 0, 0, 0, 1.6, 0.14, 0.4);
    for (let i = 0; i < 9; i += 1) k.box(plank, "#7a5432", -0.72 + i * 0.18, 0.08, -0.12, 0.03, 0.02, i % 2 ? 0.1 : 0.18);
    k.person(k.root, TERRA, "#f2d49f", -1.2, 1.2, 0.5);
    k.cyl(k.root, "#e8e1cc", -2.2, 0.35, 2.1, 0.25, 0.3, 0.5, 6);
    return {
      tick(t) {
        drops.forEach((d, i) => {
          const p = (t * 0.9 + i / drops.length) % 1;
          d.position.set(0.05 + (i % 3) * 0.15, 0.75 - p * 0.55, -0.62 + p * 0.5);
        });
        (river.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.1 + 0.05 * Math.sin(t * 3);
        plank.position.y = 0.22 + Math.sin(t * 2) * 0.03;
      },
    };
  },

  market(k) {
    base(k, "#e8dcc2");
    for (let x = -2; x <= 2; x += 1) for (let z = -2; z <= 2; z += 1) if ((x + z) % 2 === 0) k.box(k.root, "#ddcfb2", x * 1.2, 0.12, z * 1.2, 1.18, 0.02, 1.18);
    const stall = new THREE.Group();
    stall.position.set(-0.3, 0, -0.6);
    k.root.add(stall);
    k.box(stall, "#b98a5e", 0, 0.55, 0, 3, 0.9, 1);
    k.box(stall, "#a0744c", 0, 1.02, 0, 3.1, 0.08, 1.1);
    for (const x of [-1.45, 1.45]) k.box(stall, "#8b6342", x, 1.45, -0.45, 0.1, 1.8, 0.1);
    for (let i = 0; i < 6; i += 1) k.box(stall, i % 2 ? CREAM : TERRA, -1.25 + i * 0.5, 2.35, -0.1, 0.5, 0.08, 1.4).rotation.x = 0.25;
    const fruit = ["#f08a3c", "#e2483d", "#9fcd5a"];
    for (let c = 0; c < 3; c += 1) {
      k.box(stall, "#d6a873", -1 + c, 1.18, 0.1, 0.8, 0.25, 0.6);
      for (let i = 0; i < 6; i += 1) k.ball(stall, fruit[c]!, -1.25 + c + (i % 3) * 0.25, 1.38, -0.05 + Math.floor(i / 3) * 0.25, 0.12);
    }
    k.box(stall, CREAM, 0, 1.9, 0.5, 1.2, 0.4, 0.06);
    k.box(stall, TEAL, 0, 1.9, 0.53, 0.5, 0.12, 0.02);
    const coins = new THREE.Group();
    coins.position.set(1.6, 0, 1.1);
    k.root.add(coins);
    for (let i = 0; i < 5; i += 1) k.cyl(coins, GOLD, 0, 0.2 + i * 0.09, 0, 0.28, 0.28, 0.08, 10);
    const spin = k.cyl(k.root, GOLD, 1.6, 1.2, 1.1, 0.3, 0.3, 0.07, 12);
    spin.rotation.x = Math.PI / 2;
    k.person(k.root, TEAL, "#24483a", -0.4, 0.9, Math.PI);
    k.person(k.root, "#e7b04a", TERRA, 0.7, 1.9, Math.PI + 0.6);
    return { tick(t) { spin.rotation.z = t * 2.5; spin.position.y = 1.2 + Math.sin(t * 3) * 0.08; } };
  },

  bakery(k) {
    base(k, "#cfe3c0");
    k.box(k.root, "#f0dfc0", 0, 0.75, 0, 2.6, 0.12, 1.8);
    for (const [x, z] of [[-1.1, -0.7], [1.1, -0.7], [-1.1, 0.7], [1.1, 0.7]] as const) k.box(k.root, "#b98a5e", x, 0.4, z, 0.12, 0.65, 0.12);
    const cake = new THREE.Group();
    cake.position.set(0, 0.82, 0);
    k.root.add(cake);
    const slices: THREE.Mesh[] = [];
    for (let i = 0; i < 8; i += 1) {
      const geo = new THREE.CylinderGeometry(0.75, 0.75, 0.42, 6, 1, false, (i * Math.PI) / 4, Math.PI / 4 - 0.04);
      const s = new THREE.Mesh(geo, k.mat(i % 2 ? "#f6c6cf" : "#f3d9a4"));
      k.track(geo);
      s.position.y = 0.21;
      s.castShadow = true;
      cake.add(s);
      slices.push(s);
    }
    k.cyl(cake, "#fff6ea", 0, 0.45, 0, 0.72, 0.72, 0.05, 16);
    k.ball(cake, "#e2483d", 0, 0.55, 0, 0.1);
    for (let i = 0; i < 4; i += 1) k.cyl(k.root, "#ffffff", -0.9 + i * 0.6, 0.83, 0.75, 0.2, 0.2, 0.03, 12);
    for (let i = 0; i < 5; i += 1) {
      k.box(k.root, "#6b5a48", -2 + i, 2.2, -2.2, 0.03, 0.5, 0.03);
      k.ball(k.root, i % 2 ? TERRA : GOLD, -2 + i, 1.9, -2.2, 0.2);
    }
    k.box(k.root, "#6b5a48", 0, 2.45, -2.2, 4.4, 0.03, 0.03);
    k.person(k.root, "#f6c6cf", CREAM, 1.9, 0.9, -0.9);
    k.person(k.root, TEAL, "#e7b04a", -2, 1.2, 0.9);
    return {
      tick(t) {
        const p = (Math.sin(t * 1.6) + 1) / 2;
        const a = Math.PI / 8;
        slices[1]!.position.set(Math.sin(a + Math.PI / 4) * p * 0.35, 0.21 + p * 0.1, Math.cos(a + Math.PI / 4) * p * 0.35);
      },
    };
  },
};

const ZOOM: Record<SceneName, number> = { dam: 3.5, market: 3.7, bakery: 3.4 };

export function mountDiorama(host: HTMLElement, name: SceneName): Diorama {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    host.classList.add("is-flat");
    return { destroy: () => undefined };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  const canvas = renderer.domElement;
  canvas.style.cssText = "display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab";
  host.append(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 80);
  camera.position.set(11, 10, 11);
  camera.lookAt(0, 0.9, 0);
  scene.add(new THREE.HemisphereLight("#fff6df", "#829b85", 2));
  const sun = new THREE.DirectionalLight("#ffefcc", 2.6);
  sun.position.set(-5, 12, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 });
  sun.shadow.normalBias = 0.04;
  scene.add(sun);

  const disposables = new Set<{ dispose(): void }>();
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const mat = (c: string): THREE.MeshStandardMaterial => {
    let m = materials.get(c);
    if (!m) { m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true, emissive: c, emissiveIntensity: 0.04 }); materials.set(c, m); disposables.add(m); }
    return m;
  };
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const sphere = new THREE.IcosahedronGeometry(1, 0);
  const dodeca = new THREE.DodecahedronGeometry(1, 0);
  disposables.add(unitBox); disposables.add(sphere); disposables.add(dodeca);
  const place = (p: THREE.Object3D, g: THREE.BufferGeometry, c: string, x: number, y: number, z: number): THREE.Mesh => {
    const m = new THREE.Mesh(g, mat(c));
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    p.add(m);
    return m;
  };
  const root = new THREE.Group();
  scene.add(root);
  const kit: Kit = {
    root,
    mat,
    track: (g) => { disposables.add(g); },
    box: (p, c, x, y, z, sx, sy, sz) => { const m = place(p, unitBox, c, x, y, z); m.scale.set(sx, sy, sz); return m; },
    cyl: (p, c, x, y, z, rt, rb, h, sides = 8) => { const g = new THREE.CylinderGeometry(rt, rb, h, sides); disposables.add(g); return place(p, g, c, x, y, z); },
    ball: (p, c, x, y, z, r) => { const m = place(p, sphere, c, x, y, z); m.scale.setScalar(r); return m; },
    rock: (p, c, x, y, z, s) => { const m = place(p, dodeca, c, x, y, z); m.scale.set(s * 1.3, s, s); return m; },
    person(p, shirt, hat, x, z, turn) {
      const g = new THREE.Group();
      g.position.set(x, 0.14, z);
      g.rotation.y = turn;
      p.add(g);
      kit.box(g, "#4b5563", -0.1, 0.22, 0, 0.14, 0.44, 0.16);
      kit.box(g, "#4b5563", 0.1, 0.22, 0, 0.14, 0.44, 0.16);
      kit.cyl(g, shirt, 0, 0.72, 0, 0.2, 0.3, 0.6, 7);
      kit.ball(g, "#f2c9a0", 0, 1.22, 0, 0.26);
      kit.cyl(g, hat, 0, 1.45, 0, 0.12, 0.38, 0.12, 8);
      return g;
    },
  };
  const built = BUILD[name](kit);

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let angle = 0;
  let velocity = 0;
  let dragging: { x: number; angle: number } | null = null;
  let visible = false;
  let frame = 0;
  const start = performance.now();

  function resize(): void {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    const half = ZOOM[name];
    const aspect = w / h;
    Object.assign(camera, aspect >= 1 ? { left: -half * aspect, right: half * aspect, top: half, bottom: -half } : { left: -half, right: half, top: half / aspect, bottom: -half / aspect });
    camera.updateProjectionMatrix();
    draw(performance.now());
  }
  function draw(now: number): void {
    const t = (now - start) / 1000;
    if (!reduced.matches) built.tick?.(t);
    if (!dragging) {
      angle += velocity;
      velocity *= 0.93;
      if (!reduced.matches && Math.abs(velocity) < 0.0005) angle += Math.sin(t * 0.4) * 0.0012;
    }
    root.rotation.y = angle;
    renderer.render(scene, camera);
  }
  function loop(now: number): void {
    frame = 0;
    draw(now);
    if (visible && !document.hidden && (!reduced.matches || dragging || Math.abs(velocity) > 0.0005)) frame = requestAnimationFrame(loop);
  }
  const kick = (): void => { if (!frame) frame = requestAnimationFrame(loop); };

  canvas.addEventListener("pointerdown", (e) => {
    dragging = { x: e.clientX, angle };
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
    kick();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const next = dragging.angle + (e.clientX - dragging.x) * 0.012;
    velocity = next - angle;
    angle = next;
  });
  const release = (): void => { dragging = null; canvas.style.cursor = "grab"; kick(); };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);

  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    if (visible) kick();
  }, { rootMargin: "80px" });
  io.observe(host);
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  const onVis = (): void => { if (!document.hidden) kick(); };
  document.addEventListener("visibilitychange", onVis);
  resize();

  return {
    destroy() {
      cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      canvas.remove();
    },
  };
}
