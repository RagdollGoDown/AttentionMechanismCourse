# Byte's gifts: reveal, mood and use moments (design)

Date: 2026-11-05 · Branch: `feat/byte-gifts` · Status: approved in conversation, waiting for review of this document

## Intent

Byte's garden is the lesson's reward (one gift per finished module, completion only, identical in both
conditions). Today it feels superficial: a gift just appears, Byte barely uses it, and nothing makes the learner
look forward to the next one. The goal is that **receiving a gift makes the learner want the next one**, so they
want to start and finish the next module, without the garden getting in the way of learning.

## Goals

1. **A gift reveal window between modules.** When a module is finished, a window opens with the wrapped box and
   "Open the new gift for Byte". One click plays an unwrapping animation and reveals the gift, large and slowly
   turning so its details show, with its name and mood badge.
2. **Byte's mood.** A gauge inspired by the needs/mood idea of life-simulation games, drawn in our own style:
   a face that changes expression, a green bar, a mood word, and one badge per gift saying why he is happier.
   It only goes up, one step per gift, and reaches 100 % with the last gift.
3. **A clear use moment per gift.** After the reveal, the gift drops into the garden and Byte immediately does
   that gift's moment (table below). Afterwards the gift is part of his routine.
4. **Bigger, more detailed gifts.** Each gift about 1.5 to 2 times its current size, with more detail, so what the
   learner earned stands out clearly from the default background.

## Non-goals

- No hint of the next gift: the waiting box shows nothing of what is inside.
- No new gifts, no change to which modules give a gift (9 gifts, `GIFTS` in `web/content/steps.ts`).
- No change to the garden's overall look: keep the current 3D style (three.js, current materials and palette).
- No redesign of the background, Byte's model, the hello bubble or the end celebration (beyond what is listed).

## Anti-goals (would make this a failure even if it works)

- Anything that depends on correctness, speed or score. Rewards stay completion only.
- Anything that differs between the AI and control conditions.
- Mood that drops, streaks, timers, "don't lose your progress" pressure, or any loss aversion.
- Motion while the learner reads or answers: the big moment happens in the window between modules; during a
  step Byte stays as calm as today.
- Sound.

## The sequence (decided)

When a module with a gift is finished:

1. Before the learner works on the next step, a centered window opens over the page: the wrapped box and the line
   **"Open the new gift for Byte"**, with one button.
2. The learner clicks: the box shakes, the ribbon comes off, the lid pops, and the gift rises out, large and turning
   slowly. Its name and mood badge appear (e.g. "🎾 Tennis ball · Playful +1"). The gift's existing `fact` line (a
   one-sentence recap of the module) is shown under it. *(Builder's call kept from today's note: the fact stays.)*
3. The window closes (a "Back to the lesson" button after the reveal, or automatically after a few seconds:
   builder's call, see below). The gift drops into the garden at full size. The mood gauge grows, fills by one
   step (the face changes when it crosses a level) and shrinks back.
4. Byte runs to the gift and does its use moment. Then everything is as usual.

### Calls made in conversation (approved)

- **One button only.** Closing the window (×, Escape, click outside) opens the gift without the animation, so
  nobody is stuck and nobody misses a gift.
- **Garden hidden by the learner** ("Hide garden"): no window; the gift is added quietly.
- **Reduced motion** (`prefers-reduced-motion`): no shaking or turning; the gift just appears.
- **Identical in both conditions**, triggered only by finishing the module.
- **Logged**: when the window opened and when the learner clicked, so time on gifts is not counted as time on
  the step.
- **The window replaces today's "New for Byte" note** in the garden (`note()` in `world.ts`). The wrapped box
  still waits in the garden where the next gift will stand, as today. *(Builder check: my call.)*
- **Ninth gift (balloons)** arrives before the post-test; Byte is then Overjoyed (100 %). The confetti
  celebration stays at the very end, as now.

## Mood

| Gifts | Level | Face |
|---|---|---|
| 0 | Bored | flat mouth, grey |
| 1–3 | Okay | small smile, yellow |
| 4–6 | Happy | smile, light green |
| 7–8 | Joyful | big smile, green |
| 9 | Overjoyed | open smile, teal |

- Percentage = gifts / 9 (so 100 % exactly with the last gift).
- Badges: one per gift received, word from the table below, shown under the gauge.
- Placement: always visible but small in a corner of the garden band; for a moment after a gift it grows, fills,
  then shrinks back. Hidden with the garden.
- Look: the sticker style approved in the mockup (white pill, dark outline, face, green bar, mood word, badge
  chips). It is page HTML/SVG on top of the canvas, not part of the 3D scene, so it stays crisp and readable.

## Use moments and badges (approved)

| Gift (`PetItem`) | Byte's moment when it arrives | Badge |
|---|---|---|
| tent | Crawls inside, pokes his head out of the flap, comes back out | 🏕 Cosy |
| ball | Chases it, pushes it with his nose, brings it back | 🎾 Playful |
| tree | Climbs to the branch; an apple drops and he catches it | 🍎 Adventurous |
| cushion (dog bed) | Turns three times, curls up, short nap with "z z z" | 🛏 Rested |
| flowers (tulips) | Sniffs them; a butterfly flies out and he follows it | 🦋 Curious |
| frisbee | The frisbee flies; he jumps and catches it in the air | 🥏 Energetic |
| lamp | The lamp switches on with a warm glow; he sits under it | 💡 Safe |
| bench | Hops onto it and sits like a person, looking around | 🪑 Relaxed |
| balloons | Holds the strings and bounces, half floating | 🎈 Overjoyed |

After its first moment, each gift joins `idleChoice()`: now and then Byte goes back to it on his own.

## Constraints

- Code lives in `web/components/garden/` (three.js world, `Garden.tsx`) and `web/components/GiftProvider.tsx`;
  gift data in `web/content/steps.ts` (`GIFTS`). Gifts are won in `Lesson.tsx` (`next`) and `steps/Lab.tsx`.
- The world is loaded lazily, client only; without WebGL the lesson has no garden. Then the window still works
  but shows the gift without the 3D model (name, badge, fact).
- Reduced motion must be respected everywhere (today's rule in `world.ts`).
- The window must be accessible: focus moves into it, Escape closes it, the button is keyboard reachable,
  `role="dialog"` with a label.
- Content claims are enforced by `web/tests/content-*.test.ts`; keep them true (completion only, identical
  across conditions, one gift per module) and extend them for badges and mood levels.
- `cd web && npm test`, typecheck and lint before committing. Check on localhost with `?debug` (the debug bar's
  "Next gift" button triggers the flow).
- Byte and every gift stay original designs (no recreation of existing characters or game assets).

## Left to the builder

- How the reveal is rendered: a small second three.js canvas in the window reusing the gift model builders
  (they would move out of `world.ts` into their own module), or the window above the main canvas. Prefer reusing
  the same models so the gift looks identical in the window and in the garden.
- Exact sizes (target 1.5–2×) and the layout of the band so 10 items (bowl + 9 gifts) never overlap at 1280 px;
  scale down on narrow screens.
- What "more detailed" means per model (e.g. stitching on the bed, petals on the tulips, glass and cap on the
  lamp, a pattern on the tent), within the current style.
- Whether the window closes by button or after a delay once the gift is revealed, and the exact timings
  (aim: the whole window under ~6 s if the learner just clicks once).
- If two gifts arrive at once (debug jumps), queue them.
- Event names (suggestion: `gift_offered`, `gift_opened` with `{ item, via: 'button' | 'close', ms }`).
- Pure helpers with tests: mood level from gift count, badge list, gift queue.
- Update `CLAUDE.md` (reward description) and the rationale in `tasks/todo.md`.
