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
- `content/`: all teaching content (vectors, sentences, missions, rubrics, expert answers)
- `lib/`: attention math, tiles, logger, tutor
- `components/missions/`: one view per mission; `registry.tsx` decides which are playable
