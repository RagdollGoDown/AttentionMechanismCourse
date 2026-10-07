# Lecture Summary — CS-411 Digital Education

Summary of the lectures in this folder, with the takeaways that matter for designing our
attention-mechanism lesson. Update it when a new chapter is added.

## Ch. 1: Introduction (Sep 8)

- **Core principle:** learning depends on the *cognitive activity* a learner performs,
  not on the technology. We design the activity, change one factor (the AI affordance),
  measure learning and collect traces of what learners do.
- Landscape of learning technologies: drill & practice (spaced repetition, half-life
  models), intelligent tutoring systems (skill estimation, Cognitive Tutors), MOOCs,
  flipped classrooms, peer instruction, simulations (PhET), serious games, microworlds,
  and now **AI chatbots**. GenAI adds flexible, open-ended natural-language interaction
  (older precedent: AutoTutor).
- Lab examples of AI affordances: **REFINE** (AI feedback), **PharmaSim** (AI scaffolding:
  structuring vs. problematizing), **Pensée** (AI-supported reflection).
- Questions to ask of any AI affordance: *Where is AI used? What learning activity does it
  support? How might it support **or hinder** learning?*
- Deslauriers et al. (2019): actual learning ≠ *feeling* of learning. Measure learning
  with tests, not only self-reports.
- Course rules: using GenAI is expected, but **we must document AI interactions** and be
  able to justify every design choice ourselves.

## Ch. 2: Memory & Learning (Sep 15)

- Information-processing model: sensory → **working memory (limited)** → long-term memory.
  Learning happens when information is processed in working memory.
- Long-term memory is organized in **schemas** (and scripts). People recall gist over
  verbatim when material is meaningful, remember inferences they made, remember obstacles,
  and show primacy/recency effects. Meaningful material is remembered better.
- **Cognitive Load Theory**:
  - *Intrinsic*: the task is inherently hard → **manage** it (short sentences, small examples).
  - *Extraneous*: caused by poor design → **reduce** it (e.g. the *split-attention effect*:
    put labels on the visual itself, not in a separate legend).
  - *Germane*: effort spent building schemas → **encourage** it.
- Overload means no processing, and so no learning. No effort also means no learning.

## Ch. 3: Learning through Exploration (Sep 22)

- **Constructivism (Piaget):** learners build knowledge. New information is *assimilated*
  into a schema or forces *accommodation* through **cognitive conflict**.
- **Exploration → Consolidation:** explore first (compare, notice, predict, explain), then
  introduce the theory and relate it to what was observed.
- Mechanisms:
  - **Just-in-time telling** (Schwartz & Bransford, 1998): exploring first gives the
    explanation something to attach to.
  - **Productive failure** (Kapur, 2012): trying and failing to invent a solution prepares
    learners for the canonical one.
  - **Contrasting cases**: near-miss comparisons show which features matter.
  - **Undoing / trapping predictions**: ask for a prediction that exposes a known
    misconception, then replace it.
  - **Self-explanation**: learners fill in connections that an explanation leaves implicit.
- Exploration ≠ leaving learners alone. Learners explore unsystematically (change several
  variables at once, make no systematic comparisons). **AI can guide inquiry** (Shved et al.,
  2026): sequenced experiments, hypothesis before each experiment, interpretation prompts afterwards.

## Ch. 4: Learning through Mastery (Sep 29)

- **Behaviorism** (Thorndike's law of effect, Skinner's operant conditioning): immediate
  feedback, small steps, a continuously active learner, rewards and shaping.
- Constructivist vs. behaviorist: productive errors, delayed telling and an open space
  **vs.** frequent success, immediate feedback and small sequenced steps.
- Mechanisms:
  - **Worked examples**: reduce search for novices and show expert steps.
  - **Deliberate practice**: focused, effortful practice just beyond current ability.
  - **Feedback** (Hattie & Timperley, 2007): show the gap between the answer and the target
    and point to what to change. REFINE is a GenAI example.
- Frame-based e-learning: decompose into small steps, keep the learner active, give
  immediate feedback, let learners progress at their own pace.
- **Prerequisites & mastery learning:** Skill1 is a prerequisite of Skill2 if
  p(S2 | ¬S1) ≪ p(S2 | S1). Remediate missing prerequisites. Tests: prerequisite, pre-,
  intermediate and post-test.
- **Backward design:** start from what learners should know or do at the end and how we
  will check it (the test items), then design activities.
- **Sequencing activities:** a_i helps a_{i+1} if it is a prerequisite, activates a schema
  (advance organizer), changes the representation, or practices transfer.
- **Transfer:** use the skill in varied contexts and aim for deep understanding.
- **Key message:** instructional design means *combining* learning mechanisms to serve the
  objectives, not picking one theory.

## Takeaways for our project

| Lecture mechanism | Where it appears in our lesson |
|---|---|
| Contrasting cases | P1: "model" in fashion vs. ML sentence |
| Trapping predictions / undoing | P2: predict the weight shift before changing a word; targets misconceptions (fixed pair weights, nearest-word attention, "scaling is cosmetic") |
| Productive failure | P3: invent a normalization rule that fails on negative scores, which motivates `exp` |
| Just-in-time telling | P4: formula shown only after exploration, mapped onto the playground |
| Worked example + fading | P5: 3-token computation, then step-by-step checked practice |
| Self-explanation | P6 (and P2–P4): own-words explanations |
| Feedback (formative) | **The AI affordance:** adaptive tutor feedback on explanations; control = fixed expert answer |
| Cognitive load | Labels on the visualization (split attention), short sentences (intrinsic load) |
| Prerequisites / pre-test | Pre-test for dot product, softmax, embeddings; balance groups |
| Backward design | Post-test items per LG (LG1 explain, LG2 compute, LG3 predict) |

Design checks:
- The AI must **support the learning mechanism** (self-explanation, then repair), not
  replace thinking. The tutor points to the error and asks a question; it never gives the formula.
- Change **only the AI affordance** between conditions. Everything else stays identical.
- Log process data (playground actions, predictions, explanations, feedback, revisions,
  time per phase) to answer RQ2.
- Measure actual learning (post-test), not just perceived learning.
