import { generateText, Output } from 'ai';
import { TUTOR_MISSIONS, type TutorMission } from '@/content/missions';
import { mockFeedback } from '@/lib/tutor/mock';
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/tutor/prompt';
import { FeedbackSchema, type Feedback, type FeedbackRequest, type FeedbackResponse } from '@/lib/tutor/schema';

export type LlmFn = (system: string, prompt: string, signal: AbortSignal) => Promise<unknown>;

function gatewayLlm(model: string): LlmFn {
  return async (system, prompt, signal) => {
    const { output } = await generateText({
      model, // 'provider/model' string → routed through the Vercel AI Gateway
      system,
      prompt,
      output: Output.object({ schema: FeedbackSchema }),
      abortSignal: signal,
    });
    return output;
  };
}

/** The real tutor if a model and gateway auth are configured, else null (→ mock tutor). */
export function llmFromEnv(env: Record<string, string | undefined> = process.env): LlmFn | null {
  const model = env.TUTOR_MODEL;
  const hasAuth = Boolean(env.AI_GATEWAY_API_KEY || env.VERCEL_OIDC_TOKEN);
  return model && hasAuth ? gatewayLlm(model) : null;
}

/** Drop ids the model invented, so logs only contain ids from the mission content. */
export function sanitize(fb: Feedback, m: TutorMission): Feedback {
  return {
    ...fb,
    rubricHits: fb.rubricHits.filter((id) => m.rubric.some((r) => r.id === id)),
    misconceptionId: m.misconceptions.some((c) => c.id === fb.misconceptionId) ? fb.misconceptionId : null,
  };
}

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

export async function getFeedback(req: FeedbackRequest, llm: LlmFn | null, timeoutMs = 10_000): Promise<FeedbackResponse> {
  const mission = TUTOR_MISSIONS[req.missionId];
  const start = Date.now();
  if (llm) {
    try {
      const ctrl = new AbortController();
      const raw = await withTimeout(llm(SYSTEM_PROMPT, buildUserPrompt(mission, req), ctrl.signal), timeoutMs, ctrl);
      const fb = sanitize(FeedbackSchema.parse(raw), mission);
      return { ...fb, source: 'llm', latencyMs: Date.now() - start };
    } catch (err) {
      console.error('[tutor] LLM failed, using mock tutor:', err);
    }
  }
  return { ...mockFeedback(mission, req.explanation), source: 'mock', latencyMs: Date.now() - start };
}
