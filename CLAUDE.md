# CLAUDE.md

## Project

CS-411 Digital Education (EPFL, Fall 2026, Prof. Käser). Team **PickMe**: André Cadet,
Julien Erbland, Morgane Magnin.

We design, build and test a ~30 min **interactive web lesson on scaled dot-product
attention**, `softmax(QKᵀ/√d_k)·V` (no multi-head), for Master's students heading into
ML / Modern NLP. Two versions:
- **AI condition:** an AI tutor gives adaptive feedback on learners' written explanations
  (names what is correct, points to the one wrong or missing part, asks a question that
  sends them back to the playground, **never gives the formula**). The learner revises.
- **Control:** identical lesson, but learners see a fixed expert answer, then may revise.

Only the adaptivity of the feedback differs. Keep everything else identical across conditions.

Lesson flow (v2, Sep 30): welcome → pre-test (without `?condition=`, the experimenter assigns the condition
from its score) → hook ("model" alone, then in context) → why attention → words as vectors + dot product → **sentence lab** hub on one sentence,
six experiments that unlock one by one (two contexts, query & key, predict a swap, predict a
removal, invent the rule from bricks, meet softmax) → formula with clickable parts, √dₖ slider
and V output → explain the formula (AI tutor vs expert answer) → post-test. Tests: `docs/tests.md`.
Gamified: XP for effort (never correctness, identical across conditions), levels, 3 badges = LG1–LG3.
Learning goals: LG1 explain Q/K/V, softmax, √d_k · LG2 compute a 3-token example ·
LG3 predict weight shifts for an ambiguous word.

Experiment: ~20 participants (10 per condition), pre-test/post-test, ANOVA.
RQ1 = learning outcomes; RQ2 = process (revision behavior), taken from logs.

## Key files

- `Course Project Description.pdf`: official milestones and deadlines (M3 Oct 8, M4 Nov 5,
  presentation Dec 15, report Jan 7).
- `CS_411_Digital_Education___Checkpoint_C2.pdf`: our current design.
- `lectures/`: course slides. **Read `lectures/RESUME.md` first** and justify design
  choices with those learning mechanisms. Update it when a new lecture PDF is added.
- `logs/<member>.md`: per-person AI interaction logs (see below).
- `web/`: the Next.js prototype (see `web/README.md`). `cd web && npm test` before committing.
  Teaching content lives in `web/content/`. Its claims are enforced by `web/tests/content-*.test.ts`.

## Priorities

- Pedagogical fit matters more than code quality. Grading looks at how well the tool serves learning.
- The lesson must log learner process data: playground actions, predictions, explanations,
  feedback received, revisions, time per phase.
- Keep the UI low in extraneous load (labels on the visualization, short sentences).

## AI interaction logging (required: we are part of a study)

The course studies our use of GenAI. Each milestone requires 1–2 AI interaction logs per
team member. **In every session:**

1. Identify the team member (ask if unknown) and append a new session entry to **their own
   log**: `logs/julien.md`, `logs/andre.md` or `logs/morgane.md` (create it if missing).
   Never rewrite or delete past entries, and never write in another member's log.
2. Record the date, the tool/model, and each user request
   with a concise account of the AI's response and actions (files changed, decisions,
   alternatives proposed, what the user accepted or rejected, and any corrections).
3. At the end of the session, add a **Summary** (mark the reflection as an AI draft for the member to rewrite): what was done, key decisions, open
   questions, and a short reflection on how the AI helped or hindered the work or learning.

Use this format:

```markdown
## Session YYYY-MM-DD — <member> — <topic>
**Tool:** Claude Code (<model>)

### Interactions
1. **User:** <request, quoted or paraphrased>
   **AI:** <what it did / answered>

### Summary
- Done: …
- Decisions: …
- Open questions: …
- Reflection: …
```
