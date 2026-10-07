# Pre-test and post-test

Implements M3 §2, §5.3 and §7. Items live in `web/content/tests.ts`. Every number in them is computed
from `lib/attention.ts` and checked by `web/tests/content-tests.test.ts`.

## Why two tests

- **Pre-test** (lesson step 2, between the welcome and the hook, ~6 min): a *prerequisite test* in the sense of
  mastery learning (dot product, matrix product, probability distribution, embedding, softmax), prior exposure
  (attention, ML course), and **one short item per learning goal**. It gives (1) the score used to assign the
  condition so both groups start level, and (2) a baseline per goal, used as a covariate and for gains.
  It is scored automatically, so the experimenter can read the score right away.
- **Post-test** (last lesson step, ~12 min, identical in both conditions): every goal on new material
  (backward design). LG1: Q/K/V roles, why softmax, one scaling sentence. LG2: a new 3-token calculation.
  LG3: a new ambiguous word, *bank* (transfer). No feedback and no correct answers are shown in either test.

## Items

| Test | Id | Goal | Kind | Scoring |
|---|---|---|---|---|
| pre | bg-attention, bg-ml | background | choice | not scored (covariates) |
| pre | pre-dot, pre-matmul, pre-prob, pre-embedding, pre-softmax | prereq | number / choice | auto, 1 pt each |
| pre + post | qkv-match | LG1 | match (same item in both) | auto, 1 pt per role (3) |
| pre | pre-weight | LG2 | number, 2 words (twin `lg2-weights`) | auto, ±0.02 |
| pre | pre-remove (*bat*) | LG3 | choice (twin `lg3-remove`) | auto |
| post | post-qkv-explain, post-softmax, post-scale | LG1 | open text | rubric, 1 pt per idea (3 + 3 + 2) |
| post | post-compute (*bank*, q = [0, 2]) | LG2 | 3 weights + 2 output numbers (twin `lg2-weights`) | auto, 1 pt per cell; the output is checked against the learner's own weights |
| post | post-remove (*bank*) | LG3 | choice (twin `lg3-remove`) | auto |
| post | post-swap, post-swap-explain (*fishing trip* → *robbery*) | LG3 | choice + open text | auto + rubric (3) |

Knowledge items offer "I don't know" to cut guessing. The calculator from the lesson is available on the
numeric items; its placeholder gives no hint about the method. The formula is **not** shown in either test,
since knowing its steps is part of LG2.

## Assigning the condition

It runs before the hook, so nothing in the lesson has taught its answers yet, and it is one session with the lesson.

- Study link **without** a condition (`/?pid=P07`): the pre-test ends on "please tell the experimenter". A collapsed
  "For the experimenter" panel shows the scores per goal, the prior-exposure answer and the save status, with
  two buttons, "Continue: AI tutor" / "Continue: control". The choice is logged as `condition_change`
  (`from: null`), written into the URL, and the lesson goes on to the hook. Events before it have `condition: null`.
- Link **with** `?condition=ai|control`: the learner just clicks "Start the lesson" (the panel is still there).
  Any other value counts as no condition.

Suggested rule (to confirm as a team): two strata ("studied attention before" yes/no), then alternate AI/control
within each stratum in arrival order, and check after ~10 participants that the mean pre-test scores are close.

## Data

Each submit sends two records to `POST /api/collect`: `test` (answers, per-item score, first/last touch time,
scores per goal, pending rubric points) and `session` (the full event log, as in the download). Events:
`test_answer`, `test_submit`, `calc_use`, `data_sent`. The pre-test sends the session log so far; the post-test sends the complete one (same `sessionId`).

The server passes records to the store chosen by `COLLECT_STORE` (see `web/README.md`): `none` (default, nothing
is kept), `webhook` (any URL that accepts JSON) or `supabase` (REST insert, no SDK). The debug bar shows the
store in red when nothing is kept. If a send fails, the page offers the JSON download.

## Open points

- Rubric scoring of the open items: who scores, and blind to the condition (M3 placeholder).
- The pre-test shows the role wording of Q/K/V before the lesson (mild priming, the same in both groups).
- Lesson + tests now take ~50 min. The post-test can be cut by dropping post-qkv-explain if needed.
- `/api/collect` has no authentication: fine for a supervised study, but anyone with the URL can post records.
