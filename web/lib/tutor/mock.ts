import type { ExplainTask } from '@/content/missions';
import type { Feedback } from '@/lib/tutor/schema';

// ponytail: keyword heuristic; a sentence that negates or concedes ("not", "but", "even though")
// is not read as holding a misconception. The LLM tutor is the real judge.
const NEGATED = /\b(not|no|never|instead|but|even though|although|despite)\b|n't/i;

// Keeps symbols such as Q, K or V capitalised.
const lowerFirst = (s: string) => (/^[A-Z]\b/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));

/** Rule-based stand-in for the LLM tutor: keyword checks against the mission rubric. */
export function mockFeedback(m: ExplainTask, explanation: string, parts?: Record<string, string>): Feedback {
  // With one box per part, an idea only counts in its own box.
  const textFor = (part?: string) => (part && parts ? parts[part] ?? '' : explanation);
  const hits = m.rubric.filter((r) => r.keywords.test(textFor(r.part)));
  const misconception = m.misconceptions.find((c) =>
    textFor(c.part).split(/[.;!?\n]+/).some((s) => c.keywords.test(s) && !NEGATED.test(s))) ?? null;
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
