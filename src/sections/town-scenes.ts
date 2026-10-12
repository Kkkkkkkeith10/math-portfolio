import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { buildTownModel, type SceneName, type TownKit } from "./town-models";

export type { SceneName } from "./town-models";
export interface Diorama { destroy(): void }

export function mountDiorama(host: HTMLElement, name: SceneName): Diorama {
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" }); }
  catch { host.classList.add("is-flat"); return { destroy: () => undefined }; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const canvas = renderer.domElement;
  canvas.style.cssText = "display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab";
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", `${host.dataset.title ?? name}. Drag or use the left and right arrow keys to turn the model; Home resets the view.`);
  host.append(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, .1, 80);
  camera.position.set(10, 15, 12.5);
  camera.lookAt(0, 1, 0);
  scene.add(new THREE.HemisphereLight("#fff6df", "#829b85", 2));
  scene.add(new THREE.AmbientLight("#fff1da", .35));
  const sun = new THREE.DirectionalLight("#ffefcc", 3);
  sun.position.set(-5, 12.5, 8.75);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
  sun.shadow.normalBias = .025;
  sun.shadow.bias = -.0002;
  sun.shadow.radius = 4;
  sun.shadow.blurSamples = 8;
  scene.add(sun);
  const disposables = new Set<{ dispose(): void }>();
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const geometries = new Map<string, THREE.BufferGeometry>();
  const mat = (color: string): THREE.MeshStandardMaterial => {
    let material = materials.get(color);
    if (!material) {
      material = new THREE.MeshStandardMaterial({ color, roughness: .92, metalness: 0, flatShading: true });
      materials.set(color, material); disposables.add(material);
    }
    return material;
  };
  const track = (geometry: THREE.BufferGeometry): void => { disposables.add(geometry); };
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const sphere = new THREE.IcosahedronGeometry(1, 0);
  const rock = new THREE.DodecahedronGeometry(1, 0);
  [unitBox, sphere, rock].forEach(track);
  const place = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, color: string, x: number, y: number, z: number): THREE.Mesh => {
    const mesh = new THREE.Mesh(geometry, mat(color));
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
    return mesh;
  };
  const root = new THREE.Group();
  scene.add(root);
  const kit: TownKit = {
    root, mat, track,
    box(parent, color, x, y, z, sx, sy, sz, radius) {
      const bevel = Math.min(sx > 5 && sz > 5 ? radius ?? .06 : 0, Math.min(sx, sy, sz) * .24);
      if (bevel < .015) { const mesh = place(parent, unitBox, color, x, y, z); mesh.scale.set(sx, sy, sz); return mesh; }
      const key = [sx, sy, sz, bevel].join(":");
      let geometry = geometries.get(key);
      if (!geometry) { geometry = new RoundedBoxGeometry(sx, sy, sz, 2, bevel); geometries.set(key, geometry); track(geometry); }
      return place(parent, geometry, color, x, y, z);
    },
    cyl(parent, color, x, y, z, rt, rb, height, sides = 12) {
      const key = ["cylinder", rt, rb, height, sides].join(":");
      let geometry = geometries.get(key);
      if (!geometry) { geometry = new THREE.CylinderGeometry(rt, rb, height, sides); geometries.set(key, geometry); track(geometry); }
      return place(parent, geometry, color, x, y, z);
    },
    ball(parent, color, x, y, z, radius) { const mesh = place(parent, sphere, color, x, y, z); mesh.scale.setScalar(radius); return mesh; },
    rock(parent, color, x, y, z, size) { const mesh = place(parent, rock, color, x, y, z); mesh.scale.set(size * 1.2, size * .85, size); mesh.rotation.set(.1, .35, -.08); return mesh; },
    person(parent, shirt, hat, x, z, turn) {
      const person = new THREE.Group();
      person.position.set(x, .16, z); person.rotation.y = turn; parent.add(person);
      for (const side of [-1, 1]) {
        kit.box(person, "#46595a", side * .1, .25, 0, .14, .36, .16, .025);
        kit.box(person, "#364948", side * .1, .08, .045, .16, .12, .24, .04);
        const sleeve = kit.cyl(person, shirt, side * .25, .72, 0, .09, .09, .3, 8); sleeve.rotation.z = side * -.2;
        const arm = kit.cyl(person, "#e9b790", side * .285, .5, .03, .065, .065, .21, 8); arm.rotation.z = side * -.15;
        kit.ball(person, "#e9b790", side * .3, .39, .05, .07);
      }
      kit.cyl(person, shirt, 0, .68, 0, .2, .24, .52, 10);
      kit.box(person, "#f1e5ce", 0, .61, .193, .29, .33, .035, .02);
      kit.box(person, "#d0b997", 0, .58, .216, .15, .07, .018);
      kit.cyl(person, "#e9b790", 0, 1.02, 0, .075, .075, .13, 10);
      kit.ball(person, "#edc6a3", 0, 1.21, 0, .24);
      kit.cyl(person, "#654736", 0, 1.36, -.035, .18, .22, .13, 10);
      for (const side of [-1, 1]) {
        kit.ball(person, "#edc6a3", side * .225, 1.2, 0, .05);
        kit.ball(person, "#413c35", side * .075, 1.25, .216, .022);
        kit.ball(person, "#dcaa8c", side * .12, 1.16, .2, .035);
      }
      kit.ball(person, "#e5b695", 0, 1.18, .238, .028);
      kit.box(person, "#845945", 0, 1.12, .216, .055, .012, .012);
      kit.cyl(person, hat, 0, 1.44, 0, .34, .34, .055, 12);
      kit.cyl(person, hat, 0, 1.54, 0, .17, .21, .17, 10);
      kit.cyl(person, "#aa7955", 0, 1.46, 0, .215, .215, .035, 10);
      return person;
    },
  };
  const built = buildTownModel(name, kit);
  const groundGeometry = new THREE.PlaneGeometry(200, 200);
  const shadowMaterial = new THREE.ShadowMaterial({ color: "#426b62", opacity: .14 });
  track(groundGeometry); disposables.add(shadowMaterial);
  const ground = new THREE.Mesh(groundGeometry, shadowMaterial);
  ground.rotation.x = -Math.PI / 2; ground.position.y = -.7; ground.receiveShadow = true;
  scene.add(ground);
  const corners: THREE.Vector3[] = [];
  root.updateMatrixWorld(true);
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.computeBoundingBox();
    const bounds = object.geometry.boundingBox!;
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) corners.push(new THREE.Vector3(x, y, z).applyMatrix4(object.matrixWorld));
  });
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let angle = 0;
  let velocity = 0;
  let dragging: { x: number; angle: number; pointerId: number } | null = null;
  let visible = false;
  let frame = 0;
  let destroyed = false;
  const started = performance.now();
  const clampTurn = (value: number): number => THREE.MathUtils.clamp(value, -.65, .65);
  function resize(): void {
    const width = host.clientWidth || 1;
    const height = host.clientHeight || 1;
    renderer.setSize(width, height, false);
    const aspect = width / height;
    camera.updateMatrixWorld();
    const projected = corners.map((corner) => corner.clone().applyMatrix4(camera.matrixWorldInverse));
    const minX = Math.min(...projected.map((p) => p.x));
    const maxX = Math.max(...projected.map((p) => p.x));
    const minY = Math.min(...projected.map((p) => p.y));
    const maxY = Math.max(...projected.map((p) => p.y));
    const half = Math.max((maxY - minY) / 2, (maxX - minX) / (2 * aspect)) * 1.08;
    const centerY = (minY + maxY) / 2;
    Object.assign(camera, { left: -half * aspect, right: half * aspect, top: half + centerY, bottom: -half + centerY });
    camera.updateProjectionMatrix(); draw(performance.now());
  }
  function draw(now: number): void {
    const time = (now - started) / 1000;
    if (!reduced.matches) built.tick?.(time);
    if (!dragging) { angle = clampTurn(angle + velocity); velocity *= .88; }
    root.rotation.y = angle + (!reduced.matches && !dragging ? Math.sin(time * .3) * .035 : 0);
    host.dataset.rotation = angle.toFixed(3);
    renderer.render(scene, camera);
  }
  function loop(now: number): void {
    frame = 0;
    if (destroyed) return;
    draw(now);
    if (visible && !document.hidden && (!reduced.matches || dragging || Math.abs(velocity) > .0005)) frame = requestAnimationFrame(loop);
  }
  const kick = (): void => { if (!destroyed && !frame) frame = requestAnimationFrame(loop); };
  canvas.addEventListener("pointerdown", (event) => {
    dragging = { x: event.clientX, angle, pointerId: event.pointerId }; canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = "grabbing"; host.classList.add("is-turned"); velocity = 0; kick();
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!dragging || dragging.pointerId !== event.pointerId) return;
    const next = clampTurn(dragging.angle + (event.clientX - dragging.x) * .006);
    velocity = next - angle; angle = next; kick();
  });
  const release = (): void => { dragging = null; canvas.style.cursor = "grab"; kick(); };
  canvas.addEventListener("pointerup", release); canvas.addEventListener("pointercancel", release); canvas.addEventListener("lostpointercapture", release);
  canvas.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home"].includes(event.key)) return;
    event.preventDefault(); velocity = 0;
    angle = event.key === "Home" ? 0 : clampTurn(angle + (event.key === "ArrowLeft" ? -.12 : .12)); kick();
  });
  const observer = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) kick(); else if (frame) { cancelAnimationFrame(frame); frame = 0; }
  }, { rootMargin: "80px" });
  observer.observe(host);
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
  const onVisibility = (): void => { if (!document.hidden && visible) kick(); else if (frame) { cancelAnimationFrame(frame); frame = 0; } };
  const onMotion = (): void => { velocity = 0; kick(); };
  document.addEventListener("visibilitychange", onVisibility); reduced.addEventListener("change", onMotion); resize();
  return { destroy() {
    destroyed = true; cancelAnimationFrame(frame); observer.disconnect(); resizeObserver.disconnect();
    document.removeEventListener("visibilitychange", onVisibility); reduced.removeEventListener("change", onMotion);
    disposables.forEach((item) => item.dispose()); renderer.dispose(); canvas.remove();
  } };
}
