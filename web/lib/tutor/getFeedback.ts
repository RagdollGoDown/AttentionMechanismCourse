import { generateText, Output, type LanguageModel } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { EXPLAIN_TASKS, type ExplainTask } from '@/content/missions';
import { mockFeedback } from '@/lib/tutor/mock';
import { buildUserPrompt, systemPrompt } from '@/lib/tutor/prompt';
import { FeedbackSchema, type Feedback, type FeedbackRequest, type FeedbackResponse } from '@/lib/tutor/schema';

export type LlmFn = (system: string, prompt: string, signal: AbortSignal) => Promise<unknown>;
/** One LLM the app may ask, by its model spec. */
export interface Tutor { model: string; llm: LlmFn }
type Env = Record<string, string | undefined>;

/**
 * Free providers called directly, through their OpenAI-style endpoints: `TUTOR_MODEL=<prefix>:<model id>`.
 * They run in JSON mode (the schema is spelled out in the prompt), the same way for all three.
 */
export const PROVIDERS = {
  groq: { baseURL: 'https://api.groq.com/openai/v1', keyVar: 'GROQ_API_KEY' },
  openrouter: { baseURL: 'https://openrouter.ai/api/v1', keyVar: 'OPENROUTER_API_KEY' },
  gemini: { baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai', keyVar: 'GEMINI_API_KEY' },
} as const;
type ProviderName = keyof typeof PROVIDERS;

/** `groq:qwen/…` → { provider: 'groq', modelId: 'qwen/…' }; anything else is a Vercel AI Gateway id. */
export function parseModel(spec: string): { provider: ProviderName; modelId: string } | { provider: 'gateway'; modelId: string } {
  const i = spec.indexOf(':');
  const prefix = i > 0 ? spec.slice(0, i) : '';
  return prefix in PROVIDERS ? { provider: prefix as ProviderName, modelId: spec.slice(i + 1) } : { provider: 'gateway', modelId: spec };
}

function hasAuth(spec: string, env: Env): boolean {
  const p = parseModel(spec);
  return p.provider === 'gateway' ? Boolean(env.AI_GATEWAY_API_KEY || env.VERCEL_OIDC_TOKEN) : Boolean(env[PROVIDERS[p.provider].keyVar]);
}

function languageModel(spec: string, env: Env): LanguageModel {
  const p = parseModel(spec);
  if (p.provider === 'gateway') return p.modelId; // 'provider/model' string → Vercel AI Gateway
  const { baseURL, keyVar } = PROVIDERS[p.provider];
  return createOpenAICompatible({ name: p.provider, baseURL, apiKey: env[keyVar] })(p.modelId);
}

/** An LLM call for one model spec, or null without the matching key. */
export function llmFor(spec: string, env: Env = process.env): LlmFn | null {
  if (!spec || !hasAuth(spec, env)) return null;
  const model = languageModel(spec, env);
  return async (system, prompt, signal) => {
    const { output } = await generateText({
      model,
      system,
      prompt,
      output: Output.object({ schema: FeedbackSchema }),
      // Bounds the cost of any single call (a reply is ~150 tokens; room left for models that reason first).
      maxOutputTokens: 1024,
      abortSignal: signal,
    });
    return output;
  };
}

/** The configured tutor models, in the order they are tried: `TUTOR_MODEL`, then `TUTOR_FALLBACK_MODEL`. Each needs its key. */
export function tutorModels(env: Env = process.env): string[] {
  return [env.TUTOR_MODEL, env.TUTOR_FALLBACK_MODEL].filter((m): m is string => Boolean(m) && hasAuth(m!, env));
}

/** The tutors to try, in order. Empty when no LLM is configured (→ mock tutor). */
export function tutorsFromEnv(env: Env = process.env): Tutor[] {
  return tutorModels(env).map((model) => ({ model, llm: llmFor(model, env)! }));
}

/** Drop ids the model invented, so logs only contain ids from the mission content. */
export function sanitize(fb: Feedback, m: ExplainTask): Feedback {
  return {
    ...fb,
    rubricHits: fb.rubricHits.filter((id) => m.rubric.some((r) => r.id === id)),
    misconceptionId: m.misconceptions.some((c) => c.id === fb.misconceptionId) ? fb.misconceptionId : null,
  };
}

/**
 * "key" in its everyday sense ("the key constraint") is not the attention key, but the guard below cannot
 * tell them apart, and models write it often. Before the formula step it becomes "main".
 */
const EVERYDAY_KEY = /\bkey(?= (?:constraints?|ideas?|points?|differences?|insights?|steps?|parts?|factors?|things?|rules?|observations?|details?|reasons?|takeaways?|issues?)\b)/gi;
export const plainKey = (s: string) => s.replace(EVERYDAY_KEY, (k) => (k[0] === 'K' ? 'Main' : 'main'));

/** Formula vocabulary withheld until the formula step (the tutor never gives the formula away). */
export const FORMULA = /softmax|exponent|\bexp\b|dot product|\bquer(y|ies)\b|\bkeys?\b|\bvalue vectors?\b|√|sqrt|square root|\bd_?k\b|dₖ/i;

function withTimeout<T>(p: Promise<T>, ms: number, ctrl: AbortController): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      ctrl.abort();
      reject(new Error(`tutor timed out after ${ms} ms`));
    }, ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

/** One LLM reply, checked. Throws with the reason when the reply cannot be shown to a learner. */
export async function tryLlm(req: FeedbackRequest, llm: LlmFn, timeoutMs = 10_000): Promise<Feedback> {
  const mission = EXPLAIN_TASKS[req.missionId];
  const ctrl = new AbortController();
  const raw = await withTimeout(llm(systemPrompt(mission, req.mode), buildUserPrompt(mission, req), ctrl.signal), timeoutMs, ctrl);
  const fb = sanitize(FeedbackSchema.parse(raw), mission);
  if (req.mode === 'formative' && !fb.question?.trim()) throw new Error('formative reply without a question');
  // A closing reply ends the task: a question there could not be acted on, so it is dropped.
  let out = req.mode === 'closing' ? { ...fb, question: null } : fb;
  if (!mission.formulaTaught) out = { ...out, correct: plainKey(out.correct), missing: plainKey(out.missing), question: out.question && plainKey(out.question) };
  const leak = mission.formulaTaught ? undefined : [out.correct, out.missing, out.question ?? ''].find((s) => FORMULA.test(s));
  if (leak) throw new Error(`LLM reply mentions the formula ("${leak.match(FORMULA)![0]}" in: ${leak})`);
  return out;
}

/** Below this much time left, a backup model has no realistic chance to answer: skip it. */
const MIN_TRY_MS = 2_000;

/**
 * Tries each tutor in order within one time budget (the learner waits at most `timeoutMs`),
 * then falls back to the mock tutor. `model` says who answered.
 */
export async function getFeedback(req: FeedbackRequest, tutors: Tutor[], timeoutMs = 12_000): Promise<FeedbackResponse> {
  const start = Date.now();
  for (const [i, { model, llm }] of tutors.entries()) {
    const left = timeoutMs - (Date.now() - start);
    if (i > 0 && left < MIN_TRY_MS) break;
    try {
      const fb = await tryLlm(req, llm, left);
      return { ...fb, mode: req.mode, source: 'llm', model, latencyMs: Date.now() - start };
    } catch (err) {
      console.error(`[tutor] ${model} failed:`, err);
    }
  }
  const mission = EXPLAIN_TASKS[req.missionId];
  return { ...mockFeedback(mission, req.explanation, req.parts, req.mode), mode: req.mode, source: 'mock', model: null, latencyMs: Date.now() - start };
}
