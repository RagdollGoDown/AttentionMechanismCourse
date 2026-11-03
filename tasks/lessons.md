# Lessons

## 2026-09-30 — playtest feedback on M3 v2
- **Success must be unmistakable.** Small green text is missed. Rule: every check ends in a big result banner (icon + "Right!" / "Not quite" + one-line why).
- **Every number on screen needs a label where it sits.** An unlabelled corner number ("4.3") reads as noise. Rule: write "match 4.3", never a bare value.
- **Show changes, don't just swap state.** Swapping or removing a word must be visible as motion (the old tile leaves, the new one arrives), or learners miss what changed.
- **Abstract visuals need a concrete voice.** Query/key as arrows was not intuitive. Rule: give the concept words ("model asks: who should I listen to?") before or instead of geometry.
- **Rewards: keep them meaningful and few.** Points for every click felt arbitrary. Rule: reward completing a module (trophy piece), not micro-actions.
- **Self-explanation of a multi-part formula needs one box per part**, so learners can't skip a part and feedback can point at one.

## 2026-09-30 — playtest feedback on M3 v3
- **Predict after the change, not before it.** Show the state, animate the change, hide the result ("?"), then ask. Predicting about an imagined change is harder to follow than predicting about a visible one.
- **Test cases need names that say what they test.** "Test B" means nothing; "All below zero" tells the learner why the rule might break.
- **Make a built rule concrete.** Show it computed on one familiar word (s → top → ÷ → %).
- **Transitions must be visible.** Without motion, a new step or question can go unnoticed. Every step change slides in.
- **Rewards must be seen.** A small toast at the bottom is missed; announce a trophy piece in the centre, big.

## 2026-11-03 — tutor playtest + provider comparison
- **Check the free tier's real quota on the account, not the docs.** Groq's page said 200k tokens/day for
  qwen; the account's error said 20k. Read the error from a real call before choosing a provider.
- **Know which tutor answered before judging a reply.** Fixed phrases ("Good: you already see…", "Keep this:")
  are the offline fallback. Check the dev log for "[tutor] LLM failed" first.
- **A tutor must not ask for what the learner already said.** Credit implied ideas ("probabilities" ⇒ sums to
  100 %), decide the hits before writing, and allow "nothing is missing".
- **Verify a learner's claim against the numbers before agreeing with the learner.** The tutor was right that
  "smiled" did not change; the playtester was not.
- **One experiment, one idea.** Swap repeated two contexts; cut it rather than keep two screens teaching the same thing.
- **Label toy vector dimensions as meanings ("about fashion"), never as bare words.**
- **Blanket find-and-replace on ids breaks negative tests.** After renaming, re-read tests that use the old id
  on purpose (e.g. "rejects bad mission").
