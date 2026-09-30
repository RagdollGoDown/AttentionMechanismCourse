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
