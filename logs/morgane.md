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
