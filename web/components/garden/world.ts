/**
 * Byte's garden: a transparent three.js layer along the bottom of the window.
 * Byte (an original robot beagle) wanders the band, uses the gifts he receives, and can be petted.
 * Everything here is decoration on the lesson's terms: calm while the learner works, one short
 * celebration per gift, no motion at all with prefers-reduced-motion (petting still answers).
 * Loaded lazily by Garden.tsx, client only.
 */
import * as THREE from 'three';
import type { PetItem } from '@/content/steps';

export interface GiftView { item: PetItem; name: string; title: string; fact: string }
export interface World {
  /** Shows these gifts; new ones (after the first call) drop in with a note. */
  setGifts: (gifts: GiftView[], next: PetItem | null) => void;
  setRunning: (on: boolean) => void;
  dispose: () => void;
}

const S = 32;                  // px per model unit
const GROUND = 46;             // px from the canvas bottom to Byte's feet
const SPEED = 80;              // px per second

/* Where each thing stands: share of the window width, depth (negative = further back). Tall things at the ends. */
const SPOTS: Record<PetItem, [number, number]> = {
  bowl: [0.79, 18], tent: [0.06, -38], ball: [0.56, 30], tree: [0.955, -48], cushion: [0.87, -28],
  flowers: [0.2, 18], frisbee: [0.42, 32], lamp: [0.29, -46], bench: [0.67, -40], balloons: [0.135, -46],
};

type Step =
  | { walk: () => [number, number]; tx?: number; tz?: number; t?: number }
  | { kick: PetItem }
  | { pose: Pose; dur: number; face?: () => number; text?: string; t?: number };
type Pose = 'stand' | 'walk' | 'eat' | 'sleep' | 'sit' | 'sniff' | 'happy';

export function createWorld(canvas: HTMLCanvasElement, fx: HTMLElement, hooks: { onPet: () => void; onMove: (item: PetItem) => void }): World {
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  let W = 1, CH = 1;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -3000, 3000);
  camera.position.z = 1500;
  const stage = new THREE.Group(); stage.rotation.x = 0.36; scene.add(stage);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(8000, 600), new THREE.ShadowMaterial({ opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; stage.add(ground);

  scene.add(new THREE.HemisphereLight('#ffffff', '#b8cfae', 1.6));
  const sun = new THREE.DirectionalLight('#fff3dc', 2.4);
  sun.position.set(-450, 950, 650); sun.castShadow = true; sun.shadow.mapSize.set(2048, 1024);
  Object.assign(sun.shadow.camera, { left: -1600, right: 1600, top: 500, bottom: -500, near: 10, far: 4000 });
  sun.shadow.radius = 5; sun.target = stage; scene.add(sun);
  const rimLight = new THREE.DirectionalLight('#c9d6ff', 0.8); rimLight.position.set(600, 300, -500); scene.add(rimLight);

  /* ---------- Materials and shape helpers ---------- */
  const std = (c: string, o: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });
  const shell = (c: string, o: THREE.MeshPhysicalMaterialParameters = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.18, ...o });
  const glow = (c: string, k = 1.4) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: k, roughness: 0.3 });
  const WHITE = shell('#f8f6f1'), PANEL = shell('#e9e5dc', { roughness: 0.4 }), ORANGE = shell('#e07a28', { roughness: 0.42, clearcoat: 0.35 });
  const ORANGE_DK = std('#b9581a', { roughness: 0.7 }), BLACK = shell('#23262d', { roughness: 0.35, clearcoat: 0.5 }), JOINT = std('#2c3038', { roughness: 0.5, metalness: 0.2 });
  const WOOD = std('#a7774f', { roughness: 0.8 }), WOOD_DK = std('#8a5f3c', { roughness: 0.85 });
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; return o; };
  const ball = (r: number, m: THREE.Material, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => { const o = mesh(new THREE.SphereGeometry(r, 32, 24), m, x, y, z); o.scale.set(sx, sy, sz); return o; };

  /* ---------- Byte (faces +z, the viewer) ---------- */
  const D = (() => {
    const root = new THREE.Group(), rig = new THREE.Group(); root.add(rig);
    rig.add(ball(1, WHITE, 0, 1.55, 0, 0.8, 0.74, 1.1));
    rig.add(ball(1, PANEL, 0, 1.38, 0, 0.66, 0.5, 0.95));
    rig.add(ball(1, ORANGE, 0, 2.08, -0.25, 0.6, 0.24, 0.72));
    [-0.38, 0.38].forEach((z) => { const s = mesh(new THREE.TorusGeometry(0.75, 0.016, 6, 48), BLACK, 0, 1.55, z); s.scale.set(1.04, 0.98, 1); rig.add(s); });
    const ring = mesh(new THREE.TorusGeometry(0.2, 0.04, 10, 28), BLACK, 0, 1.42, 1.05); ring.rotation.x = -0.35; rig.add(ring);
    const light = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 28), glow('#2aa6ff', 1.5), 0, 1.42, 1.04); light.rotation.x = Math.PI / 2 - 0.35; rig.add(light);
    const collar = mesh(new THREE.TorusGeometry(0.47, 0.13, 14, 36), BLACK, 0, 2.08, 0.78); collar.rotation.x = Math.PI / 2 - 0.45; rig.add(collar);
    rig.add(ball(0.11, glow('#2aa6ff', 0.9), 0, 1.78, 1.12, 1, 1, 0.5));

    const head = new THREE.Group(); head.position.set(0, 2.78, 0.95); rig.add(head);
    head.add(ball(0.97, WHITE, 0, 0, 0, 1, 0.92, 0.95));
    const seam = mesh(new THREE.TorusGeometry(0.9, 0.015, 6, 48), BLACK, 0, 0, -0.18); seam.scale.set(1.04, 0.95, 1); head.add(seam);
    head.add(ball(0.5, WHITE, 0, -0.33, 0.6, 1, 0.78, 1.05));
    head.add(ball(0.18, BLACK, 0, -0.17, 1.12, 1.35, 0.95, 0.9));
    head.add(ball(0.05, glow('#ffffff', 0.8), -0.06, -0.1, 1.27));
    const mouth = mesh(new THREE.TorusGeometry(0.14, 0.025, 8, 20, Math.PI), BLACK, 0, -0.44, 1.02); mouth.rotation.z = Math.PI; head.add(mouth);
    const tongue = ball(0.12, std('#ff7f9b', { roughness: 0.4 }), 0, -0.58, 1.0, 1, 1.3, 0.5); tongue.scale.setScalar(0.001); head.add(tongue);
    const eyes: THREE.Group[] = [], brows: THREE.Mesh[] = [];
    [-1, 1].forEach((s) => {
      const patch = ball(0.36, ORANGE, s * 0.37, 0.12, 0.79, 1, 1.05, 0.42); patch.rotation.y = s * 0.38; head.add(patch);
      const eye = new THREE.Group(); eye.position.set(s * 0.37, 0.13, 0.9); eye.rotation.y = s * 0.2; head.add(eye);
      eye.add(ball(0.2, BLACK));
      eye.add(ball(0.14, std('#6b3b1c', { roughness: 0.3 }), 0, 0, 0.09, 1, 1, 0.6));
      eye.add(ball(0.09, BLACK, 0, 0, 0.14, 1, 1, 0.5));
      eye.add(ball(0.055, glow('#ffffff', 1), 0.05, 0.07, 0.17));
      eye.add(ball(0.025, glow('#ffffff', 1), -0.05, -0.05, 0.17));
      eyes.push(eye);
      const brow = ball(0.12, ORANGE_DK, s * 0.38, 0.44, 0.78, 1.4, 0.45, 0.5); head.add(brow); brows.push(brow);
      head.add(ball(0.08, std('#ffb3c6', { roughness: 0.8 }), s * 0.52, -0.25, 0.75, 1, 0.7, 0.5));
    });
    const ears: THREE.Group[] = [];
    [-1, 1].forEach((s) => {
      const ear = new THREE.Group(); ear.position.set(s * 0.82, 0.45, -0.05); head.add(ear);
      ear.add(ball(0.5, ORANGE, s * 0.06, -0.45, 0, 0.3, 0.85, 0.62));
      ear.add(ball(0.42, ORANGE, s * 0.08, -0.95, 0.08, 0.28, 0.55, 0.55));
      ear.add(ball(0.4, ORANGE_DK, -s * 0.04, -0.6, 0.02, 0.12, 0.85, 0.5));
      ears.push(ear);
    });
    const legs: { hip: THREE.Group; knee: THREE.Group; phase: number; front: number }[] = [];
    ([[-0.43, 0.58, 0, 1], [0.43, 0.58, Math.PI, 1], [-0.43, -0.6, Math.PI, -1], [0.43, -0.6, 0, -1]] as const).forEach(([x, z, phase, front]) => {
      const hip = new THREE.Group(); hip.position.set(x, 1.28, z); rig.add(hip);
      hip.add(ball(0.25, JOINT));
      hip.add(mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.5, 22), WHITE, 0, -0.3, 0));
      const knee = new THREE.Group(); knee.position.y = -0.58; hip.add(knee);
      knee.add(mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.12, 22), JOINT));
      knee.add(mesh(new THREE.CylinderGeometry(0.21, 0.23, 0.32, 22), WHITE, 0, -0.22, 0));
      knee.add(ball(0.31, WHITE, 0, -0.45, 0.1, 1.05, 0.68, 1.35));
      const sole = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.07, 22), BLACK, 0, -0.62, 0.12); sole.scale.set(1, 1, 1.3); knee.add(sole);
      [-0.1, 0, 0.1].forEach((tx) => { const toe = mesh(new THREE.BoxGeometry(0.02, 0.08, 0.16), BLACK, tx, -0.36, 0.48); toe.rotation.x = 0.6; knee.add(toe); });
      legs.push({ hip, knee, phase, front });
    });
    const tail = new THREE.Group(); tail.position.set(0, 1.95, -1.02); tail.rotation.x = -0.75; rig.add(tail);
    let seg: THREE.Group = tail;
    [0.07, 0.06, 0.055].forEach((r, i) => { const g = new THREE.Group(); g.position.y = i ? 0.22 : 0; g.rotation.x = i ? 0.25 : 0; seg.add(g);
      g.add(mesh(new THREE.CylinderGeometry(r, r, 0.22, 12), i === 2 ? ORANGE : WHITE, 0, 0.11, 0)); g.add(ball(r * 1.05, JOINT, 0, 0.22, 0)); seg = g; });
    seg.add(ball(0.09, ORANGE, 0, 0.3, 0));
    root.scale.setScalar(S);
    return { root, rig, head, eyes, brows, ears, legs, tail, tongue };
  })();
  stage.add(D.root);

  /* ---------- Gifts ---------- */
  const BUILD: Record<PetItem | 'gift', () => THREE.Group> = {
    bowl() { const g = new THREE.Group();
      const food = new THREE.Group(); food.position.x = -0.55; g.add(food);
      food.add(mesh(new THREE.CylinderGeometry(0.6, 0.46, 0.32, 36), shell('#3d5afe'), 0, 0.16, 0));
      const lip = mesh(new THREE.TorusGeometry(0.58, 0.06, 10, 36), shell('#2c47de'), 0, 0.32, 0); lip.rotation.x = Math.PI / 2; food.add(lip);
      for (let i = 0; i < 16; i++) food.add(ball(0.09, std('#c98b4b', { roughness: 0.9 }), (Math.random() - .5) * .75, 0.33 + Math.random() * .06, (Math.random() - .5) * .7, 1, .7, 1));
      const water = new THREE.Group(); water.position.x = 0.75; g.add(water);
      water.add(mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.28, 36), shell('#f3dda8'), 0, 0.14, 0));
      water.add(mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.02, 36), std('#7fc4ff', { roughness: 0.05, metalness: 0.1 }), 0, 0.25, 0));
      return g; },
    tent() { const g = new THREE.Group(); const A = std('#ffb020', { side: THREE.DoubleSide, roughness: 0.75 }), B = std('#f4f1e8', { side: THREE.DoubleSide, roughness: 0.75 });
      const slant = Math.hypot(1.75, 2.7), ang = Math.atan2(2.7, 1.75), stripes = 5, w = 2.9 / stripes;
      [-1, 1].forEach((s) => { for (let i = 0; i < stripes; i++) { const p = mesh(new THREE.BoxGeometry(slant, 0.05, w), i % 2 ? B : A, s * 0.875, 1.35, -1.45 + w / 2 + i * w); p.rotation.z = s < 0 ? ang : -ang; g.add(p); } });
      const tri = new THREE.Shape(); tri.moveTo(-1.75, 0); tri.lineTo(1.75, 0); tri.lineTo(0, 2.7); tri.lineTo(-1.75, 0);
      g.add(mesh(new THREE.ShapeGeometry(tri), std('#d98f0f', { side: THREE.DoubleSide }), 0, 0, -1.45));
      const flap = new THREE.Shape(); flap.moveTo(0, 0); flap.quadraticCurveTo(0.6, 0.15, 1.0, 0); flap.lineTo(0, 1.55); flap.lineTo(0, 0);
      [-1, 1].forEach((s) => { const f = mesh(new THREE.ShapeGeometry(flap), A, s * 1.75, 0, 1.46); f.scale.x = -s; g.add(f);
        g.add(mesh(new THREE.TorusGeometry(0.1, 0.03, 6, 12), std('#e5484d'), s * 0.95, 0.95, 1.5)); });
      g.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 8), WOOD_DK, 0, 2.95, 1.45));
      g.add(mesh(new THREE.ConeGeometry(0.16, 0.34, 3), std('#e5484d'), 0.15, 3.15, 1.45).rotateZ(-Math.PI / 2));
      g.add(mesh(new THREE.BoxGeometry(3.2, 0.03, 2.9), std('#6d8fd8', { roughness: 0.9 }), 0, 0.02, 0));
      const lantern = new THREE.Group(); lantern.position.set(0.6, 0, -0.9); g.add(lantern);
      lantern.add(mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.08, 12), JOINT, 0, 0.04, 0)); lantern.add(ball(0.14, glow('#ffd98a', 1.8), 0, 0.22, 0, 1, 1.3, 1));
      [-1, 1].forEach((s) => { const r = mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.6, 4), WOOD_DK, s * 2.05, 0.9, 1.0); r.rotation.z = s * 0.75; g.add(r); });
      return g; },
    ball() { const g = new THREE.Group(); const b = new THREE.Group(); b.position.y = 0.42; g.add(b);
      b.add(ball(0.42, std('#d6ec4a', { roughness: 0.95 })));
      [0.5, -0.5].forEach((tilt, i) => { const sm = mesh(new THREE.TorusGeometry(0.33, 0.025, 6, 32), std('#ffffff', { roughness: 0.9 }), 0, 0, i ? -0.18 : 0.18); sm.rotation.set(0, Math.PI / 2, tilt); b.add(sm); });
      g.userData.spin = b; return g; },
    frisbee() { const g = new THREE.Group(); const b = new THREE.Group(); b.position.y = 0.08; g.add(b);
      b.add(mesh(new THREE.CylinderGeometry(0.62, 0.52, 0.1, 36), shell('#1fa37a')));
      const rimF = mesh(new THREE.TorusGeometry(0.58, 0.05, 8, 36), shell('#f3dda8'), 0, 0.05, 0); rimF.rotation.x = Math.PI / 2; b.add(rimF);
      g.userData.spin = b; g.userData.slides = true; return g; },
    tree() { const g = new THREE.Group();
      g.add(mesh(new THREE.CylinderGeometry(0.24, 0.38, 3.0, 14), WOOD, 0, 1.5, 0));
      [[0.4, 0.4], [-0.4, 0.3], [0.1, -0.45]].forEach(([x, z]) => { const r = mesh(new THREE.CylinderGeometry(0.06, 0.16, 0.6, 8), WOOD, x, 0.15, z); r.rotation.set(z * 1.2, 0, -x * 1.6); g.add(r); });
      const branch = mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.0, 8), WOOD, 0.45, 2.6, 0); branch.rotation.z = -0.9; g.add(branch);
      const greens = ['#5fbf74', '#4fae66', '#6ccb7f'];
      [[0, 3.6, 0, 1.3], [0.95, 3.25, 0.25, 0.95], [-0.9, 3.25, -0.1, 0.95], [0.2, 4.25, -0.25, 0.9], [-0.35, 3.0, 0.65, 0.75], [0.6, 3.9, 0.55, 0.7]].forEach(([x, y, z, r], i) =>
        g.add(mesh(new THREE.IcosahedronGeometry(r, 1), std(greens[i % 3], { roughness: 0.75, flatShading: true }), x, y, z)));
      [[0.7, 3.0, 0.9], [-0.6, 3.4, 0.85], [0.2, 3.9, 0.95], [1.3, 3.5, 0.5], [-1.2, 3.0, 0.5]].forEach(([x, y, z]) => g.add(ball(0.13, shell('#e5484d'), x, y, z)));
      return g; },
    cushion() { const g = new THREE.Group();
      const rimC = mesh(new THREE.TorusGeometry(1.15, 0.32, 18, 48), std('#3d5afe', { roughness: 0.9 }), 0, 0.32, 0); rimC.rotation.x = Math.PI / 2; g.add(rimC);
      g.add(mesh(new THREE.CylinderGeometry(1.15, 1.2, 0.3, 48), std('#e4e9ff', { roughness: 0.95 }), 0, 0.18, 0));
      [[0, 0], [0.5, 0.3], [-0.5, 0.3], [0.5, -0.35], [-0.5, -0.35]].forEach(([x, z]) => g.add(ball(0.05, std('#9fb0ff'), x, 0.34, z, 1, 0.5, 1)));
      const blanket = mesh(new THREE.BoxGeometry(0.9, 0.06, 0.7), std('#ffb020', { roughness: 0.95 }), 0.55, 0.42, 0.5); blanket.rotation.set(0.15, 0.5, 0.1); g.add(blanket);
      return g; },
    flowers() { const g = new THREE.Group();
      for (let i = 0; i < 4; i++) [0.5, -0.5].forEach((z) => g.add(mesh(new THREE.BoxGeometry(2.0, 0.16, 0.05), i % 2 ? WOOD : WOOD_DK, 0, 0.1 + i * 0.16, z)));
      [-1, 1].forEach((s) => g.add(mesh(new THREE.BoxGeometry(0.05, 0.64, 1.0), WOOD_DK, s, 0.34, 0)));
      g.add(mesh(new THREE.BoxGeometry(1.95, 0.05, 0.95), std('#6b4a32', { roughness: 1 }), 0, 0.6, 0));
      const cols = ['#e5484d', '#ffb020', '#8250df', '#ff8fb1', '#ffffff', '#e5484d', '#ff8fb1'];
      const cup = new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(0.1, 0.02), new THREE.Vector2(0.15, 0.12), new THREE.Vector2(0.13, 0.26), new THREE.Vector2(0.15, 0.3)], 14);
      cols.forEach((c, i) => { const x = -0.8 + i * 0.27, z = i % 2 ? 0.18 : -0.15, h = 0.7 + ((i * 37) % 5) * 0.08;
        g.add(mesh(new THREE.CylinderGeometry(0.022, 0.022, h, 6), std('#3f9a71'), x, 0.6 + h / 2, z));
        const leaf = ball(0.12, std('#4fae66'), x + 0.07, 0.75, z, 0.35, 1.2, 0.6); leaf.rotation.z = -0.5; g.add(leaf);
        g.add(mesh(cup, std(c, { side: THREE.DoubleSide, roughness: 0.5 }), x, 0.6 + h, z)); });
      return g; },
    lamp() { const g = new THREE.Group();
      g.add(mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.2, 16), JOINT, 0, 0.1, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.6, 12), std('#1b2b4b', { metalness: 0.3, roughness: 0.4 }), 0, 1.4, 0));
      g.add(mesh(new THREE.ConeGeometry(0.42, 0.35, 6), std('#1b2b4b', { metalness: 0.3, roughness: 0.4 }), 0, 2.95, 0));
      g.add(ball(0.22, glow('#ffd98a', 2), 0, 2.72, 0, 1, 1.2, 1));
      return g; },
    bench() { const g = new THREE.Group();
      for (let i = 0; i < 3; i++) g.add(mesh(new THREE.BoxGeometry(2.0, 0.08, 0.2), WOOD, 0, 0.6, -0.25 + i * 0.25));
      for (let i = 0; i < 2; i++) { const b = mesh(new THREE.BoxGeometry(2.0, 0.18, 0.06), WOOD, 0, 0.9 + i * 0.25, -0.42); b.rotation.x = -0.15; g.add(b); }
      [-0.85, 0.85].forEach((x) => { g.add(mesh(new THREE.BoxGeometry(0.08, 0.6, 0.6), std('#1b2b4b', { metalness: 0.3 }), x, 0.3, 0)); g.add(mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), std('#1b2b4b', { metalness: 0.3 }), x, 1.0, -0.42)); });
      return g; },
    balloons() { const g = new THREE.Group(); const cols = ['#e5484d', '#3d5afe', '#ffb020', '#1fa37a', '#8250df'];
      g.add(mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.22, 12), WOOD_DK, 0, 0.11, 0));
      cols.forEach((c, i) => { const a = i / cols.length * Math.PI * 2, x = Math.cos(a) * 0.45, z = Math.sin(a) * 0.3, y = 2.4 + (i % 2) * 0.4;
        const b = ball(0.34, shell(c, { roughness: 0.25 }), x, y, z, 1, 1.15, 1); b.userData.float = i; g.add(b);
        g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.22, 0), new THREE.Vector3(x, y - 0.38, z)]), new THREE.LineBasicMaterial({ color: '#5b6b88' }))); });
      return g; },
    gift() { const g = new THREE.Group(); const blue = shell('#3d5afe'), rib = shell('#f3dda8');
      g.add(mesh(new THREE.BoxGeometry(0.9, 0.72, 0.9), blue, 0, 0.36, 0)); g.add(mesh(new THREE.BoxGeometry(1.0, 0.16, 1.0), blue, 0, 0.78, 0));
      g.add(mesh(new THREE.BoxGeometry(0.93, 0.9, 0.16), rib, 0, 0.45, 0)); g.add(mesh(new THREE.BoxGeometry(0.16, 0.9, 0.93), rib, 0, 0.45, 0));
      [0.7, -0.7].forEach((r) => { const b = mesh(new THREE.TorusGeometry(0.17, 0.06, 10, 20), rib, 0, 1.0, 0); b.scale.set(1, 1.3, 1); b.rotation.set(Math.PI / 2 - 0.4, r, 0); g.add(b); });
      return g; },
  };
  const build = (id: PetItem | 'gift') => { const g = BUILD[id](); g.scale.setScalar(S); g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };

  /* ---------- Scenery: bushes and rocks along the band, for depth ---------- */
  const scenery = new THREE.Group(); stage.add(scenery);
  function buildScenery() {
    scenery.clear();
    const bush = (x: number, z: number, s: number) => { const g = new THREE.Group();
      [[0, 0.5, 0, 0.7], [0.6, 0.4, 0.1, 0.55], [-0.55, 0.38, 0, 0.5], [0.15, 0.85, -0.1, 0.5]].forEach(([a, b, c, r], i) => g.add(mesh(new THREE.IcosahedronGeometry(r, 1), std(['#7cc47e', '#6ab56f', '#8bd08a'][i % 3], { flatShading: true, roughness: 0.8 }), a, b, c)));
      g.position.set(x, 0, z); g.scale.setScalar(S * s); scenery.add(g); };
    const rock = (x: number, z: number, s: number) => { const r = mesh(new THREE.DodecahedronGeometry(0.4, 0), std('#c4c7cf', { flatShading: true, roughness: 0.9 }), x, 0.15 * S * s, z); r.scale.set(S * s * 1.3, S * s * 0.7, S * s); r.rotation.y = x; scenery.add(r); };
    const at = (f: number) => (f - 0.5) * W;
    bush(at(0.35), -70, 0.8); bush(at(0.6), -72, 0.7); bush(at(0.73), -66, 0.9);
    rock(at(0.48), 34, 0.7); rock(at(0.23), -10, 0.5); rock(at(0.83), 40, 0.55);
  }

  /* ---------- State ---------- */
  const things = new Map<PetItem, THREE.Group>();
  let wrapped: THREE.Group | null = null, wrappedItem: PetItem | null = null, shown = 0, firstCall = true;
  const spot = (item: PetItem): [number, number] => [(SPOTS[item][0] - 0.5) * W, SPOTS[item][1]];

  const tweens: { t: number; dur: number; fn: (k: number) => void; done?: () => void }[] = [];
  const tween = (dur: number, fn: (k: number) => void, done?: () => void) => { if (REDUCE) { fn(1); done?.(); return; } tweens.push({ t: 0, dur, fn, done }); };
  const bounce = (t: number) => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; };
  const toScreen = (obj: THREE.Object3D, up = 0): [number, number] => {
    const v = new THREE.Vector3(); obj.getWorldPosition(v); v.y += up; v.project(camera);
    const r = canvas.getBoundingClientRect(); return [r.left + (v.x + 1) / 2 * W, r.top + (1 - v.y) / 2 * CH];
  };

  /* Labels above the layer: speech, hearts, the gift note */
  const bubble = document.createElement('div'); bubble.className = 'garden-say'; bubble.dataset.off = ''; fx.appendChild(bubble);
  let bubbleUntil = 0;
  const say = (text: string, secs = 2.2) => { bubble.textContent = text; delete bubble.dataset.off; bubbleUntil = performance.now() + secs * 1000; };
  function hearts() {
    const [x, y] = toScreen(D.head, 36);
    for (let i = 0; i < 6; i++) setTimeout(() => {
      const h = document.createElement('span'); h.className = 'garden-heart'; h.textContent = '♥';
      h.style.left = `${x + (Math.random() - .5) * 46}px`; h.style.top = `${y}px`; h.style.setProperty('--dx', `${(Math.random() - .5) * 70}px`);
      fx.appendChild(h); setTimeout(() => h.remove(), 1500);
    }, i * 130);
  }
  function note(g: GiftView) {
    fx.querySelectorAll('.garden-note').forEach((old) => old.remove());
    const thing = things.get(g.item); if (!thing) return;
    const [x] = toScreen(thing);
    const n = document.createElement('div'); n.className = 'garden-note'; n.setAttribute('role', 'status');
    n.style.left = `${Math.min(innerWidth - 145, Math.max(145, x))}px`;
    const strong = document.createElement('strong'); strong.textContent = `New for Byte: ${g.name}`;
    const p = document.createElement('p'); p.textContent = `You finished ${g.title}. ${g.fact}`;
    n.append(strong, p); fx.appendChild(n); setTimeout(() => n.remove(), 6500);
  }

  function place(item: PetItem, drop: boolean) {
    const [x, z] = spot(item); const g = build(item); g.position.set(x, 0, z); g.userData.item = item; stage.add(g); things.set(item, g);
    if (drop && !REDUCE) { g.position.y = 300; tween(0.95, (k) => { g.position.y = 300 * (1 - bounce(k)); }); }
  }
  function setWrapped(item: PetItem | null) {
    if (wrapped && wrappedItem !== item) { const box = wrapped; tween(0.35, (k) => { box.scale.setScalar(S * Math.max(0.01, 1 - k)); box.rotation.y = k * 4; }, () => stage.remove(box)); wrapped = null; }
    wrappedItem = item;
    if (item && !wrapped) { const [x, z] = spot(item); wrapped = build('gift'); wrapped.position.set(x, 0, z); stage.add(wrapped); }
  }

  /* ---------- Behaviour: a queue of small actions ---------- */
  const dog = { x: 0, z: 8, face: 0, want: 0, phase: 0, queue: [] as Step[], cur: null as Step | null, wait: 2, blink: 2, mood: 0, pose: 'stand' as Pose };
  function plan(item: PetItem): Step[] {
    const g = () => things.get(item)!.position; const side = () => (dog.x < g().x ? -1 : 1);
    switch (item) {
      case 'bowl': return [{ walk: () => [g().x - 18 + side() * 44, g().z + 8] }, { pose: 'eat', dur: 3.2, face: () => -side() * 1.3, text: 'nom nom' }];
      case 'tent': return [{ walk: () => [g().x, g().z + 75] }, { walk: () => [g().x, g().z - 4] }, { pose: 'sleep', dur: 5, face: () => 0, text: 'z z z' }, { walk: () => [g().x, g().z + 75] }];
      case 'ball': case 'frisbee': return [{ walk: () => [g().x + side() * 44, g().z] }, { kick: item }, { pose: 'stand', dur: 0.8 }, { walk: () => [g().x + side() * 44, g().z] }, { pose: 'happy', dur: 1.3, face: () => 0, text: 'got it!' }];
      case 'tree': return [{ walk: () => [g().x - 30, g().z + 60] }, { pose: 'sit', dur: 4.5, face: () => 0, text: '♪' }];
      case 'cushion': return [{ walk: () => [g().x, g().z] }, { pose: 'sleep', dur: 5, face: () => 0, text: 'z z z' }];
      case 'flowers': return [{ walk: () => [g().x + side() * 56, g().z + 8] }, { pose: 'sniff', dur: 2.6, face: () => -side() * 1.3, text: '✿' }];
      case 'lamp': return [{ walk: () => [g().x + 34, g().z + 40] }, { pose: 'sit', dur: 4, face: () => 0, text: '…' }];
      case 'bench': return [{ walk: () => [g().x + side() * 80, g().z + 45] }, { pose: 'sit', dur: 4, face: () => 0, text: '♪' }];
      case 'balloons': return [{ walk: () => [g().x + 40, g().z + 50] }, { pose: 'happy', dur: 2, face: () => 0, text: 'party!' }];
    }
  }
  function idleChoice() {
    if (REDUCE) return;
    const items = [...things.keys()];
    if (items.length && Math.random() < 0.55) { dog.queue = plan(items[Math.floor(Math.random() * items.length)]); return; }
    const x = (Math.random() * 0.86 + 0.07 - 0.5) * W;
    dog.queue = [{ walk: () => [x, -20 + Math.random() * 50] }, { pose: 'stand', dur: 1.5 + Math.random() * 2, face: () => 0 }];
  }
  function startNext() {
    dog.cur = dog.queue.shift() ?? null;
    const c = dog.cur;
    if (!c) { dog.wait = 2.5 + Math.random() * 3.5; dog.pose = 'stand'; dog.want = 0; return; }
    if ('walk' in c) { [c.tx, c.tz] = c.walk(); dog.pose = 'walk'; }
    else if ('kick' in c) { const b = things.get(c.kick); if (b) b.userData.vx = (dog.x < b.position.x ? 1 : -1) * 260; dog.mood = 1; dog.cur = null; }
    else { c.t = 0; dog.pose = c.pose; if (c.face) dog.want = c.face(); if (c.text) say(c.text, c.dur); }
  }
  function pet() {
    dog.queue = []; dog.cur = { pose: 'happy', dur: 1.7, t: 0 }; dog.pose = 'happy'; dog.want = 0; dog.mood = 1;
    say('♥', 1.7); hearts(); hooks.onPet();
    tween(0.9, (k) => { D.rig.position.y = Math.abs(Math.sin(k * Math.PI * 2)) * 0.5; }, () => { D.rig.position.y = 0; });
  }

  /* ---------- Pointer: pet Byte, drag his things. The layer itself never blocks the page. ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), floor = new THREE.Plane(), hit = new THREE.Vector3();
  let dragging: PetItem | null = null, running = false;
  function aim(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom) return false;
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); return true;
  }
  function pick(e: PointerEvent): { dog: true } | { item: PetItem } | null {
    if (!running || !aim(e)) return null;
    if (ray.intersectObject(D.root, true).length) return { dog: true };
    for (const [item, g] of things) if (ray.intersectObject(g, true).length) return { item };
    return null;
  }
  const isControl = (t: EventTarget | null) => t instanceof Element && !!t.closest('button, input, textarea, select, a, label, [role="button"]');
  const onDown = (e: PointerEvent) => {
    if (isControl(e.target)) return;
    const p = pick(e); if (!p) return;
    if ('dog' in p) pet(); else { dragging = p.item; document.documentElement.style.cursor = 'grabbing'; e.preventDefault(); }
  };
  const onMove = (e: PointerEvent) => {
    if (dragging) {
      if (!aim(e)) return; stage.updateMatrixWorld();
      floor.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0).applyQuaternion(stage.quaternion), stage.getWorldPosition(new THREE.Vector3()));
      if (ray.ray.intersectPlane(floor, hit)) { const q = stage.worldToLocal(hit.clone()); things.get(dragging)?.position.set(Math.max(-W / 2 + 30, Math.min(W / 2 - 30, q.x)), 0, Math.max(-60, Math.min(45, q.z))); }
      return;
    }
    if (isControl(e.target)) return;
    const p = pick(e); document.documentElement.style.cursor = p ? ('dog' in p ? 'pointer' : 'grab') : '';
  };
  const onUp = () => { if (dragging) { hooks.onMove(dragging); dragging = null; document.documentElement.style.cursor = ''; } };
  addEventListener('pointerdown', onDown); addEventListener('pointermove', onMove); addEventListener('pointerup', onUp);

  /* ---------- Layout ---------- */
  function layout() {
    W = canvas.clientWidth || innerWidth; CH = canvas.clientHeight || 230;
    renderer.setSize(W, CH, false);
    Object.assign(camera, { left: -W / 2, right: W / 2, top: CH / 2, bottom: -CH / 2 }); camera.updateProjectionMatrix();
    stage.position.y = -CH / 2 + GROUND;
    buildScenery();
    for (const [item, g] of things) { const [x, z] = spot(item); g.position.x = x; g.position.z = z; }
    if (wrapped && wrappedItem) { const [x, z] = spot(wrappedItem); wrapped.position.set(x, 0, z); }
  }
  const ro = new ResizeObserver(layout); ro.observe(canvas); layout();

  /* ---------- Loop ---------- */
  const clock = new THREE.Clock(); let raf = 0;
  const wrap = (a: number) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
  const ease = (cur: number, to: number, k: number) => cur + (to - cur) * k;
  function frame() {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime, k6 = Math.min(1, dt * 6), k10 = Math.min(1, dt * 10);
    for (let i = tweens.length - 1; i >= 0; i--) { const w = tweens[i]; w.t += dt; const k = Math.min(1, w.t / w.dur); w.fn(k); if (k >= 1) { tweens.splice(i, 1); w.done?.(); } }

    const c = dog.cur;
    if (!c) { dog.wait -= dt; if (dog.wait <= 0 || dog.queue.length) { if (!dog.queue.length) idleChoice(); startNext(); } }
    else if ('walk' in c) {
      const dx = c.tx! - dog.x, dz = c.tz! - dog.z, d = Math.hypot(dx, dz);
      if (d < 4 || REDUCE) { dog.x = c.tx!; dog.z = c.tz!; startNext(); }
      else { const step = Math.min(d, SPEED * (1 + dog.mood * 0.6) * dt); dog.x += dx / d * step; dog.z += dz / d * step;
        dog.want = Math.abs(dx) > Math.abs(dz) * 0.8 ? Math.sign(dx) * 1.25 : dz < 0 ? Math.PI : 0; }
    } else if ('pose' in c) { c.t = (c.t ?? 0) + dt; if (c.t >= c.dur) startNext(); }

    dog.face += wrap(dog.want - dog.face) * Math.min(1, dt * 7);
    D.root.position.set(dog.x, 0, dog.z); D.root.rotation.y = dog.face;
    dog.mood = Math.max(0, dog.mood - dt * 0.35);
    const p = dog.pose, walking = p === 'walk', lying = p === 'sleep', sitting = p === 'sit', happy = p === 'happy';
    if (walking) dog.phase += dt * 11;
    D.legs.forEach(({ hip, knee, phase, front }) => { const s = Math.sin(dog.phase + phase);
      let hx = 0, kx = 0;
      if (walking) { hx = s * 0.5; kx = Math.max(0, -s) * 0.7 * front; }
      else if (lying) hx = front > 0 ? -1.35 : 1.35;
      else if (sitting && front < 0) { hx = -1.0; kx = 1.9; }
      hip.rotation.x = ease(hip.rotation.x, hx, k10); knee.rotation.x = ease(knee.rotation.x, kx, k10); });
    if (!happy) D.rig.position.y = ease(D.rig.position.y, (lying ? -0.78 : sitting ? -0.38 : 0) + (walking ? Math.abs(Math.sin(dog.phase)) * 0.07 : 0), k10);
    D.rig.rotation.x = ease(D.rig.rotation.x, sitting ? -0.35 : 0, k6);
    const eat = p === 'eat', sniff = p === 'sniff';
    D.head.rotation.x = ease(D.head.rotation.x, eat ? 0.55 + Math.sin(t * 12) * 0.12 : sniff ? 0.35 + Math.sin(t * 18) * 0.05 : lying ? 0.3 : sitting ? 0.25 : Math.sin(t * 0.8) * 0.05, Math.min(1, dt * 8));
    D.head.rotation.z = happy ? Math.sin(t * 6) * 0.22 : REDUCE ? 0 : Math.sin(t * 0.7) * 0.08;
    D.head.rotation.y = p === 'stand' && !REDUCE ? Math.sin(t * 0.45) * 0.3 : 0;
    D.ears.forEach((e, i) => { const s = i ? 1 : -1; e.rotation.z = s * (happy ? 0.75 + Math.sin(t * 14) * 0.15 : 0.12 + (walking ? Math.sin(dog.phase + i) * 0.14 : 0)); e.rotation.x = walking ? Math.sin(dog.phase) * 0.15 : 0; });
    D.brows.forEach((b, i) => { b.rotation.z = (i ? -1 : 1) * (happy ? 0.35 : 0); b.position.y = happy ? 0.48 : 0.44; });
    D.tongue.scale.setScalar(ease(D.tongue.scale.x, happy || eat ? 1 : 0.001, k10));
    D.tail.rotation.z = REDUCE ? 0 : Math.sin(t * (7 + dog.mood * 14)) * (0.35 + dog.mood * 0.45);
    dog.blink -= dt; if (dog.blink < 0) dog.blink = 2.5 + Math.random() * 3;
    const closed = lying || happy || dog.blink < 0.12;
    D.eyes.forEach((e) => { e.scale.y = ease(e.scale.y, closed ? 0.15 : 1, Math.min(1, dt * 18)); });

    for (const g of things.values()) {
      const vx = g.userData.vx as number | undefined;
      if (vx) { g.position.x += vx * dt; const spin = g.userData.spin as THREE.Object3D;
        if (g.userData.slides) spin.rotation.y += vx * dt * 0.05; else spin.rotation.z -= vx * dt / (0.42 * S);
        g.userData.vx = vx * Math.pow(0.25, dt);
        if (Math.abs(g.position.x) > W / 2 - 40) { g.userData.vx = -g.userData.vx; g.position.x = Math.sign(g.position.x) * (W / 2 - 40); }
        if (Math.abs(g.userData.vx) < 4) g.userData.vx = 0; }
      if (!REDUCE) g.traverse((o) => { if (o.userData.float !== undefined) o.position.y += Math.sin(t * 1.5 + o.userData.float) * 0.002; });
    }
    if (wrapped && !REDUCE) { wrapped.position.y = Math.abs(Math.sin(t * 2.6)) * 10; wrapped.rotation.y = Math.sin(t * 0.9) * 0.3; }

    if (performance.now() > bubbleUntil) bubble.dataset.off = '';
    const [bx, by] = toScreen(D.head, 50); bubble.style.left = `${bx}px`; bubble.style.top = `${by}px`;
    renderer.render(scene, camera);
  }

  /* ---------- Public ---------- */
  place('bowl', false);
  dog.x = spot('bowl')[0] - 120;
  return {
    setGifts(gifts, next) {
      const fresh = gifts.slice(shown);
      const announce = !firstCall;                          // gifts already won when the garden opens just stand there
      firstCall = false;
      fresh.forEach((g) => { if (!things.has(g.item)) place(g.item, announce); });
      shown = gifts.length;
      setWrapped(next);
      const last = fresh.at(-1);
      if (last && announce) setTimeout(() => {
        note(last); dog.queue = [{ pose: 'happy', dur: 0.8, face: () => 0, text: '!' }, ...plan(last.item)]; dog.cur = null; dog.mood = 1;
      }, REDUCE ? 0 : 1000);
    },
    setRunning(on) {
      if (on === running) return; running = on;
      if (on) { clock.getDelta(); frame(); } else { cancelAnimationFrame(raf); bubble.dataset.off = ''; }
    },
    dispose() {
      cancelAnimationFrame(raf); ro.disconnect();
      removeEventListener('pointerdown', onDown); removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp);
      document.documentElement.style.cursor = '';
      fx.replaceChildren();
      scene.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose(); const mat = m.material; if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose(); });
      renderer.dispose();
    },
  };
}
