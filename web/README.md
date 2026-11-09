# Attention Playground (M3 prototype)

Interactive lesson on scaled dot-product attention. Spec: `../docs/superpowers/specs/2026-09-29-attention-playground-design.md`.

## Run
    npm install
    npm run dev        # http://localhost:3000  (?condition=ai | ?condition=control; add &pid=P07 for a participant)
                       # without ?condition, one is drawn at random (50/50) on entry
    npm test           # math, content invariants, tutor, API route

## AI tutor
Set `TUTOR_MODEL` and its key in `.env.local` (or in Vercel project settings). Without them, a
rule-based offline tutor answers.

    TUTOR_MODEL=anthropic/claude-haiku-5.5   AI_GATEWAY_API_KEY=…   # any Vercel AI Gateway id
    TUTOR_MODEL=groq:<model id>              GROQ_API_KEY=…         # free providers, called directly
    TUTOR_MODEL=openrouter:<model id>        OPENROUTER_API_KEY=…
    TUTOR_MODEL=gemini:<model id>            GEMINI_API_KEY=…

Study setup: `TUTOR_MODEL=anthropic/claude-haiku-5.5` (gateway) with `TUTOR_FALLBACK_MODEL=groq:openai/gpt-oss-120b`.
The backup is tried when the primary fails, within one 12 s budget; then the offline tutor. Each reply logs the model that wrote it.
Protection: Vercel firewall rule (20 requests/min per IP on `/api/feedback`), a $5/month AI Gateway team budget,
prepaid credits without auto top-up, and at most 1024 output tokens per call.

Prompt: `lib/tutor/prompt.ts` (formative reply after the first attempt, closing reply at the end).

### Comparing tutor models
Synthetic explanations (`eval/explanations.ts`, never real participant data) go through the real
prompt and checks for each model; the report lands in `eval/report-<date>.md`.

    npm run compare:models                                    # model ids your keys can use
    COMPARE_MODELS="groq:<id>,openrouter:<id>,gemini:<id>" npm run compare

## Pre-/post-test and data collection
Spec: `../docs/tests.md`. The pre-test is step 2 (before the hook); the post-test is the last step.
Answers and session logs go to `POST /api/records`, which hands them to the store set in `.env.local`:

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
- `content/steps.ts`: lesson flow, chapters, all learner-facing text, Byte's gifts (`GIFTS`)
- `content/tests.ts`: pre-/post-test items, answer keys and rubrics; `lib/assessment.ts` scores them
- `content/missions.ts`: the three explain tasks (contrast, remove, formula): rubrics, misconceptions, expert answers
- `lib/`: attention math, rule bricks (step 9), tiles, logger, tutor; `lib/nav.ts` says which steps have a Back button
- `components/steps/`: one view per linear step; `Lab.tsx` is the hub with six unlockable experiments in `components/lab/`
- `components/GiftProvider.tsx`: one gift for Byte per finished module (completion only, identical in both conditions)
- `components/garden/`: Byte's garden band (`Garden.tsx`) and its three.js world (`world.ts`), loaded lazily
