## Session 2026-10-01 ? Andr? ? run website locally
**Tool:** GitHub Copilot

### Interactions
1. **User:** Asked whether the website could be run and accessed locally.
   **AI:** Inspected the web app scripts and README, installed dependencies in `web/`, started the Next.js development server, and verified `http://localhost:3000` returned HTTP 200. No source files were changed.

### Summary
- Done: Started the local Next.js development server and verified the homepage responds.
- Decisions: Used the existing `web` app scripts and port 3000.
- Open questions: Next.js reports a workspace-root warning because the repository has multiple lockfiles.
- Reflection: AI draft for Andr? to rewrite: The setup was straightforward after correcting the initial working directory; the local verification made the result concrete.

## Session 2026-10-02 — André — developer debug tools (step navigation + reset)
**Tool:** Claude Code (Claude Opus 5.5)

### Interactions
1. **User:** Wants debug tools in the web app: move back and forward between exercises and reset an exercise to retest it. Work on a separate branch; done once reviewed and tested locally. Asked whether the AI had questions first.
   **AI:** Read `Lesson.tsx` and `Lab.tsx` (9 linear steps, and the lab step holds 6 experiments that unlock one by one). Asked four questions. André chose: navigation over steps *and* lab experiments; tools hidden behind a `?debug=1` URL flag; reset clears only the current step's state (XP, trophy and log are kept, and a `debug_reset` event is logged); log in `logs/andre.md`. Created branch `feat/debug-tools`.
2. **User:** Interrupted: no commits, stay on this branch, start implementing.
   **AI:** Implemented with no commits:
   - `lib/condition.ts`: `parseDebug()` (only `1`/`true`), with tests in `tests/condition.test.ts`. `app/page.tsx` passes `debug` to `Lesson`.
   - `components/DebugBar.tsx` (new): fixed bottom-left toolbar with ← / step dropdown / → / "Reset step". Jumping does not award trophy pieces.
   - `components/Lesson.tsx`: `goTo` and `resetStep`. The reset bumps a counter in the step's React key, so the step remounts with fresh state.
   - `components/steps/Lab.tsx`: in debug mode all experiments are unlocked, with ← / → and a "Reset experiment" button that remounts only the active experiment and clears its "done" mark.
   - `lib/log.ts`: new event types `debug_goto` and `debug_reset`, so debug sessions can be filtered out of study data.
   - Checks: `tsc`, `eslint` and `npm test` (149 tests) all pass. On the dev server, the toolbar is in the HTML only with `?debug=1`.

### Summary
- Done: Debug navigation and reset at the step and lab-experiment levels, behind `?debug=1`. Uncommitted on `feat/debug-tools`, waiting for André's review and local test.
- Decisions: A URL flag instead of a dev-only build, so it also works on the Vercel preview. Reset works by remounting with a new key, and step components did not change. Debug jumps never award trophy pieces.
- Open questions: Resetting a step does not take back trophy pieces already won. Should a "reset everything" button be added later? Debug events are logged and need to be excluded during analysis.
- Reflection (AI draft for André to rewrite): Asking the scope questions before coding avoided guessing about the lab's inner navigation and about hiding the tools from participants.

### Follow-up (same session)
3. **User:** The URL flag should be just `debug` or no flag at all. Is that doable?
   **AI:** Yes. `parseDebug()` now returns true whenever the parameter is present (`?debug`, and also `?debug=anything`), and false when it is missing. Updated the tests and the comments that mentioned `?debug=1`. Checks: `tsc` passes, all 145 tests pass (4 old value-based cases dropped), and on the dev server the toolbar appears with `?debug` and `?condition=control&debug` and is absent without the flag.

## Session 2026-10-07 — André — formula V-view visual bug (flashing dots)
**Tool:** Claude Code (Claude Sonnet 5.5, then Claude Opus 5.5)

### Interactions
1. **User:** In section 4 (formula), clicking V makes dots of different sizes flash repeatedly on a horizontal line. Where could this bug come from?
   **AI:** Traced it to the `flow` prop of `Playground` (used only in the V view of `Formula.tsx`). Each non-focus word draws a green dot sized `6 + weight × 22` px, and the `value-flow` CSS animation loops forever (fade in, slide to "model", fade out). Also pointed out that the global `prefers-reduced-motion` rule shortens animations to 0.01 ms, which would turn an infinite loop into a strobe. Proposed running it once with a Replay button.
2. **User:** Yes (apply the fix).
   **AI:** Made `value-flow` run once instead of `infinite`. Added a Replay button in the V view of `Formula.tsx` that remounts the `Playground` through a `key` counter. Tests pass (215).
3. **User:** No dots appear when going to the formula. Is that normal, and what am I meant to see?
   **AI:** Explained that dots only appear in the V view and play for about 1.6 s. Proposed keeping the dots visible on "model" at the end.
4. **User:** Nothing appears at all when clicking V. The speech bubbles work, but there are no green dots.
   **AI:** Suspected reduced motion: a single 0.01 ms run is invisible, and the original infinite loop at 0.01 ms explained the flashing. Changed the keyframes so dots end visible on "model", with a static end state under reduced motion.
5. **User:** (switched to Opus) Only a single dot at the 55 % mark of "model" and no animation.
   **AI:** Checked Windows: "Animation effects" is off (`SPI_GETCLIENTAREAANIMATION = False`), so the browser reports `prefers-reduced-motion: reduce`. This confirmed the root cause of the original bug. All dots were stacked on "model", so only the largest was visible. Proposed a faint resting dot on each word, a moving copy hidden under reduced motion, and Replay hidden with `motion-reduce:hidden`.
6. **User:** Remove the resting dot.
   **AI:** Removed it from `Playground.tsx`, so under reduced motion the V view shows no dots.
7. **User:** Write the log.
   **AI:** Wrote this entry. Noted that André had already committed `d3a280a fix: visual bug on formula` on `fix/formula-value-visual-bug`. The committed `globals.css` (reformatted) holds the step-4 version: dots travel once and stay on "model", and under reduced motion they sit statically on "model". It is not the step-5/6 version (fade out, moving dot hidden under reduced motion). `Playground.tsx` is back to the original single dot. The Replay button is in the commit.

### Summary
- Done: Found the cause of the flashing dots: an infinite CSS animation, shortened to 0.01 ms by the global reduced-motion rule on a machine with Windows animation effects off. The animation now runs once, with a Replay button. Committed by André as `d3a280a`.
- Decisions: Run once rather than loop. Gave up on the resting dot at André's request.
- Open questions: Which reduced-motion behaviour should be kept? The commit leaves the dots stacked on "model" (looks like one dot), whereas the last change hid them. Check how the other animations behave for participants with reduced motion on. The blanket 0.01 ms rule hides the intended motion and does not mean "no motion".
- Reflection (AI draft for André to rewrite): The first diagnosis found the right code but missed the environment factor. The AI only found the real cause by checking the OS setting, after several fixes based on what the user saw. Asking earlier about reduced motion, or checking it first, would have saved two iterations.

## Session 2026-10-07 — André — pre-test and post-test
**Tool:** Claude Code (Claude Opus 5.5)

### Interactions
1. **User:** Shared the M3 report and asked for a small pre-test at the start and a post-test at the end, following the ideas in the report. Answers may later be sent to an outside service (e.g. Supabase). Asked to raise questions first.
   **AI:** Read the M3 report (§2, §5.3, §7), `lectures/RESUME.md` and the web code. Found that Julien had moved the pre-test out of the lesson ("own page before the condition is assigned") but the page was never built, and that a `LogSink` hook was waiting for a backend. Asked four questions. André chose: a separate `/pretest` page where the experimenter reads the score and opens the AI or control lesson link; a pre-test with prerequisites plus one item per goal; the AI drafts every item for the team to review; transport through our own API route with a pluggable store.
   - Items (`web/content/tests.ts`): pre-test with 10 items (2 background, 5 prerequisite, Q/K/V matching, a 2-word weight, a *bat* removal item); post-test with 8 items (the same Q/K/V matching, 3 open LG1 answers, a 3-token calculation for *bank*, a *bank* removal item, a *fishing trip* → *robbery* swap with an explanation). Numbers are computed from `lib/attention.ts` and checked independently in Python. The numeric items were chosen so that the scaled answer, the unscaled answer and a plain ratio of scores stay apart. "I don't know" on knowledge items. No formula and no feedback in the tests.
   - Scoring (`lib/assessment.ts`): auto-scoring for choice, matching, numbers and the calculation (output checked against the learner's own weights, as in the lesson); open answers are marked for rubric scoring; scores per goal; first/last touch time per item.
   - Pages: `TestForm` (all items on one page, warns about empty answers), `/pretest` with an experimenter panel (scores, save status, lesson links that carry the pid), and a `Posttest` step replacing the placeholder. The calculator moved to its own component and got a placeholder that gives no hint about the method.
   - Data: `POST /api/collect` validates each record (test or session log) and hands it to a store chosen by `COLLECT_STORE` (`none` by default, `webhook`, or `supabase` through its REST API). The debug bar shows the store status. A failed send offers the JSON download.
   - Fix found while piloting: in `?debug` the toolbar covered the post-test Submit button; the lesson now has bottom padding in debug mode.
   - Checks: 260 tests, typecheck, lint, build; headless Chrome pilot (pre-test on a phone, post-test on desktop and phone): scores as expected, no console errors, no horizontal overflow. Docs: `docs/tests.md`, `web/README.md`, `CLAUDE.md`. Not committed.

### Summary
- Done: working pre-test page and post-test step, scoring, logging, and a backend-agnostic way to send answers and logs out.
- Decisions: pre-test before the lesson on its own page (M3's table puts it after the hook, so the report needs updating); one baseline item per goal in the pre-test; Q/K/V matching identical in both tests; no formula in the LG2 items; the Supabase key stays server-side.
- Open questions: who scores the open answers, and blind to the condition? The exact assignment rule (suggested: stratify on prior exposure, then alternate). Total time is now ~50 min. Supabase is untested against a real project. `/api/collect` has no authentication.
- Reflection (AI draft for André to rewrite): settling placement, scope and backend before coding avoided rework, since the code already hinted at a design that M3 described differently. The headless pilot caught a covered button that unit tests could not.

### Follow-up (same session)
2. **User:** "I think you made the pre-test a separate thing but could you fit it into the course before the hook?"
   **AI:** Moved the pre-test into the lesson as step 2 (welcome → pre-test → hook) and removed the `/pretest` page. To keep M3's rule that the condition comes from the pre-test score, a link without `?condition=` now leaves the condition unassigned (`null`, which is a change to `parseCondition`, which used to default to AI). The lesson waits after the pre-test until the experimenter clicks "Continue: AI tutor" or "Continue: control" in the panel. This is logged as `condition_change` from `null` and written into the URL. With `?condition=` the learner just clicks "Start the lesson". The flow is now one session and one log. 261 tests, typecheck, lint and build pass. Headless pilot: an unassigned link (pre-test → experimenter assigns control → hook, URL updated) and an assigned link (no assign buttons), then the post-test to the end screen; no console errors. Updated `docs/tests.md`, `web/README.md` and `CLAUDE.md`.
   - Note: a plain link (no condition, e.g. the prototype URL given to graders) now stops after the pre-test until someone opens the experimenter panel. Share `?condition=ai` for demos.
3. **User:** Asked why so many files were modified, and for a list of commits that makes a respectable PR.
   **AI:** Explained that most of the work is new files; the 13 modified files total +115 / −88 lines, grouped by reason (calculator extraction, placeholder removal, pre-test step, unassigned condition, logger fields, debug bar, docs). Proposed 7 commits in dependency order, each building on its own, and offered to merge commits 4–6 to avoid splitting `Lesson.tsx` and `steps.ts`.
4. **User:** "Yea that sounds good go ahead."
   **AI:** Made the 7 commits on `feat/pre-post-test-prototypes` (calculator refactor → items and scoring → collect API → post-test → pre-test → debug padding fix → docs), building intermediate versions of `Lesson.tsx` and `steps.ts` so each commit holds one change. Checked every commit in a clean worktree (typecheck and tests). Not pushed.
