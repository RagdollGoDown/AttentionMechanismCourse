# Byte's gifts: reveal, mood, use moments (Nov 5, branch feat/byte-gifts)

Goal: a gift makes the learner want the next one, without disturbing learning. Design:
`docs/superpowers/specs/2026-11-05-byte-gifts-design.md`, plan: `docs/superpowers/plans/2026-11-05-byte-gifts.md`.
Grounding: a closed box keeps curiosity open (Kao et al. 2024, no hint of what is inside); the mood bar is endowed
progress toward 100 % (Nunes & Drèze 2006), only up, completion only (Deci et al. 1999); the moment happens in a window
between modules, so reading and answering stay calm (Rey 2012, seductive details); a companion that uses what the
learner earned turns the reward into a small story (Sailer & Homner 2020, game fiction; Chan's My-Pet).

- [x] Gift window "Open the new gift for Byte": unwrap, name + badge + module fact; Escape opens without animation.
- [x] Mood gauge (face, bar, word, badges): Bored → Okay → Happy → Joyful → Overjoyed (9/9).
- [x] Gifts ~1.8× bigger and more detailed (tree unchanged: already canvas height).
- [x] A use moment per gift (tent, ball, tree + apple, bed, tulips + butterfly, frisbee catch, lamp on, bench, balloons).
- [x] No window when the garden is hidden or on a phone; reduced motion: no animation. Logged: `gift_offered`, `gift_opened`.

# Rewards: Byte's garden (Nov 3, branch feat/rewards)

Replaces the trophy. Grounding: Sailer & Homner 2020 (game fiction), Chan's My-Pet (companion → effort),
Deci et al. 1999 (rewards inform, never per click), Nunes & Drèze 2006 (endowed progress), Kao et al. 2024
(curiosity, celebrate real success briefly), Rey 2012 (seductive details → calm, out of the way), Ch. 4 lecture
(unlock items for a character). Prototype: claude.ai/artifact/6MkKdPrxaQnCkmxVJx6Kyd.

- [x] `three` (exact version) + types; the garden loads lazily, client only.
- [x] Garden band fixed at the bottom (~140 px): hills and grass; content scrolls above it (no cover-up).
- [x] Byte (original robot beagle) wanders the band; click to pet; drag items to rearrange.
- [x] 9 gifts = the 9 old trophy pieces (same moments: finishing a step, never correctness); food bowl at start;
      next gift waits wrapped; a short note names the gift and what was learned.
- [x] Visible from the hook to the end screen; hidden in the pre- and post-test. "Hide garden" toggle.
- [x] Logs: gift_received, pet_petted, pet_item_moved, garden_toggled. Same in both conditions.
- [x] Remove the trophy (header icon + pop-up, Why and End screens); header shows the gift count.
- [x] Reduced motion: Byte stays put, no drops or drifting; petting still answers.
- [x] Tests (gift data), tsc, lint, build; one browser screenshot of the lab with the garden.

## Review (Nov 3)
- In the app: garden band at the bottom (112 px, content scrolls clear of it), Byte + 9 gifts + starting bowl,
  petting, drag to rearrange, wrapped next gift, gift note with the fact learned, "Hide garden".
- Not in the welcome screen or the tests. Logged: gift_received, pet_petted, pet_item_moved, garden_toggled.
- Checked: 307 tests, tsc, lint, next build; headless browser on the lab (garden shown, none on welcome, no errors).
- Not checked by hand yet: a full run-through earning all 9 gifts; phone widths hide the garden on purpose.

# Playtest fixes + tutor model (Nov 3, evening)

Julien's playtest. Decisions: two contexts gets the feedback task (control: expert note, AI: one
closing reply); swap is removed and its "position" idea moves to two contexts; tutor runs on the
Vercel AI Gateway (Groq paid tier kept as plan B).

## A. Tutor model on the AI Gateway
- [x] Julien adds `AI_GATEWAY_API_KEY` to `web/.env.local` (Vercel dashboard → AI Gateway → API keys).
- [x] Compare `anthropic/claude-haiku-5.5`, `openai/gpt-oss-120b`, `alibaba/qwen3.8-27b` through the gateway.
- [x] Set `TUTOR_MODEL` locally and on Vercel to the winner (on Vercel the gateway authenticates itself).

## B. Two contexts: feedback only when a prediction is wrong (points 1 + 3)
- [x] Both right: banner, then Next (the optional "What made the difference?" box goes).
- [x] A wrong pick: "You picked X. What made you think so?" → control: fixed expert note;
      AI: one closing tutor reply (no revision). The tutor sees the picks and both sentences' weights.
- [x] New explain task `contrast`: ideas = context decides (the word that fits the meaning in that sentence),
      position does not ("smiled" is next to "model"). Misconception: nearest word.
- [x] Remove the swap experiment (lab 6 → 5), its trophy piece, mission, eval cases; tests and docs follow.

## C. Query and key card (point 2)
- [x] Rows named as the two directions of the vector, not words: "fashion meaning", "ML meaning".
- [x] Same decimals everywhere (0.12 + 0.12 = 0.24, not "0.2").

## D. Tutor can say "you have it all" (point 4)
- [x] Prompt: already in (no invented gap). Mock: credit "absorb/take over", no fake praise on gibberish.

## E. Softmax check (point 6)
- [x] Label the table rows ("match score s", "eˢ") and add the sum, so the step to the % is visible.

## G. Second playtest + hardening (Nov 3, night)
- [x] Sentence B mirrors A: "after the training run the model predicted" (no clause tile).
- [x] Bar = weight, said once; "Invent the rule" opens with the score → weight bridge, real numbers.
- [x] Tutor chain: Haiku 5.5 (gateway) → Groq gpt-oss-120b → offline tutor; `model` says who answered.
- [x] System prompt ~1100 → ~610 tokens, same rules.
- [x] Firewall rate limit, gateway budget, output-token cap. Compute step typeset (Math.tsx).
- [ ] Deploy: production gets the new env only with the next deploy (merge of this branch).

## F. Finish
- [x] `npm test` (299), tsc, lint; lessons in `tasks/lessons.md`.
- [x] Re-run the comparison on the gateway models (needs the key).
- [ ] Julien clicks through again (both conditions; two contexts with a wrong pick).

# AI tutor: tutor-only AI condition, random assignment, provider comparison (Nov 3)

Branch `feat/ai-tutor`. Constraint: the conditions differ only in the feedback after Submit.

## 0. Grounding
- [x] Read `lectures/de_chapter5_2026_genAI_1.pdf`, add its summary to `lectures/RESUME.md` (missing so far).
      Use it with Hattie & Timperley (where am I going / how am I doing / where next) for the prompt.

## 1. AI condition sees the tutor only (no expert answer)
- [x] `ExplainRounds.tsx`: drop the expert card, `modelShown` and "I'm done. Show the expert answer".
      Control unchanged (expert answer after round 1, optional revision).
- [x] **Closing reply** = the last thing the AI group sees: confirms what is right, states the one
      remaining gap plainly, no "go back and look" question (no revision left). Never the formula
      before the formula step.
      - after round 2: the round-2 reply is a closing reply;
      - learner skips the revision after round 1: "I'm done" asks the tutor for a closing reply on the
        same explanation (one extra call), shows it, then Continue.
- [x] Request gets `mode: 'formative' | 'closing'`; schema: `question` is null in closing mode.
      Mock tutor gets a closing mode too.
- [x] Logs: drop `model_answer_shown`; `feedback_received` carries `mode`.

## 2. Prompt redesign (`lib/tutor/prompt.ts`)
- [x] One system prompt per (formula taught?, mode), built from small shared blocks: role and learner
      level, feedback rules (H&T), formula gate, tone/length, injection guard, field-by-field output spec.
- [x] 2 short worked examples (input → JSON) so small open models follow the format.
- [x] Keep the server-side checks (schema, invented ids, formula leak); add: closing reply must not ask a question.

## 3. Assignment: unchanged
- Dropped (Nov 3): the team hands out links with `?condition=` by hand. No code change.

## 4. Direct free providers
- [x] Add `@ai-sdk/openai-compatible` (one dependency for all three OpenAI-style endpoints).
- [x] `TUTOR_MODEL=groq:<model> | openrouter:<model> | gemini:<model>` with `GROQ_API_KEY`,
      `OPENROUTER_API_KEY`, `GEMINI_API_KEY`; any other value keeps the Vercel AI Gateway path.

## 5. Comparison Groq vs OpenRouter vs Gemini
- [x] Synthetic set `web/eval/explanations.ts`: ~8 per task (correct, partial, each misconception,
      off-topic, injection attempt) with expected rubric hits / misconception. Team reviews it.
- [x] `npm run compare`: every explanation × model × mode through the real `getFeedback` pipeline.
      Report `web/eval/report-<date>.md`: valid-reply rate, formula leaks, latency (median, max, >10 s),
      rubric/misconception agreement, and all replies side by side for the team to rate.
- [x] Ran it (Nov 3): Groq only one usable; Gemini and OpenRouter free tiers fail. Groq free caps qwen at 20k tokens/day.

## 6. Finish
- [x] Tests for closing mode and provider parsing; `npm test` (299), lint, build pass.
- [ ] Click through both conditions in a browser (not done: no browser tool in this session).
- [x] Docs: `CLAUDE.md` lesson flow, `web/README.md` (env vars, compare), `docs/tests.md` if affected.

## Review (Nov 3)
- AI condition: tutor only. Round 1 → formative reply; revision → closing reply; "I'm done" → closing reply
  on the same text. If the tutor fails, Continue is still offered. Control unchanged.
- Prompt: role, how to judge, mode rules, formula gate, style, JSON spec, injection guard, one worked
  example on an unused sentence. Server drops a closing question; a formative reply without one → offline tutor.
- Providers: `groq:` / `openrouter:` / `gemini:` prefixes via `@ai-sdk/openai-compatible` (JSON mode,
  schema in the prompt); gateway ids unchanged. Smoke-tested against a fake OpenAI-style server.
- Comparison: 22 synthetic cases × 2 modes per model (`npm run compare`); not run yet (no keys).
- Gemini free tier: verify it serves Switzerland and the daily quota (some Flash models ~20 requests/day).

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

# Compute practice: less guided (2026-10-07, Julien's feedback)
- [x] Practice = the whole empty table at once, one Check; no column unlocking, no per-stage "how" line (worked example unchanged).
- [x] Each cell checked against the learner's own previous column (`checkAll`), so one slip marks one cell.
- [x] On-page calculator (`lib/calc.ts`, own parser, no eval): + − × ÷ ^, brackets, exp, sqrt, e; buttons for eˣ √ × ÷ ( ). Logged as `calc_use`.
- [x] Log: `compute_check` {entries, correct, wrongCells, attempt, msSinceStart} replaces `compute_entry`; "Show me" after 3 checks.
- [x] 211 tests, lint, typecheck, build; pilot both conditions + phone screenshot.
- [x] Verified the numbers by hand (Python, independent of the app). Fixed: the page showed eˣ of the *unrounded* scaled
      score (e^2.83 shown as 16.92, really 16.95) and "4 ÷ 1.41 ≈ 2.83" (really 2.84). Worked example and "Show me" now
      use `learnerPath` (round to 2 decimals, carry forward, ÷ √2), pinned by tests with the hand-computed values.

## M4 (due Nov 5, 23:59; Q&A Nov 10), checked against `M4_digital_education.pdf`

- [ ] Research plan, 2–3 pages: RQs (RQ1 outcomes, RQ2 process), participants + recruitment, conditions + procedure, measures + analysis per RQ
- [x] Working implementation, both conditions, public link (prod checked Nov 4: 21/21 interactions)
- [ ] 1–2 AI interaction logs per member in the submission (not in the repo: `logs/` was removed in #15)
- [x] Quantitative measure: pre/post-test per LG, auto + rubric scoring
- [ ] Analysis plan: ANCOVA on post-test with pre-test as covariate (or gains / normalized gains), floor/ceiling check, blind horizontal rubric grading
- [x] Qualitative: open-ended questions after the post-test (reflection survey, same in both conditions)
- [ ] Thematic-analysis plan for the survey answers (Braun & Clarke)
- [ ] Participant information sheet (procedure, ~50 min, rights, withdrawal, contact, data); in-app consent exists
