/**
 * Gift models for Byte's garden and the gift window: the same shapes in both places.
 * Units: one model unit = `unit` px (the world uses GS * GIFT_SCALE[id]).
 */
import * as THREE from 'three';
import type { PetItem } from '@/content/steps';

/** Size of each gift relative to the world's base unit: bigger than the background so earned things stand out. */
export const GIFT_SCALE: Record<PetItem | 'gift', number> = {
  // The tree stays at 1: it already reaches the top of the canvas.
  bowl: 1, tent: 1.8, ball: 1.8, tree: 1, cushion: 1.8, flowers: 1.8, frisbee: 1.8, lamp: 1.8, bench: 1.8, balloons: 1.5, gift: 1.6,
};

/** Materials and shape helpers (Byte's model in world.ts uses them too). */
export function createKit() {
  const std = (c: string, o: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });
  const shell = (c: string, o: THREE.MeshPhysicalMaterialParameters = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.18, ...o });
  const glow = (c: string, k = 1.4) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: k, roughness: 0.3 });
  const WHITE = shell('#f8f6f1'), PANEL = shell('#e9e5dc', { roughness: 0.4 }), ORANGE = shell('#e07a28', { roughness: 0.42, clearcoat: 0.35 });
  const ORANGE_DK = std('#b9581a', { roughness: 0.7 }), BLACK = shell('#23262d', { roughness: 0.35, clearcoat: 0.5 }), JOINT = std('#2c3038', { roughness: 0.5, metalness: 0.2 });
  const WOOD = std('#a7774f', { roughness: 0.8 }), WOOD_DK = std('#8a5f3c', { roughness: 0.85 });
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; return o; };
  const ball = (r: number, m: THREE.Material, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => { const o = mesh(new THREE.SphereGeometry(r, 32, 24), m, x, y, z); o.scale.set(sx, sy, sz); return o; };
  return { std, shell, glow, mesh, ball, M: { WHITE, PANEL, ORANGE, ORANGE_DK, BLACK, JOINT, WOOD, WOOD_DK } };
}
export type Kit = ReturnType<typeof createKit>;

export function createModels(kit: Kit = createKit()) {
  const { std, shell, glow, mesh, ball } = kit;
  const { JOINT, WOOD, WOOD_DK } = kit.M;
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
      const flaps: THREE.Object3D[] = [];
      [-1, 1].forEach((s) => { const f = mesh(new THREE.ShapeGeometry(flap), A, s * 1.75, 0, 1.46); f.scale.x = -s; g.add(f); flaps.push(f);
        g.add(mesh(new THREE.TorusGeometry(0.1, 0.03, 6, 12), std('#e5484d'), s * 0.95, 0.95, 1.5)); });
      g.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 8), WOOD_DK, 0, 2.95, 1.45));
      g.add(mesh(new THREE.ConeGeometry(0.16, 0.34, 3), std('#e5484d'), 0.15, 3.15, 1.45).rotateZ(-Math.PI / 2));
      g.add(mesh(new THREE.BoxGeometry(3.2, 0.03, 2.9), std('#6d8fd8', { roughness: 0.9 }), 0, 0.02, 0));
      const lantern = new THREE.Group(); lantern.position.set(0.6, 0, -0.9); g.add(lantern);
      lantern.add(mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.08, 12), JOINT, 0, 0.04, 0)); lantern.add(ball(0.14, glow('#ffd98a', 1.8), 0, 0.22, 0, 1, 1.3, 1));
      [-1, 1].forEach((s) => { const r = mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.6, 4), WOOD_DK, s * 2.05, 0.9, 1.0); r.rotation.z = s * 0.75; g.add(r); });
      g.userData.flaps = flaps;   // rotate .y to open the door (world.ts, use moment)
      [-1, 1].forEach((s) => g.add(mesh(new THREE.ConeGeometry(0.06, 0.22, 6), WOOD_DK, s * 2.6, 0.08, 1.55).rotateZ(Math.PI)));
      g.add(mesh(new THREE.BoxGeometry(1.3, 0.03, 0.55), std('#e5484d', { roughness: 1 }), 0, 0.03, 1.9));
      [-0.45, 0, 0.45].forEach((x) => g.add(mesh(new THREE.BoxGeometry(0.22, 0.035, 0.5), std('#ffffff', { roughness: 1 }), x, 0.035, 1.9)));
      return g; },
    ball() { const g = new THREE.Group(); const b = new THREE.Group(); b.position.y = 0.42; g.add(b);
      b.add(ball(0.42, std('#d6ec4a', { roughness: 0.95 })));
      [0.5, -0.5].forEach((tilt, i) => { const sm = mesh(new THREE.TorusGeometry(0.33, 0.025, 6, 32), std('#ffffff', { roughness: 0.9 }), 0, 0, i ? -0.18 : 0.18); sm.rotation.set(0, Math.PI / 2, tilt); b.add(sm); });
      g.userData.spin = b;
      return g; },
    frisbee() { const g = new THREE.Group(); const b = new THREE.Group(); b.position.y = 0.08; g.add(b);
      b.add(mesh(new THREE.CylinderGeometry(0.62, 0.52, 0.1, 36), shell('#1fa37a')));
      const rimF = mesh(new THREE.TorusGeometry(0.58, 0.05, 8, 36), shell('#f3dda8'), 0, 0.05, 0); rimF.rotation.x = Math.PI / 2; b.add(rimF);
      g.userData.spin = b; g.userData.slides = true; [0.36, 0.46].forEach((r) => { const ring = mesh(new THREE.TorusGeometry(r, 0.012, 6, 36), shell('#168a66'), 0, 0.055, 0); ring.rotation.x = Math.PI / 2; b.add(ring); });
      const paw = std('#ffffff', { roughness: 0.6 });
      b.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 16), paw, 0, 0.06, 0.03));
      [[-0.11, -0.1], [-0.04, -0.15], [0.04, -0.15], [0.11, -0.1]].forEach(([x, z]) => b.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.012, 12), paw, x, 0.06, z)));
      return g; },
    tree() { const g = new THREE.Group();   // tall, at the window's edge; Byte climbs to the left branch
      g.add(mesh(new THREE.CylinderGeometry(0.28, 0.46, 8.2, 16), WOOD, 0, 4.1, 0));
      [[0.45, 0.4], [-0.45, 0.3], [0.1, -0.5]].forEach(([x, z]) => { const r = mesh(new THREE.CylinderGeometry(0.07, 0.2, 0.7, 8), WOOD, x, 0.18, z); r.rotation.set(z * 1.2, 0, -x * 1.6); g.add(r); });
      const low = mesh(new THREE.CylinderGeometry(0.11, 0.17, 1.9, 10), WOOD, -0.95, 4.0, 0.1); low.rotation.z = Math.PI / 2 - 0.08; g.add(low);
      g.add(mesh(new THREE.IcosahedronGeometry(0.42, 1), std('#5fbf74', { flatShading: true, roughness: 0.75 }), -1.95, 4.25, 0.1));
      const high = mesh(new THREE.CylinderGeometry(0.08, 0.13, 1.2, 8), WOOD, 0.6, 6.3, 0); high.rotation.z = -1.0; g.add(high);
      const greens = ['#5fbf74', '#4fae66', '#6ccb7f'];
      [[0, 8.9, 0, 1.45], [1.0, 8.4, 0.3, 1.0], [-1.0, 8.5, -0.1, 1.05], [0.25, 9.8, -0.2, 0.9], [-0.4, 8.0, 0.75, 0.85], [0.7, 9.3, 0.6, 0.8], [1.15, 6.9, 0.1, 0.6]].forEach(([x, y, z, r], i) =>
        g.add(mesh(new THREE.IcosahedronGeometry(r, 1), std(greens[i % 3], { roughness: 0.75, flatShading: true }), x, y, z)));
      [[0.7, 8.0, 1.0], [-0.6, 8.6, 1.0], [0.2, 9.4, 0.95], [1.3, 8.7, 0.6], [-1.3, 8.1, 0.5], [0.1, 7.7, 1.2]].forEach(([x, y, z], i) => {
        const apple = ball(0.14, shell('#e5484d'), x, y, z); g.add(apple);
        apple.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 5), WOOD_DK, 0, 0.15, 0));
        if (i === 5) g.userData.apple = apple;   // the one that falls (world.ts, use moment)
      });
      return g; },
    cushion() { const g = new THREE.Group();
      const rimC = mesh(new THREE.TorusGeometry(1.15, 0.32, 18, 48), std('#3d5afe', { roughness: 0.9 }), 0, 0.32, 0); rimC.rotation.x = Math.PI / 2; g.add(rimC);
      g.add(mesh(new THREE.CylinderGeometry(1.15, 1.2, 0.3, 48), std('#e4e9ff', { roughness: 0.95 }), 0, 0.18, 0));
      [[0, 0], [0.5, 0.3], [-0.5, 0.3], [0.5, -0.35], [-0.5, -0.35]].forEach(([x, z]) => g.add(ball(0.05, std('#9fb0ff'), x, 0.34, z, 1, 0.5, 1)));
      const blanket = mesh(new THREE.BoxGeometry(0.9, 0.06, 0.7), std('#ffb020', { roughness: 0.95 }), 0.55, 0.42, 0.5); blanket.rotation.set(0.15, 0.5, 0.1); g.add(blanket);
      const thread = std('#ffffff', { roughness: 0.9 });
      for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; g.add(ball(0.03, thread, Math.cos(a) * 1.15, 0.64, Math.sin(a) * 1.15)); }
      const bone = new THREE.Group(); bone.position.set(-0.45, 0.42, -0.15); bone.rotation.y = 0.6; g.add(bone);
      const plush = std('#fff3d6', { roughness: 1 });
      bone.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.6, 10), plush).rotateZ(Math.PI / 2));
      [-0.32, 0.32].forEach((x) => [-0.07, 0.07].forEach((z) => bone.add(ball(0.09, plush, x, 0, z))));
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
        const petal = std(c, { side: THREE.DoubleSide, roughness: 0.5 });
        g.add(mesh(cup, petal, x, 0.6 + h, z));
        [0, 2.1, 4.2].forEach((a) => { const pt = ball(0.09, petal, x + Math.cos(a) * 0.08, 0.6 + h + 0.2, z + Math.sin(a) * 0.08, 0.6, 1.3, 0.35); pt.rotation.y = -a; pt.rotation.z = 0.25; g.add(pt); }); });
      const can = new THREE.Group(); can.position.set(1.35, 0, 0.35); can.rotation.y = -0.5; g.add(can);
      const tin = shell('#7fb3d5', { roughness: 0.35, metalness: 0.3 });
      can.add(mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.42, 20), tin, 0, 0.21, 0));
      can.add(mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.5, 8), tin, 0.3, 0.36, 0).rotateZ(-0.9));
      const hand = mesh(new THREE.TorusGeometry(0.14, 0.03, 8, 16, Math.PI), tin, -0.05, 0.42, 0); can.add(hand);
      return g; },
    lamp() { const g = new THREE.Group();
      g.add(mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.2, 16), JOINT, 0, 0.1, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.6, 12), std('#1b2b4b', { metalness: 0.3, roughness: 0.4 }), 0, 1.4, 0));
      g.add(mesh(new THREE.ConeGeometry(0.42, 0.35, 6), std('#1b2b4b', { metalness: 0.3, roughness: 0.4 }), 0, 2.95, 0));
      const bulb = ball(0.22, glow('#ffd98a', 2), 0, 2.72, 0, 1, 1.2, 1); g.add(bulb);
      (bulb.material as THREE.MeshStandardMaterial).emissiveIntensity = 0; (bulb.material as THREE.MeshStandardMaterial).color.set('#d9d2bd');
      g.userData.bulb = bulb;   // off until Byte's first visit (world.ts, use moment)
      g.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 6, 1, true), std('#ffffff', { transparent: true, opacity: 0.25, roughness: 0.05, side: THREE.DoubleSide }), 0, 2.72, 0));
      [0, 1, 2, 3, 4, 5].forEach((i) => { const a = (i / 6) * Math.PI * 2; g.add(mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 4), std('#1b2b4b', { metalness: 0.3 }), Math.cos(a) * 0.3, 2.72, Math.sin(a) * 0.3)); });
      g.add(ball(0.06, std('#1b2b4b', { metalness: 0.3 }), 0, 3.15, 0));
      return g; },
    bench() { const g = new THREE.Group();
      for (let i = 0; i < 3; i++) g.add(mesh(new THREE.BoxGeometry(2.0, 0.08, 0.2), WOOD, 0, 0.6, -0.25 + i * 0.25));
      for (let i = 0; i < 2; i++) { const b = mesh(new THREE.BoxGeometry(2.0, 0.18, 0.06), WOOD, 0, 0.9 + i * 0.25, -0.42); b.rotation.x = -0.15; g.add(b); }
      [-0.85, 0.85].forEach((x) => { g.add(mesh(new THREE.BoxGeometry(0.08, 0.6, 0.6), std('#1b2b4b', { metalness: 0.3 }), x, 0.3, 0)); g.add(mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), std('#1b2b4b', { metalness: 0.3 }), x, 1.0, -0.42)); });
      [-0.95, 0.95].forEach((x) => g.add(mesh(new THREE.BoxGeometry(0.1, 0.06, 0.62), WOOD_DK, x, 0.88, -0.05)));
      const bolt = std('#c9ced6', { metalness: 0.6, roughness: 0.3 });
      for (let i = 0; i < 3; i++) [-0.85, 0.85].forEach((x) => g.add(ball(0.025, bolt, x, 0.65, -0.25 + i * 0.25)));
      const pillow = mesh(new THREE.BoxGeometry(0.6, 0.12, 0.45), std('#8250df', { roughness: 0.95 }), -0.45, 0.7, 0); pillow.rotation.y = 0.15; g.add(pillow);
      g.add(ball(0.035, std('#ffd34d'), -0.45, 0.77, 0));
      return g; },
    balloons() { const g = new THREE.Group(); const cols = ['#e5484d', '#3d5afe', '#ffb020', '#1fa37a', '#8250df'];
      g.add(mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.22, 12), WOOD_DK, 0, 0.11, 0));
      cols.forEach((c, i) => { const a = i / cols.length * Math.PI * 2, x = Math.cos(a) * 0.45, z = Math.sin(a) * 0.3, y = 2.4 + (i % 2) * 0.4;
        const b = ball(0.34, shell(c, { roughness: 0.25 }), x, y, z, 1, 1.15, 1); b.userData.float = i; g.add(b);
        g.add(mesh(new THREE.ConeGeometry(0.06, 0.1, 8), shell(c), x, y - 0.42, z).rotateZ(Math.PI));
        const pts = Array.from({ length: 13 }, (_, k) => { const f = k / 12; return new THREE.Vector3(x * f + Math.sin(f * 14 + i) * 0.04, 0.22 + (y - 0.6) * f, z * f); });
        g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#5b6b88' }))); });
      return g; },
    gift() { const g = new THREE.Group(); const blue = shell('#3d5afe'), rib = shell('#f3dda8');
      g.add(mesh(new THREE.BoxGeometry(0.9, 0.72, 0.9), blue, 0, 0.36, 0)); g.add(mesh(new THREE.BoxGeometry(1.0, 0.16, 1.0), blue, 0, 0.78, 0));
      g.add(mesh(new THREE.BoxGeometry(0.93, 0.9, 0.16), rib, 0, 0.45, 0)); g.add(mesh(new THREE.BoxGeometry(0.16, 0.9, 0.93), rib, 0, 0.45, 0));
      [0.7, -0.7].forEach((r) => { const b = mesh(new THREE.TorusGeometry(0.17, 0.06, 10, 20), rib, 0, 1.0, 0); b.scale.set(1, 1.3, 1); b.rotation.set(Math.PI / 2 - 0.4, r, 0); g.add(b); });
      return g; },
  };
  const build = (id: PetItem | 'gift', unit: number) => {
    const g = BUILD[id](); g.scale.setScalar(unit);
    g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return g;
  };
  return { kit, build };
}
