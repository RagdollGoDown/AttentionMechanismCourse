# Attention Playground (M3 prototype)

Interactive lesson on scaled dot-product attention. Spec: `../docs/superpowers/specs/2026-09-29-attention-playground-design.md`.

## Run
    npm install
    npm run dev        # http://localhost:3000  (?condition=ai | ?condition=control)
    npm test           # math, content invariants, tutor, API route

## AI tutor
Set `TUTOR_MODEL` (e.g. `anthropic/claude-haiku-4.5`) and `AI_GATEWAY_API_KEY` in `.env.local`
(or in Vercel project settings). Without them, a rule-based offline tutor answers.

## Where things live
- `content/steps.ts`: lesson flow, chapters, all learner-facing text, XP and badges
- `content/missions.ts`: the three explain tasks (swap, remove, formula): rubrics, misconceptions, expert answers
- `lib/`: attention math, rule bricks (step 9), tiles, logger, tutor; `lib/nav.ts` says which steps have a Back button
- `components/steps/`: one view per linear step; `Lab.tsx` is the hub with six unlockable experiments in `components/lab/`
- `components/GameProvider.tsx`: XP (pays for effort, not correctness, identical in both conditions) and badges
