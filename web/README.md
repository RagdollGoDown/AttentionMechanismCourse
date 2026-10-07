# Attention Playground (M3 prototype)

Interactive lesson on scaled dot-product attention. Spec: `../docs/superpowers/specs/2026-09-29-attention-playground-design.md`.

## Run
    npm install
    npm run dev        # http://localhost:3000  (?condition=ai | ?condition=control; add &pid=P07 for a participant)
                       # without ?condition, the experimenter assigns it after the pre-test, from the score
    npm test           # math, content invariants, tutor, API route

## AI tutor
Set `TUTOR_MODEL` (e.g. `anthropic/claude-haiku-4.5`) and `AI_GATEWAY_API_KEY` in `.env.local`
(or in Vercel project settings). Without them, a rule-based offline tutor answers.

## Pre-/post-test and data collection
Spec: `../docs/tests.md`. The pre-test is step 2 (before the hook); the post-test is the last step.
Answers and session logs go to `POST /api/collect`, which hands them to the store set in `.env.local`:

    COLLECT_STORE=none                       # default: nothing is kept (debug bar shows it in red)
    COLLECT_STORE=webhook                    # any URL that accepts a JSON POST
    COLLECT_WEBHOOK_URL=https://…
    COLLECT_WEBHOOK_SECRET=…                 # optional, sent as "Authorization: Bearer …"
    COLLECT_STORE=supabase                   # REST insert, one row per record
    SUPABASE_URL=https://<project>.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=…              # server only, never NEXT_PUBLIC_
    SUPABASE_TABLE=study_records             # optional

Supabase table: `create table study_records (id bigint generated always as identity primary key, kind text,
session_id text, participant_id text, condition text, debug boolean, received_at timestamptz, data jsonb);`
A new backend is one function in `lib/collect/store.ts`.

## Where things live
- `content/steps.ts`: lesson flow, chapters, all learner-facing text, XP and badges
- `content/tests.ts`: pre-/post-test items, answer keys and rubrics; `lib/assessment.ts` scores them
- `content/missions.ts`: the three explain tasks (swap, remove, formula): rubrics, misconceptions, expert answers
- `lib/`: attention math, rule bricks (step 9), tiles, logger, tutor; `lib/nav.ts` says which steps have a Back button
- `components/steps/`: one view per linear step; `Lab.tsx` is the hub with six unlockable experiments in `components/lab/`
- `components/GameProvider.tsx`: XP (pays for effort, not correctness, identical in both conditions) and badges
