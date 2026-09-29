# AI Interaction Log — Julien Erbland (Team PickMe)

Log of generative-AI interactions for the CS-411 Digital Education project (required for
the course study; 1–2 logs per member are submitted at each milestone). New sessions are
appended at the bottom. Past entries are never edited.

---

## Session 2026-09-29 — Julien Erbland — Project setup (CLAUDE.md, LOG.md, lecture summary)
**Tool:** Claude Code (Claude Opus 5.5)

### Interactions
1. **User:** "Generate a good CLAUDE.md file for this project, having the project
   description and our checkpoint to have an idea of what we do. Keep it short. Add the
   fact that we are part of a study so it should keep track of AI interactions, so it
   should create a LOG.md file too and fill it with AI logs and discussion and a summary
   after every session. […] a lectures folder with the actual lectures […] it should make a
   RESUME.md file in that folder that resumes the content of the lectures and the main
   takeaways to design the project."

   **AI:** Extracted the text of `Course Project Description.pdf`, the Checkpoint C2 PDF and
   the four lecture PDFs (Ch. 1 Introduction, Ch. 2 Memory & Learning, Ch. 3 Learning
   through Exploration, Ch. 4 Learning through Mastery). Created:
   - `CLAUDE.md`: a short project brief (topic, AI vs. control condition, lesson flow
     P1–P6, LGs, RQs, deadlines), pointers to key files, priorities (pedagogy over code,
     process logging, low extraneous load), and a mandatory per-session logging rule with a
     template for `LOG.md`.
   - `lectures/RESUME.md`: a summary per chapter plus a table mapping each lecture mechanism
     (contrasting cases, trapped predictions, productive failure, just-in-time telling,
     worked examples, self-explanation, feedback, cognitive load, prerequisites, backward
     design) to where it appears in our lesson, with design checks.
   - `LOG.md`: this file, with this first entry.

### Summary
- **Done:** Set up project context for AI assistants: a CLAUDE.md, an AI interaction log
  and a lecture summary tied to our design.
- **Decisions:** CLAUDE.md stays short and points to RESUME.md for theory. LOG.md is
  append-only, with a fixed per-session template (member, tool, interactions, summary +
  reflection).
- **Open questions:** Whether each team member keeps separate sessions in the shared LOG.md
  (current choice: one file, with the member named in each entry). The tech stack for the
  prototype is not decided yet (M3 prototype due Oct 8).
- **Reflection (AI draft — rewrite in your own words):** The AI helped mostly by condensing material. The lecture-to-design mapping
  table is a useful check that every activity (P1–P6) is backed by a learning mechanism from
  class. We still need to check the summary against the slides ourselves, because it was
  produced from extracted slide text and images or diagrams were not seen.

---

## Session 2026-09-29 (continued) — Julien Erbland — Prototype design for M3
**Tool:** Claude Code (Claude Opus 5.5)

### Interactions
1. **User:** "Yes on file per person." (Switch to per-person logs.)
   **AI:** Moved `LOG.md` → `logs/julien.md` and updated `CLAUDE.md`: each member logs in
   `logs/<member>.md` and never writes in another member's log.
2. **User:** "Now design a prototype that I would like to deploy on Vercel."
   **AI:** Classified this as a new project, so it follows a full design process (questions →
   approaches → sectioned design → written spec → plan) before any code. Wrote back its
   understanding from C2, then asked about scope.
3. **User:** Scope = "the prototype for M3, only the main attraction, focus on the education
   aspect and the playability."
   **AI:** Narrowed to the attention playground. Asked whether to include the AI tutor.
4. **User:** Chose to include 1–2 AI feedback points, with a toggle to the control version.
5. **User:** LLM provider: "not sure yet".
   **AI:** Proposed a provider-agnostic setup (Vercel AI SDK, model set by env var) plus a
   rule-based **mock tutor** so the prototype is playable without an API key.
6. **User:** Picked approach A (Next.js + Vercel AI SDK) over Vite+function and plain HTML.
7. **AI (design §1):** Playground (word tiles, weight bars labelled on the visual, swap/remove
   words, toy vectors with the real formula) and missions: contrast → predict a swap (tutor) →
   predict a removal (tutor, targets the "fixed pair weights" misconception) → free play.
   **User:** "Maybe add a little embedding explanation/reminder part."
   **AI:** Added Mission 0 "Words as vectors": a 2D meaning map where *model* sits between the
   fashion and ML clusters, similarity = alignment, one quick check, skippable. Justified as a
   prerequisite check / advance organizer (Ch. 4). **User:** approved.
8. **AI (design §2):** Tutor loop (max 2 rounds in both conditions; structured feedback:
   what works / what's missing / try this; gets the real weights and a rubric; never gives the
   formula). Control = fixed expert answer. **User:** "yes looks good".
9. **AI (design §3):** Architecture in `web/`, typed event logging with JSON export, Vitest
   tests including "content invariants" so tuned vectors can't silently break a mission,
   Vercel deploy with root `web`. **User:** "write the spec".
10. **AI:** Wrote `docs/superpowers/specs/2026-09-29-attention-playground-design.md`.

### Summary
- **Done:** Per-person logs; complete, approved design and written spec for the M3 prototype.
- **Decisions:** Next.js + AI SDK on Vercel; provider-agnostic, with a mock tutor fallback;
  Missions 0–4; tutor at Missions 2 and 3; 2D toy vectors (d_k = 2), no formula shown in M3;
  in-memory logging with JSON export (Supabase later).
- **Open questions:** LLM provider/key; exact vector values and expert answers still to be
  reviewed by the team.
- **Reflection (AI draft — rewrite in your own words):** The one-question-at-a-time process kept me in control of the pedagogical
  choices. The AI proposed options, and I shaped scope and added the embedding part myself.
  The AI tied each design choice back to lecture mechanisms, which will help justify the
  design in the M3 report.
