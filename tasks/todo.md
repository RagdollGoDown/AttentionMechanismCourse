# Pre-study additions (Oct 6): items 1, 2, 5, 7 + the non-backend part of 6

Constraint: both conditions identical except the feedback at Swap, Remove, Explain.
Out of scope now: pre-test (#3, team decision on assignment), post-test (#4, items to write),
log transport (#6 backend, team decision), optional improvements.

## 1. "Compute it yourself" step (LG2)
- [x] `content/steps.ts`: new StepId `compute` in chapter Formula, between `formula` and `explain`.
- [x] Content: worked example (q=[1,2]; K fashion [2,1], smiled [1,0], the [0,1]; V [1,0],[0,1],[1,1])
      and practice example q=[2,1]; K [1,1],[0,2],[2,0]; same V
      → scores 3,2,4 → ÷√2 2.12,1.41,2.83 → eˣ 8.34,4.11,16.92 → weights .28,.14,.58 → output [0.86, 0.72].
      Every number is computed from `lib/attention.ts`, never typed in (as for the softmax check).
- [x] `components/steps/Compute.tsx`: part 1 = worked example as a 5-stage table (scores, ÷√2, eˣ, weights, output).
      Part 2 = same table, empty; each stage unlocks once the previous one is right; ResultBanner per stage.
      Tolerance: ±0.02 on rounded values (2 decimals); eˣ ±1 %. "Show me" after 3 wrong tries per stage.
- [x] Log: `compute_entry` {stage, values, correct, attempt}, `compute_reveal` {stage}. Time per stage = from `at`.
- [x] Tests: worked numbers match the brief; practice differs from worked; tolerance check.

## 2. Model answer at the end of the AI rounds
- [x] `ExplainRounds.tsx`, AI condition only: after round 2, or when the learner clicks Continue after round 1,
      show the same `expertAnswer` card, then a final Continue. Log `model_answer_shown` {round, trigger: 'after_revision'|'skipped_revision'}.
- [x] Control unchanged. Tutor prompt unchanged (it still never sees or gives the answer).

## 5. LLM status for the experimenter
- [x] `GET /api/feedback` → `{ llm: boolean, model: string | null }`; `?probe=1` makes one tiny real call and returns `source` + latency.
- [x] Debug bar shows "Tutor: LLM <model>" (green) or "Tutor: OFFLINE" (red), with a "Test call" button.
- [x] Hide the "offline tutor" badge from participants (only in `?debug`), since it is a study artefact.
- [x] Session header in the log: `mockReplies` count, so a mock-tainted session is visible at a glance.

## 6 (part) + 7. Log contents and timestamps
- [x] `?pid=` URL param → `participantId` in every event (falls back to null).
- [x] Each event gets `at` (ISO wall-clock time) next to `t` (ms since start).
- [x] Exported JSON gets a header: sessionId, participantId, condition, debug, tutor model, startedAt, totalMs, mockReplies.
- [ ] Transport (send to a server, survive tab close) waits for the team's backend choice; the `LogSink` hook is the plug-in point.

## Verify
- [x] `npm test`, `tsc`, lint, build.
- [x] Pilot click-through in both conditions (headless) to check the new step and the end-of-rounds answer.
- [ ] Deploy to production only when you say so.

## Decisions I took by default (say if you disagree)
- The compute step wins a trophy piece (10 pieces), as every other module does. Completion only.
- Learners may use a calculator for eˣ; the step says so.

## Review (pre-study, 2026-10-07)
- Items 1, 2, 5, 7 and the client part of 6 are in place. 183 tests, typecheck, lint and build are clean.
- Lint fix: the compute step read `performance.now()` during render (stage timer); it now starts in an effect per stage.
- Headless pilot, AI at 390×844 and control at 1440×900: compute with one wrong try then right answers, explain, log download.
  No console errors, no page overflow. Log header has pid, condition, startedAt, totalMs, tutor.mockReplies; every event has `at`;
  AI logs `model_answer_shown {trigger: skipped_revision}`, control logs none.
- Found while piloting: "Not quite." showed twice in the compute banner (fixed); on phones the Demo menu (condition switch,
  session log) opened behind the page (header had no position below `sm`; fixed with `relative`).
- Known: on phones the debug toolbar covers the bottom of the page (experimenter only). Explain intro says "formula on
  the right", but on phones it is below.

## Merge of Morgane's PRs (2026-10-07)
- [x] `feat/control-expert-once`: control shows the expert answer once; a revision gets "✓ Revision saved".
      Kept our `final` flag (no "revise" hint under the AI's end-of-rounds answer).
- [x] `feat/back-navigation`: Back on lab and formula, lab redo with saved answers.
      Fix: `modelShown` is saved with the rounds, so a redo neither re-offers the expert answer nor logs it twice.
- [x] Back also from compute → formula (not a test, the formula is what the learner computes).
- [x] 189 tests, lint, typecheck, build. Pilot: redo in AI keeps the expert card and no second button;
      compute → Back → formula → compute keeps the table; both conditions end to end, no console errors.

---

# M3 v2: new flow, sentence lab hub, formula part, gamified skin

## Visual direction (frontend-design)
- Metaphor: **word tiles on a game board**. Each word is a letter-tile, and its "match score" is like tile points.
  The sentence is a board at the centre of the lab.
- Palette: board `#1B2B4B` (deep ink), tile `#F3DDA8` (maple), weight `#3D5AFE` (cobalt),
  XP `#FFB020` (amber), ok `#1FA37A`, miss `#E5484D`, page `#EEF1F7`.
- Type: Bricolage Grotesque (headings, numbers), Atkinson Hyperlegible (body text, low load).
- Layout: fluid, from a phone (single column) up to a wide screen (the board sits beside the side panel).
- Game layer: XP bar + level in the header, a quest map of chapters, badges for LG1–LG3.
  XP rewards effort (predict, explain, revise), not correctness. That protects productive failure,
  and XP stays identical across the two conditions.

## Flow
Chapters on a quest map. Intro and consolidation are linear. The lab is a hub.
1. Welcome
2. Hook: "What does *model* mean?" with no context → same question with each full sentence
3. Why attention (goals shown as badges to earn)
4. Pre-test: placeholder
5. Warm-up: words as vectors + dot product (map + a₁b₁+a₂b₂ breakdown + quick check)
6–10. **Sentence lab** (hub around "After the fashion show, the model smiled"). The tabs unlock one by one:
   - 6 Two contexts (current contrast mission)
   - 7 Query & key (arrows on the map: what model looks for / what each word offers; score = match, no formula)
   - 8a Predict a swap, 8b Predict a removal (current tutor missions)
   - 9 Invent the rule: snap bricks into weight = [top] ÷ [bottom] (user choice: bricks, not free text),
     tested live on 3 score sets (incl. negative scores). Checklist: positive, sums to 100 %, keeps the order
   - 10 Softmax: your rule vs exp-then-normalise, side by side on the bars
11. Formula: softmax(QKᵀ/√d_k)·V, each part clickable and mapped to the board, √d_k slider,
    V = the output arrow of "model" moving on the map
12. Explain the formula in your own words (AI tutor vs expert answer, 2 rounds, same as 8)
13. Post-test: placeholder + download log

## Tasks
- [x] Text: humanize + shorten all copy (humanizer skill)
- [x] Theme tokens, fonts, fluid layout, focus/reduced motion
- [x] Game state: XP, level, badges, unlocks (one hook + logging of `xp_gain`, `unlock`)
- [x] Steps 1–3, 4/13 placeholders
- [x] Step 5 dot-product breakdown
- [x] Lab hub + tabs (6, 7, 8a, 8b, 9, 10)
- [x] Step 7 query/key view
- [x] Step 9 brick rule builder (`lib/rules.ts` + test)
- [x] Step 10 softmax compare
- [x] Step 11 formula explorer + √d_k slider + V output
- [x] Step 12 tutor mission `formula` (rubric, misconceptions, expert answer; formula guard per mission)
- [x] Content tests for new claims; `npm test`, lint, build; browser check at phone + desktop width
- [x] Log entry in logs/julien.md

## Review
- Built as planned. 134 tests pass (new: rule bricks, softmax check, √dₖ slider, formula task,
  "every expert answer earns full credit"). Lint and typecheck are clean, and `next build` passes.
- Full headless playthroughs: phone 390×844 (AI) and desktop 1440×900 (control), no console
  errors, no horizontal overflow, every step reachable, the end screen shows the badges.
- Found while testing: `<svg role="img">` hid the clickable map words from screen readers (now
  `role="group"`), and the 1.5px arrows were hard to hit (a 12px invisible hit stroke was added).
- Scores under the bars are now raw q·k. The weights still use /√dₖ, so step 10 shows a visible
  gap that step 11 explains.
- Not done: pre-/post-test content (placeholders), no LLM key on prod, not deployed, not committed.
- Watch out: XP for revisions may raise revision rates in *both* conditions (RQ2). It is equal
  across groups, but mention it in the report.

# M3 v3: feedback round after playtest (2026-09-30)
- [x] Success/fail feedback: one prominent result banner (big green / amber), used everywhere
- [x] Query & key: rework (query card meets key card, match leaderboard, no map arrows)
- [x] Swap/remove: animate the change (old tile leaves, new tile drops in; smiled shrinks out) + preview before
- [x] Match scores: labelled "match 4.3" under the tile instead of an unlabelled corner number
- [x] Softmax: staged pipeline (scores → eˢ → ÷ sum) with intuition per stage; cleaner check
- [x] Formula: each part animates the sentence (Q: model asks; K: words answer; √dₖ: with vs without; softmax: bars grow; V: values flow into model)
- [x] Explain: one text box per formula part; rubric checked per part
- [x] Remove XP and badges → trophy built from pieces (one per module), congratulations at the end
- [x] Tests, build, playthrough at phone + desktop, log

## Review (v3)
- All 8 feedback items done. 140 tests pass, lint and build are clean, and full playthroughs pass on phone (AI) and desktop (control).
- Not committed or deployed yet. AI log entry written in logs/julien.md.

# M3 v4: second playtest round (2026-09-30)
- [x] Swap/remove: show weights before → animate the change → board with "?" weights → predict → reveal
- [x] Trophy piece notification: big centred card with the trophy
- [x] Rule builder: meaningful test names + what each test catches; a worked example of the rule on one word
- [x] Slide transition between steps and lab experiments
- [x] Tests, lint, build, log

## Review (v4)
- Swap/remove now run: real weights → change animation → "?" bars (scores hidden too, they would give the answer) → bet → bars grow in. The prediction now happens after seeing the new sentence, and the options use the past tense.
- Trophy card: centred, trophy at 96 px, piece name and "n of 9", pop-in then fade (3.2 s). It never blocks clicks.
- Rule builder: tests renamed "Our sentence / Mixed scores / All below zero", each with a note saying what it contains; two numbered picks; a live worked example ("fashion show": s → top → ÷ → %).
- Slide-in (0.5 s from the right) on every step and every lab tab, off with reduced motion.
- 140 tests, lint, typecheck, build clean. Headless runs at 1440×900 and 390×844 through swap, remove and rule: no console errors, no overflow.
- Known: the trophy card briefly covers the top of the next experiment (3 s, click-through).
