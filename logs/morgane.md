# AI interaction log — Morgane

## Session 2026-10-04 — Morgane — refining the "Words as vectors" warm-up
**Tool:** Claude Code (Claude Opus 5.5)

Context: while reviewing the query & key experiment, I questioned the "fashion" / "machine learning" labels on vector entries. The AI agreed that single dimensions of real embeddings are not interpretable and that the lesson never says our 2D axes are a simplification. This led me to rework the warm-up (step 5) on branch `feat/m3-refinements`.

### Interactions
1. **User:** Asked for a more detailed warm-up, renamed "Words as vectors", explaining what the dot product is and what it measures. Keep the site's styling, take inspiration from our Figma screen "AI · 06 Words as vectors", and keep the skip option.
   **AI:** Rebuilt the step as four parts that unlock one by one: (1) a word is a vector, (2) dimensions vary (2 / 8 / 512 switch), (3) the dot product (drag b against a fixed a, with a live sum, the angle and the sign; tasks: make a · b = 0, make it as negative as possible, compute [2, 1] · [1, 3] by hand), (4) which words "model" matches. Kept the skip link, added content tests for every claim and log events for each interaction.

2. **User:** Parts 2 and 4 don't add value for understanding words as vectors. Remove them, mention in part 1 that dimensions vary, show a word's vector only while hovering, and go back to the original map with the "fashion" / "machine learning" axes.
   **AI:** Reduced the warm-up to two parts and restored the original map. The vector tooltip now disappears when the pointer leaves the word. Because part 4's ending was gone, the step ends with the original question: "model" sits between the two groups, so how does it know which meaning it has?

3. **User:** Asked whether the part 1 text is relevant and technically correct, and wanted more impactful wording, e.g. using the word "dimension".
   **AI:** Mostly correct (512 is the original Transformer's vector size), but it never said the vectors are learned, never named the dimension, overstated similarity ("point the same way") and didn't flag our named axes as a simplification. Proposed a rewrite: learned vectors; dimension = number of entries (2 here, 512 in the original Transformer, thousands today); similar meanings point in a similar direction; a note on the axes.

4. **User:** The axes sentence was still unclear and too specific ("a name like 'fashion'"); the hint should say "vector".
   **AI:** Final wording: "Our axes have names only to make the map easy to read. In a real model, a single dimension has no clear meaning on its own." Hint: "Hover over a word to see its vector."

5. **User:** Make the part 2 formula look like maths, add a purple GitHub-style note saying there are two terms because the vectors have 2 dimensions, and remove the hint under "Make a · b as negative as you can" so learners find it alone.
   **AI:** Set a · b = a₁b₁ + a₂b₂ in a maths font with italic variables and subscripts (plain HTML/CSS, no new library). Added the note: "There are two terms here because our vectors have 2 dimensions: one term per dimension." Removed the hint.

6. **User:** Layout fixes: a larger map in part 1 (then smaller again when it became too large), the default b label in part 2 no longer overlapping the angle, the box above the plot shorter and centred, and the "512 terms" callout removed.
   **AI:** Applied each change: map width settled at a middle size, arrow labels now sit past each arrow's tip, the readout box fits its content, and the callout is gone. Checked each change in the browser.

7. **User:** Asked whether the code was clean and ready for a PR, whether tests cover it, and whether other pages are affected.
   **AI:** Reviewed the diff and fixed six small issues: two stale comments, a test that only repeated another, screen-reader announcements on every drag step (now once per drag), a wrong accessibility role on the drag handle, and smooth scrolling that ignored "reduce motion". Testing the site myself, I found b's label cut off at the left edge; the AI widened the space for labels. Tests cover the content claims but not the drag and plot code. Outside the warm-up, only the trophy piece name and the log event names change; the formula step's map is unchanged.

### Summary
- Done: the warm-up is now two parts. Part 1 (a word is a vector): learned vectors, the term "dimension", and an honest note that our axis names are a simplification. Part 2 (the dot product): the formula set as maths, a note linking terms to dimensions, and three tasks the learner must solve without hints. The skip option is kept.
- Decisions: removed the dimensions and "model matches" parts as low value; no hints on the negative-dot-product task (productive struggle); no named meaning for single dimensions; no maths library for one formula.
- Open questions: phone-width layout not yet checked; the drag and plot code has no automated tests; the formula step's map still shows named axes; the query & key card still labels the rows "fashion" / "machine learning".
- Reflection (AI draft, to rewrite): The AI was most useful when I questioned the content: it confirmed that dimensions of real embeddings can't be interpreted and turned that into precise wording. Its first rebuild added more than the lesson needed, and I had to cut half of it, so its proposals needed my judgement on what serves the learning goal.

## Session 2026-10-06 — Morgane — back navigation and the control revision
**Tool:** Claude Code (Claude Opus 5.5)

Context: two changes, split into two PRs from `feat/m3-prototype`: going back to earlier parts of the lesson (branch `feat/back-navigation`), and the revision step in the control condition (branch `feat/control-expert-once`).

### Interactions
1. **User:** Let learners go back to earlier parts: written answers should be visible again, and lab experiments can be redone. Also remove the revision step in the control condition, since the expert answer is the same whatever the learner writes.
   **AI:** Asked four questions before coding. I chose two PRs, read-only answers when going back, a Redo button that restarts a lab experiment, and no Back into or out of the tests. First implemented: one explanation round in control (`MAX_ROUNDS`), a Back button with visited steps kept mounted, a Redo button per finished experiment, and answers that lock once the learner moves on.

2. **User:** Asked whether removing the control revision harms the AI vs control comparison.
   **AI:** Yes: the AI group would get an extra writing round (a second difference besides the feedback), and RQ2 (revision behaviour) would lose its control group. I agreed to keep the revision in both conditions. The AI reworked PR 1: in control, the expert answer is shown once and stays visible, a revision shows "✓ Revision saved." instead of a second expert card, and the card invites the learner to rewrite in their own words. The control revision is logged with `source: 'none'`.

3. **User:** Asked whether back navigation affects the comparison.
   **AI:** Not by design (both conditions get it), but going back from "Explain the formula" to the formula step would show the part texts learners must generate. Blocked Back on the Explain step.

4. **User:** Remove Back on the start steps (Hook, Why); keep it only from the lab to the warm-up and from the formula to the lab.
   **AI:** Replaced the blocked-steps list with an allow-list, `BACK_STEPS = ['lab', 'formula']` in `lib/nav.ts`, with tests for each allowed and blocked step.

5. **User:** Asked to check the code was ready for PR, and for commit messages and PR descriptions.
   **AI:** Ran tests, lint, typecheck and build on both branches, reviewed both diffs and added a README line for `lib/nav.ts`. Committed and opened both PRs after I approved the titles and descriptions.

### Summary
- Done: Back from the lab to the warm-up and from the formula to the lab; Redo for finished lab experiments; written answers read-only once the learner moves on; new log events `nav_back` and `lab_redo`. In control, the expert answer is shown once and the revision is confirmed.
- Decisions: keep the optional revision in both conditions (only the feedback differs); no Back at the start, around the tests or from the Explain step; an allow-list of steps with Back.
- Open questions: phone-width layout not checked; whether pilot learners want to go back from the Explain step to the lab.
- Reflection (AI draft, to rewrite): The AI's first version followed my request literally and removed the control revision. Asking it about the impact on the comparison surfaced the confound, and we turned the change into a smaller fix. Its questions before coding and its check of the Explain step helped protect the study design.
