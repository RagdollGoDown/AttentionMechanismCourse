/**
 * The 3D part of the gift window: the wrapped box shakes, its ribbon and lid fly off, and the gift
 * rises out and turns slowly. Uses the same models as the garden (models.ts). Client only.
 */
import * as THREE from 'three';
import type { PetItem } from '@/content/steps';
import { createModels } from '@/components/garden/models';

export interface Reveal {
  /** Plays the unwrapping; resolves once the gift is shown. */
  unwrap: () => Promise<void>;
  dispose: () => void;
}

const VIEW = 3.2;   // visible height, in model units

export function createReveal(canvas: HTMLCanvasElement, item: PetItem, reduce: boolean): Reveal {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  const w = canvas.clientWidth || 300, h = canvas.clientHeight || 220;
  renderer.setSize(w, h, false);

  const scene = new THREE.Scene();
  const aspect = w / h;
  const camera = new THREE.OrthographicCamera(-VIEW * aspect / 2, VIEW * aspect / 2, VIEW / 2, -VIEW / 2, -50, 50);
  camera.position.set(0, 1.4, 6); camera.lookAt(0, 1.05, 0);
  scene.add(new THREE.HemisphereLight('#ffffff', '#b8cfae', 1.7));
  const sun = new THREE.DirectionalLight('#fff3dc', 2.2); sun.position.set(-3, 6, 5); scene.add(sun);

  const models = createModels();
  const box = models.build('gift', 1.3);
  scene.add(box);
  // Box parts in build order: body, lid, two ribbon bands, two bow loops.
  const [, lid, ribA, ribB, bowA, bowB] = box.children;

  const gift = models.build(item, 1);
  const bounds = new THREE.Box3().setFromObject(gift);
  const size = bounds.getSize(new THREE.Vector3()), mid = bounds.getCenter(new THREE.Vector3());
  const fit = 2.7 / Math.max(size.x, size.y, size.z * 0.8);
  const baseY = 1.05 - mid.y * fit;                 // centred on what the camera looks at
  gift.scale.setScalar(fit); gift.position.set(-mid.x * fit, baseY, 0);
  gift.visible = false;
  scene.add(gift);

  let raf = 0, t = 0, start = -1, done: (() => void) | null = null;
  const clock = new THREE.Clock();
  const ease = (k: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);

  function frame() {
    raf = requestAnimationFrame(frame);
    const real = clock.getDelta(); t += real;           // the timeline follows the real clock, even at a low frame rate
    const dt = Math.min(real, 0.05);
    if (start < 0) {                                   // waiting: a gentle bob
      if (!reduce) { box.position.y = Math.abs(Math.sin(t * 2.6)) * 0.08; box.rotation.y = Math.sin(t * 0.9) * 0.25; }
    } else {
      const k = t - start;
      if (k < 0.55) box.rotation.z = Math.sin(k * 40) * 0.12 * (1 - k / 0.55);              // shake
      else if (k < 1.0) {                                                                    // ribbon and lid off
        const e = ease((k - 0.55) / 0.45);
        box.rotation.z = 0;
        lid.position.y = 0.78 + e * 1.4; lid.rotation.z = e * 0.9;
        [bowA, bowB].forEach((b, i) => { b.position.y = 1.0 + e * 1.7; b.position.x = (i ? 1 : -1) * e * 0.7; });
        [ribA, ribB].forEach((r) => { r.scale.y = 1 - e; });
      } else if (k < 1.6) {                                                                  // box away, gift up
        const e = ease((k - 1.0) / 0.6);
        box.scale.setScalar(1.3 * (1 - e) + 0.001);
        gift.visible = true; gift.scale.setScalar(fit * (0.2 + 0.8 * e)); gift.position.y = baseY - 0.4 + 0.4 * e;
      } else {
        box.visible = false; gift.scale.setScalar(fit); gift.position.y = baseY;
        gift.rotation.y += dt * 0.6;
        if (done) { done(); done = null; }
      }
    }
    renderer.render(scene, camera);
  }
  frame();

  return {
    unwrap() {
      if (reduce) { box.visible = false; gift.visible = true; gift.rotation.y = 0.5; renderer.render(scene, camera); return Promise.resolve(); }
      return new Promise<void>((resolve) => { done = resolve; start = t; });
    },
    dispose() {
      cancelAnimationFrame(raf);
      scene.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose(); const mat = m.material; if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose(); });
      renderer.dispose();
    },
  };
}
