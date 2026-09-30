import type { TutorMission } from '@/content/missions';
import type { Feedback } from '@/lib/tutor/schema';

// ponytail: keyword heuristic; a sentence that negates or concedes ("not", "but", "even though")
// is not read as holding a misconception. The LLM tutor is the real judge.
const NEGATED = /\b(not|no|never|instead|but|even though|although|despite)\b|n't/i;

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Rule-based stand-in for the LLM tutor: keyword checks against the mission rubric. */
export function mockFeedback(m: TutorMission, explanation: string): Feedback {
  const hits = m.rubric.filter((r) => r.keywords.test(explanation));
  const sentences = explanation.split(/[.;!?\n]+/);
  const misconception = m.misconceptions.find((c) => sentences.some((s) => c.keywords.test(s) && !NEGATED.test(s))) ?? null;
  const firstMissing = m.rubric.find((r) => !hits.includes(r));

  const correct = hits.length > 0
    ? `Good: you already see that ${lowerFirst(hits[0].text)}`
    : 'You looked closely at what happened, which is a good start.';

  const target = misconception ?? firstMissing;
  return {
    correct,
    missing: target ? target.hint : 'Nothing essential is missing. Can you say it in one precise sentence?',
    question: target ? target.probe : m.rubric[0].probe,
    misconceptionId: misconception?.id ?? null,
    rubricHits: hits.map((h) => h.id),
  };
}
