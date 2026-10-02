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
