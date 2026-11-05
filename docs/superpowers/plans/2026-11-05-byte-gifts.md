# Byte's Gifts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A gift reveal window between modules, a mood gauge that fills with each gift, a clear use moment per gift, and bigger, more detailed gift models.

**Architecture:** Gifts are still won by `win(id)` (Lesson, Lab, debug bar). `GiftProvider` now keeps two lists, *received* and *revealed*; the garden only shows *revealed* gifts. `Garden.tsx` opens a `GiftReveal` window for the first pending gift (or reveals it silently when the garden is hidden), shows a `MoodGauge`, and passes revealed gifts to the three.js world, which drops the gift and plays its use moment. Gift models move out of `world.ts` into `models.ts` so the window and the garden draw the same models.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, three.js, Tailwind/`globals.css`, vitest (node environment).

**Spec:** `docs/superpowers/specs/2026-11-05-byte-gifts-design.md`

## Global Constraints

- Rewards are completion only, identical in both conditions; nothing reads the condition, a score or a time.
- Mood only goes up; 100 % exactly with the 9th gift. Levels: 0 Bored · 1–3 Okay · 4–6 Happy · 7–8 Joyful · 9 Overjoyed.
- No hint of the next gift. No sound. No streaks, timers or loss aversion.
- Keep the current 3D look (materials in `world.ts`); only sizes and detail change.
- `prefers-reduced-motion`: no shake, turn, drop or use-moment motion; gifts just appear.
- Copy (exact): window line **"Open the new gift for Byte"**; badge format **"<emoji> <Gift name> · <Word> +1"**.
- Badges (exact, item: emoji, short name, word): tent 🏕 Tent Cosy · ball 🎾 Tennis ball Playful · tree 🍎 Apple tree Adventurous · cushion 🛏 Dog bed Rested · flowers 🦋 Tulips Curious · frisbee 🥏 Frisbee Energetic · lamp 💡 Lamp post Safe · bench 🪑 Bench Relaxed · balloons 🎈 Balloons Overjoyed.
- Original designs only (Byte, gifts, gauge faces); the gauge is inspired by the mood idea, not copied from any game.
- Before each commit: `cd web && npm test && npx tsc --noEmit && npx eslint .`

## Review Focus

1. **Phones (≤ 640 px)**: the garden is hidden by CSS there; the window must not open, gifts are revealed silently (Task 5 checks `matchMedia('(max-width: 640px)')`).
2. **Learner hides the garden while a gift is pending or the window is open**: the window closes and the gift is revealed silently (`via: 'hidden'`) (Task 5).
3. **Two gifts won in a row** (debug "Gift" button, fast lab): one window at a time, in order (Task 1 queue test, Task 7 browser check).
4. **No WebGL**: the window still opens and shows name, badge and fact without the 3D model; the lesson never breaks (Task 5, Task 7 check with WebGL disabled).
5. **Focus**: when the window opens, focus moves to its button; Escape closes it; afterwards focus returns to where it was (Task 5).

---

### Task 1: Gift data, mood and queue helpers

**Files:**
- Modify: `web/content/steps.ts` (`GIFTS`: add `badge`; add `GIFT_REVEAL` copy)
- Create: `web/lib/mood.ts`, `web/lib/giftQueue.ts`
- Test: `web/tests/mood.test.ts`, extend `web/tests/content-gifts.test.ts`

**Interfaces:**
- Produces:
  - `GIFTS[i].badge: { emoji: string; label: string; word: string }` (`label` = short name without article, e.g. "Tennis ball")
  - `GIFT_REVEAL = { title: 'Open the new gift for Byte', open: 'Open', done: 'Back to the lesson' }`
  - `MOOD_LEVELS = ['Bored', 'Okay', 'Happy', 'Joyful', 'Overjoyed'] as const`, `type MoodLevel`
  - `moodOf(count: number, total: number): { level: MoodLevel; pct: number }` (pct 0–100, integer)
  - `badgeLabel(gift: { badge: { emoji: string; label: string; word: string } }): string`
  - `interface GiftQueue<T> { received: T[]; revealed: T[] }`, `receive<T>(q, item: T): GiftQueue<T>` (ignores duplicates), `revealNext<T>(q): GiftQueue<T>` (no-op when nothing pending), `pendingOf<T>(q): T | null`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/mood.test.ts
expect([0,1,3,4,6,7,8,9].map((n) => moodOf(n, 9).level))
  .toEqual(['Bored','Okay','Okay','Happy','Happy','Joyful','Joyful','Overjoyed']);
expect(moodOf(0, 9).pct).toBe(0); expect(moodOf(9, 9).pct).toBe(100); expect(moodOf(4, 9).pct).toBe(44);
// queue
let q = receive(receive({ received: [], revealed: [] }, 'a'), 'b');
expect(pendingOf(q)).toBe('a'); q = revealNext(q); expect(pendingOf(q)).toBe('b');
expect(receive(q, 'a').received).toEqual(['a','b']);           // duplicate ignored
expect(revealNext(revealNext(q)).revealed).toEqual(['a','b']); // no-op when empty
// content-gifts: every gift has a badge, words unique, the exact list from Global Constraints,
// the last gift's word is 'Overjoyed', and badgeLabel(GIFTS[1]) === '🎾 Tennis ball · Playful +1'
```

- [ ] **Step 2: Run `cd web && npx vitest run tests/mood.test.ts tests/content-gifts.test.ts`** — expected FAIL (missing modules/fields).
- [ ] **Step 3: Implement.** `moodOf` uses integer comparisons: 0 → Bored, `count >= total` → Overjoyed, `count * 3 <= total` → Okay, `count * 3 <= total * 2` → Happy, else Joyful; `pct = Math.round(100 * count / total)`. `badgeLabel` returns `${emoji} ${label} · ${word} +1`.
- [ ] **Step 4: Run the tests again** — expected PASS, and the full `npm test` still passes.
- [ ] **Step 5: Commit** `feat(gifts): badges, mood levels and reveal queue helpers`

### Task 2: Received vs revealed gifts in GiftProvider

**Files:**
- Modify: `web/components/GiftProvider.tsx`, `web/lib/log.ts` (event types `gift_offered`, `gift_opened`)
- Modify: `web/components/garden/Garden.tsx` (world gets `revealed`), `web/components/DebugBar.tsx` (unchanged API check only)

**Interfaces:**
- Consumes: `receive`, `revealNext`, `pendingOf` (Task 1).
- Produces: `useGifts(): { gifts: Gift[]; revealed: Gift[]; pending: Gift | null; total: number; win(id: MissionId): void; reveal(via: 'button' | 'close' | 'hidden', ms: number): void }`. `gifts` keeps meaning "received" so `DebugBar` and `Lesson` are untouched. `reveal` logs `gift_opened { item, via, ms }` and moves the pending gift to `revealed`.

- [ ] **Step 1:** Store a `GiftQueue<Gift>` in a ref + state; `win` calls `receive` (keeps logging `gift_received`); `reveal` calls `revealNext`.
- [ ] **Step 2:** In `Garden.tsx`, call `world.setGifts(revealed, nextItem(gifts))` instead of `gifts`. Temporarily reveal immediately (`useEffect`: if `pending`, `reveal('hidden', 0)`) so the app behaves as today until Task 5 replaces it.
- [ ] **Step 3:** `npm test`, typecheck, lint — expected PASS. On `localhost:3000/?debug&condition=ai`, the debug "Gift" button still drops gifts as before.
- [ ] **Step 4: Commit** `refactor(gifts): separate received and revealed gifts`

### Task 3: Gift models in their own module, bigger and more detailed

**Files:**
- Create: `web/components/garden/models.ts`
- Modify: `web/components/garden/world.ts` (remove the material helpers used only by gifts and `BUILD`; import from `models.ts`; adjust `SPOTS`)

**Interfaces:**
- Produces: `createModels(): { build(id: PetItem | 'gift', unit: number): THREE.Group; dispose(): void }` and `GIFT_SCALE: Record<PetItem | 'gift', number>` (multiplier on the world's `GS = 38`). Byte's own model stays in `world.ts`; shared materials live in `models.ts` and are exported for Byte.
- `build` keeps today's `userData` contract (`spin`, `slides`, `float`) and casts/receives shadows.

- [ ] **Step 1:** Move `std/shell/glow`, the shared materials and `BUILD` into `models.ts` unchanged; `world.ts` builds with `build(id, GS * GIFT_SCALE[id])`. Check on localhost that the garden looks identical (screenshot before/after at 1280 × 800).
- [ ] **Step 2:** Set `GIFT_SCALE`: `tree 1.15`, `balloons 1.5`, `bowl 1`, `gift 1.6`, every other gift `1.8` (the tree is already near the 480 px canvas height). Scale everything by `fit = clamp(window.innerWidth / 1280, 0.65, 1)`.
- [ ] **Step 3:** Add detail within the current style: tent (stripes kept, guy-rope pegs, a small welcome mat, flap that can open: expose the two flaps as `userData.flaps`); ball (fuzz bumps or a second seam colour); tree (expose one apple as `userData.apple` for Task 6); dog bed (stitching dots along the rim, a bone-shaped plush); tulips (petal cups with 3 petals, a watering can beside the box); frisbee (rim ridges, a paw print decal); lamp (glass cage + cap; glow mesh exposed as `userData.bulb`, starts off); bench (armrests, bolts, a little cushion); balloons (knots, curled strings).
- [ ] **Step 4:** Re-tune `SPOTS` so no two items overlap at 1280 px and at 900 px wide with all 10 items placed (debug: give all gifts, screenshot both widths).
- [ ] **Step 5:** `npm test`, typecheck, lint — PASS. **Commit** `feat(garden): bigger, more detailed gift models in models.ts`

### Task 4: Mood gauge

**Files:**
- Create: `web/components/garden/MoodGauge.tsx`
- Modify: `web/app/globals.css` (`.garden-mood*` classes), `web/components/garden/Garden.tsx`

**Interfaces:**
- Consumes: `moodOf`, `badgeLabel`, `MOOD_LEVELS` (Task 1); `revealed`, `total` (Task 2).
- Produces: `<MoodGauge count={revealed.length} total={total} badges={revealed.map((g) => g.badge)} pulse={revealed.length} />`.

- [ ] **Step 1:** Render the approved sticker pill: inline SVG face (one expression per level, colours grey `#d9dde3`, yellow `#f3e27a`, light green `#9be15d`, green `#5fd06a`, teal `#38c9a0`), label "Byte's mood", a bar filled to `pct`, the level word, and badge chips (emoji + word). Fixed, bottom-left above the band (`left: 12px; bottom: 120px`), `z-index: 31`, hidden whenever the garden is hidden, and at ≤ 640 px like the other garden layers.
- [ ] **Step 2:** When `pulse` increases: scale to 1.6 for ~1.8 s, animate the bar width to the new value, then scale back (CSS transition; none with reduced motion). `aria-live="polite"` text: "Byte's mood: Happy, 44 %".
- [ ] **Step 3:** Check on localhost with the debug "Gift" button: 0 → 9 gifts walks through all five faces; at 9 it reads Overjoyed 100 %.
- [ ] **Step 4:** `npm test`, typecheck, lint — PASS. **Commit** `feat(garden): Byte's mood gauge and badges`

### Task 5: The gift reveal window

**Files:**
- Create: `web/components/garden/GiftReveal.tsx`, `web/components/garden/reveal.ts`
- Modify: `web/components/garden/Garden.tsx` (replace Task 2's temporary auto-reveal), `web/components/garden/world.ts` (remove `note()` and its call), `web/app/globals.css` (`.gift-reveal*`; remove `.garden-note*`)

**Interfaces:**
- Consumes: `pending`, `reveal` (Task 2); `createModels` (Task 3); `badgeLabel`, `GIFT_REVEAL` (Task 1).
- Produces: `createReveal(canvas: HTMLCanvasElement, item: PetItem, reduce: boolean): { unwrap(): Promise<void>; dispose(): void }` and `<GiftReveal gift={pending} webgl={boolean} onDone={(via: 'button' | 'close', ms: number) => void} />`.

- [ ] **Step 1:** `reveal.ts`: its own small transparent `WebGLRenderer` + orthographic camera; shows the wrapped `gift` model; `unwrap()` = shake (~0.5 s), ribbon/lid off (~0.4 s), gift rises and turns slowly; resolves when the gift is shown. With `reduce`, swap box for gift at once and resolve.
- [ ] **Step 2:** `GiftReveal.tsx`: `role="dialog"`, `aria-modal="true"`, labelled by the title; backdrop over the page; shows `GIFT_REVEAL.title` and the **Open** button (focused on mount). Logs `gift_offered { item }` on mount. On click: `await unwrap()`, then show the name, `badgeLabel(gift)` and `gift.fact`, plus **Back to the lesson**; auto-close 3.5 s after the reveal. Escape, × or a click on the backdrop before opening → `onDone('close', ms)` with no animation. After the reveal, any close → `onDone('button', ms)`. `ms` = time from mount to close. Return focus to the previously focused element. If `webgl` is false or `createReveal` throws, skip the canvas and show the text directly.
- [ ] **Step 3:** `Garden.tsx`: render `GiftReveal` when `pending` and the garden is on, not hidden by the learner, and not on a phone (`matchMedia('(max-width: 640px)')`). A WebGL failure (`failed`) does not block it: pass `webgl={!failed}`. Otherwise call `reveal('hidden', 0)`. If the learner hides the garden while the window is open, close it with `reveal('hidden', ms)`. `onDone` calls `reveal(via, ms)`.
- [ ] **Step 4:** Check on localhost (`?debug&condition=control`): the debug "Gift" button opens the window; Open → animation → text → back; Escape before opening reveals at once; hide the garden → no window, gift still counted; two quick "Gift" clicks → two windows one after another.
- [ ] **Step 5:** `npm test`, typecheck, lint — PASS. **Commit** `feat(garden): gift reveal window`

### Task 6: Use moments

**Files:**
- Modify: `web/components/garden/world.ts` (`Step` union, `plan()`, `idleChoice()`, `setGifts`)

**Interfaces:**
- Consumes: `userData.flaps`, `userData.apple`, `userData.bulb` (Task 3).
- Produces: `setGifts(revealed, next)` unchanged; for the newest revealed gift it drops it in, then runs `[happy, ...moment(item)]` where `moment(item)` is the first-time version below; `plan(item)` (idle routine) keeps a shorter version.
- New step kind: `{ act: () => void }` (instant action) and `{ prop: (dt: number, t: number) => boolean }` (animates a prop each frame until it returns true). No other new mechanics.

- [ ] **Step 1:** Implement each first-time moment from the spec table:
  tent — walk into the tent, open `flaps`, head out (`stand` facing viewer at the flap, ~2 s), walk out ·
  ball — kick, chase, push with nose (second kick toward Byte's start), `happy` "got it!" ·
  tree — climb, `apple` falls along an arc to Byte, Byte `eat` "crunch", apple hidden, climb down ·
  cushion — three short `walk` steps around the bed, `sleep` 3 s "z z z" ·
  flowers — `sniff`, a small butterfly mesh (two wing planes) flies out; Byte walks after it for ~3 s; it flies away ·
  frisbee — the frisbee flies up in an arc; Byte jumps (`jump()`), frisbee snaps to his mouth for 1 s, then drops ·
  lamp — `bulb` emissive from 0 to its glow over 1 s (stays on from then), Byte `sit` under it ·
  bench — walk to the bench, hop onto the seat (y to seat height), `sit` looking left/right, hop down ·
  balloons — walk to the balloons, they attach above his head for ~3 s while he bounces (`happy`), then go back.
- [ ] **Step 2:** Reduced motion: skip `moment()` entirely (Byte stays put; lamp simply turns on).
- [ ] **Step 3:** Each moment lasts ≤ 8 s; `cheer()` stays blocked while one runs (extend `giftDue` to the moment's length).
- [ ] **Step 4:** Check on localhost: give each gift once with the debug button and watch each moment; confirm Byte returns to idle and items keep working when dragged.
- [ ] **Step 5:** `npm test`, typecheck, lint — PASS. **Commit** `feat(garden): a clear use moment for every gift`

### Task 7: Docs and full verification

**Files:**
- Modify: `CLAUDE.md` (reward paragraph: reveal window, mood gauge, use moments), `tasks/todo.md` (rationale: endowed progress for the mood bar, curiosity of the closed box, moment between modules so reading is not disturbed), `docs/tests.md` (events `gift_offered`, `gift_opened`)

- [ ] **Step 1:** Update the three docs.
- [ ] **Step 2:** `cd web && npm test && npx tsc --noEmit && npx eslint . && npm run build` — all PASS.
- [ ] **Step 3:** Browser check script (playwright-core, scratchpad) on `localhost:3000/?debug&condition=ai`: 9 debug gifts in a row → 9 windows in order, gauge ends "Overjoyed 100 %", 9 `gift_opened` events in the log, 0 page errors; same at 600 px wide → no window, 9 gifts revealed; with `--disable-webgl` → window shows text only, no errors; with reduced motion emulated → no animation, gifts appear. Screenshots at 1280 and 900 px with all gifts.
- [ ] **Step 4: Commit** `docs: Byte's gifts (reveal, mood, use moments)`
