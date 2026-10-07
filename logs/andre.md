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
