# AI Interaction Log — Julien Erbland (Team PickMe)

Log of generative-AI interactions for the CS-411 Digital Education project (required for
the course study; 1–2 logs per member are submitted at each milestone). New sessions are
appended at the bottom. Past entries are never edited.

---

## Session 2026-09-29 — Julien Erbland — Project setup (CLAUDE.md, LOG.md, lecture summary)
**Tool:** Claude Code (Claude Opus 5.5)

### Interactions
1. **User:** "Generate a good CLAUDE.md file for this project, having the project
   description and our checkpoint to have an idea of what we do. Keep it short. Add the
   fact that we are part of a study so it should keep track of AI interactions, so it
   should create a LOG.md file too and fill it with AI logs and discussion and a summary
   after every session. […] a lectures folder with the actual lectures […] it should make a
   RESUME.md file in that folder that resumes the content of the lectures and the main
   takeaways to design the project."

   **AI:** Extracted the text of `Course Project Description.pdf`, the Checkpoint C2 PDF and
   the four lecture PDFs (Ch. 1 Introduction, Ch. 2 Memory & Learning, Ch. 3 Learning
   through Exploration, Ch. 4 Learning through Mastery). Created:
   - `CLAUDE.md`: a short project brief (topic, AI vs. control condition, lesson flow
     P1–P6, LGs, RQs, deadlines), pointers to key files, priorities (pedagogy over code,
     process logging, low extraneous load), and a mandatory per-session logging rule with a
     template for `LOG.md`.
   - `lectures/RESUME.md`: a summary per chapter plus a table mapping each lecture mechanism
     (contrasting cases, trapped predictions, productive failure, just-in-time telling,
     worked examples, self-explanation, feedback, cognitive load, prerequisites, backward
     design) to where it appears in our lesson, with design checks.
   - `LOG.md`: this file, with this first entry.

### Summary
- **Done:** Set up project context for AI assistants: a CLAUDE.md, an AI interaction log
  and a lecture summary tied to our design.
- **Decisions:** CLAUDE.md stays short and points to RESUME.md for theory. LOG.md is
  append-only, with a fixed per-session template (member, tool, interactions, summary +
  reflection).
- **Open questions:** Whether each team member keeps separate sessions in the shared LOG.md
  (current choice: one file, with the member named in each entry). The tech stack for the
  prototype is not decided yet (M3 prototype due Oct 8).
- **Reflection (AI draft — rewrite in your own words):** The AI helped mostly by condensing material. The lecture-to-design mapping
  table is a useful check that every activity (P1–P6) is backed by a learning mechanism from
  class. We still need to check the summary against the slides ourselves, because it was
  produced from extracted slide text and images or diagrams were not seen.

---

## Session 2026-09-29 (continued) — Julien Erbland — Prototype design for M3
**Tool:** Claude Code (Claude Opus 5.5)

### Interactions
1. **User:** "Yes on file per person." (Switch to per-person logs.)
   **AI:** Moved `LOG.md` → `logs/julien.md` and updated `CLAUDE.md`: each member logs in
   `logs/<member>.md` and never writes in another member's log.
2. **User:** "Now design a prototype that I would like to deploy on Vercel."
   **AI:** Classified this as a new project, so it follows a full design process (questions →
   approaches → sectioned design → written spec → plan) before any code. Wrote back its
   understanding from C2, then asked about scope.
3. **User:** Scope = "the prototype for M3, only the main attraction, focus on the education
   aspect and the playability."
   **AI:** Narrowed to the attention playground. Asked whether to include the AI tutor.
4. **User:** Chose to include 1–2 AI feedback points, with a toggle to the control version.
5. **User:** LLM provider: "not sure yet".
   **AI:** Proposed a provider-agnostic setup (Vercel AI SDK, model set by env var) plus a
   rule-based **mock tutor** so the prototype is playable without an API key.
6. **User:** Picked approach A (Next.js + Vercel AI SDK) over Vite+function and plain HTML.
7. **AI (design §1):** Playground (word tiles, weight bars labelled on the visual, swap/remove
   words, toy vectors with the real formula) and missions: contrast → predict a swap (tutor) →
   predict a removal (tutor, targets the "fixed pair weights" misconception) → free play.
   **User:** "Maybe add a little embedding explanation/reminder part."
   **AI:** Added Mission 0 "Words as vectors": a 2D meaning map where *model* sits between the
   fashion and ML clusters, similarity = alignment, one quick check, skippable. Justified as a
   prerequisite check / advance organizer (Ch. 4). **User:** approved.
8. **AI (design §2):** Tutor loop (max 2 rounds in both conditions; structured feedback:
   what works / what's missing / try this; gets the real weights and a rubric; never gives the
   formula). Control = fixed expert answer. **User:** "yes looks good".
9. **AI (design §3):** Architecture in `web/`, typed event logging with JSON export, Vitest
   tests including "content invariants" so tuned vectors can't silently break a mission,
   Vercel deploy with root `web`. **User:** "write the spec".
10. **AI:** Wrote `docs/superpowers/specs/2026-09-29-attention-playground-design.md`.

### Summary
- **Done:** Per-person logs; complete, approved design and written spec for the M3 prototype.
- **Decisions:** Next.js + AI SDK on Vercel; provider-agnostic, with a mock tutor fallback;
  Missions 0–4; tutor at Missions 2 and 3; 2D toy vectors (d_k = 2), no formula shown in M3;
  in-memory logging with JSON export (Supabase later).
- **Open questions:** LLM provider/key; exact vector values and expert answers still to be
  reviewed by the team.
- **Reflection (AI draft — rewrite in your own words):** The one-question-at-a-time process kept me in control of the pedagogical
  choices. The AI proposed options, and I shaped scope and added the embedding part myself.
  The AI tied each design choice back to lecture mechanisms, which will help justify the
  design in the M3 report.

## Session 2026-09-30 — Julien Erbland — Building the M3 prototype (Tasks 3–11)
**Tool:** Claude Code (Claude Opus 5.5, 1M context)

*Context from git history (end of the 2026-09-29 session, not logged there):* the AI wrote a
12-task implementation plan (`docs/superpowers/plans/2026-09-29-attention-playground.md`),
refocused Mission 2 on the "attention goes to the nearest word" misconception, and built
Task 1 (Next.js scaffold and attention math) and Task 2 (toy vectors, tiles, sentences,
with tests that check each mission's claims).

### Interactions
1. **User:** "continue your task"
   **AI:** Resumed the plan from its progress ledger at Task 3 and ran it inline: tests
   first, watched them fail, then implemented. Built:
   - Task 3: mission content (texts, rubrics, misconceptions, expert answers).
   - Task 4: `?condition=` parsing and the event logger (a failing log sink cannot break the lesson).
   - Task 5: tutor schema, rule-based mock tutor, LLM prompt, and fallback to the mock on
     timeout, error or malformed output.
   - Task 6: `/api/feedback` (400 on blank, padded or too-long explanations).
   - Tasks 7–10: lesson shell, session log with JSON download, and Missions 0–4 with the
     AI/control conditions.
   The playwright tool was down, so the AI drove a headless Chromium with scripts to check
   every manual item in the plan: bar percentages (55 %/20 %, 39/39, 55→65 %), locked
   predictions, the 2-round cap, the offline-tutor badge, the identical expert card in the
   control condition, and the log contents. A full 0→4 playthrough ran in each condition.
   Both downloaded logs contain start/end for all five missions and feedback events.
   **Deviation:** on the Mission 0 meaning map, three labels were nudged. Two arrows crossed
   the "smiled" and "the" labels, and the "predicted" label covered the *data* dot, so
   clicking *data* selected *predicted*. The headless click test found that. The vectors
   themselves were not changed.
   **Finding:** the offline tutor praised "it is closer to the model" as "position does not
   matter", which is the opposite of what the learner wrote. Queued for the fix pass after
   the final review.

### Summary
- Done: Missions 0–4 playable in both conditions with the offline tutor; logging with JSON
  export; README and CLAUDE.md pointer. 108 unit tests plus headless browser checks.
- Decisions: inline execution of the plan (no per-task subagents); label nudges on the
  meaning map instead of changing vectors.
- Open questions: which LLM and key to use for the real tutor (Task 12, Vercel deploy,
  needs the user); the team should review the mock tutor's keyword rules, since they
  can misfire on wording as shown above.
- Reflection (AI draft — rewrite in your own words): The pre-written plan made this session
  mostly execution. The useful surprises came from actually clicking through the app: a
  label that stole clicks, and an offline tutor that rewarded the misconception it was
  designed to catch. Neither shows up in unit tests. Keyword-based feedback is fragile,
  and that is an argument for the LLM tutor in the AI condition.

**Addendum (same session), final review and fix pass**
2. **AI:** Sent the whole branch to a fresh reviewer (a separate Claude Opus agent, read-only).
   Verdict: "fix before the M3 demo". The reviewer showed that the offline tutor got the key
   idea of both tutor missions backwards. It praised "smiled is close so it gets more weight"
   as "position does not matter", and it flagged correct answers such as "the weights are not
   fixed" as the misconception. It also found that the bar percentages added up to 99 % and
   101 %, while the Mission 3 hint tells learners to add them up.
   **AI:** Fixed each issue test-first (130 tests):
   - stricter rules in the offline tutor, and it now ignores sentences that negate;
   - bars rounded so they always total 100 %, with the "about 16 %" in the text now matching the bar;
   - length caps on the feedback API;
   - learner text fenced in the LLM prompt;
   - a fallback to the offline tutor if the LLM mentions formula words.

   Deferred as minor: duplicate submit events on retry, the free-play focus quirk, and some
   loose keywords. Rate limiting is to be decided at deploy.
3. **User:** Logged in to Vercel (`npx vercel login`) and asked how to check the current
   state of the app. **AI:** Pointed to the local production server, the git log, the ledger
   and this log. The deploy is waiting for explicit confirmation.
4. **User:** "deploy"
   **AI:** Linked `web/` to the Vercel project `attention-playground` (personal team) and deployed
   to production: https://attention-playground-opal.vercel.app. No LLM key yet, so the offline
   tutor answers. Smoke test: page 200, API mock JSON, 400 on blank input, full headless
   playthrough in both conditions with complete logs. URLs added to `README.md`.


## Session 2026-09-30 — Julien — M3 v2: new flow, sentence lab, formula part, gamified skin
**Tool:** Claude Code (Claude Opus 5.5)

### Interactions
1. **User:** After testing the prototype: humanize and shorten all text (humanizer skill,
   short sentences); make the layout adapt to screen size; implement the new 13-step flow
   agreed with the team (welcome, hook, motivation, pre-test, vectors + dot product, exploration,
   Q/K intro, predict-then-test, invent the weight formula, softmax, formula consolidation,
   explain, post-test); make the experiments feel like tabs around the same sentence that unlock
   one by one; restyle with the frontend-design skill and gamify it (XP bar, success).
   **AI:** Read the whole prototype, then wrote a plan in `tasks/todo.md` and asked 3 questions.
   The user chose: lab hub = steps 6–10; step 9 = "give them the bricks of the formula and they
   put it together" (the AI had proposed free-text rules or picking ready-made rules, and the user
   rejected both for a middle way); XP rewards effort, not correctness.
   **AI:** Implemented it:
   - new `content/steps.ts` with all copy rewritten short, straight quotes, no filler;
   - lab hub (`components/steps/Lab.tsx`) with six experiments that unlock in order and stay
     mounted, so going back never resets a prediction or duplicates log events;
   - new experiments: Query & key on the map, brick rule builder (`lib/rules.ts`, weight =
     top ÷ bottom, tested on our sentence plus two score sets with negative numbers), softmax
     comparison + 3-word calculation check;
   - formula step with clickable parts, √dₖ slider (with/without division) and V as the output
     arrow of "model" on the map; explain step with a new `formula` tutor task (rubric,
     misconception "softmax keeps only the top word", expert answer). The formula-leak guard
     now applies only before the formula is taught;
   - game layer: XP per effort, levels, 3 badges = LG1–LG3, a chapter map in the header;
   - visual identity: "word tiles on a game board" (ink board, maple tiles with the match score
     in the corner like tile points, cobalt bars, amber XP), Bricolage Grotesque + Atkinson
     Hyperlegible; fluid layout from phone to wide screen.
   Design decision by the AI: the bars now show raw q·k scores, while the weights still divide by
   √dₖ. Step 10 therefore shows a gap ("close, but flatter") that step 11 resolves.
   Pedagogical catch: in step 12 the formula board stays clickable, but the part explanations are
   hidden. Showing them would let learners copy instead of self-explain.
   **Verification:** 134 tests, lint, typecheck, build; headless playthroughs of the full lesson at
   phone and desktop sizes in both conditions. Testing found a real accessibility bug (the map's
   `role="img"` hid its clickable words) and hard-to-hit arrows; both fixed. The AI's own quote
   sweep broke string literals twice and was fixed. Not committed or deployed.

### Summary
- Done: new 13-step flow with the sentence-lab hub, formula part (steps 9–12), gamification,
  new skin, responsive layout, humanized copy. Pre-/post-tests are placeholders.
- Decisions: bricks for the invented rule; XP for effort only; raw scores on tiles; explanations
  hidden during the explain step; free-play mission removed (not in the new flow).
- Open questions: XP for revisions may inflate revision rates in both groups (RQ2 measures
  revision), so keep or drop it? Pre-/post-test items; LLM key for the AI condition; team review
  of the new copy.
- Reflection (AI draft, rewrite in your own words): the AI's first proposal for step 9 was either
  fully open (type a formula) or fully closed (pick a rule). The team's "bricks" idea sits between
  the two and fits productive failure better: learners still invent, but inside a space where
  failure is informative. The headless playthrough caught problems no unit test would, such as an
  accessibility bug and hydration races, but it did not judge whether the lesson *teaches*. That
  still needs a pilot with a real student.

**Addendum (same session)**
2. **User:** "commit and deploy"
   **AI:** Tests passed (134), then committed `c18e82f` on `feat/m3-prototype`. It deployed a
   Vercel *preview* (not production): https://attention-playground-bu6h41dnr-julienerbland-1855s-projects.vercel.app
   The preview is behind Vercel login. An authenticated smoke test passed: the page loads the new
   lesson, and `/api/feedback` answers the new `formula` task (offline tutor). Production still
   serves the M3 v1 build until someone promotes this one.

## Session 2026-09-30 — Julien — M3 v3: playtest feedback round
**Tool:** Claude Code (Claude Opus 5.5)

### Interactions
1. **User:** playtest feedback on v2: success/fail feedback too quiet; query & key unclear;
   swap/remove changes not visible; unlabelled score numbers; softmax step confusing; formula
   needs animations and an explanation of the division; replace XP/badges with a trophy.
   **AI:** implemented all 8 items:
   - one prominent `ResultBanner` (green / amber) used in every experiment;
   - Query & key rewritten: a query card for "model" meets each word's key card, with a match
     leaderboard (the map arrows are gone);
   - swap/remove animate on the board (old tile leaves, new tile drops in), with a preview before;
   - tiles show a labelled "match 4.3" under the word;
   - Softmax is now a staged pipeline (scores → eˢ → ÷ sum), with one intuition line per stage;
   - Formula: each clickable part animates the sentence (Q asks, K answers, √dₖ with/without,
     softmax bars grow, V flows into "model");
   - Explain step: one text box per formula part, rubric checked per part (schema + mock tutor);
   - XP/levels/badges replaced by `TrophyProvider` + `Trophy`: one piece per module, n/9 in the
     header, a congratulation screen at the end.
2. **User:** "finish the task you were doing"
   **AI:** re-ran the checks (140 tests, lint, typecheck, `next build`, all clean), ticked the
   todo item and wrote this entry. Not committed or deployed.
3. **User:** "commit and push on git, deploy on vercel too with name being AttentionSeeker-education"
   **AI:** committed `5950625` and pushed `feat/m3-prototype` to origin (first push of the branch).
   Vercel project names must be lowercase, so it created a new project `attentionseeker-education`
   (the old `attention-playground` project had no env vars, so nothing was lost) and deployed to
   production: https://attentionseeker-education.vercel.app. Smoke test: page 200, `/api/feedback`
   answers with the offline tutor. The old URL still serves v1. README link updated.

### Summary
- Done: all 8 playtest items; trophy replaces XP/badges; per-part explanations and rubric.
- Decisions: the trophy counts completed modules, not correctness, and is identical across
  conditions. Removing XP also resolves the v2 worry that XP for revisions would inflate revision
  rates (RQ2).
- Open questions: do the per-part explain boxes make the task too scaffolded versus one free
  explanation (LG1)? Pre-/post-test items still placeholders; LLM key for the AI condition.
- Reflection (AI draft, rewrite in your own words): the playtest found problems that tests and
  headless runs could not: learners did not *notice* results or changes. Most fixes were about
  making cause and effect visible (banners, animations, labels), which lowers extraneous load
  rather than adding content.
4. **User:** asked what differs between the AI tutor and the expert-answer version, and how the offline tutor works.
   **AI:** explained from the code: only the feedback after Submit differs (adaptive tutor vs one fixed model answer, both with an optional revision). The LLM tutor runs only with `TUTOR_MODEL` + gateway auth; otherwise a keyword-based offline tutor fills correct/missing/question from the mission rubric. Flagged that production currently runs the offline tutor, that the header's Demo menu lets participants switch condition, and the cause of the "A word" capital bug.
5. **User:** playtest round 2: swap/remove should show the weights, animate, then ask with "?" weights; bigger trophy notification; the rule builder is unclear ("what are Test A and Test B?"); a transition between slides.
   **AI:** implemented all four (see tasks/todo.md, "M3 v4"). Design choice by the AI: the match scores are hidden with the weights during the prediction, since the new score of "training run" would give the answer away. Tests renamed to "Our sentence / Mixed scores / All below zero" with a note each, plus a worked example of the rule on "fashion show". Verified with 140 tests, lint, build and headless runs on desktop and phone. Not committed.

**Summary (addendum)**
- Done: v4 flow for predictions, trophy card, clearer rule builder, slide transitions.
- Open questions: turn on the LLM tutor before the study; hide the condition switch from participants; the prediction now comes after seeing the new sentence, which changes what we log as "prediction" versus v3.
- Reflection (AI draft, rewrite in your own words): the playtest again pointed at *noticing* (transitions, rewards, what a test means) more than content. Seeing the sentence change before predicting makes the prediction about something concrete.
6. **User:** "Rename the name of the page to Attention Seekers, commit and push it, and deploy it"
   **AI:** renamed the browser title and the header logo ("Attention [Seekers]"), ran tests/lint/build, committed the v4 round with the rename, pushed `feat/m3-prototype` and redeployed production at https://attentionseeker-education.vercel.app.

## Session 2026-10-06 — Julien — sync teammates' work and redeploy
**Tool:** Claude Code (Claude Opus 5.5)

### Interactions
1. **User:** "Put the repo up to date and explain everything that was added. Then deploy it to vercel production."
   **AI:** Fetched and fast-forwarded `feat/m3-prototype` (13 commits: PR #1 André's debug tools, PR #2 Morgane's "Words as vectors" warm-up rework, Figma link, both members' AI logs). Explained the changes. Verified with `npm ci`, 148 tests, `tsc`, lint and build (all pass), then ran `vercel deploy --prod`. Smoke test: `?condition=ai`, `?condition=control` and `?debug` return 200, the debug toolbar appears only with `?debug`, `/api/feedback` rejects an empty body with 400. No source files changed.

### Summary
- Done: local branch synced with origin, production redeployed at https://attentionseeker-education.vercel.app.
- Decisions: deployed from the CLI, as before; left the empty root `package-lock.json` (added in André's PR) untouched.
- Open questions: the root `package-lock.json` may trigger Next's multiple-lockfile warning; local `main` is still 2 commits ahead of `origin/main`; `debug_*` events must be filtered out of study data.
- Reflection (AI draft for Julien to rewrite): The AI gave a quick overview of what teammates had merged without me reading every diff. Running the checks before deploying made sure their combined branches still built.
