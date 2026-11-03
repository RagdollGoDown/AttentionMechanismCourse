/**
 * Tutor model comparison. Every synthetic explanation × model × mode goes through the real
 * pipeline (`tryLlm`: same prompt, same checks as the app), then a report is written to eval/.
 *
 *   COMPARE_MODELS="groq:<id>,openrouter:<id>,gemini:<id>" npm run compare
 *
 * Keys come from .env.local (GROQ_API_KEY, OPENROUTER_API_KEY, GEMINI_API_KEY).
 * `npm run compare:models` lists the model ids each key can use.
 */
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { FeedbackRequestSchema, MODES, type Feedback, type Mode } from '@/lib/tutor/schema';
import { llmFor, parseModel, tryLlm } from '@/lib/tutor/getFeedback';
import { CASES, type EvalCase } from './explanations';

/** The app gives up after 10 s; here we wait longer to see how slow a model really is. */
const APP_TIMEOUT_MS = 10_000;
const WAIT_MS = 30_000;
/** Pause between calls to one model, to stay under free-tier rate limits (e.g. 20 requests/min). */
const DELAY_MS = Number(process.env.COMPARE_DELAY_MS ?? 4_500);
/** COMPARE_LIMIT=1 runs only the first case: a cheap smoke test before spending the free quotas. */
const CASES_RUN = CASES.slice(0, Number(process.env.COMPARE_LIMIT) || CASES.length);

interface Result {
  model: string;
  caseId: string;
  mode: Mode;
  ms: number;
  reply?: Feedback;
  /** Why the app would have fallen back to the offline tutor. */
  failure?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function failureKind(err: unknown): string {
  const msg = String(err instanceof Error ? err.message : err);
  if (/timed out/.test(msg)) return 'timeout';
  if (/formula/.test(msg)) return 'formula leak';
  if (/without a question/.test(msg)) return 'no question';
  if (/429|rate|quota|exhausted|too many requests/i.test(msg)) return 'rate limit';
  if (/ZodError|parse|JSON|schema|No object|did not match/i.test(msg) || (err as Error)?.name?.includes('Zod')) return 'invalid reply';
  return `error: ${msg.slice(0, 80)}`;
}

async function runModel(model: string): Promise<Result[]> {
  const llm = llmFor(model);
  if (!llm) {
    const p = parseModel(model);
    throw new Error(`No key for ${model} (${p.provider === 'gateway' ? 'AI_GATEWAY_API_KEY' : `${p.provider.toUpperCase()}_API_KEY`} missing in .env.local)`);
  }
  const out: Result[] = [];
  for (const c of CASES_RUN) {
    // Two contexts has a single reply, always a closing one.
    for (const mode of c.missionId === 'contrast' ? (['closing'] as const) : MODES) {
      const req = FeedbackRequestSchema.parse({ missionId: c.missionId, explanation: c.explanation, parts: c.parts, prediction: c.prediction, round: 1, mode });
      const start = Date.now();
      try {
        const reply = await tryLlm(req, llm, WAIT_MS);
        const ms = Date.now() - start;
        out.push({ model, caseId: c.id, mode, ms, reply, failure: ms > APP_TIMEOUT_MS ? 'timeout' : undefined });
      } catch (err) {
        out.push({ model, caseId: c.id, mode, ms: Date.now() - start, failure: failureKind(err) });
      }
      process.stdout.write(out.at(-1)!.failure ? 'x' : '.');
      await sleep(DELAY_MS);
    }
  }
  return out;
}

const pct = (n: number, d: number) => (d ? `${Math.round((100 * n) / d)} %` : '–');
const median = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : NaN);
const esc = (s: string | null | undefined) => (s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

function summary(model: string, rs: Result[]): string {
  const ok = rs.filter((r) => !r.failure && r.reply);
  const failures = Object.entries(rs.reduce<Record<string, number>>((acc, r) => (r.failure ? { ...acc, [r.failure]: (acc[r.failure] ?? 0) + 1 } : acc), {}))
    .map(([k, n]) => `${k} ×${n}`).join(', ') || 'none';
  // Detection quality on usable replies: did the tutor see the ideas and misconceptions we put in?
  const byId = new Map(CASES.map((c) => [c.id, c]));
  let expected = 0, found = 0, extra = 0, misc = 0;
  for (const r of ok) {
    const c = byId.get(r.caseId)!;
    expected += c.hits.length;
    found += r.reply!.rubricHits.filter((h) => c.hits.includes(h)).length;
    extra += r.reply!.rubricHits.filter((h) => !c.hits.includes(h)).length;
    if (r.reply!.misconceptionId === c.misconception) misc++;
  }
  const ms = rs.filter((r) => !r.failure || r.failure === 'timeout').map((r) => r.ms);
  return `| ${model} | ${pct(ok.length, rs.length)} (${ok.length}/${rs.length}) | ${failures} | ${median(ms) || '–'} ms | ${Math.max(0, ...ms)} ms | ${pct(found, expected)} | ${extra} | ${pct(misc, ok.length)} |`;
}

function details(c: EvalCase, rs: Result[]): string {
  const input = c.parts ? c.explanation!.replace(/\n/g, ' · ') : c.explanation!;
  const rows = rs.map((r) => r.failure && !r.reply
    ? `| ${r.model} | ${r.mode} | **${r.failure}** | | | | ${r.ms} |`
    : `| ${r.model} | ${r.mode}${r.failure ? ` (**${r.failure}**)` : ''} | ${esc(r.reply!.correct)} | ${esc(r.reply!.missing)} | ${esc(r.reply!.question)} | ${r.reply!.rubricHits.join(', ') || '–'} / ${r.reply!.misconceptionId ?? '–'} | ${r.ms} |`);
  return [
    `### ${c.id}: ${c.label}`,
    `> ${esc(input)}`,
    ``,
    `Expected: ideas ${c.hits.join(', ') || '–'} / misconception ${c.misconception ?? '–'}`,
    ``,
    `| Model | Mode | correct | missing | question | ideas / misconception | ms |`,
    `|---|---|---|---|---|---|---|`,
    ...rows,
  ].join('\n');
}

it('compares tutor models', async () => {
  const models = (process.env.COMPARE_MODELS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!models.length) throw new Error('Set COMPARE_MODELS, e.g. COMPARE_MODELS="groq:<id>,openrouter:<id>,gemini:<id>". Ids: npm run compare:models');
  // Models run in parallel; the calls to one model run one after the other.
  const results = (await Promise.all(models.map(runModel))).flat();

  const date = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', 'h');
  const report = [
    `# Tutor model comparison, ${date}`,
    ``,
    `${CASES_RUN.length} synthetic explanations, each in the modes the app uses (two contexts: closing only; the others: formative and closing), through the app's own prompt and checks.`,
    `A reply is **usable** when the app would show it: valid JSON, a question in formative mode, no formula word before the formula step, under 10 s.`,
    `"Ideas found" = expected rubric ideas the tutor credited; "extra" = ideas it credited that were not there; "misconception" = same verdict as expected (including "none").`,
    ``,
    `| Model | Usable | Fallbacks (why) | Median | Max | Ideas found | Extra ideas | Misconception right |`,
    `|---|---|---|---|---|---|---|---|`,
    ...models.map((m) => summary(m, results.filter((r) => r.model === m))),
    ``,
    `## Replies, for the team to rate`,
    `Rate each usable reply: does "missing" target the right gap? Does the formative question send the learner somewhere useful without giving the answer? Does the closing reply leave them with the right idea?`,
    ``,
    ...CASES_RUN.map((c) => details(c, results.filter((r) => r.caseId === c.id))),
    ``,
  ].join('\n');
  const file = `eval/report-${date}.md`;
  writeFileSync(file, report);
  writeFileSync(file.replace(/\.md$/, '.json'), JSON.stringify(results, null, 2));
  console.log(`\n\n${report.split('## Replies')[0]}\nFull report: web/${file}`);
});
