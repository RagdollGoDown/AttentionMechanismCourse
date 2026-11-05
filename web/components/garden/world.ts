/**
 * Byte's garden: a transparent three.js layer along the bottom of the window.
 * Byte (an original robot beagle) wanders the band, uses the gifts he receives, and can be petted.
 * Everything here is decoration on the lesson's terms: calm while the learner works, one short
 * celebration per gift, no motion at all with prefers-reduced-motion (petting still answers).
 * Loaded lazily by Garden.tsx, client only.
 */
import * as THREE from 'three';
import type { PetItem } from '@/content/steps';
import { createModels, GIFT_SCALE } from '@/components/garden/models';

export interface GiftView { item: PetItem; name: string; title: string; fact: string }
export interface World {
  /** Shows these gifts; new ones (after the first call) drop in with a note. */
  setGifts: (gifts: GiftView[], next: PetItem | null) => void;
  setRunning: (on: boolean) => void;
  /** A short cheer from Byte (a random hype line if no text). Skipped while his hello is open or a gift is on its way. */
  cheer: (text?: string) => void;
  /** The end of the lesson: Byte jumps for joy under confetti. */
  celebrate: (text: string) => void;
  /** Byte's closable hello above his head; he stays put until it is closed. */
  intro: (text: { title: string; body: string; close: string }, onClose: () => void) => void;
  dispose: () => void;
}

const S = 32;                  // px per model unit (Byte)
const GS = 38;                 // px per model unit (his things: a bit bigger, so each gift is easy to see)
const GROUND = 46;             // px from the canvas bottom to Byte's feet
const SPEED = 80;              // px per second

/* Where each thing stands: share of the window width, depth (negative = further back). Tall things at the ends. */
const SPOTS: Record<PetItem, [number, number]> = {
  tent: [0.1, -38], balloons: [0.24, -46], flowers: [0.34, 18], lamp: [0.44, -46], frisbee: [0.5, 32],
  ball: [0.58, 30], bench: [0.67, -40], bowl: [0.76, 18], cushion: [0.87, -28], tree: [1, -40],
};

type Step =
  | { walk: () => [number, number]; tx?: number; tz?: number; t?: number }
  | { kick: PetItem }
  | { pose: Pose; dur: number; face?: () => number; text?: string; t?: number }
  | { climb: () => number; ty?: number };
type Pose = 'stand' | 'walk' | 'eat' | 'sleep' | 'sit' | 'sniff' | 'happy' | 'climb';

export function createWorld(canvas: HTMLCanvasElement, fx: HTMLElement, hooks: { onPet: () => void; onMove: (item: PetItem) => void }, hype: readonly string[]): World {
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
  Object.assign(sun.shadow.camera, { left: -1600, right: 1600, top: 700, bottom: -500, near: 10, far: 4000 });
  sun.shadow.radius = 5; sun.target = stage; scene.add(sun);
  const rimLight = new THREE.DirectionalLight('#c9d6ff', 0.8); rimLight.position.set(600, 300, -500); scene.add(rimLight);

  /* ---------- Materials, shape helpers and gift models (models.ts, shared with the gift window) ---------- */
  const models = createModels();
  const { std, mesh, ball } = models.kit;
  const { WHITE, PANEL, ORANGE, ORANGE_DK, BLACK, JOINT, WOOD_DK } = models.kit.M;
  const glow = models.kit.glow;
  // ponytail: sized once for the window width at load; a resize keeps the sizes (re-place on resize if it matters).
  const FIT = Math.min(1, Math.max(0.65, innerWidth / 1280));
  const unit = (id: PetItem | 'gift') => GS * GIFT_SCALE[id] * FIT;   // px per model unit of this thing
  const BRANCH = 4.15 * unit('tree');                                // height of the tree branch Byte sits on
  const build = (id: PetItem | 'gift') => models.build(id, unit(id));

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

  /* ---------- Scenery: a fence, pines, bushes, grass and a stone path, for depth. Calm, all in the band. ---------- */
  const scenery = new THREE.Group(); stage.add(scenery);
  const rnd = (i: number) => { const v = Math.sin(i * 12.9898) * 43758.5453; return v - Math.floor(v); };   // stable across resizes
  function buildScenery() {
    scenery.clear();
    const at = (f: number) => (f - 0.5) * W;
    const add = (o: THREE.Object3D, x: number, z: number, s: number) => { o.position.set(x, 0, z); o.scale.setScalar(S * s); scenery.add(o); };
    const bush = (x: number, z: number, s: number) => { const g = new THREE.Group();
      [[0, 0.5, 0, 0.7], [0.6, 0.4, 0.1, 0.55], [-0.55, 0.38, 0, 0.5], [0.15, 0.85, -0.1, 0.5]].forEach(([a, b, c, r], i) => g.add(mesh(new THREE.IcosahedronGeometry(r, 1), std(['#7cc47e', '#6ab56f', '#8bd08a'][i % 3], { flatShading: true, roughness: 0.8 }), a, b, c)));
      add(g, x, z, s); };
    const pine = (x: number, z: number, s: number) => { const g = new THREE.Group();
      g.add(mesh(new THREE.CylinderGeometry(0.14, 0.2, 1, 8), WOOD_DK, 0, 0.5, 0));
      [[0.8, 1.6, 1.4], [0.68, 1.4, 2.3], [0.52, 1.2, 3.1], [0.34, 1.0, 3.8]].forEach(([r, h, y], i) => g.add(mesh(new THREE.ConeGeometry(r * 1.5, h, 9), std(i % 2 ? '#4f9e63' : '#5aae6c', { flatShading: true, roughness: 0.85 }), 0, y, 0)));
      add(g, x, z, s); };
    const rock = (x: number, z: number, s: number) => { const r = mesh(new THREE.DodecahedronGeometry(0.4, 0), std('#c4c7cf', { flatShading: true, roughness: 0.9 }), x, 0.15 * S * s, z); r.scale.set(S * s * 1.3, S * s * 0.7, S * s); r.rotation.y = x; scenery.add(r); };
    // The fence along the back
    const FENCE = std('#d9c3a3', { roughness: 0.85 });
    for (let x = -W / 2 + 20; x < W / 2; x += 84) { const post = mesh(new THREE.BoxGeometry(0.16, 1.3, 0.16), FENCE, x, 0.65 * S, -92); post.scale.setScalar(S); scenery.add(post); }
    [0.45, 0.95].forEach((y) => { const rail = mesh(new THREE.BoxGeometry(W, 0.1 * S, 0.06 * S), FENCE, 0, y * S, -92); scenery.add(rail); });
    // Pines on the left edge, balancing the tall tree on the right
    pine(at(0.012), -70, 1.25); pine(at(0.04), -84, 0.95); pine(at(0.025), -40, 0.75);
    bush(at(0.35), -70, 0.8); bush(at(0.6), -72, 0.7); bush(at(0.73), -66, 0.9); bush(at(0.5), -80, 0.6); bush(at(0.9), -78, 0.75); bush(at(0.17), -76, 0.7);
    rock(at(0.48), 34, 0.7); rock(at(0.23), -10, 0.5); rock(at(0.83), 40, 0.55);
    // Grass tufts and small wildflowers, scattered but the same at every resize
    const GRASS = std('#7fbf6e', { roughness: 0.9 }), WILD = ['#ffffff', '#ffd23f', '#ff8fb1', '#9fb0ff'];
    for (let i = 0; i < Math.round(W / 70); i++) {
      const x = at(rnd(i) * 0.96 + 0.02), z = -60 + rnd(i + 99) * 110, g = new THREE.Group();
      [-0.12, 0, 0.12].forEach((dx, j) => { const blade = mesh(new THREE.ConeGeometry(0.06, 0.45 + j * 0.08, 4), GRASS, dx, 0.22, 0); blade.rotation.z = -dx * 2.5; g.add(blade); });
      if (i % 3 === 0) g.add(ball(0.07, std(WILD[i % 4], { roughness: 0.6 }), 0.05, 0.55, 0.02));
      add(g, x, z, 1);
    }
    // Stepping stones across the garden
    const STONE = std('#d8d4cb', { roughness: 0.95 });
    for (let i = 0; i < Math.round(W / 130); i++) {
      const st = mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.06, 10), STONE, at((i + 0.5) / Math.round(W / 130)), 1, 52 + Math.sin(i * 1.3) * 8);
      st.scale.set(S, S, S * 0.7); st.castShadow = false; st.receiveShadow = true; scenery.add(st);
    }
  }

  /* ---------- State ---------- */
  const things = new Map<PetItem, THREE.Group>();
  let wrapped: THREE.Group | null = null, wrappedItem: PetItem | null = null, shown = 0, firstCall = true, hello: HTMLElement | null = null, giftDue = 0;
  const hypeLine = () => hype[Math.floor(Math.random() * hype.length)];
  // The tree hugs the window's right edge, so Byte on its branch sits in the page margin, not behind the lesson.
  const spot = (item: PetItem): [number, number] => [item === 'tree' ? W / 2 - 26 : (SPOTS[item][0] - 0.5) * W, SPOTS[item][1]];

  const tweens: { t: number; dur: number; fn: (k: number) => void; done?: () => void }[] = [];
  const tween = (dur: number, fn: (k: number) => void, done?: () => void) => { if (REDUCE) { fn(1); done?.(); return; } tweens.push({ t: 0, dur, fn, done }); };
  const bounce = (t: number) => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; };
  const toScreen = (obj: THREE.Object3D, up = 0): [number, number] => {
    const v = new THREE.Vector3(); obj.getWorldPosition(v); v.y += up; v.project(camera);
    const r = canvas.getBoundingClientRect(); return [r.left + (v.x + 1) / 2 * W, r.top + (1 - v.y) / 2 * CH];
  };

  /* Labels. Speech and hearts sit behind the lesson like Byte (they must never cover an exercise);
     the hello, the gift note and the confetti go in `fx`, in front. */
  const back = document.createElement('div'); back.className = 'garden-fx garden-fx-back'; back.setAttribute('aria-hidden', 'true'); canvas.after(back);
  const bubble = document.createElement('div'); bubble.className = 'garden-say'; bubble.dataset.off = ''; back.appendChild(bubble);
  let bubbleUntil = 0;
  const say = (text: string, secs = 2.2) => { bubble.textContent = text; delete bubble.dataset.off; bubbleUntil = performance.now() + secs * 1000; };
  function hearts() {
    const [x, y] = toScreen(D.head, 36);
    for (let i = 0; i < 6; i++) setTimeout(() => {
      const h = document.createElement('span'); h.className = 'garden-heart'; h.textContent = '♥';
      h.style.left = `${x + (Math.random() - .5) * 46}px`; h.style.top = `${y}px`; h.style.setProperty('--dx', `${(Math.random() - .5) * 70}px`);
      back.appendChild(h); setTimeout(() => h.remove(), 1500);
    }, i * 130);
  }
  function place(item: PetItem, drop: boolean) {
    const [x, z] = spot(item); const g = build(item); g.position.set(x, 0, z); g.userData.item = item; stage.add(g); things.set(item, g);
    if (drop && !REDUCE) { g.position.y = 300; tween(0.95, (k) => { g.position.y = 300 * (1 - bounce(k)); }); }
  }
  function setWrapped(item: PetItem | null) {
    if (wrapped && wrappedItem !== item) { const box = wrapped; tween(0.35, (k) => { box.scale.setScalar(unit('gift') * Math.max(0.01, 1 - k)); box.rotation.y = k * 4; }, () => stage.remove(box)); wrapped = null; }
    wrappedItem = item;
    if (item && !wrapped) { const [x, z] = spot(item); wrapped = build('gift'); wrapped.position.set(x, 0, z); stage.add(wrapped); }
  }

  /* ---------- Behaviour: a queue of small actions ---------- */
  const dog = { x: 0, y: 0, z: 8, face: 0, want: 0, phase: 0, queue: [] as Step[], cur: null as Step | null, wait: 2, blink: 2, mood: 0, pose: 'stand' as Pose };
  function plan(item: PetItem): Step[] {
    const g = () => things.get(item)!.position; const side = () => (dog.x < g().x ? -1 : 1);
    switch (item) {
      case 'bowl': return [{ walk: () => [g().x - 18 + side() * 44, g().z + 8] }, { pose: 'eat', dur: 3.2, face: () => -side() * 1.3, text: 'nom nom' }];
      case 'tent': return [{ walk: () => [g().x, g().z + 75] }, { walk: () => [g().x, g().z - 4] }, { pose: 'sleep', dur: 5, face: () => 0, text: 'z z z' }, { walk: () => [g().x, g().z + 75] }];
      case 'ball': case 'frisbee': return [{ walk: () => [g().x + side() * 44, g().z] }, { kick: item }, { pose: 'stand', dur: 0.8 }, { walk: () => [g().x + side() * 44, g().z] }, { pose: 'happy', dur: 1.3, face: () => 0, text: 'got it!' }];
      case 'tree': { const bx = () => g().x - 0.8 * unit('tree');
        return [{ walk: () => [bx(), g().z + 5] }, { climb: () => BRANCH }, { pose: 'sit', dur: 6, face: () => 0, text: 'What a view!' }, { climb: () => 0 }, { walk: () => [bx() - 70, g().z + 55] }]; }
      case 'cushion': return [{ walk: () => [g().x, g().z] }, { pose: 'sleep', dur: 5, face: () => 0, text: 'z z z' }];
      case 'flowers': return [{ walk: () => [g().x + side() * 56, g().z + 8] }, { pose: 'sniff', dur: 2.6, face: () => -side() * 1.3, text: '✿' }];
      case 'lamp': return [{ walk: () => [g().x + 34, g().z + 40] }, { pose: 'sit', dur: 4, face: () => 0, text: '…' }];
      case 'bench': return [{ walk: () => [g().x + side() * 80, g().z + 45] }, { pose: 'sit', dur: 4, face: () => 0, text: '♪' }];
      case 'balloons': return [{ walk: () => [g().x + 40, g().z + 50] }, { pose: 'happy', dur: 2, face: () => 0, text: 'party!' }];
    }
  }
  function idleChoice() {
    if (REDUCE || hello) return;
    const items = [...things.keys()];
    if (items.length && Math.random() < 0.55) { dog.queue = plan(items[Math.floor(Math.random() * items.length)]); return; }
    const x = (Math.random() * 0.86 + 0.07 - 0.5) * W;
    dog.queue = [{ walk: () => [x, -20 + Math.random() * 50] }, { pose: 'stand', dur: 1.5 + Math.random() * 2, face: () => 0 }];
  }
  function startNext() {
    const n = dog.queue[0];
    if (dog.y > 0 && n && ('walk' in n || 'kick' in n)) dog.queue.unshift({ climb: () => 0 });   // never walk off a branch
    dog.cur = dog.queue.shift() ?? null;
    const c = dog.cur;
    if (!c) { dog.wait = 2.5 + Math.random() * 3.5; dog.pose = 'stand'; dog.want = 0; return; }
    if ('walk' in c) { [c.tx, c.tz] = c.walk(); dog.pose = 'walk'; }
    else if ('climb' in c) { c.ty = c.climb(); dog.pose = 'climb'; const tree = things.get('tree'); dog.want = tree && tree.position.x < dog.x ? -1.25 : 1.25; }
    else if ('kick' in c) { const b = things.get(c.kick); if (b) b.userData.vx = (dog.x < b.position.x ? 1 : -1) * 260; dog.mood = 1; dog.cur = null; }
    else { c.t = 0; dog.pose = c.pose; if (c.face) dog.want = c.face(); if (c.text) say(c.text, c.dur); }
  }
  const jump = () => tween(0.9, (k) => { D.rig.position.y = Math.abs(Math.sin(k * Math.PI * 2)) * 0.5; }, () => { D.rig.position.y = 0; });
  function pet() {
    dog.queue = []; dog.cur = { pose: 'happy', dur: 1.7, t: 0 }; dog.pose = 'happy'; dog.want = 0; dog.mood = 1;
    say('♥', 1.7); hearts(); hooks.onPet(); jump();
  }
  function confetti() {
    if (REDUCE) return;
    const cols = ['#3d5afe', '#ffb020', '#e5484d', '#1fa37a', '#8250df', '#ff8fb1'];
    for (let i = 0; i < 60; i++) {
      const c = document.createElement('span'); c.className = 'garden-confetti';
      c.style.left = `${Math.random() * 100}%`; c.style.background = cols[i % cols.length];
      c.style.animationDelay = `${Math.random() * 0.8}s`; c.style.setProperty('--dx', `${(Math.random() - .5) * 160}px`);
      fx.appendChild(c); setTimeout(() => c.remove(), 4200);
    }
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
    for (const [item, g] of things) if (item !== 'tree' && ray.intersectObject(g, true).length) return { item };
    return null;
  }
  // Byte is drawn behind the lesson: a press on a control or a card belongs to the lesson, not to him.
  const isControl = (t: EventTarget | null) => t instanceof Element && !!t.closest('button, input, textarea, select, a, label, [role="button"], .bg-card');
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
    } else if ('climb' in c) {
      const d = c.ty! - dog.y;
      if (Math.abs(d) < 3 || REDUCE) { dog.y = c.ty!; startNext(); }
      else { dog.y += Math.sign(d) * Math.min(Math.abs(d), SPEED * 0.7 * dt); dog.phase += dt * 9; }
    } else if ('pose' in c) { c.t = (c.t ?? 0) + dt; if (c.t >= c.dur) startNext(); }

    dog.face += wrap(dog.want - dog.face) * Math.min(1, dt * 7);
    D.root.position.set(dog.x, dog.y, dog.z); D.root.rotation.y = dog.face;
    dog.mood = Math.max(0, dog.mood - dt * 0.35);
    const p = dog.pose, climbing = p === 'climb', walking = p === 'walk' || climbing, lying = p === 'sleep', sitting = p === 'sit', happy = p === 'happy';
    if (p === 'walk') dog.phase += dt * 11;
    D.legs.forEach(({ hip, knee, phase, front }) => { const s = Math.sin(dog.phase + phase);
      let hx = 0, kx = 0;
      if (walking) { hx = s * 0.5; kx = Math.max(0, -s) * 0.7 * front; }
      else if (lying) hx = front > 0 ? -1.35 : 1.35;
      else if (sitting && front < 0) { hx = -1.0; kx = 1.9; }
      hip.rotation.x = ease(hip.rotation.x, hx, k10); knee.rotation.x = ease(knee.rotation.x, kx, k10); });
    if (!happy) D.rig.position.y = ease(D.rig.position.y, (climbing ? 1.0 : lying ? -0.78 : sitting ? -0.38 : 0) + (walking ? Math.abs(Math.sin(dog.phase)) * 0.07 : 0), k10);
    D.rig.rotation.x = ease(D.rig.rotation.x, climbing ? -1.15 : sitting ? -0.35 : 0, k6);
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
        if (g.userData.slides) spin.rotation.y += vx * dt * 0.05; else spin.rotation.z -= vx * dt / (0.42 * unit(g.userData.item as PetItem));
        g.userData.vx = vx * Math.pow(0.25, dt);
        if (Math.abs(g.position.x) > W / 2 - 40) { g.userData.vx = -g.userData.vx; g.position.x = Math.sign(g.position.x) * (W / 2 - 40); }
        if (Math.abs(g.userData.vx) < 4) g.userData.vx = 0; }
      if (!REDUCE) g.traverse((o) => { if (o.userData.float !== undefined) o.position.y += Math.sin(t * 1.5 + o.userData.float) * 0.002; });
    }
    if (wrapped && !REDUCE) { wrapped.position.y = Math.abs(Math.sin(t * 2.6)) * 10; wrapped.rotation.y = Math.sin(t * 0.9) * 0.3; }

    if (performance.now() > bubbleUntil) bubble.dataset.off = '';
    const [bx, by] = toScreen(D.head, 50); bubble.style.left = `${bx}px`; bubble.style.top = `${by}px`;
    if (hello) { hello.style.left = `${Math.min(innerWidth - 170, Math.max(170, bx))}px`; hello.style.top = `${by}px`; }
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
      if (last && announce) { giftDue = performance.now() + 1500; setTimeout(() => {
        dog.queue = [{ pose: 'happy', dur: 1.6, face: () => 0, text: hypeLine() }, ...plan(last.item)]; dog.cur = null; dog.mood = 1;
      }, REDUCE ? 0 : 1000); }
    },
    cheer(text) {
      if (hello || performance.now() < giftDue) return;
      dog.queue = [{ pose: 'happy', dur: 1.8, face: () => 0, text: text ?? hypeLine() }]; dog.cur = null; dog.mood = 1; jump();
    },
    celebrate(text) {
      hello?.remove(); hello = null;
      dog.queue = [{ pose: 'happy', dur: 1.5, face: () => 0, text }, { pose: 'happy', dur: 1.5, face: () => 0, text }, { pose: 'happy', dur: 1.5, face: () => 0, text }];
      dog.cur = null; dog.mood = 1;
      confetti(); [0, 1000, 2000].forEach((ms) => setTimeout(() => { jump(); hearts(); }, ms));
    },
    intro(text, onClose) {
      if (hello) return;
      hello = document.createElement('div'); hello.className = 'garden-hello'; hello.setAttribute('role', 'dialog'); hello.setAttribute('aria-label', text.title);
      const strong = document.createElement('strong'); strong.textContent = text.title;
      const p = document.createElement('p'); p.textContent = text.body;
      const x = document.createElement('button'); x.type = 'button'; x.className = 'garden-hello-x'; x.setAttribute('aria-label', 'Close'); x.textContent = '×';
      const ok = document.createElement('button'); ok.type = 'button'; ok.className = 'garden-hello-ok'; ok.textContent = text.close;
      const close = () => { hello?.remove(); hello = null; dog.wait = 1; onClose(); };
      x.onclick = close; ok.onclick = close;
      hello.append(x, strong, p, ok); fx.appendChild(hello);
      dog.queue = [{ pose: 'happy', dur: 1.2, face: () => 0 }]; dog.cur = null; dog.want = 0; dog.mood = 1;
    },
    setRunning(on) {
      if (on === running) return; running = on; back.hidden = !on;
      if (on) { clock.getDelta(); frame(); } else { cancelAnimationFrame(raf); bubble.dataset.off = ''; }
    },
    dispose() {
      cancelAnimationFrame(raf); ro.disconnect();
      removeEventListener('pointerdown', onDown); removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp);
      document.documentElement.style.cursor = '';
      fx.replaceChildren(); back.remove();
      scene.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose(); const mat = m.material; if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose(); });
      renderer.dispose();
    },
  };
}
