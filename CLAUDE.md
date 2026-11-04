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
  The last reply is a closing one (states the remaining idea, no question). The AI group never
  sees the expert answer.
- **Control:** identical lesson, but learners see a fixed expert answer, then may revise.

Only the adaptivity of the feedback differs. Keep everything else identical across conditions.

Lesson flow (v2, Sep 30): welcome → pre-test (without `?condition=`, the experimenter assigns the condition
from its score) → hook ("model" alone, then in context) → why attention → words as vectors + dot product → **sentence lab** hub on one sentence,
five experiments that unlock one by one (two contexts: a wrong pick gets one feedback reply,
query & key, predict a removal, invent the rule from bricks, meet softmax) → formula with clickable parts, √dₖ slider
and V output → explain the formula (AI tutor vs expert answer) → post-test. Tests: `docs/tests.md`.
Reward: Byte, a robot dog in a garden band at the bottom, gets one gift per finished module (completion only,
never correctness, identical across conditions; hidden during the welcome and pre-test). He says hello once, cheers when a step opens or a gift arrives (effort only), and celebrates the end. Rationale: `tasks/todo.md`.
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
- `web/`: the Next.js prototype (see `web/README.md`). `cd web && npm test` before committing.
  Teaching content lives in `web/content/`. Its claims are enforced by `web/tests/content-*.test.ts`.

## Priorities

- Pedagogical fit matters more than code quality. Grading looks at how well the tool serves learning.
- The lesson must log learner process data: playground actions, predictions, explanations,
  feedback received, revisions, time per phase.
- Keep the UI low in extraneous load (labels on the visualization, short sentences).

## AI interaction logs

Do not write AI interaction logs or session summaries in the repo. The course collects them another way.
